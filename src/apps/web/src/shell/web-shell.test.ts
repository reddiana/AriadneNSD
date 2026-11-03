import type { Doc } from '@ariadne-nsd/core';
import { assembleSvgFile, createDoc, renderDoc } from '@ariadne-nsd/core';
import { examples } from '@ariadne-nsd/editor';
import { unzipSync } from 'fflate';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type {
  CommandSpec,
  DocStatus,
  EditorHandle,
  OpenedDocument,
  PlacesAnswer,
  PlacesRequest,
  WriteResult,
} from '../editor-contract';
import type { BrowserDb } from '../storage/browser-db';
import { memoryDb } from '../storage/browser-db';
import { chooseFileWithInput, chooseFilesWithInput, download } from '../files/file-fallback';
import { createSettingsStore } from '../storage/settings-store';
import type { Channel, TabMessage } from './tab-lock';
import type { Clock } from './timers';
import { autosaveDelay } from './timers';
import { createWebShell, placeSideKey, shellCommandIds } from './web-shell';

vi.mock('../files/file-fallback', () => ({
  download: vi.fn(),
  chooseFileWithInput: vi.fn(),
  chooseFilesWithInput: vi.fn(),
  documentMediaType: 'image/svg+xml',
}));

/** A saved file of a new document, made by core (without a font: the shell does not read it). */
const newDoc = createDoc();
const savedFile = fileOf(newDoc);

function fileOf(doc: Doc): string {
  return assembleSvgFile({ doc, drawing: renderDoc(doc).svg, fonts: [] });
}

/** An editor that only keeps the status, enough to drive the shell. */
type FakeEditor = EditorHandle & {
  edit: () => void;
  opened: OpenedDocument[];
  /** The status bar messages the shell sent, oldest first. */
  notices: string[];
  /** The questions with three answers the shell asked, oldest first (UX US1). */
  asked: string[];
  /** What the next `choose` answers. Cancel when empty. */
  choices: ('confirm' | 'other' | 'second' | 'cancel')[];
  /** What the next `prompt` answers. The suggested value when empty. */
  prompts: (string | null)[];
  /** The text `save` and `saveAs` write. */
  file: string;
  saveAs: () => Promise<WriteResult>;

  commands: { register: (spec: CommandSpec) => () => void; specs: Map<string, CommandSpec> };
};

