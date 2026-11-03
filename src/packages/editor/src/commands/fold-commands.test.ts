// The fold commands and moving over folded things (interaction rules 4, R-EDIT-13, R-EDIT-14,
// R-EDIT-23, R-FMT-11).
import { parseModelJson, serializeModelJson } from '@ariadne-nsd/core';
import type { Content, Seq } from '@ariadne-nsd/core';
import { describe, expect, it } from 'vitest';

import { branch, contentOf, ifBlock, proc, testEngine, whileBlock } from '../engine-test-support';
import type { TestEngine } from '../engine-test-support';
import { indexDoc } from '../model/doc-index';
import { selectBlock, selectFold, selectRange, selectedBlocks } from '../state/selection';
import { isFoldableSeq } from './fold-commands';

const select = (engine: TestEngine, id: string): void => {
  engine.select(selectBlock(indexDoc(engine.content()), id));
};

const selected = (engine: TestEngine): ReadonlyArray<string> =>
  selectedBlocks(engine.session.index(), engine.session.state.selection);

const folded = (engine: TestEngine): ReadonlyArray<string> => engine.session.state.doc.view.folded;

const notice = (engine: TestEngine): unknown => engine.session.chrome().notice?.message;

const withFolds = (content: Content, folds: Seq['folds']): Content => {
  const [first, ...rest] = content.diagrams;
  return first === undefined
    ? content
    : { ...content, diagrams: [{ ...first, body: { ...first.body, folds } }, ...rest] };
};

const ifContent = contentOf([
  proc('b1'),
  ifBlock('b2', branch('r1', [proc('b3'), proc('b4')]), branch('r2', [proc('b5')])),
  proc('b6'),
]);

describe('folding control blocks (R-EDIT-13)', () => {
  it('T-1097: fold: f on an If folds the branches that can fold; f again unfolds them', () => {
    const engine = testEngine(ifContent);
    select(engine, 'b2');
    engine.keys('f');
    // The false branch holds one process block: it stays open (UX Q20).
    expect(folded(engine)).toEqual(['r1']);
    expect(selected(engine)).toEqual(['b2']);
    expect(notice(engine)).toBe('notice.folded');
    // A view change: no undo step, but the document is unsaved (UX Q9).
    expect(engine.session.state.undo).toHaveLength(0);
    expect(engine.session.state.dirty).toBe(true);
    engine.keys('z', 'a');
    expect(folded(engine)).toEqual([]);
    expect(notice(engine)).toBe('notice.unfolded');
  });

  it('T-1098: fold: folding from a block in a branch folds that branch and selects its row', () => {
    const engine = testEngine(ifContent);
    select(engine, 'b4');
    engine.keys('z', 'c');
    expect(folded(engine)).toEqual(['r1']);
    expect(selected(engine)).toEqual(['b3', 'b4']);
    // The row is selected: folding it again unfolds it.
    engine.keys('z', 'a');
    expect(folded(engine)).toEqual([]);
    engine.keys('z', 'o');
    expect(notice(engine)).toBe('reason.nothingToUnfold');
  });

  it('T-1099: fold: a body of one simple block does not fold, one control block does', () => {
    expect(isFoldableSeq({ blocks: [proc('a')], folds: [] })).toBe(false);
    expect(isFoldableSeq({ blocks: [whileBlock('w', [proc('a')])], folds: [] })).toBe(true);
    const engine = testEngine(contentOf([whileBlock('b1', [proc('b2')])]));
    select(engine, 'b2');
    engine.keys('f');
    expect(folded(engine)).toEqual([]);
    expect(notice(engine)).toBe('reason.nothingToFold');
    select(engine, 'b1');
    engine.keys('f');
    expect(notice(engine)).toBe('reason.nothingToFold');
  });

  it('T-1100: fold: on a branch label f folds that branch; on a header nothing folds', () => {
    const engine = testEngine(ifContent);
    engine.select({ kind: 'branchLabel', branch: 'r1' });
    engine.keys('f');
    expect(folded(engine)).toEqual(['r1']);
    engine.session.select(null);
    engine.keys('f');
    expect(notice(engine)).toBe('reason.nothingSelected');
  });

  it('T-1101: fold: moving down passes a folded branch as one row', () => {
    const engine = testEngine(
      contentOf([proc('b1'), whileBlock('b2', [proc('b3'), proc('b4')]), proc('b5')]),
    );
    select(engine, 'b2');
    engine.keys('f');
    select(engine, 'b2');
    engine.keys('j');
    expect(selected(engine)).toEqual(['b3', 'b4']);
    engine.keys('j');
    expect(selected(engine)).toEqual(['b5']);
    engine.keys('k');
    expect(selected(engine)).toEqual(['b3', 'b4']);
  });
});

