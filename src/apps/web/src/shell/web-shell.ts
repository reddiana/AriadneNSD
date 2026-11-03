// The web shell (06-web): opens and saves files and documents in this browser, keeps local
// backups and recent files, auto saves, and adds its commands to the editor's command list
// (03-editor 6.1).

import type { Doc, Locale, OpenFailureReason } from '@ariadne-nsd/core';
import { headName, openSvgFile, parseModel } from '@ariadne-nsd/core';

import type {
  CommandSpec,
  DocStatus,
  EditorHandle,
  OpenedDocument,
  PlaceSide,
  SettingsStore,
  WriteResult,
} from '../editor-contract';
import { exportPdf, exportPng, exportSvg } from '../files/export-command';
import {
  chooseFileWithInput,
  chooseFilesWithInput,
  documentMediaType,
  download,
} from '../files/file-fallback';
import {
  baseName,
  documentFileName,
  isOpenableName,
  openableExtensions,
  windowTitle,
} from '../files/file-name';
import {
  droppedHandle,
  ensurePermission,
  isFileHandle,
  pickDocumentToSave,
  pickFileToOpen,
  pickZipToSave,
  writeToHandle,
} from '../files/file-system-access';
import type { ShareHost } from '../files/share-command';
import { copyShareLink } from '../files/share-command';
import type { ShareLinkFailure } from '../files/share-link';
import { readShareLink } from '../files/share-link';
import type { SavePlace, SaveSubject, StoreOrigin, Written } from '../files/web-document-store';
import { WebDocumentStore } from '../files/web-document-store';
import { isZip, unzipTexts, zipTexts } from '../files/zip';
import type { BrowserDb } from '../storage/browser-db';
import type { BrowserDocument } from '../storage/browser-documents';
import { byteSize, findByName, isSameName, uniqueName } from '../storage/browser-documents';
import type { RecentFile } from '../storage/recent-files';
import type { Places } from './places';
import { createPlaces } from './places';
import type { ShellMessageKey } from './messages';
import { shellMessage } from './messages';
import type { Channel } from './tab-lock';
import { createTabLock } from './tab-lock';
import type { Autosave, AutosaveOutcome, Clock, Debounce } from './timers';
import { autosaveDelay, backupDelay, createAutosave, createDebounce } from './timers';

/**
 * How the current document is left for another (UX US1): its changes kept in the local backup,
 * or discarded because the user chose so.
 */
type Leave = 'keep' | 'discard';

/** The product name, in the browser tab title. */
const appName = 'AriadneNSD';

/** The user setting that turns auto save off (06-web 7 "환경 설정"). On by default (UX W3-b). */
export const autosaveSettingKey = 'file.autoSave';
/** Remembers that the "this browser downloads" notice was shown (06-web 1: once). */
const downloadNoticeKey = 'web.downloadNoticeShown';
/** The side of the open · save modal used last in this browser (UX BS1). */
export const placeSideKey = 'web.placeSide';
/** Remembers that persistent storage was asked for once (06-web 1.3). */
const persistAskedKey = 'web.persistAsked';

/**
 * The ids of the commands the shell adds (03-editor 6.1). Save and save as are the editor's own
 * (`file.save`, `file.saveAs`); they reach the shell through the `DocumentStore`.
 */
export const shellCommandIds = {
  newDocument: 'file.new',
  open: 'file.open',
  exportPng: 'file.export.png',
  share: 'file.share',
  exportSvg: 'file.export.svg',
  exportPdf: 'file.export.pdf',
  print: 'file.print',
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
  /** Making share links (R-WEB-05): this page's address, the compressor and the clipboard. */
  readonly share: Pick<ShareHost, 'page' | 'deflate' | 'copyText'>;
  /**
   * Asks the browser not to clear this site's storage first when space runs low
   * (`navigator.storage.persist`). Absent: the browser has no such API.
   */
  readonly persistStorage?: () => Promise<boolean>;
  /** The bundled TTF, whose outlines draw the text of a PDF (R-EXP-03). Loaded once. */
  readonly fontFile: () => Promise<Uint8Array>;
  /** The browser's language (`navigator.language`): the paper of PDF and print. */
  readonly languageTag: string;
  /** File › Print… (R-EXP-03): `false` if the pages could not be made. */
  readonly print: () => boolean;
};

