// The web shell (06-web): opens and saves files and documents in this browser, keeps local
// backups and recent files, auto saves, and adds its commands to the editor's command list
// (03-editor 6.1).
//
// The parts are in their own files (M77 R1). Every shell needs `status`, `opening` and
// `shell-commands`; `browser-documents`, `recent-files`, `share-view` and `paste-open` are the
// web's. This file builds the shared state (`shell-context`) once, wires the parts and starts.

import type { Doc, Locale } from '@ariadne-nsd/core';

import type { EditorHandle, OpenedDocument } from '../editor-contract';
import { documentFileName } from '../files/file-name';
import type { StoreOrigin } from '../files/web-document-store';
import { WebDocumentStore } from '../files/web-document-store';
import { createBrowserDocuments } from './browser-documents';
import { shellMessage } from './messages';
import { createOpening } from './opening';
import { createPasteOpen } from './paste-open';
import type { Places } from './places';
import { createRecentFiles } from './recent-files';
import { createShareView } from './share-view';
import type { ShellContext, ShellState, WebShellOptions } from './shell-context';
import { createShellCommands } from './shell-commands';
import { createStatus } from './status';
import { createTabLock } from './tab-lock';
import type { AutosaveOutcome } from './timers';
import { autosaveDelay, createAutosave } from './timers';

export type { WebShellOptions } from './shell-context';
export { autosaveSettingKey } from './status';
export { placeSideKey } from './browser-documents';
export { shellCommandIds } from './shell-commands';

