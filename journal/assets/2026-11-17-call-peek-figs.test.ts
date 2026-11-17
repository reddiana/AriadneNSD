// The pictures of M59 (펴 보인 호출 블록의 바깥 선 시안), drawn by the app's own renderer.
// Run from the editor package (no config, globals on, root here):
//   cd src/packages/editor
//   npx vitest run --root ../../../journal/assets --globals --environment node 2026-11-17-call-peek-figs
// Writes 2026-11-17-call-peek-figs.json next to this file; …-build.mjs puts it in the page.
//
// The renderer is not changed. Each option is made here by editing the scene (the display list)
// before it becomes SVG. Note: `size.peek-inset` (4px) does not indent the opened Method's blocks
// today (placePeek passes `framed: false`); only fold regions nested inside get the gap.
import { writeFileSync } from 'node:fs';

import type { Doc, Id, LayoutNode, LayoutResult, SceneElement, Theme } from '../../src/packages/core/src/index';
import { layout } from '../../src/packages/core/src/layout/layout';
import { buildScene } from '../../src/packages/core/src/render/build-scene';
import { themeFor } from '../../src/packages/core/src/render/theme';
import { toSvg } from '../../src/packages/core/src/render/to-svg';
import { usedCodePoints } from '../../src/packages/core/src/render/used-code-points';
import { blockFont } from '../../src/packages/fonts/src/index';
import { createNodeSubsetter, readFontFile } from '../../src/packages/fonts/node/index';
import type { DiagramSpec } from '../../src/packages/editor/src/examples/build-example';
import { buildExample, event, method } from '../../src/packages/editor/src/examples/build-example';

const settings = { headStyle: 'title', locale: 'ko' } as const;

// The maintainer's picture (inbox 2026-11-17): main() calls binary_search and opens it.
const search = method('binary_search(a, n, key)', [
  'lo = 0;',
  'hi = n - 1;',
  [
    'while',
    'lo <= hi',
    [
      'mid = lo + (hi - lo) / 2;',
      ['if', 'a[mid] == key', ['return mid;'], [['if', 'a[mid] < key', ['lo = mid + 1;'], ['hi = mid - 1;']]]],
    ],
  ],
  'return -1;',
] as never);
const main = event('main()', [
  'int a[] = {2, 3, 5, 7, 11, 13, 17};',
  [
    'doWhile',
    'key != 0',
    [
      'key = read_int();',
      ['call', 'binary_search(a, n, key)', 'a, 7, key', 'i'],
      ['if', 'i >= 0', ['printf("%d번째\\n", i);'], ['printf("없음\\n");']],
    ],
  ],
] as never);

// With fold regions: the call inside a fold region of main(), and a fold region inside the
// Method, so a fold region's border and the opened call's outline meet in one picture.
const searchFolds = method('binary_search(a, n, key)', [
  ['range', '범위를 정한다', ['lo = 0;', 'hi = n - 1;']],
  [
    'while',
    'lo <= hi',
    [
      'mid = lo + (hi - lo) / 2;',
      ['if', 'a[mid] == key', ['return mid;'], [['if', 'a[mid] < key', ['lo = mid + 1;'], ['hi = mid - 1;']]]],
    ],
  ],
  'return -1;',
] as never);
const mainFolds = event('main()', [
  'int a[] = {2, 3, 5, 7, 11, 13, 17};',
  [
    'doWhile',
    'key != 0',
    [
      'key = read_int();',
      [
        'range',
        '찾아서 알린다',
        [
          ['call', 'binary_search(a, n, key)', 'a, 7, key', 'i'],
          ['if', 'i >= 0', ['printf("%d번째\\n", i);'], ['printf("없음\\n");']],
        ],
      ],
    ],
  ],
] as never);

// Opened inside an opened call: binary_search calls mid_of, and both are opened (Q15 T2).
const searchNested = method('binary_search(a, n, key)', [
  'lo = 0;',
  'hi = n - 1;',
  [
    'while',
    'lo <= hi',
    [
      ['call', 'mid_of(lo, hi)', 'lo, hi', 'mid'],
      ['if', 'a[mid] == key', ['return mid;'], [['if', 'a[mid] < key', ['lo = mid + 1;'], ['hi = mid - 1;']]]],
    ],
  ],
  'return -1;',
] as never);
const midOf = method('mid_of(lo, hi)', ['m = lo + (hi - lo) / 2;', 'return m;']);

/**
 * The document with its call blocks opened (each one inside the one before: main's call, then
 * the call inside the Method it opens), in a theme, with name bands on or off.
 */