/** The running shell. Create it with `createWebShell`, then `start` it with an editor. */
export type WebShell = {
  /**
   * Opens the first document and wires the editor: the share link `fragment` (the URL's `#…`)
   * in view mode if there is one and it opens (R-WEB-05, R-WEB-06), otherwise the local backup
   * if the user wants it restored.
   */
  readonly start: (editor: EditorHandle, fragment?: string) => Promise<void>;
  /** The document the editor shows first: a new document. Restores happen in `start`. */
  readonly initialDocument: () => OpenedDocument;
  readonly newDocument: () => Promise<void>;
  /** Opens a ready-made document (an example) as a new document with this file name. */
  readonly openDocument: (doc: Doc, name: string) => Promise<void>;
  readonly openFromPicker: () => Promise<void>;
  /** Opens a file's content (from `<input type="file">` or a drop without a handle). */
  readonly openFile: (file: File) => Promise<void>;
  /** Opens a dropped file (06-web 1). Call from the `drop` handler, synchronously. */
  readonly openDropped: (transfer: DataTransfer) => void;
  /** Opens a share link's fragment (the URL's `#…`) in view mode, as a new document (R-WEB-05). */
  readonly openShareLink: (fragment: string) => Promise<void>;
  /** Whether the document is shown in view mode (R-WEB-06). */
  readonly isViewing: () => boolean;
  /** Hears when view mode starts or ends. Returns the unsubscribe. */
  readonly onViewMode: (listener: (isViewing: boolean) => void) => () => void;
  /** "Edit" in view mode: the same document, now editable (UX SH4). */
  readonly startEditing: () => void;
  /** Writes the backup now and lets go of the file (the page is hiding). */
  readonly suspend: () => void;
  readonly isDirty: () => boolean;
  /** The screen language changed (preferences): the shell's command names follow. */
  readonly setLocale: (locale: Locale) => void;
  /** The open · save modal's host, for the editor's UI (R-WEB-09, UX BS1). */
  readonly places: Places;
  readonly dispose: () => void;
};

