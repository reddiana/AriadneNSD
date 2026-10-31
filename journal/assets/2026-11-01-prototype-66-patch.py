# 프로토타입 66번째 판: 정한 웹 화면(06-web 7장, UX 결정 W1 ~ W6)을 넣는다
#   W1  메뉴 바(파일 · 편집 · 다이어그램 · 보기 · 도움말) + 툴바 한 줄(블록 아이콘 여섯)
#   W2  블록 아이콘: 누르면 뒤에 넣기, Shift+클릭은 앞에, Ctrl+클릭은 감싸기 (드래그는 다음 판)
#   W3  파일 이름과 저장 안 됨 ●를 메뉴 바 오른쪽과 브라우저 탭 제목에
#   W4  도움말 메뉴: 사용법(안내 패널), 단축키 한눈에(? 키, 모달)
#   W5  문서 설정 · 환경 설정 모달 둘 (캔버스 위 설정 줄은 없앰)
#   W6  커맨드 팔레트 Ctrl+Shift+P · F1
#   그리고 Tab으로 캔버스에 들어와도 블록을 선택하지 않음(포커스 테두리만, 조작 규칙대로)
# 쓰는 법: python journal/assets/2026-11-01-prototype-66-patch.py
import pathlib, re
p = pathlib.Path(__file__).parent / "2026-10-10-ns-prototype.html"
s = p.read_text(encoding="utf-8")
def rep(old, new, n=1):
    global s
    assert s.count(old) == n, (s.count(old), old[:120])
    s = s.replace(old, new)

# ---------- 블록 아이콘 (블록의 모양과 색을 줄인 그림, 시안 M44와 같음) ----------
L = '#5b77ad'; PC = '#edf0f5'; IF = '#f6ebdc'; LP = '#dce6f6'
def bi(kind, w=22, h=16):
    o = f'stroke="{L}" stroke-width="1"'
    if kind == 'process': g = f'<rect x=".5" y=".5" width="{w-1}" height="{h-1}" fill="{PC}" {o}/>'
    elif kind == 'if': g = f'<rect x=".5" y=".5" width="{w-1}" height="{h-1}" fill="{PC}" {o}/><rect x=".5" y=".5" width="{w-1}" height="7" fill="{IF}" {o}/><path d="M.5 .5 L{w/2} 7.5 L{w-.5} .5 M{w/2} 7.5 V{h-.5}" fill="none" {o}/>'
    elif kind == 'case': g = f'<rect x=".5" y=".5" width="{w-1}" height="{h-1}" fill="{PC}" {o}/><rect x=".5" y=".5" width="{w-1}" height="7" fill="{IF}" {o}/><path d="M.5 .5 L{w*0.72} 7.5 L{w-.5} .5 M{w*0.24} 7.5 V{h-.5} M{w*0.48} 7.5 V{h-.5} M{w*0.72} 7.5 V{h-.5}" fill="none" {o}/>'
    elif kind in ('while', 'for'):
        g = f'<rect x=".5" y=".5" width="{w-1}" height="{h-1}" fill="{LP}" {o}/><rect x="5.5" y="5.5" width="{w-6}" height="{h-6}" fill="{PC}" {o}/>'
        if kind == 'for': g += f'<path d="M2 2.5 h3 M2 4 h3" stroke="{L}" stroke-width=".8"/>'
    else: g = f'<rect x=".5" y=".5" width="{w-1}" height="{h-1}" fill="{LP}" {o}/><rect x="5.5" y=".5" width="{w-6}" height="{h-6}" fill="{PC}" {o}/>'
    return f'<svg width="{w}" height="{h}" viewBox="0 0 {w} {h}" aria-hidden="true">{g}</svg>'
