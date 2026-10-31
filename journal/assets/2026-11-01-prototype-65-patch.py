# 프로토타입 65번째 판: 2026-11-01에 정한 MVP 조작(시안 M43 → UX 결정 10장)을 넣는다
#   Q2  더블클릭은 어디서나 고치기(접힌 칸 · 이름 띠). 세모(▸ ▾)를 눌러 접고 편다. 저장되는 그림에는 세모를 넣지 않는다
#   Q4  머리의 이름을 비우면 고치기 전 이름으로 돌아가고 칸을 닫는다
#   Q6  옮기기 Alt+방향키 · Alt+h j k l: 블록 위아래(줄 끝에서 밖으로), 갈래 좌우, 머리면 다이어그램 순서
#   Q10 · Q5  갈래 이름 고르기(If도), 갈래 첫 블록에서 k, 갈래 이름에서 h l j k, o O x, + - 없앰
#   Q12 "갈래 빼기" → "갈래 지우기"
# 쓰는 법: python journal/assets/2026-11-01-prototype-65-patch.py
import pathlib
p = pathlib.Path(__file__).parent / "2026-10-10-ns-prototype.html"
s = p.read_text(encoding="utf-8")
def rep(old, new, n=1):
    global s
    assert s.count(old) == n, (s.count(old), old[:120])
    s = s.replace(old, new)

rep('<b id="edition">64번째 판</b>', '<b id="edition">65번째 판</b>')

# ---------- 갈래 이름 고르기: 상태 ----------
rep('''const selectOne = id => { sel = id ? { root: id, anchor: id, focus: id } : null; };''',
'''const selectOne = id => { lsel = null; sel = id ? { root: id, anchor: id, focus: id } : null; };
// 고른 갈래 이름 { id: If · Case의 id, i: 갈래 번호 }. 고른 블록(sel)과 함께 있지 않다 (65번째 판, Q10)
let lsel = null;
const laneSlot = (n, i) => n.type === 'if' ? ['yes', 'no'][i] : 'c' + i;
const laneCount = n => n.type === 'if' ? 2 : n.labels.length;
const laneName = (n, i) => n.type === 'if' ? ifLabel(n, i) : n.labels[i];
function selectLane(id, i) { sel = null; visual = false; lsel = { id, i }; }''')
rep('''function clearSel() { if (sel) lastSel = sel.focus; sel = null; visual = false; pend = ''; }''',
    '''function clearSel() { if (sel) lastSel = sel.focus; sel = null; lsel = null; visual = false; pend = ''; }''')
rep('''  if (!sel || isHead(sel.root) || isHead(id)) return selectOne(id);
  const A = ancestors(sel.root), C = ancestors(id);''',
'''  if (!sel || isHead(sel.root) || isHead(id)) return selectOne(id);
  lsel = null;
  const A = ancestors(sel.root), C = ancestors(id);''')
rep('''  if (e && laneHome(id) === id && e.parent && laneFolded(e.parent, e.slot))
    sel = { root: id, anchor: id, focus: e.list[e.list.length - 1].id };''',
'''  lsel = null;
  if (e && laneHome(id) === id && e.parent && laneFolded(e.parent, e.slot))
    sel = { root: id, anchor: id, focus: e.list[e.list.length - 1].id };''')

# 그리기: 고른 갈래 이름에 주황 테두리. 화면에만 (저장되는 그림에는 넣지 않는다)
rep('''  $('.stage').classList.toggle('nosel', !sel);''',
'''  if (lsel) {
    const n = idx.get(lsel.id)?.node;
    if (!n || !multi(n) || lsel.i >= laneCount(n)) lsel = null;
  }
  if (lsel) {
    const el = svg.querySelector(`[data-id="${lsel.id}"][data-label="${lsel.i}"]`);
    if (el) {
      const b = el.getBBox(), w = K.sb;
      el.parentNode.insertAdjacentHTML('beforeend', `<rect data-selbox="" x="${b.x + w / 2 - .5}" y="${b.y + w / 2 - .5}" width="${b.width - w + 1}" height="${b.height - w + 1}" fill="none" stroke="${COL.sel}" stroke-width="${w}" pointer-events="none"/>`);
    }
  }
  $('.stage').classList.toggle('nosel', !sel && !lsel);''')
