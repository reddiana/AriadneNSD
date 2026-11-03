// Text as outlines with the bundled font (R-FMT-10): the paths take the room the layout measured.
// It lives outside src/ because it reads the font with node:fs (like golden.test.ts).
import { blockFont, readGlyphOutlines } from '@ariadne-nsd/fonts';
import type { GlyphOutlines } from '@ariadne-nsd/fonts';
import { readFontFile } from '@ariadne-nsd/fonts/node';
import { beforeAll, describe, expect, it } from 'vitest';

import type { Doc } from '../src/index';
import { glyphPathData, measureLine, placeGlyphs, renderDoc } from '../src/index';

let outlines: GlyphOutlines;

beforeAll(async () => {
  outlines = readGlyphOutlines(await readFontFile(blockFont.files.ttf));
});

const doc: Doc = {
  content: {
    settings: { textKind: 'plain', theme: 'default', headStyle: 'shape', locale: 'ko' },
    diagrams: [
      {
        id: 'd1',
        head: null,
        body: {
          blocks: [
            { id: 'b1', kind: 'process', text: 'i ← i + 1' },
            {
              id: 'b2',
              kind: 'if',
              text: '합계 > 0',
              yes: {
                id: 'r1',
                body: { blocks: [{ id: 'b3', kind: 'process', text: 'x' }], folds: [] },
              },
              no: {
                id: 'r2',
                body: { blocks: [{ id: 'b4', kind: 'process', text: '' }], folds: [] },
              },
            },
          ],
          folds: [],
        },
      },
    ],
  },
  view: { folded: [], opened: [], bands: true, resultSymbol: '←' },
};

describe('outlined text with the bundled font', () => {
  it('spans the width the layout measured and stays on its line', () => {
    const { scene } = renderDoc(doc);
    const texts = scene.elements.filter((element) => element.kind === 'text');
    expect(texts.length).toBeGreaterThan(3);
    for (const element of texts) {
      const line = element.runs.map((run) => run.text).join('');
      const glyphs = placeGlyphs(element, outlines);
      expect(glyphs, line).not.toBeNull();
      const numbers = glyphPathData(glyphs ?? [], String)
        .split(/[MLQZ ]/)
        .filter((part) => part !== '')
        .map(Number);
      const xs = numbers.filter((_, index) => index % 2 === 0);
      const ys = numbers.filter((_, index) => index % 2 === 1);
      const first = glyphs?.[0]?.x ?? element.x;
      const measured = measureLine(line, element.fontSize);
      // Inside the measured box (rounded up to whole px), with a little room for side bearings.
      expect(Math.min(...xs), line).toBeGreaterThanOrEqual(first - 1);
      expect(Math.max(...xs), line).toBeLessThanOrEqual(first + measured + 1);
      expect(Math.max(...ys), line).toBeLessThanOrEqual(element.y + element.fontSize * 0.3);
      expect(Math.min(...ys), line).toBeGreaterThanOrEqual(element.y - element.fontSize * 1.1);
    }
  });
});
