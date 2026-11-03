// Fold region commands (01-model 4.1 "접기 영역", R-EDIT-14, R-EDIT-16, R-EDIT-23).
import { describe, expect, it } from 'vitest';

import type { Call, Content } from '../model/types';
import { editText } from './edit-text';
import { makeFold, makeSiteFold, removeFold, renameFold, siteFoldOf } from './fold';
import {
  blockOf,
  call,
  contentOf,
  contentWith,
  diagram,
  expectRefused,
  foldsIn,
  method,
  proc,
  runOk,
  seq,
  whileBlock,
} from './test-support';

const blocks = (target: { first: string; last: string }) =>
  ({ kind: 'blocks', ...target }) as const;

describe('makeFold (R-EDIT-14)', () => {
  const content = contentOf([proc('b1'), proc('b2'), proc('b3'), proc('b4')]);

  it('T-1069: fold: makes the selected blocks a fold region, without a name', () => {
    const result = runOk(makeFold, content, { target: blocks({ first: 'b2', last: 'b3' }) });
    expect(foldsIn(result.content, 'd1')).toEqual(['f1:b2-b3']);
    expect(result.touched).toEqual(['f1']);
    expect(result.content.diagrams[0]?.body.folds[0]?.name).toBeUndefined();
  });

  it('T-1070: fold: one block is enough, and a name can be given', () => {
    const result = runOk(makeFold, content, {
      target: blocks({ first: 'b4', last: 'b4' }),
      name: 'end',
    });
    expect(result.content.diagrams[0]?.body.folds).toEqual([
      { id: 'f1', first: 'b4', last: 'b4', name: 'end' },
    ]);
  });

  it('T-1071: fold: regions nest, but the same range again or one crossing an end is refused', () => {
    const made = runOk(makeFold, content, { target: blocks({ first: 'b1', last: 'b3' }) });
    const inner = runOk(makeFold, made.content, { target: blocks({ first: 'b2', last: 'b3' }) });
    expect(foldsIn(inner.content, 'd1')).toEqual(['f1:b1-b3', 'f2:b2-b3']);
    const outer = runOk(makeFold, made.content, { target: blocks({ first: 'b1', last: 'b4' }) });
    expect(foldsIn(outer.content, 'd1')).toEqual(['f1:b1-b3', 'f2:b1-b4']);
    expectRefused(
      makeFold,
      made.content,
      { target: blocks({ first: 'b3', last: 'b1' }) },
      'foldExists',
    );
    expectRefused(
      makeFold,
      made.content,
      { target: blocks({ first: 'b3', last: 'b4' }) },
      'foldsCross',
    );
  });

  it('T-1072: fold: only a range of blocks becomes a region', () => {
    expectRefused(
      makeFold,
      content,
      { target: { kind: 'diagramEnd', diagram: 'd1' } },
      'wrongKind',
    );
    expectRefused(makeFold, content, { target: blocks({ first: 'b1', last: 'x' }) }, 'notFound');
  });
});

describe('removeFold and renameFold (R-EDIT-23)', () => {
  const content: Content = contentOf(
    seq(
      [proc('b1'), proc('b2'), proc('b3')],
      [{ id: 'f1', first: 'b1', last: 'b2', name: 'prep' }],
    ),
  );

  it('T-1073: fold: removing a region keeps its blocks and touches its ends', () => {
    const result = runOk(removeFold, content, { fold: 'f1' });
    expect(foldsIn(result.content, 'd1')).toEqual([]);
    expect(result.content.diagrams[0]?.body.blocks).toHaveLength(3);
    expect(result.touched).toEqual(['b1', 'b2']);
    expectRefused(removeFold, content, { fold: 'f9' }, 'notFound');
  });

  it('T-1074: fold: a name is set, an empty name removes it, the same name changes nothing', () => {
    const renamed = runOk(renameFold, content, { fold: 'f1', name: 'setup' });
    expect(renamed.content.diagrams[0]?.body.folds[0]?.name).toBe('setup');
    const cleared = runOk(renameFold, content, { fold: 'f1', name: '' });
    expect(cleared.content.diagrams[0]?.body.folds[0]).toEqual({
      id: 'f1',
      first: 'b1',
      last: 'b2',
    });
    expect(runOk(renameFold, content, { fold: 'f1', name: 'prep' }).content).toBe(content);
    expectRefused(renameFold, content, { fold: 'nope', name: 'x' }, 'notFound');
  });

  it('T-1075: fold: the text edit command names a fold region too', () => {
    const result = runOk(editText, content, { node: 'f1', text: 'init' });
    expect(result.content.diagrams[0]?.body.folds[0]?.name).toBe('init');
  });
});

describe('fold regions at an opened call site (R-EDIT-16)', () => {
  const content = contentWith(
    diagram('d1', null, [call('b1', 'd2'), whileBlock('b2', [proc('b3')])]),
    diagram('d2', method('sort(a)'), [proc('b10'), proc('b11'), proc('b12')]),
  );
  const siteFolds = (result: Content): Call['siteFolds'] => {
    const block = blockOf(result, 'b1');
    return block.kind === 'call' ? block.siteFolds : [];
  };

  it('T-1076: fold: a site region belongs to the call block; the Method is not changed', () => {
    const result = runOk(makeSiteFold, content, { call: 'b1', via: [], first: 'b12', last: 'b11' });
    expect(siteFolds(result.content)).toEqual([{ id: 'f1', via: [], first: 'b11', last: 'b12' }]);
    expect(result.content.diagrams[1]).toBe(content.diagrams[1]);
    expect(siteFoldOf(result.content, 'f1')?.call.id).toBe('b1');
  });

  it('T-1077: fold: the same site region again, blocks of two sequences or a non-call are refused', () => {
    const made = runOk(makeSiteFold, content, { call: 'b1', via: [], first: 'b11', last: 'b12' });
    expectRefused(
      makeSiteFold,
      made.content,
      { call: 'b1', via: [], first: 'b11', last: 'b12' },
      'foldExists',
    );
    expectRefused(
      makeSiteFold,
      content,
      { call: 'b1', via: [], first: 'b10', last: 'b3' },
      'notContiguous',
    );
    expectRefused(
      makeSiteFold,
      content,
      { call: 'b2', via: [], first: 'b10', last: 'b10' },
      'wrongKind',
    );
    expectRefused(
      makeSiteFold,
      content,
      { call: 'x', via: [], first: 'b10', last: 'b10' },
      'notFound',
    );
    expectRefused(
      makeSiteFold,
      content,
      { call: 'b1', via: [], first: 'x', last: 'b10' },
      'notFound',
    );
  });

  it('T-1078: fold: a site region is named and removed like any region', () => {
    const made = runOk(makeSiteFold, content, {
      call: 'b1',
      via: [],
      first: 'b10',
      last: 'b10',
      name: 'n',
    });
    const renamed = runOk(renameFold, made.content, { fold: 'f1', name: 'len' });
    expect(siteFolds(renamed.content)[0]?.name).toBe('len');
    expect(runOk(renameFold, renamed.content, { fold: 'f1', name: 'len' }).content).toBe(
      renamed.content,
    );
    const removed = runOk(removeFold, renamed.content, { fold: 'f1' });
    expect(siteFolds(removed.content)).toEqual([]);
    expect(removed.touched).toEqual(['b10', 'b10']);
  });
});