rep('''function describeSel() {
  const base = describeSel0(), r = selRange();''',
'''function describeSel() {
  if (lsel) { const n = idx.get(lsel.id)?.node; if (n) return `${n.type === 'if' ? 'If' : 'Case'}의 갈래 이름 "${laneName(n, lsel.i)}" (${lsel.i + 1}/${laneCount(n)})`; }
  const base = describeSel0(), r = selRange();''')

# 이동: 갈래의 첫 블록에서 위로 가면 그 갈래의 이름
rep('''  else if (!side) {
    // 위·아래로는 옆 갈래로 넘어가지 않는다''',
'''  else if (!side && !fwd && !isHead(cur) && !isShown(cur) && (sel.anchor === sel.focus || inLane) && (() => { const c = container(cur); return c && multi(c.node) && enter(c.node, c.slot) === cur; })()) {
    // 갈래의 첫 블록에서 위로: 그 갈래의 이름을 고른다 (65번째 판, Q10-b). 한 번 더 위로 가면 If · Case
    const c = container(cur);
    selectLane(c.node.id, slots(c.node).indexOf(c.slot)); render(); return showSel();
  }
  else if (!side) {
    // 위·아래로는 옆 갈래로 넘어가지 않는다''')

# ---------- 갈래 이름에서의 키 · 갈래 넣기 · 지우기 · 옮기기 ----------
rep('''// MD3의 물음에 대한 답. 바꾸기는 따로 실행 취소 한 번이다''',
'''/* ---------- 갈래 이름을 고른 채 (65번째 판, Q10 · Q5 · Q6) ---------- */
function laneMove(key) {
  const n = idx.get(lsel.id).node, cnt = laneCount(n);
  if (key === 'ArrowUp') { pickId(n.id); return render(); }
  if (key === 'ArrowDown') { pickId(enter(n, laneSlot(n, lsel.i))); return render(); }
  const j = lsel.i + (key === 'ArrowRight' ? 1 : -1);
  if (j < 0 || j >= cnt) return say(j < 0 ? '맨 왼쪽 갈래입니다' : '맨 오른쪽 갈래입니다');
  lsel.i = j; render();
}
function laneInsert(n, i, before) {
  if (locked()) return;
  if (n.type === 'if') {
    // If에서 갈래 넣기: Case로 바꿀지 묻는다 (묻는 모양은 정하지 않았다. 지금은 고르는 목록)
    askOn = n.id; selectOne(n.id); render();
    choose([{ cmd: 'toCase', label: 'Case로 바꾸고 갈래 하나 넣기' }, { cmd: 'keep', label: 'If 그대로 두기' }]);
    return say('If에는 갈래를 넣을 수 없습니다. Case로 바꿀까요? (j k · Enter, 숫자 키, Esc: 그만두기)');
  }
  const cnt = n.labels.length, at = Math.min(before ? i : i + 1, cnt - 1);   // default는 늘 맨 끝
  apply(() => {
    for (let k = cnt - 1; k >= at; k--) n['c' + (k + 1)] = n['c' + k];
    n['c' + at] = [P()];
    n.labels.splice(at, 0, String(cnt));
    [...folded].forEach(k => { if (String(k).startsWith(n.id + ':')) folded.delete(k); });
  });
  selectLane(n.id, at); render();
  startEdit(n.id + '#' + at);
  say(!before && i === cnt - 1 ? 'default는 늘 맨 끝이라 그 앞에 넣었습니다. 갈래 이름을 적으세요' : '갈래를 넣었습니다. 갈래 이름을 적으세요');
}
function laneDelete(n, i) {
  if (locked()) return;
  if (n.type === 'if') return say('If의 갈래는 지울 수 없습니다. If를 없애려면 지우거나(x) 푸세요(ds)');
  const cnt = n.labels.length;
  if (i === cnt - 1) return say('default 갈래는 지울 수 없습니다');
  if (cnt <= 2) return say('갈래가 하나뿐이라 지울 수 없습니다. Case를 없애려면 지우거나(x) 푸세요(ds)');
  apply(() => {
    for (let k = i; k < cnt - 1; k++) n['c' + k] = n['c' + (k + 1)];
    delete n['c' + (cnt - 1)];
    n.labels.splice(i, 1);
    [...folded].forEach(k => { if (String(k).startsWith(n.id + ':')) folded.delete(k); });
  });
  if (n.labels.length === 2) {
    // 갈래가 하나만 남았다: If처럼 보이므로 If로 바꿀지 묻는다
    askOn = n.id; selectOne(n.id); render();
    choose([{ cmd: 'toIf', label: 'If로 바꾸기' }, { cmd: 'keep', label: 'Case 그대로 두기' }]);
    return say('갈래를 지웠습니다. 갈래가 하나만 남았습니다. If로 바꿀까요? (j k · Enter, 숫자 키, Esc: 그만두기)');
  }
  selectLane(n.id, Math.min(i, n.labels.length - 2)); render();
  say('갈래를 지웠습니다. 안의 블록도 함께 지워졌습니다 (u로 되돌리기)');
}
function laneSwap(n, i, dir) {
  // 갈래를 옆 갈래와 통째로 맞바꾼다. Case의 갈래 이름은 갈래를 따라가고, default는 늘 맨 끝이다
  if (locked()) return;
  const j = i + dir, cnt = laneCount(n);
  if (j < 0 || j >= cnt) return say(j < 0 ? '맨 왼쪽 갈래입니다' : '맨 오른쪽 갈래입니다');
  if (n.type === 'case' && (i === cnt - 1 || j === cnt - 1)) return say('default 갈래는 늘 맨 끝이라 옮길 수 없습니다');
  const a = laneSlot(n, i), b = laneSlot(n, j), ka = n.id + ':' + a, kb = n.id + ':' + b;
  apply(() => {
    [n[a], n[b]] = [n[b], n[a]];
    if (n.type === 'case') [n.labels[i], n.labels[j]] = [n.labels[j], n.labels[i]];
    const fa = folded.has(ka), fb = folded.has(kb);
    folded.delete(ka); folded.delete(kb);
    if (fa) folded.add(kb); if (fb) folded.add(ka);
  });
  saveFold();
  if (lsel) { lsel.i = j; render(); }
  if (n.type === 'if') say('참 · 거짓 갈래의 블록을 맞바꿨습니다. 조건은 그대로라 뜻이 바뀌었습니다. 조건을 고치세요', true);
  else say(`갈래 "${n.labels[j]}"을(를) ${dir < 0 ? '왼쪽' : '오른쪽'}으로 옮겼습니다`);
}
function laneKeyDown(ev) {
  // 갈래 이름을 고른 채 누른 키. 처리했으면 true
  const n = idx.get(lsel.id)?.node, c = ev.code;
  if (!n) { lsel = null; return false; }
  const k = vimName(ev), arrow = c.startsWith('Arrow') ? c : { h: 'ArrowLeft', j: 'ArrowDown', k: 'ArrowUp', l: 'ArrowRight' }[k];
  if (ev.altKey && arrow) { if (arrow === 'ArrowLeft' || arrow === 'ArrowRight') laneSwap(n, lsel.i, arrow === 'ArrowRight' ? 1 : -1); else say('갈래는 왼쪽 · 오른쪽으로만 옮깁니다'); return true; }
  if (ev.ctrlKey || ev.metaKey || ev.altKey) return false;
  if (arrow) { laneMove(arrow); showSel(); return true; }
  if (k === 'i' || c === 'Enter' || c === 'NumpadEnter' || c === 'F2') { if (!locked()) startEdit(n.id + '#' + lsel.i); return true; }
  if (k === 'o' || k === 'O') { laneInsert(n, lsel.i, k === 'O'); return true; }
  if (k === 'x' || c === 'Delete' || c === 'Backspace') { laneDelete(n, lsel.i); return true; }
  if (k === 'u' || k === 'U' || k === 'Esc' || /^(Shift|Control|Alt|Meta|OS)(Left|Right)$|^CapsLock$|^Lang\\d$/.test(c)) return false;
  say('갈래 이름에서는 i · Enter 이름 고치기, o · O 갈래 넣기, x 갈래 지우기, Alt+← → 갈래 옮기기, h l 옆 갈래, j 갈래 안으로, k If · Case로');
  return true;
}
/* ---------- 옮기기 (65번째 판, Q6) ---------- */
function moveCmd(key) {
  if (lsel) { const n = idx.get(lsel.id).node; if (key === 'ArrowLeft' || key === 'ArrowRight') laneSwap(n, lsel.i, key === 'ArrowRight' ? 1 : -1); else say('갈래는 왼쪽 · 오른쪽으로만 옮깁니다'); return; }
  const r = needSel();
  if (!r || locked()) return;
  const up = key === 'ArrowUp', side = key === 'ArrowLeft' || key === 'ArrowRight';
  if (r.event) {
    // 머리: 다이어그램의 순서. Event(와 머리 없는 것)는 Event끼리, Method는 Method끼리
    if (side) return say('다이어그램은 위 · 아래로 옮깁니다(같은 종류 안에서 앞 · 뒤)');
    const ds = doc.diagrams, k = ds.indexOf(r.dia), m = isMethod(r.dia);
    let j = k;
    do j += up ? -1 : 1; while (j >= 0 && j < ds.length && isMethod(ds[j]) !== m);
    if (j < 0 || j >= ds.length) return say(`${m ? 'Method' : 'Event'} 가운데 ${up ? '맨 앞' : '맨 뒤'}입니다`);
    apply(() => { [ds[k], ds[j]] = [ds[j], ds[k]]; });
    render(); showSel();
    return say(`다이어그램을 ${up ? '앞' : '뒤'}으로 옮겼습니다`);
  }
  if (side) {
    // 갈래 안의 블록을 골랐으면 그 갈래를 옮긴다
    for (let c = container(r.items[0].id); c; c = container(c.node.id))
      if (multi(c.node)) return laneSwap(c.node, slots(c.node).indexOf(c.slot), key === 'ArrowRight' ? 1 : -1);
    return say('If · Case 안에서만 갈래를 옮깁니다. 블록은 위 · 아래로 옮깁니다');
  }
  const { list, lo, hi } = r;
  if (up ? lo > 0 : hi < list.length - 1) {
    apply(() => {
      if (up) { const x = list.splice(lo - 1, 1)[0]; list.splice(hi, 0, x); }
      else { const x = list.splice(hi + 1, 1)[0]; list.splice(lo, 0, x); }
    });
  } else {
    // 줄의 끝: 담고 있던 것(제어 블록이나 접기 영역) 밖으로 나와 그 앞 · 뒤에 놓인다. 다이어그램의 끝이면 더 갈 곳이 없다
    if (!r.parent) return say(up ? '다이어그램의 맨 위입니다' : '다이어그램의 맨 아래입니다');
    const pe = idx.get(r.parent.id);
    apply(() => {
      const items = list.splice(lo, hi - lo + 1);
      const at = pe.list.indexOf(r.parent);
      pe.list.splice(up ? at : at + 1, 0, ...items);
    });
    say(isCtrl(r.parent) ? '제어 블록 밖으로 옮겼습니다' : '접기 영역 밖으로 옮겼습니다');
  }
  render(); showSel();
}
// MD3의 물음에 대한 답. 바꾸기는 따로 실행 취소 한 번이다''')

