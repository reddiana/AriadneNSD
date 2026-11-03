// The editor's own commands (03-editor 5): content commands, selection, view and file.
// The shell adds new · open · recent files, and the UI the palette, dialogs and help.
import type {
  Content,
  Diagram,
  HeadKind,
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
  deleteDiagram,
  headParams,
  insertBlock,
  insertBranch,
  insertCall,
  move,
  moveBranch,
  moveDiagram,
  newDiagram,
  newMethodAndCall,
  paste,
  setCallTarget,
  setHead,
  unwrap,
  wrap,
} from '@ariadne-nsd/core';

import { clipFromJson, clipFromText, clipToJson, clipToText } from '../clipboard/clip-format';
import type {
  CommandContext,
  CommandSpec,
  MenuPlace,
  PickerItem,
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
import { drawnDiagrams, navigate } from '../navigation/navigate';
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
  /**
   * Asks the user to choose one item of a list, such as the Method to call. Resolves the index,
   * or `null` when the list was closed. `active` is the item that starts active.
   */
  readonly pick: (
    title: EditorMessage,
    items: ReadonlyArray<PickerItem>,
    active: number,
  ) => Promise<number | null>;
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
    if (index.diagrams.has(last)) {
      // A header was selected last.
      return last;
    }
  }
  return diagramOf(index, state.selection) ?? index.content.diagrams[0]?.id ?? null;
}

/**
 * The field the text edit commands open for the selection, or why there is none. `blockField`
 * gives a block's field: its text, or a call block's first field.
 */
function fieldOfSelection(
  index: DocIndex,
  selection: Selection | null,
  blockField: (block: Id) => EditField,
): Found<EditField> {
  if (selection === null) {
    return { reason: 'reason.nothingSelected' };
  }
  switch (selection.kind) {
    case 'blocks': {
      const block = oneBlock(index, selection);
      return 'value' in block ? { value: blockField(block.value) } : block;
    }
    case 'branchLabel':
      return { value: { kind: 'branchLabel', branch: selection.branch } };
    case 'missingDefault':
      return { value: { kind: 'missingDefault', block: selection.block } };
    case 'head':
      return { value: { kind: 'head', diagram: selection.diagram } };
    case 'fold':
      return { reason: 'reason.unsupported' };
  }
}

/** What the Event or Method command does on a selection (interaction rules "새 Method로 빼기"). */
type HeadAction =
  | { readonly kind: 'add'; readonly diagram: Id }
  | { readonly kind: 'change'; readonly diagram: Id }
  | { readonly kind: 'extract' };

/**
 * The Event or Method command's action: on a header it changes the kind; in a diagram without
 * a header it gives it one; on blocks of a diagram with a header the Method command extracts
 * them into a new Method, and the Event command does nothing (an Event cannot be called).
 * In a diagram without a header both commands give it a header, even on blocks: extracting is
 * not in the MVP, and this is the only way to give that diagram a header.
 */
function headAction(
  index: DocIndex,
  selection: Selection | null,
  kind: HeadKind,
): Found<HeadAction> {
  if (selection === null) {
    return { reason: 'reason.nothingSelected' };
  }
  if (selection.kind === 'head') {
    return { value: { kind: 'change', diagram: selection.diagram } };
  }
  const diagram = diagramOf(index, selection);
  if (diagram === null) {
    return { reason: 'reason.unsupported' };
  }
  if ((index.diagrams.get(diagram)?.head ?? null) === null) {
    return { value: { kind: 'add', diagram } };
  }
  return kind === 'method'
    ? { value: { kind: 'extract' } }
    : { reason: 'reason.eventNotExtracted' };
}

/** The Methods of the document in drawn order: the list a call block's target is chosen from. */
function methodsOf(index: DocIndex): ReadonlyArray<Diagram> {
  return drawnDiagrams(index).flatMap((id) => {
    const diagram = index.diagrams.get(id);
    return diagram?.head?.kind === 'method' ? [diagram] : [];
  });
}

/** The selection after a header or diagram command: the header, its name being edited or not. */
function afterHead(diagram: Id, isEditing: boolean): After {
  return isEditing
    ? {
        selection: { kind: 'head', diagram },
        edit: { field: { kind: 'head', diagram }, caret: 'selectAll' },
      }
    : { selection: { kind: 'head', diagram } };
}

