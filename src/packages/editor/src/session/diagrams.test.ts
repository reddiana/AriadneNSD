import type { Block, Call, Content, Head } from '@ariadne-nsd/core';
import { describe, expect, it } from 'vitest';

import { contentOf, empty, proc, testEngine } from '../engine-test-support';
import type { TestEngine } from '../engine-test-support';
import { indexDoc } from '../model/doc-index';
import { selectBlock, selectedBlocks } from '../state/selection';

/** Gives diagrams headers: `{ d1: ['event', 'tick'] }`. */
const withHeads = (
  content: Content,
  heads: Readonly<Record<string, readonly [Head['kind'], string]>>,
): Content => ({
  ...content,
  diagrams: content.diagrams.map((d) => {
    const head = heads[d.id];
    return head === undefined ? d : { ...d, head: { kind: head[0], text: head[1] } };
  }),
});

const call = (id: string, diagram: string, args = '', result = ''): Call => ({
  id,
  kind: 'call',
  target: { kind: 'local', diagram },
  args,
  result,
  siteFolds: [],
});

const select = (engine: TestEngine, id: string): void => {
  engine.select(selectBlock(indexDoc(engine.content()), id));
};

const selected = (engine: TestEngine): ReadonlyArray<string> =>
  selectedBlocks(engine.session.index(), engine.session.state.selection);

const headText = (engine: TestEngine, diagram: string): string | null =>
  engine.content().diagrams.find((d) => d.id === diagram)?.head?.text ?? null;

const blockOf = (engine: TestEngine, id: string): Block | undefined =>
  engine.session.index().blocks.get(id)?.block;

const notice = (engine: TestEngine): unknown => engine.session.chrome().notice?.message;

// d1: Event "tick" { a, b }; d2: Method "sort(xs)" { c }; d3: no header { e }
const sample = (): Content =>
  withHeads(contentOf([proc('a'), proc('b')], [proc('c')], [proc('e')]), {
    d1: ['event', 'tick'],
    d2: ['method', 'sort(xs)'],
  });

describe('selecting a header (interaction rules 2 "키보드로 이동하고 삽입하기")', () => {
  it('R-BLK-10: Up from the first block selects the header; Down goes back', () => {
    const engine = testEngine(sample());
    select(engine, 'a');
    engine.keys('k');
    expect(engine.session.state.selection).toEqual({ kind: 'head', diagram: 'd1' });
    expect(engine.session.chrome().selection).toEqual({
      key: 'selection.eventHead',
      params: { name: 'tick' },
    });
    engine.keys('k');
    expect(engine.session.state.selection).toEqual({ kind: 'head', diagram: 'd1' });
    engine.keys('j');
    expect(selected(engine)).toEqual(['a']);
  });

  it('interaction rules 2: Left and Right on a header go to the side diagram, drawn order', () => {
    // Drawn order: Events and diagrams without a header (d1, d3), then Methods (d2).
    const engine = testEngine(sample());
    engine.select({ kind: 'head', diagram: 'd1' });
    engine.keys('l');
    expect(selected(engine)).toEqual(['e']);
    engine.keys('ArrowLeft');
    expect(selected(engine)).toEqual(['e']);
    engine.select({ kind: 'head', diagram: 'd2' });
    engine.keys('h');
    expect(selected(engine)).toEqual(['e']);
    engine.keys('Ctrl+Shift+ArrowRight');
    expect(engine.session.state.selection).toEqual({ kind: 'head', diagram: 'd2' });
    engine.keys('Ctrl+Shift+ArrowRight');
    expect(notice(engine)).toBe('notice.noDiagramThere');
  });

  it('interaction rules 2: the first move key selects the header of the first diagram', () => {
    const engine = testEngine(sample());
    engine.keys('j');
    expect(engine.session.state.selection).toEqual({ kind: 'head', diagram: 'd1' });
    engine.keys('j', 'g', 'g');
    expect(engine.session.state.selection).toEqual({ kind: 'head', diagram: 'd1' });
    engine.keys('G');
    expect(selected(engine)).toEqual(['b']);
  });

  it('interaction rules 2: after Esc Esc on a header, a move key selects it again', () => {
    const engine = testEngine(sample());
    engine.select({ kind: 'head', diagram: 'd2' });
    engine.keys('Escape', 'Escape');
    expect(engine.session.state.selection).toBeNull();
    engine.keys('j');
    expect(engine.session.state.selection).toEqual({ kind: 'head', diagram: 'd2' });
  });
});

