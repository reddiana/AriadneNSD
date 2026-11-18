// The pictures of M66 (다른 문서를 찾을 수 없는 호출 블록), drawn by the app's own renderer.
// Run from the editor package (no config, globals on, root here):
//   cd src/packages/editor
//   npx vitest run --root ../../../journal/assets --globals --environment node 2026-11-19-external-call-figs
// Writes 2026-11-19-external-call-figs.json next to this file; …-build.mjs puts it in the page.
//
// The renderer is not changed. The call block's target is set to `external` (another file) or
// `lost` (the target is gone). The mark of the edit layer is drawn here over the picture.
import { writeFileSync } from 'node:fs';

import type { Doc, Id } from '../../src/packages/core/src/index';
import { renderDoc } from '../../src/packages/core/src/index';
import { usedCodePoints } from '../../src/packages/core/src/render/used-code-points';
import { blockFont } from '../../src/packages/fonts/src/index';
import { createNodeSubsetter, readFontFile } from '../../src/packages/fonts/node/index';
import { buildExample, event, method } from '../../src/packages/editor/src/examples/build-example';

const main = event('main()', [
  'int a[] = {5, 2, 9};',
  ['call', 'sort(a, n)', 'a, 3', 'r'],
  'print(r);',
] as never);
const sort = method('sort(a, n)', ['return a;']);

type Target = Readonly<Record<string, unknown>>;

/** The document of main() alone, its call block pointing at `target`. */
function docWith(target: Target): { doc: Doc; call: Id } {
  const base = buildExample([main, sort], { headStyle: 'title', locale: 'ko' });
  let call = '' as Id;
  const swap = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(swap);
    if (value !== null && typeof value === 'object') {
      const node = value as Record<string, unknown>;
      if (node.kind === 'call') {
        call = node.id as Id;
        return { ...node, target };
      }
      return Object.fromEntries(Object.entries(node).map(([k, v]) => [k, swap(v)]));
    }
    return value;
  };
  const first = swap(base.content.diagrams[0]);
  return { doc: { ...base, content: { ...base.content, diagrams: [first] } } as Doc, call };
}

it('draws the M66 pictures', async () => {
  const external = docWith({ kind: 'external', file: 'sort.ns.svg', diagram: 'd9', lastName: 'sort' });
  const lost = docWith({ kind: 'lost', lastName: 'sort' });
  const a = renderDoc(external.doc);
  const b = renderDoc(lost.doc);
  const frame = (width: number, height: number, content: string): string =>
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}"><rect width="100%" height="100%" fill="#ffffff"/>${content}</svg>`;

  const box = a.layout.boxes.get(external.call);
  if (box === undefined) throw new Error('no box for the call block');
  const orange = '#d0500b';
  const mark =
    `<rect x="${box.x + 1.5}" y="${box.y + 1.5}" width="${box.width - 2}" height="${box.height - 2}" fill="none" stroke="${orange}" stroke-width="1" stroke-dasharray="3 3"/>` +
    `<circle cx="${box.x + box.width - 26}" cy="${box.y + box.height / 2}" r="8" fill="${orange}"/>` +
    `<text x="${box.x + box.width - 26}" y="${box.y + box.height / 2 + 4}" text-anchor="middle" font-family="sans-serif" font-size="12" font-weight="700" fill="#ffffff">?</text>`;

  const { width, height } = a.svg;
  const out: Record<string, string> = {
    solid: frame(width, height, a.svg.content),
    dashed: frame(b.svg.width, b.svg.height, b.svg.content),
    marked: frame(width, height, a.svg.content + mark),
  };
  const ttf = await readFontFile(blockFont.files.ttf);
  const subsetter = await createNodeSubsetter();
  const points = new Set([...usedCodePoints(a.scene as never), ...usedCodePoints(b.scene as never)]);
  out.fontFamily = blockFont.familyName;
  out.fontWoff = Buffer.from(subsetter.subsetToWoff(ttf, [...points])).toString('base64');
  writeFileSync(new URL('./2026-11-19-external-call-figs.json', import.meta.url), JSON.stringify(out, null, 1));
});
