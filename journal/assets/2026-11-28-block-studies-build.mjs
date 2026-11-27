// M80 탈출 · M81 병렬 처리 · M82 주석 시안을 만든다. 틀(CSS · 꼬리말)은 M79에서 가져오고, 렌더러는 M33 · M79를 넓힌 것.
// 실행: node journal/assets/2026-11-28-block-studies-build.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = dirname(fileURLToPath(import.meta.url));
const m79 = readFileSync(join(dir, '2026-11-28-endless-loop-study.html'), 'utf8');
const style = m79.slice(m79.indexOf('<style>'), m79.indexOf('</style>') + 8);
const footer = m79.slice(m79.indexOf('<footer'), m79.indexOf('참고 그림:')).trimEnd();
const head = title => `<title>${title}</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans+KR:wght@400;500;600&display=swap">
${style}`;
const aus = 'data:image/png;base64,' + readFileSync(join(dir, '2026-11-28-din-aussprung.png')).toString('base64');

// 브라우저에서 도는 렌더러. 블록: 문자열(처리) | {exit, style} | {iff, yes, no} | {loop, text, body} | {par: [seq…], style, text}
// | {note, style} | {proc, cmt, style} | {call}
const renderer = String.raw`
const C = { line: '#5b77ad', text: '#151a22', muted: '#5a6476', proc: '#edf0f5', loop: '#dce6f6', branch: '#f6ebdc', call: '#ebe7f4', event: '#e2efdf', paper: '#fffbe8', white: '#ffffff' };
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const svg = (w, h, body) => '<svg width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '">' + body + '</svg>';
const rect = (x, y, w, h, fill, extra) => '<rect x="' + (x + .5) + '" y="' + (y + .5) + '" width="' + w + '" height="' + h + '" fill="' + fill + '" stroke="' + C.line + '" ' + (extra || '') + '/>';
const line = (pts, extra) => '<polyline points="' + pts.map(p => (p[0] + .5) + ',' + (p[1] + .5)).join(' ') + '" fill="none" stroke="' + C.line + '" ' + (extra || '') + '/>';
const text = (x, y, s, o) => { o = o || {}; return '<text x="' + x + '" y="' + y + '" fill="' + (o.fill || C.text) + '"' + (o.anchor ? ' text-anchor="' + o.anchor + '"' : '') + (o.size ? ' font-size="' + o.size + '"' : '') + (o.italic ? ' font-style="italic"' : '') + (o.mono === false ? '' : ' font-family="IBM Plex Mono, monospace"') + '>' + esc(s) + '</text>'; };
const ROW = 32, HEAD = 32, STRIP = 22, BAND = 18;
const parBands = b => b.style === 'din' ? [b.text ? HEAD : BAND, BAND] : b.style === 'top' ? [b.text ? HEAD : BAND, 0] : [8, 8];
function H(b) {
  if (typeof b === 'string' || b.exit != null || b.proc != null || b.call != null) return ROW;
  if (b.note != null) return b.lines ? 14 + b.lines.length * 17 : ROW;
  if (b.iff) return HEAD + Math.max(S(b.yes), S(b.no));
  if (b.par) { const [t, u] = parBands(b); return t + Math.max(...b.par.map(S)) + u; }
  return S(b.body) + ({ while: HEAD, doWhile: HEAD, e1: STRIP * 2 })[b.loop];
}
const S = bs => bs.reduce((a, b) => a + H(b), 0);
function arrowMark(x, y) { return '<path d="M' + x + ',' + y + ' h-10 m0,0 l4,-4 m-4,4 l4,4 M' + x + ',' + y + ' v-8" fill="none" stroke="' + C.muted + '" stroke-width="1.4"/>'; }
function draw(x, y, w, b, h) {
  h = h || H(b);
  if (typeof b === 'string') return rect(x, y, w, h, C.proc) + text(x + 10, y + 21, b);
  if (b.call != null) return rect(x, y, w, h, C.call) + '<line x1="' + (x + 6.5) + '" y1="' + y + '" x2="' + (x + 6.5) + '" y2="' + (y + h) + '" stroke="' + C.line + '"/><line x1="' + (x + w - 5.5) + '" y1="' + y + '" x2="' + (x + w - 5.5) + '" y2="' + (y + h) + '" stroke="' + C.line + '"/>' + text(x + 14, y + 21, b.call);
  if (b.exit != null) {
    const st = b.style || 'din';
    let s = rect(x, y, w, h, C.proc);
    if (st === 'din') return s + line([[x + 14, y], [x, y + h / 2], [x + 14, y + h]]) + text(x + 22, y + 21, b.exit);
    if (st === 'arrow') return s + arrowMark(x + w - 8, y + 20) + text(x + 10, y + 21, b.exit);
    if (st === 'kind') return s + line([[x + 14, y], [x, y + h / 2], [x + 14, y + h]]) + '<rect x="' + (x + 20.5) + '" y="' + (y + 7.5) + '" width="' + (b.kw.length * 7.4 + 10) + '" height="18" rx="3" fill="' + C.white + '" stroke="' + C.muted + '"/>' + text(x + 25, y + 21, b.kw, { size: 11.5 }) + text(x + 34 + b.kw.length * 7.4, y + 21, b.exit);
    return s + text(x + 10, y + 21, b.exit);
  }
  if (b.proc != null) {
    let s = rect(x, y, w, h, C.proc) + text(x + 10, y + 21, b.proc);
    if (!b.cmt) return s;
    if (b.style === 'side') return s + text(x + w - 8, y + 21, '// ' + b.cmt, { fill: C.muted, anchor: 'end', size: 11.5, italic: true });
    if (b.style === 'mark') return s + '<path d="M' + (x + w - 16) + ',' + (y + 6) + ' h10 v7 h-5 l-3,3 v-3 h-2z" fill="' + C.paper + '" stroke="' + C.muted + '"/>';
    return s;
  }
  if (b.note != null) {
    const lines = b.lines || [b.note], st = b.style || 'dash';
    let s = '';
    if (st === 'dash') s += '<rect x="' + (x + .5) + '" y="' + (y + .5) + '" width="' + w + '" height="' + h + '" fill="' + C.white + '" stroke="' + C.line + '"/><rect x="' + (x + 3.5) + '" y="' + (y + 3.5) + '" width="' + (w - 6) + '" height="' + (h - 6) + '" fill="none" stroke="' + C.muted + '" stroke-dasharray="4 3"/>';
    if (st === 'paper') s += rect(x, y, w, h, C.paper) + '<path d="M' + (x + w - 12.5) + ',' + (y + .5) + ' l12,12 h-12z" fill="' + C.white + '" stroke="' + C.line + '"/>';
    if (st === 'slash') s += rect(x, y, w, h, C.proc);
    lines.forEach((t, i) => { s += text(x + 10, y + 21 + i * 17 - (b.lines ? 1 : 0), (st === 'slash' ? '// ' : '') + t, { fill: C.muted, italic: true, mono: st === 'slash' }); });
    return s;
  }
  if (b.iff) {
    const hw = Math.round(w / 2);
    let s = rect(x, y, w, HEAD, C.branch) + line([[x, y], [x + hw, y + HEAD], [x + w, y]]);
    s += text(x + hw, y + 14, b.iff, { anchor: 'middle' });
    s += text(x + 6, y + HEAD - 4, '참', { size: 10, fill: C.muted, mono: false }) + text(x + w - 6, y + HEAD - 4, '거짓', { size: 10, fill: C.muted, mono: false, anchor: 'end' });
    return s + seq(x, y + HEAD, hw, b.yes, h - HEAD) + seq(x + hw, y + HEAD, w - hw, b.no, h - HEAD);
  }
  if (b.par) {
    const [t, u] = parBands(b), n = b.par.length, cw = Math.floor(w / n), st = b.style;
    let s = rect(x, y, w, h, C.loop);
    if (st === 'din') {
      const d = Math.min(t, 18);
      s += line([[x + d, y], [x, y + t]]) + line([[x + w - d, y], [x + w, y + t]]) + line([[x, y + h - u], [x + d, y + h]]) + line([[x + w, y + h - u], [x + w - d, y + h]]);
    }
    if (st === 'top') { const d = Math.min(t, 18); s += line([[x + d, y], [x, y + t]]) + line([[x + w - d, y], [x + w, y + t]]); }
    if (st === 'bar') s += '<rect x="' + x + '" y="' + y + '" width="' + (w + 1) + '" height="8" fill="' + C.line + '"/><rect x="' + x + '" y="' + (y + h - 7) + '" width="' + (w + 1) + '" height="8" fill="' + C.line + '"/>';
    if (b.text) s += text(x + w / 2, y + 21, b.text, { anchor: 'middle' });
    const bodyH = h - t - u;
    b.par.forEach((q, i) => { s += seq(x + i * cw, y + t, i === n - 1 ? w - i * cw : cw, q, bodyH); });
    return s;
  }
  let s = rect(x, y, w, h, C.loop), top = 0;
  if (b.loop === 'while') { top = HEAD; s += text(x + 10, y + 21, b.text); }
  if (b.loop === 'e1') top = STRIP;
  if (b.loop === 'doWhile') s += text(x + 10, y + h - 11, b.text);
  return s + seq(x + STRIP, y + top, w - STRIP, b.body);
}
function seq(x, y, w, bs, fill) {
  let s = '', yy = y; const total = S(bs);
  bs.forEach((b, i) => {
    let h = H(b);
    if (i === bs.length - 1 && fill && fill > total) {
      const simple = typeof b === 'string' || b.exit != null || b.proc != null || b.note != null || b.call != null;
      if (simple) h += fill - total; else s += rect(x, yy + h, w, fill - total, C.proc);
    }
    s += draw(x, yy, w, b, h); yy += h;
  });
  return s;
}
function diagram(name, body, w, kind) {
  const hh = 30; let s = '<rect x=".5" y=".5" width="' + w + '" height="' + hh + '" fill="' + (kind === 'method' ? C.call : C.event) + '" stroke="' + C.line + '"/>' + text(10, 20, name, { mono: kind === 'method' });
  s += seq(0, hh, w, body);
  return svg(w + 2, hh + S(body) + 2, s);
}
const one = (b, w) => svg(w + 2, H(b) + 2, draw(0, 0, w, b));
function keys(title, list, hot) {
  const W = 470, rows = Math.ceil(list.length / 3), Hh = 40 + rows * 22;
  let b = '<rect x=".5" y=".5" width="' + (W - 1) + '" height="' + (Hh - 1) + '" rx="5" fill="#f5f7fb" stroke="#d4dbe6"/>' + text(12, 20, title, { size: 12, mono: false });
  list.forEach((kn, i) => {
    const col = i % 3, row = Math.floor(i / 3), x = 12 + col * 152, y = 44 + row * 22, on = hot.indexOf(kn[1]) >= 0;
    if (on) b += '<rect x="' + (x - 5.5) + '" y="' + (y - 14.5) + '" width="140" height="20" rx="4" fill="none" stroke="#1d7a46" stroke-width="1.5"/>';
    b += text(x, y, kn[0], { size: 12.5, fill: '#2c55c9' }) + text(x + 16, y, kn[1], { size: 12, mono: false });
  });
  return svg(W, Hh, b);
}
`;