I = {
 'new': '<path d="M6 3h8l4 4v14H6z M14 3v4h4"/>', 'open': '<path d="M3 7h6l2 2h10v10H3z"/>',
 'save': '<path d="M5 4h11l3 3v13H5z M8 4v5h7V4 M8 20v-6h8v6"/>', 'export': '<path d="M12 3v12 M7 8l5-5 5 5 M5 15v5h14v-5"/>',
 'undo': '<path d="M9 7L4 12l5 5 M4 12h11a5 5 0 0 1 0 10h-2"/>', 'redo': '<path d="M15 7l5 5-5 5 M20 12H9a5 5 0 0 0 0 10h2"/>',
 'cut': '<circle cx="7" cy="17" r="3"/><circle cx="17" cy="17" r="3"/><path d="M9 15L18 4 M15 15L6 4"/>',
 'copy': '<path d="M8 8h11v12H8z M5 16V4h11"/>', 'paste': '<path d="M7 5h10v16H7z M9 3h6v4H9z"/>',
 'wrap': '<path d="M4 6h16v12H4z M8 9h8v6H8z"/>', 'zin': '<circle cx="10" cy="10" r="6"/><path d="M15 15l5 5 M8 10h4 M10 8v4"/>',
 'zout': '<circle cx="10" cy="10" r="6"/><path d="M15 15l5 5 M8 10h4"/>', 'menu': '<path d="M4 7h16 M4 12h16 M4 17h16"/>',
}
def ic(k): return f'<svg class="ic" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{I[k]}</svg>'
def mi(cmd, label, key=''):
    return f'<button data-cmd="{cmd}">{label}<span>{key}</span></button>'
def menu(mid, title, body):
    return f'<div class="mm" data-menu="{mid}"><button class="mt" data-open="{mid}">{title}</button><div class="dd" hidden>{body}</div></div>'
HR = '<hr>'
BLOCKS = [('process', '처리', 'o'), ('if', 'If', 'a i'), ('case', 'Case', 'a k'), ('while', 'While', 'a w'), ('for', 'For', 'a f'), ('dowhile', 'Do-While', 'a d')]

