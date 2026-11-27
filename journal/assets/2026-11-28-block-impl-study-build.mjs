// M84 블록 셋 구현 때 정할 것. 2026-11-28-block-studies-build.mjs(M80 · M81 · M82)를 복사해 고친 것:
// 틀(CSS · 꼬리말)은 M79에서, 렌더러는 그 스크립트에서 그대로 가져오고 선택 하이라이트 · 마우스 포인터 ·
// 병렬 처리의 분기 머리칸 · 탈출의 인라인 에디터만 더했다. 툴바는 앱의 toolbar.tsx · icons.tsx · styles.ts를 옮겨 그린 것.
// 실행: node journal/assets/2026-11-28-block-impl-study-build.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = dirname(fileURLToPath(import.meta.url));
const m79 = readFileSync(join(dir, '2026-11-28-endless-loop-study.html'), 'utf8');
// M84에만 쓰는 스타일: 툴바(앱의 .ans-toolbar · .ans-tool · .ans-dropdown과 같은 치수), 정해 둔 것의 표.
const extraStyle = `
.cards.wide { grid-template-columns: 1fr; }
.tbwrap { display: grid; gap: 10px; justify-items: start; }
.tbwrap.open { padding-bottom: 104px; }
.tb { display: flex; align-items: center; gap: 2px; min-height: 36px; padding: 3px 8px; background: var(--panel); border: 1px solid var(--line); border-radius: 4px; color: var(--fg); width: max-content; }
.tb .t { position: relative; display: inline-flex; align-items: center; justify-content: center; gap: 3px; min-width: 28px; height: 28px; padding: 0 5px; border: 1px solid transparent; border-radius: 4px; font-size: 12px; flex: none; }
.tb .t.new { border: 1.5px dashed var(--accent); }
.tb .t.on { background: rgba(44, 85, 201, .14); }
.tb .sep { width: 1px; height: 20px; margin: 0 6px; background: var(--line); flex: none; }
.tb .zg { display: inline-flex; align-items: center; }
.tb .zg .t { min-width: 20px; padding: 0; }
.dd { position: absolute; top: 100%; left: 0; z-index: 2; min-width: 220px; margin: 2px 0 0; padding: 4px; background: var(--panel); border: 1px solid var(--line); border-radius: 6px; box-shadow: 0 6px 18px rgba(20, 30, 60, .18); list-style: none; color: var(--fg); }
.dd.static { position: static; margin: 0; width: max-content; }
.dd li { display: flex; align-items: center; gap: 10px; padding: 4px 8px; border-radius: 4px; font-size: 13px; white-space: nowrap; }
.dd li.dim { color: var(--muted); }
.dd hr { border: 0; border-top: 1px solid var(--line); margin: 4px 2px; }
.dd kbd { margin-left: auto; padding-left: 16px; color: var(--muted); }
.note { font-size: 12.5px; color: var(--muted); }
.figrow { display: flex; flex-wrap: wrap; gap: 14px; align-items: flex-start; }
.figrow figure { margin: 0; display: grid; gap: 4px; justify-items: start; }
.figrow figcaption { font-size: 12.5px; color: var(--muted); }
.tablewrap { overflow-x: auto; border: 1px solid var(--line); border-radius: 8px; background: var(--panel); }
.fixed { width: 100%; border-collapse: collapse; font-size: 14px; }
.fixed th, .fixed td { padding: 10px 12px; text-align: left; vertical-align: top; border-top: 1px solid var(--line); }
.fixed thead th { border-top: 0; font-size: 12.5px; color: var(--muted); font-weight: 600; }
.fixed td:first-child { white-space: nowrap; font-family: var(--mono); font-size: 12px; color: var(--accent); font-weight: 600; }
.fixed td.why { color: var(--muted); font-size: 13.5px; min-width: 18ch; }
.fixed td .fig { padding: 8px; display: inline-block; }
`;
const style = m79.slice(m79.indexOf('<style>'), m79.indexOf('</style>')) + extraStyle + '</style>';
// M79의 꼬리말에서 그 페이지의 참고 그림 줄만 빼고 닫는다.
const footer = m79.slice(m79.indexOf('<footer'), m79.indexOf('참고 그림:')).trimEnd() + '</footer>';
const head = title => `<title>${title}</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans+KR:wght@400;500;600&display=swap">
${style}`;

