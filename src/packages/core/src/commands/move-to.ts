import type { Block, Content, Id } from '../model/types';
import { done, fail, failWith, idsFor, isReason, resolveTarget, unchanged } from './common';
import { putBlocks } from './insert';
import { fillEmpty, replaceRange, sliceSeq } from './seq-edit';
import { childSeqs, indexContent, updateSeq } from './tree';
import type { Result, Side, Target, WithIds } from './types';

/** Arguments of `moveTo`. */
export type MoveToArgs = WithIds & {
  /** The blocks to move. */
  readonly target: Target;
  /** The block to put them next to. When it is a sequence's only empty block, they replace it. */
  readonly to: Id;
  readonly side: Side;
};

/**
 * Moves the target blocks next to another block anywhere in the document, keeping their ids:
 * a drop of dragged blocks (R-EDIT-09, interaction rules 7). Unlike `move`, the blocks may go
 * into a neighbouring control block. A sequence left with no blocks gets one empty block; an
 * empty block as the destination is replaced. Fold regions inside the range go along.
 * Dropping the blocks where they already are changes nothing; dropping them inside themselves is
 * refused with `intoItself`. Touched: the moved blocks.
 */
export function moveTo(content: Content, args: MoveToArgs): Result {
  if (args.target.kind === 'diagramEnd') {
    return fail('wrongKind');
  }
  const index = indexContent(content);
  const range = resolveTarget(index, args.target);
  if (isReason(range)) {
    return failWith(range);
  }
  const destination = index.blocks.get(args.to);
  if (destination === undefined) {
    return fail('notFound', args.to);
  }
  const moved = range.seq.blocks.slice(range.lo, range.hi + 1);
  const movedIds = moved.map((block) => block.id);
  if (destination.owner === range.owner) {
    const at = destination.index;
    const isInRange = at >= range.lo && at <= range.hi;
    const isRightBefore = args.side === 'before' && at === range.hi + 1;
    const isRightAfter = args.side === 'after' && at === range.lo - 1;
    if (isInRange || isRightBefore || isRightAfter) {
      return unchanged(content, movedIds);
    }
  }
  if (moved.some((block) => holds(block, args.to))) {
    return fail('intoItself', args.to);
  }
  const ids = idsFor(content, args);
  const clip = sliceSeq(range.seq, range.lo, range.hi, true);
  const removed = updateSeq(content, range.owner, (seq) =>
    fillEmpty(replaceRange(seq, range.lo, range.hi, { blocks: [], folds: [] }), ids),
  );
  const place = resolveTarget(indexContent(removed), {
    kind: 'blocks',
    first: args.to,
    last: args.to,
  });
  if (isReason(place)) {
    throw new Error(`moveTo: the destination ${args.to} was lost`);
  }
  return done(putBlocks(removed, place, args.side, clip), movedIds);
}

/** Whether `id` is a block somewhere inside `block` (not `block` itself). */
function holds(block: Block, id: Id): boolean {
  return childSeqs(block).some((child) =>
    child.seq.blocks.some((inner) => inner.id === id || holds(inner, id)),
  );
}
