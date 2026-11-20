// Recognizing an AriadneNSD document in pasted text (R-WEB-11, UX JP1): the model JSON with or
// without a code fence, the envelope of a share link, a share link of this site, and one a chat
// app wrapped in a search page. Any other text, JSON included, is not a document.

import { createDoc, serializeModelJson } from '@ariadne-nsd/core';
import { describe, expect, it } from 'vitest';

import { readPastedDocument, recognizePastedDocument } from './pasted-document';

const model = serializeModelJson(createDoc());
const envelope = JSON.stringify({ name: 'Sort.ns.svg', model: JSON.parse(model) as unknown });
const page = { origin: 'http://localhost:5173', pathname: '/' };

describe('pasted documents', () => {
  it('T-1405 · R-WEB-11 · UX JP1: the model JSON, with spaces or a code fence around it, is a document', () => {
    expect(recognizePastedDocument(model)).toEqual({
      kind: 'model',
      model: JSON.parse(model) as unknown,
    });
    expect(recognizePastedDocument(`\n  ${model}\n\n`)?.kind).toBe('model');
    expect(recognizePastedDocument(`\`\`\`json\n${model}\n\`\`\``)?.kind).toBe('model');
    expect(recognizePastedDocument(`  \`\`\`\n${model}\n\`\`\`\n`)?.kind).toBe('model');
  });

  it('T-1406 · R-WEB-11 · UX JP1: the envelope of a share link is a document with its name', () => {
    expect(recognizePastedDocument(envelope)).toEqual({
      kind: 'envelope',
      name: 'Sort.ns.svg',
      model: JSON.parse(model) as unknown,
    });
    // Like what ChatGPT gave on 2026-11-10: indented, with a Korean name.
    const chatgpt = JSON.stringify(
      { name: '하노이탑.ns.svg', model: JSON.parse(model) as unknown },
      null,
      2,
    );
    expect(recognizePastedDocument(chatgpt)).toMatchObject({
      kind: 'envelope',
      name: '하노이탑.ns.svg',
    });
  });

  it('T-1407 · R-WEB-11 · UX JP1: a share link of the site or of this page is a document', () => {
    expect(recognizePastedDocument('https://ariadnensd.com/#ns1.d.abc')).toEqual({
      kind: 'link',
      fragment: 'ns1.d.abc',
    });
    expect(recognizePastedDocument(' https://ariadnensd.com/#ns1.u.%7B%7D \n')).toEqual({
      kind: 'link',
      fragment: 'ns1.u.%7B%7D',
    });
    expect(recognizePastedDocument('http://localhost:5173/#ns1.j.e30', page)).toEqual({
      kind: 'link',
      fragment: 'ns1.j.e30',
    });
    // Another page's links, and this page's address without a link, are not.
    expect(recognizePastedDocument('http://localhost:5173/#ns1.j.e30')).toBeNull();
    expect(recognizePastedDocument('https://ariadnensd.com/', page)).toBeNull();
    expect(recognizePastedDocument('https://example.com/#ns1.d.abc', page)).toBeNull();
  });

  it('T-1408 · R-WEB-11 · UX JP1: a link a chat app wrapped in a Google search is taken out of it', () => {
    // The shape of what Gemini gave on 2026-11-10: the link as the search words, its `#` and `%`
    // encoded once more.
    const gemini = `https://www.google.com/search?q=https://ariadnensd.com/%23ns1.u.${encodeURIComponent(encodeURIComponent(envelope))}`;
    const pasted = recognizePastedDocument(gemini);
    expect(pasted?.kind).toBe('link');
    expect(
      pasted?.kind === 'link' && pasted.fragment === `ns1.u.${encodeURIComponent(envelope)}`,
    ).toBe(true);
    expect(
      recognizePastedDocument(
        `https://google.com/search?hl=en&q=${encodeURIComponent('https://ariadnensd.com/#ns1.d.x')}`,
      ),
    ).toEqual({ kind: 'link', fragment: 'ns1.d.x' });
    // A search for anything else is not a document.
    expect(recognizePastedDocument('https://www.google.com/search?q=bubble+sort')).toBeNull();
    expect(recognizePastedDocument('https://www.google.com/search?hl=en')).toBeNull();
  });

  it('T-1409 · R-WEB-11 · UX JP1: other text is not a document: prose, other JSON, a JSON fragment, a link in a sentence', () => {
    for (const text of [
      '',
      'i = 0\nfor j = 0 to n - 2',
      'The diagram has "format": "ariadne-nsd" in it.',
      '{"name":"package","version":"1.0.0"}',
      '{"format":"other","version":1}',
      '["ariadne-nsd"]',
      `{"id":"b1","kind":"process","text":"x = 0"}`,
      `{"name":"x.ns.svg","model":{"format":"other"}}`,
      `{"name":"x.ns.svg","model":${model},"extra":1}`,
      `{"name":1,"model":${model}}`,
      `Here it is: ${model}`,
      `${model}\n\nOpen it in the app.`,
      `Open https://ariadnensd.com/#ns1.d.abc`,
      '```json\n{"a":1}\n```',
      model.trim().slice(0, -1),
    ]) {
      expect(recognizePastedDocument(text)).toBeNull();
    }
  });

  it('T-1410 · R-WEB-11 · UX JP3: says why a text is not a document, with the brackets of JSON that does not read', () => {
    expect(readPastedDocument('hello')).toEqual({
      ok: false,
      detail: 'the text is neither the model JSON nor a share link',
    });
    expect(readPastedDocument('{"a":1}')).toEqual({
      ok: false,
      detail: 'the JSON has no "format": "ariadne-nsd"',
    });
    const cut = readPastedDocument(model.trim().slice(0, -1));
    expect(cut.ok).toBe(false);
    expect(!cut.ok && cut.detail).toMatch(
      /^the JSON does not read: .*; it has \d+ "\{" but \d+ "\}"$/,
    );
  });
});
