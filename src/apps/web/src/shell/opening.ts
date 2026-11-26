// Opening (03-editor 6.1): checking a file before it replaces the open document, asking to save a
// new document first (UX US1), the tab lock and the backup to restore. Any shell needs this flow
// (common candidate). File › Open…'s modal, the open dialog and drops below it are the web's.

import type { Doc, OpenFailureReason } from '@ariadne-nsd/core';
import { openSvgFile } from '@ariadne-nsd/core';

import type { DocStatus, PlaceSide } from '../editor-contract';
import { chooseFileWithInput } from '../files/file-fallback';
import { droppedHandle, isFileHandle, pickFileToOpen } from '../files/file-system-access';
import type { StoreOrigin, WebDocumentStore } from '../files/web-document-store';
import type { RecentFile } from '../storage/recent-files';
import type { ShellMessageKey } from './messages';
import type { Places } from './places';
import type { Leave, NewStore, ShellContext } from './shell-context';
import type { TabLock } from './tab-lock';
import type { AutosaveOutcome, Debounce } from './timers';
import { autosaveDelay, createAutosave } from './timers';

export type OpeningDeps = {
  readonly lock: Pick<TabLock, 'claim' | 'release'>;
  readonly backup: Debounce;
  readonly autosaveOnce: () => Promise<AutosaveOutcome>;
  readonly onStatus: (status: DocStatus) => void;
  readonly setViewing: (next: boolean) => void;
  readonly newStore: NewStore;
  readonly remember: (entry: RecentFile) => Promise<void>;
  /** File › Open…'s modal and its "Documents in This Browser" side (UX BS1). Web only. */
  readonly places: Pick<Places, 'ask'>;
  readonly placeSide: () => PlaceSide;
  readonly rememberSide: (side: PlaceSide) => void;
  readonly openBrowserDocument: (key: string, fallbackName: string) => Promise<void>;
};

export type Opening = {
  /** Checks the text first, so a file that cannot be edited never replaces the open document. */
  readonly openText: (
    fileText: string,
    knownKey: string | null,
    name: string,
    origin: StoreOrigin,
  ) => Promise<void>;
  /** Shows the document of `next` in the editor, after leaving the current one. */
  readonly switchTo: (
    next: WebDocumentStore,
    fileText: string | null,
    restored: string | undefined,
    leave: Leave,
    doc?: Doc,
    isView?: boolean,
  ) => Promise<void>;
  /** UX US1: how to leave the current document, or `null` to stay. */
  readonly mayLeave: () => Promise<Leave | null>;
  /** "Restore last time's changes?" in the editor's modal. */
  readonly askRestore: (name: string) => Promise<boolean>;
  readonly newDocument: () => Promise<void>;
  readonly openDocument: (doc: Doc, name: string) => Promise<void>;
  readonly openFromPicker: () => Promise<void>;
  readonly openFile: (file: File) => Promise<void>;
  readonly openDropped: (transfer: DataTransfer) => void;
};

export function createOpening(ctx: ShellContext, deps: OpeningDeps): Opening {
  const { options, state, text, notices } = ctx;
  const { db } = options;
  const { lock, backup } = deps;

  /** The key of a file: the same as its recent entry, so its backup and tab lock match. */
  async function keyOf(origin: StoreOrigin, name: string): Promise<string> {
    for (const entry of state.recent) {
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
    await switchTo(deps.newStore(key, name, origin), fileText, restored, leave);
    await deps.remember({
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
    const { editor } = state;
    if (editor === null) {
      return;
    }
    const leaving = leaveCurrent(leave);
    state.store = next;
    const isOwner = await lock.claim(next.key);
    state.isReadOnly = !isOwner || isView;
    state.readOnlyReason = isOwner ? undefined : 'otherTab';
    deps.setViewing(isView);
    state.autosave.dispose();
    state.autosave = createAutosave(deps.autosaveOnce, autosaveDelay, options.clock);
    state.lastRevision = -1;
    const { isReadOnly, readOnlyReason } = state;
    editor.open({
      store: next,
      text: fileText,
      ...(isReadOnly ? { readOnly: true } : {}),
      ...(readOnlyReason === undefined ? {} : { readOnlyReason }),
      ...(restored === undefined ? {} : { restored }),
      ...(doc === undefined ? {} : { doc }),
    });
    // Told after `open`, which empties the status bar.
    if (!isOwner) {
      notices.show(text('notice.otherTab'), 'warn');
    } else if (leaving !== null) {
      notices.show(leaving, 'info');
    } else if (state.pendingNotice !== null) {
      notices.show(state.pendingNotice, 'info');
    }
    state.pendingNotice = null;
    deps.onStatus(editor.status());
  }

  /**
   * Before another document replaces this one: keeps its edits in the backup, unless the user
   * chose to discard them. Returns what to tell the user when they were not saved to the file,
   * or `null`.
   */
  function leaveCurrent(leave: Leave): string | null {
    if (state.editor === null) {
      return null;
    }
    const status = state.editor.status();
    if (leave === 'discard') {
      backup.cancel();
      void db.deleteBackup(state.store.key);
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
    const { editor } = state;
    if (editor === null || !state.store.isNew) {
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
        state.isNextSaveToBrowser = true;
        const saved = await editor.save();
        state.isNextSaveToBrowser = false;
        if (!saved.ok) {
          return null;
        }
        state.pendingNotice = text('notice.savedInBrowser', { name: saved.name });
        return 'keep';
      }
    }
  }

  async function askRestore(name: string): Promise<boolean> {
    if (state.editor === null) {
      return false;
    }
    return state.editor.confirm(text('notice.restore', { name }), {
      confirm: text('choice.restore'),
      cancel: text('choice.discard'),
    });
  }

  async function newDocument(): Promise<void> {
    const leave = await mayLeave();
    if (leave === null) {
      return;
    }
    await switchTo(
      deps.newStore(options.newKey(), ctx.untitledName, { kind: 'none' }),
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
    await switchTo(
      deps.newStore(options.newKey(), name, { kind: 'none' }),
      null,
      undefined,
      leave,
      doc,
    );
  }

  /** File › Open… (UX BS1): asks where first, then a file or a document in this browser. */
  async function openFromPicker(): Promise<void> {
    const answer = await deps.places.ask({
      mode: 'open',
      side: deps.placeSide(),
      name: '',
      currentKey: state.store.place === 'browser' ? state.store.key : null,
      isDownload: false,
    });
    if (answer === null || answer.kind === 'save') {
      return;
    }
    if (answer.kind === 'open') {
      deps.rememberSide('browser');
      const entry = (await db.documents()).find((document) => document.key === answer.key);
      await deps.openBrowserDocument(answer.key, entry?.name ?? '');
      return;
    }
    deps.rememberSide('computer');
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

  return {
    openText,
    switchTo,
    mayLeave,
    askRestore,
    newDocument,
    openDocument,
    openFromPicker,
    openFile,
    openDropped,
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
