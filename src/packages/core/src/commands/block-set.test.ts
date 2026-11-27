// Commands on the endless loop, exit and parallel blocks (R-BLK-15, R-BLK-12, R-BLK-13).
import { describe, expect, it } from 'vitest';

import type { Block, Branch, Content, Parallel } from '../model/types';
import { deleteBranch, insertBranch } from './branch';
import { copy, paste } from './clipboard';
import { editText } from './edit-text';
import { insertBlock } from './insert';
import { move, moveBranch } from './move';
import {
  blockOf,
  branch,
  contentOf,
  empty,
  expectRefused,
  idsIn,
  proc,
  runOk,
  seq,
} from './test-support';
import { indexContent } from './tree';
import { unwrap, wrap } from './wrap';

const parallel = (id: string, branches: ReadonlyArray<Branch>, text = ''): Parallel => ({
  id,
  kind: 'parallel',
  text,
  branches,
});

const endless = (id: string, blocks: ReadonlyArray<Block>): Block => ({
  id,
  kind: 'endless',
  body: seq(blocks),
});

const branchIds = (content: Content, id: string): ReadonlyArray<string> => {
  const block = blockOf(content, id);
  return block.kind === 'parallel' ? block.branches.map((b) => b.id) : [];
};

describe('inserting and wrapping', () => {
  const content = contentOf([proc('b1'), proc('b2')]);

  it('T-1526 · R-BLK-15 (UX EL1): a new endless loop has no text and one empty block in its body', () => {
    const result = runOk(insertBlock, content, {
      target: { kind: 'blocks', first: 'b1', last: 'b1' },
      side: 'after',
      kind: 'endless',
    });
    const made = blockOf(result.content, 'b3');
    expect(made).toEqual({ id: 'b3', kind: 'endless', body: seq([empty('b4')]) });
    expect(idsIn(result.content, 'd1')).toEqual(['b1', 'b3', 'b2']);
  });

  it('T-1527 · R-BLK-12 (UX XB1): a new exit block has empty text and takes the place of an empty block', () => {
    const result = runOk(insertBlock, content, {
      target: { kind: 'blocks', first: 'b2', last: 'b2' },
      side: 'before',
      kind: 'exit',
    });
    expect(blockOf(result.content, 'b3')).toEqual({ id: 'b3', kind: 'exit', text: '' });
    expect(result.touched).toEqual(['b3']);
    const onEmpty = runOk(insertBlock, contentOf([empty('b1')]), {
      target: { kind: 'blocks', first: 'b1', last: 'b1' },
      side: 'after',
      kind: 'exit',
    });
    expect(idsIn(onEmpty.content, 'd1')).toEqual(['b2']);
  });

  it('T-1528 · R-BLK-13 (UX PB1): a new parallel block has empty text and two empty branches', () => {
    const result = runOk(insertBlock, content, {
      target: { kind: 'blocks', first: 'b2', last: 'b2' },
      side: 'after',
      kind: 'parallel',
    });
    expect(blockOf(result.content, 'b3')).toEqual(
      parallel('b3', [branch('r1', [empty('b4')]), branch('r2', [empty('b5')])]),
    );
  });

  it('T-1529 · R-EDIT-06 (UX EL1 · PB1): wraps blocks in an endless loop, or in the first branch of a parallel block', () => {
    const target = { kind: 'blocks', first: 'b1', last: 'b2' } as const;
    const loop = runOk(wrap, content, { target, kind: 'endless' });
    expect(blockOf(loop.content, 'b3')).toEqual(endless('b3', [proc('b1'), proc('b2')]));
    const split = runOk(wrap, content, { target, kind: 'parallel' });
    expect(blockOf(split.content, 'b3')).toEqual(
      parallel('b3', [branch('r1', [proc('b1'), proc('b2')]), branch('r2', [empty('b4')])]),
    );
  });

  it('T-1530 · R-EDIT-06 (UX XB1): an exit block cannot wrap blocks', () => {
    expectRefused(
      wrap,
      content,
      { target: { kind: 'blocks', first: 'b1', last: 'b1' }, kind: 'exit' },
      'cannotWrapWithProcess',
    );
  });

  it('T-1531 · R-EDIT-07: unwrapping an endless loop or a parallel block leaves the blocks of its non-empty branches', () => {
    const nested = contentOf([
      endless('b1', [proc('b2')]),
      parallel('b3', [branch('r1', [proc('b4')]), branch('r2', [empty('b5')])]),
    ]);
    const loop = runOk(unwrap, nested, { target: { kind: 'blocks', first: 'b1', last: 'b1' } });
    expect(idsIn(loop.content, 'd1')).toEqual(['b2', 'b3']);
    const split = runOk(unwrap, nested, { target: { kind: 'blocks', first: 'b4', last: 'b4' } });
    expect(idsIn(split.content, 'd1')).toEqual(['b1', 'b4']);
  });
});

