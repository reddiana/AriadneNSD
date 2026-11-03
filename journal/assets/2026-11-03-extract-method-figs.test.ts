// The pictures of M54 (새 Method로 빼기 시안), drawn by the app's own renderer and overlay.
// Run from the editor package (no config, globals on, root here):
//   cd src/packages/editor
//   npx vitest run --root ../../../journal/assets --globals --environment node 2026-11-03-extract-method-figs
// Writes 2026-11-03-extract-method-figs.json next to this file; …-build.py puts it in the page.
import { writeFileSync } from 'node:fs';

import { renderDoc } from '../../src/packages/core/src/index';
import { blockFont } from '../../src/packages/fonts/src/index';
import { createNodeSubsetter, readFontFile } from '../../src/packages/fonts/node/index';
import type { Block, Doc, Id, Seq } from '../../src/packages/core/src/index';
import { fieldBox, overlayContent, editColors } from '../../src/packages/editor/src/dom/overlay';
import type { DiagramSpec } from '../../src/packages/editor/src/examples/build-example';
import { buildExample, event, method } from '../../src/packages/editor/src/examples/build-example';
import { indexDoc } from '../../src/packages/editor/src/model/doc-index';
import type { EditField } from '../../src/packages/editor/src/state/editor-state';
import { selectRange } from '../../src/packages/editor/src/state/selection';

const settings = { headStyle: 'shape', locale: 'ko' } as const;

// The merge sort example of the app (src/packages/editor/src/examples/merge-sort.ts), with an
// Event that calls it and a second Method, so where the new Method goes can be seen.
const mergeTail = [
  'i, j, tmp = lo, mid, []',
  [
    'while',
    'i < mid and j < hi',
    [['if', 'a[i] <= a[j]', ['tmp.append(a[i])', 'i += 1'], ['tmp.append(a[j])', 'j += 1']]],
  ],
  'tmp += a[i:mid] + a[j:hi]',
  'a[lo:hi] = tmp',
] as const;
const mergeHead = [
  ['if', 'hi - lo < 2', ['return'], ['']],
  'mid = (lo + hi) >> 1',
  ['call', 'merge_sort(a, lo, hi)', 'a, lo, mid'],
  ['call', 'merge_sort(a, lo, hi)', 'a, mid, hi'],
] as const;
const main = event('정렬 버튼을 누름', [
  ['call', 'read_numbers()', '', 'a'],
  ['call', 'merge_sort(a, lo, hi)', 'a, 0, len(a)'],
  ['if', 'is_sorted(a)', [['call', 'show(a)', 'a']], ['오류를 알린다']],
]);
// Methods after merge_sort, so that "at the end of the Methods" is far from it.
const others = [
  method('read_numbers()', ['a = []', ['while', '입력이 남음', ['a.append(다음 수)']], 'return a'] as never),
  method('is_sorted(a)', [['for', 'i in 1 .. len(a) - 1', [['if', 'a[i-1] > a[i]', ['return False'], ['']]]], 'return True'] as never),
  method('show(a)', [['for', 'x in a', ['print(x)']]]),
];
const sortBefore = method('merge_sort(a, lo, hi)', [...mergeHead, ...mergeTail] as never);
const sortAfter = (name: string) =>
  method('merge_sort(a, lo, hi)', [...mergeHead, ['call', name, name.includes('(') ? 'a, lo, mid, hi' : '']] as never);
const merge = (name: string) => method(name, [...mergeTail] as never);

// The sum and average of the 5-minute tour (src/apps/manual), in a diagram without a header.
const sumLoop = ['while', 'i < n', ['sum ← sum + a[i]', 'i ← i + 1']] as const;
const plain = (body: DiagramSpec['body']): DiagramSpec =>
  ({ head: null, body }) as unknown as DiagramSpec;

type Mark =
  | { readonly sel: readonly [string, string] }
  | { readonly selHead: string }
  | { readonly field: 'head'; readonly head: string }
  | { readonly field: 'call'; readonly text: string; readonly part: 'args' | 'result' };

/** Builds the document; diagrams with `head: null` are made without a header. */
function build(specs: ReadonlyArray<DiagramSpec>): Doc {
  const doc = buildExample(
    specs.map((s) => (s.head === null ? { ...s, head: { kind: 'event', text: '—' } } : s)) as never,
    settings,
  );
  const diagrams = doc.content.diagrams.map((d, i) =>
    specs[i]?.head === null ? { ...d, head: null } : d,
  );
  return { ...doc, content: { ...doc.content, diagrams } };
}

