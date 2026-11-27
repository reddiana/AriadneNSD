// The endless loop, exit and parallel blocks in the editor: keys, branch selection and the
// branch commands on a parallel block (R-BLK-15, R-BLK-12, R-BLK-13, sketch M84).
import type { Block, Branch, Content, Parallel } from '@ariadne-nsd/core';
import { layout } from '@ariadne-nsd/core';
import { describe, expect, it } from 'vitest';

import { clipToText } from '../clipboard/clip-format';
import { selectionBox } from '../dom/overlay';
import { branch, contentOf, docOf, proc, seq, testEngine } from '../engine-test-support';
import type { TestEngine } from '../engine-test-support';
import { hitTest } from '../input/hit-test';
import { indexDoc } from '../model/doc-index';
import { selectBlock, selectedBlocks } from '../state/selection';
import { blockIconCommand } from '../ui/command-ids';

const parallel = (id: string, branches: ReadonlyArray<Branch>, text = ''): Parallel => ({
  id,
  kind: 'parallel',
  text,
  branches,
});

const endless = (id: string, blocks: ReadonlyArray<Block>): Block => ({
  id,
  kind: 'endless',
  body: seq(blocks),
});

const exit = (id: string, text = 'break'): Block => ({ id, kind: 'exit', text });

// d1: p1; parallel t1 { r1: p2 | r2: p3, p4 | r3: p5 }; endless e1 { x1 }
const sample = (): Content =>
  contentOf([
    proc('p1'),
    parallel('t1', [
      branch('r1', [proc('p2')]),
      branch('r2', [proc('p3'), proc('p4')]),
      branch('r3', [proc('p5')]),
    ]),
    endless('e1', [exit('x1')]),
  ]);

const engineOn = (id: string, content = sample()): TestEngine => {
  const engine = testEngine(content);
  engine.select(selectBlock(engine.session.index(), id));
  return engine;
};

const selected = (engine: TestEngine): ReadonlyArray<string> =>
  selectedBlocks(engine.session.index(), engine.session.state.selection);

const notice = (engine: TestEngine): unknown => engine.session.chrome().notice?.message;

const branchesOfT1 = (engine: TestEngine): ReadonlyArray<string> => {
  const block = engine.session.index().blocks.get('t1')?.block;
  return block?.kind === 'parallel' ? block.branches.map((b) => b.id) : [];
};

describe('inserting the new blocks', () => {
  it('T-1547 · R-BLK-15 (UX EL1): a e and A e insert an endless loop, selected and not edited', () => {
    const engine = engineOn('p1');
    engine.keys('a', 'e');
    const index = engine.session.index();
    const [made] = selected(engine);
    expect(made === undefined ? undefined : index.blocks.get(made)?.block.kind).toBe('endless');
    expect(engine.session.state.editing).toBeNull();
    expect(index.diagrams.get('d1')?.body.blocks.map((b) => b.id)).toEqual([
      'p1',
      made,
      't1',
      'e1',
    ]);
    engine.select(selectBlock(engine.session.index(), 'p1'));
    engine.keys('A', 'e');
    expect(engine.session.index().diagrams.get('d1')?.body.blocks[0]?.kind).toBe('endless');
  });

  it('T-1548 · R-BLK-12 (UX XB1, M84 D3): a x inserts an exit block with empty text and opens its text', () => {
    const engine = engineOn('p1');
    engine.keys('a', 'x');
    const [made] = selected(engine);
    const block = made === undefined ? undefined : engine.session.index().blocks.get(made)?.block;
    expect(block).toMatchObject({ kind: 'exit', text: '' });
    expect(engine.session.state.editing?.field).toEqual({ kind: 'block', block: made });
  });

  it('T-1549 · R-BLK-13 (UX PB1, M84 D4): a t inserts a parallel block with two empty branches and opens its text', () => {
    const engine = engineOn('p1');
    engine.keys('a', 't');
    const [made] = selected(engine);
    const block = made === undefined ? undefined : engine.session.index().blocks.get(made)?.block;
    expect(block?.kind === 'parallel' ? block.branches.length : 0).toBe(2);
    expect(engine.session.state.editing?.field).toEqual({ kind: 'block', block: made });
  });

  it('T-1550 · R-EDIT-06 (UX EL1 · PB1 · XB1): s e and s t wrap the selection; an exit block wraps nothing', () => {
    const engine = engineOn('p1');
    engine.keys('s', 'e');
    const index = engine.session.index();
    const outer = index.blocks.get(index.seqs.get('d1')?.seq.blocks[0]?.id ?? '')?.block;
    expect(outer?.kind).toBe('endless');
    expect(outer?.kind === 'endless' ? outer.body.blocks.map((b) => b.id) : []).toEqual(['p1']);

    const other = engineOn('p1');
    other.keys('s', 't');
    const top = other.session.index().diagrams.get('d1')?.body.blocks[0];
    expect(top?.kind === 'parallel' ? top.branches[0]?.body.blocks.map((b) => b.id) : []).toEqual([
      'p1',
    ]);
    expect(other.registry.has('block.wrap.exit')).toBe(false);
    expect(blockIconCommand('exit', { shiftKey: false, ctrlKey: true, metaKey: false })).toBe(
      'block.insert.exit',
    );
  });
});

