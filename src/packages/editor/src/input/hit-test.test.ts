import type { Box } from '@ariadne-nsd/core';
import { layout } from '@ariadne-nsd/core';
import { describe, expect, it } from 'vitest';

import {
  arm,
  branch,
  caseBlock,
  contentOf,
  docOf,
  empty,
  ifBlock,
  proc,
  whileBlock,
} from '../engine-test-support';
import { indexDoc } from '../model/doc-index';
import { selectBlock, selectRange } from '../state/selection';
import { findDrop, zoneOf } from './drop';
import { fieldBox, selectionBox } from '../dom/overlay';
import { hitTest, selectionOfHit } from './hit-test';

const content = contentOf([
  proc('p1', 'first'),
  ifBlock('b1', branch('r1', [proc('p2')]), branch('r2', [empty('e1')])),
  whileBlock('w1', [proc('p3')]),
  caseBlock('k1', [arm('r3', '1', [proc('p4')])], null),
]);
const index = indexDoc(content);
const result = layout(docOf(content), { locale: 'en' });

const boxOf = (id: string): Box => {
  const box = result.boxes.get(id);
  if (box === undefined) {
    throw new Error(`no box ${id}`);
  }
  return box;
};
const middle = (box: Box) => ({ x: box.x + box.width / 2, y: box.y + box.height / 2 });

describe('hit testing (03-editor 3.1)', () => {
  it('R-EDIT-01: a click in a process block hits that block', () => {
    expect(hitTest(result, index, middle(boxOf('p1')))).toMatchObject({
      kind: 'block',
      block: 'p1',
    });
    expect(hitTest(result, index, middle(boxOf('p2')))).toMatchObject({
      kind: 'block',
      block: 'p2',
    });
  });

  it('R-EDIT-12: a branch label row beats the header around it', () => {
    const region = result.regions.find((r) => r.kind === 'branchLabel' && r.branchId === 'r1');
    expect(region).toBeDefined();
    if (region !== undefined) {
      expect(hitTest(result, index, middle(region.box))).toMatchObject({
        kind: 'branchLabel',
        branch: 'r1',
      });
    }
  });

  it('03-editor 3.1: the strip of a loop, which has no click region, hits the loop', () => {
    const box = boxOf('w1');
    const point = { x: box.x + 3, y: box.y + box.height - 3 };
    expect(hitTest(result, index, point)).toMatchObject({ kind: 'block', block: 'w1' });
  });

  it('UX CD1: the empty default cell of a Case is hit', () => {
    const cell = result.regions.find((r) => r.kind === 'missingDefault');
    expect(cell).toBeDefined();
    if (cell !== undefined) {
      expect(hitTest(result, index, middle(cell.box))).toMatchObject({
        kind: 'missingDefault',
        block: 'k1',
      });
    }
  });

  it('03-editor 3.1: outside the diagrams nothing is hit', () => {
    expect(hitTest(result, index, { x: 1, y: 1 })).toBeNull();
  });
});

