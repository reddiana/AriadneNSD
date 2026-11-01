// Finding and replacing nodes in the immutable content tree.
// Every sequence has exactly one owner with an id: a diagram (its body), a loop block (its body)
// or a branch (its body). So a sequence is named by its owner's id alone.
import type { Arm, Block, Branch, Call, Case, Content, Diagram, Id, If, Seq } from '../model/types';

/** Where a block sits. */
export type BlockEntry = {
  readonly block: Block;
  /** The owner id of the sequence holding the block. */
  readonly owner: Id;
  readonly index: number;
  readonly diagram: Id;
};

/** A sequence and what holds it. */
export type SeqEntry = {
  readonly seq: Seq;
  readonly owner: Id;
  /** The control block holding this sequence (directly or through a branch). `null` for a body. */
  readonly holder: Id | null;
  readonly diagram: Id;
};

/** Where a branch sits. */
export type BranchEntry = {
  readonly branch: Branch | Arm;
  readonly block: If | Case;
  readonly slot: 'yes' | 'no' | 'arm' | 'otherwise';
  /** The position among the arms; `-1` for `yes`, `no` and `otherwise`. */
  readonly armIndex: number;
};

/** Lookup tables for one content, built in one walk. */
export type ContentIndex = {
  readonly blocks: ReadonlyMap<Id, BlockEntry>;
  readonly seqs: ReadonlyMap<Id, SeqEntry>;
  readonly branches: ReadonlyMap<Id, BranchEntry>;
  readonly diagrams: ReadonlyMap<Id, Diagram>;
  /** Fold region id → owner id of the sequence it is marked on. */
  readonly folds: ReadonlyMap<Id, Id>;
};

/** Builds the lookup tables for a content. */
export function indexContent(content: Content): ContentIndex {
  const blocks = new Map<Id, BlockEntry>();
  const seqs = new Map<Id, SeqEntry>();
  const branches = new Map<Id, BranchEntry>();
  const diagrams = new Map<Id, Diagram>();
  const folds = new Map<Id, Id>();

  const visitSeq = (seq: Seq, owner: Id, holder: Id | null, diagram: Id): void => {
    seqs.set(owner, { seq, owner, holder, diagram });
    for (const fold of seq.folds) {
      folds.set(fold.id, owner);
    }
    seq.blocks.forEach((block, index) => {
      blocks.set(block.id, { block, owner, index, diagram });
      for (const child of childSeqs(block)) {
        if (
          child.branch !== null &&
          child.slot !== 'body' &&
          (block.kind === 'if' || block.kind === 'case')
        ) {
          branches.set(child.branch.id, {
            branch: child.branch,
            block,
            slot: child.slot,
            armIndex: child.armIndex,
          });
        }
        visitSeq(child.seq, child.owner, block.id, diagram);
      }
    });
  };

  for (const diagram of content.diagrams) {
    diagrams.set(diagram.id, diagram);
    visitSeq(diagram.body, diagram.id, null, diagram.id);
  }
  return { blocks, seqs, branches, diagrams, folds };
}

/** A sequence directly inside a block. */
export type ChildSeq = {
  readonly seq: Seq;
  readonly owner: Id;
  readonly branch: Branch | Arm | null;
  readonly slot: 'yes' | 'no' | 'arm' | 'otherwise' | 'body';
  readonly armIndex: number;
};

/** The sequences directly inside a block, left to right. */
export function childSeqs(block: Block): ReadonlyArray<ChildSeq> {
  switch (block.kind) {
    case 'process':
    case 'call':
      return [];
    case 'if':
      return [
        { seq: block.yes.body, owner: block.yes.id, branch: block.yes, slot: 'yes', armIndex: -1 },
        { seq: block.no.body, owner: block.no.id, branch: block.no, slot: 'no', armIndex: -1 },
      ];
    case 'case': {
      const arms: ChildSeq[] = block.arms.map((arm, armIndex) => ({
        seq: arm.body,
        owner: arm.id,
        branch: arm,
        slot: 'arm',
        armIndex,
      }));
      if (block.otherwise !== null) {
        const otherwise = block.otherwise;
        arms.push({
          seq: otherwise.body,
          owner: otherwise.id,
          branch: otherwise,
          slot: 'otherwise',
          armIndex: -1,
        });
      }
      return arms;
    }
    case 'while':
    case 'doWhile':
    case 'for':
      return [{ seq: block.body, owner: block.id, branch: null, slot: 'body', armIndex: -1 }];
  }
}

/**
 * Returns a content whose sequence owned by `owner` is replaced by `update(seq)`.
 * Unchanged subtrees are shared with the old content (ADR-0029).
 */