# 글자 고치기 명령이 고른 갈래 이름에도 듣는다
rep('''  edit: () => {
    const r = needSel();''',
'''  edit: () => {
    if (lsel) { if (!locked()) startEdit(lsel.id + '#' + lsel.i); return; }
    const r = needSel();''')
rep('''const COMMANDS = {
''', '''const COMMANDS = {
  laneAfter: () => lsel && laneInsert(idx.get(lsel.id).node, lsel.i, false), laneBefore: () => lsel && laneInsert(idx.get(lsel.id).node, lsel.i, true),
  laneDel: () => lsel && laneDelete(idx.get(lsel.id).node, lsel.i),
  moveUp: () => moveCmd('ArrowUp'), moveDown: () => moveCmd('ArrowDown'), moveLeft: () => moveCmd('ArrowLeft'), moveRight: () => moveCmd('ArrowRight'),
''')

# 키: 갈래 이름을 고른 채, Alt+방향키, + -는 안내만
rep('''  let handled = true;
  if (ctrl) {
    if (code === 'KeyZ' && !ev.shiftKey) undo();''',
'''  let handled = true;
  if (lsel && laneKeyDown(ev)) { pend = ''; ev.preventDefault(); showMode(); return; }
  const altDir = ev.altKey && !ctrl ? (code.startsWith('Arrow') ? code : { KeyH: 'ArrowLeft', KeyJ: 'ArrowDown', KeyK: 'ArrowUp', KeyL: 'ArrowRight' }[code]) : null;
  if (altDir) { pend = ''; visual = false; moveCmd(altDir); ev.preventDefault(); showMode(); return; }
  if (ctrl) {
    if (code === 'KeyZ' && !ev.shiftKey) undo();''')