describe('parallel branches', () => {
  const content = contentOf([
    parallel('b1', [
      branch('r1', [proc('b2')]),
      branch('r2', [proc('b3')]),
      branch('r3', [proc('b4')]),
    ]),
  ]);

  it('T-1532 · R-BLK-13 (UX PB1): inserts an empty branch without a label right or left of the selected one', () => {
    const right = runOk(insertBranch, content, { branch: 'r2', side: 'after' });
    expect(branchIds(right.content, 'b1')).toEqual(['r1', 'r2', 'r4', 'r3']);
    expect(right.touched).toEqual(['r4']);
    const made = blockOf(right.content, 'b1');
    expect(made.kind === 'parallel' ? made.branches[2] : null).toEqual(branch('r4', [empty('b5')]));
    const left = runOk(insertBranch, content, { branch: 'r1', side: 'before' });
    expect(branchIds(left.content, 'b1')).toEqual(['r4', 'r1', 'r2', 'r3']);
  });

  it('T-1533 · R-BLK-13 (UX PB1): deletes a branch with its blocks but keeps at least two', () => {
    const result = runOk(deleteBranch, content, { branch: 'r2' });
    expect(branchIds(result.content, 'b1')).toEqual(['r1', 'r3']);
    expect(result.touched).toEqual(['b1']);
    expect(indexContent(result.content).blocks.has('b3')).toBe(false);
    expectRefused(deleteBranch, result.content, { branch: 'r1' }, 'lastParallelBranches');
  });

  it('T-1534 · R-BLK-13 (UX PB1): moves a branch left or right, not past either end', () => {
    const right = runOk(moveBranch, content, { branch: 'r1', direction: 'right' });
    expect(branchIds(right.content, 'b1')).toEqual(['r2', 'r1', 'r3']);
    expect(right.touched).toEqual(['r1']);
    expectRefused(moveBranch, content, { branch: 'r1', direction: 'left' }, 'atLeftmost');
    expectRefused(moveBranch, content, { branch: 'r3', direction: 'right' }, 'atRightmost');
    const fromBlock = runOk(move, content, {
      target: { kind: 'blocks', first: 'b4', last: 'b4' },
      direction: 'left',
    });
    expect(branchIds(fromBlock.content, 'b1')).toEqual(['r1', 'r3', 'r2']);
  });

  it('T-1535 · R-BLK-13 (UX PB1): a parallel branch has no label to edit, but the block has a text', () => {
    expectRefused(editText, content, { node: 'r1', text: 'x' }, 'unsupported');
    const result = runOk(editText, content, { node: 'b1', text: 'fetch all' });
    const block = blockOf(result.content, 'b1');
    expect(block.kind === 'parallel' ? block.text : null).toBe('fetch all');
  });
});

describe('texts and copies', () => {
  it('T-1536 · R-BLK-15 (UX EL1): an endless loop has no text to edit; an exit block has one', () => {
    const content = contentOf([endless('b1', [{ id: 'b2', kind: 'exit', text: '' }])]);
    expectRefused(editText, content, { node: 'b1', text: 'x' }, 'unsupported');
    const result = runOk(editText, content, { node: 'b2', text: 'return x' });
    expect(blockOf(result.content, 'b2')).toEqual({ id: 'b2', kind: 'exit', text: 'return x' });
  });

  it('T-1537 · R-EDIT-10: copying and pasting the new blocks gives new ids all through', () => {
    const content = contentOf([
      endless('b1', [{ id: 'b2', kind: 'exit', text: 'break' }]),
      parallel('b3', [branch('r1', [proc('b4')]), branch('r2', [proc('b5')])], 'go'),
    ]);
    const clip = copy(content, { target: { kind: 'blocks', first: 'b1', last: 'b3' } });
    if (!clip.ok) {
      throw new Error(clip.reason.code);
    }
    const result = runOk(paste, content, {
      target: { kind: 'blocks', first: 'b3', last: 'b3' },
      side: 'after',
      clip: clip.clip,
    });
    expect(idsIn(result.content, 'd1')).toEqual(['b1', 'b3', 'b6', 'b8']);
    expect(blockOf(result.content, 'b6')).toEqual(
      endless('b6', [{ id: 'b7', kind: 'exit', text: 'break' }]),
    );
    expect(blockOf(result.content, 'b8')).toEqual(
      parallel('b8', [branch('r3', [proc('b9', 'b4')]), branch('r4', [proc('b10', 'b5')])], 'go'),
    );
  });
});
