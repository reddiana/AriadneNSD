// Lookup tables over one document content, for selection, navigation and hit testing.
// Every sequence has one owner with an id: a diagram (its body), a loop block (its body) or a
// branch (its body), as in core. So a sequence is named by its owner's id alone.
import type { Arm, Block, Branch, Case, Content, Diagram, Id, If, Seq } from '@ariadne-nsd/core';

/** Where a block sits. */
export type BlockPlace = {
  readonly block: Block;
  /** The owner id of the sequence holding the block. */
  readonly owner: Id;
  readonly index: number;
  readonly diagram: Id;
};

/** A sequence and what holds it. */
export type SeqPlace = {
  readonly seq: Seq;
  readonly owner: Id;
  /** The control block holding this sequence; `null` for a diagram body. */
  readonly holder: Id | null;
  /** The branch owning the sequence, when it is a branch body of an If or a Case. */
  readonly branch: Id | null;
  readonly diagram: Id;
};

/** One branch of an If or a Case, in drawn order (columns from the left). */
export type BranchPlace = {
  readonly branch: Branch | Arm;
  readonly block: If | Case;
  /** The column from the left: If true 0, false 1; Case arms, then the default. */
  readonly column: number;
  readonly isDefault: boolean;
};

/** The lookup tables of one content. */
export type DocIndex = {
  readonly content: Content;
  readonly blocks: ReadonlyMap<Id, BlockPlace>;
  readonly seqs: ReadonlyMap<Id, SeqPlace>;
  readonly branches: ReadonlyMap<Id, BranchPlace>;
  readonly diagrams: ReadonlyMap<Id, Diagram>;
  /** Fold regions → the owner id of the sequence they are marked on (01-model 1.3). */
  readonly folds: ReadonlyMap<Id, Id>;
  /** Fold regions of opened call sites → the call block holding them (01-model 1.6). */
  readonly siteFolds: ReadonlyMap<Id, Id>;
};

/** One sequence directly inside a block, left to right. */
export type ChildSeq = { readonly owner: Id; readonly seq: Seq; readonly branch: Id | null };

/** The branches of an If or Case in drawn order. A Case's default comes last. */
export function branchesOf(block: If | Case): ReadonlyArray<Branch | Arm> {
  if (block.kind === 'if') {
    return [block.yes, block.no];
  }
  return block.otherwise === null ? block.arms : [...block.arms, block.otherwise];
}

/** The sequences directly inside a block, left to right. */
export function childSeqs(block: Block): ReadonlyArray<ChildSeq> {
  switch (block.kind) {
    case 'process':
    case 'call':
      return [];
    case 'if':
    case 'case':
      return branchesOf(block).map((branch) => ({
        owner: branch.id,
        seq: branch.body,
        branch: branch.id,
      }));
    case 'while':
    case 'doWhile':
    case 'for':
      return [{ owner: block.id, seq: block.body, branch: null }];
  }
}

/** Whether a block has branches side by side (If, Case). */
export function isBranching(block: Block): block is If | Case {
  return block.kind === 'if' || block.kind === 'case';
}

/** Whether a block holds other blocks. */
export function isControl(block: Block): boolean {
  return childSeqs(block).length > 0;
}

/** Whether a block is an empty block: a process block with no text (01-model 1.4). */
export function isEmptyBlock(block: Block): boolean {
  return block.kind === 'process' && block.text === '';
}

/** Builds the lookup tables for a content in one walk. */
export function indexDoc(content: Content): DocIndex {
  const blocks = new Map<Id, BlockPlace>();
  const seqs = new Map<Id, SeqPlace>();
  const branches = new Map<Id, BranchPlace>();
  const diagrams = new Map<Id, Diagram>();
  const folds = new Map<Id, Id>();
  const siteFolds = new Map<Id, Id>();

  const visit = (seq: Seq, owner: Id, holder: Id | null, branch: Id | null, diagram: Id): void => {
    seqs.set(owner, { seq, owner, holder, branch, diagram });
    for (const fold of seq.folds) {
      folds.set(fold.id, owner);
    }
    seq.blocks.forEach((block, index) => {
      blocks.set(block.id, { block, owner, index, diagram });
      if (block.kind === 'call') {
        for (const fold of block.siteFolds) {
          siteFolds.set(fold.id, block.id);
        }
      }
      if (isBranching(block)) {
        branchesOf(block).forEach((item, column) => {
          const isDefault = block.kind === 'case' && item === block.otherwise;
          branches.set(item.id, { branch: item, block, column, isDefault });
        });
      }
      for (const child of childSeqs(block)) {
        visit(child.seq, child.owner, block.id, child.branch, diagram);
      }
    });
  };

  for (const diagram of content.diagrams) {
    diagrams.set(diagram.id, diagram);
    visit(diagram.body, diagram.id, null, null, diagram.id);
  }
  return { content, blocks, seqs, branches, diagrams, folds, siteFolds };
}

/** The place of a block. Throws when the id is not a block: callers check ids first. */
export function placeOf(index: DocIndex, id: Id): BlockPlace {
  const place = index.blocks.get(id);
  if (place === undefined) {
    throw new Error(`No block ${id}`);
  }
  return place;
}

/** The sequence holding a block. */
export function seqOfBlock(index: DocIndex, id: Id): SeqPlace {
  const seq = index.seqs.get(placeOf(index, id).owner);
  if (seq === undefined) {
    throw new Error(`No sequence holds block ${id}`);
  }
  return seq;
}

/** The control block holding a block, with the branch it sits in, or `null` at the top. */
export function containerOf(
  index: DocIndex,
  id: Id,
): { readonly block: Block; readonly branch: Id | null } | null {
  const seq = seqOfBlock(index, id);
  if (seq.holder === null) {
    return null;
  }
  return { block: placeOf(index, seq.holder).block, branch: seq.branch };
}

/** The block itself and the blocks holding it, innermost first. */
export function ancestorsOf(index: DocIndex, id: Id): ReadonlyArray<Id> {
  const out: Id[] = [];
  for (let current: Id | null = id; current !== null;) {
    out.push(current);
    current = seqOfBlock(index, current).holder;
  }
  return out;
}

/** The blocks of one diagram in drawn order: a block, then its branches left to right. */
export function visibleOrder(index: DocIndex, diagram: Id): ReadonlyArray<Id> {
  const out: Id[] = [];
  const walk = (seq: Seq): void => {
    for (const block of seq.blocks) {
      out.push(block.id);
      for (const child of childSeqs(block)) {
        walk(child.seq);
      }
    }
  };
  const found = index.diagrams.get(diagram);
  if (found !== undefined) {
    walk(found.body);
  }
  return out;
}