describe('editing a header name (interaction rules "Event 헤더", "Method 헤더")', () => {
  it('R-BLK-10: Enter edits the name; accepting changes it in one undo step', () => {
    const engine = testEngine(sample());
    engine.select({ kind: 'head', diagram: 'd1' });
    engine.keys('Enter');
    expect(engine.session.state.editing).toMatchObject({
      field: { kind: 'head', diagram: 'd1' },
      text: 'tick',
      caret: 'selectAll',
    });
    engine.session.commitEditing('timer');
    expect(headText(engine, 'd1')).toBe('timer');
    expect(engine.session.state.undo).toHaveLength(1);
    expect(engine.session.state.selection).toEqual({ kind: 'head', diagram: 'd1' });
  });

  it('UX Q4: an empty name puts the old name back, closes and tells why', () => {
    const engine = testEngine(sample());
    engine.select({ kind: 'head', diagram: 'd1' });
    engine.keys('c', 'c');
    engine.session.commitEditing('  ');
    expect(headText(engine, 'd1')).toBe('tick');
    expect(engine.session.state.editing).toBeNull();
    expect(notice(engine)).toBe('reason.emptyHeadName');
  });

  it('R-BLK-11: a clashing name opens the field again; Esc there keeps the old name', () => {
    const engine = testEngine(sample());
    engine.select({ kind: 'head', diagram: 'd1' });
    engine.keys('Enter');
    engine.session.commitEditing('sort');
    expect(notice(engine)).toBe('reason.duplicateHeadName');
    expect(engine.session.state.editing).toMatchObject({
      field: { kind: 'head', diagram: 'd1' },
      initial: 'tick',
      text: 'sort',
      isRejected: true,
    });
    expect(headText(engine, 'd1')).toBe('tick');
    engine.session.cancelEditing();
    expect(headText(engine, 'd1')).toBe('tick');
    expect(engine.session.state.undo).toHaveLength(0);
  });
});

