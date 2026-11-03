import fc from 'fast-check';
import { describe, expect, it } from 'vitest';

import type { Block, Diagram, Doc } from '../model/types';
import {
  arm,
  branch,
  caseBlock,
  docOf,
  doWhileBlock,
  forBlock,
  ifBlock,
  largeDoc,
  process,
  whileBlock,
} from '../render/testing';
import { layout } from './layout';
import type { Box, LayoutNode, LayoutResult } from './types';

const en = { locale: 'en' } as const;
const ko = { locale: 'ko' } as const;

/** 30 Latin characters: 195px of text, a 215px block. Wider than the 160px diagram minimum. */
const wide = 'x'.repeat(30);

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

describe('layout: blocks', () => {
  it('T-0439: 02-layout 1.4: a process block is its text plus padding, at least 52px wide', () => {
    const result = layout(docOf(process('b1', wide)), en);
    expect(boxOf(result, 'b1')).toEqual({ x: 24, y: 24, width: 215, height: 32 });
    expect(result.width).toBe(24 + 215 + 24);
    expect(result.height).toBe(24 + 32 + 24);
  });

  it('T-0440: 02-layout 1.5: a diagram is at least 160px wide; blocks take the full width', () => {
    const result = layout(docOf(process('b1', 'n > 0')), en);
    expect(boxOf(result, 'b1')).toEqual({ x: 24, y: 24, width: 160, height: 32 });
  });

  it('T-0441 · R-LAY-01: a multi-line block grows by 18px a line', () => {
    const result = layout(docOf(process('b1', 'a\nb\nc')), en);
    expect(boxOf(result, 'b1').height).toBe(3 * 18 + 2 * 7);
  });

  it('T-0442: 02-layout 1.2: an empty block is one line high', () => {
    const result = layout(docOf(process('b1')), en);
    expect(boxOf(result, 'b1').height).toBe(32);
  });

  it('T-0443: 02-layout 1.3: blocks of a sequence touch with no gap', () => {
    const result = layout(docOf(process('b1', 'a'), process('b2', 'b\nc'), process('b3')), en);
    expect(boxOf(result, 'b1')).toEqual({ x: 24, y: 24, width: 160, height: 32 });
    expect(boxOf(result, 'b2')).toEqual({ x: 24, y: 56, width: 160, height: 50 });
    expect(boxOf(result, 'b3')).toEqual({ x: 24, y: 106, width: 160, height: 32 });
  });

  it('T-0444: 02-layout 1.4: a While has its header on top and its body 22px to the right', () => {
    const result = layout(docOf(whileBlock('b1', 'i < n', [process('b2', wide)])), en);
    expect(boxOf(result, 'b1')).toEqual({ x: 24, y: 24, width: 237, height: 64 });
    expect(nodeOf(result, 'loop', 'b1').head).toEqual({ x: 24, y: 24, width: 237, height: 32 });
    expect(boxOf(result, 'b2')).toEqual({ x: 46, y: 56, width: 215, height: 32 });
  });

  it('T-0445: 02-layout 1.4: a Do-While has its header at the bottom', () => {
    const result = layout(docOf(doWhileBlock('b1', 'i < n', [process('b2', wide)])), en);
    expect(nodeOf(result, 'loop', 'b1').head).toEqual({ x: 24, y: 56, width: 237, height: 32 });
    expect(boxOf(result, 'b2')).toEqual({ x: 46, y: 24, width: 215, height: 32 });
  });

  it('T-0446 · UX FB1: a For is measured like a While', () => {
    const asWhile = layout(docOf(whileBlock('b1', 'i ← 0..9', [process('b2', wide)])), en);
    const asFor = layout(docOf(forBlock('b1', 'i ← 0..9', [process('b2', wide)])), en);
    expect(asFor.boxes).toEqual(asWhile.boxes);
  });

  it('T-0447: 02-layout 1.4: a loop header is as wide as its condition needs', () => {
    const result = layout(docOf(whileBlock('b1', wide, [process('b2')])), en);
    expect(boxOf(result, 'b1').width).toBe(215);
    expect(boxOf(result, 'b2').width).toBe(215 - 22);
  });

  it('T-0448: 02-layout 1.4: an If header is the condition + padding + 16px label row high', () => {
    const result = layout(
      docOf(ifBlock('b1', 'x > 0', branch('r2', [process('b3')]), branch('r4', [process('b5')]))),
      en,
    );
    const node = nodeOf(result, 'if', 'b1');
    expect(node.head).toEqual({ x: 24, y: 24, width: 160, height: 48 });
    // Both branches have the same smallest width, so the 160px split in half.
    expect(node.splitX).toBe(104);
    expect(boxOf(result, 'r2')).toEqual({ x: 24, y: 72, width: 80, height: 32 });
    expect(boxOf(result, 'r4')).toEqual({ x: 104, y: 72, width: 80, height: 32 });
    expect(boxOf(result, 'b5')).toEqual(boxOf(result, 'r4'));
  });

  it('T-0449: 02-layout 1.4: an If is at least its condition + 2·pad-x + 70px wide', () => {
    const result = layout(
      docOf(ifBlock('b1', wide, branch('r2', [process('b3')]), branch('r4', [process('b5')]))),
      en,
    );
    expect(boxOf(result, 'b1').width).toBe(195 + 20 + 70);
  });

  it('T-0450 · R-LAY-02: an If is as wide as both branches side by side', () => {
    const result = layout(
      docOf(
        ifBlock(
          'b1',
          'c',
          branch('r2', [process('b3', wide)]),
          branch('r4', [process('b5', wide)]),
        ),
      ),
      en,
    );
    expect(boxOf(result, 'b1').width).toBe(430);
    expect(boxOf(result, 'b3').width).toBe(215);
    expect(boxOf(result, 'b5').width).toBe(215);
  });

  it('T-0451: 02-layout 1.4: spare width goes to branches in proportion to their smallest widths', () => {
    const narrow = 'x'.repeat(10); // 85px block
    const result = layout(
      docOf(
        process('b0', 'x'.repeat(60)), // 410px: the width the If receives
        ifBlock(
          'b1',
          'c',
          branch('r2', [process('b3', narrow)]),
          branch('r4', [process('b5', wide)]),
        ),
      ),
      en,
    );
    // 85 : 215 of 410 → 85 + 110·85/300 = 116.17 → 116; the last branch takes the rest.
    expect(boxOf(result, 'r2').width).toBe(116);
    expect(boxOf(result, 'r4').width).toBe(410 - 116);
  });

  it('T-0452 · UX Q24: If branch labels follow the locale unless the user wrote one', () => {
    const doc = docOf(
      ifBlock('b1', 'c', branch('r2', [process('b3')]), branch('r4', [process('b5')], '없음')),
    );
    const english = nodeOf(layout(doc, en), 'if', 'b1');
    expect([english.yes.text, english.no.text]).toEqual(['true', '없음']);
    const korean = nodeOf(layout(doc, ko), 'if', 'b1');
    expect([korean.yes.text, korean.no.text]).toEqual(['참', '없음']);
  });

  it('T-0453: 02-layout 1.4: a long branch label widens its branch', () => {
    const label = 'x'.repeat(20); // 120px at 12px
    const result = layout(
      docOf(
        ifBlock('b1', 'c', branch('r2', [process('b3')], label), branch('r4', [process('b5')])),
      ),
      en,
    );
    expect(boxOf(result, 'r2').width).toBeGreaterThanOrEqual(120 + 18);
  });

  it('T-0454: 02-layout 1.4: a Case header is the condition + padding + 28px label row high', () => {
    const result = layout(
      docOf(
        caseBlock(
          'b1',
          'k',
          [arm('r2', '1', [process('b3')]), arm('r4', '2', [process('b5')])],
          branch('r6', [process('b7')]),
        ),
      ),
      en,
    );
    const node = nodeOf(result, 'case', 'b1');
    expect(node.head).toEqual({ x: 24, y: 24, width: 164, height: 60 });
    // Two 52px arms; "default" is 42px at 12px, plus 18px label room.
    expect(node.columns.map((column) => column.label.column.width)).toEqual([52, 52, 60]);
    expect(node.columns.map((column) => column.label.text)).toEqual(['1', '2', 'default']);
    expect(node.columns.map((column) => column.isDefault)).toEqual([false, false, true]);
    expect(boxOf(result, 'b7')).toEqual({ x: 128, y: 84, width: 60, height: 32 });
  });

  it('T-0455: 02-layout 1.4: a Case is at least its condition + 2·pad-x + 90px wide', () => {
    const result = layout(
      docOf(
        caseBlock('b1', wide, [arm('r2', '1', [process('b3')])], branch('r4', [process('b5')])),
      ),
      en,
    );
    expect(boxOf(result, 'b1').width).toBe(195 + 20 + 90);
  });

  it('T-0456 · UX CD1: a Case without a default draws an empty default cell', () => {
    const result = layout(docOf(caseBlock('b1', 'k', [arm('r2', '1', [process('b3')])], null)), en);
    const node = nodeOf(result, 'case', 'b1');
    expect(node.columns.map((column) => column.branchId)).toEqual(['r2', null]);
    // 52 : 60 of 160 → 52 + 48·52/112 = 74.29 → 74; the default cell takes the rest.
    const cell = { x: 24 + 74, y: 84, width: 86, height: 32 };
    const missing = result.nodes.find((item) => item.kind === 'missingDefault');
    expect(missing).toEqual({ kind: 'missingDefault', caseId: 'b1', box: cell });
    expect(result.regions).toContainEqual({ kind: 'missingDefault', blockId: 'b1', box: cell });
  });

  it('T-0457 · UX CD2: a Case with only a default has one column', () => {
    const result = layout(docOf(caseBlock('b1', 'k', [], branch('r2', [process('b3')]))), en);
    const node = nodeOf(result, 'case', 'b1');
    expect(node.columns).toHaveLength(1);
    expect(boxOf(result, 'b3')).toEqual({ x: 24, y: 84, width: 160, height: 32 });
  });

  it('T-0458 · UX E1: marks the only, empty block of a branch', () => {
    const result = layout(
      docOf(
        ifBlock('b1', 'c', branch('r2', [process('b3')]), branch('r4', [process('b5', 'x')])),
        whileBlock('b6', 'w', [process('b7')]),
      ),
      en,
    );
    expect(nodeOf(result, 'process', 'b3').isEmptyBranch).toBe(true);
    expect(nodeOf(result, 'process', 'b5').isEmptyBranch).toBe(false);
    // Only If and Case branches show the mark, not a loop body.
    expect(nodeOf(result, 'process', 'b7').isEmptyBranch).toBe(false);
  });
});

