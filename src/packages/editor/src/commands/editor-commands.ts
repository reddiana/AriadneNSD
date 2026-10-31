// The editor's own commands (03-editor 5): content commands, selection, view and file.
// The shell adds new · open · recent files, and the UI the palette, dialogs and help.
import type {
  Content,
  Id,
  IdGenerator,
  Locale,
  NewBlockKind,
  Result,
  Side,
  Target,
  WrapKind,
} from '@ariadne-nsd/core';
import {
  addDefaultBranch,
  convertCaseToIf,
  convertIfToCase,
  copy,
  cut,
  deleteBlocks,
  deleteBranch,
  insertBlock,
  insertBranch,
  move,
  moveBranch,
  paste,
  unwrap,
  wrap,
} from '@ariadne-nsd/core';

import { clipFromJson, clipFromText, clipToJson, clipToText } from '../clipboard/clip-format';
import type {
  CommandContext,
  CommandSpec,
  MenuPlace,
  ToolbarPlace,
  WriteResult,
} from '../contracts';
import type { EditorMessage, Message } from '../i18n/messages';
import { isMessageKey, message } from '../i18n/messages';
import type { DocIndex } from '../model/doc-index';
import {
  branchesOf,
  indexDoc,
  isBranching,
  isControl,
  placeOf,
  seqOfBlock,
} from '../model/doc-index';
import type { Navigation } from '../navigation/navigate';
import { navigate } from '../navigation/navigate';
import type { After, ClipboardPort, EditorSession } from '../session/session';
import type { Caret, EditField, EditorState } from '../state/editor-state';
import { zoomRange } from '../state/editor-state';
import type { Selection, SelectionKind } from '../state/selection';
import {
  diagramOf,
  extendBy,
  selectBlock,
  selectRange,
  selectedBlocks,
  targetOf,
} from '../state/selection';

/** What the editor's commands need besides the session. */
export type CommandDeps = {
  readonly session: EditorSession;
  readonly clipboard: ClipboardPort;
  readonly locale: () => Locale;
  readonly save: () => Promise<WriteResult>;
  readonly saveAs: () => Promise<WriteResult>;
  /** Sets the zoom, keeping the selection (or the middle) in place on the screen. */
  readonly zoomTo: (zoom: number) => void;
};

/** The block kinds in toolbar and menu order (06-web 7). */
export const blockKinds: ReadonlyArray<NewBlockKind> = [
  'process',
  'if',
  'case',
  'while',
  'for',
  'doWhile',
];

/** The kinds that can wrap blocks. */
export const wrapKinds: ReadonlyArray<WrapKind> = ['if', 'case', 'while', 'for', 'doWhile'];

const kindNames: Readonly<Record<string, string>> = {
  if: 'If',
  case: 'Case',
  while: 'While',
  for: 'For',
  doWhile: 'Do-While',
};

/** The catalog title of a command id: `command.<id>`. */
export function commandTitle(id: string): Message {
  const key = `command.${id}`;
  return isMessageKey(key) ? key : id;
}

type Applies = true | EditorMessage;

type SpecParts = {
  readonly edits: boolean;
  readonly when: (state: EditorState, ctx: CommandContext) => Applies;
  readonly run: (state: EditorState, args: unknown, ctx: CommandContext) => void | Promise<void>;
  readonly menu?: MenuPlace;
  readonly toolbar?: ToolbarPlace;
  readonly context?: ReadonlyArray<SelectionKind>;
  readonly title?: Message | ((ctx: CommandContext) => Message);
};

function spec(id: string, parts: SpecParts): CommandSpec {
  return {
    id,
    title: parts.title ?? commandTitle(id),
    keys: [],
    edits: parts.edits,
    when: (ctx) => parts.when(ctx.state, ctx),
    run: (ctx, args) => parts.run(ctx.state, args, ctx),
    ...(parts.menu === undefined ? {} : { menu: parts.menu }),
    ...(parts.toolbar === undefined ? {} : { toolbar: parts.toolbar }),
    ...(parts.context === undefined ? {} : { context: parts.context }),
  };
}

const always = (): Applies => true;

/** Reads `{ block: Id }` from command arguments. */
function blockArg(args: unknown): Id | null {
  if (
    typeof args === 'object' &&
    args !== null &&
    'block' in args &&
    typeof args.block === 'string'
  ) {
    return args.block;
  }
  return null;
}