describe('header and diagram commands (interaction rules "새 Method로 빼기와 새 다이어그램")', () => {
  it('R-BLK-10: e in a diagram without a header gives it one and edits its name', () => {
    const engine = testEngine(sample());
    select(engine, 'e');
    engine.keys('e');
    expect(engine.content().diagrams.find((d) => d.id === 'd3')?.head).toEqual({
      kind: 'event',
      text: 'Event 1',
    });
    expect(engine.session.state.selection).toEqual({ kind: 'head', diagram: 'd3' });
    expect(engine.session.state.editing).toMatchObject({
      field: { kind: 'head', diagram: 'd3' },
      text: 'Event 1',
      caret: 'selectAll',
    });
  });

  it('R-BLK-11: m on a header changes the kind; a called Method cannot become an Event', () => {
    const engine = testEngine(sample());
    engine.select({ kind: 'head', diagram: 'd1' });
    engine.keys('m');
    expect(engine.content().diagrams.find((d) => d.id === 'd1')?.head?.kind).toBe('method');
    expect(engine.session.state.editing).toBeNull();

    const called = testEngine(
      withHeads(contentOf([call('k1', 'd2')], [proc('c')]), { d2: ['method', 'f'] }),
    );
    called.select({ kind: 'head', diagram: 'd2' });
    called.keys('e');
    expect(notice(called)).toBe('reason.methodHasCallers');
  });

  it('R-EDIT-19: on blocks of a diagram with a header, m tells that extracting is not there yet', () => {
    const engine = testEngine(sample());
    select(engine, 'a');
    engine.keys('m');
    expect(notice(engine)).toBe('reason.extractNotYet');
    engine.keys('e');
    expect(notice(engine)).toBe('reason.eventNotExtracted');
    expect(engine.session.state.undo).toHaveLength(0);
  });

  it('R-EDIT-18: E and M make a new diagram of that kind and edit its name', () => {
    const engine = testEngine(sample());
    select(engine, 'a');
    engine.keys('M');
    const made = engine.content().diagrams.find((d) => d.id === 'd4');
    expect(made?.head).toEqual({ kind: 'method', text: 'Method 1' });
    expect(engine.session.state.editing?.field).toEqual({ kind: 'head', diagram: 'd4' });
    engine.session.commitEditing('push(x)');
    engine.keys('E');
    // Each goes at the end of its kind (interaction rules 5).
    expect(engine.content().diagrams.map((d) => d.head?.text ?? null)).toEqual([
      'tick',
      'sort(xs)',
      'push(x)',
      null,
      'Event 1',
    ]);
  });

  it('R-BLK-07: removing a Method header makes its calls lost and selects the first block', () => {
    const engine = testEngine(
      withHeads(contentOf([call('k1', 'd2', 'v')], [proc('c')]), { d2: ['method', 'f(a)'] }),
    );
    engine.select({ kind: 'head', diagram: 'd2' });
    engine.keys('x');
    expect(headText(engine, 'd2')).toBeNull();
    expect(blockOf(engine, 'k1')).toMatchObject({ target: { kind: 'lost', lastName: 'f' } });
    expect(selected(engine)).toEqual(['c']);
    engine.keys('u');
    engine.select({ kind: 'head', diagram: 'd2' });
    engine.keys('d', 'd');
    expect(headText(engine, 'd2')).toBeNull();
  });

  it('invariant 7: a header removed from a diagram with nothing in it takes the diagram', () => {
    const engine = testEngine(
      withHeads(contentOf([proc('a')], [empty('z')]), { d2: ['event', 'irq'] }),
    );
    engine.select({ kind: 'head', diagram: 'd2' });
    engine.keys('Delete');
    expect(engine.content().diagrams.map((d) => d.id)).toEqual(['d1']);
    expect(engine.session.state.selection).toBeNull();
  });

  it('R-EDIT-18: Shift+Delete deletes the diagram; the only one cannot be deleted', () => {
    const engine = testEngine(
      withHeads(contentOf([call('k1', 'd2')], [proc('c')]), { d2: ['method', 'f'] }),
    );
    select(engine, 'c');
    engine.keys('Shift+Delete');
    expect(engine.content().diagrams.map((d) => d.id)).toEqual(['d1']);
    expect(blockOf(engine, 'k1')).toMatchObject({ target: { kind: 'lost', lastName: 'f' } });
    expect(notice(engine)).toBe('notice.diagramDeleted');
    expect(selected(engine)).toEqual(['k1']);
    engine.keys('Shift+Delete');
    expect(notice(engine)).toBe('reason.lastDiagram');
  });

  it('UX Q6: Alt+arrows on a header move the diagram among its kind', () => {
    const engine = testEngine(
      withHeads(contentOf([proc('a')], [proc('b')], [proc('c')]), {
        d1: ['method', 'f'],
        d2: ['event', 'e'],
        d3: ['method', 'g'],
      }),
    );
    engine.select({ kind: 'head', diagram: 'd1' });
    engine.keys('Alt+j');
    expect(engine.content().diagrams.map((d) => d.id)).toEqual(['d3', 'd2', 'd1']);
    expect(engine.session.state.selection).toEqual({ kind: 'head', diagram: 'd1' });
    engine.keys('Alt+ArrowDown');
    expect(notice(engine)).toBe('reason.atBottom');
  });
});