describe('drop place (03-editor 3.2)', () => {
  it('R-EDIT-09: the 8 px bands are between blocks, the rest is on the block', () => {
    const box = { x: 0, y: 0, width: 100, height: 40 };
    expect(zoneOf(box, { x: 50, y: 7 })).toBe('before');
    expect(zoneOf(box, { x: 50, y: 33 })).toBe('after');
    expect(zoneOf(box, { x: 50, y: 20 })).toBe('on');
    const small = { x: 0, y: 0, width: 100, height: 20 };
    expect(zoneOf(small, { x: 50, y: 9 })).toBe('before');
    expect(zoneOf(small, { x: 50, y: 11 })).toBe('after');
  });

  it('R-EDIT-09: a new control block dropped on a block wraps it; a process goes after', () => {
    const p1 = boxOf('p1');
    const on = { x: middle(p1).x, y: p1.y + p1.height / 2 };
    expect(p1.height).toBeGreaterThanOrEqual(24);
    const asIf = findDrop(result, index, on, { kind: 'new', blockKind: 'if' }, null);
    expect(asIf?.action).toEqual({
      kind: 'wrap',
      target: { kind: 'blocks', first: 'p1', last: 'p1' },
      blockKind: 'if',
    });
    expect(asIf?.wraps).toBe('if');
    const asProcess = findDrop(result, index, on, { kind: 'new', blockKind: 'process' }, null);
    expect(asProcess?.action).toMatchObject({ kind: 'insert', to: 'p1', blockKind: 'process' });
  });

  it('R-EDIT-09: on one of the selected blocks the whole selection is wrapped', () => {
    const selection = selectRange(index, 'p1', 'b1');
    const p1 = boxOf('p1');
    const drop = findDrop(
      result,
      index,
      middle(p1),
      { kind: 'new', blockKind: 'while' },
      selection,
    );
    expect(drop?.action).toEqual({
      kind: 'wrap',
      target: { kind: 'blocks', first: 'p1', last: 'b1' },
      blockKind: 'while',
    });
  });

  it('R-EDIT-09: dragged blocks go between blocks, even into a control block', () => {
    const source = {
      kind: 'blocks' as const,
      target: { kind: 'blocks' as const, first: 'p1', last: 'p1' },
      blocks: ['p1'],
    };
    const p3 = boxOf('p3');
    const drop = findDrop(
      result,
      index,
      { x: middle(p3).x, y: p3.y + 2 },
      source,
      selectBlock(index, 'p1'),
    );
    expect(drop?.action).toEqual({ kind: 'move', target: source.target, to: 'p3', side: 'before' });
    expect(drop?.mark).toMatchObject({ kind: 'line', y: p3.y });
  });

  it('R-EDIT-09: an empty block takes a drop whole; nothing drops into the dragged blocks', () => {
    const drop = findDrop(
      result,
      index,
      middle(boxOf('e1')),
      { kind: 'new', blockKind: 'for' },
      null,
    );
    expect(drop?.action).toEqual({ kind: 'insert', to: 'e1', side: 'after', blockKind: 'for' });
    expect(drop?.mark.kind).toBe('outline');
    const source = {
      kind: 'blocks' as const,
      target: { kind: 'blocks' as const, first: 'b1', last: 'b1' },
      blocks: ['b1'],
    };
    expect(findDrop(result, index, middle(boxOf('p2')), source, null)).toBeNull();
  });

  it('UX CD1: a drop on the empty default cell makes the default branch', () => {
    const cell = result.regions.find((r) => r.kind === 'missingDefault');
    const point = cell === undefined ? { x: -1, y: -1 } : middle(cell.box);
    const drop = findDrop(result, index, point, { kind: 'new', blockKind: 'process' }, null);
    expect(drop?.action).toMatchObject({ kind: 'intoMissingDefault', caseBlock: 'k1' });
  });
});

describe('diagram headers (R-BLK-10, R-BLK-11)', () => {
  const headed: typeof content = {
    ...content,
    diagrams: content.diagrams.map((d) => ({ ...d, head: { kind: 'method', text: 'f(a)' } })),
  };
  const headedIndex = indexDoc(headed);
  const headedLayout = layout(docOf(headed), { locale: 'en' });
  const head = headedLayout.diagrams[0]?.head ?? { x: -1, y: -1, width: 0, height: 0 };

  it('R-BLK-10: a click on the header hits the header and selects it', () => {
    const hit = hitTest(headedLayout, headedIndex, middle(head));
    expect(hit).toMatchObject({ kind: 'diagramHead', diagram: 'd1' });
    expect(hit === null ? null : selectionOfHit(headedIndex, hit)).toEqual({
      kind: 'head',
      diagram: 'd1',
    });
  });

  it('visual design 7.1: the selected header is outlined whole; nothing drops on it', () => {
    expect(selectionBox(headedLayout, headedIndex, { kind: 'head', diagram: 'd1' })).toEqual(head);
    const drop = findDrop(
      headedLayout,
      headedIndex,
      middle(head),
      { kind: 'new', blockKind: 'process' },
      null,
    );
    expect(drop).toBeNull();
  });

  it('03-editor 3.4: the header name field lies inside the header', () => {
    const box = fieldBox(headedLayout, { kind: 'head', diagram: 'd1' });
    expect(box).not.toBeNull();
    expect(box?.y).toBeGreaterThan(head.y);
    expect((box?.y ?? 0) + (box?.height ?? 0)).toBeLessThanOrEqual(head.y + head.height + 7);
  });
});
