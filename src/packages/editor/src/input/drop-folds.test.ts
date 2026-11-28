// Dropping next to a fold region (interaction rules 7, M86): an open region with its name band and
// a folded cell count as one block. The name band and the bottom band inside the region's box,
// and the halves of a folded cell, put the blocks outside the region; the line is drawn just
// outside its border, or inside it at the region's inside end.
import type { Block, Box, Content, Doc, FoldMark, View } from '@ariadne-nsd/core';
import { geometry, layout } from '@ariadne-nsd/core';
import { describe, expect, it } from 'vitest';

import { runDrop } from '../commands/drop-command';
import { contentOf, proc, testEngine, whileBlock } from '../engine-test-support';
import { indexDoc } from '../model/doc-index';
import type { DragSource } from './drop';
import { betweenBand, findDrop, foldInsideEndGap, foldOutsideGap } from './drop';

const band = geometry['size.band'];
const edge = geometry['size.fold-edge'];

const newProcess: DragSource = { kind: 'new', blockKind: 'process' };
const newIf: DragSource = { kind: 'new', blockKind: 'if' };
const dragging = (...blocks: ReadonlyArray<string>): DragSource => ({
  kind: 'blocks',
  target: { kind: 'blocks', first: blocks[0] ?? '', last: blocks.at(-1) ?? '' },
  blocks,
});

/** Diagram `d1` with an Event header, so the body's ends are not the fold's. */
const headed = (blocks: ReadonlyArray<Block>, folds: ReadonlyArray<FoldMark>): Content => {
  const content = contentOf(blocks);
  const [d1] = content.diagrams;
  if (d1 === undefined) {
    throw new Error('no d1');
  }
  return {
    ...content,
    diagrams: [{ ...d1, head: { kind: 'event', text: 'start' }, body: { blocks, folds } }],
  };
};
const docWith = (content: Content, view: Partial<View> = {}): Doc => ({
  content,
  view: { folded: [], opened: [], bands: true, resultSymbol: '←', ...view },
});

/** `pa`, then the fold region `f` over `p0..p2`, then `pz`. */
const plain = headed(
  [proc('pa'), proc('p0'), proc('p1'), proc('p2'), proc('pz')],
  [{ id: 'f', first: 'p0', last: 'p2' }],
);

function placesOf(doc: Doc) {
  const result = layout(doc);
  const index = indexDoc(doc.content);
  const boxOf = (id: string): Box => {
    const box = result.boxes.get(id);
    if (box === undefined) {
      throw new Error(`no box ${id}`);
    }
    return box;
  };
  const drop = (point: { x: number; y: number }, source: DragSource) =>
    findDrop(result, index, point, source, null);
  return { result, boxOf, drop };
}

const bottomOf = (box: Box): number => box.y + box.height;
const middleX = (box: Box): number => box.x + box.width / 2;

/** The order of `d1`'s blocks and its fold regions after running a drop. */
function afterDrop(content: Content, action: Parameters<typeof runDrop>[1]) {
  const engine = testEngine(content);
  expect(runDrop(engine.session, action)).toBe(true);
  const d1 = engine.content().diagrams[0];
  const ids = d1?.body.blocks.map((b) => b.id) ?? [];
  const folds = (d1?.body.folds ?? []).map((f) => `${f.id}:${f.first}-${f.last}`);
  return { ids, folds };
}