export function updateSeq(content: Content, owner: Id, update: (seq: Seq) => Seq): Content {
  const diagrams = content.diagrams.map((diagram) => {
    const body = diagram.id === owner ? update(diagram.body) : inSeq(diagram.body, owner, update);
    return body === diagram.body ? diagram : { ...diagram, body };
  });
  return sameItems(diagrams, content.diagrams) ? content : { ...content, diagrams };
}

function inSeq(seq: Seq, owner: Id, update: (seq: Seq) => Seq): Seq {
  const blocks = seq.blocks.map((block) => inBlock(block, owner, update));
  return sameItems(blocks, seq.blocks) ? seq : { ...seq, blocks };
}

function inBlock(block: Block, owner: Id, update: (seq: Seq) => Seq): Block {
  const body = (seq: Seq, seqOwner: Id): Seq =>
    seqOwner === owner ? update(seq) : inSeq(seq, owner, update);
  const branch = <B extends Branch | Arm>(b: B): B => {
    const next = body(b.body, b.id);
    return next === b.body ? b : { ...b, body: next };
  };
  switch (block.kind) {
    case 'process':
    case 'call':
      return block;
    case 'if': {
      const yes = branch(block.yes);
      const no = branch(block.no);
      return yes === block.yes && no === block.no ? block : { ...block, yes, no };
    }
    case 'case': {
      const arms = block.arms.map(branch);
      const otherwise = block.otherwise === null ? null : branch(block.otherwise);
      return sameItems(arms, block.arms) && otherwise === block.otherwise
        ? block
        : { ...block, arms, otherwise };
    }
    case 'while':
    case 'doWhile':
    case 'for': {
      const next = body(block.body, block.id);
      return next === block.body ? block : { ...block, body: next };
    }
  }
}

/** Whether two arrays hold the very same items. */
function sameItems<T>(a: ReadonlyArray<T>, b: ReadonlyArray<T>): boolean {
  return a.length === b.length && a.every((item, i) => item === b[i]);
}

/** Returns a content with one block replaced. The block must exist (look it up first). */
export function replaceBlock(
  content: Content,
  entry: BlockEntry,
  update: (block: Block) => Block,
): Content {
  return updateSeq(content, entry.owner, (seq) => {
    const blocks = seq.blocks.slice();
    const block = blocks[entry.index];
    if (block === undefined) {
      throw new Error(`Block ${entry.block.id} is not at its indexed place`);
    }
    blocks[entry.index] = update(block);
    return { ...seq, blocks };
  });
}

/** Whether a block is an empty block: a process block with no text (01-model 1.4). */
export function isEmptyBlock(block: Block): boolean {
  return block.kind === 'process' && block.text === '';
}

/** Whether every block of a sequence is an empty block. */
export function isEmptySeq(seq: Seq): boolean {
  return seq.blocks.every(isEmptyBlock);
}

/** Whether a block holds other blocks. */
export function isControlBlock(block: Block): boolean {
  return block.kind !== 'process' && block.kind !== 'call';
}

/**
 * Returns a content in which every call block is replaced by `update(call)`, in every diagram.
 * Unchanged subtrees are shared with the old content (ADR-0029).
 */
export function mapCalls(content: Content, update: (call: Call) => Call): Content {
  const inCalls = (seq: Seq): Seq => {
    const blocks = seq.blocks.map(callsInBlock);
    return sameItems(blocks, seq.blocks) ? seq : { ...seq, blocks };
  };
  const callsInBlock = (block: Block): Block => {
    if (block.kind === 'call') {
      return update(block);
    }
    const branch = <B extends Branch | Arm>(b: B): B => {
      const body = inCalls(b.body);
      return body === b.body ? b : { ...b, body };
    };
    switch (block.kind) {
      case 'process':
        return block;
      case 'if': {
        const yes = branch(block.yes);
        const no = branch(block.no);
        return yes === block.yes && no === block.no ? block : { ...block, yes, no };
      }
      case 'case': {
        const arms = block.arms.map(branch);
        const otherwise = block.otherwise === null ? null : branch(block.otherwise);
        return sameItems(arms, block.arms) && otherwise === block.otherwise
          ? block
          : { ...block, arms, otherwise };
      }
      case 'while':
      case 'doWhile':
      case 'for': {
        const body = inCalls(block.body);
        return body === block.body ? block : { ...block, body };
      }
    }
  };
  const diagrams = content.diagrams.map((diagram) => {
    const body = inCalls(diagram.body);
    return body === diagram.body ? diagram : { ...diagram, body };
  });
  return sameItems(diagrams, content.diagrams) ? content : { ...content, diagrams };
}