// 브라우저에서 도는 렌더러(M80 · M81 · M82의 것 그대로 + 표시한 곳). 블록: 문자열(처리) | {exit, style, edit} | {iff, yes, no}
// | {loop, text, body} | {par: [seq…], style, text, heads, selCol, selPart, ptr} | {note, style} | {proc, cmt, style, sel} | {call}
const renderer = String.raw`
const C = { line: '#5b77ad', text: '#151a22', muted: '#5a6476', proc: '#edf0f5', loop: '#dce6f6', branch: '#f6ebdc', call: '#ebe7f4', event: '#e2efdf', paper: '#fffbe8', white: '#ffffff', sel: '#d0500b' };
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const svg = (w, h, body) => '<svg width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '">' + body + '</svg>';
const rect = (x, y, w, h, fill, extra) => '<rect x="' + (x + .5) + '" y="' + (y + .5) + '" width="' + w + '" height="' + h + '" fill="' + fill + '" stroke="' + C.line + '" ' + (extra || '') + '/>';
const line = (pts, extra) => '<polyline points="' + pts.map(p => (p[0] + .5) + ',' + (p[1] + .5)).join(' ') + '" fill="none" stroke="' + C.line + '" ' + (extra || '') + '/>';
const text = (x, y, s, o) => { o = o || {}; return '<text x="' + x + '" y="' + y + '" fill="' + (o.fill || C.text) + '"' + (o.anchor ? ' text-anchor="' + o.anchor + '"' : '') + (o.size ? ' font-size="' + o.size + '"' : '') + (o.italic ? ' font-style="italic"' : '') + (o.mono === false ? '' : ' font-family="IBM Plex Mono, monospace"') + '>' + esc(s) + '</text>'; };
// M84: 선택 하이라이트(블록 안쪽 3px, edit.select 주황, 배경 없음 — 04-visual-design 5장)와 마우스 포인터.
const sel = (x, y, w, h) => '<rect x="' + (x + 2) + '" y="' + (y + 2) + '" width="' + (w - 3) + '" height="' + (h - 3) + '" fill="none" stroke="' + C.sel + '" stroke-width="3"/>';
const pointer = (x, y) => '<path d="M' + x + ',' + y + ' l0,15 l4,-3.5 l2.8,6 l2.4,-1.1 l-2.8,-5.8 l5,-.3 z" fill="#ffffff" stroke="#151a22" stroke-width="1" stroke-linejoin="round"/>';
const ROW = 32, HEAD = 32, STRIP = 22, BAND = 18;
const parBands = b => b.style === 'din' ? [b.text ? HEAD : BAND, BAND] : b.style === 'top' ? [b.text ? HEAD : BAND, 0] : [8, 8];
function H(b) {
  if (typeof b === 'string' || b.exit != null || b.proc != null || b.call != null) return ROW;
  if (b.note != null) return b.lines ? 14 + b.lines.length * 17 : ROW;
  if (b.iff) return HEAD + Math.max(S(b.yes), S(b.no));
  if (b.par) { const [t, u] = parBands(b); return t + (b.heads || 0) + Math.max(...b.par.map(S)) + u; }
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
    // M84: 새로 넣은 빈 탈출 블록에서 바로 텍스트를 적는 모습(인라인 에디터 = 주황 테두리 + 커서).
    if (b.edit) return s + line([[x + 14, y], [x, y + h / 2], [x + 14, y + h]]) + sel(x, y, w, h) + '<line x1="' + (x + 22.5) + '" y1="' + (y + 9) + '" x2="' + (x + 22.5) + '" y2="' + (y + 24) + '" stroke="' + C.text + '" stroke-width="1.4"/>';
    if (st === 'din') return s + line([[x + 14, y], [x, y + h / 2], [x + 14, y + h]]) + text(x + 22, y + 21, b.exit);
    if (st === 'arrow') return s + arrowMark(x + w - 8, y + 20) + text(x + 10, y + 21, b.exit);
    if (st === 'kind') return s + line([[x + 14, y], [x, y + h / 2], [x + 14, y + h]]) + '<rect x="' + (x + 20.5) + '" y="' + (y + 7.5) + '" width="' + (b.kw.length * 7.4 + 10) + '" height="18" rx="3" fill="' + C.white + '" stroke="' + C.muted + '"/>' + text(x + 25, y + 21, b.kw, { size: 11.5 }) + text(x + 34 + b.kw.length * 7.4, y + 21, b.exit);
    return s + text(x + 10, y + 21, b.exit);
  }
  if (b.proc != null) {
    let s = rect(x, y, w, h, C.proc) + text(x + 10, y + 21, b.proc);
    if (b.sel) s += sel(x, y, w, h);
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
    const [t, u] = parBands(b), n = b.par.length, cw = Math.floor(w / n), st = b.style, hd = b.heads || 0;
    const colW = i => i === n - 1 ? w - i * cw : cw;
    let s = rect(x, y, w, h, C.loop);
    if (st === 'din') {
      const d = Math.min(t, 18);
      s += line([[x + d, y], [x, y + t]]) + line([[x + w - d, y], [x + w, y + t]]) + line([[x, y + h - u], [x + d, y + h]]) + line([[x + w, y + h - u], [x + w - d, y + h]]);
    }
    if (st === 'top') { const d = Math.min(t, 18); s += line([[x + d, y], [x, y + t]]) + line([[x + w - d, y], [x + w, y + t]]); }
    if (st === 'bar') s += '<rect x="' + x + '" y="' + y + '" width="' + (w + 1) + '" height="8" fill="' + C.line + '"/><rect x="' + x + '" y="' + (y + h - 7) + '" width="' + (w + 1) + '" height="8" fill="' + C.line + '"/>';
    if (b.text) s += text(x + w / 2, y + 21, b.text, { anchor: 'middle' });
    // M84: 분기마다 위 띠 아래의 얇은 빈 머리칸(B1 2번).
    if (hd) b.par.forEach((q, i) => { s += rect(x + i * cw, y + t, colW(i), hd, C.white); });
    const bodyH = h - t - u - hd;
    b.par.forEach((q, i) => { s += seq(x + i * cw, y + t + hd, colW(i), q, bodyH); });
    // M84: 고른 분기의 하이라이트(칸 전체 또는 머리칸)와 누르는 자리.
    if (b.selCol != null) {
      const cx = x + b.selCol * cw, ww = colW(b.selCol);
      s += b.selPart === 'head' ? sel(cx, y + t, ww, hd) : sel(cx, y + t, ww, h - t - u);
      if (b.ptr === 'band') s += pointer(cx + ww / 2, y + t / 2);
      if (b.ptr === 'head') s += pointer(cx + ww / 2, y + t + hd / 2);
    }
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

const card = (tag, title, fig, items, pick) => `      <article class="card${pick ? ' pick' : ''}"><header><span class="tag">${tag}</span><h3>${title}</h3>${pick ? '<span class="badge">★ Claude의 추천</span>' : ''}</header>
        <div class="fig" data-fig="${fig}"></div>
        <ul>${items.map(i => `<li>${i}</li>`).join('')}</ul>
      </article>`;
const section = (part, h2, qs, cards, wide) => `  <section>
    <span class="part">${part}</span>
    <h2>${h2}</h2>
