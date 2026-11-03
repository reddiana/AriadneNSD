import { describe, expect, it } from 'vitest';

import type { Block, Content, FoldMark } from '../model/types';
import { extractMethod } from './extract';
import {
  blockOf,
  branch,
  call,
  contentOf,
  contentWith,
  diagram,
  diagramIds,
  diagramOf,
  event,
  expectRefused,
  foldsIn,
  idsIn,
  ifBlock,
  method,
  proc,
  runOk,
  seq,
  whileBlock,
} from './test-support';

const blocks = (first: string, last = first) => ({ kind: 'blocks', first, last }) as const;

/** Main (d1, an Event), sort (d2) and show (d3) are Methods. */
const program = (source: ReadonlyArray<Block>, folds: ReadonlyArray<FoldMark> = []): Content =>
  contentWith(
    diagram('d1', event('Main'), [proc('b90')]),
    diagram('d2', method('sort(a)'), seq(source, folds)),
    diagram('d3', method('show'), [proc('b91')]),
  );

describe('extractMethod', () => {
  it('T-0841 · R-EDIT-19: the blocks become a new Method and a call block calling it is left', () => {
    const content = program([proc('b1'), proc('b2'), proc('b3'), proc('b4')]);
    const result = runOk(extractMethod, content, { target: blocks('b2', 'b3') });
    const [made, left] = result.touched;
    expect(made).toBe('d4');
    expect(left).toBe('b92');
    expect(idsIn(result.content, 'd2')).toEqual(['b1', 'b92', 'b4']);
    expect(blockOf(result.content, 'b92')).toEqual(call('b92', 'd4'));
    expect(diagramOf(result.content, 'd4').head).toEqual(method('Method 1'));
    expect(idsIn(result.content, 'd4')).toEqual(['b2', 'b3']);
    expect(result.removedFolds).toBe(0);
  });

  it('T-0842 · R-EDIT-19: the new Method goes right after the Method it came from (UX XM1)', () => {
    const content = program([proc('b1'), proc('b2')]);
    const result = runOk(extractMethod, content, { target: blocks('b1') });
    expect(diagramIds(result.content)).toEqual(['d1', 'd2', 'd4', 'd3']);
  });

  it('T-0843 · R-EDIT-19: from an Event the new Method goes after the last Method (UX XM1)', () => {
    const content = program([proc('b1')]);
    const result = runOk(extractMethod, content, { target: blocks('b90') });
    expect(diagramIds(result.content)).toEqual(['d1', 'd2', 'd3', 'd4']);
    expect(blockOf(result.content, 'b92')).toEqual(call('b92', 'd4'));
  });

  it('T-0844 · R-EDIT-19: from a diagram without a header it works too, with no Method yet', () => {
    const content = contentOf([proc('b1'), proc('b2'), proc('b3')]);
    const result = runOk(extractMethod, content, { target: blocks('b1', 'b2') });
    expect(diagramIds(result.content)).toEqual(['d1', 'd2']);
    expect(idsIn(result.content, 'd1')).toEqual(['b4', 'b3']);
    expect(idsIn(result.content, 'd2')).toEqual(['b1', 'b2']);
    expect(diagramOf(result.content, 'd1').head).toBeNull();
  });

  it('T-0845 · R-EDIT-19: taking the whole sequence leaves the call block alone in it', () => {
    const content = contentOf([proc('b1'), proc('b2')]);
    const result = runOk(extractMethod, content, { target: blocks('b1', 'b2') });
    expect(idsIn(result.content, 'd1')).toEqual(['b3']);
    expect(idsIn(result.content, 'd2')).toEqual(['b1', 'b2']);
  });

  it('T-0846 · R-EDIT-19: blocks inside a branch go with everything inside them', () => {
    const inner = ifBlock(
      'b2',
      branch('r1', [whileBlock('b3', [proc('b4')])]),
      branch('r2', [proc('b5')]),
    );
    const content = contentOf([
      ifBlock('b1', branch('r3', [inner, proc('b6')]), branch('r4', [proc('b7')])),
    ]);
    const result = runOk(extractMethod, content, { target: blocks('b2') });
    expect(idsIn(result.content, 'r3')).toEqual(['b8', 'b6']);
    expect(idsIn(result.content, 'd2')).toEqual(['b2']);
    expect(idsIn(result.content, 'b3')).toEqual(['b4']);
  });

  it('T-0847 · R-EDIT-19: the default name is "Method n" with the smallest unused n', () => {
    const content = contentWith(
      diagram('d1', method('Method 1'), [proc('b1')]),
      diagram('d2', method('Method 3'), [proc('b2')]),
    );
    const result = runOk(extractMethod, content, { target: blocks('b1') });
    expect(diagramOf(result.content, 'd3').head).toEqual(method('Method 2'));
  });

  it('T-0848 · R-EDIT-19: a call block inside keeps calling the Method it came from (recursion)', () => {
    const content = program([proc('b1'), call('b2', 'd2', 'a'), proc('b3')]);
    const result = runOk(extractMethod, content, { target: blocks('b2', 'b3') });
    expect(blockOf(result.content, 'b2')).toEqual(call('b2', 'd2', 'a'));
    expect(idsIn(result.content, 'd4')).toEqual(['b2', 'b3']);
  });

  it('T-0849 · R-EDIT-19: fold regions inside the range go along; one holding it holds the call', () => {
    const folds = [
      { id: 'f1', first: 'b2', last: 'b3', name: 'inner' },
      { id: 'f2', first: 'b1', last: 'b5', name: 'outer' },
    ];
    const content = program([proc('b1'), proc('b2'), proc('b3'), proc('b4'), proc('b5')], folds);
    const result = runOk(extractMethod, content, { target: blocks('b2', 'b4') });
    expect(foldsIn(result.content, 'd4')).toEqual(['f1:b2-b3']);
    expect(foldsIn(result.content, 'd2')).toEqual(['f2:b1-b5']);
    expect(idsIn(result.content, 'd2')).toEqual(['b1', 'b92', 'b5']);
    expect(result.removedFolds).toBe(0);
  });

  it('T-0850 · R-EDIT-19: a fold region crossing an end of the range is removed and counted', () => {
    const folds = [
      { id: 'f1', first: 'b1', last: 'b2' },
      { id: 'f2', first: 'b3', last: 'b4' },
      { id: 'f3', first: 'b4', last: 'b4' },
    ];
    const content = program([proc('b1'), proc('b2'), proc('b3'), proc('b4')], folds);
    const result = runOk(extractMethod, content, { target: blocks('b2', 'b3') });
    expect(result.removedFolds).toBe(2);
    expect(foldsIn(result.content, 'd2')).toEqual(['f3:b4-b4']);
    expect(foldsIn(result.content, 'd4')).toEqual([]);
  });

  it('T-0851 · R-EDIT-19: extracting one fold region names the Method after it, and it goes', () => {
    const folds = [{ id: 'f1', first: 'b2', last: 'b3', name: 'merge(a, lo, hi)' }];
    const content = program([proc('b1'), proc('b2'), proc('b3')], folds);
    const result = runOk(extractMethod, content, { target: { kind: 'fold', fold: 'f1' } });
    expect(diagramOf(result.content, 'd4').head).toEqual(method('merge(a, lo, hi)'));
    expect(foldsIn(result.content, 'd2')).toEqual([]);
    expect(foldsIn(result.content, 'd4')).toEqual([]);
    // A name with parentheses fills the arguments, like a call block inserted for it.
    expect(blockOf(result.content, 'b92')).toEqual(call('b92', 'd4', 'a, lo, hi'));
  });

  it('T-0852 · R-EDIT-19: a fold region name that cannot be a new name gives the default name', () => {
    const named = (name: string): FoldMark => ({ id: 'f1', first: 'b1', last: 'b1', name });
    for (const name of ['show', '(x)', ' ']) {
      const content = program([proc('b1'), proc('b2')], [named(name)]);
      const result = runOk(extractMethod, content, { target: { kind: 'fold', fold: 'f1' } });
      expect(diagramOf(result.content, 'd4').head).toEqual(method('Method 1'));
    }
  });

  it('T-0853 · R-EDIT-19: refuses nothing selected and blocks that are not of one sequence', () => {
    const content = contentOf([
      ifBlock('b1', branch('r1', [proc('b2')]), branch('r2', [proc('b3')])),
    ]);
    expectRefused(
      extractMethod,
      content,
      { target: { kind: 'diagramEnd', diagram: 'd1' } },
      'wrongKind',
    );
    expectRefused(extractMethod, content, { target: blocks('b2', 'b3') }, 'notContiguous');
    expectRefused(extractMethod, content, { target: blocks('b9') }, 'notFound');
  });
});
