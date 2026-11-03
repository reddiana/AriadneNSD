// The "Copy Share Link" command (R-WEB-05): what is copied and what the user is told, for a
// short link, a long one, one too long for a link, and a clipboard that refuses.

import { createDoc, serializeModelJson } from '@ariadne-nsd/core';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { EditorHandle } from '../editor-contract';
import type { ShellMessageKey } from '../shell/messages';
import { shellMessage } from '../shell/messages';
import type { CopyText } from './share-command';
import { browserCopyText, copyShareLink } from './share-command';
import type { Deflate } from './share-link';
import { browserDeflate, readShareLink } from './share-link';

const model = serializeModelJson(createDoc());

/** A deflate that does not compress, so a test can make a link of the length it wants. */
const noDeflate: Deflate = {
  compress: (bytes) => Promise.resolve(bytes),
  decompress: (bytes) => Promise.resolve(bytes),
};

function run(options: {
  snapshot?: () => string;
  copyText?: CopyText;
  deflate?: Deflate | null;
  prompt?: string | null;
}) {
  const notices: string[] = [];
  const logs: string[] = [];
  const copied: string[] = [];
  const prompted: string[] = [];
  const editor = {
    snapshot: options.snapshot ?? (() => model),
    prompt: (message: string, value: string) => {
      prompted.push(`${message} ${value}`);
      return Promise.resolve(options.prompt ?? null);
    },
  } as unknown as EditorHandle;
  const done = copyShareLink(editor, 'Sort.ns.svg', {
    page: { origin: 'https://ariadnensd.com', pathname: '/' },
    deflate: options.deflate === undefined ? browserDeflate() : options.deflate,
    copyText:
      options.copyText ??
      (async (text) => {
        copied.push(await text);
      }),
    notify: (text, level) => notices.push(`${level}: ${text}`),
    text: (key: ShellMessageKey, values?: Readonly<Record<string, string>>) =>
      shellMessage('en', key, values),
    log: (detail) => logs.push(detail),
  });
  return { done, notices, logs, copied, prompted };
}

/** A model JSON whose link is about `length` characters, with text that does not compress. */
function modelOfLinkLength(length: number): string {
  const value = JSON.parse(model) as { diagrams: { body: { text: string }[] }[] };
  const block = value.diagrams[0]?.body[0];
  if (block === undefined) {
    throw new Error('A new document has an empty block');
  }
  // base64 makes 4 letters of 3 bytes.
  block.text = 'x'.repeat(Math.floor((length * 3) / 4));
  return JSON.stringify(value);
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('copy share link command', () => {
  it('T-0902: copies the link to this page with the document in its fragment, and says so', async () => {
    const { done, notices, copied } = run({});
    await done;
    expect(copied).toHaveLength(1);
    const [link] = copied;
    expect(link).toMatch(/^https:\/\/ariadnensd\.com\/#ns1\.d\./);
    const read = await readShareLink(link?.split('#')[1] ?? '', browserDeflate());
    expect(read).toMatchObject({ ok: true, name: 'Sort.ns.svg' });
    expect(notices).toEqual([
      'info: Copied the share link. Anyone with the link can view this diagram.',
    ]);
  });

  it('T-0903: copies a long link with a warning that suggests the file', async () => {
    const { done, notices, copied } = run({
      deflate: noDeflate,
      snapshot: () => modelOfLinkLength(20_000),
    });
    await done;
    expect(copied).toHaveLength(1);
    expect(notices).toHaveLength(1);
    expect(notices[0]).toMatch(/^warn: Copied the share link, but it is long \(\d+\.\d KB\)/);
  });

  it('T-0904: does not copy a link too long for browsers, and says to share the file', async () => {
    const { done, notices, copied } = run({
      deflate: noDeflate,
      snapshot: () => modelOfLinkLength(1_100_000),
    });
    await done;
    expect(copied).toEqual([]);
    expect(notices).toHaveLength(1);
    expect(notices[0]).toMatch(/^warn: This diagram is too large for a link \(\d+\.\d KB\)/);
  });

  it('T-0905: shows the link in a modal to copy by hand when the clipboard refuses', async () => {
    const { done, notices, prompted } = run({
      copyText: async (text) => {
        await text;
        throw new Error('NotAllowedError');
      },
    });
    await done;
    expect(notices).toEqual([]);
    expect(prompted).toHaveLength(1);
    expect(prompted[0]).toMatch(
      /^The clipboard is not available\. Copy this share link: https:\/\/ariadnensd\.com\/#ns1\./,
    );
  });

  it('T-0906: says it failed, and logs why, when the link cannot be made', async () => {
    const { done, notices, logs, copied } = run({ snapshot: () => 'not json' });
    await done;
    expect(copied).toEqual([]);
    expect(notices).toEqual(['warn: Could not make the share link.']);
    expect(logs[0]).toMatch(/^Making the share link failed/);
  });
});

describe('browser clipboard for the share link', () => {
  it('T-0907: writes the text with a clipboard item, so the copy starts within the click', async () => {
    const written: unknown[] = [];
    class FakeItem {
      constructor(readonly items: Record<string, Promise<Blob>>) {}
    }
    vi.stubGlobal('ClipboardItem', FakeItem);
    const clipboard = {
      write: (items: FakeItem[]) => {
        written.push(...items);
        return Promise.resolve();
      },
    } as unknown as Clipboard;
    await browserCopyText(clipboard)(Promise.resolve('https://ariadnensd.com/#ns1.d.x'));
    expect(written).toHaveLength(1);
    const blob = await (written[0] as FakeItem).items['text/plain'];
    expect(await blob?.text()).toBe('https://ariadnensd.com/#ns1.d.x');
  });

  it('T-0908: writes plain text where there is no clipboard item', async () => {
    vi.stubGlobal('ClipboardItem', undefined);
    const texts: string[] = [];
    const clipboard = {
      writeText: (text: string) => {
        texts.push(text);
        return Promise.resolve();
      },
    } as unknown as Clipboard;
    await browserCopyText(clipboard)(Promise.resolve('link'));
    expect(texts).toEqual(['link']);
  });

  it('T-0909: refuses without a clipboard', async () => {
    await expect(browserCopyText(undefined)(Promise.resolve('link'))).rejects.toThrow(
      'No clipboard',
    );
  });
});
