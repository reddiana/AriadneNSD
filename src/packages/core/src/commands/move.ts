import type { Arm, Branch, Content, Id, Seq } from '../model/types';
import { done, fail, failWith, idsFor, isReason, resolveTarget } from './common';
import {
  cleanFolds,
  fillEmpty,
  foldRange,
  insertAt,
  permute,
  replaceRange,
  shrinkCrossing,
  sliceSeq,
} from './seq-edit';
import { indexContent, replaceBlock, updateSeq } from './tree';
import type { ContentIndex } from './tree';
import type { Result, Target, WithIds } from './types';

/** Arguments of `move`. */
export type MoveArgs = WithIds & {
  readonly target: Target;
  readonly direction: 'up' | 'down' | 'left' | 'right';
};

/**
 * Moves the target (R-EDIT-11, R-EDIT-03; interaction rules "이동", UX Q6).
 * - Up · down: the blocks trade places with the block above or below. At the end of a sequence
 *   they leave the control block holding them and go right before or after it; they never enter
 *   a neighbouring control block. At the top or bottom of a diagram the move is refused.
 *   Fold regions act like the control blocks here: blocks at the end of a region first step out
 *   of it, and a region next to the blocks is jumped over whole.
 * - Left · right: moves the branch holding the blocks (the nearest If or Case), see `moveBranch`.
 * Touched: the moved blocks (or the moved branch).
 */
export function move(content: Content, args: MoveArgs): Result {
  if (args.target.kind === 'diagramEnd') {
    return fail('wrongKind');
  }
  const index = indexContent(content);
  const range = resolveTarget(index, args.target);
  if (isReason(range)) {
    return failWith(range);
  }
  if (args.direction === 'left' || args.direction === 'right') {
    const branch = enclosingBranch(index, range.owner);
    return branch === null
      ? fail('notInBranch')
      : moveBranch(content, { branch, direction: args.direction });
  }

  const down = args.direction === 'down';
  const { owner, lo, hi } = range;
  const seq = shrinkCrossing(range.seq, lo, hi);
  const moved = seq.blocks.slice(lo, hi + 1).map((block) => block.id);

  const exited = stepOutOfFold(seq, lo, hi, down);
  if (exited !== null) {
    return done(
      updateSeq(content, owner, () => exited),
      moved,
    );
  }

  const atEnd = down ? hi === seq.blocks.length - 1 : lo === 0;
  if (!atEnd) {
    return done(
      updateSeq(content, owner, () => swapWithNeighbour(seq, lo, hi, down)),
      moved,
    );
  }

  const holder = index.seqs.get(owner)?.holder ?? null;
  const holderEntry = holder === null ? undefined : index.blocks.get(holder);
  if (holderEntry === undefined) {
    return fail(down ? 'atBottom' : 'atTop');
  }
  const ids = idsFor(content, args);
  const leaving = sliceSeq(seq, lo, hi, true);
  const rest = fillEmpty(replaceRange(seq, lo, hi, { blocks: [], folds: [] }), ids);
  const inner = updateSeq(content, owner, () => rest);
  const next = updateSeq(inner, holderEntry.owner, (parent) => {
    const at = parent.blocks.findIndex((block) => block.id === holderEntry.block.id);
    return down
      ? insertAt(parent, at + 1, leaving, 'after')
      : insertAt(parent, at, leaving, 'before');
  });
  return done(next, moved);
}

/**
 * If the blocks sit at the moving end of a fold region that also holds other blocks, they step
 * out of the innermost such region. Returns the new sequence, or `null` if there is none.
 */
function stepOutOfFold(seq: Seq, lo: number, hi: number, down: boolean): Seq | null {
  let best: { id: Id; size: number } | null = null;
  for (const fold of seq.folds) {
    const range = foldRange(seq, fold);
    if (range === null) {
      continue;
    }
    const [a, b] = range;
    const holds = a <= lo && hi <= b && !(a === lo && b === hi);
    const atMovingEnd = down ? b === hi : a === lo;
    if (holds && atMovingEnd && (best === null || b - a < best.size)) {
      best = { id: fold.id, size: b - a };
    }
  }
  if (best === null) {
    return null;
  }
  const stepped = best.id;
  const edge = down ? seq.blocks[lo - 1] : seq.blocks[hi + 1];
  if (edge === undefined) {
    throw new Error('stepOutOfFold: a region holding more than the range has no block beyond it');
  }
  const folds = seq.folds.map((fold) => {
    if (fold.id !== stepped) {
      return fold;
    }
    return down ? { ...fold, last: edge.id } : { ...fold, first: edge.id };
  });
  return cleanFolds({ ...seq, folds });
}