/** Creates the web shell. */
export function createWebShell(options: WebShellOptions): WebShell {
  const { db, settings } = options;
  let locale = options.locale;
  const text = (key: ShellMessageKey, values?: Readonly<Record<string, string>>): string =>
    shellMessage(locale, key, values);
  const untitledName = documentFileName('', text('file.untitled'));
  const places = createPlaces({
    documents: async () =>
      (await db.documents()).map(({ key, name, savedAt, size }) => ({ key, name, savedAt, size })),
    rename: renameBrowserDocument,
    exportDocument: exportBrowserDocument,
    remove: deleteBrowserDocument,
    exportAll: exportAllBrowserDocuments,
    importFiles: importBrowserDocuments,
  });
  /** A notice to show after the next document opens (it empties the status bar). */
  let pendingNotice: string | null = null;
  /** US1 "Save in Browser": the next save goes to this browser without the modal. */
  let isNextSaveToBrowser = false;

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
  /** View mode (R-WEB-06): a share link's document, read only, without the editing UI. */
  let isViewing = false;
  const viewListeners = new Set<(isViewing: boolean) => void>();
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
        chooseSavePlace,
        writeBrowser,
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
    const canWrite =
      store.place === 'browser' || (options.canWriteInPlace && store.handle !== null);
    return canWrite && settings.get<boolean>(autosaveSettingKey) !== false;
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
        written.isBrowser === true
          ? { kind: 'browser' }
          : written.handle === undefined
            ? { kind: 'copy', text: written.svg }
            : { kind: 'handle', handle: written.handle },
    });
  }

  // --- Documents in this browser (06-web 1.3, R-WEB-09) ---

  function placeSide(): PlaceSide {
    return settings.get<PlaceSide>(placeSideKey) === 'browser' ? 'browser' : 'computer';
  }

  function rememberSide(side: PlaceSide): void {
    settings.set(placeSideKey, side);
  }

  /** The name a document gets in this browser: its first diagram's header name (06-web 1.3). */
  function suggestedBrowserName(svg: string): string {
    const opened = openSvgFile(svg);
    const head = opened.ok ? (opened.value.doc.content.diagrams[0]?.head ?? null) : null;
    const name = head === null ? '' : headName(head);
    return name === '' ? text('file.untitled') : name;
  }

  /**
   * Save As and a new document's first save (UX BS1): asks where in the open · save modal. A name
   * that is taken asks to replace that document; "no" goes back to the modal.
   */
  async function chooseSavePlace(subject: SaveSubject): Promise<SavePlace | null> {
    let name = subject.isBrowser ? subject.name : suggestedBrowserName(subject.svg);
    if (isNextSaveToBrowser) {
      // UX US1 "Save in Browser": no modal, a name that is free.
      isNextSaveToBrowser = false;
      const taken = (await db.documents()).map((document) => document.name);
      return { kind: 'browser', name: uniqueName(name, taken), key: options.newKey() };
    }
    for (;;) {
      const answer = await places.ask({
        mode: 'save',
        side: placeSide(),
        name,
        currentKey: subject.isBrowser ? subject.key : null,
        isDownload: !options.canWriteInPlace,
      });
      if (answer === null || answer.kind === 'open') {
        return null;
      }
      if (answer.kind === 'computer') {
        rememberSide('computer');
        return { kind: 'computer' };
      }
      rememberSide('browser');
      name = answer.name.trim() === '' ? text('file.untitled') : answer.name.trim();
      const clash = findByName(await db.documents(), name);
      if (clash === undefined) {
        return {
          kind: 'browser',
          name,
          key: subject.isBrowser && isSameName(subject.name, name) ? subject.key : options.newKey(),
        };
      }
      if (
        clash.key === subject.key ||
        (editor !== null &&
          (await editor.confirm(text('notice.replace', { name: clash.name }), {
            confirm: text('choice.replace'),
          })))
      ) {
        return { kind: 'browser', name, key: clash.key };
      }
    }
  }

  /** Writes a document to this browser; a full storage is told in the shell's words (06-web 1.3). */
  async function writeBrowser(entry: {
    readonly key: string;
    readonly name: string;
    readonly svg: string;
  }): Promise<WriteResult> {
    await askPersistOnce();
    const result = await db.putDocument({
      key: entry.key,
      name: entry.name,
      text: entry.svg,
      savedAt: options.now(),
      size: byteSize(entry.svg),
    });
    switch (result) {
      case 'ok':
        return { ok: true, name: entry.name };
      case 'full':
        return {
          ok: false,
          reason: 'failed',
          detail: 'browser storage is full',
          message: text('notice.browserFull'),
        };
      case 'failed':
        return { ok: false, reason: 'failed', detail: 'browser storage write failed' };
    }
  }

  /** The first save to this browser asks it to keep the site's storage (06-web 1.3). */
  async function askPersistOnce(): Promise<void> {
    if (options.persistStorage === undefined || settings.get<boolean>(persistAskedKey) === true) {
      return;
    }
    settings.set(persistAskedKey, true);
    try {
      const isPersisted = await options.persistStorage();
      options.log(`Persistent storage ${isPersisted ? 'granted' : 'not granted'}`);
    } catch (error) {
      options.log(`Persistent storage request failed: ${String(error)}`);
    }
  }

  async function openBrowserDocument(key: string, fallbackName: string): Promise<void> {
    const document = await db.document(key);
    if (document === undefined) {
      missingKeys.add(key);
      notices.show(text('notice.browserMissing', { name: fallbackName }), 'warn');
      registerRecent();
      return;
    }
    await openText(document.text, key, document.name, { kind: 'browser', text: document.text });
  }

  /** Refreshes the name and chip in the editor after the store changed under it. */
  function refreshStatus(): void {
    // setReadOnly emits the status again, which reads the store's name and place.
    editor?.setReadOnly(isReadOnly);
  }

  async function renameBrowserDocument(key: string): Promise<void> {
    const document = await db.document(key);
    if (document === undefined || editor === null) {
      return;
    }
    const answer = await editor.prompt(text('notice.renamePrompt'), document.name);
    const name = answer?.trim() ?? '';
    if (name === '' || name === document.name) {
      return;
    }
    const clash = findByName(await db.documents(), name);
    if (clash !== undefined && clash.key !== key) {
      notices.show(text('notice.nameTaken', { name: clash.name }), 'warn');
      return;
    }
    if ((await db.putDocument({ ...document, name })) !== 'ok') {
      notices.show(text('notice.browserFull'), 'warn');
      return;
    }
    const entry = recent.find((item) => item.key === key);
    if (entry !== undefined) {
      await remember({ ...entry, name });
    }
    if (store.key === key) {
      store.renameBrowser(name);
      refreshStatus();
    }
  }

  async function exportBrowserDocument(key: string): Promise<void> {
    const document = await db.document(key);
    if (document === undefined) {
      return;
    }
    const name = documentFileName(document.name, untitledName);
    try {
      const saved = await saveToComputer(
        name,
        document.text,
        documentMediaType,
        pickDocumentToSave,
      );
      if (saved !== null) {
        notices.show(text('notice.exported', { name: saved }), 'info');
      }
    } catch (error) {
      options.log(`Export of ${document.name} failed: ${String(error)}`);
      notices.show(text('notice.exportDocumentFailed', { name: document.name }), 'warn');
    }
  }

  /**
   * Saves a file on this computer: the save dialog (Chromium) or a download. Resolves with the
   * file's name, or `null` when the user closed the dialog.
   */
  async function saveToComputer(
    name: string,
    data: string | Blob,
    type: string,
    pick: (name: string) => Promise<FileSystemFileHandle | null>,
  ): Promise<string | null> {
    if (!options.canWriteInPlace) {
      download(name, data, type);
      return name;
    }
    const handle = await pick(name);
    if (handle === null) {
      return null;
    }
    await writeToHandle(handle, data);
    return handle.name;
  }

  async function deleteBrowserDocument(key: string): Promise<void> {
    const document = await db.document(key);
    if (document === undefined || editor === null) {
      return;
    }
    const isSure = await editor.confirm(text('notice.deleteBrowser', { name: document.name }), {
      confirm: text('choice.delete'),
    });
    if (!isSure) {
      return;
    }
    await db.deleteDocument(key);
    await db.forgetRecent(key);
    recent = await db.recentFiles();
    registerRecent();
    if (store.key !== key || store.place !== 'browser') {
      await db.deleteBackup(key);
      return;
    }
    // The open document stays on the screen as a new document that is not saved (06-web 1.3).
    const snapshot = editor.snapshot();
    store = newStore(key, documentFileName(document.name, untitledName), { kind: 'none' });
    lastRevision = -1;
    editor.open({ store, text: null, restored: snapshot });
    notices.show(text('notice.deletedOpen', { name: document.name }), 'info');
  }

  async function exportAllBrowserDocuments(): Promise<void> {
    const documents = await db.documents();
    if (documents.length === 0) {
      return;
    }
    const taken: string[] = [];
    const entries = documents.map((document) => {
      const fileName = documentFileName(
        uniqueName(document.name, taken.map(baseName)),
        untitledName,
      );
      taken.push(fileName);
      return { name: fileName, text: document.text };
    });
    const name = `${appName}-${isoDate(options.now())}.zip`;
    try {
      const zip = await zipTexts(entries);
      const blob = new Blob([zip as Uint8Array<ArrayBuffer>], { type: 'application/zip' });
      const saved = await saveToComputer(name, blob, 'application/zip', pickZipToSave);
      if (saved !== null) {
        notices.show(
          text('notice.exportedAll', { count: String(documents.length), name: saved }),
          'info',
        );
      }
    } catch (error) {
      options.log(`Export of all browser documents failed: ${String(error)}`);
      notices.show(text('notice.exportDocumentFailed', { name }), 'warn');
    }
  }

  /**
   * Import from Files… (UX BS4): `.ns.svg` and `.ns` files, or a zip of them, become documents
   * in this browser. A name that is taken gets a number; files that cannot be edited are left out.
   */
  async function importBrowserDocuments(): Promise<void> {
    const files = await chooseFilesWithInput([...openableExtensions, '.zip', 'image/svg+xml']);
    if (files.length === 0) {
      return;
    }
    const texts: { readonly name: string; readonly text: string }[] = [];
    for (const file of files) {
      try {
        const bytes = new Uint8Array(await file.arrayBuffer());
        if (isZip(bytes)) {
          texts.push(...(await unzipTexts(bytes, isOpenableName)));
        } else {
          texts.push({ name: file.name, text: new TextDecoder().decode(bytes) });
        }
      } catch (error) {
        options.log(`Import of ${file.name} failed: ${String(error)}`);
        notices.show(text('notice.readFailed', { name: file.name }), 'warn');
        return;
      }
    }
    const taken = (await db.documents()).map((document) => document.name);
    const skipped: string[] = [];
    let imported = 0;
    for (const { name, text: fileText } of texts) {
      if (!openSvgFile(fileText).ok) {
        skipped.push(name);
        continue;
      }
      const documentName = uniqueName(baseName(name), taken);
      const document: BrowserDocument = {
        key: options.newKey(),
        name: documentName,
        text: fileText,
        savedAt: options.now(),
        size: byteSize(fileText),
      };
      if ((await db.putDocument(document)) !== 'ok') {
        notices.show(text('notice.browserFull'), 'warn');
        return;
      }
      taken.push(documentName);
      imported += 1;
    }
    const message = text('notice.imported', { count: String(imported) });
    notices.show(
      skipped.length === 0
        ? message
        : `${message} ${text('notice.importSkipped', { names: skipped.join(', ') })}`,
      skipped.length === 0 ? 'info' : 'warn',
    );
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
        : entry.source.kind === 'browser'
          ? `${entry.name} (${text('file.recent.browser')})`
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
      case 'browser':
        await openBrowserDocument(entry.key, entry.name);
        return;
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
    const leave = await mayLeave();
    if (leave === null) {
      return;
    }
    const key = knownKey ?? (await keyOf(origin, name));
    const saved = await db.backup(key);
    const restored = saved !== undefined && (await askRestore(name)) ? saved.snapshot : undefined;
    if (saved !== undefined && restored === undefined) {
      await db.deleteBackup(key);
    }
    await switchTo(newStore(key, name, origin), fileText, restored, leave);
    await remember({
      key,
      name,
      usedAt: options.now(),
      source:
        origin.kind === 'handle'
          ? origin
          : origin.kind === 'browser'
            ? { kind: 'browser' }
            : { kind: 'copy', text: fileText },
    });
  }

  async function switchTo(
    next: WebDocumentStore,
    fileText: string | null,
    restored: string | undefined,
    leave: Leave,
    doc?: Doc,
    isView = false,
  ): Promise<void> {
    if (editor === null) {
      return;
    }
    const leaving = leaveCurrent(leave);
    store = next;
    const isOwner = await lock.claim(next.key);
    isReadOnly = !isOwner || isView;
    setViewing(isView);
    autosave.dispose();
    autosave = createAutosave(autosaveOnce, autosaveDelay, options.clock);
    lastRevision = -1;
    editor.open({
      store: next,
      text: fileText,
      ...(isReadOnly ? { readOnly: true } : {}),
      ...(restored === undefined ? {} : { restored }),
      ...(doc === undefined ? {} : { doc }),
    });
    // Told after `open`, which empties the status bar.
    if (!isOwner) {
      notices.show(text('notice.otherTab'), 'warn');
    } else if (leaving !== null) {
      notices.show(leaving, 'info');
    } else if (pendingNotice !== null) {
      notices.show(pendingNotice, 'info');
    }
    pendingNotice = null;
    onStatus(editor.status());
  }

  /**
   * Before another document replaces this one: keeps its edits in the backup, unless the user
   * chose to discard them. Returns what to tell the user when they were not saved to the file,
   * or `null`.
   */
  function leaveCurrent(leave: Leave): string | null {
    if (editor === null) {
      return null;
    }
    const status = editor.status();
    if (leave === 'discard') {
      backup.cancel();
      void db.deleteBackup(store.key);
    } else {
      backup.flush();
    }
    lock.release();
    return status.dirty && !status.readOnly && leave === 'keep'
      ? text('notice.notSavedToFile', { name: status.name })
      : null;
  }

  /**
   * UX US1: before another document replaces a new document that was never saved and has
   * changes, asks to save it first, since its local backup could not be opened again.
   * Resolves how to leave it, or `null` to stay (cancelled, or the save did not finish).
   * A document opened from a file is left without asking: opening the file restores it.
   */
  async function mayLeave(): Promise<Leave | null> {
    if (editor === null || !store.isNew) {
      return 'keep';
    }
    const status = editor.status();
    if (!status.dirty || status.readOnly) {
      return 'keep';
    }
    const answer = await editor.choose(text('notice.saveNewFirst', { name: status.name }), {
      confirm: text('choice.save'),
      other: text('choice.discardAndOpen'),
      second: text('choice.saveInBrowser'),
    });
    switch (answer) {
      case 'cancel':
        return null;
      case 'other':
        return 'discard';
      case 'confirm':
        return (await editor.save()).ok ? 'keep' : null;
      case 'second': {
        isNextSaveToBrowser = true;
        const saved = await editor.save();
        isNextSaveToBrowser = false;
        if (!saved.ok) {
          return null;
        }
        pendingNotice = text('notice.savedInBrowser', { name: saved.name });
        return 'keep';
      }
    }
  }

  async function newDocument(): Promise<void> {
    const leave = await mayLeave();
    if (leave === null) {
      return;
    }
    await switchTo(
      newStore(options.newKey(), untitledName, { kind: 'none' }),
      null,
      undefined,
      leave,
    );
  }

  async function openDocument(doc: Doc, name: string): Promise<void> {
    const leave = await mayLeave();
    if (leave === null) {
      return;
    }
    await switchTo(newStore(options.newKey(), name, { kind: 'none' }), null, undefined, leave, doc);
  }

  /** File › Open… (UX BS1): asks where first, then a file or a document in this browser. */
  async function openFromPicker(): Promise<void> {
    const answer = await places.ask({
      mode: 'open',
      side: placeSide(),
      name: '',
      currentKey: store.place === 'browser' ? store.key : null,
      isDownload: false,
    });
    if (answer === null || answer.kind === 'save') {
      return;
    }
    if (answer.kind === 'open') {
      rememberSide('browser');
      const entry = (await db.documents()).find((document) => document.key === answer.key);
      await openBrowserDocument(answer.key, entry?.name ?? '');
      return;
    }
    rememberSide('computer');
    await openFromComputer();
  }

  /** The operating system's open dialog (06-web 1), behind "Files on This Computer". */
  async function openFromComputer(): Promise<void> {
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

  // --- Share links and view mode (06-web 3) ---

  function setViewing(next: boolean): void {
    if (next === isViewing) {
      return;
    }
    isViewing = next;
    for (const listener of [...viewListeners]) {
      listener(next);
    }
  }

  /** The document in a share link, checked like a file; or `null` after saying why not. */
  async function readShared(fragment: string): Promise<{ doc: Doc; name: string } | null> {
    const read = await readShareLink(fragment, options.share.deflate);
    if (!read.ok) {
      if (read.reason !== 'notShareLink') {
        options.log(`Cannot open the share link: ${read.reason}: ${read.detail}`);
        notices.show(text(linkFailureMessage(read.reason)), 'warn');
      }
      return null;
    }
    // The same validating parser as for a file (QA-02): a link is input from anyone.
    const parsed = parseModel(read.model, { locale });
    if (!parsed.ok) {
      options.log(`Cannot open the share link: ${parsed.reason}: ${parsed.detail}`);
      notices.show(
        text(parsed.reason === 'newerVersion' ? 'link.newerVersion' : 'link.damaged'),
        'warn',
      );
      return null;
    }
    return { doc: parsed.value.doc, name: documentFileName(read.name, text('file.untitled')) };
  }

  /** Opens a share link's document as a new document that was never saved, in view mode. */
  async function openShared(shared: { doc: Doc; name: string }, leave: Leave): Promise<void> {
    const next = newStore(options.newKey(), shared.name, { kind: 'none' });
    await switchTo(next, null, undefined, leave, shared.doc, true);
  }

  async function openShareLink(fragment: string): Promise<void> {
    const shared = await readShared(fragment);
    if (shared === null) {
      return;
    }
    const leave = await mayLeave();
    if (leave === null) {
      return;
    }
    await openShared(shared, leave);
  }

  function startEditing(): void {
    if (!isViewing || editor === null) {
      return;
    }
    setViewing(false);
    // A share link's document has a key of its own, so no other tab holds it.
    isReadOnly = false;
    editor.setReadOnly(false);
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
          await exportPng(editor, store.name, args, exportHost());
        },
      },
      {
        id: shellCommandIds.exportSvg,
        title: 'command.file.export.svg',
        keys: [],
        menu: { menu: 'file', group: 3, order: 2, submenu: 'export' },
        edits: false,
        when: () => true,
        run: async () => {
          if (editor === null) {
            return;
          }
          await exportSvg(editor, store.name, exportHost());
        },
      },
      {
        id: shellCommandIds.exportPdf,
        title: 'command.file.export.pdf',
        keys: [],
        menu: { menu: 'file', group: 3, order: 3, submenu: 'export' },
        edits: false,
        when: () => true,
        run: async () => {
          if (editor === null) {
            return;
          }
          await exportPdf(editor, store.name, {
            ...exportHost(),
            fontFile: options.fontFile,
            languageTag: options.languageTag,
          });
        },
      },
      {
        id: shellCommandIds.share,
        title: text('command.share'),
        keys: [],
        menu: { menu: 'file', group: 3, order: 2 },
        edits: false,
        when: () => true,
        run: async () => {
          if (editor === null) {
            return;
          }
          await copyShareLink(editor, store.name, {
            ...options.share,
            notify: notices.show,
            text,
            log: options.log,
          });
        },
      },
      {
        id: shellCommandIds.print,
        title: 'command.file.print',
        keys: ['Ctrl+P'],
        menu: { menu: 'file', group: 3, order: 10 },
        edits: false,
        when: () => true,
        run: () => {
          if (!options.print()) {
            notices.show(text('notice.printFailed'), 'warn');
          }
        },
      },
    ];
  }

  function exportHost(): Parameters<typeof exportSvg>[2] {
    return {
      canWriteInPlace: options.canWriteInPlace,
      notify: notices.show,
      text,
      log: options.log,
    };
  }

  // --- Start ---

  async function start(handle: EditorHandle, fragment?: string): Promise<void> {
    editor = handle;
    unregister.push(handle.onStatus(onStatus));
    registerShellCommands();
    recent = await db.recentFiles();
    registerRecent();
    const claimed = await lock.claim(store.key);
    isReadOnly = !claimed;
    onStatus(handle.status());
    const shared = fragment === undefined ? null : await readShared(fragment);
    if (shared === null) {
      await restoreLastBackup();
    } else {
      // The link is what the user came for: the local backup is asked about another time.
      await openShared(shared, 'keep');
    }
    // The page may have started in view mode for a link that did not open: tell the UI.
    for (const listener of [...viewListeners]) {
      listener(isViewing);
    }
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
    const inBrowser = await db.document(last.key);
    const origin: StoreOrigin =
      last.handle !== undefined
        ? { kind: 'handle', handle: last.handle }
        : inBrowser !== undefined
          ? { kind: 'browser', text: inBrowser.text }
          : copy?.source.kind === 'copy'
            ? { kind: 'copy', text: copy.source.text }
            : { kind: 'none' };
    await switchTo(newStore(last.key, last.name, origin), null, last.snapshot, 'keep');
  }

  return {
    start,
    initialDocument: () => ({ store, text: null }),
    newDocument,
    openDocument,
    openFromPicker,
    openFile,
    openDropped,
    openShareLink,
    isViewing: () => isViewing,
    onViewMode: (listener) => {
      viewListeners.add(listener);
      return () => {
        viewListeners.delete(listener);
      };
    },
    startEditing,
    suspend: () => {
      backup.flush();
    },
    isDirty: () => editor?.status().dirty === true,
    places,
    setLocale(next) {
      locale = next;
      if (editor !== null) {
        registerShellCommands();
        registerRecent();
      }
    },
    dispose() {
      places.answer(null);
      backup.flush();
      autosave.dispose();
      for (const remove of [...unregister, ...unregisterCommands, ...unregisterRecent]) {
        remove();
      }
      lock.dispose();
    },
  };
}

function linkFailureMessage(reason: Exclude<ShareLinkFailure, 'notShareLink'>): ShellMessageKey {
  switch (reason) {
    case 'newerVersion':
      return 'link.newerVersion';
    case 'tooLarge':
      return 'link.tooLarge';
    case 'unsupported':
      return 'link.unsupported';
    case 'damaged':
      return 'link.damaged';
  }
}

/** `2026-11-03`: the date in a file name, in UTC. */
function isoDate(milliseconds: number): string {
  return new Date(milliseconds).toISOString().slice(0, 10);
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
