// Layout and drawing of folded things, fold regions and opened call blocks (02-layout 1.6).
import { describe, expect, it } from 'vitest';

import type { Block, Call, Doc, FoldMark, Seq, View } from '../model/types';
import { buildScene } from '../render/build-scene';
import { branch, docOf, ifBlock, inLocale, process, whileBlock } from '../render/testing';
import { defaultTheme } from '../render/theme';
import { toSvg } from '../render/to-svg';
import { defaultFoldName, layout } from './layout';
import { placeSiteFolds, shownItems, shownView, splitScreenId, topLevel } from './shown';
import type { Box, LayoutNode, LayoutResult } from './types';

const withView = (doc: Doc, view: Partial<View>): Doc => ({
  ...doc,
  view: { ...doc.view, ...view },
});

const withFolds = (doc: Doc, folds: ReadonlyArray<FoldMark>): Doc => {
  const [first] = doc.content.diagrams;
  if (first === undefined) {
    return doc;
  }
  const body: Seq = { ...first.body, folds };
  return { ...doc, content: { ...doc.content, diagrams: [{ ...first, body }] } };
};

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

const twoBranches = ifBlock(
  'b1',
  'x > 0',
  branch('r1', [process('b2', 'a'), process('b3', 'b')]),
  branch('r2', [process('b4', 'c')]),
);

describe('folded branches and loop bodies (R-EDIT-13)', () => {
  it('fold: a folded branch is one row "n blocks", and its blocks point at the row', () => {
    const result = layout(withView(docOf(twoBranches), { folded: ['r1'] }));
    const row = nodeOf(result, 'foldedSeq', 'r1');
    expect(row.text).toBe('2 blocks');
    expect(boxOf(result, 'b2')).toEqual(row.box);
    expect(boxOf(result, 'b3')).toEqual(row.box);
    expect(result.regions).toContainEqual({ kind: 'foldedSeq', owner: 'r1', box: row.box });
    expect(result.nodes.some((node) => node.kind === 'process' && node.id === 'b2')).toBe(false);
  });

  it('fold: a folded row is in the drawing language and counts the blocks inside blocks', () => {
    const loop = whileBlock('b1', 'i < n', [
      process('b2', 'a'),
      whileBlock('b3', 'j < n', [process('b4', 'b')]),
    ]);
    const result = layout(inLocale(withView(docOf(loop), { folded: ['b1'] }), 'ko'));
    expect(nodeOf(result, 'foldedSeq', 'b1').text).toBe('블록 3개');
    // The loop's header is still drawn, its body is the row.
    expect(nodeOf(result, 'loop', 'b1').head.height).toBeGreaterThan(0);
  });

  it('fold: ids the view names that are gone are ignored', () => {
    const plain = layout(docOf(twoBranches));
    const stale = layout(withView(docOf(twoBranches), { folded: ['r9', 'f9'], opened: [['b9']] }));
    expect(stale).toEqual(plain);
  });
});

describe('fold regions (R-EDIT-14, R-EDIT-23)', () => {
  const blocks: Block[] = [process('b1', 'x = read()'), process('b2', 'y'), process('b3', 'z')];

  it('fold: a folded region is one cell with its default name; its blocks point at it', () => {
    const doc = withView(withFolds(docOf(...blocks), [{ id: 'f1', first: 'b1', last: 'b2' }]), {
      folded: ['f1'],
    });
    const result = layout(doc);
    const cell = nodeOf(result, 'foldCell', 'f1');
    expect(cell.name.lines).toEqual(['x = read() and 1 more']);
    expect(cell.isNamed).toBe(false);
    expect(boxOf(result, 'b1')).toEqual(cell.box);
    expect(boxOf(result, 'f1')).toEqual(cell.box);
    expect(result.regions).toContainEqual(
      expect.objectContaining({ kind: 'toggle', what: 'fold', target: 'f1', isOpen: false }),
    );
  });

  it('fold: an unfolded region with name bands has a band on top and is drawn after its blocks', () => {
    const doc = withFolds(docOf(...blocks), [{ id: 'f1', first: 'b2', last: 'b3', name: 'rest' }]);
    const result = layout(doc);
    const frame = nodeOf(result, 'foldFrame', 'f1');
    expect(frame.band.height).toBe(18);
    expect(frame.name.lines).toEqual(['rest']);
    expect(boxOf(result, 'b2').y).toBe(frame.box.y + 18);
    const order = result.nodes.map((node) => ('id' in node ? node.id : ''));
    expect(order.indexOf('f1')).toBeGreaterThan(order.indexOf('b3'));
    expect(result.regions).toContainEqual({
      kind: 'fold',
      foldId: 'f1',
      isFolded: false,
      box: frame.band,
    });
  });

  it('fold: a frame inside a frame is inset at the sides and the bottom; frames in a row keep a gap', () => {
    const doc = withFolds(docOf(...blocks), [
      { id: 'f1', first: 'b1', last: 'b3' },
      { id: 'f2', first: 'b2', last: 'b3' },
    ]);
    const result = layout(doc);
    const outer = boxOf(result, 'f1');
    const inner = boxOf(result, 'f2');
    expect(inner.x - outer.x).toBe(4);
    expect(outer.x + outer.width - (inner.x + inner.width)).toBe(4);
    expect(outer.y + outer.height - (inner.y + inner.height)).toBe(4);
    const row = layout(
      withFolds(docOf(...blocks), [
        { id: 'f1', first: 'b1', last: 'b1' },
        { id: 'f2', first: 'b2', last: 'b2' },
      ]),
    );
    expect(boxOf(row, 'f2').y - (boxOf(row, 'f1').y + boxOf(row, 'f1').height)).toBe(2);
  });

  it('fold: with name bands off an unfolded region is drawn as if it were not there', () => {
    const doc = withFolds(docOf(...blocks), [{ id: 'f1', first: 'b1', last: 'b2' }]);
    const off = layout(withView(doc, { bands: false }));
    expect(off.nodes).toEqual(layout(docOf(...blocks)).nodes);
  });

  it('fold: the default name is the first block\'s first line, or "(empty block)"', () => {
    const words = { locale: 'ko', resultSymbol: '←', diagrams: new Map() } as const;
    expect(defaultFoldName(words, [process('b1', 'a\nb')])).toBe('a');
    expect(defaultFoldName(words, [process('b1', ''), process('b2')])).toBe('(빈 블록) 외 1개');
  });

  it('fold: the frame and the cell are drawn with the fold colors; a default name is slanted', () => {
    const doc = withFolds(docOf(...blocks), [
      { id: 'f1', first: 'b1', last: 'b1' },
      { id: 'f2', first: 'b3', last: 'b3', name: 'z' },
    ]);
    const scene = buildScene(layout(withView(doc, { folded: ['f2'] })), defaultTheme);
    const border = scene.elements.find(
      (element) => element.kind === 'rect' && element.blockId === 'f1' && element.fill === 'none',
    );
    expect(border).toMatchObject({ stroke: defaultTheme.colors['fold.edge'], strokeWidth: 3 });
    const svg = toSvg(scene).content;
    expect(svg).toContain('font-style="italic"');
    expect(svg).toContain('>z</text>');
  });
});