menus = ''.join([
 menu('file', '파일', mi('new', '새로') + mi('open', '열기…') + HR
   + '<div class="sub">예제 ▸<div class="dd2">' + mi('exCode', '코드식') + mi('exText', '문장식') + mi('exCase', 'Case') + mi('exQuick', '퀵소트') + mi('exRaft', 'Raft') + '<select id="exMore" title="README 그림 후보(시안 M41)의 예제"><option value="">더 보기…</option></select></div></div>' + HR
   + mi('download', '저장 (받기)', 'Ctrl+S') + mi('svg', 'SVG 보기') + HR + mi('prefs', '환경 설정…', 'Ctrl+,')),
 menu('edit', '편집', mi('undo', '실행 취소', 'u · Ctrl+Z') + mi('redo', '다시 하기', 'U · Ctrl+Y') + HR
   + mi('cut', '잘라내기', 'dd · Ctrl+X') + mi('copy', '복사', 'yy · Ctrl+C') + mi('paste', '붙여넣기', 'p · Ctrl+V') + mi('del', '지우기', 'x · Del') + HR
   + mi('edit', '글자 고치기', 'i · Enter') + HR
   + mi('moveUp', '위로 옮기기', 'Alt+↑') + mi('moveDown', '아래로 옮기기', 'Alt+↓') + mi('moveLeft', '갈래를 왼쪽으로', 'Alt+←') + mi('moveRight', '갈래를 오른쪽으로', 'Alt+→') + HR
   + mi('palette', '커맨드 팔레트…', 'Ctrl+Shift+P')),
 menu('diagram', '다이어그램', ''.join(mi('ins:' + k, t + ' 넣기', key) for k, t, key in BLOCKS) + mi('callAsk', '호출 블록 넣기', 'a c') + HR
   + ''.join(mi('wrap:' + k, t + '로 감싸기', 's ' + key[-1]) for k, t, key in BLOCKS[1:]) + mi('unwrap', '풀기', 'ds') + HR
   + mi('kind:event', 'Event', 'e') + mi('kind:method', 'Method (새 Method로 빼기)', 'm') + HR + mi('docset', '문서 설정…')),
 menu('view', '보기', mi('fold', '접기 · 펴기', 'za · f') + mi('makeRegion', '접기 영역 만들기', 'zf') + mi('releaseRegion', '접기 영역 풀기', 'zd') + HR
   + '<label class="chk"><input type="checkbox" id="optRanges" checked> 접기 영역 보기</label>' + HR
   + mi('zoomIn', '확대', 'Ctrl+휠') + mi('zoomOut', '축소', 'Ctrl+휠')),
 menu('help', '도움말', mi('toggleHelp', '사용법 (이 프로토타입)') + mi('keysModal', '단축키 한눈에', '?') + mi('whatsNew', '이 판에서 바뀐 것') + HR + mi('about', 'AriadneNSD에 대하여')),
])
tools = (''.join(f'<button class="tb" data-cmd="{c}" title="{t}">{ic(k)}</button>' for c, k, t in [('new', 'new', '새로'), ('open', 'open', '열기'), ('download', 'save', '저장 (받기) Ctrl+S'), ('svg', 'export', 'SVG 보기')])
  + '<i class="sep"></i>' + ''.join(f'<button class="tb" data-cmd="{c}" title="{t}">{ic(k)}</button>' for c, k, t in [('undo', 'undo', '실행 취소 u'), ('redo', 'redo', '다시 하기 U')])
  + '<i class="sep wide-only"></i>' + ''.join(f'<button class="tb wide-only" data-cmd="{c}" title="{t}">{ic(k)}</button>' for c, k, t in [('cut', 'cut', '잘라내기 dd'), ('copy', 'copy', '복사 yy'), ('paste', 'paste', '붙여넣기 p')])
  + '<i class="sep"></i>' + ''.join(f'<button class="tb bi" data-cmd="ins:{k}" title="{t}: 선택한 것 뒤에 넣기 ({key}) · Shift+클릭: 앞에 · Ctrl+클릭: 감싸기">{bi(k)}</button>' for k, t, key in BLOCKS)
  + '<i class="sep"></i>' + f'<button class="tb" data-open="wrapdd" title="감싸기 · 풀기">{ic("wrap")}▾</button><div class="dd" id="wrapdd" hidden>' + ''.join(mi('wrap:' + k, t + '로 감싸기', 's ' + key[-1]) for k, t, key in BLOCKS[1:]) + mi('unwrap', '풀기', 'ds') + '</div>'
  + '<i class="sep wide-only"></i><span class="zoom wide-only"><button class="tb" data-cmd="zoomOut" title="축소">' + ic('zout') + '</button><output id="zoomOut">100%</output><button class="tb" data-cmd="zoomIn" title="확대">' + ic('zin') + '</button></span>')

# ---------- 머리 줄 ----------
i = s.index('  <header class="bar">'); j = s.index('  </header>') + len('  </header>')
s = s[:i] + f'''  <header class="bar">
    <div class="mbar">
      <button class="narrow tb" data-cmd="toggleMenu" aria-expanded="false" title="메뉴">{ic('menu')}</button>
      <div class="brand"><b>AriadneNSD</b><span>프로토타입 · <b id="edition">66번째 판</b></span></div>
      <nav class="menus">{menus}</nav>
      <span class="fname" id="fname" title="파일 이름 · ● 저장 안 됨">이름 없음.ns.svg</span>
    </div>
    <div class="tbar">{tools}</div>
  </header>''' + s[j:]