rep('''  else if (k === '+') laneAdd();
  else if (k === '-') laneRemove();''',
'''  else if (k === '+' || k === '-') say('갈래는 갈래 이름을 고르고 o · O로 넣고 x로 지웁니다. 갈래의 첫 블록에서 k를 누르면 갈래 이름을 고릅니다');''')

# ---------- Q4 머리의 이름을 비우면 되돌린다 ----------
rep('''    if (d0 && (dup || !key)) {
      // 머리의 이름은 비우거나 겹칠 수 없다: 고치던 칸을 다시 연다
      render(); startEdit(e.id, { fresh: e.fresh, retry: true }); editor.value = v; growEditor();
      return say(dup ? '같은 이름의 머리가 이미 있습니다. 다른 이름을 적으세요 (Esc: 그만두기)' : '머리의 이름은 비울 수 없습니다 (Esc: 그만두기)', true);
    }''',
'''    if (d0 && !key) {
      // 머리의 이름은 비울 수 없다: 고치기 전의 이름으로 두고 칸을 닫는다 (65번째 판, Q4)
      normalize(); render(); save(); stage.focus({ preventScroll: true });
      return say('이름은 비울 수 없어 고치기 전 이름으로 두었습니다');
    }
    if (d0 && dup) {
      // 이름이 겹치면 받아들이지 않고 고치던 칸을 다시 연다
      render(); startEdit(e.id, { fresh: e.fresh, retry: true }); editor.value = v; growEditor();
      return say('같은 이름의 머리가 이미 있습니다. 다른 이름을 적으세요 (Esc: 그만두기)', true);
    }''')

