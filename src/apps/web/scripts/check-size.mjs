// The size budget of the web build (QA-09, 07-testing 5): what a first visit downloads, gzipped.
// Run after `pnpm --filter @ariadne-nsd/web build`:  node apps/web/scripts/check-size.mjs
//
// A first visit downloads index.html, the files it links (the entry script and the stylesheet),
// the scripts those import statically, and the screen font (woff2). The hb-subset wasm and the
// TTF for saving are fetched later, at the first edit, so they are not counted.
//
// The budget is the size at the first build (2026-11-01, 450 KB) plus 20%. The design has
// no number for the web bundle yet; raise it on purpose, in the commit that needs more.
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

const budgetKb = 540;

const dist = resolve(dirname(fileURLToPath(import.meta.url)), '../dist');

/** Files the page or a script loads at once: `src`/`href` in HTML, static `import … from` in JS. */
function linkedFiles(file) {
  const text = readFileSync(file, 'utf8');
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
  if (name.endsWith('.woff2')) {
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
