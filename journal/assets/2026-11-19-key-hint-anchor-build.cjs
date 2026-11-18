// Builds M65 (키 힌트와 키보드 메뉴의 가로 자리): opens the real app and takes the key hint and the
// keyboard context menu twice: where the app puts them now (up to 24px in from the selection's left
// edge), and moved to the selection's left bottom corner (K3, visual design 7.1).
// The app's code is not changed. Needs the dev server:  cd src && pnpm dev
// Run:  node journal/assets/2026-11-19-key-hint-anchor-build.cjs
const { createRequire } = require('node:module');
const { readFileSync, writeFileSync } = require('node:fs');
const { join } = require('node:path');

const req = createRequire(join(__dirname, '../../src/apps/web/package.json'));
const { chromium } = req('@playwright/test');

const scenes = [
  { id: 'hint', label: '키 힌트 (a를 누른 뒤)', text: 'mid = lo + (hi - lo) / 2;', keys: ['a'], popup: '.ans-keyhint', wait: 650 },
  { id: 'narrow', label: '키 힌트, 좁은 분기 안의 블록', text: 'lo = mid + 1;', keys: ['a'], popup: '.ans-keyhint', wait: 650 },
  { id: 'menu', label: '키보드로 연 컨텍스트 메뉴 (Shift+F10)', text: 'hi = n - 1;', keys: ['Shift+F10'], popup: '[role="menu"]', wait: 300 },
];

const selectionRect = () => {
  const rect = [...document.querySelectorAll('.ans-canvas svg rect')].find(
    (r) => r.getAttribute('fill') === 'none' && r.getAttribute('stroke-width') === '3' && r.getAttribute('stroke') === '#d0500b',
  );
  const b = rect.getBoundingClientRect();
  return { left: b.left, top: b.top, right: b.right, bottom: b.bottom };
};

async function capture() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 900 }, deviceScaleFactor: 2, locale: 'ko-KR' });
  await page.goto('http://localhost:5173/');
  await page.waitForSelector('html[data-ready="true"]');
  await page.locator('.ans-backdrop button', { hasText: '이진 탐색' }).click();
  await page.waitForSelector('.ans-document text');
  const out = {};
  for (const scene of scenes) {
    await page.locator('.ans-document text').filter({ hasText: scene.text }).first().click();
    await page.mouse.move(1150, 850);
    await page.waitForTimeout(200);
    for (const key of scene.keys) await page.keyboard.press(key);
    const popup = page.locator(scene.popup).first();
    await popup.waitFor({ state: 'visible' });
    await page.waitForTimeout(scene.wait);
    const sel = await page.evaluate(selectionRect);
    const box = await popup.boundingBox();
    const offset = Math.round(box.x - sel.left);
    const left = Math.min(sel.left, box.x) - 26;
    const top = Math.min(sel.top, box.y) - 22;
    const clip = {
      x: Math.max(0, left),
      y: Math.max(0, top),
      width: Math.min(Math.max(sel.right, box.x + box.width) + 26 - left, 640),
      height: Math.max(sel.bottom, box.y + box.height) + 22 - top,
    };
    const now = await page.screenshot({ clip });
    await popup.evaluate((el, dx) => { el.style.transform = `translateX(${-dx}px)`; }, offset);
    await page.waitForTimeout(80);
    const corner = await page.screenshot({ clip });
    out[scene.id] = { offset, now: now.toString('base64'), corner: corner.toString('base64') };
    await page.keyboard.press('Escape');
    await page.waitForTimeout(150);
  }
  await browser.close();
  return out;
}

const img = (b64, alt) => `<img src="data:image/png;base64,${b64}" alt="${alt}">`;

function page(shots) {
  const rows = scenes.map((s) => `
  <section>
    <h3>${s.label}</h3>
    <div class="pair">
      <figure class="rec"><figcaption><span class="n">1</span>선택의 왼쪽 끝에 맞춤 ★</figcaption>${img(shots[s.id].corner, `${s.label}: 선택의 왼쪽 끝에 맞춘 모습`)}</figure>
      <figure><figcaption><span class="n">2</span>${shots[s.id].offset}px 안쪽 (지금 앱)</figcaption>${img(shots[s.id].now, `${s.label}: 선택의 왼쪽 끝에서 안쪽으로 들어간 모습`)}</figure>
    </div>
  </section>`).join('');
  return `<title>M65 키 힌트의 가로 위치</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700&display=swap">
<style>
/* 시안 페이지: M61 ~ M64와 같은 틀. 그림은 실제 앱의 스크린숏. */
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
<h1>M65 키 힌트의 가로 위치</h1>
<p class="sub">2026-11-19 · 시각 디자인 문서 11장의 어긋남 5/7. 그림은 실제 앱(이진 탐색 예제)의 화면입니다. 1번은 앱 코드를 바꾸지 않고 팝업만 왼쪽으로 옮겨 찍었습니다.</p>

<blockquote>키보드로 연 컨텍스트 메뉴와 같은 자리(선택의 왼쪽 아래 모서리)에 띄운다. (UX 결정 K3) · 선택 바로 아래(선택의 왼쪽 아래 모서리에서 4px 아래)에 키 힌트. (시각 디자인 7.1절)</blockquote>

<h2>KA1 키 힌트와 키보드 메뉴를 가로로 어디에 둘까</h2>
<p>지금 앱은 팝업을 선택의 왼쪽 끝에서 최대 24px 안쪽에 둡니다. 키 힌트와 <code>Shift</code>+<code>F10</code> 메뉴가 같은 기준을 씁니다.</p>
${rows}

<h2>견주어 보기</h2>
<div class="tbl"><table>
<thead><tr><th></th><th>1 왼쪽 끝에 맞춤 ★</th><th>2 24px 안쪽 유지</th></tr></thead>
<tbody>
<tr><td>K3 · 시각 디자인 7.1절</td><td>일치</td><td>문장을 고쳐야 함</td></tr>
<tr><td>선택과 팝업의 왼쪽 정렬</td><td>한 줄로 맞음</td><td>어긋남</td></tr>
<tr><td>중첩이 깊어 왼쪽 여백이 좁을 때</td><td>팝업이 더 왼쪽에서 시작</td><td>팝업이 더 오른쪽에서 시작</td></tr>
<tr><td>바뀌는 곳</td><td><code>selectionAnchor</code> 코드, 테스트</td><td>K3, 시각 디자인 7.1절, 03-editor의 문장</td></tr>
</tbody></table></div>
</div>
`;
}

(async () => {
  const shots = await capture();
  console.log(Object.entries(shots).map(([k, v]) => `${k}: ${v.offset}px`).join(', '));
  const out = join(__dirname, '2026-11-19-key-hint-anchor-study.html');
  writeFileSync(out, page(shots));
  console.log('wrote', Math.round(readFileSync(out).length / 1024), 'KB');
})().catch((e) => { console.error(e); process.exit(1); });