describe('the branches of a parallel block (M84 B1)', () => {
  it('T-1551 · R-BLK-13 (M84 B1): Up from a branch’s first block selects the branch, Up again the block; Left, Right and Down as on a Case label', () => {
    const engine = engineOn('p3');
    engine.keys('k');
    expect(engine.session.state.selection).toEqual({ kind: 'branchLabel', branch: 'r2' });
    engine.keys('l');
    expect(engine.session.state.selection).toEqual({ kind: 'branchLabel', branch: 'r3' });
    engine.keys('h', 'h');
    expect(engine.session.state.selection).toEqual({ kind: 'branchLabel', branch: 'r1' });
    engine.keys('j');
    expect(selected(engine)).toEqual(['p2']);
    engine.keys('k', 'k');
    expect(selected(engine)).toEqual(['t1']);
  });

  it('T-1552 · R-BLK-13 (M84 B1): with a branch selected, a p inserts a branch right and A p left; the new branch is selected, not edited', () => {
    const engine = engineOn('p3');
    engine.keys('k', 'a', 'p');
    const right = branchesOfT1(engine);
    expect(right).toHaveLength(4);
    expect(right.slice(0, 2)).toEqual(['r1', 'r2']);
    expect(engine.session.state.selection).toEqual({ kind: 'branchLabel', branch: right[2] });
    expect(engine.session.state.editing).toBeNull();
    engine.select({ kind: 'branchLabel', branch: 'r1' });
    engine.keys('A', 'p');
    expect(branchesOfT1(engine)[1]).toBe('r1');
  });

  it('T-1553 · R-BLK-13 (M84 B1): x deletes the branch with its blocks, but not below two branches', () => {
    const engine = engineOn('p3');
    engine.keys('k', 'x');
    expect(branchesOfT1(engine)).toEqual(['r1', 'r3']);
    expect(engine.session.index().blocks.has('p3')).toBe(false);
    expect(engine.session.state.selection).toEqual({ kind: 'branchLabel', branch: 'r3' });
    engine.keys('x');
    expect(branchesOfT1(engine)).toEqual(['r1', 'r3']);
    expect(notice(engine)).toBe('reason.lastParallelBranches');
  });

  it('T-1554 · R-BLK-13 (M84 B1): Alt+Right and Alt+Left move the selected branch', () => {
    const engine = engineOn('p2');
    engine.keys('k', 'Alt+l');
    expect(branchesOfT1(engine)).toEqual(['r2', 'r1', 'r3']);
    expect(engine.session.state.selection).toEqual({ kind: 'branchLabel', branch: 'r1' });
    engine.keys('Alt+h');
    expect(branchesOfT1(engine)).toEqual(['r1', 'r2', 'r3']);
  });

  it('T-1555 · R-BLK-13 (M84 B1): a branch has no label to edit; the block’s text is edited on the block', () => {
    const engine = engineOn('p2');
    engine.keys('k', 'Enter');
    expect(engine.session.state.editing).toBeNull();
    expect(notice(engine)).toBe('reason.parallelBranchHasNoLabel');
    expect(engine.session.chrome().selection).toEqual({
      key: 'selection.parallelBranch',
      params: { number: 1 },
    });
    engine.keys('k', 'Enter');
    expect(engine.session.state.editing?.field).toEqual({ kind: 'block', block: 't1' });
  });

  it('T-1556 · R-BLK-15 (UX EL1): an endless loop has no text to edit', () => {
    const engine = engineOn('e1');
    engine.keys('Enter');
    expect(engine.session.state.editing).toBeNull();
    expect(notice(engine)).toBe('reason.endlessHasNoText');
  });
});

describe('the drawn new blocks', () => {
  const content = sample();
  const index = indexDoc(content);
  const drawn = layout(docOf(content));

  it('T-1557 · R-BLK-13 (M84 B1): a selected parallel branch is outlined as its whole cell', () => {
    expect(selectionBox(drawn, index, { kind: 'branchLabel', branch: 'r2' })).toEqual(
      drawn.boxes.get('r2'),
    );
  });

  it('T-1558 · R-BLK-13 (M84 B1): the top band above a branch picks the branch; the bottom band, the cut ends and the endless loop’s strips pick the block', () => {
    const block = drawn.boxes.get('t1');
    const column = drawn.boxes.get('r2');
    const loop = drawn.boxes.get('e1');
    if (block === undefined || column === undefined || loop === undefined) {
      throw new Error('no boxes');
    }
    const above = hitTest(drawn, index, { x: column.x + column.width / 2, y: block.y + 4 });
    expect(above).toMatchObject({ kind: 'branchLabel', block: 't1', branch: 'r2' });
    const end = hitTest(drawn, index, { x: block.x + 2, y: block.y + 4 });
    expect(end).toMatchObject({ kind: 'block', block: 't1' });
    const bottom = hitTest(drawn, index, { x: column.x + 4, y: block.y + block.height - 4 });
    expect(bottom).toMatchObject({ kind: 'block', block: 't1' });
    const strip = hitTest(drawn, index, { x: loop.x + 4, y: loop.y + loop.height / 2 });
    expect(strip).toMatchObject({ kind: 'block', block: 'e1' });
  });

  it('T-1559 · R-EDIT-10: copied as text, an endless loop and a parallel block keep their nesting', () => {
    const blocks = sample().diagrams[0]?.body.blocks.slice(1) ?? [];
    const text = clipToText(seq(blocks), {
      locale: 'en',
      resultSymbol: '←',
      diagrams: new Map(),
    });
    expect(text.split('\n')).toEqual([
      '    ∥',
      '        p2',
      '    ∥',
      '        p3',
      '        p4',
      '    ∥',
      '        p5',
      '(endless loop)',
      '    break',
    ]);
  });
});
