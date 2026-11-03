// Keyboard navigation (03-editor 2.2, interaction rules "키보드로 이동하고 삽입하기").
// The rules are functions over the drawn order of one diagram. They use the document only, not
// the DOM, so they are tested in Node. The MVP draws everything unfolded.
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
  /** `gg` `G`: the header (or first block) or the last block of this diagram. */
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
 * selects the last selected block (or header) again, or the top of the first diagram drawn: its
 * header, or its first block when it has none (interaction rules 2).
 */
export function navigate(
  index: DocIndex,
  selection: Selection | null,
  lastSelected: Id | null,
  navigation: Navigation,
): NavigationResult {
  if (selection === null) {
    if (lastSelected !== null && index.blocks.has(lastSelected)) {
      return select(index, lastSelected);
    }
    if (lastSelected !== null && hasHead(index, lastSelected)) {
      return selectHead(lastSelected);
    }
    return topOf(index, drawnDiagrams(index)[0] ?? null);
  }
  if (selection.kind === 'head') {
    return fromHead(index, selection.diagram, navigation);
  }
  switch (navigation.kind) {
    case 'step':
      return step(index, selection, navigation.direction);
    case 'unit': {
      const block = focusBlock(index, selection);
      return block === null ? stay : unit(index, block, navigation.direction);
    }
    case 'branch':
      return branchKey(index, selection, navigation.direction);
    case 'diagram':
      return neighbourDiagram(index, diagramOf(index, selection), navigation.direction);
    case 'edge': {
      const diagram = diagramOf(index, selection);
      if (navigation.end === 'first') {
        return topOf(index, diagram);
      }
      const last = diagram === null ? undefined : visibleOrder(index, diagram).at(-1);
      return last === undefined ? stay : select(index, last);
    }
  }
}

/**
 * A navigation key on a diagram's header (interaction rules 2): Down goes to the first block,
 * Left and Right to the side diagram's header (or first block). Up stays: the arrow keys leave
 * a diagram only sideways from its header.
 */
function fromHead(index: DocIndex, diagram: Id, navigation: Navigation): NavigationResult {
  switch (navigation.kind) {
    case 'step':
      switch (navigation.direction) {
        case 'up':
          return stay;
        case 'down':
          return firstOf(index, diagram);
        case 'left':
          return neighbourDiagram(index, diagram, 'previous');
        case 'right':
          return neighbourDiagram(index, diagram, 'next');
      }
      return stay;
    case 'unit':
      return navigation.direction === 'down' ? firstOf(index, diagram) : stay;
    case 'branch':
      return stay;
    case 'diagram':
      return neighbourDiagram(index, diagram, navigation.direction);
    case 'edge': {
      if (navigation.end === 'first') {
        return selectHead(diagram);
      }
      const last = visibleOrder(index, diagram).at(-1);
      return last === undefined ? stay : select(index, last);
    }
  }
}

/** Whether a diagram exists and has a header. */
function hasHead(index: DocIndex, diagram: Id): boolean {
  return (index.diagrams.get(diagram)?.head ?? null) !== null;
}

function selectHead(diagram: Id): NavigationResult {
  return { kind: 'select', selection: { kind: 'head', diagram } };
}

/** The top of a diagram: its header, or its first block when it has none. */
function topOf(index: DocIndex, diagram: Id | null): NavigationResult {
  if (diagram === null) {
    return stay;
  }
  return hasHead(index, diagram) ? selectHead(diagram) : firstOf(index, diagram);
}

function firstOf(index: DocIndex, diagram: Id): NavigationResult {
  const first = firstBlockOf(index, diagram);
  return first === null ? stay : select(index, first);
}

/**
 * The diagrams in the order they are drawn (02-layout 1.7): Events and diagrams without a
 * header, then Methods, each group in document order. "The side diagram" follows this order.
 */
