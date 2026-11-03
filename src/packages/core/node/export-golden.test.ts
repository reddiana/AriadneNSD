// Golden files of the exports (07-testing 3): the pure SVG (R-EXP-02) and the PDF (R-EXP-03,
// written uncompressed so the file reads as text) of one document, compared byte for byte.
// Update them with the core golden files: pnpm --filter @ariadne-nsd/core golden:update
import { blockFont, readGlyphOutlines } from '@ariadne-nsd/fonts';
import { createNodeSubsetter, readFontFile } from '@ariadne-nsd/fonts/node';
import { describe, expect, it } from 'vitest';

import type { Block, Doc } from '../src/index';
import {
  assembleImageSvg,
  checkDrawing,
  openSvgFile,
  paginate,
  papers,
  renderDoc,
} from '../src/index';
import { writePdf } from '../pdf/index';

const process = (id: string, text: string): Block => ({ id, kind: 'process', text });

/** A Method long enough for more than one A4 page, with a branch and Hangul. */
const doc: Doc = {
  content: {
    settings: { textKind: 'plain', theme: 'default', headStyle: 'title', locale: 'ko' },
    diagrams: [
      {
        id: 'd1',
        head: { kind: 'method', text: 'sum(n)' },
        body: {
          blocks: [
            process('b1', '합계 ← 0'),
            ...Array.from({ length: 50 }, (_, index) =>
              process(`b${String(index + 10)}`, `합계 ← 합계 + ${String(index + 1)}`),
            ),
            {
              id: 'b2',
              kind: 'if',
              text: '합계 > 100',
              yes: { id: 'r1', body: { blocks: [process('b3', 'print(합계)')], folds: [] } },
              no: { id: 'r2', body: { blocks: [process('b4', '')], folds: [] } },
            },
          ],
          folds: [],
        },
      },
    ],
  },
  view: { folded: [], opened: [], bands: true, resultSymbol: '←' },
};

describe('export golden files', () => {
  it('the pure SVG is saved as the golden file', async () => {
    const rendering = renderDoc(doc);
    const subsetter = await createNodeSubsetter();
    const ttf = await readFontFile(blockFont.files.ttf);
    const svg = assembleImageSvg(rendering.svg, [
      { family: blockFont.familyName, woff: subsetter.subsetToWoff(ttf, rendering.codePoints) },
    ]);
    expect(openSvgFile(svg)).toMatchObject({ ok: false, reason: 'noModel' });
    expect(checkDrawing(svg)).toBe('unknown');
    await expect(svg).toMatchFileSnapshot('../golden/export/sum.svg');
  });

  it('the PDF is saved as the golden file', async () => {
    const rendering = renderDoc(doc);
    const outlines = readGlyphOutlines(await readFontFile(blockFont.files.ttf));
    const pagination = paginate(rendering.layout, papers.a4);
    expect(pagination.pages.length).toBeGreaterThan(1);
    const bytes = writePdf(rendering.scene, pagination, outlines, {
      title: 'sum',
      isCompressed: false,
    });
    await expect(Buffer.from(bytes).toString('latin1')).toMatchFileSnapshot(
      '../golden/export/sum.pdf',
    );
  });
});
