// Builds M66 (다른 문서를 찾을 수 없는 호출 블록) from the pictures the app's renderer drew.
// The pictures come from 2026-11-19-external-call-figs.test.ts (see its header).
// Output: 2026-11-19-external-call-study.html.   Run: node journal/assets/2026-11-19-external-call-build.mjs
import { readFileSync, writeFileSync } from 'node:fs';

const here = new URL('./', import.meta.url);
const f = JSON.parse(readFileSync(new URL('2026-11-19-external-call-figs.json', here), 'utf8'));
const font = `@font-face { font-family: '${f.fontFamily}'; src: url(data:font/woff;base64,${f.fontWoff}) format('woff'); }`;

const html = `<title>M66 찾을 수 없는 다른 문서</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700&display=swap">
<style>
/* 시안 페이지: M61 ~ M65와 같은 틀. 그림은 앱의 렌더러가 그린 SVG 그대로. */
${font}
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
h3 { font-size: 1rem; margin: 0 0 4px; }
p, li { max-width: 72ch; }
.sub { color: var(--muted); margin: 0 0 20px; }
code { font-family: var(--font-mono); font-size: 0.88em; background: var(--accent-soft); padding: 1px 5px; border-radius: 4px; }
blockquote { margin: 12px 0; padding: 8px 14px; border-left: 3px solid var(--accent); background: var(--paper); max-width: 80ch; }
.option { background: var(--paper); border: 1px solid var(--line); border-radius: 8px; padding: 14px; margin-top: 14px; }
.option.rec { border: 2px solid var(--star); }
.option > p { margin: 0 0 10px; font-size: 0.92rem; color: var(--muted); }
.pair { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 300px), 1fr)); gap: 12px; align-items: start; }
.pair > div { min-width: 0; }
.lab { font-size: 0.86rem; font-weight: 500; margin: 0 0 4px; }
.fig { overflow-x: auto; background: #fff; border: 1px solid var(--line); border-radius: 4px; }
.fig svg { display: block; max-width: none; }
.n { display: inline-block; min-width: 1.5em; text-align: center; font-family: var(--font-mono); font-weight: 700; color: var(--paper); background: var(--accent); border-radius: 4px; margin-right: 6px; }
.tbl { overflow-x: auto; }
table { border-collapse: collapse; width: 100%; background: var(--paper); font-size: 0.9rem; }
th, td { border: 1px solid var(--line); padding: 6px 10px; text-align: left; vertical-align: top; }
th { background: var(--accent-soft); font-weight: 500; }
</style>

<div class="wrap">
<h1>M66 찾을 수 없는 다른 문서</h1>
<p class="sub">2026-11-19 · 시각 디자인 문서 11장의 어긋남 6/7. 그림은 앱의 렌더러가 그렸고, 1번의 편집 화면 표시만 시안 스크립트가 덧그렸습니다.</p>

<blockquote>참조 대상을 잃은 호출 블록(Method를 삭제함, 헤더를 제거함, 다른 문서를 찾을 수 없음)은 이중선이 점선. (시각 디자인 1장 · 7.1절)</blockquote>

<h2>지금 상황</h2>
<p>다른 문서의 Method 호출(R-BLK-09)은 <code>P2</code>이고 웹 1.0 뒤의 기능이라, 지금 앱에는 그런 호출 블록을 만드는 기능이 없습니다. 그래서 지금 고칠 코드는 없고, 기능을 만들 때 따를 규칙만 정하면 됩니다.</p>
<p>명세대로 하면 <b>같은 문서라도 저장하는 환경에 따라 그림이 달라집니다.</b> 그 파일을 읽을 수 있는 PC에서는 실선, 읽을 수 없는 브라우저에서는 점선으로 저장되어 결정적 저장 출력(QA-03)을 어깁니다.</p>

<h2>EX1 다른 문서를 찾을 수 없을 때 어떻게 보일까</h2>

<div class="option rec">
  <h3><span class="n">1</span>저장 그림은 항상 실선, 편집 화면에만 표시 ★</h3>
  <p>찾을 수 없다는 것은 그 순간의 환경에 대한 정보이므로 편집 레이어에만 그립니다. 저장 파일은 어디서나 같습니다. 표시의 모양은 기능을 만들 때 다듬습니다.</p>
  <div class="pair">
    <div><p class="lab">저장 파일</p><div class="fig">${f.solid}</div></div>
    <div><p class="lab">편집 화면 (찾을 수 없을 때)</p><div class="fig">${f.marked}</div></div>
  </div>
</div>

<div class="option">
  <h3><span class="n">2</span>찾을 수 없으면 저장 그림도 점선 (지금 명세)</h3>
  <p>파일만 봐도 끊어진 참조를 알 수 있지만, 저장하는 환경에 따라 파일의 바이트가 달라집니다.</p>
  <div class="pair">
    <div><p class="lab">저장 파일 (읽을 수 있는 환경)</p><div class="fig">${f.solid}</div></div>
    <div><p class="lab">저장 파일 (읽을 수 없는 환경)</p><div class="fig">${f.dashed}</div></div>
  </div>
</div>

<h2>견주어 보기</h2>
<div class="tbl"><table>
<thead><tr><th></th><th>1 편집 화면에만 표시 ★</th><th>2 저장 그림도 점선</th></tr></thead>
<tbody>
<tr><td>결정적 저장 출력 (QA-03)</td><td>지킴</td><td>어김</td></tr>
<tr><td>내용을 바꾸지 않은 파일의 diff</td><td>없음</td><td>환경이 바뀌면 생김</td></tr>
<tr><td>앱 없이 파일만 보는 독자</td><td>끊어진 참조를 알 수 없음</td><td>점선으로 알 수 있음</td></tr>
<tr><td>Method를 삭제해 잃은 호출 블록</td><td>지금처럼 점선 (문서 안의 사실)</td><td>지금처럼 점선</td></tr>
<tr><td>지금 바뀌는 곳</td><td>시각 디자인 1장 · 7.1절 · 11장, 조작 규칙의 문장</td><td>시각 디자인 11장을 미완성 표시로</td></tr>
</tbody></table></div>
</div>
`;
writeFileSync(new URL('2026-11-19-external-call-study.html', here), html);
console.log('wrote', Math.round(html.length / 1024), 'KB');
