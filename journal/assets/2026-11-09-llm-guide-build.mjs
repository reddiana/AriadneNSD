// M56: builds the study page from the experiment's results and the guide drafts.
//   node journal/assets/2026-11-09-llm-guide-check.mjs   (first: writes …-results.json)
//   node journal/assets/2026-11-09-llm-guide-build.mjs   → 2026-11-09-llm-guide-study.html
//   py -X utf8 journal/assets/2026-10-14-add-license-note.py
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const read = (name) => readFile(join(here, name), 'utf8');
const results = JSON.parse(await read('2026-11-09-llm-guide-results.json'));
const guide = await read('2026-11-09-llms-v3.txt');
const schema = await read('2026-11-09-llm-guide-model.schema.json');
const prompts = {
  'modify-d': await read('2026-11-09-llm-guide-runs/prompts/modify-d.txt'),
  'modify-j': await read('2026-11-09-llm-guide-runs/prompts/modify-j.txt'),
};

const esc = (text) =>
  String(text).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

const tasks = {
  bubble: '버블 정렬을 그려 주세요',
  binary: '이진 탐색을 그려 주세요',
  switch: 'switch 계산기를 그려 주세요',
  'modify-d': '공유 링크(d)를 받아 고치기',
  'modify-j': '공유 링크(j)를 받아 고치기',
};
const guideOf = { v1: 'v1', v2: 'v2', v3: 'v3' };

function describe(run) {
  const [round, model, ...rest] = run.split('-');
  let words = rest;
  const code = words[0] === 'code';
  if (code) words = words.slice(1);
  let task = words.join('-').replace(/-[ab]$/, '');
  return { round, model, code, task, label: tasks[task] ?? task };
}

/** One row's verdict, in words. */
function verdict(result, info) {
  const link = result.links[0];
  if (info.task === 'modify-d' && !info.code) {
    return result.links.length === 0
      ? { ok: true, text: '풀지 못한다고 밝히고 파일을 청함 (지어내지 않음)' }
      : { ok: false, text: '링크를 지어냄' };
  }
  if (link === undefined) return { ok: false, text: '링크 없음' };
  if (link.ok) return { ok: true, text: `${link.packing} 링크가 열림` };
  const json = result.json?.ok ? ' · JSON 코드 블록은 맞음' : '';
  return { ok: false, text: `${link.packing} 링크가 깨짐: ${link.detail}${json}` };
}

const rows = results.map((result) => ({ result, info: describe(result.run) }));
rows.forEach((row) => (row.verdict = verdict(row.result, row.info)));

const summary = ['v1', 'v2', 'v3'].map((round) => {
  const inRound = rows.filter((row) => row.info.round === round);
  return { round, total: inRound.length, ok: inRound.filter((row) => row.verdict.ok).length };
});

const svgImage = (svg, alt) =>
  `<img class="fig" alt="${esc(alt)}" src="data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}">`;

const resultRows = rows
  .map(({ result, info, verdict: v }) => {
    const real = result.real
      ? `<a href="${esc(result.real.d)}" target="_blank" rel="noopener">d 링크</a> · <a href="${esc(result.real.j)}" target="_blank" rel="noopener">j 링크</a>`
      : '—';
    return `<tr class="${v.ok ? 'pass' : 'fail'}">
  <td>${esc(info.round)}</td><td>${esc(info.model)}${info.code ? ' <span class="chip">코드 실행</span>' : ''}</td>
  <td>${esc(info.label)}</td>
  <td><span class="mark">${v.ok ? '통과' : '실패'}</span> ${esc(v.text)}</td>
  <td class="num">${result.links[0] ? String(result.links[0].length) : '—'}</td>
  <td>${real}</td></tr>`;
  })
  .join('\n');

const figures = rows
  .filter(({ result }) => result.svg)
  .map(
    ({ result, info }) => `<figure class="card figcard${Number(/width="([\d.]+)"/.exec(result.svg)?.[1] ?? 0) > 520 ? ' wide' : ''}">
  <figcaption><b>${esc(info.round)} · ${esc(info.model)}${info.code ? ' (코드)' : ''}</b> ${esc(info.label)}
  <span class="links"><a href="${esc(result.real.d)}" target="_blank" rel="noopener">앱에서 열기</a></span></figcaption>
  ${svgImage(result.svg, `${info.model}의 ${info.label}`)}
</figure>`,
  )
  .join('\n');

const failures = rows
  .filter(({ verdict: v }) => !v.ok)
  .map(({ result, info, verdict: v }) => `<li><b>${esc(result.run)}</b>: ${esc(v.text)}</li>`)
  .join('\n');

// The same document (v1-opus-bubble) in every packing, for LG2.
const sample = results.find((result) => result.run === 'v1-opus-bubble');
const short = (link, keep = 120) => (link.length > keep ? `${link.slice(0, keep)}…` : link);

