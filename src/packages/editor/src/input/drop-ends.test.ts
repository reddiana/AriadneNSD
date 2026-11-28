// Dropping at the very start and end of a diagram body (interaction rules 7, M75 P2): the bottom
// band of the header and the band right under the diagram, whatever kind the first or last
// block is.
import type { Block, Box, Content, Diagram, Doc, View } from '@ariadne-nsd/core';
import { geometry, layout } from '@ariadne-nsd/core';
import { describe, expect, it } from 'vitest';

import { runDrop } from '../commands/drop-command';
import {
  arm,
  branch,
  caseBlock,
  contentOf,
  empty,
  ifBlock,
  proc,
  seq,
  testEngine,
  whileBlock,
} from '../engine-test-support';
import { indexDoc } from '../model/doc-index';
import type { DragSource } from './drop';
import { betweenBand, bodyEndBand, findDrop, foldOutsideGap } from './drop';

const loop = (id: string, kind: 'doWhile' | 'for', blocks: ReadonlyArray<Block>): Block => ({
  id,
  kind,
  text: kind,
  body: seq(blocks),
});
const call = (id: string, diagram: string): Block => ({
  id,
  kind: 'call',
  target: { kind: 'local', diagram },
  args: '',
  result: '',
  siteFolds: [],
});

/** Every block kind, each holding something, so its inside could catch a drop. */
const kinds: ReadonlyArray<readonly [string, Block]> = [
  ['process', proc('x')],
  ['if', ifBlock('x', branch('r1', [proc('i1')]), branch('r2', [proc('i2')]))],
  ['case', caseBlock('x', [arm('r1', '1', [proc('i1')])], branch('r2', [proc('i2')]))],
  ['while', whileBlock('x', [proc('i1')])],
  ['for', loop('x', 'for', [proc('i1')])],
  ['doWhile', loop('x', 'doWhile', [proc('i1')])],
  ['call', call('x', 'd2')],
];

/** Diagrams with headers: `d1` with this body, and the Method `d2` that calls may call. */
const headed = (body: ReadonlyArray<Block>, folds: Diagram['body']['folds'] = []): Content => {
  const content = contentOf(body, [proc('m1')]);
  const [d1, d2] = content.diagrams;
  if (d1 === undefined || d2 === undefined) {
    throw new Error('no diagrams');
  }
  return {
    ...content,
    diagrams: [
      { ...d1, head: { kind: 'event', text: 'start' }, body: { blocks: body, folds } },
      { ...d2, head: { kind: 'method', text: 'm()' } },
    ],
  };
};
const docWith = (content: Content, view: Partial<View> = {}): Doc => ({
  content,
  view: { folded: [], opened: [], bands: true, resultSymbol: '←', ...view },
});

const newProcess: DragSource = { kind: 'new', blockKind: 'process' };
const newIf: DragSource = { kind: 'new', blockKind: 'if' };

/** Where to drop on diagram `d1`: the header's bottom band and the band under the diagram. */
function placesOf(doc: Doc) {
  const result = layout(doc);
  const index = indexDoc(doc.content);
  const d1 = result.diagrams.find((d) => d.id === 'd1');
  if (d1 === undefined) {
    throw new Error('no d1');
  }
  const { body, head } = d1;
  const bottom = body.y + body.height;
  const drop = (point: { x: number; y: number }, source: DragSource) =>
    findDrop(result, index, point, source, null);
  return { result, index, body, head, bottom, drop };
}

