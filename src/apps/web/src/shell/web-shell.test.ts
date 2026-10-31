import { assembleSvgFile, createDoc, renderDoc } from '@ariadne-nsd/core';
import { describe, expect, it, vi } from 'vitest';

import type {
  CommandSpec,
  DocStatus,
  EditorHandle,
  OpenedDocument,
  WriteResult,
} from '../editor-contract';
import type { BrowserDb } from '../storage/browser-db';
import { memoryDb } from '../storage/browser-db';
import { createSettingsStore } from '../storage/settings-store';
import { createNoticeBoard } from './notices';
import type { Clock } from './timers';
import { createWebShell, shellCommandIds } from './web-shell';

vi.mock('../files/file-fallback', () => ({
  download: vi.fn(),
  chooseFileWithInput: vi.fn(),
  documentMediaType: 'image/svg+xml',
}));

/** A saved file of a new document, made by core (without a font: the shell does not read it). */
const newDoc = createDoc();
const savedFile = assembleSvgFile({
  doc: newDoc,
  drawing: renderDoc(newDoc, { locale: 'en' }).svg,
  fonts: [],
});

/** An editor that only keeps the status, enough to drive the shell. */
function fakeEditor(): EditorHandle & {
  edit: () => void;
  opened: OpenedDocument[];
  commands: { register: (spec: CommandSpec) => () => void; specs: Map<string, CommandSpec> };
} {
  let doc: OpenedDocument | null = null;
  let status: DocStatus = { name: '', dirty: false, readOnly: false, revision: 0 };
  const listeners = new Set<(status: DocStatus) => void>();
  const specs = new Map<string, CommandSpec>();
  const update = (next: Partial<DocStatus>): void => {
    status = { ...status, ...next, revision: status.revision + 1 };
    for (const listener of listeners) {
      listener(status);
    }
  };
  const opened: OpenedDocument[] = [];
  return {
    opened,
    commands: {
      specs,
      register(spec) {
        specs.set(spec.id, spec);
        return () => specs.delete(spec.id);
      },
      run: () => undefined,
    },
    open(next) {
      if (next.text !== null && !next.text.includes('<ans:document')) {
        return false;
      }
      doc = next;
      opened.push(next);
      update({
        name: next.store.name,
        dirty: next.restored !== undefined,
        readOnly: next.readOnly === true,
      });
      return true;
    },
    status: () => status,
    onStatus(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    serialize: () => Promise.resolve(savedFile),
    snapshot: () => '{"snapshot":true}',
    async save(): Promise<WriteResult> {
      if (doc === null) {
        throw new Error('no document');
      }
      const result = await doc.store.write(savedFile);
      if (result.ok) {
        update({ name: result.name, dirty: false });
      }
      return result;
    },
    setReadOnly: (readOnly) => {
      update({ readOnly });
    },
    setAppearance: () => undefined,
    edit: () => {
      update({ dirty: true });
    },
  };
}

function manualClock(): Clock & { advance: (milliseconds: number) => void } {
  const timers = new Map<number, { at: number; callback: () => void }>();
  let now = 0;
  let next = 0;
  return {
    setTimeout(callback, milliseconds) {
      next += 1;
      timers.set(next, { at: now + milliseconds, callback });
      return next;
    },
    clearTimeout: (handle) => timers.delete(handle as number),
    advance(milliseconds) {
      now += milliseconds;
      for (const [id, timer] of [...timers]) {
        if (timer.at <= now) {
          timers.delete(id);
          timer.callback();
        }
      }
    },
  };
}

async function settle(): Promise<void> {
  for (let index = 0; index < 20; index += 1) {
    await Promise.resolve();
  }
}

function setup(options: { db?: BrowserDb; confirm?: boolean } = {}) {
  const db = options.db ?? memoryDb();
  const clock = manualClock();
  const notices = createNoticeBoard(() => undefined);
  const titles: string[] = [];
  let keys = 0;
  const shell = createWebShell({
    db,
    settings: createSettingsStore(null, () => undefined),
    locale: 'en',
    canWriteInPlace: false,
    notices,
    channel: null,
    tabId: 'tab',
    wait: () => Promise.resolve(),
    clock,
    newKey: () => {
      keys += 1;
      return `key-${String(keys)}`;
    },
    now: () => 1000,
    confirm: () => options.confirm ?? true,
    prompt: (_text, value) => value,
    setTitle: (title) => titles.push(title),
    log: () => undefined,
  });
  const editor = fakeEditor();
  editor.open(shell.initialDocument());
  return { shell, editor, db, clock, notices, titles };
}

describe('web shell', () => {
  it('03-editor 6.1: adds new, open, recent files and export to the command list', async () => {
    const { shell, editor } = setup();
    await shell.start(editor);
    for (const id of Object.values(shellCommandIds).filter((value) => !value.endsWith('.'))) {
      expect(editor.commands.specs.has(id)).toBe(true);
    }
    expect(editor.commands.specs.has('file.recent.empty')).toBe(true);
  });

  it('UX W3: shows the name and ● in the tab title', async () => {
    const { shell, editor, titles } = setup();
    await shell.start(editor);
    expect(titles.at(-1)).toBe('Untitled.ns.svg – AriadneNSD');
    editor.edit();
    expect(titles.at(-1)).toBe('● Untitled.ns.svg – AriadneNSD');
  });

  it('R-WEB-02: an SVG without a model does not replace the document, and says why', async () => {
    const { shell, editor, notices } = setup();
    await shell.start(editor);
    const before = editor.opened.length;
    await shell.openFile(new File(['<svg xmlns="http://www.w3.org/2000/svg"/>'], 'plain.svg'));
    expect(editor.opened.length).toBe(before);
    expect(notices.list().at(-1)?.text).toBe(
      '“plain.svg” has no AriadneNSD model in it, so it cannot be edited.',
    );
  });

  it('R-WEB-02, R-EXP-04: opens a saved file and lists it as a browser copy', async () => {
    const { shell, editor, db } = setup();
    await shell.start(editor);
    await shell.openFile(new File([savedFile], 'if.ns.svg'));
    expect(editor.opened.at(-1)?.text).toBe(savedFile);
    expect(editor.status().name).toBe('if.ns.svg');
    const recent = await db.recentFiles();
    expect(recent.map((entry) => entry.name)).toEqual(['if.ns.svg']);
    expect(editor.commands.specs.get('file.recent.1')?.title).toBe('if.ns.svg (browser copy)');
  });

  it('R-WEB-03: writes a backup 0.5 s after an edit and removes it after saving', async () => {
    const { shell, editor, db, clock } = setup();
    await shell.start(editor);
    editor.edit();
    clock.advance(400);
    expect(await db.backups()).toHaveLength(0);
    clock.advance(100);
    await settle();
    const [backup] = await db.backups();
    expect(backup?.snapshot).toBe('{"snapshot":true}');
    await editor.save();
    await settle();
    expect(await db.backups()).toHaveLength(0);
    expect(editor.status().dirty).toBe(false);
  });

  it('R-WEB-03: at start, offers to restore the newest backup and opens it as unsaved', async () => {
    const db = memoryDb();
    await db.putBackup({ key: 'old', name: 'a.ns.svg', snapshot: '{"a":1}', savedAt: 1 });
    await db.putBackup({ key: 'new', name: 'b.ns.svg', snapshot: '{"b":2}', savedAt: 2 });
    const { shell, editor } = setup({ db });
    await shell.start(editor);
    expect(editor.opened.at(-1)?.restored).toBe('{"b":2}');
    expect(editor.status()).toMatchObject({ name: 'b.ns.svg', dirty: true });
  });

  it('R-WEB-03: a declined restore removes that backup', async () => {
    const db = memoryDb();
    await db.putBackup({ key: 'old', name: 'a.ns.svg', snapshot: '{"a":1}', savedAt: 1 });
    const { shell, editor } = setup({ db, confirm: false });
    await shell.start(editor);
    expect(editor.opened.at(-1)?.restored).toBeUndefined();
    expect(await db.backups()).toHaveLength(0);
  });

  it('03-editor 6.1: switching away from unsaved edits keeps them in the backup and says so', async () => {
    const { shell, editor, db, notices } = setup();
    await shell.start(editor);
    editor.edit();
    await shell.newDocument();
    await settle();
    expect(await db.backups()).toHaveLength(1);
    expect(notices.list().at(-1)?.text).toContain('were not saved to the file');
  });
});
