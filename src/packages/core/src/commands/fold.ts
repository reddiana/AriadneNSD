// Commands on fold regions (01-model 4.1 "접기 영역", interaction rules "접기 · 펼치기"): make,
// remove and rename. Folding and unfolding change only the view state and are not commands.
import type { Call, Content, FoldMark, Id, Path, Seq, SiteFold } from '../model/types';
import { done, fail, failWith, idsFor, isReason, resolveTarget, unchanged } from './common';
import { foldRange } from './seq-edit';
import { indexContent, mapCalls, replaceBlock, updateSeq } from './tree';
import type { Result, Target, WithIds } from './types';

/** Arguments of `makeFold`. */
export type MakeFoldArgs = WithIds & {
  /** A contiguous range of one sequence (ADR-0008). */
  readonly target: Target;
  /** The name; left out, the region shows its default name (R-EDIT-23). */
  readonly name?: string;
};

/**
 * Makes the target blocks a fold region (R-EDIT-14). One block is enough. Regions nest: a range
 * inside a region, or around one, is fine; one that would cross a region's end is refused
 * (`foldsCross`), and so is a range a region already has (`foldExists`) (invariant 5).
 * Touched: the new region.
 */
export function makeFold(content: Content, args: MakeFoldArgs): Result {
  if (args.target.kind !== 'blocks') {
    return fail('wrongKind');
  }
  const range = resolveTarget(indexContent(content), args.target);
  if (isReason(range)) {
    return failWith(range);
  }
  const clash = foldClash(range.seq, range.lo, range.hi);
  if (clash !== null) {
    return fail(clash.code, clash.fold);
  }
  const first = range.seq.blocks[range.lo];
  const last = range.seq.blocks[range.hi];
  if (first === undefined || last === undefined) {
    return fail('notFound');
  }
  const fold: FoldMark = {
    id: idsFor(content, args).next('fold'),
    first: first.id,
    last: last.id,
    ...(args.name === undefined || args.name === '' ? {} : { name: args.name }),
  };
  const next = updateSeq(content, range.owner, (seq) => ({ ...seq, folds: [...seq.folds, fold] }));
  return done(next, [fold.id]);
}

/** Whether a new region `lo..hi` on a sequence would repeat or cross one it has. */
function foldClash(
  seq: Seq,
  lo: number,
  hi: number,
): { readonly code: 'foldExists' | 'foldsCross'; readonly fold: Id } | null {
  for (const fold of seq.folds) {
    const range = foldRange(seq, fold);
    if (range === null) {
      continue;
    }
    const [a, b] = range;
    if (a === lo && b === hi) {
      return { code: 'foldExists', fold: fold.id };
    }
    if ((a < lo && lo <= b && b < hi) || (lo < a && a <= hi && hi < b)) {
      return { code: 'foldsCross', fold: fold.id };
    }
  }
  return null;
}

/** Arguments of `makeSiteFold`. */
export type MakeSiteFoldArgs = WithIds & {
  /** The outermost opened call block: the region belongs to it (01-model 1.6). */
  readonly call: Id;
  /** The call blocks opened inside it on the way, `[]` for directly inside. */
  readonly via: Path;
  /** Blocks of the called Method, in one of its sequences. */
  readonly first: Id;
  readonly last: Id;
  readonly name?: string;
};

/**
 * Makes a fold region that exists only where a call block is opened (R-EDIT-16): the called
 * Method is not changed and other calls of it do not show the region. The blocks must be in one
 * sequence of the Method that the path ends in (`notContiguous` otherwise), and the same range
 * at the same place is refused (`foldExists`). Touched: the new region.
 */
export function makeSiteFold(content: Content, args: MakeSiteFoldArgs): Result {
  const index = indexContent(content);
  const entry = index.blocks.get(args.call);
  if (entry === undefined) {
    return fail('notFound', args.call);
  }
  const call = entry.block;
  if (call.kind !== 'call') {
    return fail('wrongKind', args.call);
  }
  const first = index.blocks.get(args.first);
  const last = index.blocks.get(args.last);
  if (first === undefined || last === undefined) {
    return fail('notFound');
  }
  if (first.owner !== last.owner) {
    return fail('notContiguous');
  }
  const lo = Math.min(first.index, last.index);
  const hi = Math.max(first.index, last.index);
  const seq = index.seqs.get(first.owner)?.seq;
  const firstId = seq?.blocks[lo]?.id ?? args.first;
  const lastId = seq?.blocks[hi]?.id ?? args.last;
  const isSame = (fold: SiteFold): boolean =>
    sameIds(fold.via, args.via) && fold.first === firstId && fold.last === lastId;
  const existing = call.siteFolds.find(isSame);
  if (existing !== undefined) {
    return fail('foldExists', existing.id);
  }
  const fold: SiteFold = {
    id: idsFor(content, args).next('fold'),
    via: [...args.via],
    first: firstId,
    last: lastId,
    ...(args.name === undefined || args.name === '' ? {} : { name: args.name }),
  };
  const next = replaceBlock(content, entry, () => ({
    ...call,
    siteFolds: [...call.siteFolds, fold],
  }));
  return done(next, [fold.id]);
}

