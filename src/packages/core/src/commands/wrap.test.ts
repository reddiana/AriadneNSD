import { describe, expect, it } from 'vitest';

import { insertBlock } from './insert';
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
import { unwrap, wrap } from './wrap';

const range = (first: string, last = first) => ({ kind: 'blocks', first, last }) as const;

describe('wrap', () => {
  it('T-0173 · R-EDIT-06: wraps a contiguous range in a new While, in its place', () => {
    const content = contentOf([proc('b1'), proc('b2'), proc('b3')]);
    const result = runOk(wrap, content, { target: range('b1', 'b2'), kind: 'while' });
    expect(idsIn(result.content, 'd1')).toEqual(['b4', 'b3']);
    expect(idsIn(result.content, 'b4')).toEqual(['b1', 'b2']);
    expect(blockOf(result.content, 'b4')).toMatchObject({ kind: 'while', text: '' });
    expect(result.touched).toEqual(['b4']);
  });

  it('T-0174 · R-EDIT-06: an If takes the blocks in its true branch; the false branch is empty', () => {
    const result = runOk(wrap, contentOf([proc('b1')]), { target: range('b1'), kind: 'if' });
    expect(blockOf(result.content, 'b2')).toEqual({
      id: 'b2',
      kind: 'if',
      text: '',
      yes: { id: 'r1', body: seq([proc('b1')]) },
      no: { id: 'r2', body: seq([empty('b3')]) },
    });
  });

  it('T-0175 · R-EDIT-06: a Case takes the blocks in its first branch, with a second branch and a default', () => {
    const result = runOk(wrap, contentOf([proc('b1')]), { target: range('b1'), kind: 'case' });
    const made = blockOf(result.content, 'b2');
    expect(made).toMatchObject({
      kind: 'case',
      arms: [
        { id: 'r1', label: '1', body: seq([proc('b1')]) },
        { id: 'r2', label: '2' },
      ],
      otherwise: { id: 'r3' },
    });
  });

  it('T-0176 · R-EDIT-06: fold regions inside go in; a region of exactly the range stays around the wrapper', () => {
    const content = contentOf(
      seq(
        [proc('b1'), proc('b2'), proc('b3')],
        [
          { id: 'f1', first: 'b1', last: 'b2' },
          { id: 'f2', first: 'b2', last: 'b2' },
          { id: 'f3', first: 'b1', last: 'b3' },
        ],
      ),
    );
    const result = runOk(wrap, content, { target: range('b1', 'b2'), kind: 'for' });
    expect(foldsIn(result.content, 'd1')).toEqual(['f1:b4-b4', 'f3:b4-b3']);
    expect(foldsIn(result.content, 'b4')).toEqual(['f2:b2-b2']);
  });

  it('T-0177 · R-EDIT-06: refuses a process block and a missing target', () => {
    const content = contentOf([proc('b1')]);
    expectRefused(wrap, content, { target: range('b1'), kind: 'process' }, 'cannotWrapWithProcess');
    expectRefused(wrap, content, { target: range('b7'), kind: 'if' }, 'notFound');
  });
});

describe('unwrap', () => {
  it('T-0178 · R-EDIT-07: removes the selected control block and leaves its blocks in place', () => {
    const content = contentOf([proc('b1'), whileBlock('b2', [proc('b3'), proc('b4')]), proc('b5')]);
    const result = runOk(unwrap, content, { target: range('b2') });
    expect(idsIn(result.content, 'd1')).toEqual(['b1', 'b3', 'b4', 'b5']);
    expect(result.touched).toEqual(['b3', 'b4']);
  });

  it('T-0179 · R-EDIT-07: an If or Case leaves its non-empty branches one after another', () => {
    const content = contentOf([
      caseBlock(
        'b1',
        [arm('r1', '1', [proc('b2')]), arm('r2', '2', [empty('b3')])],
        branch('r3', [proc('b4'), empty('b5')]),
      ),
    ]);
    const result = runOk(unwrap, content, { target: range('b1') });
    expect(idsIn(result.content, 'd1')).toEqual(['b2', 'b4', 'b5']);
  });

  it('T-0180 · R-EDIT-07 (UX Q8): with a block inside selected, the nearest control block holding it is removed', () => {
    const content = contentOf([
      whileBlock('b1', [ifBlock('b2', branch('r1', [proc('b3')]), branch('r2', [empty('b4')]))]),
    ]);
    const result = runOk(unwrap, content, { target: range('b3') });
    expect(idsIn(result.content, 'b1')).toEqual(['b3']);
  });

  it('T-0181 · R-EDIT-07: wrap then unwrap gives back the same blocks', () => {
    const content = contentOf([proc('b1'), proc('b2')]);
    const wrapped = runOk(wrap, content, { target: range('b1', 'b2'), kind: 'doWhile' });
    const back = runOk(unwrap, wrapped.content, { target: range('b3') });
    expect(back.content).toEqual(content);
  });

  it('T-0182 · R-EDIT-07: fold regions inside come out; a region around the block now spans its blocks', () => {
    const content = contentOf(
      seq(
        [
          proc('b1'),
          whileBlock('b2', seq([proc('b3'), proc('b4')], [{ id: 'f2', first: 'b4', last: 'b4' }])),
        ],
        [{ id: 'f1', first: 'b2', last: 'b2' }],
      ),
    );
    const result = runOk(unwrap, content, { target: range('b2') });
    expect(foldsIn(result.content, 'd1')).toEqual(['f1:b3-b4', 'f2:b4-b4']);
  });

  it('T-0183 · R-EDIT-07: a control block with only empty inside leaves an empty block if nothing else is left', () => {
    const inserted = runOk(insertBlock, contentOf([empty('b1')]), {
      target: range('b1'),
      side: 'after',
      kind: 'if',
    });
    const result = runOk(unwrap, inserted.content, { target: range('b2') });
    expect(idsIn(result.content, 'd1')).toEqual(['b5']);
    expect(result.touched).toEqual(['b5']);
  });

  it('T-0184 · R-EDIT-07 · R-EDIT-08: refuses when there is no control block, and for a call block that calls nothing here', () => {
    expectRefused(unwrap, contentOf([proc('b1')]), { target: range('b1') }, 'noControlBlock');
    const call = contentOf([
      {
        id: 'b1',
        kind: 'call',
        target: { kind: 'named', name: 'f' },
        args: '',
        result: '',
        siteFolds: [],
      },
    ]);
    expectRefused(unwrap, call, { target: range('b1') }, 'notCallable');
  });
});
