// A drop on a branch label is a drop on that branch (interaction rules 7, UX BL5).
import type { Box, LayoutResult } from '@ariadne-nsd/core';
import { layout } from '@ariadne-nsd/core';
import { describe, expect, it } from 'vitest';

import { runDrop } from '../commands/drop-command';
import type { TestEngine } from '../engine-test-support';
import {
  arm,
  branch,
  caseBlock,
  contentOf,
  ifBlock,
  proc,
  testEngine,
} from '../engine-test-support';
import { bodyOf, id, outlineOf, rulesEngine } from '../rules/rules-fixture';
import type { DragSource, Drop } from './drop';
import { findDrop, union } from './drop';

const newBlock = (blockKind: 'process' | 'exit' | 'while'): DragSource => ({
  kind: 'new',
  blockKind,
});

const blocksOf = (block: string): DragSource => ({
  kind: 'blocks',
  target: { kind: 'blocks', first: block, last: block },
  blocks: [block],
});

const drawnOf = (engine: TestEngine): LayoutResult => layout(engine.session.state.doc);

/** The box of a region of the drawing that must be there. */
function regionBox(
  drawn: LayoutResult,
  isIt: (region: LayoutResult['regions'][number]) => boolean,
): Box {
  const found = drawn.regions.find(isIt);
  if (found === undefined) {
    throw new Error('no such region');
  }
  return found.box;
}

const labelBox = (drawn: LayoutResult, branchId: string): Box =>
  regionBox(drawn, (r) => r.kind === 'branchLabel' && r.branchId === branchId);

/** What a drop would do at a point of a branch's label: its middle, or `dy` below its top. */
function onLabel(
  engine: TestEngine,
  branchId: string,
  source: DragSource,
  dy?: number,
): Drop | null {
  const drawn = drawnOf(engine);
  const box = labelBox(drawn, branchId);
  const point = { x: box.x + box.width / 2, y: box.y + (dy ?? box.height / 2) };
  return findDrop(drawn, engine.session.index(), point, source, null);
}

function dropOnLabel(engine: TestEngine, branchId: string, source: DragSource): void {
  const drop = onLabel(engine, branchId, source);
  if (drop === null) {
    throw new Error('nothing to drop');
  }
  runDrop(engine.session, drop.action);
}

const caseOf = (engine: TestEngine) => {
  const made = engine.content().diagrams[0]?.body.blocks[0];
  if (made?.kind !== 'case') {
    throw new Error('not a Case');
  }
  return made;
};

const undoSteps = (engine: TestEngine): number => engine.session.state.undo.length;

const notice = (engine: TestEngine): unknown => engine.session.chrome().notice?.message;

describe('a drop on a branch label (UX BL5)', () => {
  it('T-1855 · R-EDIT-09: a control block icon wraps the blocks of that branch only', () => {
    const engine = rulesEngine();
    const drawn = drawnOf(engine);
    const drop = onLabel(engine, id('k2r'), newBlock('while'));
    expect(drop?.action).toEqual({
      kind: 'wrap',
      target: { kind: 'blocks', first: id('k3'), last: id('k4') },
      blockKind: 'while',
    });
    expect(drop?.wraps).toBe('while');
    // The outline is drawn around the branch: its label and its blocks.
    const column = drawn.boxes.get(id('k2r'));
    const label = labelBox(drawn, id('k2r'));
    expect(column).toBeDefined();
    expect(drop?.mark).toEqual({ kind: 'outline', box: union([label, column ?? label]) });
    const steps = undoSteps(engine);
    dropOnLabel(engine, id('k2r'), newBlock('while'));
    expect(outlineOf(engine, 'k')).toBe('case(k)[1: k1 k2 | 2: while()[k3 k4]]');
    expect(undoSteps(engine)).toBe(steps + 1);
  });

  it('T-1856: a process or exit icon goes into a new branch beside it, in one undo step', () => {
    for (const [kind, held] of [
      ['process', '∅'],
      ['exit', 'exit()'],
    ] as const) {
      const engine = rulesEngine();
      const steps = undoSteps(engine);
      dropOnLabel(engine, id('k1r'), newBlock(kind));
      const [first, added, last] = outlineOf(engine, 'k').split(' | ');
      expect(first).toBe('case(k)[1: k1 k2');
      expect(added?.endsWith(`: ${held}`), added).toBe(true);
      expect(last).toBe('2: k3 k4]');
      expect(undoSteps(engine)).toBe(steps + 1);
      // The new block is selected.
      expect(engine.session.state.selection?.kind).toBe('blocks');
    }
  });

  it('T-1857 · R-EDIT-09: dragged blocks move into a new branch beside it', () => {
    const engine = rulesEngine();
    const steps = undoSteps(engine);
    dropOnLabel(engine, id('k1r'), blocksOf(id('a')));
    const [, added] = outlineOf(engine, 'k').split(' | ');
    expect(added?.endsWith(': a'), added).toBe(true);
    expect(bodyOf(engine)).toMatch(/^while/);
    expect(engine.session.state.selection).toMatchObject({ kind: 'blocks', anchor: id('a') });
    expect(undoSteps(engine)).toBe(steps + 1);
  });

  it('T-1858: an If becomes a Case with the new branch, and the status bar says so', () => {
    const engine = testEngine(
      contentOf([ifBlock('i1', branch('r1', [proc('y')]), branch('r2', [proc('n')])), proc('z')]),
    );
    dropOnLabel(engine, 'r1', blocksOf('z'));
    expect(caseOf(engine).arms.map((a) => a.body.blocks[0]?.id)).toEqual(['y', 'z']);
    expect(notice(engine)).toBe('notice.convertedIfToCase');
    expect(engine.session.state.undo).toHaveLength(1);
  });

  it('T-1859: beside the default the new branch goes on its left, and it says so', () => {
    const engine = testEngine(
      contentOf([caseBlock('c1', [arm('a1', '1', [proc('p1')])], branch('o1', [proc('p2')]))]),
    );
    dropOnLabel(engine, 'o1', newBlock('process'));
    expect(caseOf(engine).arms).toHaveLength(2);
    expect(caseOf(engine).otherwise?.id).toBe('o1');
    expect(notice(engine)).toBe('notice.defaultStaysLast');
  });

  it('T-1860: a parallel block gets a new branch; its top band still means before it', () => {
    const engine = rulesEngine();
    dropOnLabel(engine, id('p1r'), newBlock('process'));
    expect(outlineOf(engine, 'p')).toBe('parallel(p)[pa | ∅ | pb]');

    expect(onLabel(rulesEngine(), id('p1r'), newBlock('process'), 2)?.action).toMatchObject({
      kind: 'insert',
      to: id('p'),
      side: 'before',
    });
  });

  it('T-1861: the head of an If still wraps all of it; it cannot go beside its own branch', () => {
    const engine = rulesEngine();
    const drawn = drawnOf(engine);
    const head = regionBox(drawn, (r) => r.kind === 'head' && r.blockId === id('c'));
    const whole = findDrop(
      drawn,
      engine.session.index(),
      { x: head.x + head.width / 2, y: head.y + 12 },
      newBlock('while'),
      null,
    );
    expect(whole?.action).toMatchObject({
      kind: 'wrap',
      target: { kind: 'blocks', first: id('c'), last: id('c') },
    });
    expect(onLabel(engine, id('ry'), blocksOf(id('c')))).toBeNull();
  });
});