describe('layout: short branches (UX SB1)', () => {
  it('T-0459 · UX SB1: shares the extra height equally; the last block takes the remainder', () => {
    const result = layout(
      docOf(
        ifBlock(
          'b1',
          'c',
          branch('r2', [process('b3', 'a'), process('b4', 'b'), process('b5', 'c')]), // 96px
          branch('r6', [process('b7', 'd'), process('b8', 'e\nf\ng')]), // 32 + 68 = 100px
        ),
      ),
      en,
    );
    // 4px over 3 blocks: 1px each, and the last also takes the 1px remainder.
    expect(boxOf(result, 'b3').height).toBe(33);
    expect(boxOf(result, 'b4').height).toBe(33);
    expect(boxOf(result, 'b5').height).toBe(34);
    expect(boxOf(result, 'b5').y + 34).toBe(boxOf(result, 'b8').y + boxOf(result, 'b8').height);
    // The longer branch is not stretched.
    expect(boxOf(result, 'b7').height).toBe(32);
    expect(boxOf(result, 'b8').height).toBe(68);
  });

  it('T-0460: 02-layout 1.3: a control block gives its extra height to its body, not its header', () => {
    const result = layout(
      docOf(
        ifBlock(
          'b1',
          'c',
          branch('r2', [whileBlock('b3', 'w', [process('b4')])]), // 64px
          branch('r5', [process('b6', 'a\nb\nc\nd\ne')]), // 104px
        ),
      ),
      en,
    );
    expect(nodeOf(result, 'loop', 'b3').head.height).toBe(32);
    expect(boxOf(result, 'b4').height).toBe(104 - 32);
  });
});