/** Makes the editor's commands. */
export function editorCommands(deps: CommandDeps): ReadonlyArray<CommandSpec> {
  const { session } = deps;
  const index = (): DocIndex => session.index();
  const content = (): Content => session.state.doc.content;
  const blockField = (block: Id): EditField => session.blockField(block);

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
      if (selection?.kind === 'head') {
        return 'reason.notOnHead';
      }
      if (selection?.kind === 'fold') {
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
    // o / O put a new block even next to an empty one (UX KP2); a control block fills it.
    session.commit(
      insertBlock(content(), { target, side, kind, ids: session.ids(), besideEmpty: true }),
      afterInsert,
    );
  };

  const insertSpecs = blockKinds.flatMap((kind, order) => [
    spec(`block.insert.${kind}`, {
      edits: true,
      when: insertWhen(kind),
      run: () => {
        runInsert(kind, 'after');
      },
      menu: { menu: 'diagram', group: 1, order: order + 1, submenu: 'insert' },
      // For has no toolbar icon: it looks like While and confused people (UX TB1). Keys and menus.
      ...(kind === 'for' ? {} : { toolbar: { group: 4, order: order + 1, icon: `block.${kind}` } }),
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
        if (selection?.kind === 'head') {
          return 'reason.cannotWrapHead';
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

  /** Commands that act on selected blocks. `onEmptyCell` is why one does not work on the empty default cell. */
  const blocksOnly =
    (onEmptyCell: EditorMessage) =>
    (state: EditorState): Applies => {
      const selection = state.selection;
      if (selection?.kind === 'branchLabel') {
        return 'reason.undecidedOnBranchLabel';
      }
      if (selection?.kind === 'head') {
        return 'reason.notOnHead';
      }
      if (selection?.kind === 'missingDefault') {
        return onEmptyCell;
      }
      return selection?.kind === 'blocks' ? true : 'reason.nothingSelected';
    };

  const unwrapSpec = spec('block.unwrap', {
    edits: true,
    // Greyed out when nothing would come off: same checks as core's `unwrap`, read from the index.
    when: (state) => {
      if (state.selection?.kind === 'head') {
        return 'reason.notOnHead';
      }
      if (state.selection?.kind !== 'blocks') {
        return 'reason.nothingSelected';
      }
      const ix = index();
      const selected = selectedBlocks(ix, state.selection);
      const [first] = selected;
      if (first === undefined) {
        return 'reason.nothingSelected';
      }
      const firstBlock = ix.blocks.get(first)?.block;
      if (selected.length === 1 && firstBlock?.kind === 'call') {
        return 'reason.unsupported';
      }
      if (selected.length === 1 && firstBlock !== undefined && isControl(firstBlock)) {
        return true;
      }
      return seqOfBlock(ix, first).holder === null ? 'reason.noControlBlock' : true;
    },
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
    when: blocksOnly('reason.nothingToCopy'),
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
    when: blocksOnly('reason.nothingToCut'),
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

  // A paste reads the system clipboard asynchronously. Saving waits for it, so Ctrl+V then
  // Ctrl+S saves the pasted document, not the one before it.
  let pendingPaste: Promise<void> = Promise.resolve();
  const pasteNow = async (side: Side): Promise<void> => {
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
  };

  const runPaste = async (side: Side): Promise<void> => {
    const pasting = pasteNow(side);
    pendingPaste = pasting.catch(() => undefined);
    await pasting;
  };

  const pasteSpec = (side: Side, id: string, order: number, toolbar?: ToolbarPlace): CommandSpec =>
    spec(id, {
      edits: true,
      when: (state) => {
        const selection = state.selection;
        if (selection?.kind === 'branchLabel') {
          return 'reason.undecidedOnBranchLabel';
        }
        if (selection?.kind === 'head') {
          return 'reason.cannotPasteOnHead';
        }
        return selection?.kind === 'blocks' || selection?.kind === 'missingDefault'
          ? true
          : 'reason.nothingSelected';
      },
      run: async () => {
        await runPaste(side);
      },
      menu: { menu: 'edit', group: 2, order },
      ...(toolbar === undefined ? {} : { toolbar }),
      context: ['blocks', 'missingDefault'],
    });

  const deleteSpec = spec('edit.delete', {
    edits: true,
    // On a header, Delete removes the header (03-keymap).
    when: (state) =>
      state.selection?.kind === 'head' ? true : blocksOnly('reason.noDefaultToDelete')(state),
    run: (state) => {
      if (state.selection?.kind === 'head') {
        session.runCommand('diagram.removeHead');
        return;
      }
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
        return selection?.kind === 'blocks' || selection?.kind === 'head'
          ? true
          : 'reason.nothingSelected';
      },
      run: (state) => {
        const selection = state.selection;
        const keep = (): After => ({ selection });
        if (selection?.kind === 'head') {
          // On a header the diagram moves among its kind (UX Q6): up and left go earlier.
          const way = direction === 'up' || direction === 'left' ? 'up' : 'down';
          session.commit(
            moveDiagram(content(), { diagram: selection.diagram, direction: way }),
            keep,
          );
          return;
        }
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
      context: ['blocks', 'branchLabel', 'head'],
    });

  // Text editing.
  const textSpec = (id: string, caret: Caret | 'clear', menu?: MenuPlace): CommandSpec =>
    spec(id, {
      edits: true,
      when: (state) => {
        const field = fieldOfSelection(index(), state.selection, blockField);
        if ('reason' in field) {
          return field.reason;
        }
        const found = session.fieldText(field.value);
        return 'reason' in found ? found.reason : true;
      },
      run: (state) => {
        const field = fieldOfSelection(index(), state.selection, blockField);
        if ('value' in field) {
          const started = session.startEditing(field.value, caret);
          if (started !== true) {
            session.notify(started, 'warn');
          }
        }
      },
      ...(menu === undefined ? {} : { menu }),
      context: ['blocks', 'branchLabel', 'missingDefault', 'head'],
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

  // Call blocks (R-BLK-07, interaction rules "호출 블록").

  /** Asks which Method to call: every Method, then "New Method, and call it" (last). */
  const pickMethod = async (
    current: Id | null,
  ): Promise<{ readonly method: Diagram | null } | null> => {
    const methods = methodsOf(index());
    const items: PickerItem[] = [
      ...methods.map((m) => ({ title: m.head?.text ?? '', isLiteral: true })),
      { title: 'picker.newMethod', isLiteral: false },
    ];
    const active = Math.max(
      0,
      methods.findIndex((m) => m.id === current),
    );
    const chosen = await deps.pick('picker.callTarget', items, active);
    if (chosen === null) {
      return null;
    }
    // The document may have become view only while the list was open.
    if (session.state.readOnly) {
      session.notify('reason.readOnly', 'warn');
      return null;
    }
    return { method: methods[chosen] ?? null };
  };

  /** After inserting a call block: select it and type its arguments (or result) at once. */
  const afterCall = (method: Diagram, call: Id, made: Content): After => {
    const receives = method.head !== null && headParams(method.head) !== null;
    return {
      selection: selectBlock(indexDoc(made), call),
      edit: {
        field: { kind: 'call', block: call, part: receives ? 'args' : 'result' },
        caret: 'end',
      },
    };
  };

  const runInsertCall = async (side: Side): Promise<void> => {
    const selection = session.state.selection;
    const picked = await pickMethod(null);
    if (picked === null) {
      return;
    }
    const { method } = picked;
    const op = (made: Content, target: Target, ids: IdGenerator): Result =>
      method === null
        ? newMethodAndCall(made, { target, side, ids })
        : insertCall(made, { target, side, diagram: method.id, ids });
    const after = (ok: {
      readonly content: Content;
      readonly touched: ReadonlyArray<Id>;
    }): After => {
      const [first, second] = ok.touched;
      if (method === null) {
        // A new Method: its name is written now, and the call block follows it (ADR-0022).
        return first === undefined ? { selection: null } : afterHead(first, true);
      }
      return first === undefined
        ? { selection: null }
        : afterCall(method, second ?? first, ok.content);
    };
    if (selection?.kind === 'missingDefault') {
      intoMissingDefault(
        selection.block,
        (made, empty, ids) => op(made, { kind: 'blocks', first: empty, last: empty }, ids),
        after,
      );
      return;
    }
    const diagram = currentDiagram(index(), { ...session.state, selection });
    const target: Target | null =
      targetOf(selection) ?? (diagram === null ? null : { kind: 'diagramEnd', diagram });
    if (target === null) {
      session.notify('reason.nothingSelected', 'warn');
      return;
    }
    session.commit(op(content(), target, session.ids()), after);
  };

  const insertCallSpecs: ReadonlyArray<CommandSpec> = [
    spec('block.insert.call', {
      edits: true,
      when: (state) =>
        state.selection?.kind === 'branchLabel'
          ? 'reason.notOnBranchLabel'
          : insertWhen('process')(state),
      run: () => runInsertCall('after'),
      menu: { menu: 'diagram', group: 1, order: 7, submenu: 'insert' },
      context: ['blocks', 'missingDefault'],
    }),
    spec('block.insertBefore.call', {
      edits: true,
      when: (state) =>
        state.selection?.kind === 'branchLabel'
          ? 'reason.notOnBranchLabel'
          : insertWhen('process')(state),
      run: () => runInsertCall('before'),
      menu: { menu: 'diagram', group: 1, order: 17, submenu: 'insertBefore' },
    }),
  ];

  /** The one selected call block, or why there is none. */
  const selectedCall = (state: EditorState): Found<Id> => {
    const block = oneBlock(index(), state.selection);
    if ('reason' in block) {
      return block.reason === 'reason.nothingSelected' ? { reason: 'reason.selectCall' } : block;
    }
    return index().blocks.get(block.value)?.block.kind === 'call'
      ? block
      : { reason: 'reason.selectCall' };
  };

  const setTargetSpec = spec('call.setTarget', {
    edits: true,
    when: (state) => appliesIf(selectedCall(state)),
    run: async (state) => {
      const found = selectedCall(state);
      if (!('value' in found)) {
        return;
      }
      const call = found.value;
      const block = index().blocks.get(call)?.block;
      const current =
        block?.kind === 'call' && block.target.kind === 'local' ? block.target.diagram : null;
      const picked = await pickMethod(current);
      if (picked === null) {
        return;
      }
      const keep = (): After => ({ selection: session.state.selection });
      if (picked.method !== null) {
        session.commit(setCallTarget(content(), { block: call, diagram: picked.method.id }), keep);
        return;
      }
      // A new Method to call: made and chosen in one undo step, then its name is written.
      const made = newDiagram(content(), { kind: 'method', ids: session.ids() });
      const [diagram] = made.ok ? made.touched : [];
      if (!made.ok || diagram === undefined) {
        if (!made.ok) {
          session.refuse(made.reason);
        }
        return;
      }
      session.commit(setCallTarget(made.content, { block: call, diagram }), () =>
        afterHead(diagram, true),
      );
    },
    menu: { menu: 'diagram', group: 4, order: 1 },
    context: ['blocks'],
  });

  // Headers and diagrams (R-BLK-10, R-BLK-11, R-EDIT-18).
  const headKindSpec = (kind: HeadKind, order: number): CommandSpec => {
    const id = `diagram.${kind}`;
    return spec(id, {
      edits: true,
      title: (ctx) => {
        const action = headAction(index(), ctx.state.selection, kind);
        if (!('value' in action)) {
          return commandTitle(id);
        }
        switch (action.value.kind) {
          case 'add':
            return commandTitle(`${id}.add`);
          case 'change':
            return commandTitle(`${id}.change`);
          case 'extract':
            return commandTitle(`${id}.extract`);
        }
      },
      when: (state) => {
        const action = headAction(index(), state.selection, kind);
        if ('reason' in action) {
          return action.reason;
        }
        return action.value.kind === 'extract' ? 'reason.extractNotYet' : true;
      },
      run: (state) => {
        const action = headAction(index(), state.selection, kind);
        if (!('value' in action) || action.value.kind === 'extract') {
          return;
        }
        const { diagram } = action.value;
        // A new header opens its name for typing, the default name selected (R-BLK-10).
        const isNew = action.value.kind === 'add';
        session.commit(setHead(content(), { diagram, kind }), () => afterHead(diagram, isNew));
      },
      menu: { menu: 'diagram', group: 5, order },
      context: ['blocks', 'head'],
    });
  };

  const removeHeadSpec = spec('diagram.removeHead', {
    edits: true,
    when: (state) => (state.selection?.kind === 'head' ? true : 'reason.selectHead'),
    run: (state) => {
      if (state.selection?.kind !== 'head') {
        return;
      }
      const diagram = state.selection.diagram;
      session.commit(setHead(content(), { diagram, kind: null }), (ok) => {
        // The first block of the diagram, unless the diagram went with its header (invariant 7).
        const first = ok.content.diagrams.find((d) => d.id === diagram)?.body.blocks[0];
        return {
          selection: first === undefined ? null : selectBlock(indexDoc(ok.content), first.id),
        };
      });
    },
    menu: { menu: 'diagram', group: 5, order: 3 },
    context: ['head'],
  });

  const newDiagramSpec = (kind: HeadKind, id: string, order: number): CommandSpec =>
    spec(id, {
      edits: true,
      when: always,
      run: () => {
        session.commit(newDiagram(content(), { kind, ids: session.ids() }), (ok) => {
          const [diagram] = ok.touched;
          return diagram === undefined ? { selection: null } : afterHead(diagram, true);
        });
      },
      menu: { menu: 'diagram', group: 6, order },
    });

  const deleteDiagramSpec = spec('diagram.delete', {
    edits: true,
    when: (state) => {
      if (diagramOf(index(), state.selection) === null) {
        return 'reason.nothingSelected';
      }
      return index().content.diagrams.length > 1 ? true : 'reason.lastDiagram';
    },
    run: (state) => {
      const ix = index();
      const diagram = diagramOf(ix, state.selection);
      if (diagram === null) {
        return;
      }
      // Next, the side diagram after it in drawn order, or the one before (its header).
      const order = drawnDiagrams(ix);
      const at = order.indexOf(diagram);
      const next = order[at + 1] ?? order[at - 1] ?? null;
      const isApplied = session.commit(deleteDiagram(content(), { diagram }), (ok) => {
        const there = next === null ? undefined : ok.content.diagrams.find((d) => d.id === next);
        if (there === undefined) {
          return { selection: null };
        }
        const first = there.body.blocks[0];
        if (there.head !== null) {
          return { selection: { kind: 'head', diagram: there.id } };
        }
        return {
          selection: first === undefined ? null : selectBlock(indexDoc(ok.content), first.id),
        };
      });
      if (isApplied) {
        session.notify('notice.diagramDeleted');
      }
    },
    menu: { menu: 'diagram', group: 6, order: 3 },
    context: ['head'],
  });

  const diagramSpecs: ReadonlyArray<CommandSpec> = [
    headKindSpec('event', 1),
    headKindSpec('method', 2),
    removeHeadSpec,
    newDiagramSpec('event', 'diagram.newEvent', 1),
    newDiagramSpec('method', 'diagram.newMethod', 2),
    deleteDiagramSpec,
  ];

  // File.
  const fileSpecs: ReadonlyArray<CommandSpec> = [
    spec('file.save', {
      edits: true,
      // A browser that cannot write the original file downloads instead (06-web 1).
      title: (ctx) => (ctx.store.canWriteInPlace ? 'command.file.save' : 'command.file.download'),
      when: always,
      run: async () => {
        await pendingPaste;
        await deps.save();
      },
      menu: { menu: 'file', group: 2, order: 1 },
      toolbar: { group: 1, order: 3, icon: 'file.save' },
    }),
    spec('file.saveAs', {
      edits: false,
      when: always,
      run: async () => {
        await pendingPaste;
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
    ...insertCallSpecs,
    ...wrapSpecs,
    unwrapSpec,
    branchInsertSpec('after', 'branch.insert', 1),
    branchInsertSpec('before', 'branch.insertBefore', 2),
    branchDeleteSpec,
    convertIfSpec,
    convertCaseSpec,
    setTargetSpec,
    ...diagramSpecs,
    ...selectionSpecs,
    zoomSpec('view.zoom.in', 1, (zoom) => zoom + zoomRange.step),
    zoomSpec('view.zoom.out', 2, (zoom) => zoom - zoomRange.step),
    zoomSpec('view.zoom.reset', 3, () => 1),
  ];
}
