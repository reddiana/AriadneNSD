// The picture of 04-visual-design 7.2 (visual-design-document-marks.png), drawn by the app's own
// renderer: quicksort opens its partition call, and partition has the fold region "준비".
// Run from the editor package (no config, globals on, root here):
//   cd src/packages/editor
//   npx vitest run --root ../../../journal/assets --globals --environment node 2026-11-18-visual-design-marks
// Writes 2026-11-18-visual-design-marks.html next to this file; take the PNG of it with Chrome at
// twice the size (the size is in the page's <title>).
import { writeFileSync } from 'node:fs';

import type { Block, Doc, Id } from '../../src/packages/core/src/index';
import { layout } from '../../src/packages/core/src/layout/layout';
import { buildScene } from '../../src/packages/core/src/render/build-scene';
import { defaultTheme } from '../../src/packages/core/src/render/theme';
import { toSvg } from '../../src/packages/core/src/render/to-svg';
import { usedCodePoints } from '../../src/packages/core/src/render/used-code-points';
import { blockFont } from '../../src/packages/fonts/src/index';
import { createNodeSubsetter, readFontFile } from '../../src/packages/fonts/node/index';
import { buildExample, method } from '../../src/packages/editor/src/examples/build-example';

const quicksort = method('quicksort(a, lo, hi)', [
  [
    'if',
    'lo < hi',
    [
      ['call', 'partition(a, lo, hi)', 'a, lo, hi', 'p'],
      ['call', 'quicksort(a, lo, hi)', 'a, lo, p - 1'],
      ['call', 'quicksort(a, lo, hi)', 'a, p + 1, hi'],
    ],
    [''],
  ],
]);
const partition = method('partition(a, lo, hi)', [
  ['range', '준비', ['pivot = a[hi];', 'i = lo - 1;', 'j = lo;']],
  [
    'while',
    'j < hi',
    [['if', 'a[j] <= pivot', ['i++;', 'swap(a[i], a[j]);'], ['']], 'j++;'],
  ],
  'swap(a[i + 1], a[hi]);',
  'return i + 1;',
]);

/** The first call block of a list of blocks, looking inside the branches of an If. */
function firstCall(blocks: ReadonlyArray<Block>): Id | undefined {
  for (const block of blocks) {
    if (block.kind === 'call') return block.id;
    if (block.kind === 'if') {
      const inside = firstCall(block.yes.body.blocks);
      if (inside !== undefined) return inside;
    }
  }
  return undefined;
}

it('draws the picture of the document marks', async () => {
  const built = buildExample([quicksort, partition], { headStyle: 'shape', locale: 'ko' });
  const call = firstCall(built.content.diagrams[0]?.body.blocks ?? []);
  if (call === undefined) throw new Error('no call block');
  const doc: Doc = { ...built, view: { ...built.view, opened: [[call]], bands: true } };

  const scene = buildScene(layout(doc), defaultTheme, 'c');
  const svg = toSvg(scene);
  const subsetter = await createNodeSubsetter();
  const ttf = await readFontFile(blockFont.files.ttf);
  const woff = Buffer.from(subsetter.subsetToWoff(ttf, [...usedCodePoints(scene)])).toString('base64');
  const face = `@font-face{font-family:'${blockFont.familyName}';src:url(data:font/woff;base64,${woff})}`;
  const page =
    `<!doctype html><meta charset="utf-8"><title>${String(svg.width)}x${String(svg.height)}</title>` +
    `<style>${face}html,body{margin:0;background:#fff}svg{display:block}</style>` +
    `<svg xmlns="http://www.w3.org/2000/svg" width="${String(svg.width)}" height="${String(svg.height)}" ` +
    `viewBox="0 0 ${String(svg.width)} ${String(svg.height)}" font-family="${scene.fontFamily.replaceAll('"', "'")}">` +
    `${svg.content}</svg>`;
  writeFileSync(new URL('./2026-11-18-visual-design-marks.html', import.meta.url), page);
});