describe('dropping at the start and end of a diagram body (interaction rules 7)', () => {
  it.each(kinds)(
    'T-1502: under a diagram whose last block is a %s, the drop goes after it, outside it',
    (_, last) => {
      const { body, bottom, drop } = placesOf(docWith(headed([proc('p0'), last])));
      const line = { kind: 'line', x: body.x, y: bottom, width: body.width };
      for (const x of [body.x, body.x + 3, body.x + body.width / 2, body.x + body.width]) {
        for (const y of [bottom + 1, bottom + bodyEndBand]) {
          const asNew = drop({ x, y }, newIf);
          expect(asNew?.action).toEqual({
            kind: 'insert',
            to: 'x',
            side: 'after',
            blockKind: 'if',
            outsideFolds: true,
          });
          expect(asNew?.mark).toEqual(line);
          expect(asNew?.wraps).toBeNull();
        }
      }
      const moved = drop(
        { x: body.x + body.width / 2, y: bottom + 6 },
        { kind: 'blocks', target: { kind: 'blocks', first: 'p0', last: 'p0' }, blocks: ['p0'] },
      );
      expect(moved?.action).toEqual({
        kind: 'move',
        target: { kind: 'blocks', first: 'p0', last: 'p0' },
        to: 'x',
        side: 'after',
        outsideFolds: true,
      });
    },
  );

  it.each(kinds)(
    'T-1503: in the bottom band of the header, the drop goes before a first %s',
    (_, first) => {
      const { body, head, drop } = placesOf(docWith(headed([first, proc('p9')])));
      const box: Box = head ?? { x: 0, y: 0, width: 0, height: 0 };
      const line = { kind: 'line', x: body.x, y: body.y, width: body.width };
      for (const y of [box.y + box.height - betweenBand, box.y + box.height - 1]) {
        const asNew = drop({ x: box.x + box.width / 2, y }, newProcess);
        expect(asNew?.action).toEqual({
          kind: 'insert',
          to: 'x',
          side: 'before',
          blockKind: 'process',
          outsideFolds: true,
        });
        expect(asNew?.mark).toEqual(line);
      }
      // The rest of the header still takes nothing.
      expect(
        drop({ x: box.x + box.width / 2, y: box.y + box.height - betweenBand - 1 }, newProcess),
      ).toBeNull();
    },
  );

  it('T-1504: the bands end where they say: beside, below and inside the diagram nothing changes', () => {
    const { body, bottom, drop } = placesOf(docWith(headed([proc('p0'), proc('p1')])));
    expect(drop({ x: body.x + 10, y: bottom + bodyEndBand + 1 }, newProcess)).toBeNull();
    expect(drop({ x: body.x - 1, y: bottom + 6 }, newProcess)).toBeNull();
    expect(drop({ x: body.x + body.width + 1, y: bottom + 6 }, newProcess)).toBeNull();
    // On the diagram's bottom line itself the last block's own band answers, as before.
    expect(drop({ x: body.x + 10, y: bottom }, newProcess)?.action).toEqual({
      kind: 'insert',
      to: 'p1',
      side: 'after',
      blockKind: 'process',
    });
  });

  it('T-1505: dragged blocks already at that end are not dropped there; others move', () => {
    const { body, head, bottom, drop } = placesOf(docWith(headed([proc('p0'), proc('p1')])));
    const dragging = (first: string, last: string): DragSource => ({
      kind: 'blocks',
      target: { kind: 'blocks', first, last },
      blocks: first === last ? [first] : [first, last],
    });
    const atEnd = { x: body.x + 10, y: bottom + 6 };
    const atStart = { x: body.x + 10, y: (head?.y ?? 0) + (head?.height ?? 0) - 2 };
    expect(drop(atEnd, dragging('p1', 'p1'))).toBeNull();
    expect(drop(atStart, dragging('p0', 'p1'))).toBeNull();
    expect(drop(atStart, dragging('p1', 'p1'))?.action).toEqual({
      kind: 'move',
      target: { kind: 'blocks', first: 'p1', last: 'p1' },
      to: 'p0',
      side: 'before',
      outsideFolds: true,
    });
  });

  it('T-1506: a diagram without a header has only the end band; an empty body takes the drop in its empty block', () => {
    const plain = docWith(
      contentOf([ifBlock('b1', branch('r1', []), branch('r2', [])), proc('p1')]),
    );
    const { body, bottom, drop } = placesOf(plain);
    expect(drop({ x: body.x + 10, y: bottom + 6 }, newIf)?.action).toMatchObject({
      kind: 'insert',
      to: 'p1',
      side: 'after',
    });
    expect(drop({ x: body.x + 10, y: body.y - 2 }, newIf)).toBeNull();

    const blank = placesOf(docWith(headed([empty('e1')])));
    const boxOfEmpty = blank.result.boxes.get('e1');
    for (const y of [blank.body.y - 2, blank.bottom + 6]) {
      const made = blank.drop({ x: blank.body.x + 10, y }, newIf);
      expect(made?.action).toEqual({ kind: 'insert', to: 'e1', side: 'after', blockKind: 'if' });
      expect(made?.mark).toEqual({ kind: 'outline', box: boxOfEmpty });
    }
  });

  it('T-1507: next to a fold region, folded or open, a new block at a body end stays outside it', () => {
    const content = headed(
      [proc('p0'), proc('p1'), proc('p2')],
      [
        { id: 'f1', first: 'p0', last: 'p0' },
        { id: 'f2', first: 'p1', last: 'p2' },
      ],
    );
    for (const folded of [[], ['f1', 'f2']]) {
      const { body, head, bottom, drop } = placesOf(docWith(content, { folded }));
      const atEnd = drop({ x: body.x + 10, y: bottom + 6 }, newProcess);
      const atStart = drop(
        { x: body.x + 10, y: (head?.y ?? 0) + (head?.height ?? 0) - 2 },
        newProcess,
      );
      expect(atEnd?.action).toMatchObject({ to: 'p2', side: 'after', outsideFolds: true });
      expect(atStart?.action).toMatchObject({ to: 'p0', side: 'before', outsideFolds: true });
      const engine = testEngine(content);
      if (atEnd !== null && atStart !== null) {
        runDrop(engine.session, atEnd.action);
        runDrop(engine.session, atStart.action);
      }
      const d1 = engine.content().diagrams[0];
      const blocks = d1?.body.blocks.map((b) => b.id) ?? [];
      expect(blocks).toHaveLength(5);
      expect(blocks.slice(1, 4)).toEqual(['p0', 'p1', 'p2']);
      expect(d1?.body.folds).toEqual(content.diagrams[0]?.body.folds);
    }
  });

  it('T-1508: the end band never reaches another diagram', () => {
    expect(geometry['space.diagram']).toBeGreaterThan(bodyEndBand);
    const many = contentOf(
      [proc('a1'), proc('a2')],
      [ifBlock('b1', branch('r1', [proc('b2')]), branch('r2', [proc('b3')]))],
      [whileBlock('c1', [proc('c2')])],
      [proc('e1')],
      [proc('f1'), proc('f2'), proc('f3')],
    );
    const result = layout(docWith(many));
    const index = indexDoc(many);
    for (const diagram of result.diagrams) {
      const { body } = diagram;
      const point = { x: body.x + 1, y: body.y + body.height + bodyEndBand };
      for (const other of result.diagrams) {
        const { box } = other;
        const overlaps =
          other !== diagram &&
          body.x < box.x + box.width &&
          box.x < body.x + body.width &&
          body.y + body.height < box.y + box.height &&
          box.y <= body.y + body.height + bodyEndBand;
        expect(overlaps).toBe(false);
      }
      const last = index.seqs.get(diagram.id)?.seq.blocks.at(-1)?.id;
      expect(findDrop(result, index, point, newProcess, null)?.action).toMatchObject({ to: last });
    }
  });

  it('T-1509: under an opened call block the drop goes after the call, not into what it shows', () => {
    const doc = docWith(headed([proc('p0'), call('c1', 'd2')]), { opened: [['c1']] });
    const { body, bottom, result, drop } = placesOf(doc);
    expect(result.boxes.get('c1/m1')).toBeDefined();
    expect(drop({ x: body.x + body.width / 2, y: bottom + 6 }, newProcess)?.action).toEqual({
      kind: 'insert',
      to: 'c1',
      side: 'after',
      blockKind: 'process',
      outsideFolds: true,
    });
  });
});

