// Building command specs (03-editor 5): the shared parts of the editor's command lists.
import type { CommandContext, CommandSpec, MenuPlace, ToolbarPlace } from '../contracts';
import type { EditorMessage, Message } from '../i18n/messages';
import { isMessageKey } from '../i18n/messages';
import type { EditorState } from '../state/editor-state';
import type { Selection, SelectionKind } from '../state/selection';

/** The catalog title of a command id: `command.<id>`. */
export function commandTitle(id: string): Message {
  const key = `command.${id}`;
  return isMessageKey(key) ? key : id;
}

/** `true` when a command applies, otherwise why not. */
export type Applies = true | EditorMessage;

/** What a command is made of. */
export type SpecParts = {
  readonly edits: boolean;
  readonly when: (state: EditorState, ctx: CommandContext) => Applies;
  readonly run: (state: EditorState, args: unknown, ctx: CommandContext) => void | Promise<void>;
  readonly menu?: MenuPlace;
  readonly toolbar?: ToolbarPlace;
  readonly context?: ReadonlyArray<SelectionKind>;
  readonly title?: Message | ((ctx: CommandContext) => Message);
  readonly checked?: (state: EditorState) => boolean;
  /**
   * The command also works on blocks shown inside an opened call block (R-EDIT-15). Other
   * commands that change the document refuse there: those blocks are the Method's, and editing
   * them would change every call of it (UX Q13).
   */
  readonly onPeek?: boolean;
};

/** Whether the selection is something shown inside an opened call block. */
export function isInsidePeek(selection: Selection | null): boolean {
  return (
    selection?.kind === 'peek' || (selection?.kind === 'fold' && (selection.path ?? []).length > 0)
  );
}

/** Makes a command spec. */
export function spec(id: string, parts: SpecParts): CommandSpec {
  const checked = parts.checked;
  return {
    id,
    title: parts.title ?? commandTitle(id),
    keys: [],
    edits: parts.edits,
    when: (ctx) =>
      parts.edits && parts.onPeek !== true && isInsidePeek(ctx.state.selection)
        ? 'reason.peekReadOnly'
        : parts.when(ctx.state, ctx),
    run: (ctx, args) => parts.run(ctx.state, args, ctx),
    ...(parts.menu === undefined ? {} : { menu: parts.menu }),
    ...(parts.toolbar === undefined ? {} : { toolbar: parts.toolbar }),
    ...(parts.context === undefined ? {} : { context: parts.context }),
    ...(checked === undefined ? {} : { checked: (ctx: CommandContext) => checked(ctx.state) }),
  };
}

/** A command that always applies. */
export const always = (): Applies => true;
