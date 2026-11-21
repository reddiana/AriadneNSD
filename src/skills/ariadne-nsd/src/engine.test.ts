// The skill's script makes what the app makes (R-SKILL-01): a saved file the app's parser opens to
// the same document, and a share link the web shell reads back to the same model. Every packing of
// a link (u, j, d) and a saved file read back as the model.
import type { LoadedDoc } from '@ariadne-nsd/core';
import {
  assembleSvgFile,
  checkDrawing,
  openSvgFile,
  parseModelJson,
  renderDoc,
  savedDrawing,
} from '@ariadne-nsd/core';
import { blockFont } from '@ariadne-nsd/fonts';
import {
  browserDeflate,
  readShareLink,
  toBase64Url,
  writeShareLink,
} from '@ariadne-nsd/web/share-link';
import { beforeAll, describe, expect, it } from 'vitest';

import type { SaveFonts } from './engine';
import { defaultName, makeLink, modelText, readSource, saveFile, summary } from './engine';
import { maxModel, nodeFonts } from './test-support';

let fonts: SaveFonts;

beforeAll(async () => {
  fonts = await nodeFonts();
});

function loaded(text: string): LoadedDoc {
  const parsed = parseModelJson(text);
  if (!parsed.ok) {
    throw new Error(parsed.detail);
  }
  return parsed.value;
}

async function source(text: string, fileName: string | null = null) {
  const read = await readSource(text, fileName);
  if (!read.ok) {
    throw new Error(`${read.reason}: ${read.detail}`);
  }
  return read;
}

describe('the saved file', () => {
  it('T-1457 · R-SKILL-01: the app’s parser opens it to the same document, and its drawing is the app’s', () => {
    const doc = loaded(maxModel);
    const file = saveFile(doc, fonts);
    const opened = openSvgFile(file);
    expect(opened.ok && opened.value).toEqual(doc);
    expect(checkDrawing(file)).toBe('unchanged');
    // The same steps as the editor's serializeDocument and the golden files.
    const drawn = savedDrawing(renderDoc(doc.doc), null);
    expect(file).toBe(
      assembleSvgFile({
        doc: doc.doc,
        kept: doc.kept,
        drawing: drawn.svg,
        fonts: [
          {
            family: blockFont.familyName,
            woff: fonts.subsetter.subsetToWoff(fonts.ttf, drawn.codePoints),
          },
        ],
      }),
    );
  });

  it('T-1458 · R-SKILL-01 · R-FMT-10: a document with text as outlines is saved with outlines and opens', () => {
    const outlined = JSON.parse(maxModel) as { settings: Record<string, unknown> };
    outlined.settings.textOutlines = true;
    const doc = loaded(JSON.stringify(outlined));
    const file = saveFile(doc, fonts);
    expect(file).not.toContain('<text');
    expect(openSvgFile(file)).toMatchObject({ ok: true });
  });
});

describe('the share link', () => {
  it('T-1459 · R-SKILL-01 · R-WEB-05: is the app’s d link, and the web shell reads it back to the same model', async () => {
    const doc = loaded(maxModel);
    const made = await makeLink(doc, 'max.ns.svg');
    expect(made).toMatchObject({ ok: true, isLong: false });
    const url = made.ok ? made.url : '';
    expect(url.startsWith('https://ariadnensd.com/#ns1.d.')).toBe(true);
    // What the share command makes from the editor's snapshot of the same document.
    const fragment = await writeShareLink(modelText(doc), 'max.ns.svg', browserDeflate());
    expect(url).toBe(`https://ariadnensd.com/#${fragment}`);
    const read = await readShareLink(url.split('#')[1] ?? '', browserDeflate());
    expect(read).toMatchObject({ ok: true, name: 'max.ns.svg' });
    expect(read.ok && read.model).toEqual(JSON.parse(maxModel));
  });

  it('T-1460 · R-SKILL-01: a link made with another base opens that page', async () => {
    const made = await makeLink(loaded(maxModel), 'max.ns.svg', 'http://localhost:5173/app/');
    expect(made.ok && made.url).toMatch(/^http:\/\/localhost:5173\/app\/#ns1\.d\./);
  });
});

describe('reading what the user gives', () => {
  it('T-1461 · R-SKILL-01: reads model JSON, an envelope, every link packing and a saved file to the same model', async () => {
    const expected = modelText(loaded(maxModel));
    const envelope = JSON.stringify({ name: 'max.ns.svg', model: JSON.parse(maxModel) as unknown });
    const bytes = new TextEncoder().encode(envelope);
    const made = await makeLink(loaded(maxModel), 'max.ns.svg');
    const inputs: ReadonlyArray<readonly [string, string | null]> = [
      [maxModel, null],
      [envelope, 'max.ns.svg'],
      [`https://ariadnensd.com/#ns1.u.${encodeURIComponent(envelope)}`, 'max.ns.svg'],
      [`ns1.j.${toBase64Url(bytes)}`, 'max.ns.svg'],
      [made.ok ? made.url : '', 'max.ns.svg'],
      [`${String.fromCharCode(0xfeff)}${saveFile(loaded(maxModel), fonts)}\n`, 'saved.ns.svg'],
    ];
    for (const [input, name] of inputs) {
      const read = await source(input, 'docs/saved.ns.svg');
      expect(modelText(read.loaded), input.slice(0, 30)).toBe(expected);
      expect(read.name, input.slice(0, 30)).toBe(name);
    }
  });

  it('T-1462 · R-SKILL-01: says what is wrong in the parser’s words: the JSON with its brackets, the model with its path, the link with its reason', async () => {
    expect(await readSource(maxModel.slice(0, -2))).toMatchObject({
      ok: false,
      reason: 'notModel',
      detail: expect.stringMatching(/does not parse.*"\{" but .* "\}"/) as unknown,
    });
    const withText = maxModel.replace(
      '"kind":"process","text":"m = a[0]"',
      '"kind":"call","text":"x"',
    );
    expect(await readSource(withText)).toMatchObject({
      ok: false,
      reason: 'damaged',
      detail: expect.stringContaining('diagrams[0].body[0]') as unknown,
    });
    expect(await readSource('https://ariadnensd.com/#ns1.d.!!')).toMatchObject({
      ok: false,
      reason: 'link',
      detail: expect.stringContaining('damaged') as unknown,
    });
    expect(await readSource('<svg xmlns="http://www.w3.org/2000/svg"/>')).toMatchObject({
      ok: false,
      reason: 'noModel',
    });
    expect(await readSource('{"name":3,"model":{}}')).toMatchObject({
      ok: false,
      reason: 'notModel',
    });
  });
});

describe('names and ids', () => {
  it('T-1463 · R-SKILL-01: names a document after its first Method, and counts the next free ids', () => {
    const { content } = loaded(maxModel).doc;
    expect(defaultName(content)).toBe('max.ns.svg');
    expect(
      defaultName({
        ...content,
        diagrams: [{ id: 'd1', head: null, body: { blocks: [], folds: [] } }],
      }),
    ).toBe('diagram.ns.svg');
    expect(summary(content)).toEqual({
      diagrams: 1,
      blocks: 6,
      nextIds: { diagram: 'd2', block: 'b7', branch: 'r3', fold: 'f1' },
    });
  });
});
