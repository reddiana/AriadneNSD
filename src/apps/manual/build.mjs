// Builds the user guide (DR-0020) into dist/: pages/en.html → dist/index.html (/manual/),
// pages/ko.html → dist/ko/index.html (/manual/ko/), with the style and the pictures.
// The shortcut table comes from generated/keys-<lang>.html, which the app wrote
// (apps/web/manual-shots). Pictures and the table are refreshed with:
//   pnpm --filter @ariadne-nsd/web manual-shots
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';

const root = new URL('./', import.meta.url);
const dist = new URL('dist/', root);

const pages = [
  { lang: 'en', out: 'index.html' },
  { lang: 'ko', out: 'ko/index.html' },
];

await rm(dist, { recursive: true, force: true });
await mkdir(new URL('ko/', dist), { recursive: true });
await cp(new URL('img/', root), new URL('img/', dist), { recursive: true });
await cp(new URL('pages/style.css', root), new URL('style.css', dist));

for (const { lang, out } of pages) {
  const page = await readFile(new URL(`pages/${lang}.html`, root), 'utf8');
  const keys = await readFile(new URL(`generated/keys-${lang}.html`, root), 'utf8');
  if (!page.includes('<!-- keys -->')) throw new Error(`pages/${lang}.html has no <!-- keys -->`);
  await writeFile(new URL(out, dist), page.replace('<!-- keys -->', keys));
}
process.stdout.write('manual: dist/index.html (en), dist/ko/index.html (ko)\n');