function build(specs: ReadonlyArray<DiagramSpec>, theme: string, bands: boolean): Doc {
  const doc = buildExample(specs, settings);
  const calls: Id[] = [];
  const walk = (blocks: ReadonlyArray<never>): void => {
    for (const b of blocks as ReadonlyArray<Record<string, never>>) {
      if ((b as { kind: string }).kind === 'call') calls.push((b as { id: Id }).id);
      for (const key of ['body', 'yes', 'no'] as const) {
        const inner = b[key] as { blocks?: never[]; body?: { blocks: never[] } } | undefined;
        if (inner?.blocks !== undefined) walk(inner.blocks);
        else if (inner?.body !== undefined) walk(inner.body.blocks);
      }
    }
  };
  for (const d of doc.content.diagrams) walk(d.body.blocks as never);
  if (calls.length === 0) throw new Error('no call block');
  return {
    content: { ...doc.content, settings: { ...doc.content.settings, theme } },
    view: { ...doc.view, opened: calls.map((_, i) => calls.slice(0, i + 1)), bands },
  } as Doc;
}

type Renderer = {
  readonly layout: (doc: Doc) => LayoutResult;
  readonly buildScene: (r: LayoutResult, t: Theme) => { fontFamily: string; elements: SceneElement[] };
  readonly toSvg: (s: never) => { width: number; height: number; content: string };
  readonly themeFor: (id: string) => Theme;
  readonly usedCodePoints: (s: never) => ReadonlyArray<number>;
};
const r = { layout, buildScene, toSvg, themeFor, usedCodePoints } as unknown as Renderer;

type Peek = Extract<LayoutNode, { kind: 'peek' }>;

/** How the opened call is drawn: the renderer as it is, or one of the options of CP1. */
type Option = 'now' | 'band' | 'tint' | 'bar' | 'both';

const codePoints = new Set<number>();

function picture(doc: Doc, option: Option): string {
  const result = r.layout(doc);
  const theme = r.themeFor(doc.content.settings.theme);
  const scene = r.buildScene(result, theme);
  const colors = theme.colors as Record<string, string>;
  const peeks = result.nodes.filter((n): n is Peek => n.kind === 'peek');
  let elements: SceneElement[] = [...scene.elements];
  if (option !== 'now') {
    for (const p of peeks) {
      // Every option: no white line and no dashed border, the outline a block line.
      elements = elements.filter((e) => !(e.blockId === p.id && e.kind === 'polyline'));
      const { x, y, width, height } = p.box;
      const top = p.band.y + p.band.height;
      if (option === 'tint' || option === 'both') {
        // The opened Method's blocks take the call block's fill: an opened call reads as one
        // large call block. Lines, triangles and texts stay.
        const fills = new Set(
          ['block.process', 'block.branch', 'block.loop', 'block.folded', 'paper'].map((t) => colors[t]),
        );
        elements = elements.map((e) =>
          e.kind === 'rect' && fills.has(e.fill) && e.x >= x && e.x + e.width <= x + width && e.y >= top && e.y + e.height <= y + height
            ? { ...e, fill: colors['block.call'] as string }
            : e,
        );
      }
      elements.push({
        kind: 'rect',
        blockId: p.id,
        x,
        y,
        width,
        height,
        fill: 'none',
        stroke: colors['line.structure'] as string,
        strokeWidth: 1,
      });
      if (option === 'bar' || option === 'both') {
        elements.push({
          kind: 'polyline',
          blockId: p.id,
          points: [
            [x + 2, top + 1],
            [x + 2, y + height - 1],
          ],
          stroke: colors['peek.edge'] as string,
          strokeWidth: 3,
          dash: null,
          isRoundCap: false,
        });
      }
    }
  }
  const edited = { ...scene, elements };
  for (const c of r.usedCodePoints(edited as never)) codePoints.add(c);
  const svg = r.toSvg(edited as never);
  const paper = colors.paper as string;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svg.width} ${svg.height}" width="${svg.width}" height="${svg.height}"><rect width="100%" height="100%" fill="${paper}"/>${svg.content}</svg>`;
}

it('draws the M59 pictures', async () => {
  const out: Record<string, string> = {};
  const plain = [main, search];
  const folds = [mainFolds, searchFolds];

  out.now = picture(build(plain, 'default', false), 'now');
  out.nowFolds = picture(build(folds, 'default', true), 'now');
  out.nowNested = picture(build([main, searchNested, midOf], 'default', false), 'now');
  for (const option of ['band', 'tint', 'bar', 'both'] as const) {
    out[option] = picture(build(plain, 'default', false), option);
    out[`${option}Nested`] = picture(build([main, searchNested, midOf], 'default', false), option);
    out[`${option}Folds`] = picture(build(folds, 'default', true), option);
    out[`${option}Dark`] = picture(build(plain, 'dark', false), option);
    out[`${option}Hc`] = picture(build(plain, 'high-contrast', false), option);
    out[`${option}Print`] = picture(build(plain, 'print', false), option);
  }

  const subsetter = await createNodeSubsetter();
  const ttf = await readFontFile(blockFont.files.ttf);
  out.fontFamily = blockFont.familyName;
  out.fontWoff = Buffer.from(subsetter.subsetToWoff(ttf, [...codePoints])).toString('base64');
  writeFileSync(new URL('./2026-11-17-call-peek-figs.json', import.meta.url), JSON.stringify(out, null, 1));
});