describe('opened call blocks (R-EDIT-15, R-EDIT-16)', () => {
  const opened: Call = {
    id: 'b1',
    kind: 'call',
    target: { kind: 'local', diagram: 'd2' },
    args: 'a',
    result: '',
    siteFolds: [{ id: 'f1', via: [], first: 'b11', last: 'b12', name: 'here' }],
  };
  const doc = (view: Partial<View>): Doc => {
    const base = docOf(opened);
    return withView(
      {
        ...base,
        content: {
          ...base.content,
          diagrams: [
            ...base.content.diagrams,
            {
              id: 'd2',
              head: { kind: 'method', text: 'sort(a)' },
              body: {
                blocks: [
                  process('b10', 'n'),
                  process('b11', 'swap'),
                  process('b12', 'more'),
                  {
                    id: 'b13',
                    kind: 'call',
                    target: { kind: 'local', diagram: 'd2' },
                    args: 'a',
                    result: '',
                    siteFolds: [],
                  },
                ],
                folds: [],
              },
            },
          ],
        },
      },
      view,
    );
  };

  it("peek: an opened call block shows the Method's blocks behind its id, grey, under a band", () => {
    const result = layout(doc({ opened: [['b1']] }));
    const peek = nodeOf(result, 'peek', 'b1');
    expect(peek.name).toBe('sort');
    expect(boxOf(result, 'b1/b10').y).toBe(peek.box.y + 18);
    expect(nodeOf(result, 'process', 'b1/b10').isPeeked).toBe(true);
    expect(nodeOf(result, 'foldFrame', 'b1/f1').name.lines).toEqual(['here']);
    expect(result.nodes.some((node) => node.kind === 'call' && node.id === 'b1')).toBe(false);
    expect(result.regions).toContainEqual({ kind: 'peekBand', blockId: 'b1', box: peek.band });
  });

  it('peek: a call opened inside an opened call has a path; a closed one is a call block', () => {
    const result = layout(doc({ opened: [['b1'], ['b1', 'b13']] }));
    expect(nodeOf(result, 'peek', 'b1/b13').isPeeked).toBe(true);
    expect(boxOf(result, 'b1/b13/b10')).toBeDefined();
    expect(nodeOf(layout(doc({ opened: [['b1']] })), 'call', 'b1/b13').isPeeked).toBe(true);
  });

  it('peek: the dashed border and the band are drawn in the peek colors', () => {
    const scene = buildScene(layout(doc({ opened: [['b1']] })), defaultTheme);
    const dashed = scene.elements.find(
      (element) => element.kind === 'polyline' && element.blockId === 'b1' && element.dash !== null,
    );
    expect(dashed).toMatchObject({ stroke: defaultTheme.colors['peek.edge'], dash: [6, 4] });
  });

  it('peek: site regions shrink to the blocks left and are left out when they would cross', () => {
    const body: Seq = {
      blocks: [process('b10'), process('b11'), process('b12')],
      folds: [{ id: 'f5', first: 'b10', last: 'b11' }],
    };
    const ranges = placeSiteFolds(body, [
      { id: 'f1', via: [], first: 'gone', last: 'b12' },
      { id: 'f2', via: [], first: 'b11', last: 'b12' },
      { id: 'f3', via: [], first: 'x', last: 'y' },
    ]);
    expect(ranges.get(body)?.map((range) => [range.fold.id, range.lo, range.hi])).toEqual([
      ['f1', 2, 2],
      ['f2', 1, 2],
    ]);
    const items = shownItems(
      body,
      { prefix: 'b1/', siteRanges: ranges, site: { call: 'b1', via: [] } },
      shownView({ folded: [], opened: [], bands: true, resultSymbol: '←' }),
    );
    // f5 (the Method's) stays; f2 would cross it and is left out; f1 holds b12 alone.
    expect(
      items.map((item) => (item.kind === 'fold' ? item.fold.screenId : item.block.id)),
    ).toEqual(['b1/f5', 'b1/f1']);
    expect(splitScreenId('b1/b13/b10')).toEqual({ path: ['b1', 'b13'], id: 'b10' });
    expect(
      shownItems(
        body,
        topLevel,
        shownView({ folded: ['f5'], opened: [], bands: false, resultSymbol: '←' }),
      )[0]?.kind,
    ).toBe('fold');
  });
});
