// Builds M61 (인라인 에디터와 선택 하이라이트): opens the real app, starts editing four kinds of blocks,
// and takes each picture twice: as the app draws it now, and with the selection highlight hidden
// (what visual design 7.1 asks for). The app's code is not changed.
// Needs the dev server:  cd src && pnpm dev
// Run:  node journal/assets/2026-11-19-inline-editor-selection-build.cjs
const { createRequire } = require('node:module');
const { readFileSync, writeFileSync } = require('node:fs');
const { join } = require('node:path');

const req = createRequire(join(__dirname, '../../src/apps/web/package.json'));
const { chromium } = req('@playwright/test');

const scenes = [
  { id: 'process', label: '처리 블록', text: 'mid = lo + (hi - lo) / 2;' },
  { id: 'branch', label: 'If의 조건', text: 'a[mid] == key' },
  { id: 'loop', label: '반복의 조건', text: 'lo <= hi' },
  { id: 'call', label: '호출 블록', text: 'i ← binary_search(a, 7, key)' },
];

async function capture() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1400, height: 950 }, deviceScaleFactor: 2, locale: 'ko-KR' });
  await page.goto('http://localhost:5173/');
  await page.waitForSelector('html[data-ready="true"]');
  await page.locator('.ans-backdrop button', { hasText: '이진 탐색' }).click();
  await page.waitForSelector('.ans-document text');
  await page.addStyleTag({ content: '.ans-inline-editor { caret-color: transparent !important; }' });
  const out = {};
  for (const scene of scenes) {
    const target = page.locator('.ans-document text').filter({ hasText: scene.text }).first();
    await target.click();
    await page.waitForTimeout(150);
    await page.keyboard.press('Enter');
    const editor = page.locator('.ans-inline-editor');
    await editor.waitFor({ state: 'visible' });
    await page.mouse.move(1200, 800);
    await page.waitForTimeout(250);
    const box = await editor.boundingBox();
    // The whole selected block, so that the highlight's extent shows.
    const block = await page.evaluate(() => {
      const rect = [...document.querySelectorAll('.ans-canvas svg rect')].find(
        (r) => r.getAttribute('fill') === 'none' && r.getAttribute('stroke-width') === '3' && r.getAttribute('stroke') === '#d0500b',
      );
      const b = rect.getBoundingClientRect();
      return { x: b.x, y: b.y, right: b.right, bottom: b.bottom };
    });
    const left = Math.min(box.x, block.x) - 28;
    const top = Math.min(box.y, block.y) - 28;
    const clip = {
      x: Math.max(0, left),
      y: Math.max(0, top),
      width: Math.max(box.x + box.width, block.right) + 28 - left,
      height: Math.max(box.y + box.height, block.bottom) + 28 - top,
    };
    const now = await page.screenshot({ clip });
    const hidden = await page.evaluate(() => {
      const rects = [...document.querySelectorAll('.ans-canvas svg rect')].filter(
        (r) => r.getAttribute('fill') === 'none' && r.getAttribute('stroke-width') === '3' && r.getAttribute('stroke') === '#d0500b',
      );
      rects.forEach((r) => { r.style.display = 'none'; });
      return rects.length;
    });
    if (hidden !== 1) throw new Error(`${scene.id}: expected one selection highlight, found ${hidden}`);
    await page.waitForTimeout(100);
    const spec = await page.screenshot({ clip });
    out[scene.id] = { now: now.toString('base64'), spec: spec.toString('base64') };
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
  }
  await browser.close();
  return out;
}

const figure = (b64, alt) => `<img src="data:image/png;base64,${b64}" alt="${alt}">`;

