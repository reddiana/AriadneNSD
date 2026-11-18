// Builds M63 (외곽선과 PDF의 기울임, BUG-15) from the pictures the app's renderer drew.
// The pictures come from 2026-11-19-slanted-outline-figs.test.ts (see its header).
// Output: 2026-11-19-slanted-outline-study.html.   Run: node journal/assets/2026-11-19-slanted-outline-build.mjs
import { readFileSync, writeFileSync } from 'node:fs';

const here = new URL('./', import.meta.url);
const f = JSON.parse(readFileSync(new URL('2026-11-19-slanted-outline-figs.json', here), 'utf8'));
const font = `@font-face { font-family: '${f.fontFamily}'; src: url(data:font/woff;base64,${f.fontWoff}) format('woff'); }`;

const html = `<title>M63 외곽선과 PDF의 기울임</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700&display=swap">
<style>
/* 시안 페이지: M61 · M62와 같은 틀. 그림은 앱의 렌더러가 그린 SVG 그대로. */
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
p, li { max-width: 72ch; }
.sub { color: var(--muted); margin: 0 0 20px; }
code { font-family: var(--font-mono); font-size: 0.88em; background: var(--accent-soft); padding: 1px 5px; border-radius: 4px; }
blockquote { margin: 12px 0; padding: 8px 14px; border-left: 3px solid var(--accent); background: var(--paper); max-width: 80ch; }
.pair { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 340px), 1fr)); gap: 14px; align-items: start; }
figure { margin: 0; min-width: 0; background: var(--paper); border: 1px solid var(--line); border-radius: 8px; padding: 10px; }
figure.rec { border: 2px solid var(--star); }
figcaption { font-size: 0.9rem; font-weight: 500; margin-bottom: 8px; }
.fig { overflow-x: auto; background: #fff; border-radius: 4px; }
.fig svg { display: block; max-width: none; }
.n { display: inline-block; min-width: 1.5em; text-align: center; font-family: var(--font-mono); font-weight: 700; color: var(--paper); background: var(--accent); border-radius: 4px; margin-right: 6px; }
.tbl { overflow-x: auto; }
table { border-collapse: collapse; width: 100%; background: var(--paper); font-size: 0.9rem; }
th, td { border: 1px solid var(--line); padding: 6px 10px; text-align: left; vertical-align: top; }
th { background: var(--accent-soft); font-weight: 500; }
</style>

<div class="wrap">
<h1>M63 외곽선과 PDF의 기울임</h1>
<p class="sub">2026-11-19 · 시각 디자인 문서 11장의 어긋남 3/7, 결함 BUG-15. 그림은 모두 앱의 렌더러가 그렸고, 1번의 기울임만 시안 스크립트가 외곽선에 적용했습니다.</p>

<blockquote>이름이 없으면 기울임으로 "아직 이름이 없다"를 보입니다. 접힌 제어 블록의 분기 "⋯ 블록 n개"도 기울임입니다. (시각 디자인 4.2절)</blockquote>

<h2>지금의 어긋남</h2>
<p>화면과 보통의 저장 파일은 기울임으로 그리지만, 문서 설정 "텍스트를 외곽선으로 저장"을 켠 파일과 PDF는 같은 글자를 바로 선 글자로 그립니다. 이름 없는 접기 영역과 "블록 2개"를 비교해 보세요.</p>
<div class="pair">
  <figure><figcaption>화면 · 보통의 저장 파일</figcaption><div class="fig">${f.saved}</div></figure>
  <figure><figcaption>텍스트 외곽선 · PDF (지금)</figcaption><div class="fig">${f.outlined}</div></figure>
</div>

<h2>SL1 어느 쪽으로 맞출까</h2>
<p>번들 글꼴에는 기울임체가 없어, 화면의 기울임도 브라우저가 글자를 기울여 만든 것입니다. 그래서 기울임체를 더 번들하는 안은 넣지 않았습니다.</p>
<div class="pair">
  <figure class="rec"><figcaption><span class="n">1</span>외곽선과 PDF도 기울여 그림 ★</figcaption><div class="fig">${f.fixed}</div></figure>
  <figure><figcaption><span class="n">2</span>기울임을 모든 출력에서 없앰</figcaption><div class="fig">${f.plain}</div></figure>
</div>

<h2>견주어 보기</h2>
<div class="tbl"><table>
<thead><tr><th></th><th>1 외곽선과 PDF도 기울임 ★</th><th>2 기울임을 없앰</th></tr></thead>
<tbody>
<tr><td>화면과 저장 결과가 같음</td><td>같음</td><td>같음</td></tr>
<tr><td>이름 없는 접기 영역의 구별</td><td>기울임으로 구별</td><td>글자 모양으로는 구별되지 않음</td></tr>
<tr><td>글자 폭 · 레이아웃</td><td>그대로</td><td>그대로</td></tr>
<tr><td>바뀌는 곳</td><td>외곽선 · PDF 출력, 골든 파일, 회귀 테스트</td><td>렌더러, 기울임이 든 골든 파일, 시각 디자인 4.2절</td></tr>
<tr><td>BUG-15</td><td>고쳐짐</td><td>명세를 바꿔 해소</td></tr>
</tbody></table></div>
</div>
`;
writeFileSync(new URL('2026-11-19-slanted-outline-study.html', here), html);
console.log('wrote', Math.round(html.length / 1024), 'KB');
