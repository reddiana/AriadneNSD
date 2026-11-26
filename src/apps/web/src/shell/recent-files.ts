// Recent files (06-web 1.1): the File › Recent submenu, kept in IndexedDB with file handles,
// copies and documents in this browser. Web only: another shell has its own recent list.

import type { CommandSpec } from '../editor-contract';
import { ensurePermission } from '../files/file-system-access';
import type { RecentFile } from '../storage/recent-files';
import type { Opening } from './opening';
import type { ShellContext } from './shell-context';
import { shellCommandIds } from './shell-commands';

export type RecentFilesDeps = Pick<Opening, 'openText'> & {
  readonly registerCommand: (spec: CommandSpec) => () => void;
  readonly openBrowserDocument: (key: string, fallbackName: string) => Promise<void>;
};

export type RecentFiles = {
  /** Puts a file first in the recent files. */
  readonly remember: (entry: RecentFile) => Promise<void>;
  /** Registers the submenu's commands again from `state.recent`. */
  readonly registerRecent: () => void;
  /** Unregisters the submenu's commands (the shell is disposed). */
  readonly unregisterAll: () => void;
};

export function createRecentFiles(ctx: ShellContext, deps: RecentFilesDeps): RecentFiles {
  const { options, state, text, notices } = ctx;
  const { db } = options;
  let unregisterRecent: (() => void)[] = [];

  async function remember(entry: RecentFile): Promise<void> {
    state.missingKeys.delete(entry.key);
    await db.touchRecent(entry);
    state.recent = await db.recentFiles();
    registerRecent();
  }

  function registerRecent(): void {
    for (const remove of unregisterRecent) {
      remove();
    }
    unregisterRecent = [];
    if (state.editor === null) {
      return;
    }
    const entries = state.recent.length === 0 ? [null] : state.recent;
    entries.forEach((entry, index) => {
      unregisterRecent.push(deps.registerCommand(recentCommand(entry, index)));
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
      when: () => (state.missingKeys.has(entry.key) ? text('file.recent.missing') : true),
      run: () => openRecent(entry),
    };
  }

  async function openRecent(entry: RecentFile): Promise<void> {
    switch (entry.source.kind) {
      case 'browser':
        await deps.openBrowserDocument(entry.key, entry.name);
        return;
      case 'copy':
        await deps.openText(entry.source.text, entry.key, entry.name, {
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
          state.missingKeys.add(entry.key);
          notices.show(`${entry.name}: ${text('file.recent.missing')}`, 'warn');
          registerRecent();
          return;
        }
        await deps.openText(fileText, entry.key, entry.name, { kind: 'handle', handle });
        return;
      }
    }
  }

  function unregisterAll(): void {
    for (const remove of unregisterRecent) {
      remove();
    }
  }

  return { remember, registerRecent, unregisterAll };
}