describe('layout: click regions', () => {
  it('T-0461: 02-layout 1.1: control blocks are clicked on the header, labels on their label row', () => {
    const result = layout(
      docOf(ifBlock('b1', 'c', branch('r2', [process('b3')]), branch('r4', [process('b5')]))),
      en,
    );
    expect(result.regions).toEqual([
      { kind: 'head', blockId: 'b1', box: { x: 24, y: 24, width: 160, height: 48 } },
      {
        kind: 'branchLabel',
        blockId: 'b1',
        branchId: 'r2',
        index: 0,
        box: { x: 24, y: 56, width: 80, height: 16 },
      },
      {
        kind: 'branchLabel',
        blockId: 'b1',
        branchId: 'r4',
        index: 1,
        box: { x: 104, y: 56, width: 80, height: 16 },
      },
      { kind: 'block', blockId: 'b3', box: { x: 24, y: 72, width: 80, height: 32 } },
      { kind: 'block', blockId: 'b5', box: { x: 104, y: 72, width: 80, height: 32 } },
    ]);
  });

  it('T-0462: 02-layout 1.1: a Do-While is clicked on its bottom header', () => {
    const result = layout(docOf(doWhileBlock('b1', 'w', [process('b2')])), en);
    expect(result.regions[0]).toEqual({
      kind: 'head',
      blockId: 'b1',
      box: { x: 24, y: 56, width: 160, height: 32 },
    });
  });
});

