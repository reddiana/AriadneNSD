// The web shell (06-web): opens and saves files, keeps local backups and recent files, auto saves,
// and adds its commands to the editor's command list (03-editor 6.1).

import type { Locale, OpenFailureReason } from '@ariadne-nsd/core';
import { openSvgFile } from '@ariadne-nsd/core';

import type {
  CommandSpec,
  DocStatus,
  EditorHandle,
  OpenedDocument,
  SettingsStore,
} from '../editor-contract';
import { exportPng } from '../files/export-command';
import { chooseFileWithInput } from '../files/file-fallback';
import { documentFileName, windowTitle } from '../files/file-name';
import {
  droppedHandle,
  ensurePermission,
  isFileHandle,
  pickFileToOpen,
} from '../files/file-system-access';
import type { StoreOrigin, Written } from '../files/web-document-store';
import { WebDocumentStore } from '../files/web-document-store';
import type { BrowserDb } from '../storage/browser-db';
import type { RecentFile } from '../storage/recent-files';
import type { ShellMessageKey } from './messages';
import { shellMessage } from './messages';
import type { Channel } from './tab-lock';
import { createTabLock } from './tab-lock';
import type { Autosave, AutosaveOutcome, Clock, Debounce } from './timers';
import { autosaveDelay, backupDelay, createAutosave, createDebounce } from './timers';

/** The product name, in the browser tab title. */
const appName = 'AriadneNSD';

/** The user setting that turns auto save off (06-web 7 "환경 설정"). On by default (UX W3-b). */
export const autosaveSettingKey = 'file.autoSave';
/** Remembers that the "this browser downloads" notice was shown (06-web 1: once). */
const downloadNoticeKey = 'web.downloadNoticeShown';

/**
 * The ids of the commands the shell adds (03-editor 6.1). Save and save as are the editor's own
 * (`file.save`, `file.saveAs`); they reach the shell through the `DocumentStore`.
 */
export const shellCommandIds = {
  newDocument: 'file.new',
  open: 'file.open',
  exportPng: 'file.export.png',
  recentPrefix: 'file.recent.',
} as const;

/** What the shell is built from. Browser APIs are passed in where tests or the adapter need it. */
export type WebShellOptions = {
  readonly db: BrowserDb;
  readonly settings: SettingsStore;
  readonly locale: Locale;
  readonly canWriteInPlace: boolean;
  /** Tabs of this site tell each other which file they edit (06-web 2). `null`: no such API. */
  readonly channel: Channel | null;
  readonly tabId: string;
  readonly wait: (milliseconds: number) => Promise<void>;
  readonly clock: Clock;
  readonly newKey: () => string;
  readonly now: () => number;
  /** Sets the browser tab title. */
  readonly setTitle: (title: string) => void;
  readonly log: (detail: string) => void;
};

/** The running shell. Create it with `createWebShell`, then `start` it with an editor. */
export type WebShell = {
  /** Opens the first document (restoring a local backup if the user wants) and wires the editor. */
  readonly start: (editor: EditorHandle) => Promise<void>;
  /** The document the editor shows first: a new document. Restores happen in `start`. */
  readonly initialDocument: () => OpenedDocument;
  readonly newDocument: () => Promise<void>;
  readonly openFromPicker: () => Promise<void>;
  /** Opens a file's content (from `<input type="file">` or a drop without a handle). */
  readonly openFile: (file: File) => Promise<void>;
  /** Opens a dropped file (06-web 1). Call from the `drop` handler, synchronously. */
  readonly openDropped: (transfer: DataTransfer) => void;
  /** Writes the backup now and lets go of the file (the page is hiding). */
  readonly suspend: () => void;
  readonly isDirty: () => boolean;
  /** The screen language changed (preferences): the shell's command names follow. */
  readonly setLocale: (locale: Locale) => void;
  readonly dispose: () => void;
};

