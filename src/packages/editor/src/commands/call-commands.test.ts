// Call blocks opened in place, their call sites' fold regions, replacing a call with its Method,
// and calls by a written name (R-EDIT-15, R-EDIT-16, R-EDIT-08, R-BLK-08).
import type { Block, Content, Doc } from '@ariadne-nsd/core';
import { serializeModelJson } from '@ariadne-nsd/core';
import { describe, expect, it } from 'vitest';

import { branch, contentOf, ifBlock, proc, seq, testEngine } from '../engine-test-support';
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

/** `sample` with a second call c3 of the Method d2 in d1: p1, c1, c3. */
const twoSites = (): Content => {
  const base = sample();
  const [d1, d2] = base.diagrams;
  if (d1 === undefined || d2 === undefined) {
    throw new Error('no diagrams');
  }
  return {
    ...base,
    diagrams: [{ ...d1, body: { ...d1.body, blocks: [...d1.body.blocks, call('c3', 'd2')] } }, d2],
  };
};

/** Selects the call block `id` and opens it in place. */
const openCall = (engine: TestEngine, id: string): void => {
  select(engine, id);
  engine.keys('f');
};

/** The fold regions of the call site `id` (content). */
const siteFolds = (engine: TestEngine, id: string): unknown => {
  const block = blockOf(engine, id);
  return block?.kind === 'call' ? block.siteFolds : null;
};

/** The fold regions marked in the Method d2. */
const methodRegions = (engine: TestEngine): unknown =>
  engine.content().diagrams.find((diagram) => diagram.id === 'd2')?.body.folds;

/** The screen ids of the fold regions drawn behind `prefix`. */
const shownRegions = (engine: TestEngine, prefix: string): string[] =>
  [...engine.session.shown().meanings]
    .filter(([id, meaning]) => meaning.kind === 'fold' && id.startsWith(prefix))
    .map(([id]) => id);

