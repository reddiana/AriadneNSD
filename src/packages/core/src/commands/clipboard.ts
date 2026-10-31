import type { IdGenerator } from '../model/id';
import type { Arm, Block, Branch, CallTarget, Content, FoldMark, Id, Seq } from '../model/types';
import { done, fail, failWith, idsFor, isReason, resolveTarget } from './common';
import { deleteBlocks } from './delete';
import { putBlocks } from './insert';
import { foldRange, sliceSeq } from './seq-edit';
import { indexContent } from './tree';
import type { Clip, FailResult, OkResult, Result, Side, Target, WithIds } from './types';

/** Arguments of `copy` and `cut`. */
export type CopyArgs = WithIds & {
  readonly target: Target;
};

/** The result of `copy`. */
export type CopyResult = { readonly ok: true; readonly clip: Clip } | FailResult;

/** The result of `cut`: the result of deleting, with what was cut. */
export type CutResult = (OkResult & { readonly clip: Clip }) | FailResult;

/**
 * Copies the target blocks, whole subtrees (R-EDIT-10). Fold regions inside the range come
 * along. Copying does not change the content, so it is not a command; the editor puts the clip
 * on the clipboard (03-editor 3.3).
 */
export function copy(content: Content, args: CopyArgs): CopyResult {
  if (args.target.kind === 'diagramEnd') {
    return fail('wrongKind');
  }
  const range = resolveTarget(indexContent(content), args.target);
  if (isReason(range)) {
    return failWith(range);
  }
  return { ok: true, clip: sliceSeq(range.seq, range.lo, range.hi, true) };
}

/** Copies the target blocks and deletes them (R-EDIT-10). See `copy` and `deleteBlocks`. */
export function cut(content: Content, args: CopyArgs): CutResult {
  const copied = copy(content, args);
  if (!copied.ok) {
    return copied;
  }
  const deleted = deleteBlocks(content, args);
  return deleted.ok ? { ...deleted, clip: copied.clip } : deleted;
}

/** Arguments of `paste`. */
export type PasteArgs = WithIds & {
  readonly target: Target;
  readonly side: Side;
  readonly clip: Clip;
};

/**
 * Pastes copied blocks after (or before) the target, or in place of an empty block
 * (R-EDIT-10, interaction rules "붙여넣기"). Every pasted node gets a new id, and fold regions in
 * the clip are mapped to the new ids (01-model 1.7). A call block whose Method is not in this
 * document loses its target. Touched: the pasted blocks.
 */
export function paste(content: Content, args: PasteArgs): Result {
  if (args.clip.blocks.length === 0) {
    return fail('emptyClip');
  }
  const index = indexContent(content);
  const range = resolveTarget(index, args.target);
  if (isReason(range)) {
    return failWith(range);
  }
  const methods = new Set(
    content.diagrams
      .filter((diagram) => diagram.head?.kind === 'method')
      .map((diagram) => diagram.id),
  );
  const fresh = renewSeq(args.clip, idsFor(content, args), methods);
  const side = args.target.kind === 'diagramEnd' ? 'after' : args.side;
  const next = putBlocks(content, range, side, fresh);
  return done(
    next,
    fresh.blocks.map((block) => block.id),
  );
}

/** A deep copy of a sequence with new ids. Broken or crossing fold regions are left out. */
function renewSeq(seq: Seq, ids: IdGenerator, methods: ReadonlySet<Id>): Seq {
  const renamed = new Map<Id, Id>();
  const blocks = seq.blocks.map((block) => {
    const copied = renewBlock(block, ids, methods);
    renamed.set(block.id, copied.id);
    return copied;
  });
  const folds: FoldMark[] = [];
  for (const fold of laminar(seq)) {
    const first = renamed.get(fold.first);
    const last = renamed.get(fold.last);
    if (first === undefined || last === undefined) {
      continue;
    }
    folds.push({ ...fold, id: ids.next('fold'), first, last });
  }
  return { blocks, folds };
}

/** The fold regions of a sequence that are valid and nest, keeping the earlier on a clash. */
function laminar(seq: Seq): ReadonlyArray<FoldMark> {
  const kept: { fold: FoldMark; a: number; b: number }[] = [];
  for (const fold of seq.folds) {
    const range = foldRange(seq, fold);
    if (range === null) {
      continue;
    }
    const [a, b] = range;
    const clashes = kept.some(
      (other) =>
        (other.a === a && other.b === b) ||
        (other.a < a && a <= other.b && other.b < b) ||
        (a < other.a && other.a <= b && b < other.b),
    );
    if (!clashes) {
      kept.push({ fold, a, b });
    }
  }
  return kept.map((entry) => entry.fold);
}

function renewBlock(block: Block, ids: IdGenerator, methods: ReadonlySet<Id>): Block {
  const id = ids.next('block');
  const branch = (old: Branch): Branch => ({
    ...old,
    id: ids.next('branch'),
    body: renewSeq(old.body, ids, methods),
  });
  const arm = (old: Arm): Arm => ({
    ...old,
    id: ids.next('branch'),
    body: renewSeq(old.body, ids, methods),
  });
  switch (block.kind) {
    case 'process':
      return { ...block, id };
    case 'if':
      return { ...block, id, yes: branch(block.yes), no: branch(block.no) };
    case 'case':
      return {
        ...block,
        id,
        arms: block.arms.map(arm),
        otherwise: block.otherwise === null ? null : branch(block.otherwise),
      };
    case 'while':
    case 'doWhile':
    case 'for':
      return { ...block, id, body: renewSeq(block.body, ids, methods) };
    case 'call':
      return {
        ...block,
        id,
        target: keepTarget(block.target, methods),
        siteFolds: block.siteFolds.map((fold) => ({ ...fold, id: ids.next('fold') })),
      };
  }
}

/** A local target must name a Method of this document (invariant 6); otherwise it is lost. */
function keepTarget(target: CallTarget, methods: ReadonlySet<Id>): CallTarget {
  return target.kind === 'local' && !methods.has(target.diagram)
    ? { kind: 'lost', lastName: '' }
    : target;
}