function page(shots) {
  const rows = scenes.map((s) => `
  <section class="scene">
    <h3>${s.label}</h3>
    <div class="pair">
      <figure class="rec"><figcaption><span class="n">1</span>하이라이트 없음 ★</figcaption>${figure(shots[s.id].spec, `${s.label}: 선택 하이라이트 없이 인라인 에디터만 보임`)}</figure>
      <figure><figcaption><span class="n">2</span>하이라이트 유지 (지금 앱)</figcaption>${figure(shots[s.id].now, `${s.label}: 선택 하이라이트와 인라인 에디터가 함께 보임`)}</figure>
    </div>
  </section>`).join('');
  return `<title>M61 편집 중의 선택 표시</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700&display=swap">
<style>
/* 시안 페이지: M59 · M60과 같은 틀. 그림은 실제 앱의 스크린숏. */
:root {
  --bg: #f6f7f9; --paper: #ffffff; --fg: #1d2330; --muted: #5d6676; --line: #d9dee7;
  --accent: #5b4a9a; --accent-soft: #eeeaf7; --star: #b4690e;
  --font-body: "Noto Sans KR", "Apple SD Gothic Neo", "Malgun Gothic", system-ui, sans-serif;
  --font-mono: ui-monospace, Consolas, monospace;
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --bg: #12151b; --paper: #1a1f28; --fg: #e3e7ee; --muted: #9aa3b2; --line: #2e3542;
    --accent: #b9a6ee; --accent-soft: #241f36; --star: #e7a54a; color-scheme: dark;
  }
}
:root[data-theme="dark"] {
  --bg: #12151b; --paper: #1a1f28; --fg: #e3e7ee; --muted: #9aa3b2; --line: #2e3542;
  --accent: #b9a6ee; --accent-soft: #241f36; --star: #e7a54a; color-scheme: dark;
}
body { background: var(--bg); color: var(--fg); font-family: var(--font-body); line-height: 1.7; font-size: 15px; }
.wrap { max-width: 1120px; margin: 0 auto; padding-block: 32px 64px;
  padding-left: max(16px, env(safe-area-inset-left, 0px)); padding-right: max(16px, env(safe-area-inset-right, 0px)); }
h1 { font-size: 1.75rem; margin: 0 0 4px; text-wrap: balance; }
h2 { font-size: 1.25rem; margin: 40px 0 12px; padding-top: 16px; border-top: 1px solid var(--line); text-wrap: balance; }
h3 { font-size: 1rem; margin: 26px 0 8px; }
p, li { max-width: 72ch; }
.sub { color: var(--muted); margin: 0 0 20px; }
code { font-family: var(--font-mono); font-size: 0.88em; background: var(--accent-soft); padding: 1px 5px; border-radius: 4px; }
blockquote { margin: 12px 0; padding: 8px 14px; border-left: 3px solid var(--accent); background: var(--paper); max-width: 80ch; }
.pair { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 320px), 1fr)); gap: 14px; align-items: start; }
figure { margin: 0; min-width: 0; background: var(--paper); border: 1px solid var(--line); border-radius: 8px; padding: 10px; }
figure.rec { border: 2px solid var(--star); }
figcaption { font-size: 0.9rem; font-weight: 500; margin-bottom: 8px; }
figure img { display: block; width: 100%; height: auto; border-radius: 4px; }
.n { display: inline-block; min-width: 1.5em; text-align: center; font-family: var(--font-mono); font-weight: 700; color: var(--paper); background: var(--accent); border-radius: 4px; margin-right: 6px; }
.tbl { overflow-x: auto; }
table { border-collapse: collapse; width: 100%; background: var(--paper); font-size: 0.9rem; }
th, td { border: 1px solid var(--line); padding: 6px 10px; text-align: left; vertical-align: top; }
th { background: var(--accent-soft); font-weight: 500; }
</style>

<div class="wrap">
<h1>M61 편집 중의 선택 표시</h1>
<p class="sub">2026-11-19 · 시각 디자인 문서 11장의 어긋남 1/7. 그림은 실제 앱(이진 탐색 예제)에서 블록을 선택하고 <code>Enter</code>로 편집을 시작한 화면입니다. 1번은 앱 코드를 바꾸지 않고 선택 하이라이트만 숨겨 찍었습니다.</p>

<blockquote>인라인 에디터가 열리면 그 블록의 선택 하이라이트는 그리지 않습니다(같은 자리에 두 테두리를 겹치지 않음). (시각 디자인 7.1절)</blockquote>

<h2>IE1 인라인 에디터가 열린 동안 선택 하이라이트를 그릴까</h2>
<p>지금 앱은 명세와 달리 3px 선택 하이라이트를 계속 그립니다. 인라인 에디터의 2px 테두리와 색이 같아서, 처리 블록에서는 두 테두리가 겹치고 If · 반복 · 호출 블록에서는 주황색 테두리가 이중으로 보입니다.</p>
${rows}

<h2>견주어 보기</h2>
<div class="tbl"><table>
<thead><tr><th></th><th>1 하이라이트 없음 ★</th><th>2 하이라이트 유지</th></tr></thead>
<tbody>
<tr><td>편집 중인 곳의 표시</td><td>인라인 에디터의 테두리 하나</td><td>인라인 에디터의 테두리 + 블록의 하이라이트</td></tr>
<tr><td>블록의 범위가 보이는가</td><td>인라인 에디터가 덮는 만큼만</td><td>블록 전체가 보임</td></tr>
<tr><td>바뀌는 곳</td><td>앱 코드, 회귀 테스트</td><td>시각 디자인 7.1절의 문장</td></tr>
</tbody></table></div>
</div>
`;
}

(async () => {
  const shots = await capture();
  const out = join(__dirname, '2026-11-19-inline-editor-selection-study.html');
  writeFileSync(out, page(shots));
  console.log('wrote', out, Math.round(readFileSync(out).length / 1024), 'KB');
})().catch((e) => { console.error(e); process.exit(1); });