# ---------- Q2 더블클릭은 고치기, 세모로 접고 펴기 ----------
rep('''  // 이름 띠를 더블클릭하면 그 접기 영역을 접는다
  if (d.band && dn && dn.type === 'range') { selectOne(dn.id); foldRange(dn, false); return say('접었습니다. 펴려면 접힌 칸을 더블클릭하거나 za'); }
  if (d.unfold || (dn && dn.type === 'range' && folded.has(dn.id))) {
    folded.delete(d.slot ? partKey(dn, d.slot) : d.id); saveFold(); selectOne(d.id); render();
    return say(d.unfold ? '폈습니다' : '폈습니다. 이름은 접은 칸을 고르고 i나 Enter로 고칩니다');
  }''',
'''  // 더블클릭은 어디서나 고치기다: 이름 띠와 접힌 칸에서는 이름을 고친다 (65번째 판, Q2). 접고 펴기는 세모나 za
  if (d.band && dn && dn.type === 'range') { selectOne(dn.id); render(); return startEdit(dn.id); }
  // 고칠 이름이 없는 접힌 줄("⋯ 블록 n개")은 더블클릭하면 편다
  if (d.unfold) {
    folded.delete(d.slot ? partKey(dn, d.slot) : d.id); saveFold(); selectOne(d.id); render();
    return say('폈습니다');
  }''')