${qs.map(q => `    <p class="q">${q}</p>`).join('\n')}
    <div class="cards${wide ? ' wide' : ''}">
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
const keyFig = (extra, hot) => `keys('a  아래에 삽입', ${KIND}, ${extra}], ${JSON.stringify(hot)})`;

// ───────── 툴바 (src/packages/editor/src/ui/toolbar.tsx · icons.tsx · styles.ts를 옮김) ─────────
const blockFill = { process: '#edf0f5', branch: '#f6ebdc', loop: '#dce6f6' };
const L = '#5b77ad';
const frame = bg => `<rect x=".5" y=".5" width="21" height="15" fill="${bg}" stroke="${L}"/>`;
const blockShapes = {
  process: frame(blockFill.process),
  if: `${frame(blockFill.process)}<rect x=".5" y=".5" width="21" height="7" fill="${blockFill.branch}" stroke="${L}"/><path d="M.5 .5 L11 7.5 L21.5 .5 M11 7.5 V15.5" fill="none" stroke="${L}"/>`,
  case: `${frame(blockFill.process)}<rect x=".5" y=".5" width="21" height="7" fill="${blockFill.branch}" stroke="${L}"/><path d="M.5 .5 L15.8 7.5 L21.5 .5 M5.3 7.5 V15.5 M10.6 7.5 V15.5 M15.8 7.5 V15.5" fill="none" stroke="${L}"/>`,
  while: `${frame(blockFill.loop)}<rect x="5.5" y="5.5" width="16" height="10" fill="${blockFill.process}" stroke="${L}"/>`,
  doWhile: `${frame(blockFill.loop)}<rect x="5.5" y=".5" width="16" height="10" fill="${blockFill.process}" stroke="${L}"/>`,
  wrap: `${frame(blockFill.branch)}<rect x="5.5" y="4.5" width="11" height="7" fill="${blockFill.process}" stroke="${L}"/>`,
  // 새 블록 셋: 앱 아이콘과 같은 규칙(블록 모양을 22 × 16으로 줄임)으로 그린 시안.
  endless: `${frame(blockFill.loop)}<rect x="5.5" y="4.5" width="16" height="7" fill="${blockFill.process}" stroke="${L}"/>`,
  exit: `${frame(blockFill.process)}<path d="M6 .5 L.5 8 L6 15.5" fill="none" stroke="${L}"/>`,
  parallel: `${frame(blockFill.loop)}<rect x=".5" y="4.5" width="21" height="7" fill="${blockFill.process}" stroke="${L}"/><path d="M11 4.5 V11.5 M4 .5 L.5 4.5 M18 .5 L21.5 4.5 M.5 11.5 L4 15.5 M21.5 11.5 L18 15.5" fill="none" stroke="${L}"/>`,
};
const blockIcon = k => `<svg width="22" height="16" viewBox="0 0 22 16" aria-hidden="true">${blockShapes[k]}</svg>`;
const strokePaths = {
  save: 'M5 4h11l3 3v13H5z M8 4v5h7V4 M8 20v-6h8v6',
  undo: 'M9 8H5V4 M5 8a8 8 0 1 1 1.8 8.5',
  redo: 'M15 8h4V4 M19 8a8 8 0 1 0 -1.8 8.5',
  cut: 'M6 20a2.5 2.5 0 1 0 0-.1 M18 20a2.5 2.5 0 1 0 0-.1 M7.5 18L17 4 M16.5 18L7 4',
  copy: 'M9 9h11v11H9z M5 15H4V4h11v1',
  paste: 'M8 5H5v16h14V5h-3 M9 3h6v4H9z',
  zoomIn: 'M10.5 4a6.5 6.5 0 1 0 0 13a6.5 6.5 0 1 0 0-13 M15.5 15.5L20 20 M8 10.5h5 M10.5 8v5',
  zoomOut: 'M10.5 4a6.5 6.5 0 1 0 0 13a6.5 6.5 0 1 0 0-13 M15.5 15.5L20 20 M8 10.5h5',
  examples: 'M4 4h7v7H4z M13 4h7v7h-7z M4 13h7v7H4z M13 13h7v7h-7z',
  chevron: 'M7 10l5 5 5-5',
};
const strokeIcon = (k, size = 16) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${strokePaths[k]}"/></svg>`;
const tool = (inner, cls = '', title = '') => `<span class="t${cls ? ' ' + cls : ''}"${title ? ` title="${title}"` : ''}>${inner}</span>`;
const sep = '<span class="sep"></span>';
const newBlocks = [['endless', '무한 반복', 'a e'], ['exit', '탈출', 'a x'], ['parallel', '병렬 처리', 'a t']];
function toolbar(mode) {
  const blocks = [['process', '처리'], ['if', 'If'], ['case', 'Case'], ['while', 'While'], ['doWhile', 'Do-While']].map(([k, n]) => tool(blockIcon(k), '', n)).join('');
  let extra = '';
  if (mode === 'icons') extra = newBlocks.map(([k, n]) => tool(blockIcon(k), 'new', n)).join('');
  if (mode === 'more') {
    const items = newBlocks.map(([k, n, key]) => `<li>${blockIcon(k)}<span>${n}</span><kbd>${key}</kbd></li>`).join('');
    extra = tool(`${strokeIcon('chevron', 12)}<ul class="dd">${items}</ul>`, 'new on', '블록 더 보기');
  }
  const bar = `<div class="tb">${tool(strokeIcon('save'))}${sep}${tool(strokeIcon('undo'))}${tool(strokeIcon('redo'))}${sep}${tool(strokeIcon('cut'))}${tool(strokeIcon('copy'))}${tool(strokeIcon('paste'))}${sep}${blocks}${extra}${sep}${tool(`${blockIcon('wrap')}<span>감싸기</span>${strokeIcon('chevron', 10)}`)}<span class="zg">${tool(strokeIcon('zoomOut'))}${tool('100%')}${tool(strokeIcon('zoomIn'))}</span>${tool(`${strokeIcon('examples')}<span>예제</span>`)}</div>`;
  return `<div class="tbwrap${mode === 'more' ? ' open' : ''}">${bar}</div>`;
}