describe('dropping next to a fold region (interaction rules 7, M86)', () => {
  it('T-1585: on the name band of an open region the drop goes before it, outside it; the triangle takes nothing', () => {
    const { boxOf, drop } = placesOf(docWith(plain));
    const f = boxOf('f');
    const line = { kind: 'line', x: f.x, y: f.y - foldOutsideGap, width: f.width };
    for (const blockKind of ['process', 'if'] as const) {
      for (const y of [f.y + 1, f.y + band / 2, f.y + band - 1]) {
        const got = drop({ x: middleX(f), y }, { kind: 'new', blockKind });
        expect(got?.action).toEqual({
          kind: 'insert',
          to: 'p0',
          side: 'before',
          blockKind,
          outsideFold: 'f',
        });
        expect(got?.mark).toEqual(line);
        expect(got?.wraps).toBeNull();
      }
    }
    // The fold triangle at the band's left.
    expect(drop({ x: f.x + 4, y: f.y + band / 2 }, newProcess)).toBeNull();
    const made = drop({ x: middleX(f), y: f.y + 4 }, newProcess);
    if (made === null) {
      throw new Error('no drop');
    }
    const { ids, folds } = afterDrop(plain, made.action);
    expect(ids.slice(0, 3)).toEqual(['pa', ids[1], 'p0']);
    expect(folds).toEqual(['f:p0-p2']);
  });

  it('T-1586: in the bottom band inside an open region the drop goes after it, outside it, over the last block', () => {
    const { boxOf, drop } = placesOf(docWith(plain));
    const f = boxOf('f');
    const p2 = boxOf('p2');
    expect(bottomOf(p2)).toBe(bottomOf(f));
    const line = { kind: 'line', x: f.x, y: bottomOf(f) + foldOutsideGap, width: f.width };
    for (const x of [f.x, middleX(f), f.x + f.width]) {
      for (const y of [bottomOf(f) - betweenBand + 1, bottomOf(f) - 1, bottomOf(f)]) {
        const got = drop({ x, y }, newIf);
        expect(got?.action).toEqual({
          kind: 'insert',
          to: 'p2',
          side: 'after',
          blockKind: 'if',
          outsideFold: 'f',
        });
        expect(got?.mark).toEqual(line);
      }
    }
    // Above the band and the inside end's band the last block answers as before.
    expect(drop({ x: middleX(f), y: bottomOf(f) - 2 * betweenBand - 1 }, newIf)?.action.kind).toBe(
      'wrap',
    );
    const made = drop({ x: middleX(f), y: bottomOf(f) - 2 }, newProcess);
    if (made === null) {
      throw new Error('no drop');
    }
    const { ids, folds } = afterDrop(plain, made.action);
    expect(ids.slice(1, 4)).toEqual(['p0', 'p1', 'p2']);
    expect(ids[5]).toBe('pz');
    expect(folds).toEqual(['f:p0-p2']);
  });

  it('T-1587: where the bottom bands of nested regions overlap the innermost wins; the outer one still takes the blocks in', () => {
    const nested = headed(
      [proc('pa'), proc('p0'), proc('p1'), proc('p2'), proc('pz')],
      [
        { id: 'f1', first: 'p0', last: 'p2' },
        { id: 'f2', first: 'p1', last: 'p2' },
      ],
    );
    const { boxOf, drop } = placesOf(docWith(nested));
    const f1 = boxOf('f1');
    const f2 = boxOf('f2');
    expect(bottomOf(f2)).toBe(bottomOf(f1) - geometry['size.nest-inset']);
    const outer = drop({ x: middleX(f1), y: bottomOf(f1) - 1 }, newProcess);
    expect(outer?.action).toMatchObject({ to: 'p2', side: 'after', outsideFold: 'f1' });
    expect(outer?.mark).toEqual({
      kind: 'line',
      x: f1.x,
      y: bottomOf(f1) + foldOutsideGap,
      width: f1.width,
    });
    // Beside the inner frame (in the outer one's inset) only the outer band holds the point.
    expect(drop({ x: f1.x + 1, y: bottomOf(f2) - 1 }, newProcess)?.action).toMatchObject({
      outsideFold: 'f1',
    });
    const inner = drop({ x: middleX(f2), y: bottomOf(f2) - 1 }, newProcess);
    expect(inner?.action).toMatchObject({ to: 'p2', side: 'after', outsideFold: 'f2' });
    expect(inner?.mark).toEqual({
      kind: 'line',
      x: f2.x,
      y: bottomOf(f2) + foldOutsideGap,
      width: f2.width,
    });
    if (inner === null) {
      throw new Error('no drop');
    }
    const { ids, folds } = afterDrop(nested, inner.action);
    const added = ids[4];
    expect(ids.slice(0, 4)).toEqual(['pa', 'p0', 'p1', 'p2']);
    expect(folds).toEqual([`f1:p0-${String(added)}`, 'f2:p1-p2']);
    // On the inner region's name band: before it, still inside the outer one.
    const onBand = drop({ x: middleX(f2), y: f2.y + band / 2 }, newProcess);
    expect(onBand?.action).toMatchObject({ to: 'p1', side: 'before', outsideFold: 'f2' });
    if (onBand !== null) {
      const before = afterDrop(nested, onBand.action);
      expect(before.folds).toEqual(['f1:p0-p2', 'f2:p1-p2']);
      expect(before.ids.slice(0, 2)).toEqual(['pa', 'p0']);
      expect(before.ids[3]).toBe('p1');
    }
  });

  it('T-1588: a folded cell takes the drop before it in its upper half and after it in its lower half, outside it', () => {
    const { boxOf, drop } = placesOf(docWith(plain, { folded: ['f'] }));
    const cell = boxOf('f');
    const x = middleX(cell);
    const upper = drop({ x, y: cell.y + 2 }, newIf);
    expect(upper?.action).toEqual({
      kind: 'insert',
      to: 'p0',
      side: 'before',
      blockKind: 'if',
      outsideFold: 'f',
    });
    expect(upper?.mark).toEqual({
      kind: 'line',
      x: cell.x,
      y: cell.y - foldOutsideGap,
      width: cell.width,
    });
    const lower = drop({ x, y: bottomOf(cell) - 2 }, dragging('pa'));
    expect(lower?.action).toEqual({
      kind: 'move',
      target: { kind: 'blocks', first: 'pa', last: 'pa' },
      to: 'p2',
      side: 'after',
      outsideFold: 'f',
    });
    expect(lower?.mark).toEqual({
      kind: 'line',
      x: cell.x,
      y: bottomOf(cell) + foldOutsideGap,
      width: cell.width,
    });
    // The fold triangle on the cell.
    expect(drop({ x: cell.x + 4, y: cell.y + 4 }, newProcess)).toBeNull();
    if (lower !== null) {
      const { ids, folds } = afterDrop(plain, lower.action);
      expect(ids).toEqual(['p0', 'p1', 'p2', 'pa', 'pz']);
      expect(folds).toEqual(['f:p0-p2']);
    }
  });

  it('T-1589: between blocks inside a region and at its inside start the drop stays inside, as before', () => {
    const { boxOf, drop } = placesOf(docWith(plain));
    const p0 = boxOf('p0');
    const p1 = boxOf('p1');
    expect(p0.y).toBe(boxOf('f').y + band);
    const atStart = drop({ x: middleX(p0), y: p0.y + 2 }, newProcess);
    expect(atStart?.action).toEqual({
      kind: 'insert',
      to: 'p0',
      side: 'before',
      blockKind: 'process',
    });
    expect(atStart?.mark).toEqual({ kind: 'line', x: p0.x, y: p0.y, width: p0.width });
    const inside = drop({ x: middleX(p1), y: p1.y + 2 }, newProcess);
    expect(inside?.action).toEqual({
      kind: 'insert',
      to: 'p1',
      side: 'before',
      blockKind: 'process',
    });
    expect(inside?.mark).toEqual({ kind: 'line', x: p1.x, y: p1.y, width: p1.width });
    if (atStart !== null) {
      const { ids, folds } = afterDrop(plain, atStart.action);
      expect(folds).toEqual([`f:${String(ids[1])}-p2`]);
    }
  });

  it('T-1590: after the last block inside an open region the line is drawn inside its border', () => {
    const { boxOf, drop } = placesOf(docWith(plain));
    const f = boxOf('f');
    const p2 = boxOf('p2');
    const line = {
      kind: 'line',
      x: f.x + edge,
      y: bottomOf(f) - foldInsideEndGap,
      width: f.width - 2 * edge,
    };
    const onLast = drop({ x: middleX(p2), y: p2.y + p2.height / 2 }, newProcess);
    expect(onLast?.action).toEqual({
      kind: 'insert',
      to: 'p2',
      side: 'after',
      blockKind: 'process',
    });
    expect(onLast?.mark).toEqual(line);
    const moved = drop({ x: middleX(p2), y: bottomOf(p2) - betweenBand - 1 }, dragging('pa'));
    expect(moved?.action).toMatchObject({ kind: 'move', to: 'p2', side: 'after' });
    expect(moved?.mark).toEqual(line);
    if (onLast !== null) {
      const { ids, folds } = afterDrop(plain, onLast.action);
      expect(folds).toEqual([`f:p0-${String(ids[4])}`]);
    }
    // After a block that is not a region's last one the line stays on the block's bottom.
    const p1 = boxOf('p1');
    expect(drop({ x: middleX(p1), y: p1.y + p1.height / 2 }, newProcess)?.mark).toEqual({
      kind: 'line',
      x: p1.x,
      y: bottomOf(p1),
      width: p1.width,
    });
  });

  it('T-1591: a region whose name band is hidden is not there for a drop', () => {
    const { result, boxOf, drop } = placesOf(docWith(plain, { bands: false }));
    expect(result.regions.some((r) => r.kind === 'fold')).toBe(false);
    const p0 = boxOf('p0');
    const p2 = boxOf('p2');
    expect(drop({ x: middleX(p0), y: p0.y + 2 }, newProcess)?.action).toEqual({
      kind: 'insert',
      to: 'p0',
      side: 'before',
      blockKind: 'process',
    });
    const atEnd = drop({ x: middleX(p2), y: bottomOf(p2) - 2 }, newProcess);
    expect(atEnd?.action).toEqual({
      kind: 'insert',
      to: 'p2',
      side: 'after',
      blockKind: 'process',
    });
    expect(atEnd?.mark).toEqual({ kind: 'line', x: p2.x, y: bottomOf(p2), width: p2.width });
  });

  it('T-1592: dragged blocks at a region edge, or holding the region, are not dropped there', () => {
    const { boxOf, drop } = placesOf(docWith(plain));
    const f = boxOf('f');
    const onBand = { x: middleX(f), y: f.y + band / 2 };
    const atBottom = { x: middleX(f), y: bottomOf(f) - 2 };
    expect(drop(onBand, dragging('p0'))).toBeNull();
    expect(drop(onBand, dragging('pa', 'p0'))).toBeNull();
    expect(drop(atBottom, dragging('p2'))).toBeNull();
    expect(drop(atBottom, dragging('p2', 'pz'))).toBeNull();
    // A block inside the region may leave it over its edge.
    expect(drop(onBand, dragging('p1'))?.action).toMatchObject({
      kind: 'move',
      to: 'p0',
      side: 'before',
      outsideFold: 'f',
    });
    const held = headed([proc('pa'), whileBlock('w1', [proc('p0'), proc('p1')])], []);
    const loop = held.diagrams[0]?.body.blocks[1];
    if (loop?.kind !== 'while') {
      throw new Error('no while');
    }
    const withFold: Content = headed(
      [
        proc('pa'),
        { ...loop, body: { ...loop.body, folds: [{ id: 'g', first: 'p0', last: 'p1' }] } },
      ],
      [],
    );
    const inLoop = placesOf(docWith(withFold));
    const g = inLoop.boxOf('g');
    expect(inLoop.drop({ x: middleX(g), y: g.y + band / 2 }, dragging('w1'))).toBeNull();
    expect(inLoop.drop({ x: middleX(g), y: g.y + band / 2 }, dragging('pa'))?.action).toMatchObject(
      { to: 'p0', side: 'before', outsideFold: 'g' },
    );
  });
  it('T-1593: the band above the bottom band means the inside end: after the last block, inside, never wrapping', () => {
    const { boxOf, drop } = placesOf(docWith(plain));
    const f = boxOf('f');
    const bottom = bottomOf(f);
    const line = {
      kind: 'line',
      x: f.x + edge,
      y: bottom - foldInsideEndGap,
      width: f.width - 2 * edge,
    };
    for (const blockKind of ['process', 'if', 'while', 'case', 'parallel'] as const) {
      for (const y of [bottom - 2 * betweenBand, bottom - betweenBand - 1, bottom - betweenBand]) {
        const got = drop({ x: middleX(f), y }, { kind: 'new', blockKind });
        expect(got?.action).toEqual({ kind: 'insert', to: 'p2', side: 'after', blockKind });
        expect(got?.mark).toEqual(line);
        expect(got?.wraps).toBeNull();
      }
    }
    // Its neighbours: the last block above, the outside below.
    expect(drop({ x: middleX(f), y: bottom - 2 * betweenBand - 1 }, newIf)?.wraps).toBe('if');
    expect(drop({ x: middleX(f), y: bottom - betweenBand + 1 }, newIf)?.action).toMatchObject({
      outsideFold: 'f',
    });
    const moved = drop({ x: middleX(f), y: bottom - 12 }, dragging('pa'));
    expect(moved?.action).toEqual({
      kind: 'move',
      target: { kind: 'blocks', first: 'pa', last: 'pa' },
      to: 'p2',
      side: 'after',
    });
    expect(moved?.mark).toEqual(line);
    const made = drop({ x: middleX(f), y: bottom - 12 }, newIf);
    if (made === null) {
      throw new Error('no drop');
    }
    const { ids, folds } = afterDrop(plain, made.action);
    expect(ids.slice(0, 4)).toEqual(['pa', 'p0', 'p1', 'p2']);
    expect(folds).toEqual([`f:p0-${String(ids[4])}`]);
  });

  it('T-1594: the inside end is measured from the region, over whatever block is hit there', () => {
    const withLoop = headed(
      [proc('pa'), proc('p0'), whileBlock('w1', [proc('i1'), proc('i2')]), proc('pz')],
      [{ id: 'f', first: 'p0', last: 'w1' }],
    );
    const { boxOf, drop } = placesOf(docWith(withLoop));
    const f = boxOf('f');
    const i2 = boxOf('i2');
    expect(bottomOf(i2)).toBe(bottomOf(f));
    const got = drop({ x: middleX(i2), y: bottomOf(f) - 12 }, newProcess);
    expect(got?.action).toEqual({ kind: 'insert', to: 'w1', side: 'after', blockKind: 'process' });
    expect(got?.mark).toEqual({
      kind: 'line',
      x: f.x + edge,
      y: bottomOf(f) - foldInsideEndGap,
      width: f.width - 2 * edge,
    });
  });

  it('T-1595: with nested regions the innermost holding the point has the inside end; it joins that region and those around it', () => {
    const nested = headed(
      [proc('pa'), proc('p0'), proc('p1'), proc('p2'), proc('pz')],
      [
        { id: 'f1', first: 'p0', last: 'p2' },
        { id: 'f2', first: 'p1', last: 'p2' },
      ],
    );
    const { boxOf, drop } = placesOf(docWith(nested));
    const f1 = boxOf('f1');
    const f2 = boxOf('f2');
    // Beside the inner frame: the outer region's inside end, outside the inner region.
    const outer = drop({ x: f1.x + 1, y: bottomOf(f1) - 12 }, newProcess);
    expect(outer?.action).toEqual({
      kind: 'insert',
      to: 'p2',
      side: 'after',
      blockKind: 'process',
      outsideFold: 'f2',
    });
    expect(outer?.mark).toEqual({
      kind: 'line',
      x: f1.x + edge,
      y: bottomOf(f1) - foldInsideEndGap,
      width: f1.width - 2 * edge,
    });
    if (outer !== null) {
      const { ids, folds } = afterDrop(nested, outer.action);
      expect(folds).toEqual([`f1:p0-${String(ids[4])}`, 'f2:p1-p2']);
    }
    // In the inner frame: its inside end, inside both.
    const inner = drop({ x: middleX(f2), y: bottomOf(f2) - 12 }, newProcess);
    expect(inner?.action).toEqual({
      kind: 'insert',
      to: 'p2',
      side: 'after',
      blockKind: 'process',
    });
    expect(inner?.mark).toEqual({
      kind: 'line',
      x: f2.x + edge,
      y: bottomOf(f2) - foldInsideEndGap,
      width: f2.width - 2 * edge,
    });
    if (inner !== null) {
      const { ids, folds } = afterDrop(nested, inner.action);
      expect(folds).toEqual([`f1:p0-${String(ids[4])}`, `f2:p1-${String(ids[4])}`]);
    }
  });

  it('T-1596: dragged blocks at the inside end, or holding it, are not dropped there', () => {
    const { boxOf, drop } = placesOf(docWith(plain));
    const f = boxOf('f');
    const atInsideEnd = { x: middleX(f), y: bottomOf(f) - 12 };
    expect(drop(atInsideEnd, dragging('p2'))).toBeNull();
    expect(drop(atInsideEnd, dragging('p1', 'p2'))).toBeNull();
    expect(drop(atInsideEnd, dragging('p1'))?.action).toMatchObject({
      kind: 'move',
      to: 'p2',
      side: 'after',
    });
  });
});