/** A document of diagrams, each `[id, head, block text]`, with the given header style. */
function diagramsDoc(
  headStyle: 'shape' | 'title',
  diagrams: ReadonlyArray<readonly [string, Diagram['head'], string]>,
): Doc {
  return {
    ...docOf(process('b0')),
    content: {
      settings: { textKind: 'plain', theme: 'default', headStyle },
      diagrams: diagrams.map(([id, head, text], index) => ({
        id,
        head,
        body: { blocks: [process(`b${String(index + 1)}`, text)], folds: [] },
      })),
    },
  };
}

const event = (text: string): Diagram['head'] => ({ kind: 'event', text });
const method = (text: string): Diagram['head'] => ({ kind: 'method', text });

describe('layout: headers (02-layout 1.5)', () => {
  it('T-0463: a shaped header is the hat (16px) + the text + 2·pad-y high, above the body', () => {
    const result = layout(diagramsDoc('shape', [['d1', event('start'), 'x']]), en);
    const head = nodeOf(result, 'diagramHead', 'd1');
    expect(head.box).toEqual({ x: 24, y: 24, width: 160, height: 16 + 18 + 14 });
    expect(head.style).toBe('shape');
    expect(boxOf(result, 'b1')).toEqual({ x: 24, y: 24 + 48, width: 160, height: 32 });
    expect(boxOf(result, 'd1')).toEqual({ x: 24, y: 24, width: 160, height: 48 + 32 });
    expect(result.diagrams[0]?.head).toEqual(head.box);
  });

  it('T-0464: a shaped header is at least its text + 2·pad-x + 24px wide', () => {
    const doc = diagramsDoc('shape', [['d1', method(wide), 'x']]);
    expect(nodeOf(layout(doc, en), 'diagramHead', 'd1').box.width).toBe(195 + 20 + 24);
  });

  it('T-0465: a header like a title is 16 + 18 + 6 = 40px high and needs no padding', () => {
    const doc = diagramsDoc('title', [['d1', method(wide), 'x']]);
    const head = nodeOf(layout(doc, en), 'diagramHead', 'd1');
    expect(head.box).toEqual({ x: 24, y: 24, width: 195, height: 40 });
  });

  it('T-0466: a diagram without a header has no header node and is clicked on its blocks', () => {
    const result = layout(diagramsDoc('title', [['d1', null, 'x']]), en);
    expect(result.nodes.some((node) => node.kind === 'diagramHead')).toBe(false);
    expect(result.diagrams[0]?.head).toBeNull();
  });

  it('T-0467: 02-layout 1.1: a header is clicked anywhere on it', () => {
    const result = layout(diagramsDoc('shape', [['d1', event('start'), 'x']]), en);
    expect(result.regions).toContainEqual({
      kind: 'diagramHead',
      diagramId: 'd1',
      box: { x: 24, y: 24, width: 160, height: 48 },
    });
  });
});

