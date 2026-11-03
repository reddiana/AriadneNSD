// Between selections of the model and selections of the shown tree (03-editor 2.2): navigation
// walks what is shown, so a selection goes into the shown tree before a move key and comes back
// to the model after it. A click on the drawing names a screen id, which comes back the same way.
import type { Id } from '@ariadne-nsd/core';

import type { DocIndex } from '../model/doc-index';
import type { ShownIndex } from '../model/shown-index';
import { screenIdIn } from '../model/shown-index';
import type { Selection } from '../state/selection';
import { foldPath, selectBlock, selectFold, selectRange } from '../state/selection';

/** The shown id drawn for a model or screen id: itself, or what it is folded into. */
export function visibleId(shown: ShownIndex, id: Id): Id | null {
  if (shown.index.blocks.has(id)) {
    return id;
  }
  return shown.hiddenBy.get(id) ?? null;
}

/** The place a move key starts from when nothing is selected: the last selected, as shown. */
export function shownLastSelected(shown: ShownIndex, last: Id | null): Id | null {
  if (last === null || shown.index.diagrams.has(last)) {
    return last;
  }
  return visibleId(shown, last);
}

/** A model selection as a selection of the shown tree, or `null` when nothing of it is shown. */
export function toShown(
  shown: ShownIndex,
  real: DocIndex,
  selection: Selection | null,
): Selection | null {
  if (selection === null) {
    return null;
  }
  switch (selection.kind) {
    case 'blocks':
      return shownRange(shown, selection.anchor, selection.focus);
    case 'peek':
      return shownRange(
        shown,
        screenIdIn(selection.path, selection.anchor),
        screenIdIn(selection.path, selection.focus),
      );
    case 'fold':
      return shownRange(shown, screenIdIn(foldPath(selection), selection.fold), null);
    case 'branchLabel': {
      if (shown.index.branches.has(selection.branch)) {
        return selection;
      }
      const block = real.branches.get(selection.branch)?.block.id;
      return block === undefined ? null : shownRange(shown, block, null);
    }
    case 'missingDefault':
      return shown.index.blocks.has(selection.block)
        ? selection
        : shownRange(shown, selection.block, null);
    case 'head':
      return selection;
  }
}

/** A range of the shown tree from two ids; a range over more than one place shrinks to `focus`. */
function shownRange(shown: ShownIndex, anchor: Id, focus: Id | null): Selection | null {
  const to = visibleId(shown, focus ?? anchor);
  if (to === null) {
    return null;
  }
  const from = visibleId(shown, anchor) ?? to;
  const owner = (id: Id): Id | undefined => shown.index.blocks.get(id)?.owner;
  return owner(from) === owner(to)
    ? selectRange(shown.index, from, to)
    : selectBlock(shown.index, to);
}

/** A selection of the shown tree as a model selection. */
export function fromShown(
  shown: ShownIndex,
  real: DocIndex,
  selection: Selection | null,
): Selection | null {
  if (selection === null) {
    return null;
  }
  switch (selection.kind) {
    case 'blocks': {
      const isRange = selection.anchor !== selection.focus;
      const plain = (id: Id): boolean => !shown.meanings.has(id) && real.blocks.has(id);
      if (isRange && plain(selection.anchor) && plain(selection.focus)) {
        const anchor = real.blocks.get(selection.anchor);
        const focus = real.blocks.get(selection.focus);
        if (anchor !== undefined && anchor.owner === focus?.owner) {
          return selectRange(real, selection.anchor, selection.focus);
        }
      }
      return selectionOfScreenId(shown, real, selection.focus);
    }
    case 'branchLabel': {
      const meaning = shown.meanings.get(selection.branch);
      if (meaning?.kind !== 'peek') {
        return selection;
      }
      const block = real.branches.get(meaning.id)?.block.id;
      return block === undefined ? null : peekOf(meaning.path, block);
    }
    case 'missingDefault': {
      const meaning = shown.meanings.get(selection.block);
      return meaning?.kind === 'peek' ? peekOf(meaning.path, meaning.id) : selection;
    }
    case 'head':
    case 'fold':
    case 'peek':
      return selection;
  }
}

function peekOf(path: ReadonlyArray<Id>, id: Id): Selection {
  return { kind: 'peek', path, anchor: id, focus: id };
}

/**
 * What selecting one shown thing selects in the model: a block, the blocks of a folded row,
 * a fold region, or blocks shown inside an opened call block. `null` for an unknown id.
 */
export function selectionOfScreenId(shown: ShownIndex, real: DocIndex, id: Id): Selection | null {
  const meaning = shown.meanings.get(id);
  if (meaning === undefined) {
    return real.blocks.has(id) ? selectBlock(real, id) : null;
  }
  switch (meaning.kind) {
    case 'row': {
      const seq = real.seqs.get(meaning.owner)?.seq;
      const first = seq?.blocks[0];
      const last = seq?.blocks.at(-1);
      if (first === undefined || last === undefined) {
        return null;
      }
      return meaning.path.length === 0
        ? selectRange(real, first.id, last.id)
        : { kind: 'peek', path: meaning.path, anchor: first.id, focus: last.id };
    }
    case 'fold':
      return selectFold(meaning.fold, meaning.path);
    case 'peek': {
      if (real.blocks.has(meaning.id)) {
        return peekOf(meaning.path, meaning.id);
      }
      const block = real.branches.get(meaning.id)?.block.id;
      return block === undefined ? null : peekOf(meaning.path, block);
    }
  }
}