/** Creates the web shell. */
export function createWebShell(options: WebShellOptions): WebShell {
  const { db, settings } = options;
  let locale = options.locale;
  const text = (key: ShellMessageKey, values?: Readonly<Record<string, string>>): string =>
    shellMessage(locale, key, values);
  const untitledName = documentFileName('', text('file.untitled'));

  let editor: EditorHandle | null = null;
  /** Tells the user in the editor's status bar (06-web 7: one place for notices). */
  const notices = {
    show: (message: string, level: 'info' | 'warn'): void => {
      editor?.notify(message, level);
    },
  };
  let store: WebDocumentStore = newStore(options.newKey(), untitledName, { kind: 'none' });
  let recent: ReadonlyArray<RecentFile> = [];
  const missingKeys = new Set<string>();
  let lastRevision = -1;
  let isReadOnly = false;
  const unregister: (() => void)[] = [];
  let unregisterCommands: (() => void)[] = [];
  let unregisterRecent: (() => void)[] = [];
  const backup: Debounce = createDebounce(writeBackup, backupDelay, options.clock);
  let autosave: Autosave = createAutosave(autosaveOnce, autosaveDelay, options.clock);
  const lock = createTabLock(
    options.channel,
    options.tabId,
    {
      regained: () => {
        isReadOnly = false;
        editor?.setReadOnly(false);
        notices.show(text('notice.otherTabClosed'), 'info');
      },
    },
    options.wait,
  );

  function newStore(key: string, name: string, origin: StoreOrigin): WebDocumentStore {
    return new WebDocumentStore(
      {
        canWriteInPlace: options.canWriteInPlace,
        untitledName,
        newKey: options.newKey,
        written: (written) => {
          void onWritten(written);
        },
        downloading: noticeDownloadOnce,
        askDownloadName: (suggested) =>
          editor === null
            ? Promise.resolve(null)
            : editor.prompt(text('notice.askName'), suggested),
        log: options.log,
      },
      key,
      name,
      origin,
    );
  }

  function noticeDownloadOnce(): void {
    if (settings.get<boolean>(downloadNoticeKey) === true) {
      return;
    }
    settings.set(downloadNoticeKey, true);
    notices.show(text('notice.downloadInstead'), 'warn');
  }

  // --- Status: title, backup, auto save (03-editor 6.2) ---

  function onStatus(status: DocStatus): void {
    options.setTitle(windowTitle(status.name, status.dirty, appName));
    if (status.revision !== lastRevision) {
      lastRevision = status.revision;
      if (status.dirty && !status.readOnly) {
        backup.poke();
        if (isAutosaveOn()) {
          autosave.changed();
        }
      }
    }
  }

  function isAutosaveOn(): boolean {
    return (
      options.canWriteInPlace &&
      store.handle !== null &&
      settings.get<boolean>(autosaveSettingKey) !== false
    );
  }

  function writeBackup(): void {
    if (editor === null) {
      return;
    }
    const status = editor.status();
    if (!status.dirty || status.readOnly) {
      return;
    }
    const { handle } = store;
    void db.putBackup({
      key: store.key,
      name: status.name,
      snapshot: editor.snapshot(),
      savedAt: options.now(),
      ...(handle === null ? {} : { handle }),
    });
  }

  async function autosaveOnce(): Promise<AutosaveOutcome> {
    if (editor === null || !editor.status().dirty || isReadOnly || !isAutosaveOn()) {
      return 'skipped';
    }
    if (!(await store.canAutosave())) {
      // Not granted yet (opened, never saved) or lost: wait for Ctrl+S (06-web 2).
      return 'skipped';
    }
    const current = editor;
    const result = await store.quietly(() => current.save());
    if (result.ok) {
      return 'saved';
    }
    if (result.reason === 'denied') {
      notices.show(text('notice.autosaveStopped'), 'warn');
      return 'stop';
    }
    options.log(`Auto save failed: ${result.reason} ${result.detail ?? ''}`);
    return 'stop';
  }

  async function onWritten(written: Written): Promise<void> {
    backup.cancel();
    autosave.resume();
    await db.deleteBackup(written.previousKey);
    if (written.key !== written.previousKey) {
      await db.deleteBackup(written.key);
      lock.rename(written.key);
    }
    await remember({
      key: written.key,
      name: written.name,
      usedAt: options.now(),
      source:
        written.handle === undefined
          ? { kind: 'copy', text: written.svg }
          : { kind: 'handle', handle: written.handle },
    });
  }

  // --- Recent files (06-web 1.1) ---

  async function remember(entry: RecentFile): Promise<void> {
    missingKeys.delete(entry.key);
    await db.touchRecent(entry);
    recent = await db.recentFiles();
    registerRecent();
  }

  function registerRecent(): void {
    for (const remove of unregisterRecent) {
      remove();
    }
    unregisterRecent = [];
    if (editor === null) {
      return;
    }
    const entries = recent.length === 0 ? [null] : recent;
    entries.forEach((entry, index) => {
      unregisterRecent.push(registerCommand(recentCommand(entry, index)));
    });
  }

  function recentCommand(entry: RecentFile | null, index: number): CommandSpec {
    const place = { menu: 'file', group: 1, order: 100 + index, submenu: 'recent' } as const;
    if (entry === null) {
      return {
        id: `${shellCommandIds.recentPrefix}empty`,
        title: text('file.recent.empty'),
        keys: [],
        menu: place,
        edits: false,
        when: () => text('file.recent.empty'),
        run: () => undefined,
      };
    }
    const label =
      entry.source.kind === 'copy'
        ? `${entry.name} (${text('file.recent.browserCopy')})`
        : entry.name;
    return {
      id: `${shellCommandIds.recentPrefix}${String(index + 1)}`,
      title: label,
      keys: [],
      menu: place,
      edits: false,
      when: () => (missingKeys.has(entry.key) ? text('file.recent.missing') : true),
      run: () => openRecent(entry),
    };
  }

  async function openRecent(entry: RecentFile): Promise<void> {
    switch (entry.source.kind) {
      case 'copy':
        await openText(entry.source.text, entry.key, entry.name, {
          kind: 'copy',
          text: entry.source.text,
        });
        return;
      case 'handle': {
        const { handle } = entry.source;
        let fileText: string;
        try {
          if (!(await ensurePermission(handle, 'read', true))) {
            notices.show(text('notice.readFailed', { name: entry.name }), 'warn');
            return;
          }
          fileText = await (await handle.getFile()).text();
        } catch (error) {
          options.log(`Recent file ${entry.name} cannot be read: ${String(error)}`);
          missingKeys.add(entry.key);
          notices.show(`${entry.name}: ${text('file.recent.missing')}`, 'warn');
          registerRecent();
          return;
        }
        await openText(fileText, entry.key, entry.name, { kind: 'handle', handle });
        return;
      }
    }
  }

  // --- Opening (03-editor 6.1) ---

  /** The key of a file: the same as its recent entry, so its backup and tab lock match. */
  async function keyOf(origin: StoreOrigin, name: string): Promise<string> {
    for (const entry of recent) {
      if (origin.kind === 'handle' && entry.source.kind === 'handle') {
        if (await origin.handle.isSameEntry(entry.source.handle)) {
          return entry.key;
        }
      } else if (origin.kind === 'copy' && entry.source.kind === 'copy' && entry.name === name) {
        return entry.key;
      }
    }
    return options.newKey();
  }

  /** Checks the text first, so a file that cannot be edited never replaces the open document. */
  async function openText(
    fileText: string,
    knownKey: string | null,
    name: string,
    origin: StoreOrigin,
  ): Promise<void> {
    const opened = openSvgFile(fileText);
    if (!opened.ok) {
      options.log(`Cannot open ${name}: ${opened.reason}: ${opened.detail}`);
      notices.show(text(openFailureMessage(opened.reason), { name }), 'warn');
      return;
    }
    const key = knownKey ?? (await keyOf(origin, name));
    const saved = await db.backup(key);
    const restored = saved !== undefined && (await askRestore(name)) ? saved.snapshot : undefined;
    if (saved !== undefined && restored === undefined) {
      await db.deleteBackup(key);
    }
    await switchTo(newStore(key, name, origin), fileText, restored);
    await remember({
      key,
      name,
      usedAt: options.now(),
      source: origin.kind === 'handle' ? origin : { kind: 'copy', text: fileText },
    });
  }

  async function switchTo(
    next: WebDocumentStore,
    fileText: string | null,
    restored: string | undefined,
  ): Promise<void> {
    if (editor === null) {
      return;
    }
    const leaving = leaveCurrent();
    store = next;
    const isOwner = await lock.claim(next.key);
    isReadOnly = !isOwner;
    autosave.dispose();
    autosave = createAutosave(autosaveOnce, autosaveDelay, options.clock);
    lastRevision = -1;
    editor.open({
      store: next,
      text: fileText,
      ...(isReadOnly ? { readOnly: true } : {}),
      ...(restored === undefined ? {} : { restored }),
    });
    // Told after `open`, which empties the status bar.
    if (isReadOnly) {
      notices.show(text('notice.otherTab'), 'warn');
    } else if (leaving !== null) {
      notices.show(leaving, 'info');
    }
    onStatus(editor.status());
  }

  /**
   * Before another document replaces this one: keeps its edits in the backup. Returns what to
   * tell the user when they were not saved to the file, or `null`.
   */
  function leaveCurrent(): string | null {
    if (editor === null) {
      return null;
    }
    const status = editor.status();
    backup.flush();
    lock.release();
    return status.dirty && !status.readOnly
      ? text('notice.notSavedToFile', { name: status.name })
      : null;
  }

  async function newDocument(): Promise<void> {
    await switchTo(newStore(options.newKey(), untitledName, { kind: 'none' }), null, undefined);
  }

  async function openFromPicker(): Promise<void> {
    if (options.canWriteInPlace) {
      const handle = await pickFileToOpen();
      if (handle !== null) {
        await openHandle(handle);
      }
      return;
    }
    const file = await chooseFileWithInput();
    if (file !== null) {
      await openFile(file);
    }
  }

  async function openHandle(handle: FileSystemFileHandle): Promise<void> {
    let fileText: string;
    try {
      fileText = await (await handle.getFile()).text();
    } catch (error) {
      options.log(`Reading ${handle.name} failed: ${String(error)}`);
      notices.show(text('notice.readFailed', { name: handle.name }), 'warn');
      return;
    }
    await openText(fileText, null, handle.name, { kind: 'handle', handle });
  }

  async function openFile(file: File): Promise<void> {
    let fileText: string;
    try {
      fileText = await file.text();
    } catch (error) {
      options.log(`Reading ${file.name} failed: ${String(error)}`);
      notices.show(text('notice.readFailed', { name: file.name }), 'warn');
      return;
    }
    await openText(fileText, null, file.name, { kind: 'copy', text: fileText });
  }

  function openDropped(transfer: DataTransfer): void {
    const items = [...transfer.items].filter((item) => item.kind === 'file');
    if (items.length !== 1) {
      if (items.length > 1) {
        notices.show(text('notice.dropOne'), 'info');
      }
      return;
    }
    const [item] = items;
    if (item === undefined) {
      return;
    }
    // Both must be read now: the transfer is emptied when the drop event ends.
    const handlePromise = options.canWriteInPlace ? droppedHandle(item) : null;
    const file = item.getAsFile();
    void (async () => {
      const handle = handlePromise === null ? null : await handlePromise;
      if (handle !== null && isFileHandle(handle)) {
        await openHandle(handle);
      } else if (file !== null) {
        await openFile(file);
      }
    })();
  }

  // --- Commands (03-editor 5.1 file menu, 5.2 toolbar) ---

  function registerCommand(spec: CommandSpec): () => void {
    if (editor === null) {
      throw new Error('The shell registers commands after start');
    }
    return editor.commands.register(spec);
  }

  function registerShellCommands(): void {
    for (const remove of unregisterCommands) {
      remove();
    }
    unregisterCommands = shellCommands().map(registerCommand);
  }

  function shellCommands(): ReadonlyArray<CommandSpec> {
    return [
      {
        id: shellCommandIds.newDocument,
        title: 'command.file.new',
        keys: [],
        menu: { menu: 'file', group: 1, order: 1 },
        toolbar: { group: 1, order: 1, icon: 'file.new' },
        edits: false,
        when: () => true,
        run: newDocument,
      },
      {
        id: shellCommandIds.open,
        title: 'command.file.open',
        keys: [],
        menu: { menu: 'file', group: 1, order: 2 },
        toolbar: { group: 1, order: 2, icon: 'file.open' },
        edits: false,
        when: () => true,
        run: openFromPicker,
      },
      {
        id: shellCommandIds.exportPng,
        title: 'command.file.export.png',
        keys: [],
        menu: { menu: 'file', group: 3, order: 1, submenu: 'export' },
        toolbar: { group: 1, order: 4, icon: 'file.export' },
        edits: false,
        when: () => true,
        run: async (_context, args) => {
          if (editor === null) {
            return;
          }
          await exportPng(editor, store.name, args, {
            canWriteInPlace: options.canWriteInPlace,
            notify: notices.show,
            text,
            log: options.log,
          });
        },
      },
    ];
  }

  // --- Start ---

  async function start(handle: EditorHandle): Promise<void> {
    editor = handle;
    unregister.push(handle.onStatus(onStatus));
    registerShellCommands();
    recent = await db.recentFiles();
    registerRecent();
    const claimed = await lock.claim(store.key);
    isReadOnly = !claimed;
    onStatus(handle.status());
    await restoreLastBackup();
  }

  /** "Restore last time's changes?" in the editor's modal. */
  async function askRestore(name: string): Promise<boolean> {
    if (editor === null) {
      return false;
    }
    return editor.confirm(text('notice.restore', { name }), {
      confirm: text('choice.restore'),
      cancel: text('choice.discard'),
    });
  }

  /** "Restore last time's changes?" for the newest backup (06-web 2, R-WEB-03). */
  async function restoreLastBackup(): Promise<void> {
    const backups = [...(await db.backups())].sort((a, b) => b.savedAt - a.savedAt);
    const [last] = backups;
    if (last === undefined) {
      return;
    }
    if (!(await askRestore(last.name))) {
      await db.deleteBackup(last.key);
      return;
    }
    const copy = recent.find((entry) => entry.key === last.key && entry.source.kind === 'copy');
    const origin: StoreOrigin =
      last.handle !== undefined
        ? { kind: 'handle', handle: last.handle }
        : copy?.source.kind === 'copy'
          ? { kind: 'copy', text: copy.source.text }
          : { kind: 'none' };
    await switchTo(newStore(last.key, last.name, origin), null, last.snapshot);
  }

  return {
    start,
    initialDocument: () => ({ store, text: null }),
    newDocument,
    openFromPicker,
    openFile,
    openDropped,
    suspend: () => {
      backup.flush();
    },
    isDirty: () => editor?.status().dirty === true,
    setLocale(next) {
      locale = next;
      if (editor !== null) {
        registerShellCommands();
        registerRecent();
      }
    },
    dispose() {
      backup.flush();
      autosave.dispose();
      for (const remove of [...unregister, ...unregisterCommands, ...unregisterRecent]) {
        remove();
      }
      lock.dispose();
    },
  };
}

function openFailureMessage(reason: OpenFailureReason): ShellMessageKey {
  switch (reason) {
    case 'noModel':
      return 'open.noModel';
    case 'prototype':
      return 'open.prototype';
    case 'damaged':
      return 'open.damaged';
    case 'newerVersion':
      return 'open.newerVersion';
  }
}