describe('layout: several diagrams (02-layout 1.7)', () => {
  it('T-0468: puts Methods to the right of Events, 88px apart', () => {
    const doc = diagramsDoc('title', [
      ['d1', method('sort(a)'), 'x'],
      ['d2', event('start'), 'x'],
    ]);
    const result = layout(doc, en);
    expect(boxOf(result, 'd2')).toMatchObject({ x: 24, y: 24 });
    expect(boxOf(result, 'd1')).toMatchObject({ x: 24 + 160 + 88, y: 24 });
    expect(result.width).toBe(24 + 160 + 88 + 160 + 24);
  });

  it('T-0469: keeps a diagram without a header in the Event group', () => {
    const doc = diagramsDoc('title', [
      ['d1', null, 'x'],
      ['d2', method('f'), 'x'],
    ]);
    const result = layout(doc, en);
    expect(boxOf(result, 'd1').x).toBe(24);
    expect(boxOf(result, 'd2').x).toBe(24 + 160 + 88);
  });

  it('T-0470: wraps a long group into columns so the picture is closest to 16 : 10', () => {
    const doc = diagramsDoc(
      'title',
      Array.from(
        { length: 12 },
        (_, index) => [`d${String(index + 1)}`, event(`e${String(index)}`), 'x'] as const,
      ),
    );
    const result = layout(doc, en);
    const xs = new Set(result.diagrams.map((diagram) => diagram.box.x));
    expect(xs.size).toBeGreaterThan(1);
    const ratio = (result.width - 48) / (result.height - 48);
    expect(Math.abs(ratio - 1.6)).toBeLessThan(0.6);
  });

  it('T-0471: stacks diagrams of one group top to bottom, 44px apart, while they fit', () => {
    const doc: Doc = {
      ...docOf(process('b1')),
      content: {
        settings: { textKind: 'plain', theme: 'default', headStyle: 'shape' },
        diagrams: [
          { id: 'd1', head: null, body: { blocks: [process('b1')], folds: [] } },
          { id: 'd2', head: null, body: { blocks: [process('b2', wide)], folds: [] } },
        ],
      },
    };
    const result = layout(doc, en);
    expect(boxOf(result, 'd1')).toEqual({ x: 24, y: 24, width: 160, height: 32 });
    expect(boxOf(result, 'd2')).toEqual({ x: 24, y: 100, width: 215, height: 32 });
    expect(result.width).toBe(24 + 215 + 24);
    expect(result.height).toBe(24 + 32 + 44 + 32 + 24);
  });
});

// Property tests over random trees of MVP blocks (07-testing 2).

let counter = 0;
const nextId = (prefix: string): string => `${prefix}${String((counter += 1))}`;

const textArbitrary = fc.oneof(
  fc.constant(''),
  fc.constantFrom('x', 'n > 0', '합계 ← 0', 'a\nb', 'x'.repeat(25), '참 거짓\n긴 줄의 조건'),
);

