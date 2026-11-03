// Call blocks opened in place, their call sites' fold regions, replacing a call with its Method,
// and calls by a written name (R-EDIT-15, R-EDIT-16, R-EDIT-08, R-BLK-08).
import type { Block, Content } from '@ariadne-nsd/core';
import { describe, expect, it } from 'vitest';

import { contentOf, proc, testEngine } from '../engine-test-support';
import type { TestEngine } from '../engine-test-support';
import { indexDoc } from '../model/doc-index';
import { selectBlock, selectFold } from '../state/selection';

const call = (id: string, diagram: string, args = ''): Block => ({
  id,
  kind: 'call',
  target: { kind: 'local', diagram },
  args,
  result: '',
  siteFolds: [],
});

/** d1: p1, c1 → d2. d2: Method "m(x)" { p6, p7, c2 → d2 }, with a fold region f1 on p6..p7. */
const sample = (): Content => {
  const base = contentOf(
    [proc('p1'), call('c1', 'd2', 'a')],
    [proc('p6'), proc('p7'), call('c2', 'd2')],
  );
  const [d1, d2] = base.diagrams;
  if (d1 === undefined || d2 === undefined) {
    throw new Error('no diagrams');
  }
  return {
    ...base,
    diagrams: [
      d1,
      {
        ...d2,
        head: { kind: 'method', text: 'm(x)' },
        body: { ...d2.body, folds: [{ id: 'f1', first: 'p6', last: 'p7', name: 'pair' }] },
      },
    ],
  };
};

const select = (engine: TestEngine, id: string): void => {
  engine.select(selectBlock(indexDoc(engine.content()), id));
};

const notice = (engine: TestEngine): unknown => engine.session.chrome().notice?.message;

const blockOf = (engine: TestEngine, id: string): Block | undefined =>
  engine.session.index().blocks.get(id)?.block;

describe('opening a call block in place (R-EDIT-15)', () => {
  it('peek: f on a call block opens it; the Method blocks are selected and copied, not edited', async () => {
    const engine = testEngine(sample());
    select(engine, 'c1');
    engine.keys('f');
    expect(engine.session.state.doc.view.opened).toEqual([['c1']]);
    expect(notice(engine)).toBe('notice.opened');
    expect(engine.session.state.undo).toHaveLength(0);
    // Down goes into the band's blocks: the Method's region first, then its first block.
    engine.keys('j');
    expect(engine.session.state.selection).toEqual(selectFold('f1', ['c1']));
    engine.keys('j');
    expect(engine.session.state.selection).toEqual({
      kind: 'peek',
      path: ['c1'],
      anchor: 'p6',
      focus: 'p6',
    });
    expect(engine.session.chrome().selection).toEqual({
      key: 'selection.peek',
      params: { count: 1 },
    });
    engine.keys('x');
    expect(notice(engine)).toBe('reason.peekReadOnly');
    engine.keys('Enter');
    expect(engine.session.state.editing).toBeNull();
    engine.keys('y', 'y');
    await engine.settle();
    expect(engine.clipboard.data.text).toBe('p6');
    // gd goes to the Method's own block.
    engine.keys('g', 'd');
    expect(engine.session.state.selection).toEqual(selectBlock(engine.session.index(), 'p6'));
  });

  it('peek: folding inside an opened call closes it and selects the call block', () => {
    const engine = testEngine(sample());
    select(engine, 'c1');
    engine.keys('f');
    engine.select({ kind: 'peek', path: ['c1'], anchor: 'p6', focus: 'p6' });
    engine.keys('z', 'c');
    expect(engine.session.state.doc.view.opened).toEqual([]);
    expect(engine.session.state.selection).toEqual(selectBlock(engine.session.index(), 'c1'));
    expect(notice(engine)).toBe('notice.closed');
  });

  it('peek: a call opened inside an opened call has a path; the third opening of a Method says so', () => {
    const engine = testEngine(sample());
    select(engine, 'c1');
    engine.keys('f');
    engine.select({ kind: 'peek', path: ['c1'], anchor: 'c2', focus: 'c2' });
    engine.keys('f');
    expect(engine.session.state.doc.view.opened).toEqual([['c1'], ['c1', 'c2']]);
    expect(notice(engine)).toBe('notice.opened');
    engine.select({ kind: 'peek', path: ['c1', 'c2'], anchor: 'c2', focus: 'c2' });
    engine.keys('f');
    expect(notice(engine)).toEqual({ key: 'notice.openedAgain', params: { name: 'm', count: 3 } });
  });

  it('peek: gd on a call block goes to its Method; a call by a written name has none', () => {
    const engine = testEngine(sample());
    select(engine, 'c1');
    engine.keys('g', 'd');
    expect(engine.session.state.selection).toEqual({ kind: 'head', diagram: 'd2' });
    const named = testEngine(
      contentOf([
        {
          id: 'c9',
          kind: 'call',
          target: { kind: 'named', name: 'f' },
          args: '',
          result: '',
          siteFolds: [],
        },
      ]),
    );
    select(named, 'c9');
    named.keys('g', 'd');
    expect(notice(named)).toBe('reason.notCallable');
    named.keys('f');
    expect(notice(named)).toBe('reason.nothingToFold');
  });
});

