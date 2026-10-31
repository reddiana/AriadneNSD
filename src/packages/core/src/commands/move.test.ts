import { describe, expect, it } from 'vitest';

import { move, moveBranch } from './move';
import {
  arm,
  blockOf,
  branch,
  caseBlock,
  contentOf,
  empty,
  expectRefused,
  foldsIn,
  idsIn,
  ifBlock,
  proc,
  runOk,
  seq,
  whileBlock,
} from './test-support';

const range = (first: string, last = first) => ({ kind: 'blocks', first, last }) as const;

describe('move up and down', () => {
  it('R-EDIT-11: a block trades places with the block below or above', () => {
    const content = contentOf([proc('b1'), proc('b2'), proc('b3')]);
    const down = runOk(move, content, { target: range('b1'), direction: 'down' });
    expect(idsIn(down.content, 'd1')).toEqual(['b2', 'b1', 'b3']);
    expect(down.touched).toEqual(['b1']);
    const up = runOk(move, content, { target: range('b2', 'b3'), direction: 'up' });
    expect(idsIn(up.content, 'd1')).toEqual(['b2', 'b3', 'b1']);
    expect(up.touched).toEqual(['b2', 'b3']);
  });

  it('R-EDIT-11: a block jumps over a control block and does not enter it', () => {
    const content = contentOf([proc('b1'), whileBlock('b2', [proc('b3')])]);
    const result = runOk(move, content, { target: range('b1'), direction: 'down' });
    expect(idsIn(result.content, 'd1')).toEqual(['b2', 'b1']);
    expect(idsIn(result.content, 'b2')).toEqual(['b3']);
  });

  it('R-EDIT-11: at the end of a sequence, blocks leave the control block holding them', () => {
    const content = contentOf([
      proc('b1'),
      ifBlock('b2', branch('r1', [proc('b3'), proc('b4')]), branch('r2', [proc('b5')])),
    ]);
    const down = runOk(move, content, { target: range('b4'), direction: 'down' });
    expect(idsIn(down.content, 'd1')).toEqual(['b1', 'b2', 'b4']);
    expect(idsIn(down.content, 'r1')).toEqual(['b3']);
    const up = runOk(move, content, { target: range('b5'), direction: 'up' });
    expect(idsIn(up.content, 'd1')).toEqual(['b1', 'b5', 'b2']);
    expect(idsIn(up.content, 'r2')).toEqual(['b6']);
    expect(blockOf(up.content, 'b6')).toEqual(empty('b6'));
  });

  it('R-EDIT-11: at the top or bottom of a diagram the move is refused', () => {
    const content = contentOf([proc('b1'), proc('b2')]);
    expectRefused(move, content, { target: range('b1'), direction: 'up' }, 'atTop');
    expectRefused(move, content, { target: range('b2'), direction: 'down' }, 'atBottom');
    expectRefused(move, content, { target: range('b9'), direction: 'up' }, 'notFound');
  });

  it('01-model 4.3: a block at the end of a fold region first steps out of it', () => {
    const content = contentOf(
      seq([proc('b1'), proc('b2'), proc('b3')], [{ id: 'f1', first: 'b1', last: 'b2' }]),
    );
    const out = runOk(move, content, { target: range('b2'), direction: 'down' });
    expect(idsIn(out.content, 'd1')).toEqual(['b1', 'b2', 'b3']);
    expect(foldsIn(out.content, 'd1')).toEqual(['f1:b1-b1']);
    const again = runOk(move, out.content, { target: range('b2'), direction: 'down' });
    expect(idsIn(again.content, 'd1')).toEqual(['b1', 'b3', 'b2']);
  });

  it('01-model 4.3: a block jumps over a whole fold region next to it', () => {
    const content = contentOf(
      seq(
        [proc('b1'), proc('b2'), proc('b3'), proc('b4')],
        [{ id: 'f1', first: 'b2', last: 'b3' }],
      ),
    );
    const down = runOk(move, content, { target: range('b1'), direction: 'down' });
    expect(idsIn(down.content, 'd1')).toEqual(['b2', 'b3', 'b1', 'b4']);
    expect(foldsIn(down.content, 'd1')).toEqual(['f1:b2-b3']);
    const up = runOk(move, content, { target: range('b4'), direction: 'up' });
    expect(idsIn(up.content, 'd1')).toEqual(['b1', 'b4', 'b2', 'b3']);
  });

  it('01-model 4.3: a whole fold region moves with its name; a region around it keeps its ends', () => {
    const content = contentOf(
      seq(
        [proc('b1'), proc('b2'), proc('b3')],
        [
          { id: 'f1', first: 'b1', last: 'b3' },
          { id: 'f2', first: 'b1', last: 'b1' },
        ],
      ),
    );
    const result = runOk(move, content, {
      target: { kind: 'fold', fold: 'f2' },
      direction: 'down',
    });
    expect(idsIn(result.content, 'd1')).toEqual(['b2', 'b1', 'b3']);
    expect(foldsIn(result.content, 'd1')).toEqual(['f1:b2-b3', 'f2:b1-b1']);
  });

  it('01-model 4.3: blocks leaving a control block stay in the regions that hold it', () => {
    const content = contentOf(
      seq(
        [proc('b1'), whileBlock('b2', [proc('b3'), proc('b4')])],
        [{ id: 'f1', first: 'b1', last: 'b2' }],
      ),
    );
    const result = runOk(move, content, { target: range('b4'), direction: 'down' });
    expect(idsIn(result.content, 'd1')).toEqual(['b1', 'b2', 'b4']);
    expect(foldsIn(result.content, 'd1')).toEqual(['f1:b1-b4']);
  });
});

