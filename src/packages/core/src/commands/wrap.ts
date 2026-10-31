import type { IdGenerator } from '../model/id';
import type { Block, Content, Id, Seq } from '../model/types';
import { done, fail, failWith, idsFor, isReason, resolveTarget } from './common';
import { emptySeq, fillEmpty, replaceRange, sliceSeq } from './seq-edit';
import { childSeqs, indexContent, isControlBlock, isEmptySeq, updateSeq } from './tree';
import type { NewBlockKind, Result, Target, WithIds, WrapKind } from './types';

/** Arguments of `wrap`. */
export type WrapArgs = WithIds & {
  readonly target: Target;
  readonly kind: NewBlockKind;
};

/**
 * Wraps the target blocks in a new control block (R-EDIT-06, interaction rules "감싸기 · 풀기").
 * The blocks go into the body of a loop, the true branch of an If, or the first branch of a Case
 * (whose second branch and default get an empty block). The new block takes the place of the
 * blocks and has empty text, for the editor to open. Fold regions inside the blocks go along;
 * a region of exactly these blocks stays outside and now holds the new block.
 * A process block cannot wrap anything. Touched: the new block.
 */
export function wrap(content: Content, args: WrapArgs): Result {
  if (args.kind === 'process') {
    return fail('cannotWrapWithProcess');
  }
  if (args.target.kind === 'diagramEnd') {
    return fail('wrongKind');
  }
  const range = resolveTarget(indexContent(content), args.target);
  if (isReason(range)) {
    return failWith(range);
  }
  const ids = idsFor(content, args);
  const inner = sliceSeq(range.seq, range.lo, range.hi, false);
  const wrapper = makeWrapper(args.kind, inner, ids);
  const next = updateSeq(content, range.owner, (seq) =>
    replaceRange(seq, range.lo, range.hi, { blocks: [wrapper], folds: [] }),
  );
  return done(next, [wrapper.id]);
}

function makeWrapper(kind: WrapKind, inner: Seq, ids: IdGenerator): Block {
  const id = ids.next('block');
  switch (kind) {
    case 'if':
      return {
        id,
        kind,
        text: '',
        yes: { id: ids.next('branch'), body: inner },
        no: { id: ids.next('branch'), body: emptySeq(ids) },
      };
    case 'case':
      return {
        id,
        kind,
        text: '',
        arms: [
          { id: ids.next('branch'), label: '1', body: inner },
          { id: ids.next('branch'), label: '2', body: emptySeq(ids) },
        ],
        otherwise: { id: ids.next('branch'), body: emptySeq(ids) },
      };
    case 'while':
    case 'doWhile':
    case 'for':
      return { id, kind, text: '', body: inner };
  }
}

/** Arguments of `unwrap`. */
export type UnwrapArgs = WithIds & {
  readonly target: Target;
};

/**
 * Removes a control block and leaves its blocks in its place (R-EDIT-07, UX Q7 · Q8).
 * When the target is one control block, that block is removed; otherwise the nearest control
 * block holding the target is. An If or Case leaves the blocks of its non-empty branches, one
 * branch after another; branches of only empty blocks leave nothing. Fold regions inside come
 * out with their blocks. Call blocks (R-EDIT-08) come later.
 * Touched: the blocks that came out (or the empty block left in their place).
 */
export function unwrap(content: Content, args: UnwrapArgs): Result {
  if (args.target.kind === 'diagramEnd') {
    return fail('wrongKind');
  }
  const index = indexContent(content);
  const range = resolveTarget(index, args.target);
  if (isReason(range)) {
    return failWith(range);
  }
  const only = range.lo === range.hi ? range.seq.blocks[range.lo] : undefined;
  if (only?.kind === 'call') {
    return fail('unsupported', only.id);
  }
  let shellId: Id | null;
  if (only !== undefined && isControlBlock(only)) {
    shellId = only.id;
  } else {
    shellId = index.seqs.get(range.owner)?.holder ?? null;
  }
  const shell = shellId === null ? undefined : index.blocks.get(shellId);
  if (shell === undefined) {
    return fail('noControlBlock');
  }

  const kept = childSeqs(shell.block)
    .map((child) => child.seq)
    .filter((seq) => !isEmptySeq(seq));
  const out: Seq = {
    blocks: kept.flatMap((seq) => seq.blocks),
    folds: kept.flatMap((seq) => seq.folds),
  };
  const ids = idsFor(content, args);
  let touched: ReadonlyArray<Id> = out.blocks.map((block) => block.id);
  const next = updateSeq(content, shell.owner, (seq) => {
    const rest = replaceRange(seq, shell.index, shell.index, out);
    const filled = fillEmpty(rest, ids);
    if (filled !== rest) {
      touched = filled.blocks.map((block) => block.id);
    }
    return filled;
  });
  return done(next, touched);
}