# 설정 줄을 없애고 모달 둘로
i = s.index('      <div class="opts">'); j = s.index('      </div>', s.index('<div class="zoom">', i))
j = s.index('\n', s.index('      </div>', j + 1))  # .opts의 닫는 줄
s = s[:i] + s[j + 1:]
rep('<div class="modal" id="modal" hidden>', '''<div class="modal" id="docsetModal" hidden><div class="box small" role="dialog" aria-modal="true">
  <h3>문서 설정 <small>이 파일에 저장 · 파일과 함께 다른 사람에게 감</small></h3>
  <label title="실행 취소의 대상입니다">머리 모양 <select id="optHead"><option value="shape">모자 · 아치</option><option value="title">제목처럼</option></select></label>
  <label title="보기 상태라 실행 취소의 대상이 아닙니다">결과 기호 <select id="optSym"><option value="←">←</option><option value="=">=</option></select></label>
  <div class="row"><button data-cmd="closeModals">닫기</button></div>
</div></div>
<div class="modal" id="prefsModal" hidden><div class="box small" role="dialog" aria-modal="true">
  <h3>환경 설정 <small>나에게만 · 이 브라우저에 남음</small></h3>
  <label><input type="checkbox" id="optSyntax" checked> 구문 강조</label>
  <label><input type="checkbox" id="optMono" checked> 고정폭 글꼴</label>
  <label title="두 번 누르는 키의 첫 키 뒤 0.4초가 지나면 이어 누를 키를 보입니다"><input type="checkbox" id="optKeyHint" checked> 키 힌트</label>
  <div class="row"><button data-cmd="closeModals">닫기</button></div>
</div></div>
<div class="modal" id="keysModal" hidden><div class="box" role="dialog" aria-modal="true">
  <h3>단축키 한눈에 <small>Esc로 닫기 · 전체 설명은 도움말 › 사용법</small></h3>
  <div id="keysBody" class="keysbody"></div>
  <div class="row"><button data-cmd="closeModals">닫기</button></div>
</div></div>
<div class="palette" id="palette" hidden><input id="palIn" placeholder="명령 이름을 치세요 (예: 감싸)" autocomplete="off"><div id="palList"></div></div>
<div class="modal" id="modal" hidden>''')

# ---------- CSS ----------
rep('.main { display: grid; grid-template-columns: minmax(0, 1fr) 340px; min-height: 0; }',
    '.main { display: grid; grid-template-columns: minmax(0, 1fr); min-height: 0; }\n.app.help-open .main { grid-template-columns: minmax(0, 1fr) 340px; }\n.app:not(.help-open) .side { display: none; }')
