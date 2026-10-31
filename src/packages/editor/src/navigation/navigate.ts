// Keyboard navigation (03-editor 2.2, interaction rules "키보드로 이동하고 삽입하기").
// The rules are functions over the drawn order of one diagram. They use the document only, not
// the DOM, so they are tested in Node. The MVP draws everything unfolded and has no headers.
import type { Block, Id } from '@ariadne-nsd/core';

import type { DocIndex } from '../model/doc-index';
import {
  ancestorsOf,
  branchesOf,
  childSeqs,
  containerOf,
  isBranching,
  placeOf,
  seqOfBlock,
  visibleOrder,
} from '../model/doc-index';
import type { Selection } from '../state/selection';
import { diagramOf, focusBlock, selectBlock } from '../state/selection';

/** One navigation key. */
export type Navigation =
  /** `h` `j` `k` `l`, arrow keys. */
  | { readonly kind: 'step'; readonly direction: 'up' | 'down' | 'left' | 'right' }
  /** `{` `}`, Ctrl+Up / Down: a control block counts as one block. */
  | { readonly kind: 'unit'; readonly direction: 'up' | 'down' }
  /** Ctrl+Left / Right: the side branch of the nearest If or Case, looking further out if needed. */
  | { readonly kind: 'branch'; readonly direction: 'left' | 'right' }
  /** `[[` `]]`, Ctrl+Shift+Left / Right: the previous or next diagram. */
  | { readonly kind: 'diagram'; readonly direction: 'previous' | 'next' }
  /** `gg` `G`: the first or last block of this diagram. */
  | { readonly kind: 'edge'; readonly end: 'first' | 'last' };

/** Why the selection did not move, when the user should be told. */
export type StayReason = 'noDiagramThere' | 'leftmostBranch' | 'rightmostBranch';

/** The result of a navigation key. */
export type NavigationResult =
  | { readonly kind: 'select'; readonly selection: Selection }
  | { readonly kind: 'stay'; readonly reason?: StayReason };

const stay: NavigationResult = { kind: 'stay' };

/**
 * Where a navigation key goes from the selection. With nothing selected, any navigation key
 * selects the last selected block again, or the first block (interaction rules 2).
 */
export function navigate(
  index: DocIndex,
  selection: Selection | null,
  lastSelected: Id | null,
  navigation: Navigation,
): NavigationResult {
  if (selection === null) {
    const start = lastSelected !== null && index.blocks.has(lastSelected) ? lastSelected : null;
    const first = start ?? firstBlockOf(index, index.content.diagrams[0]?.id ?? null);
    return first === null ? stay : select(index, first);
  }
  switch (navigation.kind) {
    case 'step':
      return step(index, selection, navigation.direction);
    case 'unit': {
      const block = focusBlock(index, selection);
      return block === null ? stay : unit(index, block, navigation.direction);
    }
    case 'branch': {
      const block = focusBlock(index, selection);
      return block === null ? stay : sideBranch(index, block, navigation.direction);
    }
    case 'diagram':
      return neighbourDiagram(index, selection, navigation.direction);
    case 'edge': {
      const diagram = diagramOf(index, selection);
      const order = diagram === null ? [] : visibleOrder(index, diagram);
      const id = navigation.end === 'first' ? order[0] : order.at(-1);
      return id === undefined ? stay : select(index, id);
    }
  }
}

function select(index: DocIndex, id: Id): NavigationResult {
  return { kind: 'select', selection: selectBlock(index, id) };
}

function selectLabel(branch: Id): NavigationResult {
  return { kind: 'select', selection: { kind: 'branchLabel', branch } };
}

function selectMissingDefault(block: Id): NavigationResult {
  return { kind: 'select', selection: { kind: 'missingDefault', block } };
}

function firstBlockOf(index: DocIndex, diagram: Id | null): Id | null {
  if (diagram === null) {
    return null;
  }
  return index.diagrams.get(diagram)?.body.blocks[0]?.id ?? null;
}

function step(
  index: DocIndex,
  selection: Selection,
  direction: 'up' | 'down' | 'left' | 'right',
): NavigationResult {
  switch (selection.kind) {
    case 'blocks':
      return stepFromBlock(index, selection.focus, direction);
    case 'branchLabel':
      return stepFromLabel(index, selection.branch, direction);
    case 'missingDefault':
      return stepFromMissingDefault(index, selection.block, direction);
    case 'head':
    case 'fold':
      return stay;
  }
}

