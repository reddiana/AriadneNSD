// The invariants of a document (01-model 3). Checked after every command and after reading a file.
import type { Block, Content, Diagram, Id, Seq } from './types';

/** One broken invariant. `invariant` is its number in 01-model 3. */
export type Violation = {
  readonly invariant: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  /** Where: the id of the node the problem is on, when there is one. */
  readonly node?: Id;
  /** A developer-facing description, in English. */
  readonly message: string;
};

/**
 * Checks invariants 1–7 of 01-model 3 and lists every violation (empty when the content is
 * valid). Header name rules are not invariants and are not checked here.
 */
export function checkInvariants(content: Content): ReadonlyArray<Violation> {
  const found: Violation[] = [];
  const report = (invariant: Violation['invariant'], message: string, node?: Id): void => {
    found.push(node === undefined ? { invariant, message } : { invariant, message, node });
  };

  // 1. At least one diagram.
  if (content.diagrams.length === 0) {
    report(1, 'the document has no diagram');
  }

  // 3. Unique ids. Collected while walking, together with the other per-node checks.
  const seen = new Set<Id>();
  const note = (id: Id): void => {
    if (seen.has(id)) {
      report(3, `id ${id} is used more than once`, id);
    }
    seen.add(id);
  };

  const methods = new Set(
    content.diagrams.filter((d) => d.head?.kind === 'method').map((d) => d.id),
  );

  const checkSeq = (seq: Seq, owner: Id): void => {
    // 2. No empty sequence.
    if (seq.blocks.length === 0) {
      report(2, `the sequence of ${owner} has no blocks`, owner);
    }
    for (const block of seq.blocks) {
      checkBlock(block);
    }
    checkFolds(seq, owner, report);
    for (const fold of seq.folds) {
      note(fold.id);
    }
  };

  const checkBlock = (block: Block): void => {
    note(block.id);
    switch (block.kind) {
      case 'process':
        return;
      case 'if':
        // 4. An If has two branches. The type says so; a file may not.
        if (!isObject(block.yes) || !isObject(block.no)) {
          report(4, `If ${block.id} does not have two branches`, block.id);
          return;
        }
        note(block.yes.id);
        checkSeq(block.yes.body, block.yes.id);
        note(block.no.id);
        checkSeq(block.no.body, block.no.id);
        return;
      case 'case':
        // 4. A Case has at least one branch, counting the default.
        if (block.arms.length === 0 && block.otherwise === null) {
          report(4, `Case ${block.id} has no branch`, block.id);
        }
        for (const arm of block.arms) {
          note(arm.id);
          checkSeq(arm.body, arm.id);
        }
        if (block.otherwise !== null) {
          note(block.otherwise.id);
          checkSeq(block.otherwise.body, block.otherwise.id);
        }
        return;
      case 'while':
      case 'doWhile':
      case 'for':
        checkSeq(block.body, block.id);
        return;
      case 'call':
        for (const fold of block.siteFolds) {
          note(fold.id);
        }
        // 6. A local call names an existing Method.
        if (block.target.kind === 'local' && !methods.has(block.target.diagram)) {
          report(
            6,
            `call ${block.id} names ${block.target.diagram}, which is not a Method here`,
            block.id,
          );
        }
        return;
    }
  };

  for (const diagram of content.diagrams) {
    note(diagram.id);
    checkSeq(diagram.body, diagram.id);
    // 7. A diagram with neither header nor content only when it is the only diagram.
    if (content.diagrams.length > 1 && isBlank(diagram)) {
      report(7, `diagram ${diagram.id} has neither a header nor content`, diagram.id);
    }
  }
  return found;
}

/**
 * Throws if the content breaks an invariant. A broken invariant after a command is a bug in the
 * command; the editor catches this, rolls back and logs it (coding guide 5).
 */
export function assertInvariants(content: Content): void {
  const violations = checkInvariants(content);
  if (violations.length > 0) {
    const lines = violations.map((v) => `invariant ${String(v.invariant)}: ${v.message}`);
    throw new Error(`Document invariants broken:\n${lines.join('\n')}`);
  }
}

/** Whether a diagram has neither a header nor content: no header and one empty block. */
function isBlank(diagram: Diagram): boolean {
  const [only] = diagram.body.blocks;
  return (
    diagram.head === null &&
    diagram.body.blocks.length === 1 &&
    only?.kind === 'process' &&
    only.text === ''
  );
}

// 5. Fold regions: ends in this sequence and in order; regions nest or stay apart; no two alike.
function checkFolds(
  seq: Seq,
  owner: Id,
  report: (invariant: 5, message: string, node?: Id) => void,
): void {
  const position = new Map<Id, number>(seq.blocks.map((block, index) => [block.id, index]));
  const ranges: { id: Id; a: number; b: number }[] = [];
  for (const fold of seq.folds) {
    const a = position.get(fold.first);
    const b = position.get(fold.last);
    if (a === undefined || b === undefined) {
      report(5, `fold ${fold.id} on ${owner} names a block outside its sequence`, fold.id);
      continue;
    }
    if (a > b) {
      report(5, `fold ${fold.id} on ${owner} ends before it starts`, fold.id);
      continue;
    }
    for (const other of ranges) {
      if (other.a === a && other.b === b) {
        report(5, `folds ${other.id} and ${fold.id} have the same range`, fold.id);
      } else if (
        (other.a < a && a <= other.b && other.b < b) ||
        (a < other.a && other.a <= b && b < other.b)
      ) {
        report(5, `folds ${other.id} and ${fold.id} overlap without nesting`, fold.id);
      }
    }
    ranges.push({ id: fold.id, a, b });
  }
}

function isObject(value: unknown): boolean {
  return typeof value === 'object' && value !== null;
}
