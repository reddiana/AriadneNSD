// Layout of the endless loop, exit and parallel blocks (R-BLK-15, R-BLK-12, R-BLK-13).
import { describe, expect, it } from 'vitest';

import { geometry } from './geometry';
import { defaultFoldName, layout } from './layout';
import type { Box, HitRegion, LayoutNode, LayoutResult } from './types';
import { branch, docOf, endlessBlock, exitBlock, parallelBlock, process } from '../render/testing';

const strip = geometry['size.loop-strip'];
const band = geometry['size.parallel-band'];

function boxOf(result: LayoutResult, id: string): Box {
  const box = result.boxes.get(id);
  if (box === undefined) {
    throw new Error(`no box for ${id}`);
  }
  return box;
}

function nodeOf<K extends LayoutNode['kind']>(
  result: LayoutResult,
  kind: K,
  id: string,
): Extract<LayoutNode, { kind: K }> {
  const node = result.nodes.find(
    (item): item is Extract<LayoutNode, { kind: K }> =>
      item.kind === kind && 'id' in item && item.id === id,
  );
  if (node === undefined) {
    throw new Error(`no ${kind} node ${id}`);
  }
  return node;
}

function regionsOf(result: LayoutResult, blockId: string): ReadonlyArray<HitRegion> {
  return result.regions.filter((region) => 'blockId' in region && region.blockId === blockId);
}

describe('endless loop', () => {
  it('T-1538 · R-BLK-15 (UX EL1): empty strips as thick as the loop strip on top, left and bottom; the body reaches the right edge', () => {
    const result = layout(docOf(endlessBlock('b1', [process('b2', 'next()')])));
    const box = boxOf(result, 'b1');
    const body = boxOf(result, 'b2');
    expect(nodeOf(result, 'endless', 'b1').box).toEqual(box);
    expect(body).toEqual({
      x: box.x + strip,
      y: box.y + strip,
      width: box.width - strip,
      height: box.height - 2 * strip,
    });
    const heads = regionsOf(result, 'b1');
    expect(heads.map((region) => region.kind)).toEqual(['head', 'head', 'head']);
    expect(heads.map((region) => region.box)).toEqual([
      { ...box, height: strip },
      { ...box, width: strip },
      { ...box, y: box.y + box.height - strip, height: strip },
    ]);
  });

  it('T-1539 · R-BLK-15 (UX EL1): a fold region starting with an endless loop is named by the block kind', () => {
    const words = { locale: 'ko', resultSymbol: '←', diagrams: new Map() } as const;
    expect(defaultFoldName(words, [endlessBlock('b1', [process('b2')])])).toBe('(무한 반복)');
    expect(
      defaultFoldName({ ...words, locale: 'en' }, [
        endlessBlock('b1', [process('b2')]),
        process('b3'),
      ]),
    ).toBe('(endless loop) and 1 more');
  });
});

describe('exit block', () => {
  it('T-1540 · R-BLK-12 (UX XB1): an exit block is one row, wider than its text by the wedge, and selected by its whole box', () => {
    const result = layout(docOf(exitBlock('b1', 'x'.repeat(30))));
    const node = nodeOf(result, 'exit', 'b1');
    expect(node.text.lines).toEqual(['x'.repeat(30)]);
    expect(node.box.height).toBe(geometry['space.line'] + 2 * geometry['space.pad-y']);
    expect(node.box.width).toBeGreaterThanOrEqual(
      geometry['size.exit-wedge'] + node.text.width + 2 * geometry['space.pad-x'],
    );
    expect(regionsOf(result, 'b1')).toEqual([{ kind: 'block', blockId: 'b1', box: node.box }]);
  });
});

describe('parallel block', () => {
  const twoBranches = parallelBlock('b1', '', [
    branch('r1', [process('b2', 'a')]),
    branch('r2', [process('b3', 'b'), process('b4', 'c')]),
  ]);

  it('T-1541 · R-BLK-13 (UX PB1): without text both bands are thin; the branches stand side by side between them', () => {
    const result = layout(docOf(twoBranches));
    const node = nodeOf(result, 'parallel', 'b1');
    const box = boxOf(result, 'b1');
    expect(node.top).toEqual({ ...box, height: band });
    expect(node.bottom).toEqual({ ...box, y: box.y + box.height - band, height: band });
    const [left, right] = node.columns;
    expect(left?.branchId).toBe('r1');
    expect(right?.branchId).toBe('r2');
    expect(left?.column.x).toBe(box.x);
    expect(right?.column.x).toBe(box.x + (left?.column.width ?? 0));
    expect(boxOf(result, 'r1')).toEqual(left?.column);
    expect(boxOf(result, 'r2')).toEqual(right?.column);
    // The shorter branch takes the extra height, so both reach the bottom band.
    expect(boxOf(result, 'b2').height).toBe(boxOf(result, 'b3').height * 2);
  });

  it('T-1542 · R-BLK-13 (UX PB1): with text the top band is as high as a condition cell, and the text is drawn in it', () => {
    const result = layout(
      docOf(
        parallelBlock('b1', 'fetch all', [
          branch('r1', [process('b2')]),
          branch('r2', [process('b3')]),
        ]),
      ),
    );
    const node = nodeOf(result, 'parallel', 'b1');
    expect(node.top.height).toBe(geometry['space.line'] + 2 * geometry['space.pad-y']);
    expect(node.bottom.height).toBe(band);
    expect(node.text.lines).toEqual(['fetch all']);
  });

  it('T-1543 · R-BLK-13 (UX PB1): the top band above a branch selects the branch; the bottom band and the cut ends select the block', () => {
    const result = layout(docOf(twoBranches));
    const node = nodeOf(result, 'parallel', 'b1');
    const regions = regionsOf(result, 'b1');
    const labels = regions.filter(
      (region): region is Extract<HitRegion, { kind: 'branchLabel' }> =>
        region.kind === 'branchLabel',
    );
    expect(labels.map((region) => region.branchId)).toEqual(['r1', 'r2']);
    expect(labels[1]?.box).toEqual({
      ...node.top,
      x: node.columns[1]?.column.x,
      width: node.columns[1]?.column.width,
    });
    const heads = regions.filter((region) => region.kind === 'head').map((region) => region.box);
    expect(heads).toEqual([
      node.bottom,
      { ...node.top, width: band },
      { ...node.top, x: node.top.x + node.top.width - band, width: band },
    ]);
    // The cut ends come after the branch parts, so they win where they overlap.
    expect(regions.indexOf(labels[0] as HitRegion)).toBeLessThan(
      regions.findIndex((region) => region.kind === 'head'),
    );
  });

  it('T-1544 · R-BLK-13 (UX PB1, E1): an empty parallel branch is drawn with the empty mark', () => {
    const result = layout(
      docOf(
        parallelBlock('b1', '', [
          branch('r1', [process('b2')]),
          branch('r2', [process('b3', 'x')]),
        ]),
      ),
    );
    expect(nodeOf(result, 'process', 'b2').isEmptyBranch).toBe(true);
    expect(nodeOf(result, 'process', 'b3').isEmptyBranch).toBe(false);
  });

  it('T-1545 · R-BLK-13 (UX PB1): a folded parallel branch is one row in its column', () => {
    const doc = docOf(twoBranches);
    const result = layout({ ...doc, view: { ...doc.view, folded: ['r2'] } });
    const row = nodeOf(result, 'foldedSeq', 'r2');
    expect(row.box).toEqual(nodeOf(result, 'parallel', 'b1').columns[1]?.column);
    expect(boxOf(result, 'b3')).toEqual(row.box);
  });
});