const html = `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<title>M56 LLM · 에이전트 안내서 시안</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+KR:wght@400;600&family=IBM+Plex+Mono:wght@400;500&display=swap">
<style>
:root {
  --bg: #f6f7f9; --fg: #1b2129; --muted: #5b6573; --line: #d4d9e1; --card: #ffffff;
  --rec: #2c55c9; --rec-soft: #e4eafb; --tag: #1b2129; --tagfg: #ffffff;
  --pass: #1f7a3d; --pass-soft: #e3f4e8; --fail: #b3261e; --fail-soft: #fbe6e4; --code: #eef1f6;
  --sans: "IBM Plex Sans KR", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif;
  --mono: "IBM Plex Mono", ui-monospace, Consolas, monospace;
}
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) {
  --bg: #14171c; --fg: #e3e7ee; --muted: #9aa4b2; --line: #2e343d; --card: #1c2027;
  --rec: #8ba7ff; --rec-soft: #232c45; --tag: #e3e7ee; --tagfg: #14171c;
  --pass: #6fd08f; --pass-soft: #17301f; --fail: #ff8a80; --fail-soft: #3a1a18; --code: #232832;
  color-scheme: dark } }
:root[data-theme="dark"] {
  --bg: #14171c; --fg: #e3e7ee; --muted: #9aa4b2; --line: #2e343d; --card: #1c2027;
  --rec: #8ba7ff; --rec-soft: #232c45; --tag: #e3e7ee; --tagfg: #14171c;
  --pass: #6fd08f; --pass-soft: #17301f; --fail: #ff8a80; --fail-soft: #3a1a18; --code: #232832;
  color-scheme: dark }
* { box-sizing: border-box; }
body { background: var(--bg); color: var(--fg); font: 15px/1.65 var(--sans); margin: 0; }
.wrap { max-width: 1040px; margin: 0 auto; padding: 28px 16px 56px; }
h1 { font-size: 26px; line-height: 1.3; margin: 0 0 6px; }
h2 { font-size: 20px; margin: 40px 0 10px; padding-top: 12px; border-top: 1px solid var(--line); }
h3 { font-size: 16px; margin: 22px 0 8px; }
p, li { max-width: 72ch; }
a { color: var(--rec); }
.lead { color: var(--muted); margin: 0 0 18px; }
.card { background: var(--card); border: 1px solid var(--line); border-radius: 10px; padding: 14px 16px; margin: 12px 0; }
blockquote { margin: 10px 0; padding: 8px 14px; border-left: 3px solid var(--rec); background: var(--card); }
code, pre { font-family: var(--mono); font-size: 13px; }
code { background: var(--code); padding: 1px 4px; border-radius: 4px; overflow-wrap: anywhere; }
pre { background: var(--code); padding: 12px 14px; border-radius: 8px; overflow: auto; white-space: pre-wrap; overflow-wrap: anywhere; margin: 8px 0; }
pre.guide { max-height: 640px; }
.table-wrap { overflow-x: auto; }
table { border-collapse: collapse; width: 100%; font-size: 14px; }
th, td { border-bottom: 1px solid var(--line); padding: 7px 8px; text-align: left; vertical-align: top; }
td.num { text-align: right; font-variant-numeric: tabular-nums; }
tr.pass .mark { color: var(--pass); font-weight: 600; }
tr.fail .mark { color: var(--fail); font-weight: 600; }
tr.fail { background: var(--fail-soft); }
.chip { display: inline-block; font-size: 12px; padding: 0 6px; border: 1px solid var(--line); border-radius: 10px; color: var(--muted); }
.stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 10px; }
.stat { background: var(--card); border: 1px solid var(--line); border-radius: 10px; padding: 12px 14px; }
.stat b { display: block; font-size: 24px; font-variant-numeric: tabular-nums; }
.stat span { color: var(--muted); font-size: 13px; }
.figs { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 12px; }
.figcard { margin: 0; }
.figcard.wide { grid-column: 1 / -1; }
.figcard.wide img.fig { max-width: min(100%, 900px); }
.figcard figcaption { font-size: 13px; margin-bottom: 8px; }
.figcard .links { float: right; }
img.fig { display: block; max-width: 100%; height: auto; border-radius: 4px; border: 1px solid var(--line); }
.q { background: var(--card); border: 1px solid var(--line); border-radius: 12px; padding: 16px; margin: 18px 0; }
.q > h3 { margin-top: 0; }
.tag { display: inline-block; background: var(--tag); color: var(--tagfg); font: 600 13px var(--mono); padding: 1px 8px; border-radius: 6px; margin-right: 6px; }
.opts { display: grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap: 10px; margin-top: 10px; }
.opt { border: 1px solid var(--line); border-radius: 10px; padding: 12px; background: var(--bg); position: relative; }
.opt.rec { border: 2px solid var(--rec); background: var(--rec-soft); }
.opt .n { display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px; border-radius: 50%; background: var(--tag); color: var(--tagfg); font: 600 13px var(--mono); margin-right: 6px; }
.opt.rec .n { background: var(--rec); color: var(--bg); }
.opt h4 { margin: 0 0 6px; font-size: 15px; }
.opt p, .opt li { font-size: 14px; }
.opt pre { font-size: 12px; }
.star { color: var(--rec); font-weight: 600; }
.why { margin-top: 10px; font-size: 14px; }
.flow { display: flex; flex-wrap: wrap; align-items: stretch; gap: 6px; margin: 10px 0; }
.flow .box { flex: 1 1 140px; background: var(--bg); border: 1px solid var(--line); border-radius: 8px; padding: 8px 10px; font-size: 13px; }
.flow .box b { display: block; font-size: 13px; }
.flow .arrow { align-self: center; color: var(--muted); font-size: 18px; }
.flow .box.app { border-color: var(--rec); }
.flow .box.bad { border-color: var(--fail); }
details > summary { cursor: pointer; color: var(--rec); }
.mock { border: 1px solid var(--line); border-radius: 8px; overflow: hidden; font-size: 13px; }
.mock .bar { background: var(--bg); padding: 6px 10px; border-bottom: 1px solid var(--line); display: flex; justify-content: space-between; gap: 8px; }
.mock .body { padding: 10px; }
.mock .toast { background: var(--fail-soft); color: var(--fg); border: 1px solid var(--fail); border-radius: 6px; padding: 8px 10px; }
.mock .btn { display: inline-block; border: 1px solid var(--line); border-radius: 6px; padding: 1px 8px; background: var(--card); }
</style>
</head>
<body>
<div class="wrap">
<h1>M56 LLM · 에이전트 안내서 시안</h1>
<p class="lead">다른 LLM(Grok, ChatGPT, 다른 Claude)이 "ariadnensd.com으로 버블 정렬을 그려 주세요"를 받았을 때 바로 열리는 링크를 줄 수 있게 하는 안내서(<code>/llms.txt</code>)의 초안과, 그 초안만 준 새 모델들로 해 본 실험입니다. 2026-11-09.</p>

<blockquote>메인테이너(inbox): "예를들어 Grok이나 ChatGPT같은 다른 LLM에게 또는 다른 claude에게 "https://ariadnensd.com 으로 버블소트 알고리즘을 nsd로 그려주세요"라고 했을 때, 그 LLM들에게 도움이 되려면 무엇을 준비해야될까요? LLM과 에이전트를 위한 안내서를 웹 버전에 포함시킬 수 있나요?"</blockquote>
<blockquote>메인테이너(덧붙임): "다른 에이전트에게 안내할 때, '공유 링크 복사' 기능을 추천해주세요."</blockquote>

<h2>요약</h2>
<div class="stats">
${summary.map((s) => `<div class="stat"><b>${s.ok} / ${s.total}</b><span>안내서 ${s.round}로 돌린 것 가운데 통과</span></div>`).join('\n')}
<div class="stat"><b>${rows.filter((r) => r.result.real).length} / ${rows.filter((r) => r.result.real).length}</b><span>통과한 것의 실제 j · d 링크가 로컬 앱(pnpm dev)에서 보기 모드로 열림</span></div>
</div>
<ul>
<li><b>된다.</b> 안내서 한 장(약 9 KB)만 읽은 모델이 코드 실행 없이 손으로 링크를 만들어 앱에서 열리는 그림을 냈습니다. 그림의 내용(알고리즘)도 모두 맞았습니다. sonnet · opus는 한 번도 틀리지 않았고, 틀린 두 번은 모두 haiku가 손으로 퍼센트 인코딩을 하다 괄호 하나를 더하거나 빠뜨린 것입니다(같은 답의 JSON 코드 블록은 맞았음).</li>
<li><b>열쇠는 사람이 읽을 수 있는 꾸림 <code>u</code>입니다.</b> 지금의 <code>d</code>(deflate)는 코드 없이 만들 수 없고, <code>j</code>(base64)는 손으로 만들기 어렵습니다. <code>u</code>는 앱에 아직 없으므로 실험에서는 브라우저와 같게 읽는 검사 스크립트로 열었습니다. 앱에 더하는 일은 짧습니다(읽기만, LG2).</li>
<li><b>"공유 링크 복사"를 기준으로 삼았습니다.</b> 안내서는 LLM에게 "앱의 파일 › 공유 링크 복사가 만드는 것과 같은 공유 링크를 주라"고, 사용자에게는 "고친 뒤 파일 › 공유 링크 복사로 새 링크를 만들어 다시 넘기라"고 안내하게 합니다. 거꾸로 사용자가 준 <code>d</code> 링크는 코드를 못 돌리는 모델이 풀지 못하는데, 두 모델 모두 지어내지 않고 파일을 청했습니다. 코드를 돌리는 모델은 <code>d</code>를 풀어 고치고 새 <code>d</code> 링크를 냈습니다.</li>
<li>안내서는 <b>영어</b>로 썼습니다(LG1의 까닭). 시안의 글은 한국어입니다.</li>
</ul>

<h2>왜 필요한가</h2>
<p>다른 LLM은 AriadneNSD의 화면을 조작하지 못합니다. 할 수 있는 것은 <b>글을 내놓는 것</b>뿐입니다: 링크, 파일, 코드 블록. AriadneNSD의 공유 링크는 문서 전체를 URL의 <code>#</code> 뒤에 담으므로(<a href="https://github.com/reddiana/AriadneNSD/blob/main/atelier/adr/0043-share-link-in-fragment.md">ADR-0043</a>), LLM이 그 형식을 알면 서버도 계정도 없이 "누르면 열리는" 결과를 줄 수 있습니다.</p>
<p>그런데 지금 LLM이 <code>https://ariadnensd.com</code>을 읽으러 오면 보이는 것은 <code>AriadneNSD 불러오는 중… · Loading…</code> 한 줄입니다(앱이 자바스크립트로 그려지는 SPA). 형식을 알려 주는 곳이 없습니다. 그래서 준비할 것은 셋입니다.</p>
<ol>
<li><b>안내서</b> <code>/llms.txt</code>: 모델 JSON의 짧은 설명, 블록 종류, 규칙, 예제, 링크 만드는 법, 사용자가 준 링크를 읽는 법(<a href="https://llmstxt.org/">llmstxt.org</a>의 관례). 첫 화면 HTML에서 이것을 가리킵니다.</li>
<li><b>LLM이 손으로 쓸 수 있는 링크 꾸림</b> <code>#ns1.u.&lt;encodeURIComponent(JSON)&gt;</code>.</li>
<li>(덤) 모델 JSON의 <b>JSON Schema</b>: 도구 호출(구조화 출력)을 쓰는 에이전트용.</li>
</ol>

<h3>추천하는 흐름</h3>
<div class="flow">
  <div class="box"><b>1. 사용자 → LLM</b>"ariadnensd.com으로 버블 정렬을 그려 주세요"</div><div class="arrow">→</div>
  <div class="box"><b>2. LLM</b><code>/llms.txt</code>를 읽고 모델 JSON을 써서 <code>#ns1.u.…</code> 공유 링크를 줌</div><div class="arrow">→</div>
  <div class="box app"><b>3. 앱</b>링크를 누르면 보기 모드. "편집하기"로 고침</div><div class="arrow">→</div>
  <div class="box app"><b>4. 앱</b>파일 › 공유 링크 복사 (<code>#ns1.d.…</code>)</div><div class="arrow">→</div>
  <div class="box"><b>5. 다시 LLM</b>코드를 돌리면 <code>d</code>를 풀어 고침. 못 돌리면 저장 파일(<code>.ns.svg</code>)을 청함</div>
</div>

<h2>실험</h2>
<p>이 저장소를 모르는 새 서브에이전트(Claude haiku · sonnet · opus)에게 <b>안내서 초안 파일 하나만</b> 읽게 하고(다른 파일 · 웹 금지), 채팅 창의 LLM처럼 <b>코드를 돌리지 말고</b> 답하게 했습니다. 하나씩은 코드 실행을 허락해 ChatGPT의 Python 도구 같은 경우를 흉내 냈습니다. 답은 사용자에게 보이는 그대로(markdown) 파일로 저장하게 하고, 검사 스크립트 <code>journal/assets/2026-11-09-llm-guide-check.mjs</code>가 그 답에서 링크를 채팅 앱처럼 떼어 내(markdown 링크는 괄호의 짝까지) 앱과 같은 <code>parseModel</code>로 열었습니다(<code>j</code> · <code>d</code>는 앱의 <code>readShareLink</code>, <code>u</code>는 <code>new URL(link).hash</code> → <code>decodeURIComponent</code>). 통과한 것은 앱의 렌더러(<code>renderDoc</code> + 서브셋 글꼴)로 그림을 만들고, 지금의 <code>j</code> · <code>d</code> 꾸림으로 실제 링크를 만들었습니다. 그 링크는 <code>journal/assets/2026-11-09-llm-guide-open.mjs</code>가 로컬 앱(<code>pnpm dev</code>, 5173)에서 Playwright로 열어 보기 모드에 그림이 나오는 것을 확인했습니다(서버는 끝나고 껐습니다).</p>
<p>과제의 말은 메인테이너의 원문 그대로입니다: "https://ariadnensd.com 으로 버블소트 알고리즘을 nsd로 그려주세요", 이진 탐색, "switch 문을 쓰는 간단한 계산기(+, -, *, /, 0으로 나누기 처리)". 덧붙인 요청을 따라 v2부터는 <b>링크를 받아 고치는</b> 과제를 더했습니다: 앱의 "공유 링크 복사"로 만든 버블 정렬 링크(<code>d</code>, 그리고 비교로 <code>j</code>)를 주고 "swapped 플래그를 더해 고쳐 주세요".</p>
<details><summary>고치기 과제의 사용자 메시지 (d 링크)</summary><pre>${esc(prompts['modify-d'])}</pre></details>

<h3>안내서를 고친 차례</h3>
<div class="table-wrap"><table>
<tr><th>판</th><th>바꾼 것</th><th>까닭</th></tr>
<tr><td>v1</td><td>모델 JSON · 블록 · 규칙 · 예제 둘, <code>u</code> 링크 만드는 법과 손으로 인코딩할 글자 표, 코드를 돌릴 때의 <code>d</code>, 파일로 줄 때</td><td>첫 초안</td></tr>
<tr><td>v2</td><td>"공유 링크 복사가 만드는 것과 같은 공유 링크를 주라", 사용자에게 보기 모드 · 편집하기 · 공유 링크 복사 · 저장을 한두 문장으로 알리라, <b>사용자가 준 링크를 읽는 법</b>(u · j · d 표와 Python 한 줄), 코드가 없으면 <code>d</code>를 짐작하지 말고 파일을 청하라, id를 지키라. <code>locale</code>은 "한국어로 말하면 ko"</td><td>메인테이너의 덧붙인 요청. v1에서 두 답이 한국어 사용자에게 <code>locale: "en"</code>을 씀. v1의 코드 실행 답이 <code>d</code> 대신 <code>u</code>를 냄</td></tr>
<tr><td>v3</td><td>"링크는 맨 끝에, 코드 블록의 JSON에서 조각조각 만들고 <code>%7B</code>와 <code>%7D</code>, <code>%5B</code>와 <code>%5D</code>의 수를 세어 보라"</td><td>v2의 haiku가 링크에서 <code>}</code> 하나를 더함(JSON 코드 블록은 맞음)</td></tr>
</table></div>
<p>v3에서도 haiku는 다섯 번 가운데 한 번 <code>}</code> 하나를 빠뜨렸습니다. 안내서의 글로는 더 줄이기 어렵다고 보고, 앱 쪽에서 받아 주는 길을 LG6에 물음으로 두었습니다.</p>

<h3>결과</h3>
<div class="table-wrap"><table>
<tr><th>안내서</th><th>모델</th><th>과제</th><th>결과</th><th>링크 길이</th><th>실제 링크 (지금의 꾸림)</th></tr>
${resultRows}
</table></div>
<p>실패한 것:</p><ul>${failures}</ul>
<p>"링크 길이"는 모델이 낸 링크(<code>u</code>, 코드 실행 답은 <code>d</code>)의 글자 수입니다. 같은 문서의 <code>u</code>는 <code>d</code>의 약 3배, <code>j</code>는 약 2배였습니다. 블록 10개 안팎에서 <code>u</code>는 1.2 ~ 2.2 KB로, 길다고 알리는 8 KB(<a href="https://github.com/reddiana/AriadneNSD/blob/main/atelier/decisions/ux-decisions.md">SH2</a>)보다 넉넉히 짧습니다.</p>

<h3>그림 (앱의 렌더러로 그림)</h3>
<p>통과한 답의 모델을 앱의 <code>renderDoc</code>으로 그린 것입니다. "앱에서 열기"는 지금 배포된 앱이 여는 <code>d</code> 링크입니다(공개 사이트가 이 판보다 앞이면 열리지 않을 수 있습니다).</p>
<div class="figs">
${figures}
</div>

<h2>결정할 물음</h2>
<p>모두 <span class="star">★ 추천</span>을 첫째에 두었습니다. 기준은 "LLM에게는 공유 링크를 주라고, 사람에게는 공유 링크 복사를 쓰라고 추천한다"입니다.</p>

<section class="q" id="LG1">
<h3><span class="tag">LG1</span>안내서의 자리와 언어</h3>
<p>LLM이 <code>https://ariadnensd.com</code>을 받으면 첫 화면 HTML을 읽습니다. 지금은 "Loading…" 한 줄뿐입니다.</p>
<div class="opts">
<div class="opt rec"><h4><span class="n">1</span><span class="star">★</span> 영어 <code>/llms.txt</code> 하나 + 첫 화면 HTML이 가리킴</h4>
<pre>&lt;!-- index.html --&gt;
&lt;link rel="alternate" type="text/markdown"
      href="/llms.txt" title="Guide for AI assistants"&gt;
&lt;meta name="description" content="… AI assistants:
  read /llms.txt to make a share link."&gt;
…
&lt;p id="ans-boot-text"&gt;AriadneNSD 불러오는 중… · Loading…
  &lt;a href="/llms.txt"&gt;For AI assistants&lt;/a&gt;&lt;/p&gt;</pre>
<p>사용법(<code>/manual/ko/</code>)에는 "AI에게 그려 달라고 하기" 한 꼭지를 두고 이 파일을 가리킵니다.</p></div>
<div class="opt"><h4><span class="n">2</span>영어 <code>/llms.txt</code> + 한국어 <code>/llms.ko.txt</code></h4><p>사람이 읽기는 좋지만, 같은 내용 둘을 맞춰 두어야 하고 LLM은 어느 쪽이든 잘 읽습니다.</p></div>
<div class="opt"><h4><span class="n">3</span>사용법 안의 HTML 페이지만</h4><p><code>/manual/ko/ai.html</code>. 사람에게는 자연스럽지만 llms.txt 관례를 아는 도구가 찾지 못하고, HTML 둘레가 토큰을 먹습니다.</p></div>
</div>
<p class="why"><b>추천 까닭:</b> 영어는 모든 LLM이 가장 정확히 따르는 말이고, 필드 이름 · 예제가 이미 영어라 섞이지 않습니다. 실험의 모델들은 영어 안내서를 읽고 한국어 사용자에게 한국어로 답하며 블록 글자도 한국어로 썼습니다. 첫 화면이 가리키지 않으면 LLM은 <code>/llms.txt</code>를 찾아보지 않을 수 있습니다(관례일 뿐 표준이 아님). 크기는 약 9 KB로 한 번에 읽힙니다.</p>
</section>

<section class="q" id="LG2">
<h3><span class="tag">LG2</span>LLM이 만드는 링크의 꾸림</h3>
<p>같은 버블 정렬(opus의 답)을 꾸림마다 만든 모습입니다. 앞 120자만 보입니다.</p>
<div class="opts">
<div class="opt rec"><h4><span class="n">1</span><span class="star">★</span> <code>u</code>: 퍼센트 인코딩한 JSON을 더함 (읽기만)</h4>
<pre>${esc(short(sample.real.u))}</pre><p>${sample.real.u.length}자. 손으로 만들 수 있고(실험 ${rows.filter((r) => r.result.links[0]?.packing === 'u' && r.result.links[0].ok).length}번 열림), 사람과 LLM이 읽을 수 있습니다. 앱은 읽기만 하고, 공유 링크 복사는 지금처럼 <code>d</code>를 만듭니다.</p></div>
<div class="opt"><h4><span class="n">2</span><code>j</code>: 지금의 base64</h4>
<pre>${esc(short(sample.real.j))}</pre><p>${sample.real.j.length}자. 앱이 이미 읽습니다. 하지만 UTF-8 → base64를 손으로 하면 한 글자만 틀려도 뒤가 모두 깨지고, 한국어가 들면 더 어렵습니다.</p></div>
<div class="opt"><h4><span class="n">3</span><code>d</code>만 (코드를 돌리는 LLM만)</h4>
<pre>${esc(short(sample.real.d))}</pre><p>${sample.real.d.length}자로 가장 짧지만 deflate가 필요해 코드 도구가 없는 채팅에서는 만들 수 없습니다. 안내서는 코드가 있으면 이것을 쓰라고 함께 적습니다.</p></div>
<div class="opt"><h4><span class="n">4</span>파일만 (<code>.ns.svg</code>)</h4>
<pre>&lt;svg xmlns="http://www.w3.org/2000/svg" …&gt;
  &lt;metadata&gt;&lt;ans:document … version="1"&gt;&lt;![CDATA[
{…model JSON…}
  ]]&gt;&lt;/ans:document&gt;&lt;/metadata&gt;
&lt;/svg&gt;</pre><p>지금도 열립니다(그림 없이 모델만 든 파일). 하지만 사용자가 파일로 저장하고 앱에서 열어야 합니다. 안내서는 큰 문서의 대안으로만 적습니다.</p></div>
<div class="opt"><h4><span class="n">5</span>짧은 글 DSL (예: 들여쓰기)</h4>
<pre>method bubbleSort(a, n)
  for i = 0 to n - 2
    for j = 0 to n - 2 - i
      if a[j] &gt; a[j + 1]
        temp = a[j] …</pre><p>쓰기 쉽지만 문법 · 파서 · 명세를 하나 더 지켜야 하고, 이번 실험에서 JSON이 틀린 적이 없었습니다. 지금은 필요 없다고 봅니다.</p></div>
</div>
<p class="why"><b>추천 까닭:</b> 사람에게 추천하는 길(공유 링크 복사)과 LLM에게 추천하는 길(공유 링크)이 같은 "누르면 열리는 링크"가 됩니다. 앱에는 <code>readShareLink</code>에 꾸림 하나(<code>u.</code> → <code>decodeURIComponent</code>, 길이 · 크기 한도와 <code>parseModel</code>은 그대로)를 더하면 됩니다. <code>u</code>는 압축이 없어 zip bomb 걱정도 없습니다. ADR-0043은 제안됨 상태라 고쳐 쓸 수 있습니다.</p>
</section>

<section class="q" id="LG3">
<h3><span class="tag">LG3</span>모델 JSON의 JSON Schema</h3>
<div class="opts">
<div class="opt rec"><h4><span class="n">1</span><span class="star">★</span> <code>/model.schema.json</code>을 따로 두고 안내서에서 한 줄로 가리킴</h4><p>도구 호출 · 구조화 출력을 쓰는 에이전트가 가져다 씁니다. 안내서는 짧게 둡니다. 초안: <code>journal/assets/2026-11-09-llm-guide-model.schema.json</code>(아래에 펼침).</p></div>
<div class="opt"><h4><span class="n">2</span>안내서 안에 넣기</h4><p>약 6 KB가 늘어 안내서가 두 배 가까이 됩니다. 실험의 모델들은 스키마 없이 표와 예제만으로 맞게 썼습니다.</p></div>
<div class="opt"><h4><span class="n">3</span>두지 않음</h4><p>지금은 충분하지만, 코드에서 뽑지 않은 스키마는 형식과 어긋나기 쉽다는 점은 1번도 같습니다.</p></div>
</div>
<p class="why"><b>추천 까닭:</b> 비용이 작고 안내서를 무겁게 하지 않습니다. 스키마는 모양만 검사하고 불변식(id 한 번, 빈 줄 없음 등)은 앱이 검사한다고 적었습니다. 스키마가 <code>parseModel</code>과 어긋나지 않게 core의 테스트가 골든 파일들을 스키마로 검사하게 하는 것을 함께 추천합니다(만들 때 정함).</p>
<details><summary>스키마 초안 펼치기</summary><pre>${esc(schema)}</pre></details>
</section>

<section class="q" id="LG4">
<h3><span class="tag">LG4</span>요구사항 ID</h3>
<div class="opts">
<div class="opt rec"><h4><span class="n">1</span><span class="star">★</span> <code>R-WEB-10</code>을 새로</h4><pre>| R-WEB-10 | LLM · 에이전트를 위한 안내서(/llms.txt):
  다른 AI가 공유 URL(R-WEB-05)을 만들어 주고,
  사용자가 준 공유 URL을 읽을 수 있게 한다 → 상세 | P1 |</pre><p><code>u</code> 꾸림은 R-WEB-05의 상세(06-web)에 적습니다.</p></div>
<div class="opt"><h4><span class="n">2</span>R-WEB-05(공유 URL)에 덧붙임</h4><p>한 요구사항이 길어지고, 안내서(정적 파일)와 링크 형식이 한 줄에 섞입니다.</p></div>
<div class="opt"><h4><span class="n">3</span>R-SKILL 영역에</h4><p>R-SKILL-01은 Claude skill(P3)입니다. 안내서는 skill 없이 아무 LLM에게나 듣는 웹의 것이라 자리가 맞지 않습니다. 나중의 skill은 이 안내서를 그대로 씁니다.</p></div>
</div>
<p class="why"><b>추천 까닭:</b> 웹이 내놓는 정적 파일이고, 웹 1.0 전에 넣기 쉽습니다(llms.txt 한 장, 읽는 꾸림 하나, index.html 몇 줄). 우선순위는 <code>P1</code>을 추천합니다: 비용이 작고, "AI에게 그려 달라 하면 링크가 온다"는 것이 처음 온 사람에게 가장 쉬운 입구가 될 수 있습니다.</p>
</section>

<section class="q" id="LG5">
<h3><span class="tag">LG5</span>사용자가 준 링크를 LLM이 읽는 길 (앱 쪽)</h3>
<p>사람이 앱에서 고친 뒤 공유 링크 복사로 만든 링크는 <code>d</code>입니다. 실험: 코드를 못 돌리는 haiku · sonnet은 둘 다 짐작하지 않고 "파일 › 저장한 <code>.ns.svg</code>를 붙여 달라"고 했고, 코드를 돌리는 sonnet은 풀어 고쳐 새 <code>d</code> 링크를 냈습니다. <code>j</code>를 받은 모델(haiku · sonnet · opus)은 코드 없이 머리로 base64를 풀어 셋 다 맞게 고쳤습니다. 남은 블록의 id도 지켰습니다(haiku만 바꾼 바깥 반복의 id <code>b1</code>을 새 처리 블록에 다시 씀).</p>
<div class="opts">
<div class="opt rec"><h4><span class="n">1</span><span class="star">★</span> 지금처럼 공유 링크 복사는 <code>d</code> 하나</h4>
<div class="flow"><div class="box app">공유 링크 복사 → <code>d</code></div><div class="box">코드 있는 LLM: 풂</div><div class="box">코드 없는 LLM: 파일을 청함</div></div>
<p>사람에게 추천하는 명령이 하나로 남습니다. 요즘 채팅 LLM은 대개 코드 도구가 있습니다. 저장 파일은 텍스트라 첨부하면 읽힙니다.</p></div>
<div class="opt"><h4><span class="n">2</span>공유 링크 복사가 <code>u</code>나 <code>j</code>를 만듦</h4><p>모든 LLM이 읽지만 링크가 2 ~ 3배 길어져 8 KB 경고에 일찍 닿고, 메신저에서 잘리기 쉬워집니다. 사람끼리의 공유가 나빠집니다.</p></div>
<div class="opt"><h4><span class="n">3</span>메뉴를 하나 더: "AI에게 줄 링크 복사" (<code>u</code>)</h4>
<div class="mock"><div class="bar"><span>파일</span></div><div class="body">내보내기 ▸<br><b>공유 링크 복사</b><br>AI에게 줄 링크 복사</div></div>
<p>가장 확실하지만 SH6(공유는 명령 하나)과 어긋나고, 사람이 둘 가운데 고민합니다.</p></div>
</div>
<p class="why"><b>추천 까닭:</b> 메인테이너의 기준("공유 링크 복사를 추천")과 가장 잘 맞고, 실험에서 코드 없는 모델도 바르게 행동했습니다(지어내지 않음). 써 보고 불편하면 3번을 다시 봅니다.</p>
</section>

<section class="q" id="LG6">
<h3><span class="tag">LG6</span>열지 못한 링크의 까닭을 보일까</h3>
<p>지금 깨진 링크는 "링크가 손상되었습니다" 같은 한 줄만 보이고 자세한 까닭은 콘솔에만 남습니다. LLM이 만든 링크가 깨지면 사용자는 LLM에게 무엇이 틀렸는지 말할 수 없습니다. 실험의 실패 둘은 모두 닫는 괄호 하나였습니다(v2는 <code>}</code> 하나 더함, v3는 맨 끝의 <code>}</code> 하나 빠짐).</p>
<div class="opts">
<div class="opt rec"><h4><span class="n">1</span><span class="star">★</span> 까닭을 보이고 복사하게</h4>
<div class="mock"><div class="bar"><span>AriadneNSD</span><span class="btn">닫기</span></div><div class="body"><div class="toast">공유 링크를 열지 못했습니다: 링크의 JSON이 694번째 글자에서 끝나지 않았습니다(<code>}</code>가 빠졌을 수 있음).<br><span class="btn">까닭 복사</span> — 링크를 만든 AI에게 붙여 주세요.</div></div></div>
<p>파일을 열 때의 <code>detail</code>(영어, 개발자용)을 그대로 보여 줍니다. 안내서에도 "사용자가 이 글을 붙이면 고쳐서 다시 주라"고 적습니다.</p></div>
<div class="opt"><h4><span class="n">2</span>1번 + <code>u</code>에서 끝의 괄호만 맞춰 열기</h4><p><code>u</code>의 JSON이 끝에서만 모자라거나 남으면 닫는 괄호를 맞춰 연 뒤 "고쳐서 열었다"고 알립니다. 실험의 실패 가운데 v3의 것(맨 끝이 모자람)은 열리고, v2의 것(가운데에 하나 더함)은 열리지 않습니다. 다만 "파일과 같은 검증"(QA-02)에 예외가 생깁니다.</p></div>
<div class="opt"><h4><span class="n">3</span>지금처럼</h4><p>한 줄 알림만. 사용자는 LLM에게 "안 열린다"고만 말할 수 있습니다.</p></div>
</div>
<p class="why"><b>추천 까닭:</b> 검증은 그대로 두고 고칠 길만 엽니다. 2번은 실패를 줄이지만 링크마다 다른 규칙이 생겨, 1번을 써 본 뒤에 다시 보는 것을 추천합니다.</p>
</section>

<h2>안내서 초안 전문 (v3)</h2>
<p>저장소의 사본: <code>journal/assets/2026-11-09-llms-v3.txt</code>(v1 · v2도 같은 폴더). 배포할 때의 자리는 <code>src/apps/web/public/llms.txt</code>(Vite가 사이트 루트에 그대로 냄)를 생각합니다. 예제의 <code>u</code> 링크는 검사 스크립트로 만든 것입니다.</p>
<pre class="guide">${esc(guide)}</pre>

<h2>파일</h2>
<ul>
<li><code>journal/assets/2026-11-09-llm-guide-study.html</code>: 이 페이지 (만드는 스크립트 <code>…-build.mjs</code>)</li>
<li><code>journal/assets/2026-11-09-llms-v1.txt</code> · <code>-v2.txt</code> · <code>-v3.txt</code>: 안내서 초안</li>
<li><code>journal/assets/2026-11-09-llm-guide-model.schema.json</code>: JSON Schema 초안</li>
<li><code>journal/assets/2026-11-09-llm-guide-check.mjs</code>: 검사 스크립트 (Vite로 core와 웹의 share-link를 불러 <code>parseModel</code>로 엶, 결과 <code>…-results.json</code>). <code>--encode &lt;봉투.json&gt;</code>은 u · j · d 링크를 만듦</li>
<li><code>journal/assets/2026-11-09-llm-guide-open.mjs</code>: 실제 링크를 로컬 앱에서 여는 Playwright 스크립트</li>
<li><code>journal/assets/2026-11-09-llm-guide-runs/</code>: 모델들의 답 그대로와 고치기 과제의 사용자 메시지</li>
</ul>
<p>그림 속 글꼴은 앱이 번들한 블록 글꼴의 서브셋입니다(SIL Open Font License 1.1).</p>
</div>
</body>
</html>
`;

await writeFile(join(here, '2026-11-09-llm-guide-study.html'), html);
console.log(`wrote ${String(html.length)} characters`);
