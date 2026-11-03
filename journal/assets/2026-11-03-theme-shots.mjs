// 시각 디자인 8장의 그림: 같은 그림을 네 테마로 (골든 파일 sample*.svg를 나란히 찍음).
// 저장소 루트에서: node journal/assets/2026-11-03-theme-shots.mjs (src/에서 pnpm install 뒤)
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(new URL('../../src/apps/web/package.json', import.meta.url));
const { chromium } = require('@playwright/test');
const root = new URL('../../src/packages/core/golden/render/', import.meta.url);
const names = ['sample', 'sample-dark', 'sample-high-contrast', 'sample-print'];
const html = names
  .map((n) => `<div style="display:inline-block;margin:0 12px 0 0;vertical-align:top;box-shadow:0 0 0 1px #c8cdd6">${readFileSync(new URL(`${n}.svg`, root), 'utf8')}</div>`)
  .join('');
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
await page.setContent(`<body style="margin:0;padding:12px;background:#eef1f6;width:max-content;display:inline-block;line-height:0">${html}</body>`);
await page.waitForTimeout(300);
await page.screenshot({ path: new URL('../../docs/02-ux-design/assets/visual-design-themes.png', import.meta.url).pathname.slice(1), clip: await page.evaluate(() => { const r = document.body.getBoundingClientRect(); return { x: 0, y: 0, width: r.width, height: r.height }; }) });
await browser.close();