const card = (tag, title, fig, items, pick) => `      <article class="card${pick ? ' pick' : ''}"><header><span class="tag">${tag}</span><h3>${title}</h3>${pick ? '<span class="badge">Claude의 추천</span>' : ''}</header>
        <div class="fig" data-fig="${fig}"></div>
        <ul>${items.map(i => `<li>${i}</li>`).join('')}</ul>
      </article>`;
const section = (part, h2, qs, cards) => `  <section>
    <span class="part">${part}</span>
    <h2>${h2}</h2>
${qs.map(q => `    <p class="q">${q}</p>`).join('\n')}
    <div class="cards">
${cards.join('\n')}
    </div>
  </section>`;
const page = (title, h1, lede, sections, answer, figs) => `${head(title)}

<main>
  <div>
    <h1>${h1}</h1>
    <p class="lede">${lede}</p>
  </div>

${sections.join('\n\n')}

  <section>
    <h2>답하실 것</h2>
    <div class="sum"><ol>
${answer.map(a => `      <li>${a}</li>`).join('\n')}
    </ol></div>
  </section>
</main>

<script>
(() => {
${renderer}
const F = {
${Object.entries(figs).map(([k, v]) => `  '${k}': ${v},`).join('\n')}
};
document.querySelectorAll('[data-fig]').forEach(el => { el.innerHTML = F[el.dataset.fig]; });
})();
</script>

${footer}`;
const bad = s => `<span class="bad">${s}</span>`;
const KIND = `[['p', '처리'], ['i', 'If'], ['w', 'While'], ['d', 'Do-While'], ['f', 'For'], ['k', 'Case'], ['c', '호출']`;
const keyFig = (extra, hot) => `keys('a  뒤에 넣기', ${KIND}, ${extra}], ${JSON.stringify(hot)})`;