function sameIds(a: ReadonlyArray<Id>, b: ReadonlyArray<Id>): boolean {
  return a.length === b.length && a.every((id, index) => id === b[index]);
}

/** Arguments of `removeFold`. */
export type RemoveFoldArgs = {
  /** A fold region, or a fold region of an opened call site. */
  readonly fold: Id;
};

/**
 * Removes a fold region, folded or not (interaction rules "접기 · 펼치기" 풀기): the region and
 * its name go, the blocks stay. Touched: the first and the last block it held.
 */
export function removeFold(content: Content, args: RemoveFoldArgs): Result {
  const index = indexContent(content);
  const owner = index.folds.get(args.fold);
  if (owner !== undefined) {
    const seq = index.seqs.get(owner)?.seq;
    const fold = seq?.folds.find((mark) => mark.id === args.fold);
    if (seq === undefined || fold === undefined) {
      return fail('notFound', args.fold);
    }
    const next = updateSeq(content, owner, (old) => ({
      ...old,
      folds: old.folds.filter((mark) => mark.id !== args.fold),
    }));
    return done(next, [fold.first, fold.last]);
  }
  const found = siteFoldOf(content, args.fold);
  if (found === null) {
    return fail('notFound', args.fold);
  }
  const next = mapCalls(content, (call) =>
    call.id === found.call.id
      ? { ...call, siteFolds: call.siteFolds.filter((fold) => fold.id !== args.fold) }
      : call,
  );
  return done(next, [found.fold.first, found.fold.last]);
}

/** The site fold region with this id and the call block holding it, or `null`. */
export function siteFoldOf(
  content: Content,
  id: Id,
): { readonly call: Call; readonly fold: SiteFold } | null {
  let found: { readonly call: Call; readonly fold: SiteFold } | null = null;
  mapCalls(content, (call) => {
    const fold = call.siteFolds.find((item) => item.id === id);
    if (fold !== undefined) {
      found = { call, fold };
    }
    return call;
  });
  return found;
}

/** Arguments of `renameFold`. */
export type RenameFoldArgs = {
  readonly fold: Id;
  /** The new name. `''` removes it, so the default name shows again. */
  readonly name: string;
};

/**
 * Names a fold region (R-EDIT-23), also one of an opened call site. The name is saved in the
 * file (ADR-0017). An empty name removes it: the region shows its default name again (UX Q4).
 * The same name leaves the content as it is. Touched: the region.
 */
export function renameFold(content: Content, args: RenameFoldArgs): Result {
  const index = indexContent(content);
  const owner = index.folds.get(args.fold);
  const rename = <F extends FoldMark | SiteFold>(fold: F): F =>
    fold.id === args.fold ? withName(fold, args.name) : fold;
  if (owner !== undefined) {
    const fold = index.seqs.get(owner)?.seq.folds.find((mark) => mark.id === args.fold);
    if (fold === undefined) {
      return fail('notFound', args.fold);
    }
    if ((fold.name ?? '') === args.name) {
      return unchanged(content, [args.fold]);
    }
    const next = updateSeq(content, owner, (seq) => ({ ...seq, folds: seq.folds.map(rename) }));
    return done(next, [args.fold]);
  }
  const found = siteFoldOf(content, args.fold);
  if (found === null) {
    return fail('notFound', args.fold);
  }
  if ((found.fold.name ?? '') === args.name) {
    return unchanged(content, [args.fold]);
  }
  const next = mapCalls(content, (call) =>
    call.id === found.call.id ? { ...call, siteFolds: call.siteFolds.map(rename) } : call,
  );
  return done(next, [args.fold]);
}

/** A copy of a region with this name, or without one for `''`. */
function withName<F extends { readonly name?: string }>(fold: F, name: string): F {
  const copy: { name?: string } = { ...fold };
  if (name === '') {
    delete copy.name;
  } else {
    copy.name = name;
  }
  return copy as F;
}
