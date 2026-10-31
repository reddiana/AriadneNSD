// What is selected (03-editor 2). A selection is always written with ids, so it still means the
// same thing after undo or a move; when an id is gone the selection is dropped.
import type { Id, Target } from '@ariadne-nsd/core';

import type { DocIndex } from '../model/doc-index';
import { ancestorsOf, placeOf, seqOfBlock } from '../model/doc-index';

/** The sequence a range lies in: its owner and slot (03-editor 2). The MVP uses slot `body`. */
export type SeqRef = { readonly owner: Id; readonly slot: string };

/**
 * A selection (03-editor 2).
 * - `blocks`: a contiguous range in one sequence (ADR-0008); `anchor` is where it started.
 * - `head`, `fold`: kept from the design; not made by the MVP (no headers, no folding).
 * - `branchLabel`: the label of an If or Case branch.
 * - `missingDefault`: the empty default cell drawn for a Case without a default (UX CD1).
 *   An addition to 03-editor 2, which does not list it.
 */
export type Selection =
  | { readonly kind: 'blocks'; readonly seq: SeqRef; readonly anchor: Id; readonly focus: Id }
  | { readonly kind: 'head'; readonly diagram: Id }
  | { readonly kind: 'branchLabel'; readonly branch: Id }
  | { readonly kind: 'fold'; readonly fold: Id }
  | { readonly kind: 'missingDefault'; readonly block: Id };

/** The kinds of selection, for the context menu (03-editor 5 `context`). */
export type SelectionKind = Selection['kind'];

/** Selects one block. */
export function selectBlock(index: DocIndex, id: Id): Selection {
  return selectRange(index, id, id);
}

/** Selects the blocks `anchor..focus`, which must be in one sequence. */
export function selectRange(index: DocIndex, anchor: Id, focus: Id): Selection {
  return {
    kind: 'blocks',
    seq: { owner: placeOf(index, anchor).owner, slot: 'body' },
    anchor,
    focus,
  };
}

/**
 * The selection if everything it names still exists, otherwise `null` (03-editor 2: a selection
 * whose id is gone is dropped). A range whose ends are no longer in one sequence shrinks to its
 * anchor.
 */
export function validSelection(index: DocIndex, selection: Selection | null): Selection | null {
  if (selection === null) {
    return null;
  }
  switch (selection.kind) {
    case 'blocks': {
      const anchor = index.blocks.get(selection.anchor);
      const focus = index.blocks.get(selection.focus);
      if (anchor === undefined) {
        return null;
      }
      if (focus?.owner !== anchor.owner) {
        return selectBlock(index, selection.anchor);
      }
      return anchor.owner === selection.seq.owner
        ? selection
        : selectRange(index, selection.anchor, selection.focus);
    }
    case 'head':
      return index.diagrams.has(selection.diagram) ? selection : null;
    case 'branchLabel':
      return index.branches.has(selection.branch) ? selection : null;
    case 'fold':
      return null;
    case 'missingDefault': {
      const place = index.blocks.get(selection.block);
      return place?.block.kind === 'case' && place.block.otherwise === null ? selection : null;
    }
  }
}

/** The selected blocks in order, or `[]` when the selection is not a block range. */
export function selectedBlocks(index: DocIndex, selection: Selection | null): ReadonlyArray<Id> {
  if (selection?.kind !== 'blocks') {
    return [];
  }
  const anchor = index.blocks.get(selection.anchor);
  const focus = index.blocks.get(selection.focus);
  if (anchor === undefined || focus?.owner !== anchor.owner) {
    return [];
  }
  const seq = seqOfBlock(index, selection.anchor).seq;
  const lo = Math.min(anchor.index, focus.index);
  const hi = Math.max(anchor.index, focus.index);
  return seq.blocks.slice(lo, hi + 1).map((block) => block.id);
}

/** The command target of a block selection, or `null` for other selections. */
export function targetOf(selection: Selection | null): Target | null {
  if (selection?.kind !== 'blocks') {
    return null;
  }
  return { kind: 'blocks', first: selection.anchor, last: selection.focus };
}

/** The diagram the selection is in, or `null`. */
export function diagramOf(index: DocIndex, selection: Selection | null): Id | null {
  if (selection === null) {
    return null;
  }
  switch (selection.kind) {
    case 'blocks':
      return index.blocks.get(selection.focus)?.diagram ?? null;
    case 'head':
      return selection.diagram;
    case 'branchLabel': {
      const branch = index.branches.get(selection.branch);
      return branch === undefined ? null : (index.blocks.get(branch.block.id)?.diagram ?? null);
    }
    case 'missingDefault':
      return index.blocks.get(selection.block)?.diagram ?? null;
    case 'fold':
      return null;
  }
}

/** The block a selection mainly points at: the focus, the If or Case of a label, … */
export function focusBlock(index: DocIndex, selection: Selection | null): Id | null {
  if (selection === null) {
    return null;
  }
  switch (selection.kind) {
    case 'blocks':
      return selection.focus;
    case 'branchLabel':
      return index.branches.get(selection.branch)?.block.id ?? null;
    case 'missingDefault':
      return selection.block;
    case 'head':
    case 'fold':
      return null;
  }
}

/**
 * Widens a selection to also hold block `to` (03-editor 2.1, ADR-0008). Shift+click and
 * Shift+↑ ↓ use it. The two blocks' ancestor lists are compared; the nearest sequence that holds
 * an ancestor of both gives the two ends. Blocks in different diagrams: only `to` is selected.
 */
export function extendTo(index: DocIndex, selection: Selection | null, to: Id): Selection {
  const from = selection?.kind === 'blocks' ? selection.anchor : null;
  if (from === null || !index.blocks.has(from)) {
    return selectBlock(index, to);
  }
  if (placeOf(index, from).diagram !== placeOf(index, to).diagram) {
    return selectBlock(index, to);
  }
  const toAncestors = ancestorsOf(index, to);
  for (const a of ancestorsOf(index, from)) {
    const owner = placeOf(index, a).owner;
    const b = toAncestors.find((id) => placeOf(index, id).owner === owner);
    if (b !== undefined) {
      return selectRange(index, a, b);
    }
  }
  return selectBlock(index, to);
}

/**
 * Moves the focus end of a block range one block up or down in its sequence (Shift+↑ ↓, `v`
 * then `j` `k`). Returns `null` at the end of the sequence: a range stays under one parent.
 */
export function extendBy(
  index: DocIndex,
  selection: Selection | null,
  direction: 'up' | 'down',
): Selection | null {
  if (selection?.kind !== 'blocks') {
    return null;
  }
  const focus = placeOf(index, selection.focus);
  const seq = seqOfBlock(index, selection.focus).seq;
  const next = seq.blocks[focus.index + (direction === 'down' ? 1 : -1)];
  return next === undefined ? null : { ...selection, focus: next.id };
}