export function drawnDiagrams(index: DocIndex): ReadonlyArray<Id> {
  const diagrams = index.content.diagrams;
  const methods = diagrams.filter((d) => d.head?.kind === 'method');
  const others = diagrams.filter((d) => d.head?.kind !== 'method');
  return [...others, ...methods].map((d) => d.id);
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
  const diagram = placeOf(index, current).diagram;
  const order = visibleOrder(index, diagram);
  const previous = order[order.indexOf(current) - 1];
  if (previous === undefined) {
    // From the first block, Up selects the diagram's header (interaction rules 2).
    return hasHead(index, diagram) ? selectHead(diagram) : stay;
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
  if (next !== undefined) {
    return select(index, next);
  }
  // Nothing below: the block that holds this one is selected (UX ND1). At the top level, stay.
  const parent = ancestorsOf(index, current)[1];
  return parent === undefined ? stay : select(index, parent);
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

/**
 * Ctrl+Left / Right. A branch label and the empty default cell count as inside their branch
 * (the empty default cell is its Case's rightmost column), so the key starts from there.
 */
function branchKey(
  index: DocIndex,
  selection: Selection,
  direction: 'left' | 'right',
): NavigationResult {
  switch (selection.kind) {
    case 'blocks':
      return sideBranch(index, selection.focus, direction);
    case 'branchLabel': {
      const place = index.branches.get(selection.branch);
      if (place === undefined) {
        return stay;
      }
      return (
        sideOf(index, place.block, place.column, direction) ??
        outward(index, place.block.id, direction) ??
        stay
      );
    }
    case 'missingDefault': {
      const block = index.blocks.get(selection.block)?.block;
      if (block?.kind !== 'case') {
        return stay;
      }
      return (
        sideOf(index, block, branchesOf(block).length, direction) ??
        outward(index, block.id, direction) ??
        stay
      );
    }
    case 'head':
    case 'fold':
      return stay;
  }
}

function sideBranch(index: DocIndex, current: Id, direction: 'left' | 'right'): NavigationResult {
  const result = outward(index, current, direction);
  if (result !== null) {
    return result;
  }
  return direction === 'right' ? stepDown(index, current) : stepUp(index, current);
}

/**
 * The side branch of the nearest If or Case holding `start`, looking further out if needed.
 * Stays when `start` is in a branch but no If or Case has one on that side; `null` when `start`
 * is in no branch at all.
 */
function outward(index: DocIndex, start: Id, direction: 'left' | 'right'): NavigationResult | null {
  let isInBranch = false;
  for (let id: Id | null = start; id !== null; id = seqOfBlock(index, id).holder) {
    const container = containerOf(index, id);
    if (container === null) {
      break;
    }
    const block = container.block;
    if (!isBranching(block) || container.branch === null) {
      continue;
    }
    isInBranch = true;
    const column = branchesOf(block).findIndex((branch) => branch.id === container.branch);
    const side = sideOf(index, block, column, direction);
    if (side !== null) {
      return side;
    }
  }
  return isInBranch ? stay : null;
}

/**
 * The column beside `column` of an If or Case: its branch's first block, or the empty default
 * cell right of a Case's last arm. `column` may be the empty default cell's (one past the
 * branches). `null` when there is none on that side.
 */
function sideOf(
  index: DocIndex,
  block: Block,
  column: number,
  direction: 'left' | 'right',
): NavigationResult | null {
  if (!isBranching(block)) {
    return null;
  }
  const branches = branchesOf(block);
  const side = branches[column + (direction === 'right' ? 1 : -1)];
  if (side !== undefined) {
    return firstOfBranch(index, side.id);
  }
  const isLastArm = column === branches.length - 1;
  if (direction === 'right' && isLastArm && block.kind === 'case' && block.otherwise === null) {
    return selectMissingDefault(block.id);
  }
  return null;
}

/** The side diagram's header, or its first block when it has none (interaction rules 2). */
function neighbourDiagram(
  index: DocIndex,
  diagram: Id | null,
  direction: 'previous' | 'next',
): NavigationResult {
  const order = drawnDiagrams(index);
  const here = diagram === null ? -1 : order.indexOf(diagram);
  const there = here < 0 ? undefined : order[here + (direction === 'next' ? 1 : -1)];
  return there === undefined ? { kind: 'stay', reason: 'noDiagramThere' } : topOf(index, there);
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
