// What the command groups share: the dependencies, the small closures several groups use, and
// the helpers that look at the selection.
import type { PastedDocumentPort, PickerItem, WriteResult } from '../contracts';
import type { EditorMessage } from '../i18n/messages';
import type { DocIndex } from '../model/doc-index';
import { indexDoc, isEmptyBlock, placeOf, seqOfBlock } from '../model/doc-index';
import { drawnDiagrams } from '../navigation/navigate';
import type { After, ClipboardPort, EditorSession } from '../session/session';
import type { EditField, EditorState } from '../state/editor-state';
import type { Selection } from '../state/selection';
import { diagramOf, foldPath, selectBlock, selectRange, selectedBlocks } from '../state/selection';
import type { Applies } from './spec';
import type {
  Content,
  Diagram,
  HeadKind,
  Id,
  IdGenerator,
  NewBlockKind,
  Result,
  Side,
  Target,
  WrapKind,
} from '@ariadne-nsd/core';
import { addDefaultBranch, convertIfToCase, insertBranch } from '@ariadne-nsd/core';

/** What the editor's commands need besides the session. */
export type CommandDeps = {
  readonly session: EditorSession;
  readonly clipboard: ClipboardPort;
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
  /**
   * Addition: the shell that opens a pasted document (R-WEB-11, UX JP1). Absent: pasted text is
   * always blocks, and paste needs a selection.
   */
  readonly pastedDocument?: PastedDocumentPort;
  /**
   * Addition: asks whether to open a pasted document as a new document (UX JP2). "Paste as Text"
   * is dimmed when `canPasteText` is false (nothing selected). Absent: opens without asking.
   */
  readonly askPastedDocument?: (canPasteText: boolean) => Promise<'open' | 'text' | 'cancel'>;
};

/**
 * The block kinds in toolbar and menu order (06-web 7): the endless loop, exit and parallel
 * blocks come after the other five (sketch M84 B2).
 */
export const blockKinds: ReadonlyArray<NewBlockKind> = [
  'process',
  'if',
  'case',
  'while',
  'for',
  'doWhile',
  'endless',
  'exit',
  'parallel',
];

/** The kinds that can wrap blocks. An exit block holds nothing (UX XB1). */
export const wrapKinds: ReadonlyArray<WrapKind> = [
  'if',
  'case',
  'while',
  'for',
  'doWhile',
  'endless',
  'parallel',
];

export const kindNames: Readonly<Record<string, string>> = {
  if: 'If',
  case: 'Case',
  while: 'While',
  for: 'For',
  doWhile: 'Do-While',
};

