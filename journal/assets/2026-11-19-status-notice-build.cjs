// Builds M64 (상태 표시줄 알림의 색): opens the real app, makes an `info` notice appear in the status
// bar, and takes the bar empty, with the notice as it is now, and with the notice in `ui.accent`
// (what visual design 9.4 asks for during the first 1.6 seconds). The app's code is not changed.
// Needs the dev server:  cd src && pnpm dev
// Run:  node journal/assets/2026-11-19-status-notice-build.cjs
const { createRequire } = require('node:module');
const { readFileSync, writeFileSync } = require('node:fs');
const { join } = require('node:path');

const req = createRequire(join(__dirname, '../../src/apps/web/package.json'));
const { chromium } = req('@playwright/test');

async function capture() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 860, height: 600 }, deviceScaleFactor: 2, locale: 'ko-KR' });
  await page.goto('http://localhost:5173/');
  await page.waitForSelector('html[data-ready="true"]');
  await page.locator('.ans-backdrop button', { hasText: '이진 탐색' }).click();
  await page.waitForSelector('.ans-document text');
  await page.locator('.ans-document text').filter({ hasText: 'lo = 0;' }).first().click();
  await page.waitForTimeout(300);
  const bar = page.locator('.ans-statusbar');
  const notice = page.locator('.ans-notice');
  // The bar with no notice: clear the selection and wait until that info notice has gone.
  await page.keyboard.press('Escape');
  await notice.waitFor({ state: 'visible' });
  await notice.waitFor({ state: 'hidden', timeout: 9000 });
  const empty = await bar.screenshot();
  await page.locator('.ans-document text').filter({ hasText: 'lo = 0;' }).first().click();
  await page.waitForTimeout(200);
  await page.keyboard.press('Escape');
  await notice.waitFor({ state: 'visible' });
  if ((await notice.getAttribute('data-level')) !== 'info') throw new Error('expected an info notice');
  const message = await notice.textContent();
  const normal = await bar.screenshot();
  const accent = await page.evaluate(() => {
    const el = document.querySelector('.ans-notice');
    el.style.color = 'var(--ui-accent)';
    return getComputedStyle(el).color;
  });
  await page.waitForTimeout(80);
  const colored = await bar.screenshot();
  await browser.close();
  return { message, accent, empty: empty.toString('base64'), normal: normal.toString('base64'), colored: colored.toString('base64') };
}

const src = (b64) => `data:image/png;base64,${b64}`;

