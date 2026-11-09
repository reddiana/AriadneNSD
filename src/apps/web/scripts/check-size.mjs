// The size budget of the web build (QA-09, 07-testing 5): what a first visit downloads, gzipped.
// Run after `pnpm --filter @ariadne-nsd/web build`:  node apps/web/scripts/check-size.mjs
//
// A first visit downloads index.html, the files it links (the entry script and the stylesheet),
// the scripts those import statically, and slice 0 of the screen font (Latin, punctuation,
// symbols). The other slices come only when their characters are on screen (ADR-0040), and the
// hb-subset wasm and the TTF for saving at the first edit, so they are not counted.
//
// The budget was the size after the screen font was cut into slices (2026-11-03, 176 KB) plus
// 20%: 212 KB. Folding and opened call blocks (R-EDIT-13 ~ 16) took the first download to 213 KB
// on 2026-11-04, so it is 230 KB, about 8% over that. It was 540 KB before (450 KB at the first
// build, 2026-11-01). The design has no number for the web bundle yet; raise it on purpose, in
// the commit that needs more.
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

const budgetKb = 230;

const dist = resolve(dirname(fileURLToPath(import.meta.url)), '../dist');

/**
 * Files the page or a script loads at once: `src`/`href` in HTML, static `import … from` in JS.
 * A `<link rel="alternate">` (the guide for AI assistants, /llms.txt) is not loaded by browsers.
 */
function linkedFiles(file) {
  const text = readFileSync(file, 'utf8').replace(/<link\b[^>]*\brel="alternate"[^>]*>/g, '');
  const pattern = file.endsWith('.html')
    ? /(?:src|href)="(\.\/[^"]+)"/g
    : /(?:^|[;\s])import(?:[^"'()]*?from)?\s*["'](\.\.?\/[^"']+)["']/g;
  return [...text.matchAll(pattern)].map((match) => resolve(dirname(file), match[1]));
}

const firstDownload = new Set([join(dist, 'index.html')]);
const queue = [...firstDownload];
while (queue.length > 0) {
  const file = queue.shift();
  if (!file.endsWith('.html') && !file.endsWith('.js')) {
    continue;
  }
  for (const linked of linkedFiles(file)) {
    if (!firstDownload.has(linked)) {
      firstDownload.add(linked);
      queue.push(linked);
    }
  }
}
for (const name of readdirSync(join(dist, 'assets'))) {
  if (/\.00-[\w-]+\.woff2$/.test(name)) {
    firstDownload.add(join(dist, 'assets', name));
  }
}

let total = 0;
for (const file of [...firstDownload].sort()) {
  const gzipped = gzipSync(readFileSync(file), { level: 9 }).length;
  total += gzipped;
  console.log(
    `${(gzipped / 1024).toFixed(1).padStart(8)} KB  ${relative(dist, file).split(sep).join('/')}`,
  );
}
const totalKb = total / 1024;
console.log(`${totalKb.toFixed(1).padStart(8)} KB  first download (gzip), budget ${budgetKb} KB`);

if (totalKb > budgetKb) {
  console.error(`The first download is over the budget by ${(totalKb - budgetKb).toFixed(1)} KB.`);
  process.exit(1);
}