// ───────── M84 ─────────
// 장면은 M81의 겹침(Event 안의 병렬 처리)을 그대로 쓰고, 둘째 분기를 고른다. 위 띠는 비운 기본 모양(18px).
const parScene = extra => `diagram('페이지를 열면', ['쪽 ← 주소에서 읽기()', { par: [['사진 ← 받기(a)'], [${extra.selBlock ? "{ proc: '글 ← 받기(b)', sel: true }" : "'글 ← 받기(b)'"}, '글 ← 줄이기(글)'], ['광고 ← 고르기()']], style: 'din'${extra.par || ''} }, '그리기(사진, 글, 광고)'], 345, 'event')`;
const menuHtml = `<ul class="dd static"><li class="dim">아래에 삽입 ▸</li><li class="dim">위에 삽입 ▸</li><hr><li>왼쪽에 분기 삽입</li><li>오른쪽에 분기 삽입</li><li>분기 삭제</li><hr><li class="dim">복사<kbd>y</kbd></li><li class="dim">삭제<kbd>Delete</kbd></li></ul>`;
const m84 = page('M84 블록 셋 구현 때 정할 것', 'M84 · 블록 셋 구현 때 정할 것',
  `무한 반복(M79 · EL1), 탈출(M80 · XB1), 병렬 처리(M81 · PB1)의 모양과 키는 정했습니다. 구현하려면 두 가지가 더 필요합니다: <b>병렬 처리의 분기를 무엇으로 고르나(B1)</b>, <b>툴바에 어떻게 놓나(B2)</b>. 물음마다 <b>★ 표시가 Claude의 추천</b>입니다(B1은 1번, B2는 2번). 그 밖에 Claude가 정해 둔 것은 맨 아래 표에 있습니다. 바꿀 것만 알려 주세요.`,
  [
    section('B1', 'B1. 병렬 처리의 분기를 무엇으로 고르나', [
      'Case는 <b>분기 라벨</b>을 골라 분기를 다룹니다(분기 첫 블록에서 <kbd>↑</kbd>, 마우스로는 라벨을 누름). 병렬 처리에는 분기 라벨이 없어서 고를 것이 따로 있어야 합니다.',
      '어느 판이든 <b>분기를 고른 상태에서의 조작은 Case와 같습니다</b>: 처리 블록 삽입(<kbd>a</kbd> 아래에 · <kbd>A</kbd> 위에)은 오른쪽 · 왼쪽에 분기 삽입, 삭제는 분기를 안의 블록과 함께, 이동은 옆 분기와 자리 바꿈. 메뉴 · 커맨드 팔레트의 "왼쪽에 분기 삽입 · 오른쪽에 분기 삽입 · 분기 삭제"도 있습니다. 그림은 둘째 분기를 고른 모습이고, 주황 테두리가 선택 하이라이트, 흰 화살표가 마우스로 누르는 자리입니다.',
    ], [
      card('B1 · 1번', '분기 칸 전체를 고름', 'b1', [
        '키보드: 분기 첫 블록에서 <kbd>↑</kbd>(한 번 더 누르면 병렬 처리 블록). Case의 분기 라벨과 같은 자리의 키입니다.',
        '마우스: 위 띠 가운데 <b>그 분기 바로 위 구간</b>을 누릅니다.',
        '하이라이트는 분기 칸 전체의 테두리입니다. <b>모양은 M81에서 정한 그대로</b>입니다.',
        bad('위 띠가 분기마다 나뉘므로, 병렬 처리 블록 자체는 마우스로 아래 띠나 양 끝 빗금을 눌러 고릅니다. 위 띠에 텍스트가 있으면 텍스트를 누를 때 분기가 골라집니다(편집은 블록을 고른 뒤).'),
      ], true),
      card('B1 · 2번', '분기마다 얇은 빈 머리칸을 두고 그것을 고름', 'b2', [
        '위 띠 바로 아래, 분기마다 높이 8px의 빈 칸(Case의 라벨 자리)을 둡니다. 고르는 방법 · 키는 Case의 분기 라벨과 똑같습니다.',
        '위 띠 전체는 블록을 고르는 자리로 남습니다.',
        bad('모양이 M81에서 정한 것과 달라집니다(분기마다 8px). 비어 있어 뜻이 없는 칸이 저장되는 그림에도 들어갑니다. 8px 칸은 누르기 작습니다.'),
      ]),
      card('B1 · 3번', '분기를 고르는 것이 없음', 'b3', [
        '분기 안의 블록을 고르고 메뉴 · 컨텍스트 메뉴 · 커맨드 팔레트의 "왼쪽에 분기 삽입 · 오른쪽에 분기 삽입 · 분기 삭제"로만 다룹니다.',
        '새로 만들 선택 대상이 없어 구현이 가장 작습니다.',
        bad('분기 전용 키가 없고(<kbd>a</kbd> · <kbd>A</kbd>는 블록에 적용), 분기를 옮길 수 없습니다. Case와 다르게 움직입니다.'),
      ]),
    ]),
    section('B2', 'B2. 툴바에 새 블록 셋을 어떻게 놓나', [
      '지금 툴바(앱의 <code>toolbar.tsx</code>를 옮겨 그림): 저장 | 실행 취소 · 다시 실행 | 잘라내기 · 복사 · 붙여넣기 | <b>블록 다섯</b>(처리 · If · Case · While · Do-While) | 감싸기 ▾, 축소 · 100% · 확대, 예제. For는 While과 헷갈려서 툴바에서 뺐습니다(UX TB1). 파란 점선이 새로 생기는 버튼입니다.',
    ], [
      card('B2 · 1번', '다섯 버튼 뒤에 아이콘 셋', 't1', [
        '블록 모양을 줄인 아이콘(무한 반복 · 탈출 · 병렬 처리)입니다. 누르기 · Shift+클릭 · Ctrl+클릭 · 드래그가 다른 블록 버튼과 같습니다.',
        bad('툴바가 버튼 셋만큼 길어져 좁은 화면에서 한 줄 더 내려갑니다. 작은 아이콘(22 × 16)에서 무한 반복은 While과, 병렬 처리는 Case와 헷갈리기 쉽습니다(For를 뺀 까닭과 같음).'),
      ]),
      card('B2 · 2번', '"블록 더 보기" ▾ 드롭다운 하나', 't2', [
        '다섯 버튼 뒤에 ▾ 버튼 하나. 펼치면 셋이 아이콘 + 이름 + 키(<kbd>a e</kbd> · <kbd>a x</kbd> · <kbd>a t</kbd>)로 나옵니다. 그림은 펼친 모습입니다.',
        '이름이 함께 보여 아이콘이 헷갈리지 않고, 툴바는 버튼 하나만 늘어납니다. 키를 배우는 자리도 됩니다.',
        '항목을 누르면 아래에 삽입합니다. Shift · Ctrl+클릭과 드래그도 블록 버튼과 같게 할지는 구현 때 맞춥니다.',
      ], true),
      card('B2 · 3번', '툴바에는 없음', 't3', [
        '툴바는 지금 그대로입니다. 키(<kbd>a</kbd> 다음의 키 힌트) · 메뉴 "다이어그램 › 아래에 삽입" · 커맨드 팔레트로만 넣습니다(For와 같음).',
        bad('마우스만 쓰는 사람은 메뉴를 열어야 찾습니다. 새 블록이 있는지 툴바에서 보이지 않습니다.'),
      ]),
    ], true),
    `  <section>
    <span class="part">정해 둔 것</span>
    <h2>Claude가 정해 둔 것 (바꿀 것만 알려 주세요)</h2>
    <p class="q">결정(EL1 · XB1 · PB1)에 없던 구현의 세부입니다. 그대로면 답하지 않으셔도 됩니다.</p>
    <div class="tablewrap"><table class="fixed">
      <thead><tr><th>번호</th><th>정한 것</th><th>모습</th><th>까닭</th></tr></thead>
      <tbody>
        <tr><td>D1</td><td>모델의 <code>kind</code> 이름: <code>endless</code> · <code>exit</code> · <code>parallel</code></td><td><div class="fig" data-fig="d1"></div></td><td class="why">EL1에서 정한 <code>endless</code>와 같은 짜임으로 영어 한 낱말. <code>doWhile</code>처럼 카멜 표기가 필요 없음</td></tr>
        <tr><td>D2</td><td>병렬 처리의 아래 띠 높이 18px(텍스트 없는 위 띠와 같음). 위 띠에 텍스트를 적으면 위 띠만 조건 칸 높이(32px)</td><td><div class="fig" data-fig="d2"></div></td><td class="why">아래 띠에는 텍스트가 없으므로 늘 얇은 띠. 위 · 아래가 같은 두께라 비운 모양이 대칭</td></tr>
        <tr><td>D3</td><td>새 탈출 블록은 빈 텍스트로 열고 바로 편집</td><td><div class="fig" data-fig="d3"></div></td><td class="why">처리 블록을 넣을 때와 같음. <code>break</code> 같은 기본 텍스트를 넣지 않음(언어마다 다름)</td></tr>
        <tr><td>D4</td><td>병렬 처리를 새로 넣으면 빈 분기 둘</td><td><div class="fig" data-fig="d4"></div></td><td class="why">PB1의 "둘 이상"의 최소. 감싸기(<kbd>s</kbd> + <kbd>t</kbd>)면 고른 블록이 첫 분기, 둘째는 빈 분기</td></tr>
        <tr><td>D5</td><td>블록 셋 모두 접기 영역 · 복사 · 잘라내기 · 붙여넣기 · 이동 · 끌어 옮기기는 다른 블록과 같음</td><td class="note">그림 없음</td><td class="why">새 규칙이 없음. 탈출은 처리 블록처럼 안에 담는 것이 없어 감쌀 수 없음(XB1)</td></tr>
      </tbody>
    </table></div>
  </section>`,
  ],
  ['B1, B2 하나씩 <b>번호</b> 또는 고칠 점.', '정해 둔 것(D1 ~ D5)은 바꿀 것만.'],
  {
    b1: parScene({ par: ", selCol: 1, ptr: 'band'" }),
    b2: parScene({ par: ", heads: 8, selCol: 1, selPart: 'head', ptr: 'head'" }),
    b3: `${parScene({ selBlock: true })} + '<div style="margin-top:10px" class="note">글 ← 받기(b)를 고르고 우클릭한 컨텍스트 메뉴(일부)</div>' + ${JSON.stringify(menuHtml)}`,
    t1: JSON.stringify(toolbar('icons')),
    t2: JSON.stringify(toolbar('more')),
    t3: `${JSON.stringify(toolbar('none'))} + '<div style="height:10px"></div>' + ${keyFig(`, ['e', '무한 반복'], ['x', '탈출'], ['t', '병렬 처리']`, ['무한 반복', '탈출', '병렬 처리'])}`,
    d1: `'<div class="figrow"><figure>' + one({ loop: 'e1', body: ['처리(x)'] }, 130) + '<figcaption><code>endless</code></figcaption></figure><figure>' + one({ exit: 'break' }, 130) + '<figcaption><code>exit</code></figcaption></figure><figure>' + one({ par: [['a'], ['b']], style: 'din' }, 130) + '<figcaption><code>parallel</code></figcaption></figure></div>'`,
    d2: `'<div class="figrow"><figure>' + one({ par: [['a'], ['b']], style: 'din' }, 150) + '<figcaption>위 18 · 아래 18</figcaption></figure><figure>' + one({ par: [['a'], ['b']], style: 'din', text: '동시에 받기' }, 150) + '<figcaption>위 32 · 아래 18</figcaption></figure></div>'`,
    d3: `one({ exit: '', edit: true }, 180)`,
    d4: `one({ par: [[''], ['']], style: 'din' }, 180)`,
  });

writeFileSync(join(dir, '2026-11-28-block-impl-study.html'), m84.replace(/\r\n/g, '\n'));
console.log('written block-impl-study');
