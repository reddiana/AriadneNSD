// Pages for print and PDF (R-EXP-03): print size, block boundaries, orientation, paper.
import { describe, expect, it } from 'vitest';

import { layout } from '../layout/layout';
import type { Block } from '../model/types';
import { docOf, process } from '../render/testing';
import { paginate, paperForLanguage, papers, pointsPerPixel } from './paginate';

const many = (count: number, text = (index: number) => `step ${String(index)}`): Block[] =>
  Array.from({ length: count }, (_, index) => process(`b${String(index + 1)}`, text(index + 1)));

/** The y of every block edge: where a cut between blocks may go. */
function blockEdges(blocks: ReadonlyArray<Block>): Set<number> {
  const result = layout(docOf(...blocks));
  return new Set(
    blocks.flatMap((block) => {
      const box = result.boxes.get(block.id);
      return box === undefined ? [] : [box.y, box.y + box.height];
    }),
  );
}

describe('paperForLanguage', () => {
  it('is Letter in the regions that use it and A4 elsewhere', () => {
    expect(paperForLanguage('en-US')).toBe(papers.letter);
    expect(paperForLanguage('es-MX')).toBe(papers.letter);
    expect(paperForLanguage('en-ca')).toBe(papers.letter);
    expect(paperForLanguage('ko-KR')).toBe(papers.a4);
    expect(paperForLanguage('en-GB')).toBe(papers.a4);
    expect(paperForLanguage('zh-Hant-TW')).toBe(papers.a4);
    expect(paperForLanguage('en')).toBe(papers.a4);
    expect(paperForLanguage('')).toBe(papers.a4);
  });
});

describe('paginate', () => {
  it('puts a small drawing on one portrait page at print size', () => {
    const result = layout(docOf(process('b1', 'x = read()')));
    const pagination = paginate(result, papers.a4);
    expect(pagination.orientation).toBe('portrait');
    expect(pagination.pointsPerPixel).toBe(pointsPerPixel);
    expect(pagination.pages).toEqual([
      { x: 0, y: 0, width: result.width, height: result.height, number: 1, column: 0, row: 0 },
    ]);
  });

  it('cuts a long drawing into pages between blocks, each fitting the page', () => {
    const blocks = many(120);
    const result = layout(docOf(...blocks));
    const pagination = paginate(result, papers.a4);
    const room = (pagination.pageHeight - 2 * pagination.margin) / pagination.pointsPerPixel;
    expect(pagination.pages.length).toBeGreaterThan(2);
    const edges = blockEdges(blocks);
    pagination.pages.forEach((page, index) => {
      expect(page.number).toBe(index + 1);
      expect(page.height).toBeLessThanOrEqual(room);
      if (index > 0) {
        expect(edges.has(page.y), `page ${String(page.number)} starts on a block edge`).toBe(true);
      }
    });
    const last = pagination.pages.at(-1);
    expect(last === undefined ? 0 : last.y + last.height).toBe(result.height);
  });

  it('cuts through a block that is taller than a page', () => {
    const tall = process('b1', Array.from({ length: 120 }, () => 'line').join('\n'));
    const result = layout(docOf(tall));
    const pagination = paginate(result, papers.a4);
    const room = (pagination.pageHeight - 2 * pagination.margin) / pagination.pointsPerPixel;
    expect(pagination.pages.length).toBeGreaterThan(1);
    expect(pagination.pages[1]?.y).toBeCloseTo(room);
  });

  it('turns the page for a wide drawing when that needs fewer pages', () => {
    const wide = process('b1', 'w'.repeat(130));
    const result = layout(docOf(wide));
    const pagination = paginate(result, papers.a4);
    expect(result.width * pointsPerPixel).toBeGreaterThan(papers.a4.width - 72);
    expect(pagination.orientation).toBe('landscape');
    expect(pagination.pageWidth).toBe(papers.a4.height);
    expect(pagination.pages).toHaveLength(1);
  });

  it('cuts a drawing wider than any page into columns, read down then across', () => {
    const wide = many(60, (index) => `${String(index)} ${'w'.repeat(200)}`);
    const pagination = paginate(layout(docOf(...wide)), papers.letter);
    const columns = new Set(pagination.pages.map((page) => page.column));
    expect(columns.size).toBeGreaterThan(1);
    const order = pagination.pages.map((page) => [page.column, page.row]);
    expect(order).toEqual(
      [...order].sort((a, b) => (a[0] ?? 0) - (b[0] ?? 0) || (a[1] ?? 0) - (b[1] ?? 0)),
    );
  });

  it('leaves out pages that would show only paper', () => {
    // Two diagrams side by side (an Event and a Method): the Method column is short.
    const long = many(150);
    const doc = docOf(...long);
    const twoDiagrams = {
      ...doc,
      content: {
        ...doc.content,
        diagrams: [
          ...doc.content.diagrams,
          {
            id: 'd2',
            head: { kind: 'method' as const, text: `m(${'x'.repeat(150)})` },
            body: { blocks: [process('b999', 'short')], folds: [] },
          },
        ],
      },
    };
    const result = layout(twoDiagrams);
    const pagination = paginate(result, papers.a4);
    const grid = new Set(
      pagination.pages.map((page) => `${String(page.column)},${String(page.row)}`),
    );
    const columns = new Set(pagination.pages.map((page) => page.column)).size;
    const rows = Math.max(...pagination.pages.map((page) => page.row)) + 1;
    expect(grid.size).toBeLessThan(columns * rows);
  });
});