/** Remembers that the "this browser downloads" notice was shown (06-web 1: once). */
const downloadNoticeKey = 'web.downloadNoticeShown';

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
  /**
   * A document pasted as text (R-WEB-11, UX JP1): the editor's paste asks the shell whether the
   * text is one, then has it opened as a new document (UX JP2). Give it to `createEditor`.
   */
  readonly pastedDocument: {
    readonly isDocument: (text: string) => boolean;
    readonly open: (text: string) => Promise<void>;
  };
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
  const untitledName = documentFileName('', shellMessage(options.locale, 'file.untitled'));
  const state: ShellState = {
    editor: null,
    store: newStore(options.newKey(), untitledName, { kind: 'none' }),
    locale: options.locale,
    recent: [],
    missingKeys: new Set<string>(),
    lastRevision: -1,
    isReadOnly: false,
    readOnlyReason: undefined,
    isViewing: false,
    pendingNotice: null,
    isNextSaveToBrowser: false,
    autosave: createAutosave(autosaveOnce, autosaveDelay, options.clock),
  };
  const ctx: ShellContext = {
    options,
    state,
    text: (key, values) => shellMessage(state.locale, key, values),
    notices: {
      show: (message, level) => {
        state.editor?.notify(message, level);
      },
    },
    untitledName,
  };
  const { text, notices } = ctx;
  const unregister: (() => void)[] = [];
  const lock = createTabLock(
    options.channel,
    options.tabId,
    {
      regained: () => {
        state.isReadOnly = false;
        state.readOnlyReason = undefined;
        state.editor?.setReadOnly(false);
        notices.show(text('notice.otherTabClosed'), 'info');
      },
    },
    options.wait,
  );

  // The parts call each other; a call to a part made further down goes through an arrow.
  const status = createStatus(ctx, {
    lock,
    remember: (entry) => recentFiles.remember(entry),
  });
  const browserDocuments = createBrowserDocuments(ctx, {
    openText: (fileText, knownKey, name, origin) =>
      opening.openText(fileText, knownKey, name, origin),
    newStore,
    remember: (entry) => recentFiles.remember(entry),
    registerRecent: () => {
      recentFiles.registerRecent();
    },
  });
  const opening = createOpening(ctx, {
    lock,
    backup: status.backup,
    autosaveOnce: status.autosaveOnce,
    onStatus: status.onStatus,
    setViewing: (next) => {
      shareView.setViewing(next);
    },
    newStore,
    remember: (entry) => recentFiles.remember(entry),
    places: browserDocuments.places,
    placeSide: browserDocuments.placeSide,
    rememberSide: browserDocuments.rememberSide,
    openBrowserDocument: browserDocuments.openBrowserDocument,
  });
  const shareView = createShareView(ctx, {
    newStore,
    switchTo: opening.switchTo,
    mayLeave: opening.mayLeave,
  });
  const pasteOpen = createPasteOpen(ctx, {
    readShared: shareView.readShared,
    explainLinkFailure: shareView.explainLinkFailure,
    newStore,
    switchTo: opening.switchTo,
    mayLeave: opening.mayLeave,
  });
  const commands = createShellCommands(ctx, {
    newDocument: opening.newDocument,
    openFromPicker: opening.openFromPicker,
    openFromPastedText: pasteOpen.openFromPastedText,
  });
  const recentFiles = createRecentFiles(ctx, {
    registerCommand: commands.registerCommand,
    openText: opening.openText,
    openBrowserDocument: browserDocuments.openBrowserDocument,
  });
  const { places } = browserDocuments;

  function newStore(key: string, name: string, origin: StoreOrigin): WebDocumentStore {
    return new WebDocumentStore(
      {
        canWriteInPlace: options.canWriteInPlace,
        untitledName,
        newKey: options.newKey,
        written: (written) => {
          void status.onWritten(written);
        },
        downloading: noticeDownloadOnce,
        askDownloadName: (suggested) =>
          state.editor === null
            ? Promise.resolve(null)
            : state.editor.prompt(text('notice.askName'), suggested),
        chooseSavePlace: (subject) => browserDocuments.chooseSavePlace(subject),
        writeBrowser: (entry) => browserDocuments.writeBrowser(entry),
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

  function autosaveOnce(): Promise<AutosaveOutcome> {
    return status.autosaveOnce();
  }

  // --- Start ---

  async function start(handle: EditorHandle, fragment?: string): Promise<void> {
    state.editor = handle;
    unregister.push(handle.onStatus(status.onStatus));
    commands.registerShellCommands();
    state.recent = await db.recentFiles();
    recentFiles.registerRecent();
    const claimed = await lock.claim(state.store.key);
    state.isReadOnly = !claimed;
    state.readOnlyReason = claimed ? undefined : 'otherTab';
    if (state.isReadOnly) {
      handle.setReadOnly(true, state.readOnlyReason);
    }
    status.onStatus(handle.status());
    const shared = fragment === undefined ? null : await shareView.readShared(fragment);
    if (shared === null) {
      await restoreLastBackup();
    } else {
      // The link is what the user came for: the local backup is asked about another time.
      await shareView.openShared(shared, 'keep');
    }
    // The page may have started in view mode for a link that did not open: tell the UI.
    shareView.tellViewMode();
  }

  /** "Restore last time's changes?" for the newest backup (06-web 2, R-WEB-03). */
  async function restoreLastBackup(): Promise<void> {
    const backups = [...(await db.backups())].sort((a, b) => b.savedAt - a.savedAt);
    const [last] = backups;
    if (last === undefined) {
      return;
    }
    if (!(await opening.askRestore(last.name))) {
      await db.deleteBackup(last.key);
      return;
    }
    const copy = state.recent.find(
      (entry) => entry.key === last.key && entry.source.kind === 'copy',
    );
    const inBrowser = await db.document(last.key);
    const origin: StoreOrigin =
      last.handle !== undefined
        ? { kind: 'handle', handle: last.handle }
        : inBrowser !== undefined
          ? { kind: 'browser', text: inBrowser.text }
          : copy?.source.kind === 'copy'
            ? { kind: 'copy', text: copy.source.text }
            : { kind: 'none' };
    await opening.switchTo(newStore(last.key, last.name, origin), null, last.snapshot, 'keep');
  }

  return {
    start,
    initialDocument: () => ({ store: state.store, text: null }),
    newDocument: opening.newDocument,
    openDocument: opening.openDocument,
    openFromPicker: opening.openFromPicker,
    openFile: opening.openFile,
    openDropped: opening.openDropped,
    openShareLink: shareView.openShareLink,
    pastedDocument: { isDocument: pasteOpen.isPastedDocument, open: pasteOpen.openPasted },
    isViewing: () => state.isViewing,
    onViewMode: shareView.onViewMode,
    startEditing: shareView.startEditing,
    suspend: () => {
      status.backup.flush();
    },
    isDirty: () => state.editor?.status().dirty === true,
    places,
    setLocale(next) {
      state.locale = next;
      if (state.editor !== null) {
        commands.registerShellCommands();
        recentFiles.registerRecent();
      }
    },
    dispose() {
      places.answer(null);
      status.backup.flush();
      state.autosave.dispose();
      for (const remove of unregister) {
        remove();
      }
      commands.unregisterAll();
      recentFiles.unregisterAll();
      lock.dispose();
    },
  };
}
