// The editor's own commands (03-editor 5): content commands, selection, view and file.
// The shell adds new · open · recent files, and the UI the palette, dialogs and help.
import type { CommandSpec } from '../contracts';
import { zoomRange } from '../state/editor-state';
import { branchCommands } from './branch-commands';
import { callCommands } from './call-commands';
import { clipboardCommands } from './clipboard-commands';
import { commandContext } from './command-helpers';
import type { CommandDeps } from './command-helpers';
import { cursorCommands } from './cursor-commands';
import { foldCommands } from './fold-commands';
import { fileCommands } from './file-commands';
import { insertWrapCommands } from './insert-wrap-commands';
import { methodCommands } from './method-commands';

export { commandTitle } from './spec';
export { blockKinds, wrapKinds } from './command-helpers';
export type { CommandDeps } from './command-helpers';

/** Makes the editor's commands. */
export function editorCommands(deps: CommandDeps): ReadonlyArray<CommandSpec> {
  const ctx = commandContext(deps);
  const { session } = ctx;
  const { insertSpecs, wrapSpecs, unwrapSpec } = insertWrapCommands(ctx);
  const { branchInsertSpec, branchDeleteSpec, convertIfSpec, convertCaseSpec } =
    branchCommands(ctx);
  const { cutSpec, copySpec, pasteSpec, deleteSpec } = clipboardCommands(ctx);
  const { undoSpec, redoSpec, textSpec, branchLabelSpec, moveSpec, selectionSpecs, zoomSpec } =
    cursorCommands(ctx);
  const { insertCallSpecs, setTargetSpec, makeMethodSpec, inlineMethodSpec, goToSpec } =
    callCommands(ctx);
  const { diagramSpecs } = methodCommands(ctx);
  const { fileSpecs } = fileCommands(ctx);

  return [
    ...fileSpecs,
    undoSpec,
    redoSpec,
    cutSpec,
    copySpec,
    pasteSpec('after', 'edit.paste', 4, { group: 3, order: 3, icon: 'edit.paste' }),
    pasteSpec('before', 'edit.pasteBefore', 3),
    deleteSpec,
    textSpec('edit.text', 'selectAll', { menu: 'edit', group: 3, order: 1 }),
    textSpec('edit.textStart', 'start'),
    textSpec('edit.textClear', 'clear'),
    branchLabelSpec,
    moveSpec('up', 1),
    moveSpec('down', 2),
    moveSpec('left', 3),
    moveSpec('right', 4),
    ...insertSpecs,
    ...insertCallSpecs,
    ...wrapSpecs,
    unwrapSpec,
    branchInsertSpec('after', 'branch.insert', 2),
    branchInsertSpec('before', 'branch.insertBefore', 1),
    branchDeleteSpec,
    convertIfSpec,
    convertCaseSpec,
    setTargetSpec,
    goToSpec,
    makeMethodSpec,
    inlineMethodSpec,
    ...diagramSpecs,
    ...selectionSpecs,
    zoomSpec('view.zoom.in', 1, (zoom) => zoom + zoomRange.step),
    zoomSpec('view.zoom.out', 2, (zoom) => zoom - zoomRange.step),
    zoomSpec('view.zoom.reset', 3, () => 1),
    ...foldCommands({ session }),
  ];
}