describe('opening a call block in place (R-EDIT-15)', () => {
  it('T-1087: peek: f on a call block opens it; the Method blocks are selected and copied, not edited', async () => {
    const engine = testEngine(sample());
    select(engine, 'c1');
    engine.keys('f');
    expect(engine.session.state.doc.view.opened).toEqual([['c1']]);
    expect(notice(engine)).toBe('notice.opened');
    // The first opening copies the Method's region f1 there as f2: one undo step (ADR-0047).
    expect(engine.session.state.undo).toHaveLength(1);
    // Down goes into the band's blocks: the copied region first, then its first block.
    engine.keys('j');
    expect(engine.session.state.selection).toEqual(selectFold('f2', ['c1']));
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

  it('T-1088: peek: folding inside an opened call closes it and selects the call block', () => {
    const engine = testEngine(sample());
    select(engine, 'c1');
    engine.keys('f');
    engine.select({ kind: 'peek', path: ['c1'], anchor: 'c2', focus: 'c2' });
    engine.keys('z', 'c');
    expect(engine.session.state.doc.view.opened).toEqual([]);
    expect(engine.session.state.selection).toEqual(selectBlock(engine.session.index(), 'c1'));
    expect(notice(engine)).toBe('notice.closed');
  });

  it('T-1089: peek: a call opened inside an opened call has a path; the third opening of a Method says so', () => {
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

  it('T-1090: peek: gd on a call block goes to its Method; a call by a written name has none', () => {
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
  it('T-1091: peek: zf there makes a region of that call only; its name joins the step; zd removes it', () => {
    const engine = testEngine(sample());
    select(engine, 'c1');
    engine.keys('f');
    // p7 · c2 would cross f2, the copy of the Method's region f1 (p6 · p7): refused.
    engine.select({ kind: 'peek', path: ['c1'], anchor: 'p7', focus: 'c2' });
    engine.keys('z', 'f');
    expect(notice(engine)).toBe('reason.foldsCross');
    engine.select({ kind: 'peek', path: ['c1'], anchor: 'c2', focus: 'c2' });
    engine.keys('z', 'f');
    expect(notice(engine)).toBe('notice.siteFoldMade');
    const made = blockOf(engine, 'c1');
    expect(made?.kind === 'call' ? made.siteFolds : null).toEqual([
      { id: 'f2', via: [], first: 'p6', last: 'p7', name: 'pair' },
      { id: 'f3', via: [], first: 'c2', last: 'c2' },
    ]);
    expect(engine.session.state.doc.view.folded).toEqual(['c1/', 'f3']);
    expect(engine.session.state.editing?.field).toEqual({ kind: 'fold', fold: 'f3', path: ['c1'] });
    engine.session.commitEditing('tail');
    // The copy at the first opening, then the new region with its name.
    expect(engine.session.state.undo).toHaveLength(2);
    engine.select(selectFold('f3', ['c1']));
    expect(engine.session.state.selection).toEqual(selectFold('f3', ['c1']));
    engine.keys('z', 'd');
    const removed = blockOf(engine, 'c1');
    expect(removed?.kind === 'call' ? removed.siteFolds.map((fold) => fold.id) : null).toEqual([
      'f2',
    ]);
    expect(notice(engine)).toEqual({ key: 'notice.foldRemoved', params: { name: 'tail' } });
    expect(engine.session.state.selection).toEqual({
      kind: 'peek',
      path: ['c1'],
      anchor: 'c2',
      focus: 'c2',
    });
  });

  it("T-1416: peek: the Method's region copied there is removed and renamed at that call only", () => {
    const engine = testEngine(twoSites());
    openCall(engine, 'c1');
    openCall(engine, 'c3');
    // c1 has f2, c3 has f3: both copies of the Method's f1 "pair".
    engine.select(selectFold('f2', ['c1']));
    engine.keys('Enter');
    expect(engine.session.state.editing?.field).toEqual({ kind: 'fold', fold: 'f2', path: ['c1'] });
    engine.session.commitEditing('mine');
    expect(siteFolds(engine, 'c1')).toEqual([
      { id: 'f2', via: [], first: 'p6', last: 'p7', name: 'mine' },
    ]);
    engine.select(selectFold('f2', ['c1']));
    engine.keys('z', 'd');
    expect(notice(engine)).toEqual({ key: 'notice.foldRemoved', params: { name: 'mine' } });
    expect(siteFolds(engine, 'c1')).toEqual([]);
    // The Method and the other call keep theirs; c1 does not show the Method's region again.
    expect(methodRegions(engine)).toEqual([{ id: 'f1', first: 'p6', last: 'p7', name: 'pair' }]);
    expect(siteFolds(engine, 'c3')).toEqual([
      { id: 'f3', via: [], first: 'p6', last: 'p7', name: 'pair' },
    ]);
    expect(shownRegions(engine, 'c1/')).toEqual([]);
    expect(shownRegions(engine, 'c3/')).toEqual(['c3/f3']);
  });
});

describe('a range of blocks inside an opened call block (interaction rules 2, R-EDIT-16)', () => {
  /** sample with the Method's region f1 removed, so p6 · p7 · c2 can make a region. */
  const plainSample = (): Content => {
    const base = sample();
    return {
      ...base,
      diagrams: base.diagrams.map((diagram) =>
        diagram.id === 'd2' ? { ...diagram, body: { ...diagram.body, folds: [] } } : diagram,
      ),
    };
  };

  it('T-1423: Shift+Down widens the range there, stops at the end of the sequence, and zf makes a region of it', () => {
    const engine = testEngine(plainSample());
    openCall(engine, 'c1');
    engine.select({ kind: 'peek', path: ['c1'], anchor: 'p6', focus: 'p6' });
    engine.keys('Shift+ArrowDown');
    expect(engine.session.state.selection).toEqual({
      kind: 'peek',
      path: ['c1'],
      anchor: 'p6',
      focus: 'p7',
    });
    engine.keys('Shift+ArrowDown');
    engine.keys('Shift+ArrowDown');
    expect(notice(engine)).toBe('notice.sameParentOnly');
    expect(engine.session.state.selection).toMatchObject({ anchor: 'p6', focus: 'c2' });
    engine.keys('Shift+ArrowUp');
    expect(engine.session.state.selection).toMatchObject({ anchor: 'p6', focus: 'p7' });
    engine.keys('z', 'f');
    expect(notice(engine)).toBe('notice.siteFoldMade');
    expect(siteFolds(engine, 'c1')).toEqual([{ id: 'f1', via: [], first: 'p6', last: 'p7' }]);
  });

  it('T-1424: v then j k widens the range there as with blocks outside', () => {
    const engine = testEngine(plainSample());
    openCall(engine, 'c1');
    engine.select({ kind: 'peek', path: ['c1'], anchor: 'p7', focus: 'p7' });
    engine.keys('v');
    expect(engine.session.state.mode).toBe('visual');
    engine.keys('j');
    expect(engine.session.state.selection).toMatchObject({ anchor: 'p7', focus: 'c2' });
    engine.keys('k', 'k');
    expect(engine.session.state.selection).toMatchObject({ anchor: 'p7', focus: 'p6' });
    engine.keys('Escape');
    expect(engine.session.state.mode).toBe('normal');
  });
});

describe("the Method's fold regions copied at the first opening (UX CB14, ADR-0047)", () => {
  it('T-1417 · R-EDIT-16: what the Method does to its regions later does not reach a call site already opened', () => {
    const engine = testEngine(sample());
    openCall(engine, 'c1');
    // Renamed and a new region in the Method: c1 keeps its copy as it was.
    engine.select(selectFold('f1', []));
    engine.keys('Enter');
    engine.session.commitEditing('renamed');
    engine.select(selectBlock(engine.session.index(), 'c2'));
    engine.keys('z', 'f');
    engine.session.commitEditing('');
    expect(methodRegions(engine)).toEqual([
      { id: 'f1', first: 'p6', last: 'p7', name: 'renamed' },
      { id: 'f3', first: 'c2', last: 'c2' },
    ]);
    expect(siteFolds(engine, 'c1')).toEqual([
      { id: 'f2', via: [], first: 'p6', last: 'p7', name: 'pair' },
    ]);
    expect(shownRegions(engine, 'c1/')).toEqual(['c1/f2']);
    // Closed and opened again, nothing more is taken.
    openCall(engine, 'c1');
    openCall(engine, 'c1');
    expect(siteFolds(engine, 'c1')).toEqual([
      { id: 'f2', via: [], first: 'p6', last: 'p7', name: 'pair' },
    ]);
  });

  it('T-1418 · R-EDIT-16: an opened call inside an opened call takes the regions for its path', () => {
    const engine = testEngine(sample());
    openCall(engine, 'c1');
    engine.select({ kind: 'peek', path: ['c1'], anchor: 'c2', focus: 'c2' });
    engine.keys('f');
    expect(siteFolds(engine, 'c1')).toEqual([
      { id: 'f2', via: [], first: 'p6', last: 'p7', name: 'pair' },
      { id: 'f3', via: ['c2'], first: 'p6', last: 'p7', name: 'pair' },
    ]);
    expect(shownRegions(engine, 'c1/c2/')).toEqual(['c1/c2/f3']);
    expect(engine.session.state.undo).toHaveLength(2);
  });

  it('T-1419 · R-EDIT-16: undoing the first opening closes the call and takes the copied regions away; redo brings both back', () => {
    const engine = testEngine(sample());
    openCall(engine, 'c1');
    expect(engine.session.state.dirty).toBe(true);
    engine.keys('u');
    // The opening and the copy are one step (ADR-0047, ADR-0048).
    expect(engine.session.state.doc.view.opened).toEqual([]);
    expect(siteFolds(engine, 'c1')).toEqual([]);
    expect(shownRegions(engine, 'c1/')).toEqual([]);
    engine.keys('U');
    expect(engine.session.state.doc.view.opened).toEqual([['c1']]);
    expect(siteFolds(engine, 'c1')).toEqual([
      { id: 'f2', via: [], first: 'p6', last: 'p7', name: 'pair' },
    ]);
  });

  it('T-1420 · R-EDIT-16: opened while view only, the copy is no undo step and does not mark the document changed', () => {
    const engine = testEngine(sample());
    engine.session.setReadOnly(true);
    openCall(engine, 'c1');
    expect(engine.session.state.doc.view.opened).toEqual([['c1']]);
    expect(siteFolds(engine, 'c1')).toEqual([
      { id: 'f2', via: [], first: 'p6', last: 'p7', name: 'pair' },
    ]);
    expect(engine.session.state.undo).toHaveLength(0);
    expect(engine.session.state.dirty).toBe(false);
  });
});

describe('the folding of an opened call block is its own (UX CB13, ADR-0046)', () => {
  /** d1: c1 and c3 call the Method d2 of `sample`. */
  const twoCalls = (): Content => {
    const base = sample();
    const [d1, d2] = base.diagrams;
    if (d1 === undefined || d2 === undefined) {
      throw new Error('no diagrams');
    }
    return {
      ...base,
      diagrams: [{ ...d1, body: { ...d1.body, blocks: [call('c1', 'd2'), call('c3', 'd2')] } }, d2],
    };
  };

  const open = (engine: TestEngine, id: string): void => {
    select(engine, id);
    engine.keys('f');
  };

  /**
   * Folds or unfolds the region drawn through `path` around p6 · p7: the Method's f1 (`[]`), or
   * the copy of it the call site took when first opened (ADR-0047).
   */
  const toggleRegion = (engine: TestEngine, path: ReadonlyArray<string>): void => {
    engine.select(selectFold(regionAt(engine, path), path));
    engine.keys('f');
  };

  /** The region drawn around p6 · p7 through `path`. */
  const regionAt = (engine: TestEngine, path: ReadonlyArray<string>): string => {
    for (const meaning of engine.session.shown().meanings.values()) {
      if (meaning.kind === 'fold' && meaning.path.join('/') === path.join('/')) {
        return meaning.fold;
      }
    }
    return 'f1';
  };

  /** Whether the Method's block p6 is hidden where it is shown through `path`. */
  const isHidden = (engine: TestEngine, path: ReadonlyArray<string>): boolean =>
    engine.session.shown().hiddenBy.has([...path, 'p6'].join('/'));

  const foldInMethod = (engine: TestEngine): void => {
    engine.session.setView({
      ...engine.session.state.doc.view,
      folded: [...engine.session.state.doc.view.folded, 'f1'],
    });
  };

  /** What a saved file brings back: the view as written. The ids here are not in the file's form. */
  const reopened = (engine: TestEngine): TestEngine => {
    const { content, view } = engine.session.state.doc;
    const written = JSON.parse(serializeModelJson({ content, view })) as { view: Doc['view'] };
    const next = testEngine(content);
    next.session.load(
      { content, view: written.view },
      { kept: {}, selection: null, isDirty: false, readOnly: false },
    );
    return next;
  };

  it('T-1342 · R-EDIT-15: opening for the first time takes what the Method has folded at that moment', () => {
    const engine = testEngine(twoCalls());
    foldInMethod(engine);
    open(engine, 'c1');
    expect(isHidden(engine, ['c1'])).toBe(true);
  });

  it('T-1343 · R-EDIT-15: folding in an opened call block leaves the Method and the other call blocks as they are', () => {
    const engine = testEngine(twoCalls());
    open(engine, 'c1');
    open(engine, 'c3');
    const steps = engine.session.state.undo.length;
    toggleRegion(engine, ['c1']);
    expect(isHidden(engine, ['c1'])).toBe(true);
    expect(isHidden(engine, ['c3'])).toBe(false);
    expect(isHidden(engine, [])).toBe(false);
    // Folding is one undo step (ADR-0048).
    expect(engine.session.state.undo).toHaveLength(steps + 1);
  });

  it('T-1344 · R-EDIT-15: folding in the Method leaves the opened call blocks as they are', () => {
    const engine = testEngine(twoCalls());
    open(engine, 'c1');
    toggleRegion(engine, []);
    expect(isHidden(engine, [])).toBe(true);
    expect(isHidden(engine, ['c1'])).toBe(false);
  });

  it('T-1345 · R-EDIT-15: a call block opened inside another keeps its folding per path', () => {
    const engine = testEngine(twoCalls());
    open(engine, 'c1');
    engine.select({ kind: 'peek', path: ['c1'], anchor: 'c2', focus: 'c2' });
    engine.keys('f');
    toggleRegion(engine, ['c1', 'c2']);
    expect(isHidden(engine, ['c1', 'c2'])).toBe(true);
    expect(isHidden(engine, ['c1'])).toBe(false);
    expect(isHidden(engine, [])).toBe(false);
  });

  it('T-1346 · R-EDIT-15: closing and opening again shows the folding last seen there, also after saving', () => {
    const engine = testEngine(twoCalls());
    open(engine, 'c1');
    toggleRegion(engine, ['c1']);
    select(engine, 'c1');
    engine.keys('f');
    expect(engine.session.state.doc.view.opened).toEqual([]);
    // The Method changes while the call block is closed: nothing is taken again.
    toggleRegion(engine, []);
    toggleRegion(engine, []);
    const next = reopened(engine);
    open(next, 'c1');
    expect(isHidden(next, ['c1'])).toBe(true);
    expect(isHidden(next, [])).toBe(false);
  });

  it('T-1347 · R-EDIT-15: a call block unfolded while the Method stays folded stays unfolded after saving', () => {
    const engine = testEngine(twoCalls());
    foldInMethod(engine);
    open(engine, 'c1');
    toggleRegion(engine, ['c1']);
    const next = reopened(engine);
    expect(isHidden(next, ['c1'])).toBe(false);
    expect(isHidden(next, [])).toBe(true);
  });

  it('T-1421 · R-FMT-11: a file saved before takes the regions at opening; saving again gives the same bytes', () => {
    const engine = testEngine(twoCalls());
    const old: Doc = {
      content: twoCalls(),
      view: { folded: ['f1'], opened: [['c1']], bands: true, resultSymbol: '←' },
    };
    engine.session.load(old, { kept: {}, selection: null, isDirty: false, readOnly: false });
    // The opened c1 had no marker: it takes the Method's region now, folded as the Method's.
    expect(siteFolds(engine, 'c1')).toEqual([
      { id: 'f2', via: [], first: 'p6', last: 'p7', name: 'pair' },
    ]);
    expect(isHidden(engine, ['c1'])).toBe(true);
    expect(engine.session.state.dirty).toBe(false);
    expect(engine.session.state.undo).toHaveLength(0);
    const file = serializeModelJson(engine.session.state.doc);
    expect(file).toContain('"c1/"');
    // Opened again, nothing is taken twice and the bytes stay.
    const next = reopened(engine);
    expect(siteFolds(next, 'c1')).toEqual(siteFolds(engine, 'c1'));
    expect(serializeModelJson(next.session.state.doc)).toBe(file);
    // From then on it is its own: unfolding the Method leaves it folded.
    toggleRegion(next, []);
    expect(isHidden(next, [])).toBe(false);
    expect(isHidden(next, ['c1'])).toBe(true);
  });

  it('T-1349 · UX CB8: replacing an opened call block folds the copies as they were shown there', () => {
    const engine = testEngine(twoCalls());
    open(engine, 'c1');
    toggleRegion(engine, ['c1']);
    select(engine, 'c1');
    engine.keys('d', 's');
    const body = engine.content().diagrams[0]?.body;
    const region = body?.folds[0]?.id ?? '';
    expect(engine.session.state.doc.view.folded).toContain(region);
    expect(engine.session.state.doc.view.folded).not.toContain('f1');
  });

  it('T-1350 · R-BLK-07: a call block that calls another Method starts over from that Method', async () => {
    const base = twoCalls();
    const engine = testEngine({
      ...base,
      diagrams: [
        ...base.diagrams,
        {
          id: 'd3',
          head: { kind: 'method', text: 'n()' },
          body: {
            blocks: [proc('p8')],
            folds: [{ id: 'f3', first: 'p8', last: 'p8' }],
          },
        },
      ],
    });
    open(engine, 'c1');
    toggleRegion(engine, ['c1']);
    engine.session.setView({
      ...engine.session.state.doc.view,
      folded: [...engine.session.state.doc.view.folded, 'f3'],
    });
    select(engine, 'c1');
    engine.run('call.setTarget');
    engine.picker()?.choose(1);
    await engine.settle();
    // The regions taken from d2 go with the old target; d3's region is taken, folded as in d3.
    const folded = engine.session.state.doc.view.folded;
    expect(siteFolds(engine, 'c1')).toEqual([{ id: 'f5', via: [], first: 'p8', last: 'p8' }]);
    expect(folded).toContain('f5');
    expect(folded).not.toContain('f2');
  });

  it('T-1351 · R-EDIT-15: deleting an opened call block and undoing brings its folding back; the file keeps none meanwhile', () => {
    const engine = testEngine(twoCalls());
    open(engine, 'c1');
    toggleRegion(engine, ['c1']);
    select(engine, 'c1');
    engine.keys('x');
    expect(serializeModelJson(engine.session.state.doc)).not.toContain('c1/');
    engine.keys('u');
    expect(isHidden(engine, ['c1'])).toBe(true);
  });

  it('T-1352 · R-EDIT-15: a pasted copy of a call block opens with what the Method has folded then', async () => {
    const engine = testEngine(twoCalls());
    open(engine, 'c1');
    toggleRegion(engine, ['c1']);
    select(engine, 'c1');
    engine.keys('y', 'y');
    await engine.settle();
    select(engine, 'c3');
    engine.keys('p');
    await engine.settle();
    const pasted = engine.content().diagrams[0]?.body.blocks[2]?.id ?? '';
    open(engine, pasted);
    expect(isHidden(engine, [pasted])).toBe(false);
    expect(isHidden(engine, ['c1'])).toBe(true);
  });

  it('T-1353 · R-EDIT-15: a new block never takes an id still named by the folding of a call site', () => {
    const engine = testEngine(twoCalls());
    engine.session.setView({
      ...engine.session.state.doc.view,
      folded: ['b90/', 'b90/r91'],
    });
    const ids = engine.session.ids();
    expect(ids.next('block')).toBe('b91');
    expect(ids.next('branch')).toBe('r92');
  });
});

describe('branches and loop bodies fold where a call block is opened (UX CB13, ADR-0046)', () => {
  /**
   * d1: c1 and c3 call the Method d2.
   * d2: If i1 { r1: p1, p2 | r2: p3, p4 }, While w1 { p5, p6 }, c2 → d2.
   */
  const branching = (): Content => {
    const base = contentOf(
      [call('c1', 'd2'), call('c3', 'd2')],
      [
        ifBlock(
          'i1',
          branch('r1', [proc('p1'), proc('p2')]),
          branch('r2', [proc('p3'), proc('p4')]),
        ),
        { id: 'w1', kind: 'while', text: 'w', body: seq([proc('p5'), proc('p6')]) },
        call('c2', 'd2'),
      ],
    );
    const [d1, d2] = base.diagrams;
    if (d1 === undefined || d2 === undefined) {
      throw new Error('no diagrams');
    }
    return { ...base, diagrams: [d1, { ...d2, head: { kind: 'method', text: 'm()' } }] };
  };

  const opened = (content: Content = branching()): TestEngine => {
    const engine = testEngine(content);
    select(engine, 'c1');
    engine.keys('f');
    return engine;
  };

  const peek = (path: ReadonlyArray<string>, anchor: string, focus = anchor) => ({
    kind: 'peek' as const,
    path,
    anchor,
    focus,
  });

  const folded = (engine: TestEngine): ReadonlyArray<string> =>
    engine.session.state.doc.view.folded;

  /** Whether block `id` of the Method is hidden where it is shown through `path`. */
  const isHidden = (engine: TestEngine, path: ReadonlyArray<string>, id: string): boolean =>
    engine.session.shown().hiddenBy.has([...path, id].join('/'));

  it('T-1354 · R-EDIT-15: folding an If there folds its branches at this call only', () => {
    const engine = opened();
    select(engine, 'c3');
    engine.keys('f');
    engine.select(peek(['c1'], 'i1'));
    const steps = engine.session.state.undo.length;
    engine.keys('z', 'a');
    expect(folded(engine)).toEqual(expect.arrayContaining(['c1/r1', 'c1/r2']));
    expect(folded(engine)).not.toContain('r1');
    expect(folded(engine)).not.toContain('c3/r1');
    expect(isHidden(engine, ['c1'], 'p1')).toBe(true);
    expect(isHidden(engine, ['c3'], 'p1')).toBe(false);
    expect(isHidden(engine, [], 'p1')).toBe(false);
    expect(engine.session.state.doc.view.opened).toContainEqual(['c1']);
    expect(engine.session.state.undo).toHaveLength(steps + 1);
    engine.keys('z', 'a');
    expect(isHidden(engine, ['c1'], 'p1')).toBe(false);
  });

  it('T-1355 · R-EDIT-15: the label of a branch folds that branch; its folded row unfolds it again', () => {
    const engine = opened();
    engine.select({ ...peek(['c1'], 'i1'), branch: 'r2' });
    engine.keys('f');
    expect(isHidden(engine, ['c1'], 'p3')).toBe(true);
    expect(isHidden(engine, ['c1'], 'p1')).toBe(false);
    expect(engine.session.state.selection).toEqual(peek(['c1'], 'p3', 'p4'));
    engine.keys('f');
    expect(isHidden(engine, ['c1'], 'p3')).toBe(false);
    expect(engine.session.state.doc.view.opened).toEqual([['c1']]);
  });

  it('T-1356 · R-EDIT-15: zc on a block in a loop body folds the body, zo unfolds it, and the next zc closes outward', () => {
    const engine = opened();
    engine.select(peek(['c1'], 'p5'));
    engine.keys('z', 'c');
    expect(isHidden(engine, ['c1'], 'p5')).toBe(true);
    expect(engine.session.state.selection).toEqual(peek(['c1'], 'p5', 'p6'));
    engine.keys('z', 'o');
    expect(isHidden(engine, ['c1'], 'p5')).toBe(false);
    engine.keys('z', 'c');
    engine.keys('z', 'c');
    expect(engine.session.state.doc.view.opened).toEqual([]);
    expect(notice(engine)).toBe('notice.closed');
  });

  it('T-1357 · R-EDIT-15: a branch taken folded from the Method unfolds there, and stays so after saving', () => {
    const engine = testEngine(branching());
    engine.session.setView({ ...engine.session.state.doc.view, folded: ['r1'] });
    select(engine, 'c1');
    engine.keys('f');
    expect(isHidden(engine, ['c1'], 'p1')).toBe(true);
    engine.select(peek(['c1'], 'p1', 'p2'));
    engine.keys('f');
    expect(isHidden(engine, ['c1'], 'p1')).toBe(false);
    expect(isHidden(engine, [], 'p1')).toBe(true);
    const { content, view } = engine.session.state.doc;
    const written = JSON.parse(serializeModelJson({ content, view })) as { view: Doc['view'] };
    const next = testEngine(content);
    next.session.load(
      { content, view: written.view },
      { kept: {}, selection: null, isDirty: false, readOnly: false },
    );
    expect(isHidden(next, ['c1'], 'p1')).toBe(false);
    expect(isHidden(next, [], 'p1')).toBe(true);
  });

  it('T-1358 · R-EDIT-15: a call block opened inside another folds its branches per path', () => {
    const engine = opened();
    engine.select(peek(['c1'], 'c2'));
    engine.keys('f');
    engine.select(peek(['c1', 'c2'], 'i1'));
    engine.keys('f');
    expect(folded(engine)).toContain('c1/c2/r1');
    expect(isHidden(engine, ['c1', 'c2'], 'p1')).toBe(true);
    expect(isHidden(engine, ['c1'], 'p1')).toBe(false);
  });

  it('T-1359 · R-EDIT-15: a selection folded away there stays on its row and survives other view changes', () => {
    const engine = opened();
    engine.select(peek(['c1'], 'p5', 'p6'));
    engine.keys('f');
    expect(engine.session.state.selection).toEqual(peek(['c1'], 'p5', 'p6'));
    engine.keys('j');
    expect(engine.session.state.selection).toEqual(peek(['c1'], 'c2'));
    engine.keys('k');
    expect(engine.session.state.selection).toEqual(peek(['c1'], 'p5', 'p6'));
  });

  it('T-1422 · R-EDIT-16: a body that is all one region there folds that region, and zd removes it there only', () => {
    const base = branching();
    const [d1, d2] = base.diagrams;
    if (d1 === undefined || d2 === undefined) {
      throw new Error('no diagrams');
    }
    const whole = seq([proc('p5'), proc('p6')]);
    const engine = opened({
      ...base,
      diagrams: [
        d1,
        {
          ...d2,
          body: {
            ...d2.body,
            blocks: d2.body.blocks.map((block) =>
              block.id === 'w1'
                ? {
                    ...block,
                    body: { ...whole, folds: [{ id: 'f9', first: 'p5', last: 'p6', name: 'all' }] },
                  }
                : block,
            ),
          },
        },
      ],
    });
    // The site took f9 as f10 when it was opened (ADR-0047).
    engine.select(peek(['c1'], 'p5'));
    engine.keys('z', 'c');
    expect(folded(engine)).toContain('f10');
    expect(folded(engine)).not.toContain('f9');
    expect(isHidden(engine, ['c1'], 'p5')).toBe(true);
    engine.keys('z', 'o');
    engine.select(peek(['c1'], 'p5'));
    engine.keys('z', 'd');
    expect(notice(engine)).toEqual({ key: 'notice.foldRemoved', params: { name: 'all' } });
    const c1 = engine.session.index().blocks.get('c1')?.block;
    expect(c1?.kind === 'call' ? c1.siteFolds : null).toEqual([]);
    const w1 = engine.session.index().blocks.get('w1')?.block;
    expect(w1?.kind === 'while' ? w1.body.folds.map((fold) => fold.id) : null).toEqual(['f9']);
  });
});

describe('replacing a call block with its Method (R-EDIT-08)', () => {
  it('T-1093: inline: ds on a call block puts the Method blocks in its place, folded as they were', () => {
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
  it('T-1094: named call: "Call by a written name" inserts a call and types its name; Tab goes round', async () => {
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

  it('T-1095: named call: changing the called Method to a written name starts from the name it showed', async () => {
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
  it('T-1096: paste: a copied call keeps its Method by name, not by id', async () => {
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
