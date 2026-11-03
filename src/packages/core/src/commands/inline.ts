// Replacing a call block with the blocks of the Method it calls (R-EDIT-08): the opposite of
// "새 Method로 빼기". The blocks are copied in with new ids and the Method stays.
import { placeSiteFolds } from '../layout/shown';
import type { IdGenerator } from '../model/id';
import type {
  Arm,
  Block,
  Branch,
  Call,
  Content,
  FoldMark,
  Id,
  Seq,
  SiteFold,
} from '../model/types';
import { done, fail, idsFor } from './common';
import { foldRange, replaceRange } from './seq-edit';
import { indexContent, updateSeq } from './tree';
import type { OkResult, Result, WithIds } from './types';

/** Arguments of `inlineCall`. */
export type InlineCallArgs = WithIds & {
  /** The call block to replace. */
  readonly block: Id;
};

/**
 * The result of `inlineCall`. `renamed` maps each id of the Method (blocks, branches, fold
 * regions) and each site fold region of the call to the id of its copy, so the editor can show
 * the copies folded and opened the way the originals were.
 */
export type InlineResult =
  (OkResult & { readonly renamed: ReadonlyMap<Id, Id> }) | Exclude<Result, OkResult>;

/**
 * Replaces a call block with a copy of the blocks of the Method it calls (R-EDIT-08, interaction
 * rules "감싸기 · 풀기"). The texts are copied as the Method has them; the call's arguments and
 * result are dropped (UX Q16). The fold regions of this call site become fold regions of the
 * copied blocks (interaction rules "펴 보인 곳의 접기 영역"); those of calls opened further in
 * go with the copies of those calls. Calls inside keep calling what they called. Only a call of
 * a Method of this document can be replaced (`notCallable`, UX Q17).
 * Touched: the copied blocks.
 */
export function inlineCall(content: Content, args: InlineCallArgs): InlineResult {
  const index = indexContent(content);
  const entry = index.blocks.get(args.block);
  if (entry === undefined) {
    return fail('notFound', args.block);
  }
  const call = entry.block;
  if (call.kind !== 'call') {
    return fail('wrongKind', args.block);
  }
  const target = call.target;
  const method = target.kind === 'local' ? index.diagrams.get(target.diagram) : undefined;
  if (method === undefined) {
    return fail('notCallable', args.block);
  }
  const ids = idsFor(content, args);
  const renamed = new Map<Id, Id>();
  const here = call.siteFolds.filter((fold) => fold.via.length === 0);
  const deeper = call.siteFolds.filter((fold) => fold.via.length > 0);
  const marks = new Map<Seq, FoldMark[]>();
  for (const [seq, ranges] of placeSiteFolds(method.body, here)) {
    const added: FoldMark[] = [];
    for (const { fold, lo, hi } of ranges) {
      const first = seq.blocks[lo];
      const last = seq.blocks[hi];
      if (first !== undefined && last !== undefined && !clashes(seq, added, lo, hi)) {
        added.push({ ...withoutVia(fold), first: first.id, last: last.id });
      }
    }
    marks.set(seq, added);
  }
  const copier: Copier = { ids, renamed, marks, deeper };
  const copied = copySeq(copier, method.body);
  const next = updateSeq(content, entry.owner, (seq) =>
    replaceRange(seq, entry.index, entry.index, copied),
  );
  const result = done(
    next,
    copied.blocks.map((block) => block.id),
  );
  return { ...result, renamed };
}

/** Whether a new region `lo..hi` would repeat or cross a region already on the sequence. */
function clashes(seq: Seq, added: ReadonlyArray<FoldMark>, lo: number, hi: number): boolean {
  return [...seq.folds, ...added].some((fold) => {
    const range = foldRange({ blocks: seq.blocks, folds: [] }, fold);
    if (range === null) {
      return false;
    }
    const [a, b] = range;
    return (a === lo && b === hi) || (a < lo && lo <= b && b < hi) || (lo < a && a <= hi && hi < b);
  });
}

function withoutVia(fold: SiteFold): FoldMark {
  return {
    id: fold.id,
    first: fold.first,
    last: fold.last,
    ...(fold.name === undefined ? {} : { name: fold.name }),
  };
}

type Copier = {
  readonly ids: IdGenerator;
  readonly renamed: Map<Id, Id>;
  /** The fold regions of the call site to add to sequences of the Method. */
  readonly marks: ReadonlyMap<Seq, ReadonlyArray<FoldMark>>;
  /** Site regions of calls opened further in: they go with the copies of those calls. */
  readonly deeper: ReadonlyArray<SiteFold>;
};

function copySeq(copier: Copier, seq: Seq): Seq {
  const blocks = seq.blocks.map((block) => copyBlock(copier, block));
  const folds: FoldMark[] = [];
  for (const fold of [...seq.folds, ...(copier.marks.get(seq) ?? [])]) {
    const first = copier.renamed.get(fold.first);
    const last = copier.renamed.get(fold.last);
    if (first !== undefined && last !== undefined) {
      const id = copier.ids.next('fold');
      copier.renamed.set(fold.id, id);
      folds.push({ ...fold, id, first, last });
    }
  }
  return { blocks, folds };
}

function copyBlock(copier: Copier, block: Block): Block {
  const id = copier.ids.next('block');
  copier.renamed.set(block.id, id);
  const branch = <B extends Branch | Arm>(old: B): B => {
    const copy = copier.ids.next('branch');
    copier.renamed.set(old.id, copy);
    return { ...old, id: copy, body: copySeq(copier, old.body) };
  };
  switch (block.kind) {
    case 'process':
      return { ...block, id };
    case 'if':
      return { ...block, id, yes: branch(block.yes), no: branch(block.no) };
    case 'case':
      return {
        ...block,
        id,
        arms: block.arms.map(branch),
        otherwise: block.otherwise === null ? null : branch(block.otherwise),
      };
    case 'while':
    case 'doWhile':
    case 'for':
      return { ...block, id, body: copySeq(copier, block.body) };
    case 'call':
      return { ...block, id, siteFolds: siteFoldsOf(copier, block) };
  }
}

/**
 * The site regions a copied call block keeps: its own, and those the outer call kept for the
 * path through it, now one step shorter.
 */
function siteFoldsOf(copier: Copier, block: Call): ReadonlyArray<SiteFold> {
  const moved = copier.deeper
    .filter((fold) => fold.via[0] === block.id)
    .map((fold) => ({ ...fold, via: fold.via.slice(1) }));
  return [...block.siteFolds, ...moved].map((fold) => {
    const id = copier.ids.next('fold');
    copier.renamed.set(fold.id, id);
    return { ...fold, id };
  });
}