/** Something found, or why not. */
type Found<T> = { readonly value: T } | { readonly reason: EditorMessage };

/** The only selected block, or why there is none. */
function oneBlock(index: DocIndex, selection: Selection | null): Found<Id> {
  const ids = selectedBlocks(index, selection);
  const [only] = ids;
  if (only === undefined) {
    return { reason: 'reason.nothingSelected' };
  }
  return ids.length === 1 ? { value: only } : { reason: 'reason.selectOneBlock' };
}

/** The branch holding a block, nearest first, or `null`. */
function branchAround(index: DocIndex, block: Id): Id | null {
  for (let id: Id | null = block; id !== null;) {
    const seq = seqOfBlock(index, id);
    if (seq.branch !== null) {
      return seq.branch;
    }
    id = seq.holder;
  }
  return null;
}

/** The branch a branch command acts on: the selected label, or the branch around the blocks. */
function branchOfSelection(index: DocIndex, selection: Selection | null): Found<Id> {
  if (selection?.kind === 'branchLabel') {
    return index.branches.has(selection.branch)
      ? { value: selection.branch }
      : { reason: 'reason.notFound' };
  }
  const [first] = selectedBlocks(index, selection);
  if (first === undefined) {
    return { reason: 'reason.selectBranchLabel' };
  }
  const branch = branchAround(index, first);
  return branch === null ? { reason: 'reason.selectInBranch' } : { value: branch };
}

/** `true` when found, otherwise the reason: the `when` of a command. */
function appliesIf<T>(found: Found<T>): Applies {
  return 'value' in found ? true : found.reason;
}

/** Which block a selection's range ends at, for deleting: the next, the previous, the holder. */
function selectionAfterDelete(index: DocIndex, ids: ReadonlyArray<Id>): Id | null {
  const [first] = ids;
  const last = ids.at(-1);
  if (first === undefined || last === undefined) {
    return null;
  }
  const seq = seqOfBlock(index, first);
  const next =
    seq.seq.blocks[placeOf(index, last).index + 1] ??
    seq.seq.blocks[placeOf(index, first).index - 1];
  return next?.id ?? seq.holder;
}

/** Selects the touched blocks of a result as one range, when they are blocks of one sequence. */
function selectTouched(content: Content, touched: ReadonlyArray<Id>): Selection | null {
  const index = indexDoc(content);
  const blocks = touched.filter((id) => index.blocks.has(id));
  const [first] = blocks;
  const last = blocks.at(-1);
  if (first === undefined || last === undefined) {
    return null;
  }
  return placeOf(index, first).owner === placeOf(index, last).owner
    ? selectRange(index, first, last)
    : selectBlock(index, first);
}

/** The diagram to insert into when nothing is selected: the last used one, or the first. */
function currentDiagram(index: DocIndex, state: EditorState): Id | null {
  const last = state.lastSelected;
  if (last !== null) {
    const place = index.blocks.get(last);
    if (place !== undefined) {
      return place.diagram;
    }
  }
  return diagramOf(index, state.selection) ?? index.content.diagrams[0]?.id ?? null;
}

/** The field the text edit commands open for the selection, or why there is none. */
function fieldOfSelection(index: DocIndex, selection: Selection | null): Found<EditField> {
  if (selection === null) {
    return { reason: 'reason.nothingSelected' };
  }
  switch (selection.kind) {
    case 'blocks': {
      const block = oneBlock(index, selection);
      return 'value' in block ? { value: { kind: 'block', block: block.value } } : block;
    }
    case 'branchLabel':
      return { value: { kind: 'branchLabel', branch: selection.branch } };
    case 'missingDefault':
      return { value: { kind: 'missingDefault', block: selection.block } };
    case 'head':
    case 'fold':
      return { reason: 'reason.unsupported' };
  }
}

