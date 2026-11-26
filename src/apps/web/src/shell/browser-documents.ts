// Documents in this browser (06-web 1.3, R-WEB-09): the open · save modal's browser side, saving
// to and opening from IndexedDB, rename, delete, export and import. Web only: another shell keeps
// documents in its own place (an Obsidian vault, the file system).

import { headName, openSvgFile } from '@ariadne-nsd/core';

import type { PlaceSide, WriteResult } from '../editor-contract';
import { chooseFilesWithInput, documentMediaType, download } from '../files/file-fallback';
import { baseName, documentFileName, isOpenableName, openableExtensions } from '../files/file-name';
import { pickDocumentToSave, pickZipToSave, writeToHandle } from '../files/file-system-access';
import type { SavePlace, SaveSubject } from '../files/web-document-store';
import { isZip, unzipTexts, zipTexts } from '../files/zip';
import type { BrowserDocument } from '../storage/browser-documents';
import { byteSize, findByName, isSameName, uniqueName } from '../storage/browser-documents';
import type { RecentFile } from '../storage/recent-files';
import type { Places } from './places';
import { createPlaces } from './places';
import type { Opening } from './opening';
import type { NewStore, ShellContext } from './shell-context';
import { appName } from './shell-context';

/** The side of the open · save modal used last in this browser (UX BS1). */
export const placeSideKey = 'web.placeSide';
/** Remembers that persistent storage was asked for once (06-web 1.3). */
const persistAskedKey = 'web.persistAsked';

export type BrowserDocumentsDeps = Pick<Opening, 'openText'> & {
  readonly newStore: NewStore;
  readonly remember: (entry: RecentFile) => Promise<void>;
  readonly registerRecent: () => void;
};

export type BrowserDocuments = {
  /** The open · save modal's host, for the editor's UI (R-WEB-09, UX BS1). */
  readonly places: Places;
  readonly placeSide: () => PlaceSide;
  readonly rememberSide: (side: PlaceSide) => void;
  readonly chooseSavePlace: (subject: SaveSubject) => Promise<SavePlace | null>;
  readonly writeBrowser: (entry: {
    readonly key: string;
    readonly name: string;
    readonly svg: string;
  }) => Promise<WriteResult>;
  readonly openBrowserDocument: (key: string, fallbackName: string) => Promise<void>;
};

export function createBrowserDocuments(
  ctx: ShellContext,
  deps: BrowserDocumentsDeps,
): BrowserDocuments {
  const { options, state, text, notices, untitledName } = ctx;
  const { db, settings } = options;
  const places = createPlaces({
    documents: async () =>
      (await db.documents()).map(({ key, name, savedAt, size }) => ({ key, name, savedAt, size })),
    rename: renameBrowserDocument,
    exportDocument: exportBrowserDocument,
    remove: deleteBrowserDocument,
    exportAll: exportAllBrowserDocuments,
    importFiles: importBrowserDocuments,
  });

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
    if (state.isNextSaveToBrowser) {
      // UX US1 "Save in Browser": no modal, a name that is free.
      state.isNextSaveToBrowser = false;
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
      const { editor } = state;
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
      state.missingKeys.add(key);
      notices.show(text('notice.browserMissing', { name: fallbackName }), 'warn');
      deps.registerRecent();
      return;
    }
    await deps.openText(document.text, key, document.name, {
      kind: 'browser',
      text: document.text,
    });
  }

  /** Refreshes the name and chip in the editor after the store changed under it. */
  function refreshStatus(): void {
    // setReadOnly emits the status again, which reads the store's name and place.
    state.editor?.setReadOnly(state.isReadOnly, state.readOnlyReason);
  }

  async function renameBrowserDocument(key: string): Promise<void> {
    const document = await db.document(key);
    const { editor } = state;
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
    const entry = state.recent.find((item) => item.key === key);
    if (entry !== undefined) {
      await deps.remember({ ...entry, name });
    }
    if (state.store.key === key) {
      state.store.renameBrowser(name);
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
    const { editor } = state;
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
    state.recent = await db.recentFiles();
    deps.registerRecent();
    if (state.store.key !== key || state.store.place !== 'browser') {
      await db.deleteBackup(key);
      return;
    }
    // The open document stays on the screen as a new document that is not saved (06-web 1.3).
    const snapshot = editor.snapshot();
    state.store = deps.newStore(key, documentFileName(document.name, untitledName), {
      kind: 'none',
    });
    state.lastRevision = -1;
    editor.open({ store: state.store, text: null, restored: snapshot });
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

  return {
    places,
    placeSide,
    rememberSide,
    chooseSavePlace,
    writeBrowser,
    openBrowserDocument,
  };
}

/** `2026-11-03`: the date in a file name, in UTC. */
function isoDate(milliseconds: number): string {
  return new Date(milliseconds).toISOString().slice(0, 10);
}
