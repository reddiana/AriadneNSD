// @vitest-environment happy-dom
import { openSvgFile } from '@ariadne-nsd/core';
import { afterEach, describe, expect, it } from 'vitest';

import type { EditorHandle, OpenedDocument, SaveFonts } from './contracts';
import { createEditor } from './create-editor';
import { memoryClipboard, memorySettings, memoryStore } from './engine-test-support';

const fakeFonts: SaveFonts = () =>
  Promise.resolve({
    subsetter: {
      subsetTtf: (ttf) => ttf,
      subsetToWoff: () => new Uint8Array([119, 79, 70, 70]),
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
  return { handle, host, store };
}

const tick = () => new Promise((resolve) => setTimeout(resolve, 30));

afterEach(() => {
  for (const handle of handles.splice(0)) {
    handle.dispose();
  }
  document.body.innerHTML = '';
});

describe('the shell contract (03-editor 6, QA-10)', () => {
  it('R-ALL-03: a new document has one empty block, selected, and is not dirty', () => {
    const { handle } = make();
    expect(handle.status()).toEqual({
      name: 'test.ns.svg',
      dirty: false,
      readOnly: false,
      revision: 0,
    });
    expect(handle.state().selection).toMatchObject({ kind: 'blocks', anchor: 'b1' });
    expect(handle.chromeState().selection).toBe('selection.empty');
  });

  it('03-editor 6.2: a change makes the document dirty and tells the shell', () => {
    const { handle } = make();
    const seen: boolean[] = [];
    handle.onStatus((status) => seen.push(status.dirty));
    handle.commands.run('block.insert.while');
    expect(handle.status().dirty).toBe(true);
    expect(handle.status().revision).toBe(1);
    expect(seen).toContain(true);
  });

  it('R-FMT-01: save writes the file with the model inside; reopening gives the same content', async () => {
    const { handle, store } = make();
    handle.commands.run('block.insert.if');
    const result = await handle.save();
    expect(result).toEqual({ ok: true, name: 'test.ns.svg' });
    expect(handle.status().dirty).toBe(false);
    const written = store.written.at(-1) ?? '';
    expect(written).toContain('<ans:document');
    expect(written).toContain('font-family: "AriadneNSD Block"');
    const opened = openSvgFile(written);
    expect(opened.ok && opened.value.doc.content).toEqual(handle.state().doc.content);
    expect(await handle.serialize()).toBe(written);
  });

  it('03-editor 6: WriteResult failures keep the document dirty and say why', async () => {
    const { handle, store } = make();
    handle.commands.run('block.insert.while');
    store.result = { ok: false, reason: 'denied' };
    await handle.save();
    expect(handle.status().dirty).toBe(true);
    expect(handle.chromeState().notice?.message).toBe('notice.saveDenied');
    store.result = { ok: false, reason: 'cancelled' };
    handle.commands.run('select.clear');
    await handle.save();
    expect(handle.status().dirty).toBe(true);
  });

  it('06-web 1: where the original cannot be written, Save is called Download', () => {
    const { handle } = make({}, memoryStore('a.ns.svg', false));
    const save = handle.commands.list().find((spec) => spec.id === 'file.save');
    const title = save?.title;
    expect(typeof title === 'function' ? title(handle.commands.context()) : title).toBe(
      'command.file.download',
    );
  });

  it('01-file-format 5: a file that cannot be opened is refused and the document stays', () => {
    const { handle } = make();
    handle.commands.run('block.insert.for');
    const before = handle.state().doc;
    expect(handle.open({ store: memoryStore('bad.svg'), text: '<svg></svg>' })).toBe(false);
    expect(handle.state().doc).toBe(before);
    expect(handle.chromeState().notice?.message).toBe('notice.openNoModel');
  });

  it('coding guide 5: a broken first file opens view only, so the original is not overwritten', () => {
    const { handle } = make({ text: 'not a file' });
    expect(handle.status().readOnly).toBe(true);
    handle.commands.run('block.insert.if');
    expect(handle.status().dirty).toBe(false);
  });

  it('03-editor 6.3: a snapshot reopens as a dirty document', async () => {
    const { handle, store } = make();
    handle.commands.run('block.insert.case');
    const snapshot = handle.snapshot();
    const content = handle.state().doc.content;
    expect(handle.open({ store, text: null, restored: snapshot })).toBe(true);
    expect(handle.state().doc.content).toEqual(content);
    expect(handle.status().dirty).toBe(true);
    expect(handle.state().undo).toHaveLength(0);
    await handle.save();
    expect(handle.status().dirty).toBe(false);
  });

  it('03-editor 6.4: view only refuses edits and is reported', () => {
    const { handle } = make();
    handle.setReadOnly(true);
    expect(handle.status().readOnly).toBe(true);
    handle.commands.run('block.insert.if');
    expect(handle.status().dirty).toBe(false);
    expect(handle.chromeState().notice?.message).toBe('reason.readOnly');
  });

  it('03-editor 6: document settings are content, so changing one is undoable', () => {
    const { handle } = make();
    expect(handle.documentSetting('document.headStyle')).toBe('title');
    handle.setDocumentSetting('document.headStyle', 'shape');
    expect(handle.documentSetting('document.headStyle')).toBe('shape');
    handle.commands.run('edit.undo');
    expect(handle.documentSetting('document.headStyle')).toBe('title');
    handle.setDocumentSetting('document.headStyle', 'nonsense');
    expect(handle.state().undo).toHaveLength(0);
  });

  it('03-editor 1, 3.4: keys on the diagram open the inline editor; Enter accepts', async () => {
    const { handle, host } = make();
    const canvas = host.querySelector<HTMLElement>('.ans-canvas');
    expect(canvas).not.toBeNull();
    expect(host.querySelector('.ans-document svg')).not.toBeNull();
    canvas?.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyI', bubbles: true }));
    await tick();
    const textarea = host.querySelector('textarea');
    expect(textarea?.style.display).toBe('block');
    if (textarea !== null) {
      textarea.value = 'read n';
      textarea.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    }
    await tick();
    expect(handle.state().editing).toBeNull();
    const block = handle.state().doc.content.diagrams[0]?.body.blocks[0];
    expect(block?.kind === 'process' ? block.text : null).toBe('read n');
    expect(textarea?.style.display).toBe('none');
    expect(host.querySelector('.ans-overlay')?.innerHTML).toContain('stroke-width="3"');
  });
});
