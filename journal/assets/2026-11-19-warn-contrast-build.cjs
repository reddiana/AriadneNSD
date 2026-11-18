// Builds M67 (경고색 글자의 대비): opens the real app, shows a warning notice and the delete button of
// the open modal, and takes them with today's colors and with the two proposed changes.
// The colors are set in the page only; the app's code is not changed.
// Needs the dev server:  cd src && pnpm dev
// Run:  node journal/assets/2026-11-19-warn-contrast-build.cjs
const { createRequire } = require('node:module');
const { readFileSync, writeFileSync } = require('node:fs');
const { join } = require('node:path');

const req = createRequire(join(__dirname, '../../src/apps/web/package.json'));
const { chromium } = req('@playwright/test');

const darker = '#ad560f';

const luminance = (rgb) => {
  const [r, g, b] = rgb.map((v) => v / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const parse = (css) => css.match(/\d+(\.\d+)?/g).slice(0, 3).map(Number);
const ratio = (a, b) => {
  const [x, y] = [luminance(parse(a)), luminance(parse(b))].sort((p, q) => q - p);
  return ((x + 0.05) / (y + 0.05)).toFixed(2);
};

/** The nearest painted background behind an element. */
const colorsOf = (el) => {
  let node = el;
  let bg = 'rgba(0, 0, 0, 0)';
  while (node !== null) {
    bg = getComputedStyle(node).backgroundColor;
    if (!/rgba\(\d+, \d+, \d+, 0\)|transparent/.test(bg)) break;
    node = node.parentElement;
  }
  return { fg: getComputedStyle(el).color, bg };
};

async function capture() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 900, height: 760 }, deviceScaleFactor: 2, locale: 'ko-KR' });
  await page.addInitScript(() => {
    delete window.showOpenFilePicker;
    delete window.showSaveFilePicker;
  });
  await page.goto('http://localhost:5173/');
  await page.waitForSelector('html[data-ready="true"]');
  await page.locator('.ans-backdrop button', { hasText: '이진 탐색' }).click();
  await page.waitForSelector('.ans-document text');
  await page.locator('.ans-document text').filter({ hasText: 'lo = 0;' }).first().click();
  await page.waitForTimeout(200);

  // The warning notice in the status bar.
  await page.keyboard.press('u');
  const notice = page.locator('.ans-notice[data-level="warn"]');
  await notice.waitFor({ state: 'visible' });
  const bar = page.locator('.ans-statusbar');
  const setWarn = (value) => page.evaluate((v) => {
    document.querySelectorAll('.ans-app').forEach((el) => {
      if (v === null) el.style.removeProperty('--ui-warn');
      else el.style.setProperty('--ui-warn', v);
    });
  }, value);
  const out = { notice: {}, button: {}, ratios: {} };
  out.ratios.noticeNow = await notice.evaluate(colorsOf);
  out.notice.now = (await bar.screenshot()).toString('base64');
  await setWarn(darker);
  await page.waitForTimeout(60);
  out.ratios.noticeDark = await notice.evaluate(colorsOf);
  out.notice.dark = (await bar.screenshot()).toString('base64');
  await setWarn(null);

  // The delete button of the open modal: save the document in this browser, then open the list.
  await page.keyboard.press('Control+Shift+S');
  const save = page.getByRole('dialog').first();
  await save.getByRole('tab').last().click();
  const name = save.getByRole('textbox').first();
  await name.fill('이진 탐색');
  await name.press('Enter');
  await page.waitForFunction(() => document.title.startsWith('이진 탐색'));
  await page.locator('[data-command="file.open"]').first().click();
  const del = page.locator('.ans-places-delete');
  await del.waitFor({ state: 'visible' });
  await page.waitForFunction(() => !document.querySelector('.ans-places-delete').disabled);
  await page.mouse.move(5, 5);
  await page.waitForTimeout(150);
  const row = page.locator('.ans-dialog-buttons', { has: del });
  out.ratios.buttonNow = await del.evaluate(colorsOf);
  out.button.now = (await row.screenshot()).toString('base64');
  await setWarn(darker);
  await page.waitForTimeout(60);
  out.ratios.buttonDark = await del.evaluate(colorsOf);
  out.button.dark = (await row.screenshot()).toString('base64');
  await setWarn(null);
  await del.evaluate((el) => { el.style.background = 'var(--ui-panel)'; });
  await page.waitForTimeout(60);
  out.ratios.buttonPanel = await del.evaluate(colorsOf);
  out.button.panel = (await row.screenshot()).toString('base64');
  await browser.close();
  return out;
}

const img = (b64, alt) => `<img src="data:image/png;base64,${b64}" alt="${alt}">`;
const r = (c) => ratio(c.fg, c.bg);