# 세모를 누르면 접고 편다
rep('''  const t = ev.target.closest('[data-id]');
  if (!t) { clearSel(); render(); return; }
  // 더블클릭은 두 번째 누름에서 처리한다.''',
'''  const t = ev.target.closest('[data-id]');
  if (!t) { clearSel(); render(); return; }
  if (t.dataset.tri) {
    // 세모(▸ ▾)를 누르면 접고 편다 (65번째 판, Q2)
    const n = idx.get(t.dataset.id)?.node;
    ev.preventDefault();
    if (n && n.type === 'range') {
      selectOne(n.id);
      if (folded.has(n.id)) { folded.delete(n.id); saveFold(); render(); say('폈습니다'); }
      else { foldRange(n, false); if (!editing) say('접었습니다. 펴려면 ▸를 누르거나 za'); }
    } else if (n && n.type === 'call') { selectOne(n.id); toggleCall(n); }
    return stage.focus({ preventScroll: true });
  }
  // 갈래 이름을 누르면 그 갈래 이름을 고른다 (65번째 판, Q10)
  if (t.dataset.label != null && ev.detail < 2 && !isShown(t.dataset.id)) { selectLane(t.dataset.id, +t.dataset.label); render(); stage.focus({ preventScroll: true }); return ev.preventDefault(); }
  // 더블클릭은 두 번째 누름에서 처리한다.''')
# 세모의 누르는 자리. 저장되는 그림에는 세모를 넣지 않는다
rep('''      s.push(`<text x="${it.x + 10}" y="${it.y + it.band - 5}" font-family="${fam()}" font-size="12" fill="${ink}" xml:space="preserve" style="white-space:pre" pointer-events="none">▾ ${esc(p.pre)}''',
    '''      if (ui) s.push(`<rect x="${it.x + 1}" y="${it.y + 1}" width="20" height="${it.band - 1}" fill="#ffffff" fill-opacity="0" data-id="${it.id}" data-tri="1" style="cursor:pointer"/>`);
      s.push(`<text x="${it.x + 10}" y="${it.y + it.band - 5}" font-family="${fam()}" font-size="12" fill="${ink}" xml:space="preserve" style="white-space:pre" pointer-events="none">${ui ? '▾ ' : ''}${esc(p.pre)}''')
rep('''      s.push(`<path d="M ${x + 8} ${y + K.padY + 4} l 6 4.5 l -6 4.5 z" fill="${COL.muted}" pointer-events="none"/>`);''',
    '''      if (ui) s.push(`<path d="M ${x + 8} ${y + K.padY + 4} l 6 4.5 l -6 4.5 z" fill="${COL.muted}" pointer-events="none"/>`, `<rect x="${x + 1}" y="${y + 1}" width="${K.padX + 10}" height="${h - 2}" fill="#ffffff" fill-opacity="0" data-id="${it.id}" data-tri="1" style="cursor:pointer"/>`);''')
