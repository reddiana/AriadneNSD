import { describe, expect, it } from 'vitest';

import type { Block, Call, Seq } from '../model/types';
import { editCall, insertCall, newMethodAndCall, setCallTarget } from './call';
import {
  blockOf,
  call,
  contentOf,
  contentWith,
  diagram,
  diagramIds,
  diagramOf,
  empty,
  event,
  expectRefused,
  foldsIn,
  idsIn,
  method,
  proc,
  runOk,
  seq,
} from './test-support';

const blocks = { kind: 'blocks' } as const;

/** Main (d1) calls nothing yet; sort (d2) receives `a, lo, hi`; reset (d3) receives nothing. */
const program = (...body: ReadonlyArray<Block>) => programOf(seq(body));

const programOf = (body: Seq) =>
  contentWith(
    diagram('d1', event('Main'), body),
    diagram('d2', method('sort(a, lo, hi)'), [proc('b90')]),
    diagram('d3', method('reset'), [proc('b91')]),
  );

describe('editCall', () => {
  it('T-0065 · R-BLK-07: sets the arguments and the result, each on one line', () => {
    const content = program(call('b1', 'd2', 'a, lo, hi'));
    const result = runOk(editCall, content, { block: 'b1', args: 'v,\n0,\r\nn', result: 'p\n' });
    expect(blockOf(result.content, 'b1')).toEqual(call('b1', 'd2', 'v, 0, n', 'p '));
    expect(result.touched).toEqual(['b1']);
  });

  it('T-0066 · R-BLK-07: a field left out stays', () => {
    const content = program(call('b1', 'd2', 'v', 'p'));
    const result = runOk(editCall, content, { block: 'b1', result: 'q' });
    expect(blockOf(result.content, 'b1')).toEqual(call('b1', 'd2', 'v', 'q'));
  });

  it('T-0067 · R-BLK-07: emptied arguments of a Method that receives something are refilled', () => {
    const content = program(call('b1', 'd2', 'v'));
    const result = runOk(editCall, content, { block: 'b1', args: ' ' });
    expect(blockOf(result.content, 'b1')).toEqual(call('b1', 'd2', 'a, lo, hi'));
  });

  it('T-0068 · R-BLK-07: a Method that receives nothing may be called with empty arguments', () => {
    const content = program(call('b1', 'd3', '', 'r'));
    const result = runOk(editCall, content, { block: 'b1', result: '' });
    expect(blockOf(result.content, 'b1')).toEqual(call('b1', 'd3'));
  });

  it('T-0069 · R-BLK-08: a call by a written name is edited as it is', () => {
    const content = program(call('b1', { kind: 'named', name: 'printf' }));
    const result = runOk(editCall, content, { block: 'b1', args: '' });
    expect(result.content).toBe(content);
  });

  it('T-0070: 01-model 4: the same text leaves the content as it is', () => {
    const content = program(call('b1', 'd2', 'v', 'p'));
    expect(runOk(editCall, content, { block: 'b1', args: 'v', result: 'p' }).content).toBe(content);
  });

  it('T-0071 · R-BLK-07: a call block that lost its target cannot be edited', () => {
    const content = program(call('b1', { kind: 'lost', lastName: 'old' }, 'v'));
    expectRefused(editCall, content, { block: 'b1', args: 'w' }, 'lostTarget');
  });

  it('T-0072: refuses a block that is not a call block, and an unknown block', () => {
    const content = program(proc('b1'));
    expectRefused(editCall, content, { block: 'b1', args: 'w' }, 'wrongKind');
    expectRefused(editCall, content, { block: 'b9', args: 'w' }, 'notFound');
  });
});