/** Makes the editor's commands. */
export function editorCommands(deps: CommandDeps): ReadonlyArray<CommandSpec> {
  const { session } = deps;
  const index = (): DocIndex => session.index();
  const content = (): Content => session.state.doc.content;

  /** Puts the result of `op` into the empty default branch made for a Case (UX CD1). */
  const intoMissingDefault = (
    caseBlock: Id,
    op: (made: Content, empty: Id, ids: IdGenerator) => Result,
    after: Parameters<EditorSession['commit']>[1],
  ): void => {
    const ids = session.ids();
    const made = addDefaultBranch(content(), { block: caseBlock, ids });
    if (!made.ok) {
      session.refuse(made.reason);
      return;
    }
    const empty = made.touched[1];
    if (empty !== undefined) {
      session.commit(op(made.content, empty, ids), after);
    }
  };

  const afterInsert = (result: {
    readonly content: Content;
    readonly touched: ReadonlyArray<Id>;
  }): After => {
    const [made] = result.touched;
    if (made === undefined) {
      return { selection: session.state.selection };
    }
    return {
      selection: selectBlock(indexDoc(result.content), made),
      edit: { field: { kind: 'block', block: made }, caret: 'end' },
    };
  };

  // Insert, wrap.
  const insertWhen =
    (kind: NewBlockKind) =>
    (state: EditorState): Applies => {
      const selection = state.selection;
      if (selection?.kind === 'branchLabel') {
        return kind === 'process' ? true : 'reason.notOnBranchLabel';
      }
      if (selection?.kind === 'head' || selection?.kind === 'fold') {
        return 'reason.unsupported';
      }
      return true;
    };

  const runInsertBranch = (branch: Id, side: Side): void => {
    const place = index().branches.get(branch);
    const result = insertBranch(content(), { branch, side, ids: session.ids() });
    const isApplied = session.commit(result, (ok) => {
      const [made] = ok.touched;
      return made === undefined
        ? { selection: session.state.selection }
        : {
            selection: { kind: 'branchLabel', branch: made },
            edit: { field: { kind: 'branchLabel', branch: made }, caret: 'selectAll' },
          };
    });
    if (isApplied && place?.isDefault === true && side === 'after') {
      session.notify('notice.defaultStaysLast');
    }
  };

  const runInsert = (kind: NewBlockKind, side: Side): void => {
    const state = session.state;
    const selection = state.selection;
    if (selection?.kind === 'branchLabel') {
      runInsertBranch(selection.branch, side);
      return;
    }
    if (selection?.kind === 'missingDefault') {
      intoMissingDefault(
        selection.block,
        (made, empty, ids) =>
          insertBlock(made, {
            target: { kind: 'blocks', first: empty, last: empty },
            side,
            kind,
            ids,
          }),
        afterInsert,
      );
      return;
    }
    const diagram = currentDiagram(index(), state);
    const target: Target | null =
      targetOf(selection) ?? (diagram === null ? null : { kind: 'diagramEnd', diagram });
    if (target === null) {
      session.notify('reason.nothingSelected', 'warn');
      return;
    }
    session.commit(insertBlock(content(), { target, side, kind, ids: session.ids() }), afterInsert);
  };

  const insertSpecs = blockKinds.flatMap((kind, order) => [
    spec(`block.insert.${kind}`, {
      edits: true,
      when: insertWhen(kind),
      run: () => {
        runInsert(kind, 'after');
      },
      menu: { menu: 'diagram', group: 1, order: order + 1, submenu: 'insert' },
      toolbar: { group: 4, order: order + 1, icon: `block.${kind}` },
      context: ['blocks', 'missingDefault'],
    }),
    spec(`block.insertBefore.${kind}`, {
      edits: true,
      when: insertWhen(kind),
      run: () => {
        runInsert(kind, 'before');
      },
      menu: { menu: 'diagram', group: 1, order: order + 11, submenu: 'insertBefore' },
    }),
  ]);

  const wrapSpecs = wrapKinds.map((kind, order) =>
    spec(`block.wrap.${kind}`, {
      edits: true,
      when: (state) => {
        const selection = state.selection;
        if (selection?.kind === 'branchLabel') {
          return 'reason.undecidedOnBranchLabel';
        }
        return selection?.kind === 'blocks' ? true : 'reason.nothingSelected';
      },
      run: (state) => {
        const target = targetOf(state.selection);
        if (target === null) {
          return;
        }
        session.commit(wrap(content(), { target, kind, ids: session.ids() }), afterInsert);
      },
      menu: { menu: 'diagram', group: 2, order: order + 1, submenu: 'wrap' },
      context: ['blocks'],
    }),
  );

  const blocksOnly = (state: EditorState): Applies => {
    const selection = state.selection;
    if (selection?.kind === 'branchLabel') {
      return 'reason.undecidedOnBranchLabel';
    }
    if (selection?.kind === 'missingDefault') {
      return 'reason.noDefaultToDelete';
    }
    return selection?.kind === 'blocks' ? true : 'reason.nothingSelected';
  };

  const unwrapSpec = spec('block.unwrap', {
    edits: true,
    when: (state) => (state.selection?.kind === 'blocks' ? true : 'reason.nothingSelected'),
    run: (state) => {
      const target = targetOf(state.selection);
      if (target === null) {
        return;
      }
      const ix = index();
      const selected = selectedBlocks(ix, state.selection);
      const [only] = selected;
      const onlyBlock = only === undefined ? undefined : ix.blocks.get(only)?.block;
      const isWhole = selected.length === 1 && onlyBlock !== undefined && isControl(onlyBlock);
      // Which block goes: the selected control block, or the nearest one holding the selection.
      const holder = only === undefined ? null : seqOfBlock(ix, only).holder;
      const removed = isWhole
        ? onlyBlock
        : holder === null
          ? undefined
          : ix.blocks.get(holder)?.block;
      const isApplied = session.commit(unwrap(content(), { target, ids: session.ids() }), (ok) => ({
        selection: isWhole ? selectTouched(ok.content, ok.touched) : state.selection,
      }));
      if (isApplied && removed !== undefined) {
        session.notify(
          message('notice.unwrapped', { kind: kindNames[removed.kind] ?? removed.kind }),
        );
      }
    },
    menu: { menu: 'diagram', group: 2, order: 10 },
    context: ['blocks'],
  });

  // Branches.
  const branchInsertSpec = (side: Side, id: string, order: number): CommandSpec =>
    spec(id, {
      edits: true,
      when: (state) => appliesIf(branchOfSelection(index(), state.selection)),
      run: (state) => {
        const branch = branchOfSelection(index(), state.selection);
        if ('value' in branch) {
          runInsertBranch(branch.value, side);
        }
      },
      menu: { menu: 'diagram', group: 3, order },
      context: ['branchLabel'],
    });

  const branchDeleteSpec = spec('branch.delete', {
    edits: true,
    when: (state) => appliesIf(branchOfSelection(index(), state.selection)),
    run: (state) => {
      const branch = branchOfSelection(index(), state.selection);
      const place = 'value' in branch ? index().branches.get(branch.value) : undefined;
      if (place === undefined) {
        return;
      }
      session.commit(deleteBranch(content(), { branch: place.branch.id }), (ok) => {
        const after = indexDoc(ok.content).blocks.get(place.block.id)?.block;
        if (after === undefined || !isBranching(after)) {
          return { selection: null };
        }
        const branches = branchesOf(after);
        const next = branches[place.column] ?? branches[place.column - 1];
        return { selection: next === undefined ? null : { kind: 'branchLabel', branch: next.id } };
      });
    },
    menu: { menu: 'diagram', group: 3, order: 3 },
    context: ['branchLabel'],
  });

  /** The If or Case a convert command acts on: the argument, the selected block or label. */
  const convertTarget = (state: EditorState, args: unknown): Id | null => {
    const fromArgs = blockArg(args);
    if (fromArgs !== null) {
      return fromArgs;
    }
    const selection = state.selection;
    if (selection?.kind === 'branchLabel') {
      return index().branches.get(selection.branch)?.block.id ?? null;
    }
    const block = oneBlock(index(), selection);
    return 'value' in block ? block.value : null;
  };

  const convertIfSpec = spec('branch.convertIfToCase', {
    edits: true,
    when: (state) => {
      const id = convertTarget(state, undefined);
      return id !== null && index().blocks.get(id)?.block.kind === 'if' ? true : 'reason.notIf';
    },
    run: (state, args) => {
      const block = convertTarget(state, args);
      if (block === null) {
        return;
      }
      session.commit(convertIfToCase(content(), { block, ids: session.ids() }), (ok) => {
        const [made] = ok.touched;
        return made === undefined
          ? { selection: selectBlock(indexDoc(ok.content), block) }
          : {
              selection: { kind: 'branchLabel', branch: made },
              edit: { field: { kind: 'branchLabel', branch: made }, caret: 'selectAll' },
            };
      });
    },
  });

  const convertCaseSpec = spec('branch.convertCaseToIf', {
    edits: true,
    when: (state) => {
      const id = convertTarget(state, undefined);
      const block = id === null ? undefined : index().blocks.get(id)?.block;
      return block?.kind === 'case' && block.arms.length === 1 && block.otherwise !== null
        ? true
        : 'reason.notConvertible';
    },
    run: (state, args) => {
      const block = convertTarget(state, args);
      if (block !== null) {
        session.commit(convertCaseToIf(content(), { block }), (ok) => ({
          selection: selectBlock(indexDoc(ok.content), block),
        }));
      }
    },
  });

  // Clipboard and delete.
  const writeClip = async (
    clip: Parameters<typeof clipToText>[0],
    notice: EditorMessage,
  ): Promise<void> => {
    const where = await deps.clipboard.write({
      text: clipToText(clip, deps.locale()),
      json: clipToJson(clip),
    });
    session.notify(where === 'memory' ? 'notice.clipboardLocal' : notice);
  };

  const copySpec = spec('edit.copy', {
    edits: false,
    when: blocksOnly,
    run: async (state) => {
      const target = targetOf(state.selection);
      if (target === null) {
        return;
      }
      const copied = copy(content(), { target });
      if (!copied.ok) {
        session.refuse(copied.reason);
        return;
      }
      await writeClip(copied.clip, message('notice.copied', { count: copied.clip.blocks.length }));
    },
    menu: { menu: 'edit', group: 2, order: 2 },
    toolbar: { group: 3, order: 2, icon: 'edit.copy' },
    context: ['blocks'],
  });

  const cutSpec = spec('edit.cut', {
    edits: true,
    when: blocksOnly,
    run: async (state) => {
      const target = targetOf(state.selection);
      if (target === null) {
        return;
      }
      const ix = index();
      const next = selectionAfterDelete(ix, selectedBlocks(ix, state.selection));
      const result = cut(content(), { target, ids: session.ids() });
      if (!result.ok) {
        session.refuse(result.reason);
        return;
      }
      const isApplied = session.commit(result, (ok) => ({
        selection:
          next !== null
            ? selectBlock(indexDoc(ok.content), next)
            : selectTouched(ok.content, ok.touched),
      }));
      if (isApplied) {
        await writeClip(result.clip, message('notice.cut', { count: result.clip.blocks.length }));
      }
    },
    menu: { menu: 'edit', group: 2, order: 1 },
    toolbar: { group: 3, order: 1, icon: 'edit.cut' },
    context: ['blocks'],
  });

  const pasteSpec = (side: Side, id: string, order: number, toolbar?: ToolbarPlace): CommandSpec =>
    spec(id, {
      edits: true,
      when: (state) => {
        const selection = state.selection;
        if (selection?.kind === 'branchLabel') {
          return 'reason.undecidedOnBranchLabel';
        }
        return selection?.kind === 'blocks' || selection?.kind === 'missingDefault'
          ? true
          : 'reason.nothingSelected';
      },
      run: async () => {
        const data = await deps.clipboard.read();
        const clip =
          (data.json === null ? null : clipFromJson(data.json)) ??
          (data.text === null ? null : clipFromText(data.text));
        if (clip === null) {
          session.notify('reason.emptyClip', 'warn');
          return;
        }
        // The selection may have changed while the clipboard was read.
        const state = session.state;
        if (state.readOnly) {
          session.notify('reason.readOnly', 'warn');
          return;
        }
        const after = (ok: {
          readonly content: Content;
          readonly touched: ReadonlyArray<Id>;
        }): After => ({
          selection: selectTouched(ok.content, ok.touched),
        });
        const selection = state.selection;
        if (selection?.kind === 'missingDefault') {
          intoMissingDefault(
            selection.block,
            (made, empty, ids) =>
              paste(made, {
                target: { kind: 'blocks', first: empty, last: empty },
                side,
                clip,
                ids,
              }),
            after,
          );
          return;
        }
        const target = targetOf(selection);
        if (target !== null) {
          session.commit(paste(content(), { target, side, clip, ids: session.ids() }), after);
        }
      },
      menu: { menu: 'edit', group: 2, order },
      ...(toolbar === undefined ? {} : { toolbar }),
      context: ['blocks', 'missingDefault'],
    });

  const deleteSpec = spec('edit.delete', {
    edits: true,
    when: blocksOnly,
    run: (state) => {
      const target = targetOf(state.selection);
      if (target === null) {
        return;
      }
      const ix = index();
      const next = selectionAfterDelete(ix, selectedBlocks(ix, state.selection));
      session.commit(deleteBlocks(content(), { target, ids: session.ids() }), (ok) => ({
        selection:
          next !== null
            ? selectBlock(indexDoc(ok.content), next)
            : selectTouched(ok.content, ok.touched),
      }));
    },
    menu: { menu: 'edit', group: 2, order: 5 },
    context: ['blocks'],
  });

  // Move.
  const moveSpec = (direction: 'up' | 'down' | 'left' | 'right', order: number): CommandSpec =>
    spec(`edit.move.${direction}`, {
      edits: true,
      when: (state) => {
        const selection = state.selection;
        if (selection?.kind === 'branchLabel') {
          return direction === 'left' || direction === 'right'
            ? true
            : 'reason.branchMovesSideways';
        }
        return selection?.kind === 'blocks' ? true : 'reason.nothingSelected';
      },
      run: (state) => {
        const selection = state.selection;
        const keep = (): After => ({ selection });
        if (selection?.kind === 'branchLabel') {
          if (direction === 'left' || direction === 'right') {
            session.commit(moveBranch(content(), { branch: selection.branch, direction }), keep);
          }
          return;
        }
        const target = targetOf(selection);
        if (target !== null) {
          session.commit(move(content(), { target, direction, ids: session.ids() }), keep);
        }
      },
      menu: { menu: 'edit', group: 4, order },
      context: ['blocks', 'branchLabel'],
    });

  // Text editing.
  const textSpec = (id: string, caret: Caret | 'clear', menu?: MenuPlace): CommandSpec =>
    spec(id, {
      edits: true,
      when: (state) => {
        const field = fieldOfSelection(index(), state.selection);
        if ('reason' in field) {
          return field.reason;
        }
        const found = session.fieldText(field.value);
        return 'reason' in found ? found.reason : true;
      },
      run: (state) => {
        const field = fieldOfSelection(index(), state.selection);
        if ('value' in field) {
          const started = session.startEditing(field.value, caret);
          if (started !== true) {
            session.notify(started, 'warn');
          }
        }
      },
      ...(menu === undefined ? {} : { menu }),
      context: ['blocks', 'branchLabel', 'missingDefault'],
    });

  const branchLabelSpec = spec('edit.branchLabel', {
    edits: true,
    when: (state) => {
      const branch = branchOfSelection(index(), state.selection);
      if ('reason' in branch) {
        return branch.reason;
      }
      const found = session.fieldText({ kind: 'branchLabel', branch: branch.value });
      return 'reason' in found ? found.reason : true;
    },
    run: (state) => {
      const branch = branchOfSelection(index(), state.selection);
      if ('value' in branch) {
        session.startEditing({ kind: 'branchLabel', branch: branch.value }, 'selectAll');
      }
    },
  });

  // Undo.
  const undoSpec = spec('edit.undo', {
    edits: true,
    when: (state) => (state.undo.length > 0 ? true : 'reason.nothingToUndo'),
    run: () => {
      session.history('undo');
    },
    menu: { menu: 'edit', group: 1, order: 1 },
    toolbar: { group: 2, order: 1, icon: 'edit.undo' },
  });

  const redoSpec = spec('edit.redo', {
    edits: true,
    when: (state) => (state.redo.length > 0 ? true : 'reason.nothingToRedo'),
    run: () => {
      session.history('redo');
    },
    menu: { menu: 'edit', group: 1, order: 2 },
    toolbar: { group: 2, order: 2, icon: 'edit.redo' },
  });

  // Selection (no menu; keys, the palette and the shortcut list show them).
  const navigationSpec = (id: string, navigation: Navigation): CommandSpec =>
    spec(id, {
      edits: false,
      when: always,
      run: (state) => {
        const result = navigate(index(), state.selection, state.lastSelected, navigation);
        if (result.kind === 'select') {
          session.select(result.selection);
        } else if (result.reason !== undefined) {
          session.notify(`notice.${result.reason}`);
        }
      },
    });

  const extendSpec = (id: string, direction: 'up' | 'down'): CommandSpec =>
    spec(id, {
      edits: false,
      when: always,
      run: (state) => {
        if (state.selection === null) {
          session.runCommand(direction === 'up' ? 'select.up' : 'select.down');
          return;
        }
        const extended = extendBy(index(), state.selection, direction);
        if (extended === null) {
          session.notify('notice.sameParentOnly');
        } else {
          session.select(extended);
        }
      },
    });

  const selectionSpecs: ReadonlyArray<CommandSpec> = [
    navigationSpec('select.left', { kind: 'step', direction: 'left' }),
    navigationSpec('select.down', { kind: 'step', direction: 'down' }),
    navigationSpec('select.up', { kind: 'step', direction: 'up' }),
    navigationSpec('select.right', { kind: 'step', direction: 'right' }),
    extendSpec('select.extendUp', 'up'),
    extendSpec('select.extendDown', 'down'),
    navigationSpec('select.unitUp', { kind: 'unit', direction: 'up' }),
    navigationSpec('select.unitDown', { kind: 'unit', direction: 'down' }),
    navigationSpec('select.branchLeft', { kind: 'branch', direction: 'left' }),
    navigationSpec('select.branchRight', { kind: 'branch', direction: 'right' }),
    navigationSpec('select.first', { kind: 'edge', end: 'first' }),
    navigationSpec('select.last', { kind: 'edge', end: 'last' }),
    navigationSpec('select.previousDiagram', { kind: 'diagram', direction: 'previous' }),
    navigationSpec('select.nextDiagram', { kind: 'diagram', direction: 'next' }),
    spec('select.visual', {
      edits: false,
      when: (state) => (state.selection?.kind === 'blocks' ? true : 'reason.nothingSelected'),
      run: () => {
        session.setMode('visual');
        session.notify('notice.visual');
      },
    }),
    spec('select.clear', {
      edits: false,
      when: (state) => (state.selection === null ? 'reason.nothingSelected' : true),
      run: () => {
        session.select(null);
      },
    }),
  ];

  // View.
  const zoomSpec = (id: string, order: number, next: (zoom: number) => number): CommandSpec =>
    spec(id, {
      edits: false,
      when: (state) => {
        const zoom = Math.min(zoomRange.max, Math.max(zoomRange.min, next(state.zoom)));
        return Math.abs(zoom - state.zoom) < 1e-9 ? 'reason.zoomLimit' : true;
      },
      run: (state) => {
        deps.zoomTo(next(state.zoom));
      },
      menu: { menu: 'view', group: 4, order },
    });

  // File.
  const fileSpecs: ReadonlyArray<CommandSpec> = [
    spec('file.save', {
      edits: true,
      // A browser that cannot write the original file downloads instead (06-web 1).
      title: (ctx) => (ctx.store.canWriteInPlace ? 'command.file.save' : 'command.file.download'),
      when: always,
      run: async () => {
        await deps.save();
      },
      menu: { menu: 'file', group: 2, order: 1 },
      toolbar: { group: 1, order: 3, icon: 'file.save' },
    }),
    spec('file.saveAs', {
      edits: false,
      when: always,
      run: async () => {
        await deps.saveAs();
      },
      menu: { menu: 'file', group: 2, order: 2 },
    }),
  ];

  return [
    ...fileSpecs,
    undoSpec,
    redoSpec,
    cutSpec,
    copySpec,
    pasteSpec('after', 'edit.paste', 3, { group: 3, order: 3, icon: 'edit.paste' }),
    pasteSpec('before', 'edit.pasteBefore', 4),
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
    ...wrapSpecs,
    unwrapSpec,
    branchInsertSpec('after', 'branch.insert', 1),
    branchInsertSpec('before', 'branch.insertBefore', 2),
    branchDeleteSpec,
    convertIfSpec,
    convertCaseSpec,
    ...selectionSpecs,
    zoomSpec('view.zoom.in', 1, (zoom) => zoom + zoomRange.step),
    zoomSpec('view.zoom.out', 2, (zoom) => zoom - zoomRange.step),
    zoomSpec('view.zoom.reset', 3, () => 1),
  ];
}