function page(s) {
  const t = s.ratios;
  return `<title>M67 경고색 글자의 대비</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700&display=swap">
<style>
/* 시안 페이지: M61 ~ M66과 같은 틀. 그림은 실제 앱의 스크린숏. */
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
.option > p { margin: 0 0 8px; font-size: 0.92rem; color: var(--muted); }
.lab { font-size: 0.84rem; color: var(--muted); margin: 10px 0 3px; }
.option img { display: block; max-width: 100%; height: auto; border: 1px solid var(--line); border-radius: 4px; background: #fff; }
.n { display: inline-block; min-width: 1.5em; text-align: center; font-family: var(--font-mono); font-weight: 700; color: var(--paper); background: var(--accent); border-radius: 4px; margin-right: 6px; }
.tbl { overflow-x: auto; }
table { border-collapse: collapse; width: 100%; background: var(--paper); font-size: 0.9rem; }
th, td { border: 1px solid var(--line); padding: 6px 10px; text-align: left; vertical-align: top; }
th { background: var(--accent-soft); font-weight: 500; }
</style>

<div class="wrap">
<h1>M67 경고색 글자의 대비</h1>
<p class="sub">2026-11-19 · 시각 디자인 문서 11장의 어긋남 7/7. 그림은 실제 앱의 밝은 화면이고, 대비율은 그 화면의 글자색과 배경색으로 계산했습니다. 1번과 2번의 색은 앱 코드를 바꾸지 않고 페이지에서만 입혔습니다.</p>

<blockquote>텍스트는 4.5:1(AA, 1.4.3)이 기준입니다. <code>ui.warn</code>은 3px 줄로만 써서 기준은 3:1. (시각 디자인 3.4절)</blockquote>

<h2>지금 상황</h2>
<p>실제로는 <code>ui.warn</code>을 글자에도 씁니다. 상태 표시줄의 경고 알림은 ${r(t.noticeNow)}:1로 기준을 넘지만, 열기 창의 삭제 버튼은 회색 버튼 배경 위라 <b>${r(t.buttonNow)}:1로 기준에 미달</b>합니다. 어두운 화면과 고대비 화면은 기준을 넘습니다.</p>

<h2>WC1 삭제 버튼의 대비를 어떻게 맞출까</h2>

<div class="option rec">
  <h3><span class="n">1</span><code>ui.warn</code>을 조금 어둡게 (${darker}) ★</h3>
  <p>토큰 하나만 바꾸면 경고색을 쓰는 모든 곳이 기준을 넘습니다. 색의 차이는 거의 보이지 않습니다.</p>
  <p class="lab">열기 창의 버튼 · 삭제 ${r(t.buttonDark)}:1</p>${img(s.button.dark, '어두운 경고색의 삭제 버튼')}
  <p class="lab">상태 표시줄의 경고 알림 · ${r(t.noticeDark)}:1</p>${img(s.notice.dark, '어두운 경고색의 경고 알림')}
</div>

<div class="option">
  <h3><span class="n">2</span>삭제 버튼의 배경만 흰색으로</h3>
  <p>색은 그대로 두고 삭제 버튼만 다른 버튼과 배경이 달라집니다.</p>
  <p class="lab">열기 창의 버튼 · 삭제 ${r(t.buttonPanel)}:1</p>${img(s.button.panel, '흰 배경의 삭제 버튼')}
</div>

<div class="option">
  <h3><span class="n">3</span>지금대로 두고 명세에 예외로 적음</h3>
  <p>앱은 그대로이고, 삭제 버튼은 접근성 기준(AA)에 미달한 채 남습니다.</p>
  <p class="lab">열기 창의 버튼 · 삭제 ${r(t.buttonNow)}:1</p>${img(s.button.now, '지금 앱의 삭제 버튼')}
  <p class="lab">상태 표시줄의 경고 알림 · ${r(t.noticeNow)}:1</p>${img(s.notice.now, '지금 앱의 경고 알림')}
</div>

<h2>견주어 보기</h2>
<div class="tbl"><table>
<thead><tr><th></th><th>1 <code>ui.warn</code>을 어둡게 ★</th><th>2 삭제 버튼 배경만 흰색</th><th>3 지금대로</th></tr></thead>
<tbody>
<tr><td>삭제 버튼의 대비</td><td>${r(t.buttonDark)}:1</td><td>${r(t.buttonPanel)}:1</td><td>${r(t.buttonNow)}:1 (미달)</td></tr>
<tr><td>경고 알림의 대비</td><td>${r(t.noticeDark)}:1</td><td>${r(t.noticeNow)}:1</td><td>${r(t.noticeNow)}:1</td></tr>
<tr><td>버튼 모양의 일관성</td><td>그대로</td><td>삭제 버튼만 다름</td><td>그대로</td></tr>
<tr><td>바뀌는 곳</td><td>화면 색 토큰 값, 시각 디자인 3.4절</td><td>버튼 스타일, 시각 디자인 3.4절</td><td>시각 디자인 3.4절의 문장</td></tr>
</tbody></table></div>
</div>
`;
}

(async () => {
  const shots = await capture();
  const t = shots.ratios;
  console.log(Object.entries(t).map(([k, v]) => `${k}: ${v.fg} on ${v.bg} = ${r(v)}`).join('\n'));
  const out = join(__dirname, '2026-11-19-warn-contrast-study.html');
  writeFileSync(out, page(shots));
  console.log('wrote', Math.round(readFileSync(out).length / 1024), 'KB');
})().catch((e) => { console.error(e); process.exit(1); });