function page(s) {
  return `<title>M64 상태 표시줄 알림의 색</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700&display=swap">
<style>
/* 시안 페이지: M61 ~ M63과 같은 틀. 그림은 실제 앱의 스크린숏. */
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
.wrap { max-width: 1000px; margin: 0 auto; padding-block: 32px 64px;
  padding-left: max(16px, env(safe-area-inset-left, 0px)); padding-right: max(16px, env(safe-area-inset-right, 0px)); }
h1 { font-size: 1.75rem; margin: 0 0 4px; text-wrap: balance; }
h2 { font-size: 1.25rem; margin: 40px 0 12px; padding-top: 16px; border-top: 1px solid var(--line); text-wrap: balance; }
p, li { max-width: 72ch; }
.sub { color: var(--muted); margin: 0 0 20px; }
code { font-family: var(--font-mono); font-size: 0.88em; background: var(--accent-soft); padding: 1px 5px; border-radius: 4px; }
blockquote { margin: 12px 0; padding: 8px 14px; border-left: 3px solid var(--accent); background: var(--paper); max-width: 80ch; }
.option { background: var(--paper); border: 1px solid var(--line); border-radius: 8px; padding: 14px; margin-top: 14px; }
.option.rec { border: 2px solid var(--star); }
.option h3 { font-size: 1rem; margin: 0 0 4px; }
.option p { margin: 0 0 10px; font-size: 0.92rem; color: var(--muted); }
.frame { display: block; width: 100%; height: auto; border: 1px solid var(--line); border-radius: 4px; }
.stage { font-size: 0.82rem; color: var(--muted); margin: 10px 0 3px; }
button { font: inherit; font-size: 0.88rem; margin-top: 10px; padding: 4px 12px; border-radius: 6px; border: 1px solid var(--accent); background: var(--accent-soft); color: var(--fg); cursor: pointer; }
button:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
.n { display: inline-block; min-width: 1.5em; text-align: center; font-family: var(--font-mono); font-weight: 700; color: var(--paper); background: var(--accent); border-radius: 4px; margin-right: 6px; }
.tbl { overflow-x: auto; }
table { border-collapse: collapse; width: 100%; background: var(--paper); font-size: 0.9rem; }
th, td { border: 1px solid var(--line); padding: 6px 10px; text-align: left; vertical-align: top; }
th { background: var(--accent-soft); font-weight: 500; }
</style>

<div class="wrap">
<h1>M64 상태 표시줄 알림의 색</h1>
<p class="sub">2026-11-19 · 시각 디자인 문서 11장의 어긋남 4/7. 그림은 실제 앱의 상태 표시줄입니다. <code>info</code> 알림 "${s.message}"는 블록을 선택한 채 <code>Esc</code>를 눌러 띄웠고, 2번의 색은 앱 코드를 바꾸지 않고 입혀 찍었습니다.</p>

<blockquote>움직임은 두지 않습니다. 예외 하나: 상태 표시줄의 알림 텍스트가 1.6초 동안 <code>ui.accent</code>로 보였다가 돌아옵니다. (시각 디자인 9.4절)</blockquote>

<h2>NT1 알림이 나타날 때 색을 잠깐 바꿀까</h2>
<p>지금 앱은 색을 바꾸지 않습니다. <code>info</code> 알림은 6초 뒤 사라지고, <code>warn</code> 알림은 닫거나 다음 알림이 올 때까지 남습니다. 버튼을 누르면 실제 시간으로 재생합니다.</p>

<div class="option rec">
  <h3><span class="n">1</span>색을 바꾸지 않음 (지금 앱) ★</h3>
  <p>9.4절의 "움직임은 두지 않습니다"에 예외가 없어집니다. 명세의 예외 문장을 지웁니다.</p>
  <img class="frame" id="play1" src="${src(s.normal)}" alt="일반 글자색의 알림이 보이는 상태 표시줄">
  <button type="button" id="btn1">1번 재생</button>
</div>

<div class="option">
  <h3><span class="n">2</span>1.6초 동안 강조색으로 표시</h3>
  <p>새 알림이 눈에 더 잘 띕니다. 키보드로 빠르게 작업할 때 알림이 잦으면 상태 표시줄이 자주 깜박입니다.</p>
  <img class="frame" id="play2" src="${src(s.colored)}" alt="강조색 알림이 보이는 상태 표시줄">
  <button type="button" id="btn2">2번 재생</button>
  <div class="stage">1.6초 뒤의 모습</div>
  <img class="frame" src="${src(s.normal)}" alt="일반 글자색으로 돌아온 알림">
</div>

<h2>견주어 보기</h2>
<div class="tbl"><table>
<thead><tr><th></th><th>1 색을 바꾸지 않음 ★</th><th>2 1.6초 강조</th></tr></thead>
<tbody>
<tr><td>새 알림의 눈에 띔</td><td>글자가 나타나는 것으로만</td><td>색으로 한 번 더</td></tr>
<tr><td>움직임 원칙(9.4절)</td><td>예외 없음</td><td>예외 하나</td></tr>
<tr><td><code>warn</code> 알림</td><td>지금처럼 경고색</td><td>경고색과의 관계를 정해야 함</td></tr>
<tr><td>바뀌는 곳</td><td>시각 디자인 9.4절의 문장</td><td>상태 표시줄 코드, 테스트</td></tr>
</tbody></table></div>
</div>

<script>
(function () {
  var empty = ${JSON.stringify(src(s.empty))};
  var normal = ${JSON.stringify(src(s.normal))};
  var colored = ${JSON.stringify(src(s.colored))};
  var timers = [];
  function play(img, first) {
    timers.forEach(clearTimeout);
    timers = [];
    img.src = empty;
    timers.push(setTimeout(function () { img.src = first; }, 500));
    if (first !== normal) timers.push(setTimeout(function () { img.src = normal; }, 2100));
  }
  document.getElementById('btn1').addEventListener('click', function () { play(document.getElementById('play1'), normal); });
  document.getElementById('btn2').addEventListener('click', function () { play(document.getElementById('play2'), colored); });
})();
</script>
`;
}

(async () => {
  const shots = await capture();
  console.log('notice:', shots.message, '| accent:', shots.accent);
  const out = join(__dirname, '2026-11-19-status-notice-study.html');
  writeFileSync(out, page(shots));
  console.log('wrote', Math.round(readFileSync(out).length / 1024), 'KB');
})().catch((e) => { console.error(e); process.exit(1); });