describe('fold regions at an opened call site (R-EDIT-16)', () => {
  it('peek: zf there makes a region of that call only; its name joins the step; zd removes it', () => {
    const engine = testEngine(sample());
    select(engine, 'c1');
    engine.keys('f');
    // p7 · c2 would cross the Method's region f1 (p6 · p7): refused, as it could not be shown.
    engine.select({ kind: 'peek', path: ['c1'], anchor: 'p7', focus: 'c2' });
    engine.keys('z', 'f');
    expect(notice(engine)).toBe('reason.foldsCross');
    engine.select({ kind: 'peek', path: ['c1'], anchor: 'c2', focus: 'c2' });
    engine.keys('z', 'f');
    expect(notice(engine)).toBe('notice.siteFoldMade');
    const made = blockOf(engine, 'c1');
    expect(made?.kind === 'call' ? made.siteFolds : null).toEqual([
      { id: 'f2', via: [], first: 'c2', last: 'c2' },
    ]);
    expect(engine.session.state.doc.view.folded).toEqual(['f2']);
    expect(engine.session.state.editing?.field).toEqual({ kind: 'fold', fold: 'f2', path: ['c1'] });
    engine.session.commitEditing('tail');
    expect(engine.session.state.undo).toHaveLength(1);
    engine.select(selectFold('f2', ['c1']));
    expect(engine.session.state.selection).toEqual(selectFold('f2', ['c1']));
    engine.keys('z', 'd');
    const removed = blockOf(engine, 'c1');
    expect(removed?.kind === 'call' ? removed.siteFolds : null).toEqual([]);
    expect(notice(engine)).toEqual({ key: 'notice.foldRemoved', params: { name: 'tail' } });
    expect(engine.session.state.selection).toEqual({
      kind: 'peek',
      path: ['c1'],
      anchor: 'c2',
      focus: 'c2',
    });
  });

  it("peek: the Method's own region cannot be removed or renamed at the call site", () => {
    const engine = testEngine(sample());
    select(engine, 'c1');
    engine.keys('f');
    engine.select(selectFold('f1', ['c1']));
    engine.keys('z', 'd');
    expect(notice(engine)).toBe('reason.methodFoldHere');
    engine.keys('Enter');
    expect(notice(engine)).toBe('reason.methodFoldHere');
    // Folding it there folds the Method's region, which every call shows (01-model 2).
    engine.keys('f');
    expect(engine.session.state.doc.view.folded).toEqual(['f1']);
  });
});

