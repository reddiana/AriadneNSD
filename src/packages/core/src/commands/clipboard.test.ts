import { describe, expect, it } from 'vitest';

import { copy, cut, paste } from './clipboard';
import {
  blockOf,
  branch,
  contentOf,
  empty,
  expectRefused,
  foldsIn,
  idsIn,
  ifBlock,
  proc,
  run,
  runOk,
  seq,
  whileBlock,
} from './test-support';

const range = (first: string, last = first) => ({ kind: 'blocks', first, last }) as const;

describe('copy, cut and paste', () => {
  const content = contentOf(
    seq(
      [proc('b1'), whileBlock('b2', [proc('b3')]), proc('b4')],
      [
        { id: 'f1', first: 'b1', last: 'b2' },
        { id: 'f2', first: 'b1', last: 'b4' },
      ],
    ),
  );

  it('R-EDIT-10: copy takes whole subtrees and the fold regions inside the range', () => {
    const copied = copy(content, { target: range('b1', 'b2') });
    expect(copied.ok ? copied.clip.blocks.map((b) => b.id) : null).toEqual(['b1', 'b2']);
    expect(copied.ok ? copied.clip.folds.map((f) => f.id) : null).toEqual(['f1']);
    expect(copy(content, { target: range('b9') })).toEqual({
      ok: false,
      reason: { code: 'notFound' },
    });
  });

  it('R-EDIT-10: paste puts copies with new ids after the selected block', () => {
    const copied = copy(content, { target: range('b2') });
    if (!copied.ok) {
      throw new Error('copy failed');
    }
    const result = runOk(paste, content, { target: range('b4'), side: 'after', clip: copied.clip });
    expect(idsIn(result.content, 'd1')).toEqual(['b1', 'b2', 'b4', 'b5']);
    expect(idsIn(result.content, 'b5')).toEqual(['b6']);
    expect(blockOf(result.content, 'b6')).toEqual(proc('b6', 'b3'));
    expect(result.touched).toEqual(['b5']);
  });

  it('01-model 1.7: pasted fold regions are mapped to the new ids', () => {
    const copied = copy(content, { target: range('b1', 'b2') });
    if (!copied.ok) {
      throw new Error('copy failed');
    }
    const result = runOk(paste, content, {
      target: range('b1'),
      side: 'before',
      clip: copied.clip,
    });
    expect(idsIn(result.content, 'd1')).toEqual(['b5', 'b6', 'b1', 'b2', 'b4']);
    expect(foldsIn(result.content, 'd1')).toContain('f3:b5-b6');
  });

  it('R-EDIT-10: paste on an empty block takes its place', () => {
    const target = contentOf([
      ifBlock('b1', branch('r1', [empty('b2')]), branch('r2', [proc('b3')])),
    ]);
    const result = runOk(paste, target, {
      target: range('b2'),
      side: 'after',
      clip: seq([proc('x1', 'a'), proc('x2', 'b')]),
    });
    expect(idsIn(result.content, 'r1')).toEqual(['b4', 'b5']);
  });

  it('01-model 3.6: a pasted call to a Method not in this document loses its target', () => {
    const clip = seq([
      {
        id: 'b1',
        kind: 'call',
        target: { kind: 'local', diagram: 'd7' },
        args: 'a',
        result: '',
        siteFolds: [],
      },
    ]);
    const result = runOk(paste, contentOf([proc('b1')]), {
      target: range('b1'),
      side: 'after',
      clip,
    });
    expect(blockOf(result.content, 'b2')).toMatchObject({
      target: { kind: 'lost', lastName: '' },
      args: 'a',
    });
  });

  it('R-EDIT-10: paste refuses an empty clip and a missing target', () => {
    expectRefused(
      paste,
      content,
      { target: range('b1'), side: 'after', clip: seq([]) },
      'emptyClip',
    );
    expectRefused(
      paste,
      content,
      { target: range('b9'), side: 'after', clip: seq([proc('x')]) },
      'notFound',
    );
  });

  it('R-EDIT-10: cut gives the clip and deletes the blocks', () => {
    run(cut, content, { target: range('b2', 'b4') });
    const result = cut(content, { target: range('b2', 'b4') });
    if (!result.ok) {
      throw new Error('cut failed');
    }
    expect(idsIn(result.content, 'd1')).toEqual(['b1']);
    expect(result.clip.blocks.map((b) => b.id)).toEqual(['b2', 'b4']);
    // Both regions shrink to b1; the second one, now the same range, goes (invariant 5).
    expect(foldsIn(result.content, 'd1')).toEqual(['f1:b1-b1']);
  });
});