/**
 * Swaps `lo..hi` with the next item in the moving direction: the neighbouring block, or the whole
 * outermost fold region that starts (ends) there.
 */
function swapWithNeighbour(seq: Seq, lo: number, hi: number, down: boolean): Seq {
  const near = down ? hi + 1 : lo - 1;
  let far = near;
  for (const fold of seq.folds) {
    const range = foldRange(seq, fold);
    if (range === null) {
      continue;
    }
    const [a, b] = range;
    if (down && a === near) {
      far = Math.max(far, b);
    }
    if (!down && b === near) {
      far = Math.min(far, a);
    }
  }
  const indices = seq.blocks.map((_, i) => i);
  const order = down
    ? [
        ...indices.slice(0, lo),
        ...indices.slice(near, far + 1),
        ...indices.slice(lo, hi + 1),
        ...indices.slice(far + 1),
      ]
    : [
        ...indices.slice(0, far),
        ...indices.slice(lo, hi + 1),
        ...indices.slice(far, near + 1),
        ...indices.slice(hi + 1),
      ];
  return permute(seq, order);
}

/** The branch (If or Case) nearest around the sequence owned by `owner`, or `null`. */
function enclosingBranch(index: ContentIndex, owner: Id): Id | null {
  let current: Id | null = owner;
  while (current !== null) {
    if (index.branches.has(current)) {
      return current;
    }
    const holder: Id | null = index.seqs.get(current)?.holder ?? null;
    current = holder === null ? null : (index.blocks.get(holder)?.owner ?? null);
  }
  return null;
}

/** Arguments of `moveBranch`. */
export type MoveBranchArgs = {
  readonly branch: Id;
  readonly direction: 'left' | 'right';
};

/**
 * Swaps a branch with the branch beside it, blocks and all (R-EDIT-11, interaction rules "이동").
 * - Case: the label goes with the branch. The default branch stays last and does not move.
 * - If: the blocks of the two branches trade places; the labels stay where they are and the
 *   condition is not negated, so the note `checkCondition` asks the user to fix it.
 *   The branch ids go with the blocks, so a folded branch stays folded.
 * Touched: the moved branch.
 */
export function moveBranch(content: Content, args: MoveBranchArgs): Result {
  const index = indexContent(content);
  const entry = index.branches.get(args.branch);
  if (entry === undefined) {
    return fail('notFound', args.branch);
  }
  const owner = index.blocks.get(entry.block.id);
  if (owner === undefined) {
    throw new Error(`Branch ${args.branch} has no indexed block`);
  }
  const right = args.direction === 'right';
  const block = entry.block;

  if (block.kind === 'if') {
    if (entry.slot === 'yes' ? !right : right) {
      return fail(right ? 'atRightmost' : 'atLeftmost', args.branch);
    }
    const swapped = (place: Branch, from: Branch): Branch =>
      place.label === undefined
        ? { id: from.id, body: from.body }
        : { id: from.id, label: place.label, body: from.body };
    const next = replaceBlock(content, owner, () => ({
      ...block,
      yes: swapped(block.yes, block.no),
      no: swapped(block.no, block.yes),
    }));
    return done(next, [args.branch], { kind: 'checkCondition', node: block.id });
  }

  if (entry.slot === 'otherwise') {
    return fail('defaultBranchFixed', args.branch);
  }
  const i = entry.armIndex;
  const j = right ? i + 1 : i - 1;
  if (j < 0) {
    return fail('atLeftmost', args.branch);
  }
  if (j >= block.arms.length) {
    return fail(block.otherwise === null ? 'atRightmost' : 'defaultBranchFixed', args.branch);
  }
  const arms: Arm[] = block.arms.slice();
  const a = arms[i];
  const b = arms[j];
  if (a === undefined || b === undefined) {
    throw new Error('moveBranch: arm index out of range');
  }
  arms[i] = b;
  arms[j] = a;
  const next = replaceBlock(content, owner, () => ({ ...block, arms }));
  return done(next, [args.branch]);
}
