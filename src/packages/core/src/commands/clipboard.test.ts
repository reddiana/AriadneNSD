import { describe, expect, it } from 'vitest';

import { copy, cut, paste, pasteDiagram } from './clipboard';
import {
  blockOf,
  branch,
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
  ifBlock,
  method,
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

  it('T-0089 · R-EDIT-10: copy takes whole subtrees and the fold regions inside the range', () => {
    const copied = copy(content, { target: range('b1', 'b2') });
    expect(copied.ok ? copied.clip.blocks.map((b) => b.id) : null).toEqual(['b1', 'b2']);
    expect(copied.ok ? copied.clip.folds.map((f) => f.id) : null).toEqual(['f1']);
    expect(copy(content, { target: range('b9') })).toEqual({
      ok: false,
      reason: { code: 'notFound' },
    });
  });

  it('T-0090 · R-EDIT-10: paste puts copies with new ids after the selected block', () => {
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

  it('T-1603 · M87 F4: paste with outsideFolds stays outside the fold regions starting there', () => {
    const clip = seq([proc('x')]);
    const joined = runOk(paste, content, { target: range('b1'), side: 'before', clip });
    expect(foldsIn(joined.content, 'd1')).toEqual(['f1:b5-b2', 'f2:b5-b4']);
    const outside = runOk(paste, content, {
      target: range('b1'),
      side: 'before',
      clip,
      outsideFolds: true,
    });
    expect(idsIn(outside.content, 'd1')).toEqual(['b5', 'b1', 'b2', 'b4']);
    expect(foldsIn(outside.content, 'd1')).toEqual(['f1:b1-b2', 'f2:b1-b4']);
  });

  it('T-0091: 01-model 1.7: pasted fold regions are mapped to the new ids', () => {
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

  it('T-0092 · R-EDIT-10: paste on an empty block takes its place', () => {
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

  it('T-0093: 01-model 3.6: a pasted call to a Method not in this document calls by name', () => {
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
      target: { kind: 'named', name: '' },
      args: 'a',
    });
  });

  it('T-0094 · R-EDIT-10: paste refuses an empty clip and a missing target', () => {
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

  it('T-0095 · R-EDIT-10: cut gives the clip and deletes the blocks', () => {
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

describe('paste a copied diagram (UX HC1)', () => {
  const sort = diagram('d2', method('sort(a)'), [
    proc('b2'),
    call('b3', 'd2', 'a'),
    call('b4', 'd3'),
  ]);
  const content = contentWith(
    diagram('d1', event('main'), [proc('b1')]),
    sort,
    diagram('d3', method('swap'), [proc('b5')]),
  );

  it('T-1643 · UX HC1: it goes after the selected diagram of its kind under a new name, keeping what it receives', () => {
    const result = runOk(pasteDiagram, content, { diagram: sort, after: 'd2' });
    const [made = ''] = result.touched;
    expect(diagramIds(result.content)).toEqual(['d1', 'd2', made, 'd3']);
    expect(diagramOf(result.content, made).head).toEqual(method('sort 2(a)'));
    const again = runOk(pasteDiagram, result.content, { diagram: sort, after: null });
    expect(diagramOf(again.content, again.touched[0] ?? '').head).toEqual(method('sort 3(a)'));
  });

  it('T-1644 · UX HC1: beside a diagram of the other kind or with nothing selected, it goes at the end of its kind', () => {
    for (const after of ['d1', null]) {
      const result = runOk(pasteDiagram, content, { diagram: sort, after });
      expect(diagramIds(result.content)).toEqual(['d1', 'd2', 'd3', result.touched[0]]);
    }
  });

  it('T-1645 · UX HC1: its calls to itself call the copy; other calls find the Method by name or keep the name', () => {
    const names = new Map([['d3', 'swap']]);
    const here = runOk(pasteDiagram, content, { diagram: sort, after: null, names });
    const made = here.touched[0] ?? '';
    const targets = diagramOf(here.content, made).body.blocks.flatMap((block) =>
      block.kind === 'call' ? [block.target] : [],
    );
    expect(targets).toEqual([
      { kind: 'local', diagram: made },
      { kind: 'local', diagram: 'd3' },
    ]);
    const elsewhere = runOk(pasteDiagram, contentWith(diagram('d1', null, [empty('b1')])), {
      diagram: sort,
      after: null,
      names,
    });
    const copied = diagramOf(elsewhere.content, elsewhere.touched[0] ?? '');
    // The blank diagram it was pasted next to is gone (invariant 7).
    expect(elsewhere.content.diagrams).toEqual([copied]);
    expect(copied.head).toEqual(method('sort(a)'));
    expect(copied.body.blocks.at(-1)).toMatchObject({ target: { kind: 'named', name: 'swap' } });
  });
});