// ───────── M80 탈출 ─────────
const searchBody = kind => `[{ loop: 'e1', body: ['x ← 읽기()', { iff: 'x = 끝', yes: [{ exit: 'break', style: '${kind}'${kind === 'kind' ? ", kw: 'break'" : ''} }], no: ['처리(x)'] }] }, { exit: 'return 합', style: '${kind}'${kind === 'kind' ? ", kw: 'return'" : ''} }]`;
const m80 = page('M80 탈출 블록', 'M80 · 탈출 블록',
  `탈출(R-BLK-12, 이제 <code>P1</code>)은 반복이나 Method를 중간에 끝내는 블록입니다(<code>break</code> · <code>return</code> · <code>exit</code>). 무한 반복(M79, 정함)에서 나가는 유일한 길이기도 합니다. 이 페이지에서 <b>모양(X1)</b>, <b>글자(X2)</b>, <b>넣는 키(X3, 무한 반복의 키도 함께)</b>를 고릅니다. 각 물음의 <b>1번이 Claude의 추천</b>입니다. 그림의 무한 반복은 M79에서 정한 모양입니다.`,
  [
    `  <section>
    <span class="part">참고</span>
    <h2>DIN 66261의 탈출(Aussprung)</h2>
    <p class="q">보통 블록의 <b>왼쪽에 꼭짓점이 왼쪽을 향하는 쐐기</b>가 있고, 쐐기 오른쪽에 나가는 곳("Zielort für Aussprung")을 적습니다. 원 논문에는 없고 DIN이 더한 기호입니다. Structorizer의 Jump도 같은 모양입니다.</p>
    <div class="ref"><figure><img src="${aus}" alt="DIN 66261의 탈출 기호: 사각형 왼쪽에 왼쪽을 향한 쐐기, 오른쪽에 Zielort für Aussprung" width="90" height="48" style="width:180px"><figcaption>독일어 위키백과의 Aussprung 그림(2배, Renzsorf, public domain)</figcaption></figure></div>
  </section>`,
    section('X1', 'X1. 탈출의 모양', ['원칙 2("블록 종류는 색이 없어도 모양만으로 가려진다")를 기준으로 견줍니다. 바탕색은 세 판 모두 처리 블록과 같습니다.'], [
      card('X1 · 1번', 'DIN 그대로: 왼쪽 쐐기', 'x1', ['NS 차트 표준(DIN 66261)과 Structorizer의 모양입니다.', '처리 블록과 <b>모양으로 가려집니다</b>. 쐐기가 "밖으로 나간다"를 가리킵니다.', '쐐기 폭(14px)만큼 글자가 오른쪽으로 갑니다.'], true),
      card('X1 · 2번', '처리 블록에 ↵ 기호', 'x2', ['오른쪽 끝에 되돌아가는 화살표를 <code>text.muted</code>로 그립니다.', bad('표준에 없는 표시입니다. 긴 글자가 기호와 겹치지 않게 오른쪽 자리를 비워야 합니다.')]),
      card('X1 · 3번', '처리 블록 그대로(지금 스킬이 그리는 방식)', 'x3', ['따로 만들 것이 없습니다.', bad('처리 블록과 모양이 같아 원칙 2를 어깁니다. 무한 반복에서 나가는 곳이 눈에 띄지 않습니다.')]),
    ]),
    section('X2', 'X2. 탈출 블록의 글자', ['<b>Claude가 정해 둔 것:</b> 탈출은 반복 · Method 어디에나 넣을 수 있고, 위치를 검사하지 않습니다(NS 차트는 실행기가 아니라 그림이라서). 탈출 뒤의 블록도 그대로 둡니다. <code>continue</code>도 같은 블록에 적습니다.'], [
      card('X2 · 1번', '글자 하나를 자유롭게', 'x1', ['처리 블록처럼 <code>text</code> 하나입니다. <code>break</code>, <code>return 합</code>, <code>break outer</code>, "검색 끝"처럼 무엇이든 적습니다.', '코드에서 가져올 때(스킬 · 리버스 엔지니어링) 코드의 말을 그대로 옮깁니다.', '새로 넣으면 빈 글자로 열고 바로 적습니다(빈 블록과 같음).'], true),
      card('X2 · 2번', '종류를 고르고 값을 적음', 'x2k', ['<code>break</code> · <code>return</code> · <code>exit</code> 가운데 고르고(딱지), 뒤에 값을 적습니다.', '종류로 검사(반복 밖의 break 알리기)를 할 수 있습니다.', bad('모델이 칸 둘이 됩니다. 딱지의 말을 화면 언어마다 번역할지, Python의 <code>raise</code>처럼 목록에 없는 말은 어디에 둘지 정해야 합니다.')]),
    ]),
    section('X3', 'X3. 넣는 키 (무한 반복 · 탈출)', ['블록 넣기는 <code>a</code> / <code>A</code> + 종류 글자, 감싸기는 <code>s</code> + 종류 글자입니다. 지금 쓰는 종류 글자는 <code>p</code> <code>i</code> <code>w</code> <code>d</code> <code>f</code> <code>k</code> <code>c</code>입니다. 탈출은 처리 블록처럼 감쌀 수 없고(<code>s</code> 없음), 무한 반복은 감쌀 수 있습니다(<code>s</code> + 글자). 그림은 <code>a</code>를 누른 뒤의 키 힌트입니다.'], [
      card('X3 · 1번', '무한 반복 <code>e</code>, 탈출 <code>x</code>', 'x3k1', ['<b>e</b>ndless, e<b>x</b>it의 글자입니다. 영어 이름과 이어져 외우기 쉽습니다.', '<code>x</code>는 Vim의 "지우기"와 같은 글자지만 <code>a</code> 다음의 둘째 키로만 읽어서 겹치지 않습니다.'], true),
      card('X3 · 2번', '무한 반복 <code>l</code>, 탈출 <code>b</code>', 'x3k2', ['<b>l</b>oop, <b>b</b>reak의 글자입니다.', bad('<code>l</code>은 While · For와 같은 "반복"이라 어느 반복인지 흐립니다. <code>b</code>는 return · exit와 이어지지 않습니다.')]),
    ]),
    `  <section>
    <span class="part">X1 · 1번 · 겹침</span>
    <h2>Method 안에서(1번 · 1번)</h2>
    <p class="q">무한 반복 안의 <code>break</code>와, Method를 끝내는 <code>return</code>입니다.</p>
    <div class="fig" data-fig="nest"></div>
  </section>`,
  ],
  ['X1, X2, X3 하나씩, <b>번호</b> 또는 고칠 점.', '병렬 처리(M81)와 주석(M82)의 시안도 이어서 있습니다. 넣는 키는 세 시안을 겹치지 않게 골랐습니다.'],
  {
    x1: `one({ exit: 'return 합', style: 'din' }, 300)`,
    x2: `one({ exit: 'return 합', style: 'arrow' }, 300)`,
    x3: `one({ exit: 'return 합', style: 'plain' }, 300)`,
    x2k: `one({ exit: '합', style: 'kind', kw: 'return' }, 300)`,
    x3k1: keyFig(`, ['e', '무한 반복'], ['x', '탈출']`, ['무한 반복', '탈출']),
    x3k2: keyFig(`, ['l', '무한 반복'], ['b', '탈출']`, ['무한 반복', '탈출']),
    nest: `diagram('합계(목록)', ['합 ← 0', ...${searchBody('din')}], 340, 'method')`,
  });