function stepFromBlock(
  index: DocIndex,
  current: Id,
  direction: 'up' | 'down' | 'left' | 'right',
): NavigationResult {
  switch (direction) {
    case 'up':
      return stepUp(index, current);
    case 'down':
      return stepDown(index, current);
    case 'left':
      return stepLeft(index, current);
    case 'right':
      return stepRight(index, current);
  }
}

function stepUp(index: DocIndex, current: Id): NavigationResult {
  // From the first block of a branch, Up selects the branch label (UX Q10).
  const seq = seqOfBlock(index, current);
  if (seq.branch !== null && seq.seq.blocks[0]?.id === current) {
    return selectLabel(seq.branch);
  }
  const order = visibleOrder(index, placeOf(index, current).diagram);
  const previous = order[order.indexOf(current) - 1];
  if (previous === undefined) {
    return stay;
  }
  // Coming up into an If or Case from below lands in its leftmost branch's bottom block.
  const mine = ancestorsOf(index, current);
  const outer = ancestorsOf(index, previous)
    .slice(1)
    .reverse()
    .find((id) => isBranching(placeOf(index, id).block) && !mine.includes(id));
  return select(index, outer === undefined ? previous : bottomOf(placeOf(index, outer).block));
}

function stepDown(index: DocIndex, current: Id): NavigationResult {
  const order = visibleOrder(index, placeOf(index, current).diagram);
  let next = order[order.indexOf(current) + 1];
  // Down never goes into a side branch: from a branch's end it leaves the If or Case.
  while (next !== undefined) {
    const crossing = crossed(index, current, next);
    if (crossing === null) {
      break;
    }
    next = firstAfter(index, order, crossing.id);
  }
  return next === undefined ? stay : select(index, next);
}

function stepLeft(index: DocIndex, current: Id): NavigationResult {
  const container = containerOf(index, current);
  if (container === null) {
    return stay;
  }
  const block = container.block;
  if (isBranching(block) && container.branch !== null) {
    const branches = branchesOf(block);
    const column = branches.findIndex((branch) => branch.id === container.branch);
    const left = branches[column - 1];
    if (left !== undefined) {
      return firstOfBranch(index, left.id);
    }
  }
  return select(index, block.id);
}

function stepRight(index: DocIndex, current: Id): NavigationResult {
  const container = containerOf(index, current);
  if (container !== null && isBranching(container.block) && container.branch !== null) {
    const block = container.block;
    const branches = branchesOf(block);
    const column = branches.findIndex((branch) => branch.id === container.branch);
    const right = branches[column + 1];
    if (right !== undefined) {
      return firstOfBranch(index, right.id);
    }
    if (block.kind === 'case' && block.otherwise === null) {
      return selectMissingDefault(block.id);
    }
    const after = firstAfter(index, visibleOrder(index, placeOf(index, current).diagram), block.id);
    return after === undefined ? stay : select(index, after);
  }
  // Not in a branch: Right goes into a control block (into its first branch).
  const [first] = childSeqs(placeOf(index, current).block);
  const inner = first?.seq.blocks[0];
  return inner === undefined ? stay : select(index, inner.id);
}

function stepFromLabel(
  index: DocIndex,
  branchId: Id,
  direction: 'up' | 'down' | 'left' | 'right',
): NavigationResult {
  const place = index.branches.get(branchId);
  if (place === undefined) {
    return stay;
  }
  const block = place.block;
  switch (direction) {
    case 'up':
      return select(index, block.id);
    case 'down':
      return firstOfBranch(index, branchId);
    case 'left': {
      const left = branchesOf(block)[place.column - 1];
      return left === undefined ? { kind: 'stay', reason: 'leftmostBranch' } : selectLabel(left.id);
    }
    case 'right': {
      const right = branchesOf(block)[place.column + 1];
      if (right !== undefined) {
        return selectLabel(right.id);
      }
      return block.kind === 'case' && block.otherwise === null
        ? selectMissingDefault(block.id)
        : { kind: 'stay', reason: 'rightmostBranch' };
    }
  }
}

