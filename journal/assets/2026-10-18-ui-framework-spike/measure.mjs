// 같은 도구 모음을 넷으로 빌드해 크기를 잰다.
// 쓰는 법: node measure.mjs <node_modules가 있는 폴더>
//   그 폴더에 esbuild, svelte@5, react, react-dom, preact를 설치해 둔다.
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const mods = path.resolve(process.argv[2], 'node_modules');
const req = createRequire(path.join(mods, 'x.js'));
const esbuild = req('esbuild');
const { compile } = await import(pathToFileURL(path.join(mods, 'svelte/src/compiler/index.js')).href);
const ver = (n) => JSON.parse(readFileSync(path.join(mods, n, 'package.json'))).version;
const svelte = { name: 'svelte', setup(b) {
  b.onLoad({ filter: /\.svelte$/ }, (a) => ({ contents: compile(readFileSync(a.path, 'utf8'), { filename: a.path }).js.code, loader: 'js' }));
} };
const runs = [
  ['1 프레임워크 없음', 'vanilla.js', {}],
  ['2 Svelte ' + ver('svelte'), 'svelte-main.js', { plugins: [svelte], conditions: ['browser', 'production'] }],
  ['3 React ' + ver('react'), 'react.jsx', { jsx: 'automatic' }],
  ['4 Preact ' + ver('preact'), 'preact.jsx', { jsx: 'automatic', jsxImportSource: 'preact' }],
];
mkdirSync('out', { recursive: true });
const rows = [];
for (const [name, entry, opt] of runs) {
  const r = await esbuild.build({ entryPoints: [entry], bundle: true, minify: true, format: 'esm', write: false,
    nodePaths: [mods], define: { 'process.env.NODE_ENV': '"production"' }, ...opt });
  const code = r.outputFiles[0].contents;
  const file = 'out/' + entry.replace(/\.\w+$/, '') + '.js';
  writeFileSync(file, code);
  rows.push({ name, min: code.length, gz: gzipSync(code, { level: 9 }).length });
}
for (const r of rows) console.log(`${r.name.padEnd(26)} ${(r.min / 1024).toFixed(1).padStart(7)} KB  gzip ${(r.gz / 1024).toFixed(1).padStart(6)} KB`);
writeFileSync('sizes.json', JSON.stringify(rows, null, 2));
