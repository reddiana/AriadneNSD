import { describe, expect, it } from 'vitest';

import { moveTo } from './move-to';
import {
  blockOf,
  branch,
  contentOf,
  empty,
  expectRefused,
  idsIn,
  ifBlock,
  proc,
  runOk,
  whileBlock,
} from './test-support';

describe('moveTo (drag and drop)', () => {
  const content = contentOf([
    proc('b1'),
    proc('b2'),
    whileBlock('b3', [proc('b4'), proc('b5')]),
    ifBlock('b6', branch('r1', [empty('b7')]), branch('r2', [proc('b8')])),
  ]);
  const range = (first: string, last = first) => ({ kind: 'blocks' as const, first, last });

  it('T-0151 · R-EDIT-09: moves blocks into a neighbouring loop, keeping their ids', () => {
    const result = runOk(moveTo, content, { target: range('b1', 'b2'), to: 'b4', side: 'after' });
    expect(idsIn(result.content, 'd1')).toEqual(['b3', 'b6']);
    expect(idsIn(result.content, 'b3')).toEqual(['b4', 'b1', 'b2', 'b5']);
    expect(result.touched).toEqual(['b1', 'b2']);
  });

  it('T-0152 · R-EDIT-09: a block dropped on an empty block takes its place', () => {
    const result = runOk(moveTo, content, { target: range('b1'), to: 'b7', side: 'after' });
    expect(idsIn(result.content, 'r1')).toEqual(['b1']);
  });

  it('T-0153 · R-EDIT-09: a sequence left with no blocks gets an empty block', () => {
    const result = runOk(moveTo, content, { target: range('b8'), to: 'b1', side: 'before' });
    expect(idsIn(result.content, 'd1')[0]).toBe('b8');
    const [left] = idsIn(result.content, 'r2');
    expect(left === undefined ? null : blockOf(result.content, left)).toEqual(empty('b9'));
  });

  it('T-0154 · R-EDIT-09: dropping blocks where they are changes nothing', () => {
    for (const [to, side] of [
      ['b1', 'after'],
      ['b3', 'before'],
      ['b2', 'before'],
    ] as const) {
      const result = runOk(moveTo, content, { target: range('b1', 'b2'), to, side });
      expect(result.content).toBe(content);
    }
  });

  it('T-0155 · R-EDIT-09: refuses to drop blocks inside themselves', () => {
    expectRefused(moveTo, content, { target: range('b3'), to: 'b4', side: 'after' }, 'intoItself');
    expectRefused(moveTo, content, { target: range('b1'), to: 'b99', side: 'after' }, 'notFound');
  });
});