function stepFromMissingDefault(
  index: DocIndex,
  caseId: Id,
  direction: 'up' | 'down' | 'left' | 'right',
): NavigationResult {
  const place = index.blocks.get(caseId);
  if (place?.block.kind !== 'case') {
    return stay;
  }
  const block = place.block;
  switch (direction) {
    case 'up':
      return select(index, block.id);
    case 'left': {
      const last = block.arms.at(-1);
      return last === undefined ? select(index, block.id) : firstOfBranch(index, last.id);
    }
    case 'down':
    case 'right': {
      const after = firstAfter(index, visibleOrder(index, place.diagram), block.id);
      return after === undefined ? stay : select(index, after);
    }
  }
}

function unit(index: DocIndex, current: Id, direction: 'up' | 'down'): NavigationResult {
  const place = placeOf(index, current);
  const seq = seqOfBlock(index, current);
  if (direction === 'up') {
    const previous = seq.seq.blocks[place.index - 1];
    if (previous !== undefined) {
      return select(index, previous.id);
    }
    return seq.holder === null ? stay : select(index, seq.holder);
  }
  for (let id: Id | null = current; id !== null; id = seqOfBlock(index, id).holder) {
    const next = seqOfBlock(index, id).seq.blocks[placeOf(index, id).index + 1];
    if (next !== undefined) {
      return select(index, next.id);
    }
  }
  return stay;
}

function sideBranch(index: DocIndex, current: Id, direction: 'left' | 'right'): NavigationResult {
  let isInBranch = false;
  for (let id: Id | null = current; id !== null; id = seqOfBlock(index, id).holder) {
    const container = containerOf(index, id);
    if (container === null) {
      break;
    }
    const block = container.block;
    if (!isBranching(block) || container.branch === null) {
      continue;
    }
    isInBranch = true;
    const branches = branchesOf(block);
    const column = branches.findIndex((branch) => branch.id === container.branch);
    const side = branches[column + (direction === 'right' ? 1 : -1)];
    if (side !== undefined) {
      return firstOfBranch(index, side.id);
    }
    if (direction === 'right' && block.kind === 'case' && block.otherwise === null) {
      return selectMissingDefault(block.id);
    }
  }
  if (isInBranch) {
    return stay;
  }
  return direction === 'right' ? stepDown(index, current) : stepUp(index, current);
}

function neighbourDiagram(
  index: DocIndex,
  selection: Selection,
  direction: 'previous' | 'next',
): NavigationResult {
  const diagrams = index.content.diagrams;
  const here = diagrams.findIndex((diagram) => diagram.id === diagramOf(index, selection));
  const there = diagrams[here + (direction === 'next' ? 1 : -1)];
  const first = there?.body.blocks[0];
  return first === undefined ? { kind: 'stay', reason: 'noDiagramThere' } : select(index, first.id);
}

function firstOfBranch(index: DocIndex, branch: Id): NavigationResult {
  const first = index.seqs.get(branch)?.seq.blocks[0];
  return first === undefined ? stay : select(index, first.id);
}

/** The first block after `block` in the drawn order that is not inside it. */
function firstAfter(index: DocIndex, order: ReadonlyArray<Id>, block: Id): Id | undefined {
  return order
    .slice(order.indexOf(block) + 1)
    .find((id) => !ancestorsOf(index, id).includes(block));
}

/**
 * Whether going from `a` to `b` crosses into another branch of an If or Case holding `a`.
 * Returns that If or Case, or `null`.
 */
function crossed(index: DocIndex, a: Id, b: Id): Block | null {
  for (const id of ancestorsOf(index, a).slice(1)) {
    const block = placeOf(index, id).block;
    if (!isBranching(block)) {
      continue;
    }
    const laneOfB = branchHolding(index, b, id);
    if (laneOfB !== null && laneOfB !== branchHolding(index, a, id)) {
      return block;
    }
  }
  return null;
}

/** The branch of block `holder` that holds block `id`, or `null` if `id` is not inside it. */
function branchHolding(index: DocIndex, id: Id, holder: Id): Id | null {
  for (let current: Id | null = id; current !== null;) {
    const seq = seqOfBlock(index, current);
    if (seq.holder === holder) {
      return seq.branch;
    }
    current = seq.holder;
  }
  return null;
}

/** The block reached when coming up into `block` from below (its leftmost branch's bottom). */
function bottomOf(block: Block): Id {
  const children = childSeqs(block);
  const child = isBranching(block) ? children[0] : children.at(-1);
  const last = child?.seq.blocks.at(-1);
  return last === undefined ? block.id : bottomOf(last);
}
