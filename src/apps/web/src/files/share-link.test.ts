// The share link's format (R-WEB-05, ADR-0043): round trip, the version prefix, and input from
// anyone: cut, changed, too long, or a small link that unpacks to too much.

import { createDoc, parseModel, serializeModelJson } from '@ariadne-nsd/core';
import { describe, expect, it } from 'vitest';

import type { Deflate } from './share-link';
import {
  browserDeflate,
  fromBase64Url,
  isShareLink,
  maxShareLinkLength,
  maxUnpackedBytes,
  readShareLink,
  shareLinkPrefix,
  shareLinkUrl,
  toBase64Url,
  writeShareLink,
} from './share-link';

const deflate = browserDeflate();
const doc = createDoc();
const model = serializeModelJson(doc);

function mustDeflate(): Deflate {
  if (deflate === null) {
    throw new Error('Node has CompressionStream');
  }
  return deflate;
}

describe('share link format', () => {
  it('T-0910: reads back the name and the model it was written with, packed with deflate-raw', async () => {
    const fragment = await writeShareLink(model, 'Quicksort.ns.svg', deflate);
    expect(fragment.startsWith('ns1.d.')).toBe(true);
    expect(fragment).toMatch(/^ns1\.d\.[A-Za-z0-9_-]+$/);
    const read = await readShareLink(fragment, deflate);
    expect(read).toMatchObject({ ok: true, name: 'Quicksort.ns.svg' });
    if (!read.ok) {
      return;
    }
    const parsed = parseModel(read.model);
    expect(parsed.ok && serializeModelJson(parsed.value.doc)).toBe(model);
  });

  it('T-0911: without CompressionStream, writes the JSON unpacked and still reads it back', async () => {
    const fragment = await writeShareLink(model, 'Plain.ns.svg', null);
    expect(fragment.startsWith('ns1.j.')).toBe(true);
    expect(await readShareLink(fragment, null)).toMatchObject({ ok: true, name: 'Plain.ns.svg' });
    expect(await readShareLink(fragment, deflate)).toMatchObject({ ok: true });
  });

  it('T-0912: is shorter packed than unpacked, and keeps non-Latin text', async () => {
    const packed = await writeShareLink(model, '정렬.ns.svg', deflate);
    const plain = await writeShareLink(model, '정렬.ns.svg', null);
    expect(packed.length).toBeLessThan(plain.length);
    expect(await readShareLink(packed, deflate)).toMatchObject({ name: '정렬.ns.svg' });
  });

  it('T-0913: tells a share link of another version from a fragment that is not a share link', async () => {
    expect(isShareLink('ns1.d.abc')).toBe(true);
    expect(isShareLink('ns2.x.abc')).toBe(true);
    expect(isShareLink('section-2')).toBe(false);
    expect(isShareLink('')).toBe(false);
    expect(await readShareLink('section-2', deflate)).toMatchObject({
      ok: false,
      reason: 'notShareLink',
    });
    expect(await readShareLink('ns2.d.abc', deflate)).toMatchObject({
      ok: false,
      reason: 'newerVersion',
    });
  });

  it('T-0914: refuses a link longer than the limit before unpacking it', async () => {
    const fragment = `${shareLinkPrefix}j.${'A'.repeat(maxShareLinkLength)}`;
    expect(await readShareLink(fragment, deflate)).toMatchObject({
      ok: false,
      reason: 'tooLarge',
    });
  });

  it('T-0915: stops unpacking as soon as the output passes the limit (zip bomb)', async () => {
    // A small packed input that unpacks to 4 MB; the limit here is 64 KB to keep the test quick.
    const bomb = await mustDeflate().compress(new Uint8Array(4 * 1024 * 1024));
    expect(bomb.length).toBeLessThan(16 * 1024);
    expect(await mustDeflate().decompress(bomb, 64 * 1024)).toBeNull();
    expect(await mustDeflate().decompress(bomb, 4 * 1024 * 1024)).toHaveLength(4 * 1024 * 1024);
  });

  it('T-0916: refuses a link that unpacks to more than the limit', async () => {
    const limits: number[] = [];
    const capped: Deflate = {
      compress: (bytes) => Promise.resolve(bytes),
      decompress: (_bytes, limit) => {
        limits.push(limit);
        return Promise.resolve(null);
      },
    };
    expect(await readShareLink(`${shareLinkPrefix}d.AAAA`, capped)).toMatchObject({
      ok: false,
      reason: 'tooLarge',
    });
    expect(limits).toEqual([maxUnpackedBytes]);
  });

  it('T-0917: says a cut or changed link is damaged', async () => {
    const fragment = await writeShareLink(model, 'Cut.ns.svg', deflate);
    const cases = [
      fragment.slice(0, Math.floor(fragment.length / 2)),
      `${fragment.slice(0, 10)}!${fragment.slice(11)}`,
      `${shareLinkPrefix}x.${fragment.slice(6)}`,
      `${shareLinkPrefix}d.`,
      `${shareLinkPrefix}d.A`,
    ];
    for (const damaged of cases) {
      expect(await readShareLink(damaged, deflate)).toMatchObject({
        ok: false,
        reason: 'damaged',
      });
    }
  });

  it('T-0918: says a link whose JSON is not the envelope of a name and a model is damaged', async () => {
    const pack = (value: string) =>
      `${shareLinkPrefix}j.${toBase64Url(new TextEncoder().encode(value))}`;
    for (const json of [
      'not json',
      '[1]',
      'null',
      '{"name":"a"}',
      '{"name":1,"model":{}}',
      '{"name":"a","model":{},"extra":1}',
    ]) {
      expect(await readShareLink(pack(json), deflate)).toMatchObject({
        ok: false,
        reason: 'damaged',
      });
    }
    // Bytes that are not UTF-8.
    const notUtf8 = `${shareLinkPrefix}j.${toBase64Url(new Uint8Array([0xff, 0xfe, 0x7b]))}`;
    expect(await readShareLink(notUtf8, deflate)).toMatchObject({ reason: 'damaged' });
  });

  it('T-0919: says a packed link cannot be opened by a browser without DecompressionStream', async () => {
    const fragment = await writeShareLink(model, 'Packed.ns.svg', deflate);
    expect(await readShareLink(fragment, null)).toMatchObject({
      ok: false,
      reason: 'unsupported',
    });
  });

  it('T-0920: says a link whose packed bytes do not unpack is damaged', async () => {
    const broken: Deflate = {
      compress: (bytes) => Promise.resolve(bytes),
      decompress: () => Promise.reject(new Error('invalid block type')),
    };
    expect(await readShareLink(`${shareLinkPrefix}d.AAAA`, broken)).toMatchObject({
      ok: false,
      reason: 'damaged',
    });
  });

  it('T-0921: puts the fragment after the page address, without the query', () => {
    expect(shareLinkUrl({ origin: 'https://ariadnensd.com', pathname: '/' }, 'ns1.d.abc')).toBe(
      'https://ariadnensd.com/#ns1.d.abc',
    );
  });

  it('T-0922: base64url round trips any bytes and refuses other letters', () => {
    const bytes = new Uint8Array(70_000).map((_, index) => (index * 31) % 256);
    expect(fromBase64Url(toBase64Url(bytes))).toEqual(bytes);
    expect(toBase64Url(new Uint8Array([0xfb, 0xff]))).toBe('-_8');
    expect(fromBase64Url('-_8=')).toEqual(new Uint8Array([0xfb, 0xff]));
    expect(fromBase64Url('a+b/')).toBeNull();
    expect(fromBase64Url('abcde')).toBeNull();
    expect(fromBase64Url('')).toEqual(new Uint8Array());
  });
});