/** Reads `{ block: Id }` from command arguments. */
export function blockArg(args: unknown): Id | null {
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

/** Whether command arguments say the command came from its key (`{ fromKey: true }`). */
export function isKeyArg(args: unknown): boolean {
  return typeof args === 'object' && args !== null && 'fromKey' in args && args.fromKey === true;
}

/** Where blocks go next to a target: the side, and whether they stay outside fold regions. */
export type Placement = {
  readonly target: Target;
  readonly side: Side;
  readonly outsideFolds: boolean;
};

/**
 * Where "insert below" and "paste below" put blocks when a diagram's header is selected (M87 F4):
 * at the very start of its body, outside the fold regions starting there, as a drop on the
 * header's inner bottom band does (UX DE1). An empty first block takes their place. `null` when
 * the diagram is gone.
 */
export function headStart(index: DocIndex, diagram: Id): Placement | null {
  const first = index.diagrams.get(diagram)?.body.blocks[0];
  if (first === undefined) {
    return null;
  }
  const target = { kind: 'blocks', first: first.id, last: first.id } as const;
  return isEmptyBlock(first)
    ? { target, side: 'after', outsideFolds: false }
    : { target, side: 'before', outsideFolds: true };
}

/** Something found, or why not. */
export type Found<T> = { readonly value: T } | { readonly reason: EditorMessage };

/** The only selected block, or why there is none. */
export function oneBlock(index: DocIndex, selection: Selection | null): Found<Id> {
  const ids = selectedBlocks(index, selection);
  const [only] = ids;
  if (only === undefined) {
    return { reason: 'reason.nothingSelected' };
  }
  return ids.length === 1 ? { value: only } : { reason: 'reason.selectOneBlock' };
}

/** The branch holding a block, nearest first, or `null`. */
export function branchAround(index: DocIndex, block: Id): Id | null {
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
export function branchOfSelection(index: DocIndex, selection: Selection | null): Found<Id> {
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

/**
 * The control block unwrap takes off when what is selected is not a block range (UX Q8): the If or
 * Case of a branch label or of the empty default cell, or the block holding a fold region. `null`
 * for other selections, for a region at the top of a diagram and for one seen in an opened call
 * block, which cannot be edited there.
 */
export function unwrapHolder(index: DocIndex, selection: Selection | null): Id | null {
  if (selection?.kind === 'branchLabel') {
    return index.branches.get(selection.branch)?.block.id ?? null;
  }
  if (selection?.kind === 'missingDefault') {
    return selection.block;
  }
  if (selection?.kind !== 'fold' || foldPath(selection).length > 0) {
    return null;
  }
  const owner = index.folds.get(selection.fold);
  return owner === undefined ? null : (index.seqs.get(owner)?.holder ?? null);
}

/** `true` when found, otherwise the reason: the `when` of a command. */
export function appliesIf<T>(found: Found<T>): Applies {
  return 'value' in found ? true : found.reason;
}

/** Which block a selection's range ends at, for deleting: the next, the previous, the holder. */
export function selectionAfterDelete(index: DocIndex, ids: ReadonlyArray<Id>): Id | null {
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
export function selectTouched(content: Content, touched: ReadonlyArray<Id>): Selection | null {
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
export function currentDiagram(index: DocIndex, state: EditorState): Id | null {
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
export function fieldOfSelection(
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
      return {
        value: {
          kind: 'fold',
          fold: selection.fold,
          ...(selection.path === undefined ? {} : { path: selection.path }),
        },
      };
    case 'peek':
      return { reason: 'reason.peekReadOnly' };
  }
}

/**
 * What the Event or Method header command does on a selection (interaction rules "새 Method로
 * 빼기와 새 다이어그램").
 */
export type HeadAction =
  | { readonly kind: 'add'; readonly diagram: Id }
  | { readonly kind: 'change'; readonly diagram: Id };

/**
 * The Event or Method header command's action: on a header it changes the kind; in a diagram
 * without a header it gives it one. In a diagram with a header, on blocks, it does nothing: `m`
 * there (and everywhere on blocks) is "새 Method로 빼기", a command of its own (UX XM3), and an
 * Event cannot be called, so `e` does not extract.
 */
export function headAction(
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
  return { reason: kind === 'method' ? 'reason.hasHead' : 'reason.eventNotExtracted' };
}

/** What "새 Method로 빼기" takes: selected blocks or a fold region (R-EDIT-19). */
export function extractTarget(selection: Selection | null): Found<Target> {
  if (selection === null) {
    return { reason: 'reason.nothingSelected' };
  }
  switch (selection.kind) {
    case 'blocks':
      return { value: { kind: 'blocks', first: selection.anchor, last: selection.focus } };
    case 'fold':
      return { value: { kind: 'fold', fold: selection.fold } };
    case 'peek':
      return { reason: 'reason.peekReadOnly' };
    case 'branchLabel':
    case 'missingDefault':
    case 'head':
      return { reason: 'reason.selectBlocksToExtract' };
  }
}

/** The Methods of the document in drawn order: the list a call block's target is chosen from. */
export function methodsOf(index: DocIndex): ReadonlyArray<Diagram> {
  return drawnDiagrams(index).flatMap((id) => {
    const diagram = index.diagrams.get(id);
    return diagram?.head?.kind === 'method' ? [diagram] : [];
  });
}

/** The selection after a header or diagram command: the header, its name being edited or not. */
export function afterHead(diagram: Id, isEditing: boolean): After {
  return isEditing
    ? {
        selection: { kind: 'head', diagram },
        edit: { field: { kind: 'head', diagram }, caret: 'selectAll' },
      }
    : { selection: { kind: 'head', diagram } };
}

/** What every command group shares: the dependencies and the closures several groups use. */
export type CommandContext = {
  readonly deps: CommandDeps;
  readonly session: EditorSession;
  readonly index: () => DocIndex;
  readonly content: () => Content;
  readonly blockField: (block: Id) => EditField;
  readonly intoMissingDefault: (
    caseBlock: Id,
    op: (made: Content, empty: Id, ids: IdGenerator) => Result,
    after: Parameters<EditorSession['commit']>[1],
  ) => void;
  readonly afterInsert: (result: {
    readonly content: Content;
    readonly touched: ReadonlyArray<Id>;
  }) => After;
  readonly insertWhen: (kind: NewBlockKind, side: Side) => (state: EditorState) => Applies;
  readonly runInsertBranch: (branch: Id, side: Side) => void;
  readonly blocksOnly: (onEmptyCell: EditorMessage) => (state: EditorState) => Applies;
  /** The paste in flight: saving waits for it. */
  readonly pasting: { pending: Promise<void> };
};

/** Makes the context the command groups share. */
export function commandContext(deps: CommandDeps): CommandContext {
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
    const madeIndex = indexDoc(result.content);
    const selection = selectBlock(madeIndex, made);
    // An endless loop has no text to open (UX EL1).
    return madeIndex.blocks.get(made)?.block.kind === 'endless'
      ? { selection }
      : { selection, edit: { field: { kind: 'block', block: made }, caret: 'end' } };
  };

  const insertWhen =
    (kind: NewBlockKind, side: Side) =>
    (state: EditorState): Applies => {
      const selection = state.selection;
      if (selection?.kind === 'branchLabel') {
        return kind === 'process' ? true : 'reason.notOnBranchLabel';
      }
      if (selection?.kind === 'head') {
        // Below a header is the start of its body (M87 F4); above it there is nothing.
        return side === 'after' ? true : 'reason.notOnHead';
      }
      return true;
    };

  const runInsertBranch = (branch: Id, side: Side): void => {
    const place = index().branches.get(branch);
    if (place?.block.kind === 'if') {
      // An If has two branches: it becomes a Case with a new branch at once, one undo step, and
      // the status bar says so (M87 F6).
      const block = place.block.id;
      const isConverted = session.commit(
        convertIfToCase(content(), { block, ids: session.ids() }),
        (ok) => {
          const [made] = ok.touched;
          return made === undefined
            ? { selection: selectBlock(indexDoc(ok.content), block) }
            : {
                selection: { kind: 'branchLabel', branch: made },
                edit: { field: { kind: 'branchLabel', branch: made }, caret: 'selectAll' },
              };
        },
      );
      if (isConverted) {
        session.notify('notice.convertedIfToCase');
      }
      return;
    }
    const result = insertBranch(content(), { branch, side, ids: session.ids() });
    const isApplied = session.commit(result, (ok) => {
      const [made] = ok.touched;
      if (made === undefined) {
        return { selection: session.state.selection };
      }
      // A parallel branch has no label to write: it is only selected (M84 B1).
      return place?.block.kind === 'parallel'
        ? { selection: { kind: 'branchLabel', branch: made } }
        : {
            selection: { kind: 'branchLabel', branch: made },
            edit: { field: { kind: 'branchLabel', branch: made }, caret: 'selectAll' },
          };
    });
    if (isApplied && place?.isDefault === true && side === 'after') {
      session.notify('notice.defaultStaysLast');
    }
  };

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
      // A folded thing moves, goes and is copied whole (interaction rules "접기 · 펼치기").
      return selection?.kind === 'blocks' || selection?.kind === 'fold'
        ? true
        : 'reason.nothingSelected';
    };

  return {
    deps,
    session,
    index,
    content,
    blockField,
    intoMissingDefault,
    afterInsert,
    insertWhen,
    runInsertBranch,
    blocksOnly,
    pasting: { pending: Promise.resolve() },
  };
}