rep('.narrow { display: none; }\n@media (max-width: 860px) {', '''/* 66번째 판: 정한 웹 화면 (06-web 7장) — 메뉴 바, 툴바, 메뉴, 모달, 커맨드 팔레트 */
.bar { display: block; padding: 0; }
.mbar { display: flex; align-items: center; gap: 4px 14px; padding: 4px 12px; border-bottom: 1px solid var(--line); }
.mbar .brand { flex-direction: row; align-items: baseline; gap: 8px; }
.menus { display: flex; gap: 2px; }
.mm { position: relative; }
.mt { border: 0; background: none; padding: 3px 9px; }
.mt[aria-expanded="true"], .mt:hover { background: var(--accent-soft); }
.dd { position: absolute; z-index: 25; top: 100%; left: 0; min-width: 230px; background: var(--panel); border: 1px solid var(--line); border-radius: 6px; box-shadow: 0 8px 24px rgba(0,0,0,.18); padding: 4px; }
.dd button { display: flex; width: 100%; justify-content: space-between; gap: 16px; border: 0; border-radius: 4px; text-align: left; padding: 4px 10px; }
.dd button span { color: var(--muted); font-family: var(--mono); font-size: 11.5px; }
.dd hr { border: 0; border-top: 1px solid var(--line); margin: 4px 0; }
.dd .chk { display: flex; gap: 6px; align-items: center; padding: 4px 10px; font-size: 13px; }
.dd .sub { position: relative; padding: 4px 10px; font-size: 13px; cursor: default; }
.dd .sub .dd2 { display: none; position: absolute; left: 100%; top: -4px; min-width: 190px; background: var(--panel); border: 1px solid var(--line); border-radius: 6px; box-shadow: 0 8px 24px rgba(0,0,0,.18); padding: 4px; }
.dd .sub:hover .dd2, .dd .sub:focus-within .dd2 { display: block; }
.dd .sub select { margin: 4px 10px; }
.fname { margin-left: auto; font-size: 12.5px; color: var(--muted); white-space: nowrap; }
.fname .dot { color: var(--warn); }
.tbar { display: flex; flex-wrap: wrap; align-items: center; gap: 3px; padding: 4px 12px; position: relative; }
.tb { border: 1px solid transparent; background: none; padding: 3px 5px; display: inline-flex; align-items: center; gap: 2px; color: var(--fg); }
.tb:hover { border-color: var(--line); background: var(--accent-soft); }
.tb.bi svg { display: block; }
.sep { width: 1px; height: 20px; background: var(--line); margin: 0 4px; }
.tbar > .dd { top: 100%; left: auto; }
.zoom output { min-width: 3.2em; }
.modal .box.small { width: min(420px, 100%); grid-template-rows: auto; gap: 12px; }
.modal .box label { display: flex; gap: 8px; align-items: center; font-size: 14px; }
.modal h3 small { font-weight: 400; color: var(--muted); font-size: 12px; margin-left: 8px; }
.keysbody { overflow: auto; max-height: 60vh; }
.keysbody .keys { grid-template-columns: 9em minmax(0, 1fr); }
.palette { position: fixed; z-index: 35; top: 64px; left: 50%; transform: translateX(-50%); width: min(560px, calc(100% - 32px)); background: var(--panel); border: 1px solid var(--line); border-radius: 8px; box-shadow: 0 12px 32px rgba(0,0,0,.25); padding: 8px; }
.palette input { width: 100%; font: inherit; padding: 6px 8px; border: 1px solid var(--accent); border-radius: 5px; background: var(--bg); color: var(--fg); }
#palList { max-height: 50vh; overflow: auto; margin-top: 6px; }
#palList div { display: flex; justify-content: space-between; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 13.5px; }
#palList div.on { background: var(--accent-soft); }
#palList div span { color: var(--muted); font-family: var(--mono); font-size: 11.5px; }
.narrow { display: none; }
@media (max-width: 860px) {''')
rep('''  .app:not(.menu-open) .bar .grp, .app:not(.menu-open) .opts { display: none; }
  .bar .grp { flex-basis: 100%; }''', '''  .app:not(.menu-open) .menus { display: none; }
  .app.menu-open .menus { flex-direction: column; position: absolute; z-index: 26; top: 40px; left: 8px; background: var(--panel); border: 1px solid var(--line); border-radius: 6px; padding: 4px; }
  .wide-only, .fname { display: none; }''')
rep('''  .app:not(.help-open) .side { display: none; }
  .app.help-open .main { grid-template-rows: minmax(0, 1fr) minmax(0, 45%); }''', '''  .app.help-open .main { grid-template-columns: minmax(0, 1fr); grid-template-rows: minmax(0, 1fr) minmax(0, 45%); }''')
rep('  .brand { flex: 1 1 0; min-width: 0; }', '  .mbar .brand { flex: 1 1 0; min-width: 0; }')