function findBlock(doc: Doc, pred: (b: Block) => boolean): Id {
  let found: Id | null = null;
  const walk = (seq: Seq): void => {
    for (const b of seq.blocks) {
      if (found === null && pred(b)) found = b.id;
      for (const key of ['body', 'yes', 'no', 'otherwise'] as const) {
        const inner = (b as never as Record<string, { body?: Seq } & Seq>)[key];
        if (inner != null) walk('blocks' in inner ? inner : (inner.body as Seq));
      }
      if (b.kind === 'case') for (const arm of b.arms) walk(arm.body);
    }
  };
  for (const d of doc.content.diagrams) walk(d.body);
  if (found === null) throw new Error('no block');
  return found;
}
const byText = (doc: Doc, text: string) =>
  findBlock(doc, (b) => ('text' in b && b.text === text) || ('args' in b && b.args === text));
const headId = (doc: Doc, text: string) =>
  doc.content.diagrams.find((d) => d.head?.text === text)?.id as Id;

const codePoints = new Set<number>();

function picture(specs: ReadonlyArray<DiagramSpec>, mark: Mark | null): string {
  const doc = build(specs);
  const r = renderDoc(doc);
  for (const c of r.codePoints) codePoints.add(c);
  const index = indexDoc(doc.content);
  let selection = null;
  let extra = '';
  if (mark !== null && 'sel' in mark) {
    selection = selectRange(index, byText(doc, mark.sel[0]), byText(doc, mark.sel[1]));
  } else if (mark !== null && 'selHead' in mark) {
    selection = { kind: 'head', diagram: headId(doc, mark.selHead) } as const;
  } else if (mark !== null) {
    const field: EditField =
      mark.field === 'head'
        ? { kind: 'head', diagram: headId(doc, mark.head) }
        : { kind: 'call', block: byText(doc, mark.text), part: mark.part };
    const box = fieldBox(r.layout, field);
    if (box !== null) {
      // The inline editor: the field's box outlined, like the app's edit field (visual design 3.4).
      extra = `<rect x="${box.x + 1}" y="${box.y + 1}" width="${box.width - 1}" height="${box.height - 1}" fill="none" stroke="${editColors['edit.field']}" stroke-width="2" stroke-dasharray="5 3"/>`;
    }
  }
  const over = overlayContent({
    layout: r.layout,
    index,
    selection,
    hover: null,
    drop: null,
    dragged: [],
    paper: '#ffffff',
  });
  const { width, height, content } = r.svg as never as { width: number; height: number; content: string };
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">${content}${over}${extra}</svg>`;
}

it('draws the M54 pictures', async () => {
  const name = 'merge(a, lo, mid, hi)';
  const out: Record<string, string> = {
    // Q1: where the new Method goes. Before, and the two places, with the name being typed.
    q1Before: picture([main, sortBefore, ...others], { sel: ['i, j, tmp = lo, mid, []', 'a[lo:hi] = tmp'] }),
    q1After1: picture([main, sortAfter('Method 1'), merge('Method 1'), ...others], { field: 'head', head: 'Method 1' }),
    q1After2: picture([main, sortAfter('Method 1'), ...others, merge('Method 1')], { field: 'head', head: 'Method 1' }),
    // Q2: after the name is typed and Enter.
    q2After1: picture([main, sortAfter(name), merge(name), ...others], { sel: ['a, lo, mid, hi', 'a, lo, mid, hi'] }),
    q2After2: picture([main, sortAfter(name), merge(name), ...others], { field: 'call', text: 'a, lo, mid, hi', part: 'result' }),
    q2After3: picture([main, sortAfter(name), merge(name), ...others], { selHead: name }),
    // Q3: m on blocks of a diagram without a header.
    q3Before: picture([plain(['sum ← 0', 'i ← 0', sumLoop as never, 'avg ← sum / n'])], { sel: ['i ← 0', 'i < n'] }),
    q3After1: picture(
      [plain(['sum ← 0', ['call', 'sum_from(a, n)', 'a, n'] as never, 'avg ← sum / n']), method('sum_from(a, n)', ['i ← 0', sumLoop as never])],
      { field: 'head', head: 'sum_from(a, n)' },
    ),
    q3After2: picture([method('Method 1', ['sum ← 0', 'i ← 0', sumLoop as never, 'avg ← sum / n'])], { field: 'head', head: 'Method 1' }),
  };
  const subsetter = await createNodeSubsetter();
  const ttf = await readFontFile(blockFont.files.ttf);
  out.fontFamily = blockFont.familyName;
  out.fontWoff = Buffer.from(subsetter.subsetToWoff(ttf, [...codePoints])).toString('base64');
  writeFileSync(new URL('./2026-11-03-extract-method-figs.json', import.meta.url), JSON.stringify(out, null, 1));
});