describe('replacing a call block with its Method (R-EDIT-08)', () => {
  it('inline: ds on a call block puts the Method blocks in its place, folded as they were', () => {
    const engine = testEngine(sample());
    engine.session.setView({ ...engine.session.state.doc.view, folded: ['f1'] });
    select(engine, 'c1');
    engine.keys('d', 's');
    const body = engine.content().diagrams[0]?.body;
    expect(body?.blocks.map((block) => block.id)).toEqual(['p1', 'b1', 'b2', 'b3']);
    expect(body?.folds).toEqual([{ id: 'f2', first: 'b1', last: 'b2', name: 'pair' }]);
    expect(engine.session.state.doc.view.folded).toEqual(['f1', 'f2']);
    expect(notice(engine)).toEqual({ key: 'notice.inlined', params: { name: 'm' } });
    engine.keys('u');
    expect(engine.content().diagrams[0]?.body.blocks.map((block) => block.id)).toEqual([
      'p1',
      'c1',
    ]);
  });
});

describe('calls by a written name (R-BLK-08)', () => {
  it('named call: "Call by a written name" inserts a call and types its name; Tab goes round', async () => {
    const engine = testEngine(sample());
    select(engine, 'p1');
    engine.keys('a', 'c');
    const picker = engine.picker();
    expect(picker?.items.at(-1)).toEqual({ title: 'picker.namedCall', isLiteral: false });
    picker?.choose(picker.items.length - 1);
    await engine.settle();
    expect(engine.session.state.editing?.field).toMatchObject({ kind: 'call', part: 'name' });
    engine.session.commitEditing('printf');
    const [made] = engine.content().diagrams[0]?.body.blocks.slice(1, 2) ?? [];
    expect(made).toMatchObject({ kind: 'call', target: { kind: 'named', name: 'printf' } });
    engine.keys('Enter');
    expect(engine.session.state.editing?.field).toMatchObject({ part: 'args' });
    expect(engine.session.switchCallPart('"%d", n')).toBe(true);
    expect(engine.session.switchCallPart('r')).toBe(true);
    expect(engine.session.state.editing?.field).toMatchObject({ part: 'name' });
    engine.session.commitEditing('');
    expect(notice(engine)).toBe('reason.emptyCallName');
    expect(blockOf(engine, made?.id ?? '')).toMatchObject({
      target: { kind: 'named', name: 'printf' },
    });
  });

  it('named call: changing the called Method to a written name starts from the name it showed', async () => {
    const engine = testEngine(sample());
    select(engine, 'c1');
    engine.run('call.setTarget');
    const picker = engine.picker();
    picker?.choose(picker.items.length - 1);
    await engine.settle();
    expect(blockOf(engine, 'c1')).toMatchObject({
      target: { kind: 'named', name: 'm' },
      args: 'a',
    });
    expect(engine.session.state.editing).toMatchObject({ field: { part: 'name' }, text: 'm' });
  });
});

describe('pasting calls into another document', () => {
  it('paste: a copied call keeps its Method by name, not by id', async () => {
    // Ids in the file's form: the clipboard carries the model JSON (03-editor 3.3).
    const copied = contentOf([call('b1', 'd2', 'a')], [proc('b2')]);
    const [c1, c2] = copied.diagrams;
    if (c1 === undefined || c2 === undefined) {
      throw new Error('no diagrams');
    }
    const source = testEngine({
      ...copied,
      diagrams: [c1, { ...c2, head: { kind: 'method', text: 'm(x)' } }],
    });
    select(source, 'b1');
    source.keys('y', 'y');
    await source.settle();
    expect(source.clipboard.data.json).toContain('"text": "m(x)"');
    const other = contentOf([proc('b1')], [proc('b2')]);
    const [d1, d2] = other.diagrams;
    if (d1 === undefined || d2 === undefined) {
      throw new Error('no diagrams');
    }
    const target = testEngine({
      ...other,
      diagrams: [d1, { ...d2, id: 'd7', head: { kind: 'method', text: 'm(y)' } }],
    });
    target.clipboard.data = source.clipboard.data;
    select(target, 'b1');
    target.keys('p');
    await target.settle();
    const pasted = target.content().diagrams[0]?.body.blocks[1];
    expect(pasted).toMatchObject({ kind: 'call', target: { kind: 'local', diagram: 'd7' } });
  });
});
