# 프로토타입 64번째 판: 메인테이너의 inbox(2026-10-31) 다섯
#   1. 머리 모양을 기억한다(사용자 설정, 새 문서와 예제에 씀)   → UX 결정 HS1
#   2. 머리 모양의 기본은 "제목처럼"                             → HS1
#   3. 처음 방문하면 Raft 예제 (프로토타입에만)
#   4. 열면 고른 블록이 없다(키보드 Tab으로 들어올 때만 첫 블록) → OP1
#   5. 좁은 화면(860px 이하)에서 도구 모음 · 설정 · 안내를 접어 둠 → MB1
# 쓰는 법: python journal/assets/2026-10-31-prototype-64-patch.py
import pathlib
p = pathlib.Path(__file__).parent / "2026-10-10-ns-prototype.html"
s = p.read_text(encoding="utf-8")
def rep(old, new, n=1):
    global s
    assert s.count(old) == n, (s.count(old), old)
    s = s.replace(old, new)

rep('<b id="edition">63번째 판</b>', '<b id="edition">64번째 판</b>')
# 휴대폰이 화면 폭을 980px로 치지 않게 (이게 없으면 좁은 화면 규칙이 휴대폰에서 듣지 않는다)
rep('<title>M01 AriadneNSD 프로토타입</title>', '<meta name="viewport" content="width=device-width, initial-scale=1">
<title>M01 AriadneNSD 프로토타입</title>')

# ---------- 5. 좁은 화면 ----------
rep('''@media (max-width: 860px) {
  .main { grid-template-columns: minmax(0, 1fr); grid-template-rows: minmax(360px, 1fr) auto; }
  .side { border-left: 0; border-top: 1px solid var(--line); }
}''', '''.narrow { display: none; }
@media (max-width: 860px) {
  /* 64번째 판: 화면은 다이어그램에게. 도구 모음 · 설정 · 안내는 "메뉴" · "안내"로 편다 (UX 결정 MB1) */
  .bar { padding-block: 6px; padding-inline: 12px; }
  .brand { flex: 1 1 0; min-width: 0; }
  .narrow { display: inline-block; }
  .narrow[aria-expanded="true"] { background: var(--accent-soft); border-color: var(--accent); }
  .app:not(.menu-open) .bar .grp, .app:not(.menu-open) .opts { display: none; }
  .bar .grp { flex-basis: 100%; }
  .main { grid-template-columns: minmax(0, 1fr); grid-template-rows: minmax(0, 1fr); }
  .app:not(.help-open) .side { display: none; }
  .app.help-open .main { grid-template-rows: minmax(0, 1fr) minmax(0, 45%); }
  .side { border-left: 0; border-top: 1px solid var(--line); }
  .stage { padding: 12px; }
  .status { padding-inline: 12px; }
}''')
rep('''<span>요구사항 점검용 프로토타입 · 버리는 코드 · <b id="edition">64번째 판</b></span></div>''',
    '''<span>요구사항 점검용 프로토타입 · 버리는 코드 · <b id="edition">64번째 판</b></span></div>
    <button class="narrow" data-cmd="toggleMenu" aria-expanded="false" title="도구 모음과 설정을 펴고 접습니다">메뉴</button>
    <button class="narrow" data-cmd="toggleHelp" aria-expanded="false" title="써 보는 법과 바뀐 것을 펴고 접습니다">안내</button>''')

# ---------- 1 · 2. 머리 모양을 기억하고 기본은 제목처럼 ----------
rep('''/* ---------- 저장 (이 브라우저에만) ---------- */''',
    '''/* ---------- 머리 모양의 기억 (64번째 판, UX 결정 HS1) ---------- */
// 사용자가 마지막으로 고른 머리 모양(사용자 설정, opts.headPref). 고른 적이 없으면 "제목처럼". 새 문서와 예제가 이 모양으로 시작한다
const headPref = () => opts.headPref === 'shape' ? 'shape' : 'title';
function applyHeadPref() {
  if (headPref() === 'title') doc.settings = { ...(doc.settings || {}), headStyle: 'title' };
  else if (doc.settings) { delete doc.settings.headStyle; if (!Object.keys(doc.settings).length) delete doc.settings; }
}

/* ---------- 저장 (이 브라우저에만) ---------- */''')
rep('''  selectOne(null); render(); save(); saveFold();''', '''  applyHeadPref(); selectOne(null); render(); save(); saveFold();''', 3)
rep('''new: () => { pushUndo(); doc = { diagrams: [newDia()] }; folded = new Set();''',
    '''new: () => { pushUndo(); doc = { diagrams: [newDia()] }; applyHeadPref(); folded = new Set();''')
rep('''$('#optHead').addEventListener('change', e => { const v = e.target.value; apply(''',
    '''$('#optHead').addEventListener('change', e => { const v = e.target.value; opts.headPref = v; apply(''')

# ---------- 5. 펴고 접는 명령 ----------
rep('''  download, exCode: () => loadExample('code'),''',
    '''  toggleMenu: () => togglePane('menu-open', 'toggleMenu'), toggleHelp: () => togglePane('help-open', 'toggleHelp'),
  download, exCode: () => loadExample('code'),''')
rep('''/* ---------- 상태 줄 ---------- */''',
    '''/* ---------- 좁은 화면에서 펴고 접기 (64번째 판, UX 결정 MB1) ---------- */
function togglePane(cls, cmd) {
  const on = $('.app').classList.toggle(cls);
  $(`button[data-cmd="${cmd}"]`).setAttribute('aria-expanded', on);
}

/* ---------- 상태 줄 ---------- */''')

# ---------- 4. 열면 고른 것이 없다: Tab으로 들어올 때만 첫 블록 ----------
rep('''// 키보드로 캔버스에 들어오면 첫 블록을 고른다 (캔버스 둘레의 포커스 선 대신). 마우스로 누른 때는 누른 곳을 따른다
let pressing = false;
stage.addEventListener('mousedown', () => { pressing = true; }, true);
document.addEventListener('mouseup', () => { pressing = false; });
stage.addEventListener('focus', () => {
  if (sel || pressing || editing) return;''',
'''// 키보드(Tab)로 캔버스에 들어오면 첫 블록을 고른다 (캔버스 둘레의 포커스 선 대신). 마우스로 누른 때는 누른 곳을 따른다
// 64번째 판: 화면이 열릴 때 · 예제나 파일을 열 때 · 단추를 누른 뒤처럼 스크립트가 포커스를 옮길 때는 고르지 않는다 (UX 결정 OP1)
let pressing = false, tabbing = false;
stage.addEventListener('mousedown', () => { pressing = true; }, true);
document.addEventListener('mouseup', () => { pressing = false; });
document.addEventListener('keydown', ev => { tabbing = ev.key === 'Tab'; }, true);
document.addEventListener('mousedown', () => { tabbing = false; }, true);
stage.addEventListener('focus', () => {
  const byTab = tabbing; tabbing = false;
  if (sel || pressing || editing || !byTab) return;''')

# ---------- 3. 처음 방문하면 Raft 예제 (프로토타입에만) ----------
rep('''else if (!restored) loadExample('code');''', '''else if (!restored) loadRaftExample();   // 64번째 판: 처음 방문하면 Raft 예제''')
rep('''else { render(); say('지난번 상태를 되살렸습니다. 처음 예제는 "코드식"을 누르세요'); }''',
    '''else { render(); say('지난번 상태를 되살렸습니다. 처음 예제는 "Raft"를 누르세요'); }''')

# ---------- 바뀐 것 ----------
rep('''      <h2>이번에 바뀐 것 (10-31, 63번째 판)</h2>
      <ul>
''', '''      <h2>이번에 바뀐 것 (10-31, 64번째 판)</h2>
      <ul>
        <li><b>머리 모양을 기억합니다.</b> 마지막으로 고른 머리 모양으로 새 문서와 예제가 열립니다. 고른 적이 없으면 "제목처럼"입니다. 파일을 열면 그 파일의 모양 그대로입니다.</li>
        <li><b>처음 방문하면 Raft 예제</b>가 열립니다.</li>
        <li><b>열면 고른 블록이 없습니다.</b> 화면이 열릴 때, 예제나 파일을 열 때 그림이 고른 테두리 없이 보입니다. 이동 키를 누르거나 블록을 누르면 고릅니다. <kbd>Tab</kbd>으로 캔버스에 들어오면 지금처럼 첫 블록을 고릅니다.</li>
        <li><b>좁은 화면(폭 860px 이하):</b> 도구 모음 · 설정 · 이 안내를 접어 두고 다이어그램에 화면을 줍니다. 위의 "메뉴" · "안내" 단추로 폅니다.</li>
      </ul>
      <h2>63번째 판 (10-31)</h2>
      <ul>
''')

p.write_text(s, encoding="utf-8")
print("ok")