describe('setCallTarget', () => {
  it('T-0073: 01-model 1.5: a lost call block calls a Method again and keeps what was written', () => {
    const content = program(call('b1', { kind: 'lost', lastName: 'old' }, 'v', 'p'));
    const result = runOk(setCallTarget, content, { block: 'b1', diagram: 'd2' });
    expect(blockOf(result.content, 'b1')).toEqual(call('b1', 'd2', 'v', 'p'));
    expect(result.touched).toEqual(['b1']);
  });

  it('T-0074: 01-model 1.5: changes the Method, keeping the arguments and the result', () => {
    const content = program(call('b1', 'd2', 'v', 'p'));
    const result = runOk(setCallTarget, content, { block: 'b1', diagram: 'd3' });
    expect(blockOf(result.content, 'b1')).toEqual(call('b1', 'd3', 'v', 'p'));
  });

  it('T-0075 · R-BLK-07: empty arguments take the parameters of the new Method', () => {
    const content = program(call('b1', { kind: 'named', name: 'sort' }));
    const result = runOk(setCallTarget, content, { block: 'b1', diagram: 'd2' });
    expect(blockOf(result.content, 'b1')).toEqual(call('b1', 'd2', 'a, lo, hi'));
  });

  it('T-0076: 01-model 1.6: fold regions of the old call site go', () => {
    const old: Call = {
      ...call('b1', 'd2', 'v'),
      siteFolds: [{ id: 'f1', via: [], first: 'b90', last: 'b90' }],
    };
    const result = runOk(setCallTarget, program(old), { block: 'b1', diagram: 'd3' });
    expect(blockOf(result.content, 'b1')).toEqual(call('b1', 'd3', 'v'));
  });

  it('T-0077: 01-model 4: calling the same Method again leaves the content as it is', () => {
    const content = program(call('b1', 'd2', 'v'));
    expect(runOk(setCallTarget, content, { block: 'b1', diagram: 'd2' }).content).toBe(content);
  });

  it('T-0078 · R-BLK-07: an Event or a diagram without a header cannot be called', () => {
    const content = contentWith(
      diagram('d1', event('Main'), [call('b1', { kind: 'named', name: 'f' })]),
      diagram('d2', null, [proc('b2')]),
    );
    expectRefused(setCallTarget, content, { block: 'b1', diagram: 'd1' }, 'wrongKind');
    expectRefused(setCallTarget, content, { block: 'b1', diagram: 'd2' }, 'wrongKind');
    expectRefused(setCallTarget, content, { block: 'b1', diagram: 'd9' }, 'notFound');
    expectRefused(setCallTarget, content, { block: 'b2', diagram: 'd1' }, 'wrongKind');
  });
});

describe('insertCall', () => {
  it('T-0079 · R-BLK-07: inserts a call block with the parameters as its arguments', () => {
    const content = program(proc('b1'), proc('b2'));
    const result = runOk(insertCall, content, {
      target: { ...blocks, first: 'b1', last: 'b1' },
      side: 'after',
      diagram: 'd2',
    });
    expect(idsIn(result.content, 'd1')).toEqual(['b1', 'b92', 'b2']);
    expect(blockOf(result.content, 'b92')).toEqual(call('b92', 'd2', 'a, lo, hi'));
    expect(result.touched).toEqual(['b92']);
  });

  it('T-0080 · R-BLK-07: a Method that receives nothing gets empty arguments', () => {
    const content = program(proc('b1'));
    const result = runOk(insertCall, content, {
      target: { ...blocks, first: 'b1', last: 'b1' },
      side: 'before',
      diagram: 'd3',
    });
    expect(idsIn(result.content, 'd1')).toEqual(['b92', 'b1']);
    expect(blockOf(result.content, 'b92')).toEqual(call('b92', 'd3'));
  });

  it('T-0081: interaction rules 2: takes the place of an empty block', () => {
    const content = program(empty('b1'));
    const result = runOk(insertCall, content, {
      target: { ...blocks, first: 'b1', last: 'b1' },
      side: 'after',
      diagram: 'd3',
    });
    expect(idsIn(result.content, 'd1')).toEqual(['b92']);
  });

  it('T-0082 · UX MD1: joins a fold region at its end, and goes to the diagram end with no selection', () => {
    const folded = programOf(
      seq([proc('b1'), proc('b2')], [{ id: 'f1', first: 'b1', last: 'b2' }]),
    );
    const joined = runOk(insertCall, folded, {
      target: { ...blocks, first: 'b2', last: 'b2' },
      side: 'after',
      diagram: 'd3',
    });
    expect(foldsIn(joined.content, 'd1')).toEqual(['f1:b1-b92']);
    const atEnd = runOk(insertCall, folded, {
      target: { kind: 'diagramEnd', diagram: 'd1' },
      side: 'before',
      diagram: 'd3',
    });
    expect(idsIn(atEnd.content, 'd1')).toEqual(['b1', 'b2', 'b92']);
    expect(foldsIn(atEnd.content, 'd1')).toEqual(['f1:b1-b2']);
  });

  it('T-0083 · R-BLK-07: a Method may call itself', () => {
    const content = program(proc('b1'));
    const result = runOk(insertCall, content, {
      target: { ...blocks, first: 'b90', last: 'b90' },
      side: 'after',
      diagram: 'd2',
    });
    expect(idsIn(result.content, 'd2')).toEqual(['b90', 'b92']);
  });

  it('T-0084 · R-BLK-07: only a Method can be called', () => {
    const content = program(proc('b1'));
    const at = { target: { ...blocks, first: 'b1', last: 'b1' }, side: 'after' } as const;
    expectRefused(insertCall, content, { ...at, diagram: 'd1' }, 'wrongKind');
    expectRefused(insertCall, content, { ...at, diagram: 'd9' }, 'notFound');
    expectRefused(
      insertCall,
      content,
      { target: { ...blocks, first: 'b9', last: 'b9' }, side: 'after', diagram: 'd2' },
      'notFound',
    );
  });
});

