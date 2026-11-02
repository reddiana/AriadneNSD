import { writeFile } from 'node:fs/promises';
import { it } from 'vitest';
import type { Block, Doc } from '../src/index';
import { renderDoc } from '../src/index';
const seq = (...blocks: Block[]) => ({ blocks, folds: [] });
const p = (id: string, text: string): Block => ({ id, kind: 'process', text });
const doc = (...blocks: Block[]): Doc => ({
  content: { settings: { textKind: 'plain', theme: 'default', headStyle: 'shape' } as any, diagrams: [{ id: 'd1', head: null, body: seq(...blocks) }] },
  view: { folded: [], opened: [], bands: true, resultSymbol: '←' } as any,
});
it('figs', async () => {
  const before = doc(p('a', 'i ← 0'), p('b', 'sum ← sum + a[i]'), p('c', 'i ← i + 1'));
  const after = doc(p('a', 'i ← 0'), { id: 'w', kind: 'while', text: 'i < n', body: seq(p('b', 'sum ← sum + a[i]'), p('c', 'i ← i + 1')) } as Block);
  for (const [n, d] of [['before', before], ['after', after]] as const)
    await writeFile(new URL(`../../../../journal/assets/2026-11-02-manual-toc-wrap-${n}.svg`, import.meta.url), (()=>{const s:any=renderDoc(d,{locale:"ko"}).svg; return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${s.width} ${s.height}" width="${s.width}" height="${s.height}">${s.content}</svg>`;})());
});