const blockArbitrary: fc.Arbitrary<Block> = fc.letrec<{ block: Block; blocks: Block[] }>((tie) => ({
  block: fc.oneof(
    { depthSize: 'small', withCrossShrink: true },
    textArbitrary.map((text) => process(nextId('b'), text)),
    fc
      .tuple(textArbitrary, tie('blocks'), tie('blocks'))
      .map(([text, yes, no]) =>
        ifBlock(nextId('b'), text, branch(nextId('r'), yes), branch(nextId('r'), no)),
      ),
    fc
      .tuple(textArbitrary, fc.array(tie('blocks'), { maxLength: 3 }), fc.option(tie('blocks')))
      .map(([text, arms, otherwise]) =>
        caseBlock(
          nextId('b'),
          text,
          arms.map((blocks, index) => arm(nextId('r'), String(index + 1), blocks)),
          otherwise === null ? null : branch(nextId('r'), otherwise),
        ),
      ),
    fc
      .tuple(fc.constantFrom('while', 'doWhile', 'for'), textArbitrary, tie('blocks'))
      .map(([kind, text, body]) =>
        kind === 'while'
          ? whileBlock(nextId('b'), text, body)
          : kind === 'doWhile'
            ? doWhileBlock(nextId('b'), text, body)
            : forBlock(nextId('b'), text, body),
      ),
  ),
  blocks: fc.array(tie('block'), { minLength: 1, maxLength: 3 }),
})).block;

function contains(outer: Box, inner: Box): boolean {
  return (
    inner.x >= outer.x &&
    inner.y >= outer.y &&
    inner.x + inner.width <= outer.x + outer.width &&
    inner.y + inner.height <= outer.y + outer.height
  );
}

describe('layout: properties', () => {
  it('T-0472 · R-FMT-03: the same document gives the same layout', () => {
    fc.assert(
      fc.property(fc.array(blockArbitrary, { minLength: 1, maxLength: 4 }), (blocks) => {
        const doc = docOf(...blocks);
        expect(layout(structuredClone(doc), en)).toEqual(layout(doc, en));
      }),
      { numRuns: 50 },
    );
  });

  it('T-0473: 02-layout 1.1: every box is whole px and inside its diagram', () => {
    fc.assert(
      fc.property(fc.array(blockArbitrary, { minLength: 1, maxLength: 4 }), (blocks) => {
        const result = layout(docOf(...blocks), en);
        const diagram = result.diagrams[0]?.box;
        expect(diagram).toBeDefined();
        for (const box of result.boxes.values()) {
          for (const value of [box.x, box.y, box.width, box.height]) {
            expect(Number.isInteger(value)).toBe(true);
          }
          expect(box.width).toBeGreaterThan(0);
          expect(box.height).toBeGreaterThan(0);
          if (diagram !== undefined) {
            expect(contains(diagram, box)).toBe(true);
          }
        }
      }),
      { numRuns: 100 },
    );
  });

  it('T-0474 · R-LAY-02: the blocks of a diagram body fill it exactly (it stays a rectangle)', () => {
    fc.assert(
      fc.property(fc.array(blockArbitrary, { minLength: 1, maxLength: 4 }), (blocks) => {
        const result = layout(docOf(...blocks), en);
        const diagram = result.diagrams[0]?.body;
        let y = diagram?.y ?? 0;
        for (const block of blocks) {
          const box = boxOf(result, block.id);
          expect(box.x).toBe(diagram?.x);
          expect(box.width).toBe(diagram?.width);
          expect(box.y).toBe(y);
          y += box.height;
        }
        expect(y).toBe((diagram?.y ?? 0) + (diagram?.height ?? 0));
      }),
      { numRuns: 100 },
    );
  });
});

describe('layout: size', () => {
  it('T-0475: lays out a document of 500 blocks', () => {
    const result = layout(largeDoc(500), en);
    expect(result.boxes.size).toBeGreaterThanOrEqual(500);
  });
});