function fakeEditor(answer: boolean): FakeEditor {
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
  const notices: string[] = [];
  const asked: string[] = [];
  const choices: ('confirm' | 'other' | 'second' | 'cancel')[] = [];
  const prompts: (string | null)[] = [];
  const editor: FakeEditor = {
    file: savedFile,
    opened,
    notices,
    asked,
    choices,
    prompts,
    notify: (message) => {
      notices.push(typeof message === 'string' ? message : message.key);
    },
    confirm: () => Promise.resolve(answer),
    choose: (message) => {
      asked.push(typeof message === 'string' ? message : message.key);
      return Promise.resolve(choices.shift() ?? 'cancel');
    },
    prompt: (_message, value) =>
      Promise.resolve(prompts.length === 0 ? value : (prompts.shift() ?? null)),
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
    serialize: () => Promise.resolve(editor.file),
    snapshot: () => '{"snapshot":true}',
    async save(): Promise<WriteResult> {
      if (doc === null) {
        throw new Error('no document');
      }
      const result = await doc.store.write(editor.file);
      if (result.ok) {
        update({ name: result.name, dirty: false });
      }
      return result;
    },
    async saveAs(): Promise<WriteResult> {
      if (doc === null) {
        throw new Error('no document');
      }
      const result = await doc.store.writeAs(editor.file, doc.store.name);
      if (result.ok) {
        update({ name: result.name, dirty: false });
      }
      return result;
    },
    setReadOnly: (readOnly) => {
      // The engine's status reads the store's name, so a renamed store shows here too.
      update({ readOnly, ...(doc === null ? {} : { name: doc.store.name }) });
    },
    setAppearance: () => undefined,
    edit: () => {
      update({ dirty: true });
    },
  };
  return editor;
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

type SetupOptions = {
  db?: BrowserDb;
  confirm?: boolean;
  canWriteInPlace?: boolean;
  channel?: Channel | null;
  tabId?: string;
  persistStorage?: () => Promise<boolean>;
};

function setup(options: SetupOptions = {}) {
  const db = options.db ?? memoryDb();
  const clock = manualClock();
  const titles: string[] = [];
  const logs: string[] = [];
  const settings = createSettingsStore(null, () => undefined);
  let keys = 0;
  const tabId = options.tabId ?? 'tab';
  const shell = createWebShell({
    db,
    settings,
    locale: 'en',
    canWriteInPlace: options.canWriteInPlace ?? false,
    channel: options.channel ?? null,
    tabId,
    wait: () => Promise.resolve(),
    clock,
    newKey: () => {
      keys += 1;
      return `${tabId}-key-${String(keys)}`;
    },
    now: () => 1000,
    setTitle: (title) => titles.push(title),
    log: (detail) => logs.push(detail),
    ...(options.persistStorage === undefined ? {} : { persistStorage: options.persistStorage }),
  });
  const editor = fakeEditor(options.confirm ?? true);
  editor.open(shell.initialDocument());
  // The open · save modal (UX BS1): answers from `placeAnswers`, or "this computer" when empty.
  const placeAnswers: PlacesAnswer[] = [];
  const placeRequests: PlacesRequest[] = [];
  shell.places.onRequest(() => {
    const request = shell.places.request();
    if (request === null) {
      return;
    }
    placeRequests.push(request);
    const answer = placeAnswers.length === 0 ? { kind: 'computer' as const } : placeAnswers.shift();
    queueMicrotask(() => {
      shell.places.answer(answer ?? null);
    });
  });
  return { shell, editor, db, clock, titles, logs, settings, placeAnswers, placeRequests };
}

/** A file handle in memory, as Chromium gives it. `permission` is what queryPermission answers. */
function fakeHandle(
  name: string,
  text: string,
  options: { permission?: PermissionState; writeError?: Error; readError?: Error } = {},
) {
  const state = { text, permission: options.permission ?? 'granted', writes: 0 };
  const handle = {
    kind: 'file',
    name,
    getFile: () =>
      options.readError === undefined
        ? Promise.resolve({ text: () => Promise.resolve(state.text) })
        : Promise.reject(options.readError),
    createWritable: () =>
      options.writeError === undefined
        ? Promise.resolve({
            write: (data: string) => {
              state.text = data;
              state.writes += 1;
              return Promise.resolve();
            },
            close: () => Promise.resolve(),
          })
        : Promise.reject(options.writeError),
    isSameEntry: (other: { name: string }) => Promise.resolve(other.name === name),
    queryPermission: () => Promise.resolve(state.permission),
    requestPermission: () => Promise.resolve(state.permission),
  };
  return { handle: handle as unknown as FileSystemFileHandle, state };
}

/** A drop of `files`; each may come with a file system handle (Chromium). */
function dropOf(
  files: ReadonlyArray<{ file: File | null; handle?: FileSystemHandle | null }>,
  extra: ReadonlyArray<{ kind: string }> = [],
): DataTransfer {
  const items = [
    ...files.map(({ file, handle }) => ({
      kind: 'file',
      getAsFile: () => file,
      ...(handle === undefined ? {} : { getAsFileSystemHandle: () => Promise.resolve(handle) }),
    })),
    ...extra,
  ];
  return { items } as unknown as DataTransfer;
}

/** Channels that deliver to each other at once, like tabs of one site. */
function hub(): () => Channel {
  const listeners = new Set<(event: { readonly data: unknown }) => void>();
  return () => {
    let own: ((event: { readonly data: unknown }) => void) | null = null;
    return {
      postMessage(message: TabMessage) {
        for (const listener of [...listeners]) {
          if (listener !== own) {
            listener({ data: message });
          }
        }
      },
      addEventListener(_type, listener) {
        own = listener;
        listeners.add(listener);
      },
      close() {
        if (own !== null) {
          listeners.delete(own);
        }
      },
    };
  };
}

/** The saved file with its model version changed to `version` (attribute and JSON). */
function withVersion(version: number): string {
  return savedFile
    .replace(/ version="1"><!\[CDATA\[/, ` version="${String(version)}"><![CDATA[`)
    .replace(/"version": 1/, `"version": ${String(version)}`);
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.mocked(chooseFileWithInput).mockReset();
  vi.mocked(chooseFilesWithInput).mockReset();
  vi.mocked(download).mockReset();
});

describe('web shell', () => {
  it('T-0344: 03-editor 6.1: adds new, open, recent files and export to the command list', async () => {
    const { shell, editor } = setup();
    await shell.start(editor);
    for (const id of Object.values(shellCommandIds).filter((value) => !value.endsWith('.'))) {
      expect(editor.commands.specs.has(id)).toBe(true);
    }
    expect(editor.commands.specs.has('file.recent.empty')).toBe(true);
  });

  it('T-0345 · UX W3: shows the name and ● in the tab title', async () => {
    const { shell, editor, titles } = setup();
    await shell.start(editor);
    expect(titles.at(-1)).toBe('Untitled.ns.svg – AriadneNSD');
    editor.edit();
    expect(titles.at(-1)).toBe('● Untitled.ns.svg – AriadneNSD');
  });

  it('T-0346 · R-WEB-02: an SVG without a model does not replace the document, and says why', async () => {
    const { shell, editor } = setup();
    await shell.start(editor);
    const before = editor.opened.length;
    await shell.openFile(new File(['<svg xmlns="http://www.w3.org/2000/svg"/>'], 'plain.svg'));
    expect(editor.opened.length).toBe(before);
    expect(editor.notices.at(-1)).toBe(
      '“plain.svg” has no AriadneNSD model in it, so it cannot be edited.',
    );
  });

  it('T-0347: R-WEB-02, R-EXP-04: opens a saved file and lists it as a browser copy', async () => {
    const { shell, editor, db } = setup();
    await shell.start(editor);
    await shell.openFile(new File([savedFile], 'if.ns.svg'));
    expect(editor.opened.at(-1)?.text).toBe(savedFile);
    expect(editor.status().name).toBe('if.ns.svg');
    const recent = await db.recentFiles();
    expect(recent.map((entry) => entry.name)).toEqual(['if.ns.svg']);
    expect(editor.commands.specs.get('file.recent.1')?.title).toBe('if.ns.svg (browser copy)');
  });

  it('T-0348 · R-WEB-03: writes a backup 0.5 s after an edit and removes it after saving', async () => {
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

  it('T-0349 · R-WEB-03: at start, offers to restore the newest backup and opens it as unsaved', async () => {
    const db = memoryDb();
    await db.putBackup({ key: 'old', name: 'a.ns.svg', snapshot: '{"a":1}', savedAt: 1 });
    await db.putBackup({ key: 'new', name: 'b.ns.svg', snapshot: '{"b":2}', savedAt: 2 });
    const { shell, editor } = setup({ db });
    await shell.start(editor);
    expect(editor.opened.at(-1)?.restored).toBe('{"b":2}');
    expect(editor.status()).toMatchObject({ name: 'b.ns.svg', dirty: true });
  });

  it('T-0350 · R-WEB-03: a declined restore removes that backup', async () => {
    const db = memoryDb();
    await db.putBackup({ key: 'old', name: 'a.ns.svg', snapshot: '{"a":1}', savedAt: 1 });
    const { shell, editor } = setup({ db, confirm: false });
    await shell.start(editor);
    expect(editor.opened.at(-1)?.restored).toBeUndefined();
    expect(await db.backups()).toHaveLength(0);
  });

  it('T-0351: 03-editor 6.1: switching away from unsaved edits keeps them in the backup and says so', async () => {
    const { shell, editor, db } = setup();
    await shell.start(editor);
    // A document opened from a file: opening that file again restores it, so no question (US1).
    await shell.openFile(new File([savedFile], 'a.ns.svg'));
    editor.edit();
    await shell.newDocument();
    await settle();
    expect(editor.asked).toEqual([]);
    expect(await db.backups()).toHaveLength(1);
    expect(editor.notices.at(-1)).toContain('were not saved to the file');
  });
});

describe('web shell: leaving a new document that was never saved (UX US1)', () => {
  /** A started shell whose first (new) document has unsaved edits, backed up. */
  async function editedNewDocument() {
    const context = setup();
    await context.shell.start(context.editor);
    context.editor.edit();
    context.clock.advance(500);
    await settle();
    expect(await context.db.backups()).toHaveLength(1);
    return context;
  }

  it('T-0827: asks before a new document, an example or a file replaces it; cancel keeps it', async () => {
    const { shell, editor, db } = await editedNewDocument();
    const before = editor.opened.length;
    await shell.newDocument();
    await shell.openDocument(newDoc, 'Quicksort.ns.svg');
    await shell.openFile(new File([savedFile], 'a.ns.svg'));
    expect(editor.asked).toHaveLength(3);
    expect(editor.asked[0]).toBe(
      '“Untitled.ns.svg” is a new document that has never been saved. Once another document opens, it cannot be brought back. Save it first?',
    );
    expect(editor.opened).toHaveLength(before);
    expect(editor.status()).toMatchObject({ name: 'Untitled.ns.svg', dirty: true });
    expect(await db.backups()).toHaveLength(1);
  });

  it('T-0828: asks before a recent file replaces it, and a file that cannot be opened asks nothing', async () => {
    const db = memoryDb();
    await db.touchRecent({
      key: 'r',
      name: 'r.ns.svg',
      usedAt: 1,
      source: { kind: 'copy', text: savedFile },
    });
    const { shell, editor } = setup({ db });
    await shell.start(editor);
    editor.edit();
    await shell.openFile(new File(['<svg/>'], 'plain.svg'));
    expect(editor.asked).toEqual([]);
    editor.choices.push('other');
    await editor.commands.specs.get('file.recent.1')?.run({}, undefined);
    expect(editor.asked).toHaveLength(1);
    expect(editor.status().name).toBe('r.ns.svg');
  });

  it('T-0829: "Discard and Open" opens the other document and drops the backup without a notice', async () => {
    const { shell, editor, db } = await editedNewDocument();
    editor.choices.push('other');
    await shell.openDocument(newDoc, 'Quicksort.ns.svg');
    await settle();
    expect(editor.status().name).toBe('Quicksort.ns.svg');
    expect(await db.backups()).toHaveLength(0);
    expect(editor.notices.some((notice) => notice.includes('were not saved'))).toBe(false);
  });

  it('T-0830: "Save" saves first, then opens the other document', async () => {
    const { shell, editor, db } = await editedNewDocument();
    editor.choices.push('confirm');
    await shell.newDocument();
    await settle();
    expect(editor.opened.at(-1)?.text).toBeNull();
    expect(editor.status()).toMatchObject({ name: 'Untitled.ns.svg', dirty: false });
    expect(await db.backups()).toHaveLength(0);
    expect((await db.recentFiles()).map((entry) => entry.name)).toEqual(['Untitled.ns.svg']);
  });

  it('T-0831: a save that is cancelled keeps the document where it was', async () => {
    vi.stubGlobal('window', {
      showSaveFilePicker: () => Promise.reject(new DOMException('closed', 'AbortError')),
    });
    const { shell, editor } = setup({ canWriteInPlace: true });
    await shell.start(editor);
    editor.edit();
    const before = editor.opened.length;
    editor.choices.push('confirm');
    await shell.openDocument(newDoc, 'Quicksort.ns.svg');
    expect(editor.asked).toHaveLength(1);
    expect(editor.opened).toHaveLength(before);
    expect(editor.status()).toMatchObject({ name: 'Untitled.ns.svg', dirty: true });
  });

  it('T-0832: a new document without changes, or one saved before, is left without asking', async () => {
    const { shell, editor } = setup();
    await shell.start(editor);
    await shell.newDocument();
    expect(editor.asked).toEqual([]);
    editor.edit();
    await editor.save();
    editor.edit();
    await shell.openDocument(newDoc, 'Quicksort.ns.svg');
    expect(editor.asked).toEqual([]);
    expect(editor.status().name).toBe('Quicksort.ns.svg');
  });

  it('T-0833: an edited example is a new document too', async () => {
    const { shell, editor } = setup();
    await shell.start(editor);
    await shell.openDocument(newDoc, 'Quicksort.ns.svg');
    editor.edit();
    await shell.newDocument();
    expect(editor.asked).toHaveLength(1);
    expect(editor.asked[0]).toContain('“Quicksort.ns.svg”');
  });
});

describe('web shell: opening', () => {
  it('T-0693 · R-WEB-02: says why a damaged file cannot be opened', async () => {
    const { shell, editor } = setup();
    await shell.start(editor);
    const before = editor.opened.length;
    await shell.openFile(new File([savedFile.replace('"version": 1', '"version": 2')], 'x.ns.svg'));
    expect(editor.opened.length).toBe(before);
    expect(editor.notices.at(-1)).toBe(
      '“x.ns.svg” is damaged and cannot be edited. The file was not changed.',
    );
  });

  it('T-0694 · R-WEB-02: says to reload for a file saved by a newer version', async () => {
    const { shell, editor } = setup();
    await shell.start(editor);
    await shell.openFile(new File([withVersion(999)], 'new.ns.svg'));
    expect(editor.notices.at(-1)).toBe(
      '“new.ns.svg” was saved by a newer version of AriadneNSD. Reload the page and open it again.',
    );
  });

  it('T-0695: says it could not read a file whose content cannot be read', async () => {
    const { shell, editor, logs } = setup();
    await shell.start(editor);
    const file = { name: 'gone.ns.svg', text: () => Promise.reject(new Error('gone')) };
    await shell.openFile(file as unknown as File);
    expect(editor.notices.at(-1)).toBe('Could not read “gone.ns.svg”.');
    expect(logs.at(-1)).toContain('Reading gone.ns.svg failed');
  });

  it('T-0696 · R-WEB-03: reopening a browser copy finds its backup by name and offers to restore it', async () => {
    const db = memoryDb();
    const { shell, editor } = setup({ db, confirm: false });
    await shell.start(editor);
    await shell.openFile(new File([savedFile], 'if.ns.svg'));
    const [entry] = await db.recentFiles();
    const key = entry?.key ?? '';
    await db.putBackup({ key, name: 'if.ns.svg', snapshot: '{"x":1}', savedAt: 5 });
    await shell.newDocument();
    await shell.openFile(new File([savedFile], 'if.ns.svg'));
    // Declined: the backup is removed, and the recent entry keeps its key.
    expect(editor.opened.at(-1)?.restored).toBeUndefined();
    expect(await db.backup(key)).toBeUndefined();
    expect((await db.recentFiles()).map((item) => item.key)).toEqual([key]);
  });

  it('T-0697 · R-WEB-03: a restored backup with a file handle keeps writing to that file', async () => {
    const db = memoryDb();
    const { handle, state } = fakeHandle('h.ns.svg', '');
    await db.putBackup({ key: 'k', name: 'h.ns.svg', snapshot: '{"h":1}', savedAt: 1, handle });
    const { shell, editor } = setup({ db, canWriteInPlace: true });
    await shell.start(editor);
    expect(editor.opened.at(-1)?.store.name).toBe('h.ns.svg');
    expect(editor.opened.at(-1)?.restored).toBe('{"h":1}');
    expect(await editor.save()).toEqual({ ok: true, name: 'h.ns.svg' });
    expect(state.text).toBe(savedFile);
  });

  it('T-0698 · R-WEB-03: a restored backup of a browser copy keeps the copy', async () => {
    const db = memoryDb();
    await db.touchRecent({
      key: 'c',
      name: 'c.ns.svg',
      usedAt: 1,
      source: { kind: 'copy', text: savedFile },
    });
    await db.putBackup({ key: 'c', name: 'c.ns.svg', snapshot: '{"c":1}', savedAt: 1 });
    const { shell, editor } = setup({ db });
    await shell.start(editor);
    expect(editor.opened.at(-1)?.store.name).toBe('c.ns.svg');
    expect(await editor.opened.at(-1)?.store.read()).toBe(savedFile);
  });

  it('T-0699: opens an example as a new document with its name', async () => {
    const { shell, editor } = setup();
    await shell.start(editor);
    await shell.openDocument(newDoc, 'Quicksort.ns.svg');
    expect(editor.opened.at(-1)).toMatchObject({ doc: newDoc, text: null });
    expect(editor.status().name).toBe('Quicksort.ns.svg');
  });

  it('T-0700 · R-WEB-02: without File System Access, opens the file chosen with the file input', async () => {
    vi.mocked(chooseFileWithInput).mockResolvedValueOnce(new File([savedFile], 'in.ns.svg'));
    const { shell, editor } = setup();
    await shell.start(editor);
    await shell.openFromPicker();
    expect(editor.status().name).toBe('in.ns.svg');
  });

  it('T-0701: closing the file input opens nothing', async () => {
    vi.mocked(chooseFileWithInput).mockResolvedValueOnce(null);
    const { shell, editor } = setup();
    await shell.start(editor);
    const before = editor.opened.length;
    await shell.openFromPicker();
    expect(editor.opened.length).toBe(before);
  });

  it('T-0702 · R-WEB-02: with File System Access, opens the picked file and saves back to it', async () => {
    const { handle, state } = fakeHandle('p.ns.svg', savedFile);
    vi.stubGlobal('window', { showOpenFilePicker: () => Promise.resolve([handle]) });
    const { shell, editor } = setup({ canWriteInPlace: true });
    await shell.start(editor);
    await shell.openFromPicker();
    expect(editor.status().name).toBe('p.ns.svg');
    state.text = '';
    await editor.save();
    expect(state.text).toBe(savedFile);
  });

  it('T-0703: closing the open dialog opens nothing', async () => {
    vi.stubGlobal('window', {
      showOpenFilePicker: () => Promise.reject(new DOMException('closed', 'AbortError')),
    });
    const { shell, editor } = setup({ canWriteInPlace: true });
    await shell.start(editor);
    const before = editor.opened.length;
    await shell.openFromPicker();
    expect(editor.opened.length).toBe(before);
  });

  it('T-0704: says it could not read a picked file that cannot be read', async () => {
    const { handle } = fakeHandle('bad.ns.svg', '', { readError: new Error('locked') });
    vi.stubGlobal('window', { showOpenFilePicker: () => Promise.resolve([handle]) });
    const { shell, editor } = setup({ canWriteInPlace: true });
    await shell.start(editor);
    await shell.openFromPicker();
    expect(editor.notices.at(-1)).toBe('Could not read “bad.ns.svg”.');
  });
});

describe('web shell: dropping files', () => {
  it('T-0705: 06-web 1: opens one dropped file', async () => {
    const { shell, editor } = setup();
    await shell.start(editor);
    shell.openDropped(dropOf([{ file: new File([savedFile], 'drop.ns.svg') }]));
    await settle();
    expect(editor.status().name).toBe('drop.ns.svg');
  });

  it('T-0706: 06-web 1: asks for one file at a time when several are dropped', async () => {
    const { shell, editor } = setup();
    await shell.start(editor);
    const before = editor.opened.length;
    shell.openDropped(
      dropOf([
        { file: new File([savedFile], 'a.ns.svg') },
        { file: new File([savedFile], 'b.ns.svg') },
      ]),
    );
    await settle();
    expect(editor.opened.length).toBe(before);
    expect(editor.notices.at(-1)).toBe('Drop one file at a time.');
  });

  it('T-0707: ignores a drop without files and counts only file items', async () => {
    const { shell, editor } = setup();
    await shell.start(editor);
    const before = { opened: editor.opened.length, notices: editor.notices.length };
    shell.openDropped(dropOf([], [{ kind: 'string' }]));
    await settle();
    expect(editor.opened.length).toBe(before.opened);
    expect(editor.notices.length).toBe(before.notices);
    shell.openDropped(
      dropOf([{ file: new File([savedFile], 'one.ns.svg') }], [{ kind: 'string' }]),
    );
    await settle();
    expect(editor.status().name).toBe('one.ns.svg');
  });

  it('T-0708: 06-web 1: in Chromium, a dropped file is saved back to the original file', async () => {
    const { handle, state } = fakeHandle('orig.ns.svg', savedFile);
    const { shell, editor } = setup({ canWriteInPlace: true });
    await shell.start(editor);
    shell.openDropped(dropOf([{ file: new File(['ignored'], 'copy.ns.svg'), handle }]));
    await settle();
    expect(editor.status().name).toBe('orig.ns.svg');
    state.text = '';
    await editor.save();
    expect(state.text).toBe(savedFile);
  });

  it('T-0709: 06-web 1: a dropped folder falls back to the dropped file', async () => {
    const folder = { kind: 'directory', name: 'dir' } as unknown as FileSystemHandle;
    const { shell, editor } = setup({ canWriteInPlace: true });
    await shell.start(editor);
    shell.openDropped(dropOf([{ file: new File([savedFile], 'f.ns.svg'), handle: folder }]));
    await settle();
    expect(editor.status().name).toBe('f.ns.svg');
  });
});

describe('web shell: recent files', () => {
  it('T-0710 · R-EXP-04: opens a browser copy from the recent files', async () => {
    const { shell, editor } = setup();
    await shell.start(editor);
    await shell.openFile(new File([savedFile], 'r.ns.svg'));
    await shell.newDocument();
    await editor.commands.specs.get('file.recent.1')?.run({}, undefined);
    expect(editor.status().name).toBe('r.ns.svg');
    expect(editor.opened.at(-1)?.text).toBe(savedFile);
  });

  it('T-0711 · R-EXP-04: a recent file that was moved or deleted is marked missing', async () => {
    const db = memoryDb();
    const { handle } = fakeHandle('lost.ns.svg', '', { readError: new Error('NotFound') });
    await db.touchRecent({
      key: 'l',
      name: 'lost.ns.svg',
      usedAt: 1,
      source: { kind: 'handle', handle },
    });
    const { shell, editor } = setup({ db, canWriteInPlace: true });
    await shell.start(editor);
    const spec = editor.commands.specs.get('file.recent.1');
    expect(spec?.title).toBe('lost.ns.svg');
    expect(spec?.when({})).toBe(true);
    await spec?.run({}, undefined);
    expect(editor.notices.at(-1)).toBe('lost.ns.svg: The file was moved or deleted.');
    expect(editor.commands.specs.get('file.recent.1')?.when({})).toBe(
      'The file was moved or deleted.',
    );
  });

  it('T-0712 · R-EXP-04: a recent file without read permission is not opened', async () => {
    const db = memoryDb();
    const { handle } = fakeHandle('no.ns.svg', savedFile, { permission: 'denied' });
    await db.touchRecent({
      key: 'n',
      name: 'no.ns.svg',
      usedAt: 1,
      source: { kind: 'handle', handle },
    });
    const { shell, editor } = setup({ db, canWriteInPlace: true });
    await shell.start(editor);
    const before = editor.opened.length;
    await editor.commands.specs.get('file.recent.1')?.run({}, undefined);
    expect(editor.opened.length).toBe(before);
    expect(editor.notices.at(-1)).toBe('Could not read “no.ns.svg”.');
  });

  it('T-0713 · R-EXP-04: opens a recent file through its handle', async () => {
    const db = memoryDb();
    const { handle } = fakeHandle('ok.ns.svg', savedFile);
    await db.touchRecent({
      key: 'o',
      name: 'ok.ns.svg',
      usedAt: 1,
      source: { kind: 'handle', handle },
    });
    const { shell, editor } = setup({ db, canWriteInPlace: true });
    await shell.start(editor);
    await editor.commands.specs.get('file.recent.1')?.run({}, undefined);
    expect(editor.status().name).toBe('ok.ns.svg');
    expect((await db.recentFiles()).map((entry) => entry.key)).toEqual(['o']);
  });
});

describe('web shell: saving', () => {
  it('T-0714: 06-web 1: tells once that this browser downloads instead of writing the file', async () => {
    const { shell, editor } = setup();
    await shell.start(editor);
    await shell.openFile(new File([savedFile], 'd.ns.svg'));
    await editor.save();
    await editor.save();
    const notice =
      'This browser cannot write to the original file, so saving downloads a copy to your Downloads folder.';
    expect(editor.notices.filter((item) => item === notice)).toHaveLength(1);
  });

  it('T-0715: 06-web 1: "download as" asks for the name in the editor', async () => {
    const { shell, editor } = setup();
    const asked: string[] = [];
    editor.prompt = (message, value) => {
      asked.push(`${typeof message === 'string' ? message : message.key}|${value}`);
      return Promise.resolve('other');
    };
    await shell.start(editor);
    const result = await editor.opened.at(-1)?.store.writeAs(savedFile, 'Untitled.ns.svg');
    expect(asked).toEqual(['File name to download:|Untitled.ns.svg']);
    expect(result).toEqual({ ok: true, name: 'other.ns.svg' });
  });

  it('T-0716: 06-web 2: auto saves to the file 2 s after an edit', async () => {
    const { handle, state } = fakeHandle('auto.ns.svg', savedFile);
    const { shell, editor, clock } = setup({ canWriteInPlace: true });
    await shell.start(editor);
    shell.openDropped(dropOf([{ file: null, handle }]));
    await settle();
    editor.edit();
    clock.advance(1999);
    await settle();
    expect(state.writes).toBe(0);
    clock.advance(1);
    await settle();
    expect(state.writes).toBe(1);
    expect(editor.status().dirty).toBe(false);
  });

  it('T-0717: UX W3-b: no auto save when the setting is off', async () => {
    const { handle, state } = fakeHandle('off.ns.svg', savedFile);
    const { shell, editor, clock, settings } = setup({ canWriteInPlace: true });
    settings.set('file.autoSave', false);
    await shell.start(editor);
    shell.openDropped(dropOf([{ file: null, handle }]));
    await settle();
    editor.edit();
    clock.advance(5000);
    await settle();
    expect(state.writes).toBe(0);
  });

  it('T-0718: 06-web 2: auto save stops and says so when writing is not allowed', async () => {
    const { handle } = fakeHandle('deny.ns.svg', savedFile, {
      writeError: new DOMException('no', 'NotAllowedError'),
    });
    const { shell, editor, clock } = setup({ canWriteInPlace: true });
    await shell.start(editor);
    shell.openDropped(dropOf([{ file: null, handle }]));
    await settle();
    editor.edit();
    clock.advance(2000);
    await settle();
    expect(editor.notices.at(-1)).toBe(
      'Auto save stopped: no permission to write the file. Press Ctrl+S to save and allow it again.',
    );
    expect(editor.status().dirty).toBe(true);
  });

  it('T-0719: 06-web 2: a failed auto save is logged, not shown', async () => {
    const { handle } = fakeHandle('fail.ns.svg', savedFile, { writeError: new Error('disk full') });
    const { shell, editor, clock, logs } = setup({ canWriteInPlace: true });
    await shell.start(editor);
    shell.openDropped(dropOf([{ file: null, handle }]));
    await settle();
    const notices = editor.notices.length;
    editor.edit();
    clock.advance(2000);
    await settle();
    expect(logs.at(-1)).toContain('Auto save failed: failed');
    expect(editor.notices.length).toBe(notices);
  });

  it('T-0720: 06-web 2: auto save waits for Ctrl+S when there is no write permission yet', async () => {
    const { handle, state } = fakeHandle('ro.ns.svg', savedFile, { permission: 'prompt' });
    const { shell, editor, clock } = setup({ canWriteInPlace: true });
    await shell.start(editor);
    shell.openDropped(dropOf([{ file: null, handle }]));
    await settle();
    editor.edit();
    clock.advance(2000);
    await settle();
    expect(state.writes).toBe(0);
  });

  it('T-0721 · R-WEB-03: suspend writes the pending backup at once', async () => {
    const { shell, editor, db } = setup();
    await shell.start(editor);
    editor.edit();
    expect(shell.isDirty()).toBe(true);
    shell.suspend();
    await settle();
    expect(await db.backups()).toHaveLength(1);
  });
});

describe('web shell: export, language, tabs', () => {
  it('T-0722 · R-EXP-01: a PNG export that cannot draw says it failed', async () => {
    const { shell, editor, logs } = setup();
    await shell.start(editor);
    await editor.commands.specs.get('file.export.png')?.run({}, undefined);
    expect(editor.notices.at(-1)).toBe('Could not export the PNG.');
    expect(logs.at(-1)).toContain('PNG export failed');
  });

  it('T-0723 · R-NFR-04: switching the screen language changes the shell command names', async () => {
    const { shell, editor } = setup();
    await shell.start(editor);
    expect(editor.commands.specs.get('file.recent.empty')?.title).toBe('No recent files');
    shell.setLocale('ko');
    expect(editor.commands.specs.get('file.recent.empty')?.title).toBe('최근 파일 없음');
    expect(editor.commands.specs.has('file.new')).toBe(true);
  });

  it('T-0724 · R-NFR-04: notices after a language switch are in the new language', async () => {
    const { shell, editor } = setup();
    await shell.start(editor);
    shell.setLocale('ko');
    shell.openDropped(dropOf([{ file: new File([''], 'a') }, { file: new File([''], 'b') }]));
    expect(editor.notices.at(-1)).toBe('파일은 하나씩 놓아 주세요.');
  });

  it('T-0725 · R-NFR-04: the untitled name keeps the language the shell started with', async () => {
    const { shell, editor } = setup();
    await shell.start(editor);
    shell.setLocale('ko');
    await shell.newDocument();
    expect(editor.status().name).toBe('Untitled.ns.svg');
  });

  it('T-0726: dispose removes the shell commands', async () => {
    const { shell, editor } = setup();
    await shell.start(editor);
    shell.dispose();
    expect([...editor.commands.specs.keys()]).toEqual([]);
  });

  it('T-0727: 06-web 2: a file open in another tab is view only, until that tab lets go', async () => {
    const connect = hub();
    const db = memoryDb();
    const first = setup({ db, channel: connect(), tabId: 'one' });
    await first.shell.start(first.editor);
    await first.shell.openFile(new File([savedFile], 'shared.ns.svg'));
    const second = setup({ db, channel: connect(), tabId: 'two' });
    await second.shell.start(second.editor);
    await second.shell.openFile(new File([savedFile], 'shared.ns.svg'));
    expect(second.editor.opened.at(-1)?.readOnly).toBe(true);
    expect(second.editor.notices.at(-1)).toBe(
      'Another tab is editing this file. This tab is view only.',
    );
    await first.shell.newDocument();
    await settle();
    expect(second.editor.status().readOnly).toBe(false);
    expect(second.editor.notices.at(-1)).toBe('The other tab closed. You can edit this file now.');
  });
});

/** A browser document as an earlier page left it. */
function browserDocument(key: string, name: string, text = savedFile) {
  return { key, name, text, savedAt: 1, size: text.length };
}

/** A database whose document writes are counted, and can be made to report a full storage. */
function countingDb() {
  const base = memoryDb();
  const control = { puts: 0, result: 'ok' as 'ok' | 'full' | 'failed' };
  const db: BrowserDb = {
    ...base,
    putDocument: async (document) => {
      control.puts += 1;
      return control.result === 'ok' ? base.putDocument(document) : control.result;
    },
  };
  return { db, control };
}

describe('web shell: documents in this browser (R-WEB-09)', () => {
  it('T-0881 · R-WEB-09 · UX BS1: a first save asks where, on this computer at first, named after the first diagram', async () => {
    const { shell, editor, db, titles, settings, placeAnswers, placeRequests } = setup();
    await shell.start(editor);
    const example = examples.find((item) => item.id === 'binary-search');
    editor.file = fileOf(example?.build({ headStyle: 'title', locale: 'en' }) ?? newDoc);
    editor.edit();
    placeAnswers.push({ kind: 'save', name: ' Merge Sort ' });
    expect(await editor.save()).toEqual({ ok: true, name: 'Merge Sort' });
    expect(placeRequests[0]).toMatchObject({
      mode: 'save',
      side: 'computer',
      name: 'main()',
      currentKey: null,
      isDownload: true,
    });
    const [saved] = await db.documents();
    expect(saved).toMatchObject({ name: 'Merge Sort', text: editor.file, savedAt: 1000 });
    expect(saved?.size).toBe(new TextEncoder().encode(editor.file).length);
    expect(editor.opened.at(-1)?.store.place).toBe('browser');
    expect(titles.at(-1)).toBe('Merge Sort – AriadneNSD');
    await settle();
    expect(editor.commands.specs.get('file.recent.1')?.title).toBe('Merge Sort (Browser)');
    expect(await db.backups()).toHaveLength(0);
    expect(settings.get(placeSideKey)).toBe('browser');
    // The modal opens on the side used last, with the document's own name.
    placeAnswers.push(null);
    await editor.saveAs();
    expect(placeRequests[1]).toMatchObject({ side: 'browser', name: 'Merge Sort' });
    expect(placeRequests[1]?.currentKey).toBe(saved?.key);
  });

  it('T-0882 · UX BS2: Ctrl+S and auto save write the browser document, also where files cannot be written', async () => {
    const { db, control } = countingDb();
    const { shell, editor, clock, placeAnswers } = setup({ db });
    await shell.start(editor);
    editor.edit();
    placeAnswers.push({ kind: 'save', name: 'Merge Sort' });
    await editor.save();
    editor.edit();
    await editor.save();
    expect(control.puts).toBe(2);
    expect(await db.documents()).toHaveLength(1);
    editor.edit();
    clock.advance(autosaveDelay);
    await settle();
    expect(control.puts).toBe(3);
    expect(editor.status().dirty).toBe(false);
  });

  it('T-0883 · R-WEB-09: a taken name asks to replace it; no asks again for a name', async () => {
    const db = memoryDb();
    await db.putDocument(browserDocument('old', 'Merge Sort'));
    const { shell, editor, placeAnswers, placeRequests } = setup({ db, confirm: false });
    await shell.start(editor);
    editor.edit();
    placeAnswers.push({ kind: 'save', name: 'merge sort' }, { kind: 'save', name: 'Quick Sort' });
    await editor.save();
    expect(placeRequests[1]).toMatchObject({ name: 'merge sort' });
    expect((await db.documents()).map((item) => item.name).sort()).toEqual([
      'Merge Sort',
      'Quick Sort',
    ]);
  });

  it('T-0884 · R-WEB-09: replacing a taken name writes over that document', async () => {
    const db = memoryDb();
    await db.putDocument(browserDocument('old', 'Merge Sort'));
    const { shell, editor, placeAnswers } = setup({ db, confirm: true });
    await shell.start(editor);
    editor.edit();
    placeAnswers.push({ kind: 'save', name: 'MERGE SORT' });
    await editor.save();
    const documents = await db.documents();
    expect(documents.map((item) => [item.key, item.name])).toEqual([['old', 'MERGE SORT']]);
    expect(editor.opened.at(-1)?.store.name).toBe('MERGE SORT');
  });

  it('T-0885 · R-WEB-09: a full storage says so in its own words and the document stays unsaved', async () => {
    const { db, control } = countingDb();
    control.result = 'full';
    const { shell, editor, placeAnswers } = setup({ db });
    await shell.start(editor);
    editor.edit();
    placeAnswers.push({ kind: 'save', name: 'Merge Sort' });
    expect(await editor.save()).toEqual({
      ok: false,
      reason: 'failed',
      detail: 'browser storage is full',
      message:
        'The browser’s storage is full, so it could not be saved. Save it to a file instead.',
    });
    expect(editor.status().dirty).toBe(true);
    control.result = 'failed';
    placeAnswers.push({ kind: 'save', name: 'Merge Sort' });
    expect(await editor.save()).toMatchObject({ ok: false, reason: 'failed' });
  });

  it('T-0886: 06-web 1.3: the first save to this browser asks the browser to keep the storage, once', async () => {
    const persist = vi.fn(() => Promise.resolve(false));
    const { shell, editor, placeAnswers, logs } = setup({ persistStorage: persist });
    await shell.start(editor);
    editor.edit();
    placeAnswers.push({ kind: 'save', name: 'A' });
    await editor.save();
    editor.edit();
    await editor.save();
    expect(persist).toHaveBeenCalledTimes(1);
    expect(logs).toContain('Persistent storage not granted');
    const failing = setup({ persistStorage: () => Promise.reject(new Error('no')) });
    await failing.shell.start(failing.editor);
    failing.editor.edit();
    failing.placeAnswers.push({ kind: 'save', name: 'A' });
    expect((await failing.editor.save()).ok).toBe(true);
    expect(failing.logs).toContain('Persistent storage request failed: Error: no');
  });

  it('T-0887 · R-WEB-09 · UX BS1: Open… opens a document in this browser and remembers the side', async () => {
    const db = memoryDb();
    await db.putDocument(browserDocument('b1', 'Merge Sort'));
    const { shell, editor, settings, placeAnswers, placeRequests } = setup({ db });
    await shell.start(editor);
    placeAnswers.push({ kind: 'open', key: 'b1' });
    await shell.openFromPicker();
    expect(placeRequests[0]).toMatchObject({ mode: 'open', side: 'computer', currentKey: null });
    expect(editor.opened.at(-1)?.text).toBe(savedFile);
    expect(editor.opened.at(-1)?.store.place).toBe('browser');
    expect(editor.status().name).toBe('Merge Sort');
    expect(settings.get(placeSideKey)).toBe('browser');
    placeAnswers.push(null);
    await shell.openFromPicker();
    expect(placeRequests[1]).toMatchObject({ side: 'browser', currentKey: 'b1' });
    // Recent files open it again from the browser; a deleted one is marked missing.
    await db.deleteDocument('b1');
    await editor.commands.specs.get('file.recent.1')?.run(undefined);
    expect(editor.notices.at(-1)).toBe('“Merge Sort” is no longer in this browser.');
    expect(editor.commands.specs.get('file.recent.1')?.when(undefined)).toBe(
      'The file was moved or deleted.',
    );
  });

  it('T-0888 · UX BS3: renames a document, also the open one and its recent entry', async () => {
    const db = memoryDb();
    await db.putDocument(browserDocument('b1', 'Merge Sort'));
    await db.putDocument(browserDocument('b2', 'Quick Sort'));
    const { shell, editor, placeAnswers, titles } = setup({ db });
    await shell.start(editor);
    placeAnswers.push({ kind: 'open', key: 'b1' });
    await shell.openFromPicker();
    editor.prompts.push('Bubble Sort');
    await shell.places.rename('b1');
    expect((await db.document('b1'))?.name).toBe('Bubble Sort');
    expect(editor.opened.at(-1)?.store.name).toBe('Bubble Sort');
    expect(titles.at(-1)).toBe('Bubble Sort – AriadneNSD');
    expect(editor.commands.specs.get('file.recent.1')?.title).toBe('Bubble Sort (Browser)');
    editor.prompts.push('quick sort');
    await shell.places.rename('b1');
    expect(editor.notices.at(-1)).toBe('“Quick Sort” already exists in this browser.');
    editor.prompts.push(null);
    await shell.places.rename('b2');
    expect((await db.document('b2'))?.name).toBe('Quick Sort');
    await shell.places.rename('missing');
  });

  it('T-0889 · UX BS3: deletes after asking; the open document stays as a new unsaved one', async () => {
    const db = memoryDb();
    await db.putDocument(browserDocument('b1', 'Merge Sort'));
    await db.putDocument(browserDocument('b2', 'Quick Sort'));
    await db.putBackup({ key: 'b2', name: 'Quick Sort', snapshot: '{}', savedAt: 1 });
    const { shell, editor, placeAnswers } = setup({ db });
    await shell.start(editor);
    placeAnswers.push({ kind: 'open', key: 'b1' });
    await shell.openFromPicker();
    await shell.places.remove('b2');
    expect(await db.document('b2')).toBeUndefined();
    expect(await db.backup('b2')).toBeUndefined();
    await shell.places.remove('b1');
    expect(await db.documents()).toEqual([]);
    const reopened = editor.opened.at(-1);
    expect(reopened?.restored).toBe('{"snapshot":true}');
    expect(reopened?.store.place).toBe('file');
    expect(reopened?.store.name).toBe('Merge Sort.ns.svg');
    expect(editor.status().dirty).toBe(true);
    expect(editor.notices.at(-1)).toContain('“Merge Sort” was deleted from this browser.');
    expect(editor.commands.specs.has('file.recent.empty')).toBe(true);
  });

  it('T-0890 · UX BS3: a delete that is not confirmed keeps the document', async () => {
    const db = memoryDb();
    await db.putDocument(browserDocument('b1', 'Merge Sort'));
    const { shell, editor } = setup({ db, confirm: false });
    await shell.start(editor);
    await shell.places.remove('b1');
    await shell.places.remove('missing');
    expect(await db.documents()).toHaveLength(1);
  });

  it('T-0891 · UX BS3: exports one document to a file of its name', async () => {
    const db = memoryDb();
    await db.putDocument(browserDocument('b1', 'Merge Sort'));
    const { shell, editor } = setup({ db });
    await shell.start(editor);
    await shell.places.exportDocument('b1');
    expect(vi.mocked(download)).toHaveBeenCalledWith(
      'Merge Sort.ns.svg',
      savedFile,
      'image/svg+xml',
    );
    expect(editor.notices.at(-1)).toBe('Exported “Merge Sort.ns.svg”.');
    vi.mocked(download).mockImplementation(() => {
      throw new Error('blocked');
    });
    await shell.places.exportDocument('b1');
    expect(editor.notices.at(-1)).toBe('Could not export “Merge Sort”.');
    await shell.places.exportDocument('missing');
  });

  it('T-0892 · UX BS4: exports all to one zip and imports it back with numbered names', async () => {
    const db = memoryDb();
    await db.putDocument(browserDocument('b1', 'Merge Sort'));
    await db.putDocument(browserDocument('b2', 'Quick Sort'));
    const { shell, editor } = setup({ db });
    await shell.start(editor);
    expect((await shell.places.documents()).map((item) => item.name)).toEqual([
      'Merge Sort',
      'Quick Sort',
    ]);
    await shell.places.exportAll();
    const [name, blob, type] = vi.mocked(download).mock.calls[0] ?? [];
    expect(name).toBe('AriadneNSD-1970-01-01.zip');
    expect(type).toBe('application/zip');
    const bytes = new Uint8Array(await (blob as Blob).arrayBuffer());
    expect(Object.keys(unzipSync(bytes)).sort()).toEqual([
      'Merge Sort.ns.svg',
      'Quick Sort.ns.svg',
    ]);
    expect(editor.notices.at(-1)).toBe('Exported 2 documents to “AriadneNSD-1970-01-01.zip”.');
    vi.mocked(chooseFilesWithInput).mockResolvedValue([
      new File([bytes], 'backup.zip'),
      new File(['<svg xmlns="http://www.w3.org/2000/svg"/>'], 'plain.svg'),
      new File([savedFile], 'Heap Sort.ns.svg'),
    ]);
    await shell.places.importFiles();
    expect((await db.documents()).map((item) => item.name).sort()).toEqual([
      'Heap Sort',
      'Merge Sort',
      'Merge Sort (2)',
      'Quick Sort',
      'Quick Sort (2)',
    ]);
    expect(editor.notices.at(-1)).toBe(
      'Imported 3 documents into this browser. Not imported, as they cannot be edited: plain.svg',
    );
  });

  it('T-0893 · UX BS4: nothing to export or import does nothing; a file that cannot be read is told', async () => {
    const { db, control } = countingDb();
    const { shell, editor } = setup({ db });
    await shell.start(editor);
    await shell.places.exportAll();
    expect(vi.mocked(download)).not.toHaveBeenCalled();
    vi.mocked(chooseFilesWithInput).mockResolvedValue([]);
    await shell.places.importFiles();
    const broken = new File(['x'], 'broken.zip');
    vi.spyOn(broken, 'arrayBuffer').mockRejectedValue(new Error('gone'));
    vi.mocked(chooseFilesWithInput).mockResolvedValue([broken]);
    await shell.places.importFiles();
    expect(editor.notices.at(-1)).toBe('Could not read “broken.zip”.');
    control.result = 'full';
    vi.mocked(chooseFilesWithInput).mockResolvedValue([new File([savedFile], 'a.ns.svg')]);
    await shell.places.importFiles();
    expect(editor.notices.at(-1)).toBe(
      'The browser’s storage is full, so it could not be saved. Save it to a file instead.',
    );
    control.result = 'ok';
    await db.putDocument(browserDocument('b1', 'A'));
    vi.mocked(download).mockImplementation(() => {
      throw new Error('blocked');
    });
    await shell.places.exportAll();
    expect(editor.notices.at(-1)).toBe('Could not export “AriadneNSD-1970-01-01.zip”.');
  });

  it('T-0894 · UX US1: "Save in Browser" saves the new document without the modal, then opens the other', async () => {
    const db = memoryDb();
    await db.putDocument(browserDocument('b1', 'Untitled'));
    const { shell, editor, placeRequests } = setup({ db });
    await shell.start(editor);
    editor.edit();
    editor.choices.push('second');
    await shell.newDocument();
    expect(placeRequests).toEqual([]);
    expect((await db.documents()).map((item) => item.name).sort()).toEqual([
      'Untitled',
      'Untitled (2)',
    ]);
    expect(editor.notices.at(-1)).toBe('Saved “Untitled (2)” in this browser.');
    expect(editor.status().name).toBe('Untitled.ns.svg');
  });

  it('T-0895 · UX US1: "Save in Browser" that fails keeps the new document', async () => {
    const { db, control } = countingDb();
    control.result = 'full';
    const { shell, editor } = setup({ db });
    await shell.start(editor);
    editor.edit();
    const before = editor.opened.length;
    editor.choices.push('second');
    await shell.newDocument();
    expect(editor.opened.length).toBe(before);
  });

  it('T-0896 · R-WEB-03: the backup of a browser document is restored as that browser document', async () => {
    const db = memoryDb();
    await db.putDocument(browserDocument('b1', 'Merge Sort'));
    await db.putBackup({ key: 'b1', name: 'Merge Sort', snapshot: '{"edited":1}', savedAt: 5 });
    const { shell, editor } = setup({ db, confirm: true });
    await shell.start(editor);
    expect(editor.opened.at(-1)?.restored).toBe('{"edited":1}');
    expect(editor.opened.at(-1)?.store.place).toBe('browser');
  });

  it('T-0897 · R-WEB-09: a browser document open in another tab is view only here', async () => {
    const connect = hub();
    const db = memoryDb();
    await db.putDocument(browserDocument('b1', 'Merge Sort'));
    const first = setup({ db, channel: connect(), tabId: 'one' });
    await first.shell.start(first.editor);
    first.placeAnswers.push({ kind: 'open', key: 'b1' });
    await first.shell.openFromPicker();
    const second = setup({ db, channel: connect(), tabId: 'two' });
    await second.shell.start(second.editor);
    second.placeAnswers.push({ kind: 'open', key: 'b1' });
    await second.shell.openFromPicker();
    expect(second.editor.opened.at(-1)?.readOnly).toBe(true);
  });
});