rep('''        s.push(`<text x="${g.x + 10}" y="${g.y + g.band - 5}" font-family="${FAM_SANS}" font-size="12" font-weight="600"${g.named ? '' : ' font-style="italic"'} fill="${c}" pointer-events="none">▾ ${esc(g.text)}</text>`);
        continue;''',
    '''        s.push(`<text x="${g.x + 10}" y="${g.y + g.band - 5}" font-family="${FAM_SANS}" font-size="12" font-weight="600"${g.named ? '' : ' font-style="italic"'} fill="${c}" pointer-events="none">${ui ? '▾ ' : ''}${esc(g.text)}</text>`);
        if (ui) s.push(`<rect x="${g.x}" y="${g.y}" width="20" height="${g.band}" fill="#ffffff" fill-opacity="0" data-id="${g.id}" data-tri="1" style="cursor:pointer"/>`);
        continue;''')

# ---------- 오른쪽 클릭 메뉴 (Q12 "갈래 지우기", 옮기기) ----------
rep('''       ...(caseAt() ? [it('laneAdd', 'Case: 갈래 넣기', '+'), it('laneRemove', 'Case: 이 갈래 빼기', '-'), it('laneLabel', 'Case: 갈래 이름 고치기', 'L'), null]
         : branchAt() ? [it('laneLabel', 'If: 갈래 이름 고치기', 'L'), it('laneAdd', 'If: Case로 바꾸기…', '+'), null] : []),''',
'''       ...(caseAt() ? [it('laneLabel', 'Case: 이 갈래의 이름 고치기', '⇧L'), null]
         : branchAt() ? [it('laneLabel', 'If: 이 갈래의 이름 고치기', '⇧L'), null] : []),
       it('moveUp', '위로 옮기기', 'Alt+↑'), it('moveDown', '아래로 옮기기', 'Alt+↓'), ...(branchAt() ? [it('moveLeft', '갈래를 왼쪽으로', 'Alt+←'), it('moveRight', '갈래를 오른쪽으로', 'Alt+→')] : []), null,''')
rep('''function showMenu(x, y) {
  const it = (cmd, label, key) => ({ cmd, label, key: VIMKEY[cmd] ?? key });''',
'''function showMenu(x, y) {
  const it = (cmd, label, key) => ({ cmd, label, key: VIMKEY[cmd] ?? key });
  if (lsel) {
    // 갈래 이름을 골랐을 때: 갈래에 듣는 명령 (65번째 판, Q10 · Q12)
    const n = idx.get(lsel.id).node, cs = n.type === 'case';
    menuCmds = [];
    menuItems = [it('edit', '갈래 이름 고치기', 'i · Enter'), null,
      it('laneAfter', cs ? '뒤에 갈래 넣기' : 'Case로 바꾸고 갈래 넣기…', 'o'), ...(cs ? [it('laneBefore', '앞에 갈래 넣기', 'O'), it('laneDel', '이 갈래 지우기', 'x · Del')] : []), null,
      it('moveLeft', '갈래를 왼쪽으로', 'Alt+←'), it('moveRight', '갈래를 오른쪽으로', 'Alt+→')];
    menuAt = -1; drawMenu(); placeMenu(x, y);
    return;
  }''')
rep('''svg.addEventListener('contextmenu', ev => {
  const t = ev.target.closest('[data-id]');
  if (!t) return;
  ev.preventDefault();''',
'''svg.addEventListener('contextmenu', ev => {
  const t = ev.target.closest('[data-id]');
  if (!t) return;
  ev.preventDefault();
  if (t.dataset.label != null && !isShown(t.dataset.id)) { selectLane(t.dataset.id, +t.dataset.label); render(); return showMenu(ev.clientX, ev.clientY); }''')

