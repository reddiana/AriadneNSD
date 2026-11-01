// 좁은 화면(휴대폰)에서 감싸기 · 되돌리기 · 다시 · 도움말의 자리를 세 가지로 찍어 한 장으로 잇는다.
// MVP의 빌드를 그대로 띄우고, 2 · 3번은 페이지 안에서 버튼을 툴바로 옮겨 흉내 낸다(코드는 바꾸지 않음).
// 쓰는 법: src/apps/web에서 `pnpm build && pnpm preview --port 4173`을 띄운 뒤
//   node journal/assets/2026-11-01-narrow-wrap-options.mjs [주소] [저장할 PNG]
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const repo = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const { chromium, devices } = await import(
  pathToFileURL(join(repo, 'src/apps/web/node_modules/@playwright/test/index.mjs')).href
);
const url = process.argv[2] ?? 'http://localhost:4173/';
const out = process.argv[3] ?? join(repo, 'journal/assets/2026-11-01-narrow-wrap-options.png');

const { defaultBrowserType: _browser, ...phone } = devices['Galaxy S9+'];
const options = [
  { no: 1, title: '1. 지금: 아래 줄에 되돌리기 · 다시 · 감싸기 · 도움말', move: 'none' },
  { no: 2, title: '2. 감싸기만 툴바로, 아래 줄은 되돌리기 · 다시 · 도움말', move: 'wrap' },
  { no: 3, title: '3. 아래 줄 없앰: 모두 툴바로', move: 'all' },
];

const browser = await chromium.launch();
const shots = [];
for (const option of options) {
  const context = await browser.newContext({ ...phone, deviceScaleFactor: 2 });
  const page = await context.newPage();
  await page.addInitScript(() => {
    localStorage.setItem('ariadne-nsd.setting.examples.welcomed', 'true');
  });
  await page.goto(url);
  await page.waitForSelector('html[data-ready="true"]');
  // 예제 하나를 열어 다이어그램이 보이게
  await page.locator('.ans-toolbar [data-command="help.examples"]').click();
  await page.locator('[data-example="binary-search"]').click();
  await page.waitForTimeout(300);
  await page.evaluate((move) => {
    const toolbar = document.querySelector('.ans-toolbar');
    const bottom = document.querySelector('.ans-bottombar');
    const zoom = [...toolbar.querySelectorAll('.ans-tool-root')].at(-1);
    const wrap = bottom.querySelector('.ans-tool-root');
    const sep = () => Object.assign(document.createElement('span'), { className: 'ans-sep' });
    if (move === 'wrap') {
      toolbar.insertBefore(wrap, zoom);
      toolbar.insertBefore(sep(), zoom);
    }
    if (move === 'all') {
      const [undo, redo] = bottom.querySelectorAll(':scope > button');
      const help = [...bottom.querySelectorAll(':scope > button')].at(-1);
      toolbar.insertBefore(undo, toolbar.firstChild);
      toolbar.insertBefore(redo, undo.nextSibling);
      toolbar.insertBefore(sep(), redo.nextSibling);
      toolbar.insertBefore(wrap, zoom);
      toolbar.insertBefore(sep(), zoom);
      toolbar.appendChild(help);
      bottom.style.display = 'none';
    }
    for (const label of toolbar.querySelectorAll('.ans-tool-root .ans-tool-label')) {
      if (move !== 'none' && label.textContent === '감싸기') label.style.display = 'none';
    }
  }, option.move);
  await page.waitForTimeout(200);
  shots.push({ ...option, png: (await page.screenshot()).toString('base64') });
  await context.close();
}

const page = await browser.newPage({ viewport: { width: 1400, height: 1000 }, deviceScaleFactor: 1 });
await page.setContent(`<!doctype html><meta charset="utf-8">
<body style="margin:0;padding:24px;background:#f4f5f8;font:18px/1.4 system-ui,sans-serif;display:flex;gap:24px">
${shots
  .map(
    (shot) => `<figure style="margin:0;width:430px">
  <figcaption style="margin-bottom:10px;font-weight:600">${shot.title}</figcaption>
  <img src="data:image/png;base64,${shot.png}" style="width:412px;border:1px solid #ccd;border-radius:10px">
</figure>`,
  )
  .join('')}
</body>`);
await page.screenshot({ path: out, fullPage: true });
await browser.close();
console.log(`saved ${out}`);
