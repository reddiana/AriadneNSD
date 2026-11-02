import type { Content, Seq } from '../model/types';
import {
  done,
  failWith,
  idsFor,
  isReason,
  isSingleEmpty,
  newBlock,
  resolveTarget,
  unchanged,
} from './common';
import type { Range } from './common';
import { insertAt, replaceRange } from './seq-edit';
import { indexContent, updateSeq } from './tree';
import type { NewBlockKind, Result, Side, Target, WithIds } from './types';

/** Arguments of `insertBlock`. */
export type InsertBlockArgs = WithIds & {
  readonly target: Target;
  readonly side: Side;
  readonly kind: NewBlockKind;
  /**
   * A process block on an empty block goes next to it, like on any block (`o` / `O`,
   * UX KP2). Without this the empty block itself is the place to write.
   */
  readonly besideEmpty?: boolean;
};

/**
 * Inserts a new block after (or before) the target (R-EDIT-01).
 * On an empty block the new block takes its place: a process block leaves the content as it is
 * (the editor opens the text field), a control block replaces it (interaction rules 2).
 * With `besideEmpty` a process block goes next to the empty block instead (UX KP2).
 * Touched: the new block (or the empty block that stays).
 */
export function insertBlock(content: Content, args: InsertBlockArgs): Result {
  const range = resolveTarget(indexContent(content), args.target);
  if (isReason(range)) {
    return failWith(range);
  }
  const isBeside = args.besideEmpty === true && args.kind === 'process';
  if (isSingleEmpty(range) && args.kind === 'process' && !isBeside) {
    const empty = range.seq.blocks[range.lo];
    return unchanged(content, empty === undefined ? [] : [empty.id]);
  }
  const ids = idsFor(content, args);
  const block = newBlock(args.kind, ids);
  // With nothing selected the block always goes at the very end.
  const side = args.target.kind === 'diagramEnd' ? 'after' : args.side;
  const next = putBlocks(content, range, side, { blocks: [block], folds: [] }, !isBeside);
  return done(next, [block.id]);
}

/**
 * Puts blocks next to a resolved range: in place of a single empty block, otherwise after or
 * before the range. Fold regions at that end take the blocks in when the range says so (UX MD1).
 * `fillsEmpty: false` keeps a single empty block and puts the blocks next to it.
 */
export function putBlocks(
  content: Content,
  range: Range,
  side: Side,
  insert: Seq,
  fillsEmpty = true,
): Content {
  return updateSeq(content, range.owner, (seq) => {
    if (fillsEmpty && isSingleEmpty(range)) {
      return replaceRange(seq, range.lo, range.hi, insert);
    }
    const join = range.join ? side : 'none';
    return side === 'after'
      ? insertAt(seq, range.hi + 1, insert, join)
      : insertAt(seq, range.lo, insert, join);
  });
}
