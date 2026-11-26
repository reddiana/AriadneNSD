// Status: the window title, the local backup and auto save (03-editor 6.2). Any shell needs
// this (common candidate); only "can it write" reads the web store's place and handle.

import type { DocStatus } from '../editor-contract';
import type { Written } from '../files/web-document-store';
import { windowTitle } from '../files/file-name';
import type { RecentFile } from '../storage/recent-files';
import type { ShellContext } from './shell-context';
import { appName } from './shell-context';
import type { TabLock } from './tab-lock';
import type { AutosaveOutcome, Debounce } from './timers';
import { backupDelay, createDebounce } from './timers';

/** The user setting that turns auto save off (06-web 7 "환경 설정"). On by default (UX W3-b). */
export const autosaveSettingKey = 'file.autoSave';

export type StatusDeps = {
  /** The tab lock follows a document whose key changed when it was saved. */
  readonly lock: Pick<TabLock, 'rename'>;
  /** Puts a written document first in the recent files. */
  readonly remember: (entry: RecentFile) => Promise<void>;
};

export type Status = {
  /** Writes the local backup a moment after the last change. */
  readonly backup: Debounce;
  /** The editor's status changed: the title, then the backup and auto save after an edit. */
  readonly onStatus: (status: DocStatus) => void;
  /** One auto save, for `createAutosave`. */
  readonly autosaveOnce: () => Promise<AutosaveOutcome>;
  /** The store wrote the document. */
  readonly onWritten: (written: Written) => Promise<void>;
};

export function createStatus(ctx: ShellContext, deps: StatusDeps): Status {
  const { options, state, text, notices } = ctx;
  const { db, settings } = options;
  const backup: Debounce = createDebounce(writeBackup, backupDelay, options.clock);

  function onStatus(status: DocStatus): void {
    options.setTitle(windowTitle(status.name, status.dirty, appName));
    if (status.revision !== state.lastRevision) {
      state.lastRevision = status.revision;
      if (status.dirty && !status.readOnly) {
        backup.poke();
        if (isAutosaveOn()) {
          state.autosave.changed();
        }
      }
    }
  }

  function isAutosaveOn(): boolean {
    const canWrite =
      state.store.place === 'browser' || (options.canWriteInPlace && state.store.handle !== null);
    return canWrite && settings.get<boolean>(autosaveSettingKey) !== false;
  }

  function writeBackup(): void {
    const { editor, store } = state;
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
    const { editor } = state;
    if (editor === null || !editor.status().dirty || state.isReadOnly || !isAutosaveOn()) {
      return 'skipped';
    }
    if (!(await state.store.canAutosave())) {
      // Not granted yet (opened, never saved) or lost: wait for Ctrl+S (06-web 2).
      return 'skipped';
    }
    const current = editor;
    const result = await state.store.quietly(() => current.save());
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
    state.autosave.resume();
    await db.deleteBackup(written.previousKey);
    if (written.key !== written.previousKey) {
      await db.deleteBackup(written.key);
      deps.lock.rename(written.key);
    }
    await deps.remember({
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

  return { backup, onStatus, autosaveOnce, onWritten };
}