// ───────── M81 병렬 처리 ─────────
const parBody = (style, text) => `{ par: [['사진 ← 받기(a)'], ['글 ← 받기(b)', '글 ← 줄이기(글)'], ['광고 ← 고르기()']], style: '${style}'${text ? `, text: '${text}'` : ''} }`;
const m81 = page('M81 병렬 처리 블록', 'M81 · 병렬 처리 블록',
  `병렬 처리(R-BLK-13, 이제 <code>P1</code>)는 갈래 여럿을 동시에(또는 차례 없이) 실행하고, 모두 끝나면 아래로 이어 가는 블록입니다. 이 페이지에서 <b>모양(P1)</b>, <b>띠의 글자(P2)</b>, <b>넣는 키(P3)</b>를 고릅니다. 각 물음의 <b>1번이 Claude의 추천</b>입니다.`,
  [
    `  <section>
    <span class="part">참고</span>
    <h2>위키백과 · Structorizer의 병렬 처리</h2>
    <p class="q">독일어 위키백과의 그림(<a href="https://commons.wikimedia.org/wiki/File:NassiShneiderman-Parallel.svg">NassiShneiderman-Parallel.svg</a>, CC BY-SA 4.0)은 <b>위 · 아래에 띠가 있고, 띠의 양 끝이 빗금으로 잘린</b> 모양입니다. 갈래는 세로선으로 나뉜 칸입니다. 위키백과는 이것이 DIN 66261에 들었는지 말하지 않습니다. Structorizer의 PARALLEL도 같은 생각입니다. 아래 그림은 이 모양을 우리 렌더러로 옮긴 것입니다(1번).</p>
  </section>`,
    section('P1', 'P1. 병렬 처리의 모양', ['바탕색은 반복과 같은 <code>block.loop</code>로 두었습니다(실행 흐름을 묶는 블록). 갈래는 Case처럼 세로로 나란히 놓입니다.'], [
      card('P1 · 1번', '위 · 아래 띠, 양 끝 빗금', 'p1', ['위키백과 · Structorizer의 모양입니다. 위 띠는 "갈라짐", 아래 띠는 "모두 끝나기를 기다림"입니다.', 'If · Case(위에만 빗금)와 <b>아래 띠로 가려집니다</b>.'], true),
      card('P1 · 2번', '위 띠만, 양 끝 빗금', 'p2', ['키가 띠 하나만큼 작습니다.', bad('"모두 끝나기를 기다림"이 그림에 없습니다. 빈 칸이 많은 Case처럼 보일 수 있습니다.')]),
      card('P1 · 3번', '위 · 아래 굵은 막대 (UML의 fork · join)', 'p3', ['UML 활동 다이어그램을 아는 사람에게 익숙합니다.', bad('NS 차트의 말이 아니고, 굵은 칠은 다른 블록에 없는 모양입니다. 흑백 인쇄에서 무겁습니다.')]),
    ]),
    section('P2', 'P2. 위 띠의 글자', ['<b>Claude가 정해 둔 것:</b> 갈래의 조작은 Case를 따릅니다. 갈래 더하기 · 지우기 · 옮기기, 최소 둘, 갈래에는 라벨이 없습니다. 새로 넣으면 빈 갈래 둘로 엽니다.'], [
      card('P2 · 1번', '비워 둠', 'p1', ['위키백과 · Structorizer와 같습니다. 모델은 갈래만 가집니다.', '글자가 필요하면 갈래 첫 블록에 적습니다.'], true),
      card('P2 · 2번', '글자를 적을 수 있음', 'p2t', ['"동시에 받기", "스레드 셋"처럼 무엇을 나누는지 적습니다. 비우면 1번과 같습니다.', bad('모델에 <code>text</code>가 하나 더 생기고, 글자가 있으면 띠가 조건 칸만큼 두꺼워집니다.')]),
    ]),
    section('P3', 'P3. 넣는 키', ['<code>p</code>는 처리가 쓰고 있습니다. M80의 추천(<code>e</code> 무한 반복, <code>x</code> 탈출)과 겹치지 않게 골랐습니다. 감싸기(<code>s</code> + 글자)는 고른 블록을 첫 갈래에 넣습니다.'], [
      card('P3 · 1번', '<code>t</code> (thread)', 'p3k1', ['"스레드 · 함께(together)"의 글자입니다.', '오른손 검지 자리라 누르기 쉽습니다.'], true),
      card('P3 · 2번', '<code>=</code> (나란한 줄)', 'p3k2', ['나란히 그은 줄 모양입니다.', bad('글자가 아니라서 키 힌트에서 찾기 어렵고, 자판마다 자리가 다릅니다.')]),
    ]),
    `  <section>
    <span class="part">P1 · 1번 · 겹침</span>
    <h2>Event 안에서(1번 · 1번)</h2>
    <div class="fig" data-fig="nest"></div>
  </section>`,
  ],
  ['P1, P2, P3 하나씩, <b>번호</b> 또는 고칠 점.'],
  {
    p1: `one(${parBody('din')}, 420)`,
    p2: `one(${parBody('top')}, 420)`,
    p3: `one(${parBody('bar')}, 420)`,
    p2t: `one(${parBody('din', '동시에 받기')}, 420)`,
    p3k1: keyFig(`, ['e', '무한 반복'], ['x', '탈출'], ['t', '병렬 처리']`, ['병렬 처리']),
    p3k2: keyFig(`, ['e', '무한 반복'], ['x', '탈출'], ['=', '병렬 처리']`, ['병렬 처리']),
    nest: `diagram('페이지를 열면', ['쪽 ← 주소에서 읽기()', ${parBody('din')}, '그리기(사진, 글, 광고)'], 420, 'event')`,
  });

