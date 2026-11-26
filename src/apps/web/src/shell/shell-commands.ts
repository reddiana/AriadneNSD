// The shell's commands (03-editor 5.1 file menu, 5.2 toolbar): new, open, export, share and
// print, added to the editor's command list (03-editor 6.1). Any shell adds such commands (common
// candidate); share and Open from Pasted JSON… are the web's.

import type { CommandSpec } from '../editor-contract';
import { exportPdf, exportPng, exportSvg } from '../files/export-command';
import { copyShareLink } from '../files/share-command';
import type { ShellContext } from './shell-context';

/**
 * The ids of the commands the shell adds (03-editor 6.1). Save and save as are the editor's own
 * (`file.save`, `file.saveAs`); they reach the shell through the `DocumentStore`.
 */
export const shellCommandIds = {
  newDocument: 'file.new',
  open: 'file.open',
  exportPng: 'file.export.png',
  share: 'file.share',
  openPasted: 'file.openPasted',
  exportSvg: 'file.export.svg',
  exportPdf: 'file.export.pdf',
  print: 'file.print',
  recentPrefix: 'file.recent.',
} as const;

export type ShellCommandsDeps = {
  readonly newDocument: () => Promise<void>;
  readonly openFromPicker: () => Promise<void>;
  readonly openFromPastedText: () => Promise<void>;
};

export type ShellCommands = {
  /** Adds a command to the editor's list. Returns the unregister. */
  readonly registerCommand: (spec: CommandSpec) => () => void;
  /** Registers the shell's commands again (their titles follow the screen language). */
  readonly registerShellCommands: () => void;
  /** Unregisters the shell's commands (the shell is disposed). */
  readonly unregisterAll: () => void;
};

export function createShellCommands(ctx: ShellContext, deps: ShellCommandsDeps): ShellCommands {
  const { options, state, text, notices } = ctx;
  let unregisterCommands: (() => void)[] = [];

  function registerCommand(spec: CommandSpec): () => void {
    if (state.editor === null) {
      throw new Error('The shell registers commands after start');
    }
    return state.editor.commands.register(spec);
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
        run: deps.newDocument,
      },
      {
        id: shellCommandIds.open,
        title: 'command.file.open',
        keys: [],
        menu: { menu: 'file', group: 1, order: 2 },
        toolbar: { group: 1, order: 2, icon: 'file.open' },
        edits: false,
        when: () => true,
        run: deps.openFromPicker,
      },
      {
        id: shellCommandIds.openPasted,
        title: text('command.openPasted'),
        keys: [],
        menu: { menu: 'file', group: 1, order: 3 },
        edits: false,
        when: () => true,
        run: deps.openFromPastedText,
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
          if (state.editor === null) {
            return;
          }
          await exportPng(state.editor, state.store.name, args, exportHost());
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
          if (state.editor === null) {
            return;
          }
          await exportSvg(state.editor, state.store.name, exportHost());
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
          if (state.editor === null) {
            return;
          }
          await exportPdf(state.editor, state.store.name, {
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
          if (state.editor === null) {
            return;
          }
          await copyShareLink(state.editor, state.store.name, {
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

  function unregisterAll(): void {
    for (const remove of unregisterCommands) {
      remove();
    }
  }

  return { registerCommand, registerShellCommands, unregisterAll };
}