# ---------- 스크립트 ----------
rep('''function togglePane(cls, cmd) {
  const on = $('.app').classList.toggle(cls);
  $(`button[data-cmd="${cmd}"]`).setAttribute('aria-expanded', on);
}''', '''function togglePane(cls, cmd) {
  const on = $('.app').classList.toggle(cls);
  document.querySelectorAll(`button[data-cmd="${cmd}"]`).forEach(b => b.setAttribute('aria-expanded', on));
}
/* ---------- 66번째 판: 메뉴 · 모달 · 커맨드 팔레트 · 파일 이름 ---------- */
function closeMenus() { document.querySelectorAll('.dd').forEach(d => { d.hidden = true; }); document.querySelectorAll('[data-open]').forEach(b => b.setAttribute('aria-expanded', 'false')); }
function openModal(id) { closeMenus(); closeModals(); $('#' + id).hidden = false; }
function closeModals() { ['docsetModal', 'prefsModal', 'keysModal'].forEach(id => { $('#' + id).hidden = true; }); $('#palette').hidden = true; }
const anyModal = () => ['docsetModal', 'prefsModal', 'keysModal'].some(id => !$('#' + id).hidden) || !$('#palette').hidden;
function keysModal() { if (!$('#keysBody').firstChild) $('#keysBody').appendChild($('.side .keys').cloneNode(true)); openModal('keysModal'); }
// 커맨드 팔레트: 메뉴의 항목(명령 이름과 키)을 그대로 목록으로 쓴다 (명령 목록 하나 → ADR-0033)
let palAt = 0, palItems = [];
const PALETTE_SKIP = new Set(['palette', 'toggleMenu', 'closeModals']);
function paletteItems() {
  const seen = new Set(), out = [];
  document.querySelectorAll('.menus .dd button[data-cmd]').forEach(b => {
    const cmd = b.dataset.cmd; if (seen.has(cmd) || PALETTE_SKIP.has(cmd)) return; seen.add(cmd);
    out.push({ cmd, label: b.childNodes[0].textContent.trim(), key: b.querySelector('span')?.textContent || '' });
  });
  return out;
}
function drawPalette() {
  const q = $('#palIn').value.trim().toLowerCase();
  palItems = paletteItems().filter(x => !q || x.label.toLowerCase().includes(q));
  palAt = Math.min(palAt, Math.max(palItems.length - 1, 0));
  $('#palList').innerHTML = palItems.map((x, i) => `<div data-i="${i}" class="${i === palAt ? 'on' : ''}">${esc(x.label)}<span>${esc(x.key)}</span></div>`).join('') || '<div>맞는 명령이 없습니다</div>';
}
function palette() { closeMenus(); closeModals(); $('#palette').hidden = false; $('#palIn').value = ''; palAt = 0; drawPalette(); $('#palIn').focus(); }
function palRun(i) { const x = palItems[i]; $('#palette').hidden = true; if (x) { run(x.cmd); } stage.focus({ preventScroll: true }); }
$('#palIn').addEventListener('input', () => { palAt = 0; drawPalette(); });
$('#palIn').addEventListener('keydown', ev => {
  ev.stopPropagation();
  if (ev.key === 'ArrowDown' || ev.key === 'ArrowUp') { palAt = (palAt + (ev.key === 'ArrowDown' ? 1 : -1) + palItems.length) % Math.max(palItems.length, 1); drawPalette(); ev.preventDefault(); }
  else if (ev.key === 'Enter') { ev.preventDefault(); palRun(palAt); }
  else if (ev.key === 'Escape') { ev.preventDefault(); $('#palette').hidden = true; stage.focus({ preventScroll: true }); }
});
$('#palList').addEventListener('mousedown', ev => { const d = ev.target.closest('[data-i]'); if (d) { ev.preventDefault(); palRun(+d.dataset.i); } });
// 파일 이름과 저장 안 됨 ● (W3): 마지막으로 받거나(저장) 연 뒤 내용 · 보기 상태가 바뀌었으면 ●
let docName = '이름 없음.ns.svg', savedSnap = null;
function markSaved(name) { if (name) docName = name; savedSnap = JSON.stringify(doc); showName(); }
function showName() {
  const dirty = savedSnap !== null && savedSnap !== JSON.stringify(doc);
  $('#fname').innerHTML = esc(docName) + (dirty ? ' <span class="dot">●</span>' : '');
  document.title = (dirty ? '● ' : '') + docName + ' – AriadneNSD';
}''')
rep("  toggleMenu: () => togglePane('menu-open', 'toggleMenu'), toggleHelp: () => togglePane('help-open', 'toggleHelp'),",
    "  toggleMenu: () => togglePane('menu-open', 'toggleMenu'), toggleHelp: () => togglePane('help-open', 'toggleHelp'),\n  palette, keysModal, docset: () => openModal('docsetModal'), prefs: () => openModal('prefsModal'), closeModals: () => { closeModals(); stage.focus({ preventScroll: true }); },\n  whatsNew: () => { if (!$('.app').classList.contains('help-open')) togglePane('help-open', 'toggleHelp'); $('#whatsnew')?.scrollIntoView({ block: 'start' }); },\n  about: () => say('AriadneNSD — Nassi-Shneiderman 차트 편집기. 이것은 요구사항 점검용 프로토타입(버리는 코드)입니다'),")
