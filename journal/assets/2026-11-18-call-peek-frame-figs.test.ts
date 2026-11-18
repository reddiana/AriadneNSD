// The pictures of M60 (접기 영역과 같은 모양의 펴 보인 호출 블록), drawn by the app's own renderer.
// Run from the editor package (no config, globals on, root here):
//   cd src/packages/editor
//   npx vitest run --root ../../../journal/assets --globals --environment node 2026-11-18-call-peek-frame-figs
// Writes 2026-11-18-call-peek-frame-figs.json next to this file; …-build.mjs puts it in the page.
//
// The renderer is not changed. The opened call is redrawn here by editing the scene (the display
// list) the way foldFrame in build-scene.ts paints an unfolded fold region: a 3px border whose
// middle is 1px inside the box, over the band. The layout is the app's: size.peek-inset and
// size.nest-inset are both 4px, so frames nest the same way.
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

// The band's words in violet, the counterpart of fold.name. The one color the themes do not have
// yet; the border and the band's fill are the existing peek.edge and peek.band.
const peekName: Record<string, string> = {
  default: '#5f459f',
  dark: '#cdbcf5',
  'high-contrast': '#e3c9ff',
  print: '#000000',
};

const body = [
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
];

// The maintainer's picture (inbox 2026-11-17): main() calls binary_search and opens it.
const search = method('binary_search(a, n, key)', body as never);
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

// The same blocks as a fold region of main(), to lay beside the opened call.
const mainInline = event('main()', [
  'int a[] = {2, 3, 5, 7, 11, 13, 17};',
  [
    'doWhile',
    'key != 0',
    [
      'key = read_int();',
      ['range', '이진 탐색', body],
      ['if', 'i >= 0', ['printf("%d번째\\n", i);'], ['printf("없음\\n");']],
    ],
  ],
] as never);

// With fold regions: the call inside a fold region of main(), and a fold region inside the Method.
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

// Opened inside an opened call: binary_search calls mid_of, and both are opened.
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

/** The document with its call blocks opened, each inside the one before, in a theme. */
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
type Head = Extract<LayoutNode, { kind: 'diagramHead' }>;

const codePoints = new Set<number>();
const foldEdge = 3;

function picture(doc: Doc, redraw: boolean): string {
  const result = r.layout(doc);
  const theme = r.themeFor(doc.content.settings.theme);
  const scene = r.buildScene(result, theme);
  const colors = theme.colors as Record<string, string>;
  const peeks = result.nodes.filter((n): n is Peek => n.kind === 'peek');
  let elements: SceneElement[] = [...scene.elements];
  if (redraw) {
    const peekIds = new Set(peeks.map((p) => p.id));
    // The words inside are ordinary words, as in a fold region; the band's words turn violet.
    elements = elements.map((e) => {
      if (e.kind !== 'text' || e.fill !== colors['peek.text']) return e;
      const fill = peekIds.has(e.blockId as Id) ? peekName[doc.content.settings.theme] : colors['text.primary'];
      return { ...e, fill: fill as string };
    });
    for (const p of peeks) {
      // No white line and no dashed border.
      elements = elements.filter((e) => !(e.blockId === p.id && e.kind === 'polyline'));
      const offset = (foldEdge - 1) / 2;
      elements.push({
        kind: 'rect',
        blockId: p.id,
        x: p.box.x + offset,
        y: p.box.y + offset,
        width: p.box.width - 2 * offset,
        height: p.box.height - 2 * offset,
        fill: 'none',
        stroke: colors['peek.edge'] as string,
        strokeWidth: foldEdge,
      });
    }
  }
  const edited = { ...scene, elements };
  for (const c of r.usedCodePoints(edited as never)) codePoints.add(c);
  const svg = r.toSvg(edited as never);
  const paper = colors.paper as string;
  // Only main(): the first diagram, up to the room before the next one.
  const heads = result.nodes.filter((n): n is Head => n.kind === 'diagramHead').map((n) => n.box.x);
  const next = heads.filter((x) => x > Math.min(...heads));
  const width = next.length > 0 ? Math.min(...next) - 64 : svg.width;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${svg.height}" width="${width}" height="${svg.height}"><rect width="100%" height="100%" fill="${paper}"/>${svg.content}</svg>`;
}

it('draws the M60 pictures', async () => {
  const out: Record<string, string> = {};
  const plain = [main, search];
  const folds = [mainFolds, searchFolds];
  const nested = [main, searchNested, midOf];

  out.now = picture(build(plain, 'default', false), false);
  out.after = picture(build(plain, 'default', false), true);
  out.foldTwin = picture(build([mainInline], 'default', true), false);
  out.nested = picture(build(nested, 'default', false), true);
  out.withFolds = picture(build(folds, 'default', true), true);
  out.dark = picture(build(plain, 'dark', false), true);
  out.hc = picture(build(plain, 'high-contrast', false), true);
  out.print = picture(build(plain, 'print', false), true);
  out.foldPrint = picture(build([mainInline], 'print', true), false);

  const subsetter = await createNodeSubsetter();
  const ttf = await readFontFile(blockFont.files.ttf);
  out.fontFamily = blockFont.familyName;
  out.fontWoff = Buffer.from(subsetter.subsetToWoff(ttf, [...codePoints])).toString('base64');
  writeFileSync(new URL('./2026-11-18-call-peek-frame-figs.json', import.meta.url), JSON.stringify(out, null, 1));
});
