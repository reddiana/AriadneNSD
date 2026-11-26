// The file commands.
import type { CommandSpec } from '../contracts';
import { always, spec } from './spec';
import type { CommandContext } from './command-helpers';

export function fileCommands(ctx: CommandContext) {
  const { deps, pasting } = ctx;

  // File.
  const fileSpecs: ReadonlyArray<CommandSpec> = [
    spec('file.save', {
      edits: true,
      // A browser that cannot write the original file downloads instead (06-web 1).
      title: (ctx) => (ctx.store.canWriteInPlace ? 'command.file.save' : 'command.file.download'),
      when: always,
      run: async () => {
        await pasting.pending;
        await deps.save();
      },
      menu: { menu: 'file', group: 2, order: 1 },
      toolbar: { group: 1, order: 3, icon: 'file.save' },
    }),
    spec('file.saveAs', {
      edits: false,
      when: always,
      run: async () => {
        await pasting.pending;
        await deps.saveAs();
      },
      menu: { menu: 'file', group: 2, order: 2 },
    }),
  ];

  return { fileSpecs };
}
