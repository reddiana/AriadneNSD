// 글꼴 추리기 스파이크: harfbuzz의 hb-subset(wasm)으로 Pretendard에서 쓰인 글자만 추린다. 걸린 시간, 크기, 두 번 돌려 같은 바이트가 나오는지를 찍는다
// 쓰는 법: npm install harfbuzzjs 한 폴더에서  node 2026-10-13-font-subset-spike.mjs
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const wasmPath = require.resolve('harfbuzzjs/dist/harfbuzz-subset.wasm');
const wasm = readFileSync(wasmPath);
const font = readFileSync('C:/Windows/Fonts/Pretendard-Regular.ttf');

let t0 = performance.now();
const { instance: { exports: hb } } = await WebAssembly.instantiate(wasm, {});
const tInit = performance.now() - t0;

function subset(text) {
  const ptr = hb.malloc(font.byteLength);
  new Uint8Array(hb.memory.buffer).set(font, ptr);
  const blob = hb.hb_blob_create(ptr, font.byteLength, 2, 0, 0);
  const face = hb.hb_face_create(blob, 0);
  hb.hb_blob_destroy(blob);
  const input = hb.hb_subset_input_create_or_fail();
  const set = hb.hb_subset_input_unicode_set(input);
  for (const ch of new Set(text)) hb.hb_set_add(set, ch.codePointAt(0));
  const sub = hb.hb_subset_or_fail(face, input);
  hb.hb_subset_input_destroy(input);
  if (!sub) throw new Error('subset failed');
  const out = hb.hb_face_reference_blob(sub);
  const off = hb.hb_blob_get_data(out, 0), len = hb.hb_blob_get_length(out);
  const bytes = new Uint8Array(hb.memory.buffer).slice(off, off + len);
  hb.hb_blob_destroy(out); hb.hb_face_destroy(sub); hb.hb_face_destroy(face); hb.free(ptr);
  return bytes;
}
const sha = b => createHash('sha256').update(b).digest('hex').slice(0, 12);
const small = 'p ← partition(a, lo, hi) 피벗보다 작은 값을 왼쪽으로 옮긴다 while if return 참 거짓 ⋯ 블록 12개';
// 큰 문서 흉내: 한글 800자 + 라틴 전부
let big = ''; for (let c = 0x20; c < 0x7f; c++) big += String.fromCharCode(c); for (let i = 0; i < 800; i++) big += String.fromCharCode(0xac00 + i * 13);

console.log('wasm', (wasm.length / 1024).toFixed(0), 'KB, 준비', tInit.toFixed(0), 'ms');
for (const [name, text] of [['작은 그림 (글자 ' + new Set(small).size + '종)', small], ['큰 문서 (글자 ' + new Set(big).size + '종)', big]]) {
  t0 = performance.now(); const a = subset(text); const t1 = performance.now() - t0;
  t0 = performance.now(); const b = subset(text); const t2 = performance.now() - t0;
  const shuffled = subset([...text].reverse().join(''));
  console.log(name, '|', (a.length / 1024).toFixed(1), 'KB (ttf), base64', (Math.ceil(a.length / 3) * 4 / 1024).toFixed(1), 'KB |', t1.toFixed(0), 'ms,', t2.toFixed(0), 'ms | 두 번 같은가', sha(a) === sha(b), '| 글자 순서를 바꿔도 같은가', sha(a) === sha(shuffled), sha(a));
}
