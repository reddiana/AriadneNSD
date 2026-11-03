// What a click hits among folded things, fold regions and opened call blocks, and how the
// overlay outlines them (03-editor 3.1, interaction rules 4).
import type { Box, Content, Doc, View } from '@ariadne-nsd/core';
import { layout, renderDoc } from '@ariadne-nsd/core';
import { describe, expect, it } from 'vitest';

import { overlayContent, selectionBox } from '../dom/overlay';
import { branch, contentOf, ifBlock, proc } from '../engine-test-support';
import { indexDoc } from '../model/doc-index';
import { shownIndexOf } from '../model/shown-index';
import { selectFold } from '../state/selection';
import { hitTest, selectionOfHit } from './hit-test';

const middle = (box: Box): { x: number; y: number } => ({
  x: box.x + box.width / 2,
  y: box.y + box.height / 2,
});

const base = (): Content => {
  const content = contentOf(
    [
      proc('p1'),
      proc('p2'),
      ifBlock('i1', branch('r1', [proc('p3'), proc('p4')]), branch('r2', [proc('p5')])),
      {
        id: 'c1',
        kind: 'call',
        target: { kind: 'local', diagram: 'd2' },
        args: '',
        result: '',
        siteFolds: [],
      },
    ],
    [proc('p6')],
  );
  const [d1, d2] = content.diagrams;
  if (d1 === undefined || d2 === undefined) {
    throw new Error('no diagrams');
  }
  return {
    ...content,
    diagrams: [
      { ...d1, body: { ...d1.body, folds: [{ id: 'f1', first: 'p1', last: 'p2', name: 'two' }] } },
      { ...d2, head: { kind: 'method', text: 'm' } },
    ],
  };
};

const docWith = (view: Partial<View>): Doc => ({
  content: base(),
  view: { folded: [], opened: [], bands: true, resultSymbol: '←', ...view },
});

describe('hitting folded things and opened calls (03-editor 3.1)', () => {
  it('hit: the fold triangle beats the band; the band selects the region, a row the branch', () => {
    const doc = docWith({ folded: ['r1'] });
    const result = layout(doc);
    const shown = shownIndexOf(doc);
    const real = indexDoc(doc.content);
    const toggle = result.regions.find((region) => region.kind === 'toggle');
    expect(toggle).toBeDefined();
    const onToggle = hitTest(
      result,
      shown.index,
      middle(toggle?.box ?? { x: 0, y: 0, width: 0, height: 0 }),
    );
    expect(onToggle).toMatchObject({ kind: 'toggle', what: 'fold', target: 'f1', isOpen: true });
    expect(onToggle === null ? null : selectionOfHit(shown, real, onToggle)).toEqual(
      selectFold('f1', []),
    );
    const band = result.regions.find((region) => region.kind === 'fold');
    const onBand = hitTest(result, shown.index, {
      x: (band?.box.x ?? 0) + 60,
      y: (band?.box.y ?? 0) + 4,
    });
    expect(onBand === null ? null : selectionOfHit(shown, real, onBand)).toEqual(
      selectFold('f1', []),
    );
    const row = result.regions.find((region) => region.kind === 'foldedSeq');
    const onRow = hitTest(
      result,
      shown.index,
      middle(row?.box ?? { x: 0, y: 0, width: 0, height: 0 }),
    );
    expect(onRow === null ? null : selectionOfHit(shown, real, onRow)).toMatchObject({
      kind: 'blocks',
      anchor: 'p3',
      focus: 'p4',
    });
  });

  it('hit: a block shown in an opened call is selected as shown; the band selects the call', () => {
    const doc = docWith({ opened: [['c1']] });
    const result = layout(doc);
    const shown = shownIndexOf(doc);
    const real = indexDoc(doc.content);
    const inner = result.boxes.get('c1/p6');
    const hit = hitTest(result, shown.index, middle(inner ?? { x: 0, y: 0, width: 0, height: 0 }));
    const selection = hit === null ? null : selectionOfHit(shown, real, hit);
    expect(selection).toEqual({ kind: 'peek', path: ['c1'], anchor: 'p6', focus: 'p6' });
    expect(selectionBox(result, real, selection)).toEqual(inner);
    const band = result.regions.find((region) => region.kind === 'peekBand');
    const onBand = hitTest(result, shown.index, {
      x: (band?.box.x ?? 0) + 60,
      y: (band?.box.y ?? 0) + 4,
    });
    expect(onBand === null ? null : selectionOfHit(shown, real, onBand)).toMatchObject({
      kind: 'blocks',
      focus: 'c1',
    });
  });

  it('overlay: fold triangles are drawn on the editing layer only, not in the saved drawing', () => {
    const doc = docWith({ folded: ['f1'], opened: [['c1']] });
    const rendering = renderDoc(doc);
    const real = indexDoc(doc.content);
    const overlay = overlayContent({
      layout: rendering.layout,
      index: real,
      selection: selectFold('f1', []),
      hover: null,
      drop: null,
      dragged: [],
      paper: '#ffffff',
    });
    expect(overlay.match(/<polygon/g)).toHaveLength(2);
    expect(rendering.svg.content).not.toContain('<polygon');
    expect(selectionBox(rendering.layout, real, selectFold('f1', []))).toEqual(
      rendering.layout.boxes.get('f1'),
    );
  });
});