describe('call blocks (interaction rules "호출 블록")', () => {
  it('R-BLK-07: a c lists the Methods; the chosen one is called and its arguments typed', async () => {
    const engine = testEngine(sample());
    select(engine, 'a');
    engine.keys('a', 'c');
    const picker = engine.picker();
    expect(picker?.title).toBe('picker.callTarget');
    expect(picker?.items).toEqual([
      { title: 'sort(xs)', isLiteral: true },
      { title: 'picker.newMethod', isLiteral: false },
    ]);
    picker?.choose(0);
    await engine.settle();
    const [made] = selected(engine);
    expect(blockOf(engine, made ?? '')).toMatchObject({
      kind: 'call',
      target: { kind: 'local', diagram: 'd2' },
      args: 'xs',
    });
    expect(engine.session.state.editing).toMatchObject({
      field: { kind: 'call', part: 'args' },
      text: 'xs',
    });
    // Tab goes to the result; both fields go in at once, one undo step for the typing.
    expect(engine.session.switchCallPart('list')).toBe(true);
    expect(engine.session.state.editing).toMatchObject({
      field: { kind: 'call', part: 'result' },
      text: '',
    });
    engine.session.commitEditing('sorted');
    expect(blockOf(engine, made ?? '')).toMatchObject({ args: 'list', result: 'sorted' });
    expect(engine.session.state.undo).toHaveLength(2);
  });

  it('R-BLK-07: "New Method, and call it" makes the Method and edits its name', async () => {
    const engine = testEngine(sample());
    select(engine, 'b');
    engine.keys('A', 'c');
    engine.picker()?.choose(1);
    await engine.settle();
    const made = engine.content().diagrams.find((d) => d.id === 'd4');
    expect(made?.head).toEqual({ kind: 'method', text: 'Method 1' });
    expect(engine.session.state.editing?.field).toEqual({ kind: 'head', diagram: 'd4' });
    expect(
      engine.session
        .index()
        .seqs.get('d1')
        ?.seq.blocks.map((b) => b.kind),
    ).toEqual(['process', 'call', 'process']);
    expect(engine.session.state.undo).toHaveLength(1);
  });

  it('03-keymap: closing the list inserts nothing', async () => {
    const engine = testEngine(sample());
    select(engine, 'a');
    engine.run('block.insert.call');
    engine.picker()?.choose(null);
    await engine.settle();
    expect(engine.session.state.undo).toHaveLength(0);
  });

  it('interaction rules "호출 블록": a Method receiving nothing has the result field only', () => {
    const engine = testEngine(
      withHeads(contentOf([call('k1', 'd2')], [proc('c')]), { d2: ['method', 'reset'] }),
    );
    select(engine, 'k1');
    engine.keys('Enter');
    expect(engine.session.state.editing?.field).toEqual({
      kind: 'call',
      block: 'k1',
      part: 'result',
    });
    expect(engine.session.switchCallPart('x')).toBe(false);
    engine.session.commitEditing('ok');
    expect(blockOf(engine, 'k1')).toMatchObject({ args: '', result: 'ok' });
  });

  it('R-BLK-07: a call block that lost its target cannot be edited', () => {
    const lost: Call = { ...call('k1', 'd1'), target: { kind: 'lost', lastName: 'f' } };
    const engine = testEngine(contentOf([lost]));
    select(engine, 'k1');
    engine.keys('Enter');
    expect(engine.session.state.editing).toBeNull();
    expect(notice(engine)).toBe('reason.lostTarget');
  });

  it('R-BLK-07: changing the called Method starts at the current one and keeps the texts', async () => {
    const engine = testEngine(
      withHeads(contentOf([call('k1', 'd2', 'v', 'r')], [proc('c')], [proc('e')]), {
        d2: ['method', 'f(a)'],
        d3: ['method', 'g(b)'],
      }),
    );
    select(engine, 'k1');
    engine.run('call.setTarget');
    expect(engine.picker()?.active).toBe(0);
    engine.picker()?.choose(1);
    await engine.settle();
    expect(blockOf(engine, 'k1')).toMatchObject({
      target: { kind: 'local', diagram: 'd3' },
      args: 'v',
      result: 'r',
    });
    select(engine, 'c');
    engine.run('call.setTarget');
    expect(notice(engine)).toBe('reason.selectCall');
  });
});
