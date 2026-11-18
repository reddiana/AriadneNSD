// Builds M62 (호출 블록의 결과 기호): takes a saved file of the golden set and shows its result arrow as
// the app draws it now (a character of the embedded subset font) and as a shape (visual design 2).
// The shape is drawn over the character here; the app's code is not changed.
// Run:  node journal/assets/2026-11-19-result-arrow-build.cjs
const { createRequire } = require('node:module');
const { readFileSync, writeFileSync } = require('node:fs');
const { join } = require('node:path');

const req = createRequire(join(__dirname, '../../src/apps/web/package.json'));
const { chromium } = req('@playwright/test');

const golden = join(__dirname, '../../src/packages/core/golden/diagrams-and-calls.ns.svg');
const svg = readFileSync(golden, 'utf8').replace(/<\?xml[^>]*\?>\s*/, '').replace(/<!DOCTYPE[^>]*>\s*/, '');

/** Draws the arrow as a path over its character, which stays in place but is not painted. */
function toShape() {
  const text = [...document.querySelectorAll('svg text')].find((t) => t.textContent.includes('←'));
  const index = text.textContent.indexOf('←');
  const start = text.getStartPositionOfChar(index);
  const end = text.getEndPositionOfChar(index);
  const walker = document.createTreeWalker(text, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();
  while (node !== null && !node.data.includes('←')) node = walker.nextNode();
  const at = node.data.indexOf('←');
  const fill = getComputedStyle(node.parentElement).fill;
  const after = node.splitText(at);
  after.data = after.data.slice(1);
  const hidden = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
  hidden.setAttribute('fill', 'transparent');
  hidden.textContent = '←';
  after.parentNode.insertBefore(hidden, after);
  const y = start.y - 4.2;
  const x0 = start.x + 0.5;
  const x1 = end.x - 0.5;
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', `M${x1} ${y}H${x0}M${x0 + 2.6} ${y - 2.4}L${x0} ${y}L${x0 + 2.6} ${y + 2.4}`);
  path.setAttribute('fill', 'none');
  path.setAttribute('stroke', fill);
  path.setAttribute('stroke-width', '0.9');
  text.parentNode.appendChild(path);
}

async function capture() {
  const browser = await chromium.launch();
  const shots = {};
  for (const [name, scale] of [['normal', 2], ['large', 6]]) {
    const page = await browser.newPage({ viewport: { width: 1500, height: 1100 }, deviceScaleFactor: scale });
    await page.setContent(`<!doctype html><meta charset="utf-8"><body style="margin:0;background:#fff">${svg}</body>`);
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(400);
    const box = await page.evaluate(() => {
      const text = [...document.querySelectorAll('svg text')].find((t) => t.textContent.includes('←'));
      const b = text.getBoundingClientRect();
      const start = text.getStartPositionOfChar(text.textContent.indexOf('←'));
      const m = text.getScreenCTM();
      return { x: b.x, y: b.y, width: b.width, height: b.height, arrowX: start.x * m.a + m.e };
    });
    const clip = name === 'normal'
      ? { x: box.x - 20, y: box.y - 12, width: box.width + 40, height: box.height + 24 }
      : { x: box.arrowX - 14, y: box.y - 3, width: 44, height: box.height + 6 };
    shots[`${name}Char`] = (await page.screenshot({ clip })).toString('base64');
    await page.evaluate(toShape);
    await page.waitForTimeout(100);
    shots[`${name}Shape`] = (await page.screenshot({ clip })).toString('base64');
    await page.close();
  }
  await browser.close();
  return shots;
}

const img = (b64, alt) => `<img src="data:image/png;base64,${b64}" alt="${alt}">`;

function page(s) {
  return `<title>M62 호출 블록의 결과 기호</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700&display=swap">
<style>
/* 시안 페이지: M61과 같은 틀. 그림은 저장 파일(골든)을 브라우저로 연 화면. */
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
figure img { display: block; max-width: 100%; height: auto; border-radius: 4px; background: #fff; }
.n { display: inline-block; min-width: 1.5em; text-align: center; font-family: var(--font-mono); font-weight: 700; color: var(--paper); background: var(--accent); border-radius: 4px; margin-right: 6px; }
.tbl { overflow-x: auto; }
table { border-collapse: collapse; width: 100%; background: var(--paper); font-size: 0.9rem; }
th, td { border: 1px solid var(--line); padding: 6px 10px; text-align: left; vertical-align: top; }
th { background: var(--accent-soft); font-weight: 500; }
</style>

<div class="wrap">
<h1>M62 호출 블록의 결과 기호</h1>
<p class="sub">2026-11-19 · 시각 디자인 문서 11장의 어긋남 2/7. 그림은 저장 파일(골든 파일 <code>diagrams-and-calls.ns.svg</code>)을 브라우저로 연 화면입니다. 2번은 앱 코드를 바꾸지 않고 문자 위에 도형을 덧그려 찍었습니다.</p>

<blockquote>기호(<code>⋯</code> <code>←</code> <code>∅</code>)는 도형(path)으로 그립니다. 문자로 두면 글꼴에 그 기호가 없는 뷰어에서 깨집니다. (시각 디자인 2장)</blockquote>

<h2>AR1 호출 블록의 결과 기호 <code>←</code>를 무엇으로 그릴까</h2>
<p>지금 앱은 <code>←</code>를 문자로 그립니다. 명세가 걱정한 "뷰어에서 깨짐"은 확인해 보니 일어나지 않습니다. 저장 파일에 포함되는 서브셋 글꼴에 <code>←</code>(U+2190) 글리프가 들어 있습니다. <code>⋯</code>와 <code>∅</code>는 코드에서도 도형입니다.</p>

<h3>실제 크기</h3>
<div class="pair">
  <figure class="rec"><figcaption><span class="n">1</span>문자 유지 (지금 앱) ★</figcaption>${img(s.normalChar, '결과 기호를 문자로 그린 호출 블록')}</figure>
  <figure><figcaption><span class="n">2</span>도형으로 변경</figcaption>${img(s.normalShape, '결과 기호를 도형으로 그린 호출 블록')}</figure>
</div>

<h3>확대</h3>
<div class="pair">
  <figure class="rec"><figcaption><span class="n">1</span>문자 유지 (지금 앱) ★</figcaption>${img(s.largeChar, '문자로 그린 결과 기호의 확대')}</figure>
  <figure><figcaption><span class="n">2</span>도형으로 변경</figcaption>${img(s.largeShape, '도형으로 그린 결과 기호의 확대')}</figure>
</div>

<h2>견주어 보기</h2>
<div class="tbl"><table>
<thead><tr><th></th><th>1 문자 유지 ★</th><th>2 도형으로 변경</th></tr></thead>
<tbody>
<tr><td>앱이 없는 뷰어에서 보임</td><td>보임 (서브셋 글꼴에 포함)</td><td>보임</td></tr>
<tr><td>뷰어에서 텍스트 선택 · 복사 · 검색</td><td><code>p ← partition(a, 0, n)</code> 전체가 한 문장</td><td>기호가 텍스트에서 빠짐</td></tr>
<tr><td>사용자가 블록에 직접 적은 <code>←</code>와의 모양</td><td>같음</td><td>다름 (<code>for i ← 0 to n − 1</code>은 문자로 남음)</td></tr>
<tr><td>결과 기호를 <code>=</code>로 설정한 문서</td><td>같은 방식</td><td><code>←</code>만 도형, <code>=</code>는 문자</td></tr>
<tr><td>바뀌는 곳</td><td>시각 디자인 2장의 문장</td><td>레이아웃 · 렌더러 · 골든 파일, 회귀 테스트</td></tr>
</tbody></table></div>
</div>
`;
}

(async () => {
  const shots = await capture();
  const out = join(__dirname, '2026-11-19-result-arrow-study.html');
  writeFileSync(out, page(shots));
  console.log('wrote', out, Math.round(readFileSync(out).length / 1024), 'KB');
})().catch((e) => { console.error(e); process.exit(1); });