describe('move left and right (branches)', () => {
  const twoArms = contentOf([
    caseBlock(
      'b1',
      [arm('r1', 'A', [proc('b2')]), arm('r2', 'B', [whileBlock('b3', [proc('b4')])])],
      branch('r3', [proc('b5')]),
    ),
  ]);

  it('R-EDIT-11: a Case branch trades places with its neighbour, label and all', () => {
    const result = runOk(moveBranch, twoArms, { branch: 'r1', direction: 'right' });
    const moved = blockOf(result.content, 'b1');
    expect(moved.kind === 'case' ? moved.arms.map((a) => a.label) : null).toEqual(['B', 'A']);
    expect(result.touched).toEqual(['r1']);
  });

  it('R-EDIT-11: moving a block sideways moves the nearest branch holding it', () => {
    const result = runOk(move, twoArms, { target: range('b4'), direction: 'left' });
    const moved = blockOf(result.content, 'b1');
    expect(moved.kind === 'case' ? moved.arms.map((a) => a.id) : null).toEqual(['r2', 'r1']);
    expectRefused(
      move,
      contentOf([proc('b1')]),
      { target: range('b1'), direction: 'left' },
      'notInBranch',
    );
  });

  it('R-EDIT-11: the default branch stays last; edges are refused', () => {
    expectRefused(moveBranch, twoArms, { branch: 'r3', direction: 'left' }, 'defaultBranchFixed');
    expectRefused(moveBranch, twoArms, { branch: 'r2', direction: 'right' }, 'defaultBranchFixed');
    expectRefused(moveBranch, twoArms, { branch: 'r1', direction: 'left' }, 'atLeftmost');
    expectRefused(moveBranch, twoArms, { branch: 'r9', direction: 'left' }, 'notFound');
  });

  it('R-EDIT-11: swapping If branches swaps the blocks, keeps labels in place, and notes the condition', () => {
    const content = contentOf([
      ifBlock('b1', branch('r1', [proc('b2')], 'yes'), branch('r2', [proc('b3')]), 'x > 0'),
    ]);
    const result = runOk(moveBranch, content, { branch: 'r1', direction: 'right' });
    expect(blockOf(result.content, 'b1')).toEqual({
      id: 'b1',
      kind: 'if',
      text: 'x > 0',
      yes: { id: 'r2', label: 'yes', body: seq([proc('b3')]) },
      no: { id: 'r1', body: seq([proc('b2')]) },
    });
    expect(result.note).toEqual({ kind: 'checkCondition', node: 'b1' });
    expectRefused(moveBranch, content, { branch: 'r1', direction: 'left' }, 'atLeftmost');
    expectRefused(moveBranch, content, { branch: 'r2', direction: 'right' }, 'atRightmost');
  });
});
