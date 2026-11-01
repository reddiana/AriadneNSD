// What the editor remembers (03-editor 2). Only `doc` goes into the file; the rest is memory.
import type { Content, Doc, Id, LayoutResult } from '@ariadne-nsd/core';

import type { Selection } from './selection';

/** A text field the inline editor can open (03-editor 3.4). */
export type EditField =
  /** A block's text: a process block's text or a control block's condition. */
  | { readonly kind: 'block'; readonly block: Id }
  /** The label of an If or Case branch (R-EDIT-12). */
  | { readonly kind: 'branchLabel'; readonly branch: Id }
  /** The empty default cell of a Case without a default: typing makes the branch (UX CD1). */
  | { readonly kind: 'missingDefault'; readonly block: Id }
  /** The text of a diagram's header: the name, and a Method's parameters (R-BLK-10, R-BLK-11). */
  | { readonly kind: 'head'; readonly diagram: Id }
  /**
   * One of the two fields of a call block: the arguments after the name, or the result before
   * it (interaction rules "호출 블록"). `Tab` goes to the other one.
   */
  | { readonly kind: 'call'; readonly block: Id; readonly part: CallPart };

/** The fields of a call block. */
export type CallPart = 'args' | 'result';

/** Where the caret starts (03-keymap): all selected (`Enter` `F2`), at the start (`i`), at the end. */
export type Caret = 'selectAll' | 'start' | 'end';

/** The inline editor while it is open. */
export type Editing = {
  readonly field: EditField;
  /** The text when the field opened. Closing with the same text runs no command (01-model 4.4). */
  readonly initial: string;
  /** The text the field opens with: `initial`, or `''` for "clear and type" (`cc`). */
  readonly text: string;
  readonly caret: Caret;
  /**
   * A call block's two fields as typed so far. Both are written back in one command when the
   * editor closes, so editing them is one undo step (UX MD2).
   */
  readonly call?: { readonly args: string; readonly result: string };
  /**
   * The field opened again because its header name was refused (a clash). `Esc` there puts the
   * name back (UX Q3), and the field is drawn as an input that cannot be accepted (visual design
   * 7.1).
   */
  readonly isRejected?: boolean;
};

/** The editor's state (03-editor 2). Immutable: every change makes a new object. */
export type EditorState = {
  readonly doc: Doc;
  /** Snapshots of the content only; the view state is not undoable (01-model 4.4). */
  readonly undo: ReadonlyArray<Content>;
  readonly redo: ReadonlyArray<Content>;
  readonly selection: Selection | null;
  /**
   * After the selection is cleared, a move key starts here (interaction rules 2): a block, or a
   * diagram whose header was selected.
   */
  readonly lastSelected: Id | null;
  readonly editing: Editing | null;
  /** Changed since the last save (the unsaved mark ●). */
  readonly dirty: boolean;
  /** View only (03-editor 6.4). */
  readonly readOnly: boolean;
  /** 0.4 ~ 3, in 10% steps (03-editor 1.1). */
  readonly zoom: number;
  /** The last layout, for hit testing and the overlay layer. */
  readonly layout: LayoutResult;
  /** Grows by one whenever the content or the view state changes (`DocStatus.revision`). */
  readonly revision: number;
  /** `visual` while selecting a range with `v` (03-keymap). */
  readonly mode: 'normal' | 'visual';
  /** The first key of a two-key sequence waiting for the second, or `null`. */
  readonly pendingKeys: string | null;
};

/** The most undo steps kept. Older ones are dropped. */
export const undoLimit = 500;

/** The zoom limits and step (03-editor 1.1). */
export const zoomRange = { min: 0.4, max: 3, step: 0.1 } as const;

/** Rounds a zoom to a 10% step inside the limits. */
export function clampZoom(zoom: number): number {
  const stepped = Math.round(zoom * 10) / 10;
  return Math.min(zoomRange.max, Math.max(zoomRange.min, stepped));
}

/** The block a selection leaves behind for "start here next time" when it is cleared. */
function rememberedBlock(selection: Selection | null): Id | null {
  if (selection === null) {
    return null;
  }
  switch (selection.kind) {
    case 'blocks':
      return selection.focus;
    case 'missingDefault':
      return selection.block;
    case 'head':
      // A move key after clearing starts at this header again.
      return selection.diagram;
    case 'branchLabel':
    case 'fold':
      return null;
  }
}

/** Changes the selection only. Clearing it remembers where it was. */
export function withSelection(state: EditorState, selection: Selection | null): EditorState {
  const remembered = rememberedBlock(state.selection);
  return {
    ...state,
    selection,
    lastSelected: selection === null && remembered !== null ? remembered : state.lastSelected,
    mode: selection?.kind === 'blocks' ? state.mode : 'normal',
  };
}

/**
 * A new content from a command: the old content goes on the undo stack and redo is emptied.
 * The same content object means nothing changed: nothing is pushed (01-model 4).
 */
export function withContent(
  state: EditorState,
  content: Content,
  selection: Selection | null,
  layout: LayoutResult,
  isDirty: (doc: Doc) => boolean,
): EditorState {
  if (content === state.doc.content) {
    return withSelection(state, selection);
  }
  const doc: Doc = { content, view: state.doc.view };
  return {
    ...withSelection(state, selection),
    doc,
    undo: [...state.undo.slice(-(undoLimit - 1)), state.doc.content],
    redo: [],
    dirty: isDirty(doc),
    layout,
    revision: state.revision + 1,
  };
}

/** Undo or redo one step. `null` when there is nothing to undo or redo. */
export function stepHistory(
  state: EditorState,
  direction: 'undo' | 'redo',
  layoutOf: (doc: Doc) => LayoutResult,
  isDirty: (doc: Doc) => boolean,
): { readonly state: EditorState; readonly content: Content } | null {
  const from = direction === 'undo' ? state.undo : state.redo;
  const content = from.at(-1);
  if (content === undefined) {
    return null;
  }
  const rest = from.slice(0, -1);
  const pushed = direction === 'undo' ? state.redo : state.undo;
  const doc: Doc = { content, view: state.doc.view };
  return {
    content,
    state: {
      ...state,
      doc,
      undo: direction === 'undo' ? rest : [...pushed, state.doc.content],
      redo: direction === 'undo' ? [...pushed, state.doc.content] : rest,
      dirty: isDirty(doc),
      layout: layoutOf(doc),
      revision: state.revision + 1,
      editing: null,
    },
  };
}
