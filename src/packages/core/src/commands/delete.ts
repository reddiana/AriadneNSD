import type { Content, Id } from '../model/types';
import { done, fail, failWith, idsFor, isReason, isSingleEmpty, resolveTarget } from './common';
import { fillEmpty, replaceRange } from './seq-edit';
import { indexContent, updateSeq } from './tree';
import type { Result, Target, WithIds } from './types';

/** Arguments of `deleteBlocks`. */
export type DeleteBlocksArgs = WithIds & {
  readonly target: Target;
};

/**
 * Deletes the target blocks with everything inside them (R-EDIT-01).
 * A sequence left with no blocks gets one empty block (01-model 4.1), and fold regions shrink to
 * the blocks left (rule F). Deleting the only, empty block of a sequence changes nothing and is
 * refused. Touched: the new empty block, if one was made. The editor computes the next selection
 * before running this (03-editor 2.3).
 */
export function deleteBlocks(content: Content, args: DeleteBlocksArgs): Result {
  if (args.target.kind === 'diagramEnd') {
    return fail('wrongKind');
  }
  const range = resolveTarget(indexContent(content), args.target);
  if (isReason(range)) {
    return failWith(range);
  }
  if (isSingleEmpty(range) && range.seq.blocks.length === 1) {
    return fail('alreadyEmpty', range.seq.blocks[0]?.id);
  }
  const ids = idsFor(content, args);
  const touched: Id[] = [];
  const next = updateSeq(content, range.owner, (seq) => {
    const rest = replaceRange(seq, range.lo, range.hi, { blocks: [], folds: [] });
    const filled = fillEmpty(rest, ids);
    if (filled !== rest) {
      touched.push(...filled.blocks.map((block) => block.id));
    }
    return filled;
  });
  return done(next, touched);
}
