// @vitest-environment happy-dom
// What the editor gives the shell's exports and what it tells on opening: the pure SVG
// (R-EXP-02), the rendering for print and PDF (R-EXP-03), the drawing check (R-FMT-09) and the
// document setting "text as outlines" (R-FMT-10).
import type { Glyph, GlyphOutlines } from '@ariadne-nsd/fonts';
import { openSvgFile } from '@ariadne-nsd/core';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { EditorHandle, OpenedDocument, SaveFonts } from './contracts';
import { createEditor, documentSettingIds } from './create-editor';
import { memoryClipboard, memorySettings, memoryStore } from './engine-test-support';

/** Every character is one square glyph, so all text can be outlines. */
const square: Glyph = {
  advance: 500,
  commands: [
    { kind: 'move', x: 0, y: 0 },
    { kind: 'line', x: 400, y: 0 },
    { kind: 'line', x: 400, y: 700 },
    { kind: 'close' },
  ],
};
const outlines: GlyphOutlines = {
  unitsPerEm: 1000,
  glyphOf: (codePoint) => (codePoint === 0x6f22 ? null : square),
  notdef: square,
};
vi.mock('./save/glyph-outlines', () => ({ readGlyphOutlines: () => outlines }));

const subsetCalls: number[][] = [];
const fakeFonts: SaveFonts = () =>
  Promise.resolve({
    subsetter: {
      subsetTtf: (ttf) => ttf,
      subsetToWoff: (_ttf, codePoints) => {
        subsetCalls.push([...codePoints]);
        return new Uint8Array([119, 79, 70, 70]);
      },
    },
    ttf: new Uint8Array([0]),
  });

const handles: EditorHandle[] = [];

function make(doc: Partial<OpenedDocument> = {}, store = memoryStore()) {
  const host = document.createElement('div');
  document.body.append(host);
  const handle = createEditor({
    host,
    settings: memorySettings(),
    appearance: { scheme: 'light', uiFont: 'sans-serif' },
    doc: { store, text: null, ...doc },
    fonts: fakeFonts,
    clipboard: memoryClipboard(),
  });
  handles.push(handle);
  return { handle, store };
}

afterEach(() => {
  for (const handle of handles.splice(0)) {
    handle.dispose();
  }
  subsetCalls.length = 0;
  document.body.innerHTML = '';
});

describe('pure SVG export (R-EXP-02)', () => {
  it('is the saved file without the model: the same drawing and font', async () => {
    const { handle } = make();
    handle.commands.run('block.insert.if');
    const file = await handle.serialize();
    const image = await handle.serializeImage();
    expect(image).not.toContain('<metadata>');
    expect(image).not.toContain('ans:document');
    expect(image).toContain('@font-face');
    expect(openSvgFile(image)).toMatchObject({ ok: false, reason: 'noModel' });
    expect(file.replace(/\n {2}<metadata>[\s\S]*<\/metadata>/, '')).toBe(image);
  });

  it('gives the shell the rendering it shows, for print and PDF (R-EXP-03)', () => {
    const { handle } = make();
    handle.commands.run('block.insert.while');
    const rendering = handle.rendering();
    expect(rendering.layout.nodes.some((node) => node.kind === 'loop')).toBe(true);
    expect(rendering.svg.content.startsWith('<g class="ans-render"')).toBe(true);
  });
});

describe('text as outlines (R-FMT-10)', () => {
  it('is a document setting, off by default, that an undo turns back', () => {
    const { handle } = make();
    const spec = handle.settingsSchema.list().find((item) => item.id === 'document.textOutlines');
    expect(spec).toMatchObject({ scope: 'document', values: [false, true], defaultValue: false });
    expect(handle.documentSetting(documentSettingIds.textOutlines)).toBe(false);
    handle.setDocumentSetting(documentSettingIds.textOutlines, true);
    expect(handle.documentSetting(documentSettingIds.textOutlines)).toBe(true);
    expect(handle.status().dirty).toBe(true);
    handle.commands.run('edit.undo');
    expect(handle.documentSetting(documentSettingIds.textOutlines)).toBe(false);
  });

  it('saves the text as paths and keeps it in the model', async () => {
    const { handle, store } = make();
    handle.commands.run('block.insert.if');
    handle.setDocumentSetting(documentSettingIds.textOutlines, true);
    await handle.save();
    const written = store.written.at(-1) ?? '';
    expect(written).not.toContain('<text');
    expect(written).toContain('"textOutlines": true');
    // Every character is in the font: no subset font is left to embed.
    expect(written).not.toContain('@font-face');
    expect(subsetCalls).toEqual([]);
    const reopened = openSvgFile(written);
    expect(reopened.ok && reopened.value.doc.content.settings.textOutlines).toBe(true);
  });

  it('turned off again, saves text and no setting key', async () => {
    const { handle, store } = make();
    handle.setDocumentSetting(documentSettingIds.textOutlines, true);
    handle.setDocumentSetting(documentSettingIds.textOutlines, false);
    await handle.save();
    const written = store.written.at(-1) ?? '';
    expect(written).not.toContain('textOutlines');
    expect(written).toContain('@font-face');
  });

  it('refuses a value that is not true or false', () => {
    const { handle } = make();
    handle.setDocumentSetting(documentSettingIds.textOutlines, 'yes');
    expect(handle.status().dirty).toBe(false);
  });
});

describe('a drawing changed by another tool (R-FMT-09)', () => {
  async function savedText(): Promise<string> {
    const { handle } = make();
    handle.commands.run('block.insert.if');
    return handle.serialize();
  }

  it('is told when the file opens, with its name', async () => {
    const edited = (await savedText()).replace(
      '<rect width="100%"',
      '<rect opacity="0.5" width="100%"',
    );
    const { handle } = make({ text: edited, store: memoryStore('drawn.ns.svg') });
    expect(handle.chromeState().notice).toMatchObject({
      message: { key: 'notice.drawingEdited', params: { name: 'drawn.ns.svg' } },
      level: 'warn',
    });
  });

  it('is told when such a file replaces the open document', async () => {
    const edited = (await savedText()).replace('</svg>', '<circle r="2"/></svg>');
    const { handle } = make();
    expect(handle.open({ store: memoryStore('other.ns.svg'), text: edited })).toBe(true);
    expect(handle.chromeState().notice).toMatchObject({
      message: { key: 'notice.drawingEdited', params: { name: 'other.ns.svg' } },
    });
  });

  it('is not told for a file as the app saved it', async () => {
    const { handle } = make({ text: await savedText() });
    expect(handle.chromeState().notice).toBeNull();
    expect(handle.open({ store: memoryStore(), text: await savedText() })).toBe(true);
    expect(handle.chromeState().notice).toBeNull();
  });
});