describe('newMethodAndCall', () => {
  it('T-0085 · R-BLK-07: makes a new Method and calls it from the selection, in one step', () => {
    const content = program(proc('b1'));
    const result = runOk(newMethodAndCall, content, {
      target: { ...blocks, first: 'b1', last: 'b1' },
      side: 'after',
    });
    expect(diagramIds(result.content)).toEqual(['d1', 'd2', 'd3', 'd4']);
    expect(diagramOf(result.content, 'd4')).toEqual(
      diagram('d4', method('Method 1'), [empty('b92')]),
    );
    expect(idsIn(result.content, 'd1')).toEqual(['b1', 'b93']);
    expect(blockOf(result.content, 'b93')).toEqual(call('b93', 'd4'));
    expect(result.touched).toEqual(['d4', 'b93']);
  });

  it('T-0086 · R-BLK-07: the written name becomes the header, its parameters the arguments', () => {
    const content = program(empty('b1'));
    const result = runOk(newMethodAndCall, content, {
      target: { ...blocks, first: 'b1', last: 'b1' },
      side: 'after',
      text: 'scan(port)',
    });
    expect(diagramOf(result.content, 'd4').head).toEqual(method('scan(port)'));
    expect(idsIn(result.content, 'd1')).toEqual(['b93']);
    expect(blockOf(result.content, 'b93')).toEqual(call('b93', 'd4', 'port'));
  });

  it('T-0087: invariant 7: in a new document the call fills the blank diagram, which stays', () => {
    const content = contentOf([empty('b1')]);
    const result = runOk(newMethodAndCall, content, {
      target: { ...blocks, first: 'b1', last: 'b1' },
      side: 'after',
    });
    expect(diagramIds(result.content)).toEqual(['d1', 'd2']);
    expect(idsIn(result.content, 'd1')).toEqual(['b3']);
  });

  it('T-0088 · R-BLK-11: refuses an empty or clashing name, and an unknown target', () => {
    const content = program(proc('b1'));
    const at = { target: { ...blocks, first: 'b1', last: 'b1' }, side: 'after' } as const;
    expectRefused(newMethodAndCall, content, { ...at, text: '(x)' }, 'emptyHeadName');
    expectRefused(newMethodAndCall, content, { ...at, text: 'Main' }, 'duplicateHeadName');
    expectRefused(newMethodAndCall, content, { ...at, text: 'sort()' }, 'duplicateHeadName');
    expectRefused(
      newMethodAndCall,
      content,
      { target: { ...blocks, first: 'b9', last: 'b9' }, side: 'after' },
      'notFound',
    );
  });
});
