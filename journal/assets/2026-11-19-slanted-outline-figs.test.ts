// The pictures of M63 (외곽선과 PDF의 기울임, BUG-15), drawn by the app's own renderer.
// Run from the editor package (no config, globals on, root here):
//   cd src/packages/editor
//   npx vitest run --root ../../../journal/assets --globals --environment node 2026-11-19-slanted-outline-figs
// Writes 2026-11-19-slanted-outline-figs.json next to this file; …-build.mjs puts it in the page.
//
// The renderer is not changed. "Slanted outlines" draws each slanted text element through the
// renderer's outlines and shears it about its baseline here.
import { writeFileSync } from 'node:fs';

import type { Doc, Id, SceneElement } from '../../src/packages/core/src/index';
import { renderDoc } from '../../src/packages/core/src/index';
import { toSvg } from '../../src/packages/core/src/render/to-svg';
import { usedCodePoints } from '../../src/packages/core/src/render/used-code-points';
import { blockFont, readGlyphOutlines } from '../../src/packages/fonts/src/index';
import { createNodeSubsetter, readFontFile } from '../../src/packages/fonts/node/index';
import { buildExample, method } from '../../src/packages/editor/src/examples/build-example';

/** About the slant browsers give a font without an italic face. */
const shear = -14;

const spec = method('receive(frame)', [
  'n = read(frame);',
  ['range', '', ['crc = check(frame);', 'seq = next(seq);']],
  ['if', 'n > 0', ['store(frame);', 'count = count + 1;'], ['drop(frame);']],
  ['while', 'more(frame)', ['step(frame);', 'flush();']],
  'return n;',
] as never);

type Node = { readonly id?: Id; readonly kind?: string; readonly [key: string]: unknown };

/** The ids to fold: the fold region, the If's first branch and the loop. */
function foldedIds(doc: Doc): Id[] {
  const ids: Id[] = [];
  const walk = (value: unknown): void => {
    if (Array.isArray(value)) {
      value.forEach(walk);
    } else if (value !== null && typeof value === 'object') {
      const node = value as Node;
      if (node.kind === 'while' && node.id !== undefined) ids.push(node.id);
      if (node.kind === 'if') {
        const first = (node.branches as ReadonlyArray<Node> | undefined)?.[0] ?? (node.yes as Node | undefined);
        if (first?.id !== undefined) ids.push(first.id);
      }
      Object.values(node).forEach(walk);
    }
  };
  walk(doc.content.diagrams);
  const folds = JSON.stringify(doc.content.diagrams).match(/"id":"(f\d+)"/g) ?? [];
  for (const f of folds) ids.push(f.slice(6, -1) as Id);
  return ids;
}

const isSlanted = (e: SceneElement): boolean => e.kind === 'text' && e.runs.some((r) => r.isItalic === true);

it('draws the M63 pictures', async () => {
  const base = buildExample([spec], { headStyle: 'title', locale: 'ko' });
  const doc = { ...base, view: { ...base.view, folded: foldedIds(base), bands: true } } as Doc;
  const rendering = renderDoc(doc);
  const scene = rendering.scene;
  const slanted = scene.elements.filter(isSlanted);
  if (slanted.length < 2) throw new Error(`expected slanted texts, found ${slanted.length}`);

  const ttf = await readFontFile(blockFont.files.ttf);
  const outlines = readGlyphOutlines(ttf);
  const { width, height } = rendering.svg;
  const paper = (doc.content.settings.theme, '#ffffff');
  const frame = (content: string): string =>
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}"><rect width="100%" height="100%" fill="${paper}"/>${content}</svg>`;

  const sheared = slanted
    .map((e) => {
      if (e.kind !== 'text') return '';
      const drawn = toSvg({ ...scene, elements: [e] } as never, { outlines }).content;
      return `<g transform="translate(${e.x} ${e.y}) skewX(${shear}) translate(${-e.x} ${-e.y})">${drawn}</g>`;
    })
    .join('');
  const upright = scene.elements.map((e) =>
    e.kind === 'text' ? { ...e, runs: e.runs.map(({ isItalic: _drop, ...run }) => run) } : e,
  );

  const out: Record<string, string> = {
    saved: frame(rendering.svg.content),
    outlined: frame(toSvg(scene as never, { outlines }).content),
    fixed: frame(toSvg({ ...scene, elements: scene.elements.filter((e) => !isSlanted(e)) } as never, { outlines }).content + sheared),
    plain: frame(toSvg({ ...scene, elements: upright } as never).content),
  };

  const subsetter = await createNodeSubsetter();
  out.fontFamily = blockFont.familyName;
  out.fontWoff = Buffer.from(subsetter.subsetToWoff(ttf, [...usedCodePoints(scene as never)])).toString('base64');
  out.slanted = slanted.map((e) => (e.kind === 'text' ? e.runs.map((r) => r.text).join('') : '')).join(' | ');
  writeFileSync(new URL('./2026-11-19-slanted-outline-figs.json', import.meta.url), JSON.stringify(out, null, 1));
});