describe('dropping on an opened call block (interaction rules 7, M87 F3)', () => {
  const dragging = (id: string): DragSource => ({
    kind: 'blocks',
    target: { kind: 'blocks', first: id, last: id },
    blocks: [id],
  });
  const opened = (): Doc =>
    docWith(headed([proc('p0'), call('c1', 'd2'), proc('pz')]), { opened: [['c1']] });

  function callPlaces() {
    const doc = opened();
    const result = layout(doc);
    const index = indexDoc(doc.content);
    const box = result.boxes.get('c1');
    const shown = result.boxes.get('c1/m1');
    const band = result.regions.find((region) => region.kind === 'peekBand')?.box;
    if (box === undefined || shown === undefined || band === undefined) {
      throw new Error('no opened call');
    }
    const drop = (point: { x: number; y: number }, source: DragSource) =>
      findDrop(result, index, point, source, null);
    return { doc, box, shown, band, drop };
  }

  it('T-1600: its band takes the drop before the call block, never wrapping; the line is just outside its border', () => {
    const { doc, box, band, drop } = callPlaces();
    const x = band.x + band.width / 2;
    for (const blockKind of ['process', 'if'] as const) {
      const got = drop({ x, y: band.y + band.height / 2 }, { kind: 'new', blockKind });
      expect(got?.action).toEqual({ kind: 'insert', to: 'c1', side: 'before', blockKind });
      expect(got?.mark).toEqual({
        kind: 'line',
        x: box.x,
        y: box.y - foldOutsideGap,
        width: box.width,
      });
      expect(got?.wraps).toBeNull();
    }
    const engine = testEngine(doc.content);
    const made = drop({ x, y: band.y + 2 }, dragging('pz'));
    expect(made?.action).toMatchObject({ kind: 'move', to: 'c1', side: 'before' });
    if (made !== null) {
      expect(runDrop(engine.session, made.action)).toBe(true);
    }
    expect(engine.content().diagrams[0]?.body.blocks.map((b) => b.id)).toEqual(['p0', 'pz', 'c1']);
    // The Method is as it was.
    expect(engine.content().diagrams[1]?.body.blocks.map((b) => b.id)).toEqual(['m1']);
  });

  it('T-1601: the bottom band inside its box takes the drop after the call block; the blocks shown inside take nothing', () => {
    const { box, shown, drop } = callPlaces();
    const x = box.x + box.width / 2;
    const after = drop({ x, y: box.y + box.height - 2 }, newProcess);
    expect(after?.action).toEqual({
      kind: 'insert',
      to: 'c1',
      side: 'after',
      blockKind: 'process',
    });
    expect(after?.mark).toEqual({
      kind: 'line',
      x: box.x,
      y: box.y + box.height + foldOutsideGap,
      width: box.width,
    });
    expect(drop({ x, y: box.y + box.height - betweenBand - 1 }, newProcess)).toBeNull();
    for (const y of [shown.y + 1, shown.y + shown.height / 2, shown.y + shown.height - 1]) {
      if (y <= box.y + box.height - betweenBand) {
        expect(drop({ x: shown.x + shown.width / 2, y }, newIf)).toBeNull();
      }
    }
  });

  it('T-1602: the dragged call block itself is not dropped on its own band or bottom', () => {
    const { box, band, drop } = callPlaces();
    const x = box.x + box.width / 2;
    expect(drop({ x, y: band.y + band.height / 2 }, dragging('c1'))).toBeNull();
    expect(drop({ x, y: box.y + box.height - 2 }, dragging('c1'))).toBeNull();
    expect(drop({ x, y: box.y + box.height - 2 }, dragging('p0'))?.action).toMatchObject({
      kind: 'move',
      to: 'c1',
      side: 'after',
    });
  });
});
