import { describe, expect, it } from 'vitest';

import {
  arm,
  branch,
  caseBlock,
  contentOf,
  empty,
  ifBlock,
  proc,
  seq,
  whileBlock,
} from '../commands/test-support';
import { assertInvariants, checkInvariants } from './invariants';
import type { Block, Content } from './types';

const numbers = (content: Content): ReadonlyArray<number> =>
  checkInvariants(content).map((v) => v.invariant);

describe('checkInvariants', () => {
  it('T-0190 · R-NFR-01: a valid document has no violations', () => {
    const content = contentOf(
      seq(
        [
          proc('b1'),
          ifBlock('b2', branch('r1', [proc('b3')]), branch('r2', [empty('b4')])),
          caseBlock('b5', [arm('r3', '1', [proc('b6')])], branch('r4', [empty('b7')])),
          whileBlock('b8', [proc('b9')]),
        ],
        [
          { id: 'f1', first: 'b1', last: 'b8' },
          { id: 'f2', first: 'b1', last: 'b2' },
          { id: 'f3', first: 'b5', last: 'b5' },
        ],
      ),
    );
    expect(checkInvariants(content)).toEqual([]);
    expect(() => {
      assertInvariants(content);
    }).not.toThrow();
  });

  it('T-0191: 01-model 3.1: a document needs a diagram', () => {
    const content: Content = { ...contentOf([proc('b1')]), diagrams: [] };
    expect(numbers(content)).toEqual([1]);
    expect(() => {
      assertInvariants(content);
    }).toThrow(/invariant 1/);
  });

  it('T-0192: 01-model 3.2: no sequence is empty', () => {
    expect(numbers(contentOf([]))).toEqual([2]);
    expect(numbers(contentOf([whileBlock('b1', [])]))).toEqual([2]);
  });

  it('T-0193: 01-model 3.3: ids are unique across kinds of node', () => {
    expect(numbers(contentOf([proc('b1'), proc('b1')]))).toEqual([3]);
    expect(numbers(contentOf([proc('d1')]))).toEqual([3]);
    const branchClash = contentOf([
      ifBlock('b1', branch('r1', [proc('b2')]), branch('r1', [proc('b3')])),
    ]);
    expect(numbers(branchClash)).toEqual([3]);
  });

  it('T-0194: 01-model 3.4: a Case needs a branch; Case without default or with only default is fine', () => {
    expect(numbers(contentOf([caseBlock('b1', [], null)]))).toEqual([4]);
    expect(numbers(contentOf([caseBlock('b1', [arm('r1', '1', [proc('b2')])], null)]))).toEqual([]);
    expect(numbers(contentOf([caseBlock('b1', [], branch('r1', [proc('b2')]))]))).toEqual([]);
  });

  it('T-0195: 01-model 3.4: an If without two branches (a broken file) is reported', () => {
    const broken = { id: 'b1', kind: 'if', text: '', yes: branch('r1', [proc('b2')]) };
    expect(numbers(contentOf([broken as unknown as Block]))).toEqual([4]);
  });

  it('T-0196: 01-model 3.5: fold ends must be blocks of the sequence, in order', () => {
    const outside = contentOf(
      seq([whileBlock('b1', [proc('b2')]), proc('b3')], [{ id: 'f1', first: 'b2', last: 'b3' }]),
    );
    expect(numbers(outside)).toEqual([5]);
    const reversed = contentOf(
      seq([proc('b1'), proc('b2')], [{ id: 'f1', first: 'b2', last: 'b1' }]),
    );
    expect(numbers(reversed)).toEqual([5]);
  });

  it('T-0197: 01-model 3.5: folds nest or stay apart, and no two have the same range', () => {
    const blocks = [proc('b1'), proc('b2'), proc('b3')];
    const crossing = contentOf(
      seq(blocks, [
        { id: 'f1', first: 'b1', last: 'b2' },
        { id: 'f2', first: 'b2', last: 'b3' },
      ]),
    );
    expect(numbers(crossing)).toEqual([5]);
    const same = contentOf(
      seq(blocks, [
        { id: 'f1', first: 'b1', last: 'b2' },
        { id: 'f2', first: 'b1', last: 'b2' },
      ]),
    );
    expect(numbers(same)).toEqual([5]);
    const apart = contentOf(
      seq(blocks, [
        { id: 'f1', first: 'b1', last: 'b1' },
        { id: 'f2', first: 'b2', last: 'b3' },
      ]),
    );
    expect(numbers(apart)).toEqual([]);
  });

  it('T-0198: 01-model 3.6: a local call names an existing Method', () => {
    const call = (diagram: string): Block => ({
      id: 'b2',
      kind: 'call',
      target: { kind: 'local', diagram },
      args: '',
      result: '',
      siteFolds: [],
    });
    const base = contentOf([proc('b1'), call('d2')]);
    expect(numbers(base)).toEqual([6]);
    const withEvent: Content = {
      ...base,
      diagrams: [
        ...base.diagrams,
        { id: 'd2', head: { kind: 'event', text: 'E' }, body: seq([proc('b3')]) },
      ],
    };
    expect(numbers(withEvent)).toEqual([6]);
    const withMethod: Content = {
      ...base,
      diagrams: [
        ...base.diagrams,
        { id: 'd2', head: { kind: 'method', text: 'm()' }, body: seq([proc('b3')]) },
      ],
    };
    expect(numbers(withMethod)).toEqual([]);
  });

  it('T-0199: 01-model 3.7: a blank diagram exists only when it is the only one', () => {
    expect(numbers(contentOf([empty('b1')]))).toEqual([]);
    const two: Content = {
      ...contentOf([proc('b1')]),
      diagrams: [
        { id: 'd1', head: null, body: seq([proc('b1')]) },
        { id: 'd2', head: null, body: seq([empty('b2')]) },
      ],
    };
    expect(numbers(two)).toEqual([7]);
  });
});
