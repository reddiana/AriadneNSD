// Property-based tests (07-testing 1, QA-01): any sequence of commands keeps the invariants,
// never changes its input, and undo (going back to a kept snapshot) gives the same document.
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';

import { createIdGenerator } from '../model/id';
import { checkInvariants } from '../model/invariants';
import type { Content } from '../model/types';
import { convertCaseToIf, convertIfToCase, deleteBranch, insertBranch } from './branch';
import { copy, cut, paste } from './clipboard';
import { deleteBlocks } from './delete';
import { editText } from './edit-text';
import { insertBlock } from './insert';
import { move, moveBranch } from './move';
import { createContent } from './new-document';
import { deepFreeze } from './test-support';
import { indexContent, updateSeq } from './tree';
import type { Result, Target } from './types';
import { unwrap, wrap } from './wrap';

const kinds = ['process', 'if', 'case', 'while', 'doWhile', 'for'] as const;
const sides = ['after', 'before'] as const;

type Op = {
  readonly name: (typeof opNames)[number];
  readonly pick: number;
  readonly span: number;
  readonly other: number;
  readonly kind: (typeof kinds)[number];
  readonly side: (typeof sides)[number];
  readonly direction: 'up' | 'down' | 'left' | 'right';
  readonly useFold: boolean;
};

const opNames = [
  'insert',
  'insert',
  'insert',
  'delete',
  'edit',
  'move',
  'wrap',
  'unwrap',
  'paste',
  'cut',
  'insertBranch',
  'deleteBranch',
  'moveBranch',
  'convert',
  'addFold',
  'addFold',
] as const;

const opArbitrary: fc.Arbitrary<Op> = fc.record({
  name: fc.constantFrom(...opNames),
  pick: fc.nat(1000),
  span: fc.nat(3),
  other: fc.nat(1000),
  kind: fc.constantFrom(...kinds),
  side: fc.constantFrom(...sides),
  direction: fc.constantFrom('up', 'down', 'left', 'right'),
  useFold: fc.boolean(),
});

/** A target picked from the content: a block range, or sometimes a fold region. */
function pickTarget(content: Content, op: Op, pick = op.pick): Target {
  const index = indexContent(content);
  const folds = [...index.folds.keys()];
  const fold = folds[pick % Math.max(folds.length, 1)];
  if (op.useFold && fold !== undefined) {
    return { kind: 'fold', fold };
  }
  const blocks = [...index.blocks.values()];
  const entry = blocks[pick % blocks.length];
  if (entry === undefined) {
    throw new Error('a content always has a block');
  }
  const seq = index.seqs.get(entry.owner)?.seq;
  const last = seq?.blocks[Math.min(entry.index + op.span, seq.blocks.length - 1)];
  return { kind: 'blocks', first: entry.block.id, last: last?.id ?? entry.block.id };
}

function pickBranch(content: Content, pick: number): string {
  const branches = [...indexContent(content).branches.keys()];
  return branches[pick % Math.max(branches.length, 1)] ?? 'r0';
}

/** Test-only: marks a fold region on a picked range when it nests with the others. */
function addFold(content: Content, op: Op): Result {
  const target = pickTarget(content, { ...op, useFold: false });
  if (target.kind !== 'blocks') {
    return { ok: false, reason: { code: 'wrongKind' } };
  }
  const owner = indexContent(content).blocks.get(target.first)?.owner;
  if (owner === undefined) {
    return { ok: false, reason: { code: 'notFound' } };
  }
  const id = createIdGenerator(content).next('fold');
  const next = updateSeq(content, owner, (seq) => ({
    ...seq,
    folds: [...seq.folds, { id, first: target.first, last: target.last }],
  }));
  return checkInvariants(next).length === 0
    ? { ok: true, content: next, touched: [id] }
    : { ok: false, reason: { code: 'notContiguous' } };
}

function apply(content: Content, op: Op): Result {
  const target = pickTarget(content, op);
  const branch = pickBranch(content, op.pick);
  switch (op.name) {
    case 'insert':
      return insertBlock(content, { target, side: op.side, kind: op.kind });
    case 'delete':
      return deleteBlocks(content, { target });
    case 'edit': {
      const node = op.useFold ? branch : target.kind === 'blocks' ? target.first : branch;
      return editText(content, { node, text: `t${String(op.other)}` });
    }
    case 'move':
      return move(content, { target, direction: op.direction });
    case 'wrap':
      return wrap(content, { target, kind: op.kind });
    case 'unwrap':
      return unwrap(content, { target });
    case 'paste': {
      const copied = copy(content, { target });
      if (!copied.ok) {
        return copied;
      }
      return paste(content, {
        target: pickTarget(content, op, op.other),
        side: op.side,
        clip: copied.clip,
      });
    }
    case 'cut':
      return cut(content, { target });
    case 'insertBranch':
      return insertBranch(content, { branch, side: op.side });
    case 'deleteBranch':
      return deleteBranch(content, { branch });
    case 'moveBranch':
      return moveBranch(content, { branch, direction: op.side === 'after' ? 'right' : 'left' });
    case 'convert': {
      const owner = indexContent(content).branches.get(branch)?.block;
      if (owner === undefined) {
        return { ok: false, reason: { code: 'notFound' } };
      }
      return owner.kind === 'if'
        ? convertIfToCase(content, { block: owner.id })
        : convertCaseToIf(content, { block: owner.id });
    }
    case 'addFold':
      return addFold(content, op);
  }
}

describe('commands, property-based', () => {
  it('QA-01: any sequence of commands keeps the invariants and never changes its input', () => {
    const succeeded = new Map<string, number>();
    fc.assert(
      fc.property(fc.array(opArbitrary, { minLength: 20, maxLength: 60 }), (ops) => {
        let content = deepFreeze(createContent());
        const history: { content: Content; json: string }[] = [];
        for (const op of ops) {
          const json = JSON.stringify(content);
          const result = apply(content, op);
          // Frozen input: any mutation would have thrown. Check it still reads the same.
          expect(JSON.stringify(content)).toBe(json);
          if (!result.ok) {
            continue;
          }
          succeeded.set(op.name, (succeeded.get(op.name) ?? 0) + 1);
          expect(checkInvariants(result.content)).toEqual([]);
          // Redo: the same command on the same content gives the same content.
          expect(apply(content, op)).toEqual(result);
          if (result.content !== content) {
            history.push({ content, json });
          }
          content = deepFreeze(result.content);
        }
        // Undo all the way: every kept snapshot is still exactly what it was.
        for (const entry of history.reverse()) {
          expect(JSON.stringify(entry.content)).toBe(entry.json);
        }
      }),
      { numRuns: 300 },
    );
    // The generated operations must really exercise every command, not only fail.
    for (const name of new Set(opNames)) {
      expect(succeeded.get(name) ?? 0, name).toBeGreaterThan(50);
    }
  });

  it('QA-01: ids stay unique even when the generator must avoid ids of the view state', () => {
    fc.assert(
      fc.property(fc.array(fc.constantFrom(...kinds), { maxLength: 15 }), (list) => {
        let content = createContent();
        for (const kind of list) {
          const ids = createIdGenerator(content, ['b50', 'r50']);
          const result = insertBlock(content, {
            target: { kind: 'diagramEnd', diagram: 'd1' },
            side: 'after',
            kind,
            ids,
          });
          if (result.ok && result.content !== content) {
            expect(checkInvariants(result.content)).toEqual([]);
            expect(result.touched.every((id) => Number(id.slice(1)) > 50)).toBe(true);
            content = result.content;
          }
        }
      }),
      { numRuns: 100 },
    );
  });
});