// ───────── M82 주석 ─────────
const noteDiag = style => `diagram('이진 검색(a, x)', ['lo ← 0', 'hi ← n', { note: '', lines: ['불변식: x 이상인 첫 자리는', 'lo와 hi 사이에 있다'], style: '${style}' }, { loop: 'while', text: 'while lo < hi', body: ['mid ← (lo + hi) / 2', { iff: 'a[mid] < x', yes: ['lo ← mid + 1'], no: ['hi ← mid'] }] }], 380, 'method')`;
const cmtDiag = style => `diagram('이진 검색(a, x)', ['lo ← 0', { proc: 'hi ← n', cmt: '반열린 구간', style: '${style}' }, { loop: 'while', text: 'while lo < hi', body: [{ proc: 'mid ← (lo + hi) / 2', cmt: '넘침 주의', style: '${style}' }, { iff: 'a[mid] < x', yes: ['lo ← mid + 1'], no: ['hi ← mid'] }] }], 380, 'method')`;
const m82 = page('M82 주석', 'M82 · 주석',
  `주석(R-BLK-14, 이제 <code>P1</code>)은 실행되지 않고 읽는 사람에게 설명만 하는 글입니다. NS 차트 표준(DIN 66261)에는 주석 기호가 없어서, <b>먼저 방식(N1)</b>을 고르고, 블록으로 하면 <b>모양(N2)</b>과 <b>넣는 키(N3)</b>를 고릅니다. 각 물음의 <b>1번이 Claude의 추천</b>입니다.`,
  [
    section('N1', 'N1. 주석을 어디에 두나', ['요구사항은 "주석 블록"이지만, Structorizer는 <b>블록마다 주석 칸</b>을 두고 마우스를 올리거나 "주석 보기"를 켜면 보입니다. 둘은 쓰임이 다릅니다.'], [
      card('N1 · 1번', '주석 블록: 흐름 안의 블록 하나', 'n1', ['코드의 줄 주석(<code>// …</code>)과 같은 자리입니다. 코드에서 가져올 때 주석 줄을 그대로 옮깁니다.', '저장되는 그림 · PNG에 보이는 대로 들어갑니다(교재 · 문서에 붙일 때).', '다른 블록처럼 고르고 옮기고 지웁니다. 새로 익힐 조작이 없습니다.'], true),
      card('N1 · 2번', '블록마다 주석 칸(Structorizer 방식)', 'n2', ['블록의 오른쪽 끝에 흐린 글자로 보입니다. "주석 보기"를 끄면 그림에서 사라집니다.', '흐름을 늘리지 않습니다.', bad('글자가 긴 블록에서 주석 자리가 없습니다. 모든 블록 종류(헤더 · 조건 칸 포함)에 칸이 생겨 모델 · 편집 · 레이아웃이 모두 바뀝니다.')]),
      card('N1 · 3번', '블록마다 주석, 표시만', 'n3', ['2번과 같고, 그림에는 작은 말풍선 표시만 보입니다. 마우스를 올리면 툴팁으로 읽습니다.', bad('저장되는 그림 · PNG · 인쇄에서는 글이 보이지 않습니다. 휴대폰에서는 툴팁이 없습니다.')]),
    ]),
    section('N2', 'N2. 주석 블록의 모양 (N1이 1번이면)', ['실행되는 블록과 한눈에 달라야 합니다(원칙 2). 글자는 세 판 모두 흐린 기울임입니다.'], [
      card('N2 · 1번', '점선 안쪽 테두리, 흰 바탕', 'n1', ['"실행하지 않음"이 테두리로 보입니다. 흑백 인쇄에서도 가려집니다.', '흐린 글자와 흰 바탕이 다른 블록(색 바탕)과 대비됩니다.'], true),
      card('N2 · 2번', '메모지: 오른쪽 위 접힌 모서리, 연노랑', 'n2p', ['UML 노트의 모양입니다. 익숙합니다.', bad('노랑이 Case · If의 <code>block.branch</code>와 가깝습니다. 다크 테마에서 색을 따로 골라야 합니다.')]),
      card('N2 · 3번', '처리 블록에 <code>//</code>', 'n3s', ['코드의 주석 모양 그대로입니다.', bad('바탕 · 테두리가 처리 블록과 같아서 원칙 2를 어깁니다. <code>//</code>는 언어마다 다릅니다(<code>#</code>, <code>--</code>).')]),
    ]),
    section('N3', 'N3. 넣는 키', ['<b>Claude가 정해 둔 것:</b> 주석 블록은 여러 줄을 적을 수 있고(<code>Shift</code>+<code>Enter</code>), 감쌀 수 없습니다(<code>s</code> 없음). M80 · M81의 추천(<code>e</code> <code>x</code> <code>t</code>)과 겹치지 않게 골랐습니다.'], [
      card('N3 · 1번', '<code>/</code> (코드의 주석)', 'n3k1', ['많은 언어의 주석 <code>//</code>에서 왔습니다. 에디터의 "주석 달기"(<code>Ctrl</code>+<code>/</code>)와도 이어집니다.'], true),
      card('N3 · 2번', '<code>n</code> (note)', 'n3k2', ['글자라서 키 힌트에서 찾기 쉽습니다.', bad('"주석"과 글자가 이어지지 않습니다.')]),
    ]),
  ],
  ['N1을 먼저, 1번이면 N2 · N3도. <b>번호</b> 또는 고칠 점.', 'N1이 2번 · 3번이면 요구사항 R-BLK-14의 글("주석 블록")을 고칩니다.'],
  {
    n1: noteDiag('dash'),
    n2p: noteDiag('paper'),
    n3s: noteDiag('slash'),
    n2: cmtDiag('side'),
    n3: cmtDiag('mark'),
    n3k1: keyFig(`, ['e', '무한 반복'], ['x', '탈출'], ['t', '병렬 처리'], ['/', '주석']`, ['주석']),
    n3k2: keyFig(`, ['e', '무한 반복'], ['x', '탈출'], ['t', '병렬 처리'], ['n', '주석']`, ['주석']),
  });

const out = { 'exit-block-study': m80, 'parallel-block-study': m81, 'comment-block-study': m82 };
for (const [name, html] of Object.entries(out)) writeFileSync(join(dir, `2026-11-28-${name}.html`), html.replace(/\r\n/g, '\n'));
console.log('written', Object.keys(out).join(', '));