describe('fold regions (R-EDIT-14, R-EDIT-23)', () => {
  const content = contentOf([proc('b1', 'one'), proc('b2', 'two'), proc('b3', 'three')]);

  it('T-1102: fold region: zf makes a region, folds it and asks its name; Enter keeps the default name', () => {
    const engine = testEngine(content);
    engine.select(selectRange(indexDoc(content), 'b1', 'b2'));
    engine.keys('z', 'f');
    const region = engine.content().diagrams[0]?.body.folds[0];
    expect(region).toEqual({ id: 'f1', first: 'b1', last: 'b2' });
    expect(folded(engine)).toEqual(['f1']);
    expect(engine.session.state.selection).toEqual(selectFold('f1', []));
    const editing = engine.session.state.editing;
    expect(editing?.field).toEqual({ kind: 'fold', fold: 'f1' });
    expect(editing?.text).toBe('one and 1 more');
    expect(notice(engine)).toBe('notice.foldMade');
    engine.session.commitEditing('one and 1 more');
    expect(engine.content().diagrams[0]?.body.folds[0]?.name).toBeUndefined();
    expect(engine.session.state.undo).toHaveLength(1);
  });

  it('T-1103: fold region: a name typed when it is made joins the same undo step', () => {
    const engine = testEngine(content);
    select(engine, 'b3');
    engine.keys('F');
    engine.session.commitEditing('end');
    expect(engine.content().diagrams[0]?.body.folds[0]?.name).toBe('end');
    expect(engine.session.state.undo).toHaveLength(1);
    engine.keys('u');
    expect(engine.content().diagrams[0]?.body.folds).toEqual([]);
  });

  it('T-1104: fold region: the name is edited later with the text edit command; empty brings the default back', () => {
    const engine = testEngine(
      withFolds(content, [{ id: 'f1', first: 'b2', last: 'b3', name: 'n' }]),
    );
    engine.select(selectFold('f1', []));
    expect(engine.session.chrome().selection).toEqual({
      key: 'selection.fold',
      params: { name: 'n' },
    });
    engine.keys('Enter');
    expect(engine.session.state.editing?.text).toBe('n');
    engine.session.commitEditing('');
    expect(engine.content().diagrams[0]?.body.folds[0]?.name).toBeUndefined();
    expect(engine.session.foldName('f1')).toBe('two and 1 more');
  });

  it('T-1105: fold region: same range again is refused; zd removes the smallest region holding the selection', () => {
    const engine = testEngine(
      withFolds(content, [
        { id: 'f1', first: 'b1', last: 'b3', name: 'all' },
        { id: 'f2', first: 'b2', last: 'b3', name: 'end' },
      ]),
    );
    engine.select(selectFold('f2', []));
    engine.keys('z', 'f');
    expect(notice(engine)).toBe('reason.foldExists');
    select(engine, 'b3');
    engine.keys('z', 'd');
    expect(engine.content().diagrams[0]?.body.folds.map((fold) => fold.id)).toEqual(['f1']);
    expect(notice(engine)).toEqual({ key: 'notice.foldRemoved', params: { name: 'end' } });
    engine.select(selectFold('f1', []));
    engine.keys('Ctrl+Shift+F');
    expect(engine.content().diagrams[0]?.body.folds).toEqual([]);
    expect(selected(engine)).toEqual(['b1', 'b2', 'b3']);
    engine.keys('z', 'd');
    expect(notice(engine)).toBe('reason.noFoldRegion');
  });

  it('T-1106: fold region: folding a block in a region folds the region; a folded region counts as one', () => {
    const engine = testEngine(withFolds(content, [{ id: 'f1', first: 'b1', last: 'b2' }]));
    select(engine, 'b2');
    engine.keys('f');
    expect(folded(engine)).toEqual(['f1']);
    expect(engine.session.state.selection).toEqual(selectFold('f1', []));
    engine.keys('j');
    expect(selected(engine)).toEqual(['b3']);
    engine.keys('k');
    expect(engine.session.state.selection).toEqual(selectFold('f1', []));
    // A folded region moves, goes and is copied whole.
    engine.keys('x');
    expect(engine.content().diagrams[0]?.body.blocks.map((b) => b.id)).toEqual(['b3']);
  });

  it('T-1107: fold region: Up from the first block of an unfolded region selects its name band', () => {
    const engine = testEngine(withFolds(content, [{ id: 'f1', first: 'b2', last: 'b3' }]));
    select(engine, 'b2');
    engine.keys('k');
    expect(engine.session.state.selection).toEqual(selectFold('f1', []));
    engine.keys('k');
    expect(selected(engine)).toEqual(['b1']);
    // Without name bands the region is not drawn, so the keys do not stop on it.
    engine.run('view.bands');
    expect(engine.session.state.doc.view.bands).toBe(false);
    select(engine, 'b2');
    engine.keys('k');
    expect(selected(engine)).toEqual(['b1']);
  });

  it('T-1108: fold region: unfolding a selected region without name bands selects its blocks', () => {
    const engine = testEngine(withFolds(content, [{ id: 'f1', first: 'b1', last: 'b2' }]));
    engine.run('view.bands');
    engine.select(selectRange(indexDoc(engine.content()), 'b1', 'b2'));
    engine.keys('f');
    expect(engine.session.state.selection).toEqual(selectFold('f1', []));
    engine.keys('f');
    expect(selected(engine)).toEqual(['b1', 'b2']);
  });
});

describe('the file keeps folds as shown (R-FMT-11)', () => {
  it('T-1109: fold: the folded state and the names are saved and open as they were', () => {
    const engine = testEngine(ifContent);
    engine.select(selectRange(indexDoc(ifContent), 'b1', 'b2'));
    engine.keys('z', 'f');
    engine.session.commitEditing('start');
    select(engine, 'b4');
    engine.keys('f');
    const json = serializeModelJson(engine.session.state.doc);
    const opened = parseModelJson(json);
    expect(opened.ok).toBe(true);
    if (opened.ok) {
      expect(opened.value.doc.view.folded).toEqual(['r1', 'f1']);
      expect(opened.value.doc.content.diagrams[0]?.body.folds[0]?.name).toBe('start');
    }
  });
});
