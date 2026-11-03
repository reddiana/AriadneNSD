// Pages for print and PDF (R-EXP-03): the drawing at its print size (1px = 0.75pt, visual design
// 9.2), cut into pages of the paper, at block boundaries where it can be.
import type { Box, LayoutNode, LayoutResult } from '../layout/types';

/** A paper size in pt (1/72 inch), portrait. */
export type Paper = {
  readonly name: 'a4' | 'letter';
  readonly width: number;
  readonly height: number;
};

/** A4 (210 × 297 mm) and US Letter (8.5 × 11 in). */
export const papers: Readonly<Record<Paper['name'], Paper>> = {
  a4: { name: 'a4', width: 595.28, height: 841.89 },
  letter: { name: 'letter', width: 612, height: 792 },
};

/**
 * The regions where Letter is the usual paper (CLDR `paperSize`); A4 everywhere else.
 * The shell passes the region of the browser's language (`en-US` → `US`).
 */
const letterRegions: ReadonlySet<string> = new Set([
  'BZ',
  'CA',
  'CL',
  'CO',
  'CR',
  'GT',
  'MX',
  'NI',
  'PA',
  'PH',
  'PR',
  'SV',
  'US',
  'VE',
]);

/** The paper of a language tag such as `en-US` or `ko-KR`: Letter in its regions, else A4. */
export function paperForLanguage(languageTag: string): Paper {
  const region = /^[a-z]{2,3}(?:-[A-Za-z]{4})?-([A-Za-z]{2})\b/i.exec(languageTag)?.[1];
  return region !== undefined && letterRegions.has(region.toUpperCase())
    ? papers.letter
    : papers.a4;
}

/** pt per drawing px: the CSS reference pixel (96 per inch), so print is the screen at 100%. */
export const pointsPerPixel = 0.75;

/** The margin on every side, in pt (12.7 mm). The page number sits in the bottom margin. */
export const pageMargin = 36;

/** One page: the part of the drawing it shows, in drawing px, and where it is in the grid. */
export type PrintPage = {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  /** 1-based, in print order: down the first column, then the next (like spreadsheets). */
  readonly number: number;
  readonly column: number;
  readonly row: number;
};

/** The pages of a drawing on a paper. */
export type Pagination = {
  readonly paper: Paper;
  readonly orientation: 'portrait' | 'landscape';
  /** The page size in pt, turned for the orientation. */
  readonly pageWidth: number;
  readonly pageHeight: number;
  readonly margin: number;
  readonly pointsPerPixel: number;
  readonly pages: ReadonlyArray<PrintPage>;
};

/**
 * Cuts a drawing into pages (R-EXP-03). The drawing is never shrunk, so the thinnest line stays
 * 0.75pt and the smallest text 9pt (visual design 9.2). A drawing larger than a page is cut into
 * columns, and each column into pages, where a cut goes between blocks rather than through
 * one (02-layout 5). The orientation is the one that needs fewer pages; portrait on a tie.
 * Pages with nothing but paper are left out.
 */
export function paginate(layout: LayoutResult, paper: Paper): Pagination {
  const portrait = paginateAs(layout, paper, 'portrait');
  const landscape = paginateAs(layout, paper, 'landscape');
  return landscape.pages.length < portrait.pages.length ? landscape : portrait;
}

function paginateAs(
  layout: LayoutResult,
  paper: Paper,
  orientation: Pagination['orientation'],
): Pagination {
  const [pageWidth, pageHeight] =
    orientation === 'portrait' ? [paper.width, paper.height] : [paper.height, paper.width];
  const areaWidth = (pageWidth - 2 * pageMargin) / pointsPerPixel;
  const areaHeight = (pageHeight - 2 * pageMargin) / pointsPerPixel;
  const leaves = layout.nodes.map(leafBox);
  const columns = cuts(
    layout.width,
    areaWidth,
    leaves.map((box) => [box.x, box.x + box.width] as const),
  );
  const pages: PrintPage[] = [];
  columns.forEach(([x0, x1], column) => {
    const inColumn = leaves.filter((box) => box.x < x1 && box.x + box.width > x0);
    const rows = cuts(
      layout.height,
      areaHeight,
      inColumn.map((box) => [box.y, box.y + box.height] as const),
    );
    rows.forEach(([y0, y1], row) => {
      const isEmpty = !inColumn.some((box) => box.y < y1 && box.y + box.height > y0);
      if (!isEmpty) {
        pages.push({
          x: x0,
          y: y0,
          width: x1 - x0,
          height: y1 - y0,
          number: pages.length + 1,
          column,
          row,
        });
      }
    });
  });
  if (pages.length === 0) {
    // An empty drawing still prints one page.
    pages.push({
      x: 0,
      y: 0,
      width: layout.width,
      height: layout.height,
      number: 1,
      column: 0,
      row: 0,
    });
  }
  return {
    paper,
    orientation,
    pageWidth,
    pageHeight,
    margin: pageMargin,
    pointsPerPixel,
    pages,
  };
}

/**
 * The box a cut must not go through: a block that holds text (a process or call block, the
 * header of a control block, a diagram header). A control block's sides may be cut.
 */
function leafBox(node: LayoutNode): Box {
  switch (node.kind) {
    case 'process':
    case 'call':
    case 'diagramHead':
    case 'missingDefault':
      return node.box;
    case 'loop':
    case 'if':
    case 'case':
      return node.head;
  }
}

/**
 * Cuts `[0, length]` into spans of at most `room`. A cut goes at the farthest block edge that no
 * block spans, if one is past a quarter of the room; otherwise right at the room's end.
 */
function cuts(
  length: number,
  room: number,
  spans: ReadonlyArray<readonly [number, number]>,
): ReadonlyArray<readonly [number, number]> {
  const isClean = (at: number): boolean => !spans.some(([from, to]) => from < at && at < to);
  const edges = [...new Set(spans.flat())].filter(isClean).sort((a, b) => a - b);
  const result: (readonly [number, number])[] = [];
  let start = 0;
  while (length - start > room + 1e-6) {
    const limit = start + room;
    const clean = edges.filter((edge) => edge >= start + room / 4 && edge <= limit).at(-1);
    const end = clean ?? limit;
    result.push([start, end]);
    start = end;
  }
  result.push([start, length]);
  return result;
}
