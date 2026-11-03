// @vitest-environment happy-dom
import type { Doc } from '@ariadne-nsd/core';
import { openSvgFile } from '@ariadne-nsd/core';
import { afterEach, describe, expect, it } from 'vitest';

import type { EditorHandle, OpenedDocument, SaveFonts } from './contracts';
import { createEditor, settingIds } from './create-editor';
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

function make(
  doc: Partial<OpenedDocument> = {},
  store = memoryStore(),
  settings = memorySettings(),
) {
  const host = document.createElement('div');
  document.body.append(host);
  const handle = createEditor({
    host,
    settings,
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
  it('T-0356 · R-ALL-03: a new document has one empty block, selected, and is not dirty', () => {
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

  it('T-0357: 03-editor 6.2: a change makes the document dirty and tells the shell', () => {
    const { handle } = make();
    const seen: boolean[] = [];
    handle.onStatus((status) => seen.push(status.dirty));
    handle.commands.run('block.insert.while');
    expect(handle.status().dirty).toBe(true);
    expect(handle.status().revision).toBe(1);
    expect(seen).toContain(true);
  });

  it('T-0358 · R-FMT-01: save writes the file with the model inside; reopening gives the same content', async () => {
    const { handle, store } = make();
    handle.commands.run('block.insert.if');
    const result = await handle.save();
    expect(result).toEqual({ ok: true, name: 'test.ns.svg' });
    expect(handle.status().dirty).toBe(false);
    const written = store.written.at(-1) ?? '';
    expect(written).toContain('<ans:document');
    expect(written).toContain('font-family: "AriadneNSD Mono"');
    const opened = openSvgFile(written);
    expect(opened.ok && opened.value.doc.content).toEqual(handle.state().doc.content);
    expect(await handle.serialize()).toBe(written);
  });

  it('T-0359: 03-editor 6: WriteResult failures keep the document dirty and say why', async () => {
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

  it('T-0360: 06-web 1: where the original cannot be written, Save is called Download', () => {
    const { handle } = make({}, memoryStore('a.ns.svg', false));
    const save = handle.commands.list().find((spec) => spec.id === 'file.save');
    const title = save?.title;
    expect(typeof title === 'function' ? title(handle.commands.context()) : title).toBe(
      'command.file.download',
    );
  });

  it('T-0361: 01-file-format 5: a file that cannot be opened is refused and the document stays', () => {
    const { handle } = make();
    handle.commands.run('block.insert.for');
    const before = handle.state().doc;
    expect(handle.open({ store: memoryStore('bad.svg'), text: '<svg></svg>' })).toBe(false);
    expect(handle.state().doc).toBe(before);
    expect(handle.chromeState().notice?.message).toBe('notice.openNoModel');
  });

  it('T-0362: coding guide 5: a broken first file opens view only, so the original is not overwritten', () => {
    const { handle } = make({ text: 'not a file' });
    expect(handle.status().readOnly).toBe(true);
    handle.commands.run('block.insert.if');
    expect(handle.status().dirty).toBe(false);
  });

  it('T-0363: 03-editor 6.3: a snapshot reopens as a dirty document', async () => {
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

  it('T-0364: 03-editor 6.4: view only refuses edits and is reported', () => {
    const { handle } = make();
    handle.setReadOnly(true);
    expect(handle.status().readOnly).toBe(true);
    handle.commands.run('block.insert.if');
    expect(handle.status().dirty).toBe(false);
    expect(handle.chromeState().notice?.message).toBe('reason.readOnly');
  });

  it('T-0365: 03-editor 6: document settings are content, so changing one is undoable', () => {
    const { handle } = make();
    expect(handle.documentSetting('document.headStyle')).toBe('title');
    handle.setDocumentSetting('document.headStyle', 'shape');
    expect(handle.documentSetting('document.headStyle')).toBe('shape');
    handle.commands.run('edit.undo');
    expect(handle.documentSetting('document.headStyle')).toBe('title');
    handle.setDocumentSetting('document.headStyle', 'nonsense');
    expect(handle.state().undo).toHaveLength(0);
  });

  it('T-0366: 03-editor 1, 3.4: keys on the diagram open the inline editor; Enter accepts', async () => {
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

  it("T-0367: 03-editor 3.4: a new block's text editor takes the keys at once, not a frame later", () => {
    const { handle, host } = make();
    handle.commands.run('block.insert.if');
    expect(document.activeElement).toBe(host.querySelector('textarea'));
  });

  it('T-0368: 03-editor 3.4: Ctrl+S while typing accepts the text and saves it', async () => {
    const { handle, host, store } = make();
    host
      .querySelector('.ans-canvas')
      ?.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyI', bubbles: true }));
    await tick();
    const textarea = host.querySelector('textarea');
    if (textarea !== null) {
      textarea.value = 'typed';
      textarea.dispatchEvent(
        new KeyboardEvent('keydown', { key: 's', code: 'KeyS', ctrlKey: true, bubbles: true }),
      );
    }
    await tick();
    expect(handle.state().editing).toBeNull();
    expect(store.written).toHaveLength(1);
    expect(store.written[0]).toContain('"text": "typed"');
    expect(handle.status().dirty).toBe(false);
  });

  it('T-0369: 03-editor 5: a right click on a block selects it and asks for the context menu', () => {
    const { handle, host } = make();
    const requests: { x: number; y: number }[] = [];
    handle.onContextMenu((request) => requests.push(request));
    handle.commands.run('select.clear');
    const canvas = host.querySelector('.ans-canvas');
    const box = handle.state().layout.boxes.get('b1');
    const stage = host.querySelector('.ans-stage')?.getBoundingClientRect();
    if (box === undefined || stage === undefined) {
      throw new Error('no block b1 on the stage');
    }
    canvas?.dispatchEvent(
      new MouseEvent('contextmenu', {
        clientX: stage.left + box.x + 4,
        clientY: stage.top + box.y + 4,
        bubbles: true,
        cancelable: true,
      }),
    );
    expect(handle.state().selection).toMatchObject({ kind: 'blocks', anchor: 'b1' });
    expect(requests).toHaveLength(1);
  });
});

describe('the shell asks through the editor (03-editor 6 additions)', () => {
  it('T-0370: 06-web 7: a shell message shows in the status bar', () => {
    const { handle } = make();
    handle.notify('Downloaded instead.', 'warn');
    expect(handle.chromeState().notice).toMatchObject({
      message: 'Downloaded instead.',
      level: 'warn',
    });
  });

  it('T-0371: 06-web 2: confirm shows a dialog and resolves with the answer', async () => {
    const { handle } = make();
    const answer = handle.confirm('Restore them?', { confirm: 'Restore' });
    const dialog = handle.chromeState().dialog;
    expect(dialog).toMatchObject({ message: 'Restore them?', input: null, confirm: 'Restore' });
    dialog?.answer('');
    expect(await answer).toBe(true);
    expect(handle.chromeState().dialog).toBeNull();
  });

  it('T-0372: 06-web 1: prompt resolves with the typed text, or null when cancelled', async () => {
    const { handle } = make();
    const named = handle.prompt('File name:', 'a.ns.svg');
    expect(handle.chromeState().dialog?.input).toBe('a.ns.svg');
    handle.chromeState().dialog?.answer('b.ns.svg');
    expect(await named).toBe('b.ns.svg');
    const cancelled = handle.prompt('File name:', 'a.ns.svg');
    handle.chromeState().dialog?.answer(null);
    expect(await cancelled).toBeNull();
  });

  it('T-0373: a second dialog cancels the first', async () => {
    const { handle } = make();
    const first = handle.confirm('First?');
    const second = handle.confirm('Second?');
    expect(await first).toBe(false);
    expect(handle.chromeState().dialog?.message).toBe('Second?');
    handle.chromeState().dialog?.answer('');
    expect(await second).toBe(true);
  });
});

describe('the header shape (R-LAY-10, UX HS1)', () => {
  it('T-0374 · UX HS1: the shape chosen last is remembered and new documents start with it', () => {
    const values: Record<string, unknown> = {};
    const settings = memorySettings(values);
    const { handle } = make({}, memoryStore(), settings);
    expect(handle.documentSetting('document.headStyle')).toBe('title');
    expect(
      handle.settingsSchema.list().find((spec) => spec.id === 'document.headStyle'),
    ).toMatchObject({ scope: 'document', values: ['title', 'shape'] });
    handle.setDocumentSetting('document.headStyle', 'shape');
    expect(values[settingIds.headStyle]).toBe('shape');
    handle.open({ store: memoryStore(), text: null });
    expect(handle.documentSetting('document.headStyle')).toBe('shape');
    const second = make({}, memoryStore(), settings).handle;
    expect(second.documentSetting('document.headStyle')).toBe('shape');
  });

  it('T-0375 · UX HS1: opening a file keeps its own shape and does not change the remembered one', async () => {
    const values: Record<string, unknown> = { [settingIds.headStyle]: 'title' };
    const { handle } = make({}, memoryStore(), memorySettings(values));
    handle.setDocumentSetting('document.headStyle', 'shape');
    const svg = await handle.serialize();
    values[settingIds.headStyle] = 'title';
    expect(handle.open({ store: memoryStore(), text: svg })).toBe(true);
    expect(handle.documentSetting('document.headStyle')).toBe('shape');
    expect(values[settingIds.headStyle]).toBe('title');
  });
});

describe('the picker (interaction rules "호출 블록")', () => {
  it('T-0376 · R-BLK-07: inserting a call block asks in the chrome state; the answer inserts', async () => {
    const { handle } = make();
    // A new Method takes the place of the blank diagram (invariant 7); its first block, then a c.
    handle.commands.run('diagram.newMethod');
    handle.commands.run('select.down');
    expect(handle.chromeState().picker).toBeNull();
    handle.commands.run('block.insert.call');
    const asked = handle.chromeState().picker;
    expect(asked?.items.map((item) => item.title)).toEqual(['Method 1', 'picker.newMethod']);
    asked?.choose(0);
    await tick();
    expect(handle.chromeState().picker).toBeNull();
    const calls = handle
      .state()
      .doc.content.diagrams.flatMap((d) => d.body.blocks)
      .filter((b) => b.kind === 'call');
    expect(calls).toHaveLength(1);
  });
});

describe('the inline editor on headers and call blocks (03-editor 3.4)', () => {
  const twoEvents = (): Doc => ({
    content: {
      settings: { textKind: 'plain', theme: 'default', headStyle: 'shape' },
      diagrams: [
        {
          id: 'd1',
          head: { kind: 'event', text: 'a' },
          body: {
            blocks: [
              {
                id: 'b1',
                kind: 'call',
                target: { kind: 'local', diagram: 'd2' },
                args: 'x',
                result: '',
                siteFolds: [],
              },
            ],
            folds: [],
          },
        },
        {
          id: 'd2',
          head: { kind: 'method', text: 'b(x)' },
          body: { blocks: [{ id: 'b2', kind: 'process', text: 'p' }], folds: [] },
        },
      ],
    },
    view: { folded: [], opened: [], bands: true, resultSymbol: '←' },
  });
  const key = (target: Element | null, init: KeyboardEventInit): void => {
    target?.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, ...init }));
  };

  it('T-0377: interaction rules "Event 헤더": a clashing name reopens the field; Esc there puts it back', async () => {
    const { handle, host } = make({ doc: twoEvents() });
    const canvas = host.querySelector('.ans-canvas');
    key(canvas, { code: 'KeyJ' });
    expect(handle.state().selection).toEqual({ kind: 'head', diagram: 'd1' });
    key(canvas, { key: 'Enter', code: 'Enter' });
    await tick();
    const textarea = host.querySelector('textarea');
    if (textarea === null) throw new Error('no inline editor');
    textarea.value = 'b';
    key(textarea, { key: 'Enter' });
    await tick();
    expect(handle.state().editing?.isRejected).toBe(true);
    expect(textarea.classList.contains('ans-is-rejected')).toBe(true);
    expect(textarea.style.display).toBe('block');
    key(textarea, { key: 'Escape' });
    await tick();
    expect(handle.state().editing).toBeNull();
    expect(handle.state().doc.content.diagrams[0]?.head?.text).toBe('a');
  });

  it('T-0378: 03-keymap: Tab moves between the arguments and the result of a call block', async () => {
    const { handle, host } = make({ doc: twoEvents() });
    const canvas = host.querySelector('.ans-canvas');
    key(canvas, { code: 'KeyJ' });
    key(canvas, { code: 'KeyJ' });
    key(canvas, { key: 'Enter', code: 'Enter' });
    await tick();
    const textarea = host.querySelector('textarea');
    if (textarea === null) throw new Error('no inline editor');
    expect(textarea.placeholder).toBe('Arguments');
    textarea.value = 'list';
    key(textarea, { key: 'Tab' });
    await tick();
    expect(textarea.placeholder).toBe('Result');
    textarea.value = 'r';
    key(textarea, { key: 'Enter' });
    await tick();
    expect(handle.state().doc.content.diagrams[0]?.body.blocks[0]).toMatchObject({
      args: 'list',
      result: 'r',
    });
    expect(handle.state().undo).toHaveLength(1);
  });
});