# ---------- 도움말 ----------
import re
_m = re.search(r'        <dt><kbd>\+</kbd> / <kbd>-</kbd></dt><dd>.*?</dd>\n', s)
assert _m
s = s.replace(_m.group(0), '''        <dt>갈래 이름</dt><dd>갈래의 첫 블록에서 <kbd>k</kbd>(↑)를 누르거나 갈래 이름을 누르면 갈래 이름을 고릅니다(If의 참 · 거짓도). 고른 채 <kbd>i</kbd> · <kbd>Enter</kbd> 이름 고치기, <kbd>o</kbd> / <kbd>O</kbd> 뒤 / 앞에 갈래 넣기(If는 Case로 바꿀지 물음), <kbd>x</kbd> 갈래 지우기(default는 못 지움), <kbd>h</kbd> <kbd>l</kbd> 옆 갈래 이름, <kbd>j</kbd> 갈래 안으로, <kbd>k</kbd> If · Case로</dd>
        <dt><kbd>Alt</kbd>+방향키</dt><dd>옮기기. 블록은 <kbd>Alt</kbd>+<kbd>↑</kbd> <kbd>↓</kbd>(<kbd>Alt</kbd>+<kbd>k</kbd> <kbd>j</kbd>)로 위 · 아래 블록과 자리를 바꾸고, 줄의 끝에서는 제어 블록 · 접기 영역 밖으로 나옵니다. If · Case 안에서 <kbd>Alt</kbd>+<kbd>←</kbd> <kbd>→</kbd>는 갈래를 옆 갈래와 맞바꿉니다(If는 조건이 그대로라 고치라고 알림). 머리를 골랐으면 다이어그램의 순서를 바꿉니다</dd>
''')
rep('접힌 것은 더블클릭으로도 펴고, 이름 띠를 더블클릭하면 접힙니다.', '접힌 칸 · 이름 띠 앞의 세모(▸ ▾)를 눌러도 접고 폅니다. 더블클릭은 이름 고치기입니다(이름 없는 "⋯ 블록 n개" 줄은 더블클릭으로도 폄).')
rep("'접었습니다. 펴려면 za를 다시 누르거나 접힌 곳을 더블클릭'", "'접었습니다. 펴려면 za를 다시 누르거나 ▸를 누르세요'")
rep("""  if (d.label != null && dn && multi(dn)) { selectOne(dn.id); render(); return startEdit(dn.id + '#' + d.label); }""",
    """  if (d.label != null && dn && multi(dn)) { selectLane(dn.id, +d.label); render(); return startEdit(dn.id + '#' + d.label); }""")
rep("""    if (!sel) {}
    else if (escArmed)""", """    if (!sel && !lsel) {}
    else if (escArmed)""")

rep('''      <h2>이번에 바뀐 것 (10-31, 64번째 판)</h2>
      <ul>
''', '''      <h2>이번에 바뀐 것 (11-01, 65번째 판)</h2>
      <ul>
        <li><b>더블클릭은 어디서나 글자 고치기입니다.</b> 접힌 칸과 이름 띠를 더블클릭하면 이름을 고칩니다. 접고 펴려면 칸 앞의 세모(▸ ▾)를 한 번 누르거나 <kbd>za</kbd>를 씁니다. 이름이 없는 "⋯ 블록 n개" 줄은 더블클릭해도 펴집니다. 세모는 저장되는 그림에 들어가지 않습니다.</li>
        <li><b>머리의 이름을 비우면</b> 고치기 전의 이름으로 돌아갑니다(칸이 다시 열리지 않음).</li>
        <li><b>옮기기 <kbd>Alt</kbd>+방향키</b>(또는 <kbd>Alt</kbd>+<kbd>h</kbd> <kbd>j</kbd> <kbd>k</kbd> <kbd>l</kbd>): 블록은 위 · 아래, 갈래는 왼쪽 · 오른쪽, 머리는 다이어그램 순서.</li>
        <li><b>갈래 이름을 고릅니다.</b> 갈래의 첫 블록에서 <kbd>k</kbd>, 또는 갈래 이름을 누릅니다. 고른 채 <kbd>o</kbd> <kbd>O</kbd>로 갈래를 넣고 <kbd>x</kbd>로 지웁니다. <kbd>+</kbd> <kbd>-</kbd>는 없앴습니다.</li>
        <li><b>"갈래 빼기"를 "갈래 지우기"로</b> 부릅니다.</li>
      </ul>
      <h2>64번째 판 (10-31)</h2>
      <ul>
''')

p.write_text(s, encoding="utf-8")
print("ok")
