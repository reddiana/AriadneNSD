// PDF export (R-EXP-03): a well-formed vector PDF, one page per print page, the same bytes for
// the same drawing.
import type { Glyph, GlyphOutlines } from '@ariadne-nsd/fonts';
import { describe, expect, it } from 'vitest';

import type { Block } from '../model/types';
import { renderDoc } from '../render/render-doc';
import type { TextRun } from '../render/scene';
import { docOf, process } from '../render/testing';
import { paginate, papers } from './paginate';
import { writePdf } from './pdf';

/** A triangle for every character but a space; `漢` is missing. */
const triangle: Glyph = {
  advance: 500,
  commands: [
    { kind: 'move', x: 0, y: 0 },
    { kind: 'line', x: 400, y: 0 },
    { kind: 'quad', cx: 300, cy: 400, x: 200, y: 700 },
    { kind: 'close' },
  ],
};
const outlines: GlyphOutlines = {
  unitsPerEm: 1000,
  glyphOf: (codePoint) =>
    codePoint === 0x6f22 ? null : codePoint === 0x20 ? { advance: 500, commands: [] } : triangle,
  notdef: { advance: 500, commands: [] },
};

const many = (count: number): Block[] =>
  Array.from({ length: count }, (_, index) =>
    process(`b${String(index + 1)}`, `step ${String(index)}`),
  );

function pdfOf(blocks: Block[], title = 'Sort'): string {
  const rendering = renderDoc(docOf(...blocks));
  const bytes = writePdf(rendering.scene, paginate(rendering.layout, papers.a4), outlines, {
    title,
  });
  return String.fromCharCode(...bytes);
}

describe('writePdf', () => {
  it('T-1018: writes a PDF 1.4 file whose cross-reference table points at its objects', () => {
    const pdf = pdfOf([process('b1', 'x = read()')]);
    expect(pdf.startsWith('%PDF-1.4\n')).toBe(true);
    expect(pdf.endsWith('%%EOF\n')).toBe(true);
    const startxref = Number(/startxref\n(\d+)\n/.exec(pdf)?.[1]);
    expect(pdf.slice(startxref, startxref + 4)).toBe('xref');
    const entries = [...pdf.slice(startxref).matchAll(/(\d{10}) 00000 n /g)].map((match) =>
      Number(match[1]),
    );
    entries.forEach((offset, index) => {
      expect(pdf.slice(offset).startsWith(`${String(index + 1)} 0 obj\n`)).toBe(true);
    });
  });

  it('T-1019: has one A4 page per print page, and the document name as its title', () => {
    const pdf = pdfOf(many(150), '정렬');
    const count = Number(/\/Type \/Pages \/Kids \[[^\]]*\] \/Count (\d+)/.exec(pdf)?.[1]);
    expect(count).toBeGreaterThan(2);
    expect(pdf.match(/\/Type \/Page /g)).toHaveLength(count);
    expect(pdf).toContain('/MediaBox [0 0 595.28 841.89]');
    expect(pdf).toContain('/Title <FEFFC815B82C>');
    expect(pdf).toContain('/Filter /FlateDecode');
  });

  it('T-1020: draws each glyph once as a form, for each way it is painted', () => {
    // One glyph shape for all letters; filled for text, and filled for the page numbers.
    const onePage = pdfOf([process('b1', 'abc')]);
    expect(onePage.match(/\/Subtype \/Form/g)).toHaveLength(1);
    // A missing character is drawn as a box: a second shape.
    const missing = pdfOf([process('b1', 'a漢')]);
    expect(missing.match(/\/Subtype \/Form/g)).toHaveLength(2);
  });

  it('T-1021: gives the same bytes for the same drawing', () => {
    expect(pdfOf(many(40))).toBe(pdfOf(many(40)));
    expect(pdfOf(many(40))).not.toBe(pdfOf(many(41)));
  });
});

describe('writePdf with slanted text', () => {
  /** An uncompressed PDF of one block, each text run replaced by the runs of `restyle`. */
  function plainPdfOf(restyle: (run: TextRun) => ReadonlyArray<TextRun>): string {
    const rendering = renderDoc(docOf(process('b1', 'ab')));
    const scene = {
      ...rendering.scene,
      elements: rendering.scene.elements.map((element) =>
        element.kind === 'text' ? { ...element, runs: element.runs.flatMap(restyle) } : element,
      ),
    };
    const pagination = paginate(rendering.layout, papers.a4);
    const options = { title: 'Sort', isCompressed: false };
    return String.fromCharCode(...writePdf(scene, pagination, outlines, options));
  }
  const asIs = (run: TextRun): ReadonlyArray<TextRun> => [run];
  const italic = (run: TextRun): ReadonlyArray<TextRun> => [{ ...run, isItalic: true }];
  /** The triangle's outline as written in a form, upright and leaning 1/4 to the right. */
  const upright = '0 0 m 400 0 l 333.333 266.667 266.667 500 200 700 c h';
  const slanted = '0 0 m 400 0 l 400 266.667 391.667 500 375 700 c h';
  /** Where each glyph is put: its matrix without the form's name. */
  const placements = (pdf: string): string[] =>
    [...pdf.matchAll(/q (\S+ 0 0 \S+ \S+ \S+) cm \/G\d+ Do Q/g)].map((match) => match[1] ?? '');

  it('T-1312 · BUG-15: leans the outline of a slanted run and leaves regular text upright', () => {
    const pdf = plainPdfOf(italic);
    expect(pdf).toContain(`${slanted} f`);
    expect(pdf).not.toContain(`${upright} f`);
    expect(plainPdfOf(asIs)).toContain(`${upright} f`);
    expect(plainPdfOf(asIs)).not.toContain(`${slanted} f`);
  });

  it('T-1313 · BUG-15: draws a slanted run and a regular run of one element with their own forms', () => {
    const pdf = plainPdfOf((run) => [
      { ...run, text: 'a', isItalic: true },
      { ...run, text: 'b' },
    ]);
    expect(pdf.match(/\/Subtype \/Form/g)).toHaveLength(2);
    expect(pdf).toContain(`${slanted} f`);
    expect(pdf).toContain(`${upright} f`);
  });

  it('T-1314 · BUG-15: slants synthetic bold with its glyphs', () => {
    const pdf = plainPdfOf((run) => [{ ...run, weight: 600, isItalic: true }]);
    expect(pdf).toContain(`${slanted} B`);
    expect(pdf).not.toContain(`${upright} B`);
  });

  it('T-1315 · BUG-15: puts slanted glyphs where upright ones go, and gives the same bytes again', () => {
    expect(placements(plainPdfOf(italic)).length).toBeGreaterThan(0);
    expect(placements(plainPdfOf(italic))).toEqual(placements(plainPdfOf(asIs)));
    expect(plainPdfOf(italic)).toBe(plainPdfOf(italic));
  });
});