# 메뉴 열기 · 닫기와 블록 아이콘의 Ctrl+클릭
rep('''document.addEventListener('click', ev => {
  const b = ev.target.closest('button[data-cmd]');''', '''document.addEventListener('click', ev => {
  const op = ev.target.closest('[data-open]');
  if (op) {
    const id = op.dataset.open, dd = id === 'wrapdd' ? $('#wrapdd') : op.parentNode.querySelector('.dd'), was = !dd.hidden;
    closeMenus(); if (!was) { dd.hidden = false; op.setAttribute('aria-expanded', 'true'); }
    return;
  }
  if (!ev.target.closest('.dd')) closeMenus();
  const b0 = ev.target.closest('button[data-cmd]');
  if (b0 && (ev.ctrlKey || ev.metaKey) && b0.dataset.cmd.startsWith('ins:') && b0.dataset.cmd !== 'ins:process') {
    // 블록 아이콘의 Ctrl+클릭은 감싸기 (W2). 처리는 감쌀 수 없어 넣기와 같다
    closeMenus(); run('wrap:' + b0.dataset.cmd.slice(4)); stage.focus({ preventScroll: true }); return;
  }
  const b = b0;
  if (b) closeMenus();''')
# 단축키: 커맨드 팔레트 · ? · Ctrl+, · Ctrl+S, 모달이 열려 있으면 Esc만
rep('''  if (!$('#modal').hidden) { if (ev.key === 'Escape') run('closeModal'); return; }''', '''  if (!$('#modal').hidden) { if (ev.key === 'Escape') run('closeModal'); return; }
  if (anyModal()) { if (ev.key === 'Escape') { closeModals(); stage.focus({ preventScroll: true }); ev.preventDefault(); } return; }
  if (((ev.ctrlKey || ev.metaKey) && ev.shiftKey && ev.code === 'KeyP') || ev.code === 'F1') { ev.preventDefault(); return palette(); }
  if ((ev.ctrlKey || ev.metaKey) && ev.code === 'Comma') { ev.preventDefault(); return openModal('prefsModal'); }
  if ((ev.ctrlKey || ev.metaKey) && ev.code === 'KeyS') { ev.preventDefault(); return run('download'); }
  if (!ev.ctrlKey && !ev.metaKey && !ev.altKey && ev.key === '?' && !pend) { ev.preventDefault(); return keysModal(); }''')
