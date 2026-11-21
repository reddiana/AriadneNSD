// Makes the gallery's link preview picture, pages/og-image.png (1200×630): the logo, the title and
// three of the diagrams. Like site/make-og-image.mjs it is not run on every build: run it again
// when the diagrams or the logo change, and commit the PNG.
//   node apps/gallery/scripts/make-og-image.mjs   (in src/, after pnpm install)
// Playwright's Chromium renders the diagrams' embedded fonts (the same version as apps/web's).
import { readFile } from 'node:fs/promises';

import { chromium } from '@playwright/test';

const root = new URL('../', import.meta.url);

const asset = async (url, type) =>
  `data:${type};base64,${(await readFile(url)).toString('base64')}`;
const journal = new URL('../../../journal/assets/', root);
const logo = await asset(new URL('2026-10-10-logo-aegean-lady-tiny.svg', journal), 'image/svg+xml');
const word = await asset(new URL('2026-10-11-wordmark-n1-warm-grey.svg', journal), 'image/svg+xml');
const entries = JSON.parse(await readFile(new URL('generated/gallery.json', root), 'utf8'));
const diagram = (id) =>
  asset(new URL(`generated/${id}.en.ns.svg`, root), 'image/svg+xml').then((src) => ({
    src,
    size: entries.find((e) => e.id === id).sizes.en,
  }));
const [a, b, c] = await Promise.all(['dijkstra', 'kmp', 'hanoi'].map(diagram));

const html = `<!doctype html><html><head><style>
body{margin:0;width:1200px;height:630px;overflow:hidden;background:#F7F1EA;font-family:'Segoe UI',system-ui,sans-serif;position:relative}
.text{position:absolute;left:72px;top:72px;width:470px;display:grid;gap:22px}
.brand{display:flex;align-items:center;gap:18px}
.brand img:first-child{width:76px;height:76px;border-radius:14px}
h1{margin:0;font-size:62px;line-height:1.05;color:#1b2129;font-weight:700;letter-spacing:-0.01em}
p{margin:0;font-size:27px;line-height:1.35;color:#5b5049}
.d{position:absolute;background:#fff;border-radius:10px;box-shadow:0 10px 34px rgba(60,40,20,.22);padding:14px}
.d img{display:block}
</style></head><body>
<div class="text">
<div class="brand"><img src="${logo}"><img src="${word}" width="300"></div>
<h1>Algorithm Gallery</h1>
<p>${String(entries.length)} algorithms, from binary search to Raft, as Nassi–Shneiderman diagrams</p>
</div>
<div class="d" style="left:64px;top:445px;transform:rotate(-1.5deg)"><img src="${c.src}" width="${String(c.size.width * 0.6)}"></div>
<div class="d" style="left:560px;top:40px;transform:rotate(-2deg)"><img src="${b.src}" width="${String(b.size.width * 0.62)}"></div>
<div class="d" style="left:700px;top:170px;transform:rotate(1deg)"><img src="${a.src}" width="${String(a.size.width * 0.95)}"></div>
</body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.setContent(html, { waitUntil: 'load' });
// eslint-disable-next-line no-undef -- runs in the page
await page.evaluate(() => document.fonts.ready);
const out = new URL('pages/og-image.png', root);
await page.screenshot({ path: out.pathname.replace(/^\/([A-Za-z]:)/, '$1') });
await browser.close();
console.log('made', out.pathname);
