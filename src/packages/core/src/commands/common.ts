// Helpers shared by the commands: resolving a target, making blocks, finishing a result.
import { createIdGenerator } from '../model/id';
import type { IdGenerator } from '../model/id';
import type { Arm, Block, Content, Id, Seq } from '../model/types';
import { foldRange } from './seq-edit';
import { emptySeq } from './seq-edit';
import { isEmptyBlock } from './tree';
import type { ContentIndex } from './tree';
import type { FailResult, NewBlockKind, Note, OkResult, Reason, Target, WithIds } from './types';

/** A target resolved to an index range in one sequence. */
export type Range = {
  /** The owner id of the sequence. */
  readonly owner: Id;
  readonly seq: Seq;
  readonly lo: number;
  readonly hi: number;
  /** Whether blocks inserted at the ends join fold regions ending there (UX MD1). */
  readonly join: boolean;
};

/** Resolves a target, or returns why it cannot be used. `diagramEnd` resolves to the last block. */
export function resolveTarget(index: ContentIndex, target: Target): Range | Reason {
  switch (target.kind) {
    case 'blocks': {
      const first = index.blocks.get(target.first);
      const last = index.blocks.get(target.last);
      if (first === undefined || last === undefined) {
        return { code: 'notFound' };
      }
      if (first.owner !== last.owner) {
        return { code: 'notContiguous' };
      }
      const seq = seqOf(index, first.owner);
      return {
        owner: first.owner,
        seq,
        lo: Math.min(first.index, last.index),
        hi: Math.max(first.index, last.index),
        join: true,
      };
    }
    case 'fold': {
      const owner = index.folds.get(target.fold);
      if (owner === undefined) {
        return { code: 'notFound', node: target.fold };
      }
      const seq = seqOf(index, owner);
      const fold = seq.folds.find((mark) => mark.id === target.fold);
      const range = fold === undefined ? null : foldRange(seq, fold);
      if (range === null) {
        return { code: 'notFound', node: target.fold };
      }
      return { owner, seq, lo: range[0], hi: range[1], join: false };
    }
    case 'diagramEnd': {
      const diagram = index.diagrams.get(target.diagram);
      if (diagram === undefined) {
        return { code: 'notFound', node: target.diagram };
      }
      const last = diagram.body.blocks.length - 1;
      return { owner: diagram.id, seq: diagram.body, lo: last, hi: last, join: false };
    }
  }
}

/** The sequence owned by `owner`. The owner must be in the index. */
export function seqOf(index: ContentIndex, owner: Id): Seq {
  const entry = index.seqs.get(owner);
  if (entry === undefined) {
    throw new Error(`No sequence owned by ${owner}`);
  }
  return entry.seq;
}

/** Whether a value is a reason rather than a resolved value. */
export function isReason(value: object): value is Reason {
  return 'code' in value;
}

/** Whether the range is one empty block, which a new block replaces (interaction rules 2). */
export function isSingleEmpty(range: Range): boolean {
  const block = range.seq.blocks[range.lo];
  return range.lo === range.hi && block !== undefined && isEmptyBlock(block);
}

/** The id generator to use for a command. */
export function idsFor(content: Content, args: WithIds): IdGenerator {
  return args.ids ?? createIdGenerator(content);
}

/** A failed result. */
export function fail(code: Reason['code'], node?: Id): FailResult {
  return { ok: false, reason: node === undefined ? { code } : { code, node } };
}

/** A failed result from a reason. */
export function failWith(reason: Reason): FailResult {
  return { ok: false, reason };
}

/**
 * A successful result. The content is normalized first: a diagram with neither a header nor
 * content is removed unless it is the only one (invariant 7).
 */
export function done(content: Content, touched: ReadonlyArray<Id>, note?: Note): OkResult {
  const normalized = dropBlankDiagrams(content);
  return note === undefined
    ? { ok: true, content: normalized, touched }
    : { ok: true, content: normalized, touched, note };
}

/** Nothing had to change. */
export function unchanged(content: Content, touched: ReadonlyArray<Id>): OkResult {
  return { ok: true, content, touched };
}

function dropBlankDiagrams(content: Content): Content {
  if (content.diagrams.length < 2) {
    return content;
  }
  const kept = content.diagrams.filter(
    (diagram) =>
      !(
        diagram.head === null &&
        diagram.body.blocks.length === 1 &&
        diagram.body.blocks.every(isEmptyBlock)
      ),
  );
  if (kept.length === content.diagrams.length) {
    return content;
  }
  const first = content.diagrams[0];
  return { ...content, diagrams: kept.length > 0 || first === undefined ? kept : [first] };
}

/**
 * A new block of the given kind with empty text. Its inner sequences are one empty block each;
 * a new Case has two branches and a default (interaction rules "Case 블록").
 */
export function newBlock(kind: NewBlockKind, ids: IdGenerator): Block {
  const id = ids.next('block');
  switch (kind) {
    case 'process':
      return { id, kind, text: '' };
    case 'if':
      return {
        id,
        kind,
        text: '',
        yes: { id: ids.next('branch'), body: emptySeq(ids) },
        no: { id: ids.next('branch'), body: emptySeq(ids) },
      };
    case 'case':
      return {
        id,
        kind,
        text: '',
        arms: [
          { id: ids.next('branch'), label: '1', body: emptySeq(ids) },
          { id: ids.next('branch'), label: '2', body: emptySeq(ids) },
        ],
        otherwise: { id: ids.next('branch'), body: emptySeq(ids) },
      };
    case 'while':
    case 'doWhile':
    case 'for':
      return { id, kind, text: '', body: emptySeq(ids) };
  }
}

/** A label for a new Case branch: the smallest positive number not used as a label yet. */
export function freshArmLabel(arms: ReadonlyArray<Arm>): string {
  const used = new Set(arms.map((arm) => arm.label));
  let n = 1;
  while (used.has(String(n))) {
    n += 1;
  }
  return String(n);
}