# 렌더할 때 파일 이름 · ●
rep("  $('#zoomOut').textContent = Math.round(zoom * 100) + '%';", "  $('#zoomOut').textContent = Math.round(zoom * 100) + '%';\n  if (typeof showName === 'function' && savedSnap !== null) showName();")
# 열기 · 받기 · 예제 · 새로에서 저장 기준점
rep("  normalize(); render(); save(); saveFold(); say('파일을 열었습니다. 저장할 때의 접힘 그대로 열립니다');", "  normalize(); markSaved(lastOpenName || docName); render(); save(); saveFold(); say('파일을 열었습니다. 저장할 때의 접힘 그대로 열립니다');")
rep("  f.text().then(importSVG);", "  lastOpenName = f.name; f.text().then(importSVG);")
rep("let docName = '이름 없음.ns.svg', savedSnap = null;", "let docName = '이름 없음.ns.svg', savedSnap = null, lastOpenName = null;")
rep("    try { await dl.save({ filename: 'diagram.ns.svg', data: exportSVG() }); say('받았습니다'); }", "    try { await dl.save({ filename: docName, data: exportSVG() }); markSaved(); say('받았습니다'); }")
rep("    a.download = 'diagram.ns.svg';", "    a.download = docName; markSaved();")
rep("  applyHeadPref(); selectOne(null); render(); save(); saveFold();", "  applyHeadPref(); selectOne(null); markSaved('예제.ns.svg'); render(); save(); saveFold();", 3)
rep("new: () => { pushUndo(); doc = { diagrams: [newDia()] }; applyHeadPref();", "new: () => { pushUndo(); doc = { diagrams: [newDia()] }; applyHeadPref(); markSaved('이름 없음.ns.svg');")
# 시작할 때 (되살린 문서는 그 상태를 기준으로)
rep("if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => render());", "if (savedSnap === null) markSaved();\nif (document.fonts && document.fonts.ready) document.fonts.ready.then(() => render());")
# 안내 패널의 "이번에 바뀐 것"에 자리표
rep("      <h2>이번에 바뀐 것 (11-01, 65번째 판)</h2>", '''      <h2 id="whatsnew">이번에 바뀐 것 (11-01, 66번째 판)</h2>
      <ul>
        <li><b>정한 웹 화면으로 바꿨습니다</b>(06-web 7장, 시안 M44). 위에 메뉴 바(파일 · 편집 · 다이어그램 · 보기 · 도움말)와 툴바 한 줄. 이 안내 패널은 도움말 › 사용법으로 엽니다.</li>
        <li><b>툴바의 블록 아이콘:</b> 누르면 선택한 것 뒤에 넣고, <kbd>Shift</kbd>+클릭은 앞에, <kbd>Ctrl</kbd>+클릭은 감쌉니다. 드래그해 넣기는 다음 판입니다.</li>
        <li><b>설정은 모달 둘:</b> 다이어그램 › 문서 설정…(머리 모양 · 결과 기호), 파일 › 환경 설정…(<kbd>Ctrl</kbd>+<kbd>,</kbd>: 구문 강조 · 고정폭 · 키 힌트). 접기 영역 보기는 보기 메뉴에.</li>
        <li><b>커맨드 팔레트</b> <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>P</kbd> · <kbd>F1</kbd>, <b>단축키 한눈에</b> <kbd>?</kbd>, <b>저장(받기)</b> <kbd>Ctrl</kbd>+<kbd>S</kbd>.</li>
        <li><b>파일 이름과 ●:</b> 메뉴 바 오른쪽과 브라우저 탭 제목. 받거나 연 뒤에 고치면 ●가 붙습니다.</li>
        <li><b><kbd>Tab</kbd>으로 캔버스에 들어오면</b> 포커스 테두리만 보이고, 이동 키를 누르면 첫 블록을 선택합니다(조작 규칙대로).</li>
      </ul>
      <h2>65번째 판 (11-01)</h2>''')
# Tab으로 들어와도 선택하지 않는다
rep("  if (sel || pressing || editing || !byTab) return;\n  selectOne(visibleOrder(activeDia())[0]); render();", "  // 66번째 판: Tab으로 들어와도 선택하지 않는다. 포커스 테두리만 보이고 이동 키를 누르면 첫 블록 (조작 규칙)\n  void byTab; render();")
p.write_text(s, encoding="utf-8")
print("ok")
