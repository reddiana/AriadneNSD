# 프로토타입 62번째 판: 2026-10-18 · 10-25에 정하고 넣지 못한 것을 넣는다 (2026-10-31, 메인테이너: "지금까지 결정된 것들을 프로토타입에 반영해주세요")
# 쓰는 법: python 2026-10-31-prototype-62-patch.py <단계>   (이 폴더에서. 단계마다 한 번만 돌린다)
# 바꿀 곳마다 원래 글자가 정확히 한 번 있는지 확인하고 바꾼다. 하나라도 어긋나면 아무것도 쓰지 않는다
import sys
from pathlib import Path

path = Path(__file__).parent / '2026-10-10-ns-prototype.html'
src = path.read_text(encoding='utf-8')


def sub(old, new, count=1):
    global src
    n = src.count(old)
    if n != count:
        raise SystemExit(f'expected {count} match(es), found {n}:\n{old[:200]}')
    src = src.replace(old, new)


stage = sys.argv[1]

if stage == '1':
    # --- For 블록 (FB1 · FB2): While과 같은 모양, a f · A f · s f ---
    sub("const SLOTS = { if: ['yes', 'no'], while: ['body'], dowhile: ['body'], range: ['children'] };",
        "const SLOTS = { if: ['yes', 'no'], while: ['body'], for: ['body'], dowhile: ['body'], range: ['children'] };")
    sub("const isCtrl = n => n.type === 'if' || n.type === 'case' || n.type === 'while' || n.type === 'dowhile';",
        "const isCtrl = n => n.type === 'if' || n.type === 'case' || n.type === 'while' || n.type === 'for' || n.type === 'dowhile';")
    sub("const KINDS = { i: 'if', w: 'while', d: 'dowhile', k: 'case' };",
        "const KINDS = { i: 'if', w: 'while', f: 'for', d: 'dowhile', k: 'case' };   // f: For (62번째 판, FB2). f만 누르면 그대로 접기 · 펴기")
    sub("  a: 'a 뒤에 넣기: i If · w While · d Do-While · k Case · c 호출',\n  A: 'A 앞에 넣기: i If · w While · d Do-While · k Case · c 호출',\n  s: 's 감싸기: w While · d Do-While · i If · k Case',",
        "  a: 'a 뒤에 넣기: i If · w While · f For · d Do-While · k Case · c 호출',\n  A: 'A 앞에 넣기: i If · w While · f For · d Do-While · k Case · c 호출',\n  s: 's 감싸기: w While · f For · d Do-While · i If · k Case',")
    sub("'ins:while': 'a w', 'ins:dowhile': 'a d',", "'ins:while': 'a w', 'ins:for': 'a f', 'ins:dowhile': 'a d',")
    sub("'wrap:while': 's w', 'wrap:dowhile': 's d',", "'wrap:while': 's w', 'wrap:for': 's f', 'wrap:dowhile': 's d',")
    sub("const names = { process: '처리', if: 'If', case: 'Case', while: 'While', dowhile: 'Do-While', call: '호출' };",
        "const names = { process: '처리', if: 'If', case: 'Case', while: 'While', for: 'For', dowhile: 'Do-While', call: '호출' };")
    sub("""      <button data-cmd="ins:while" title="a w (앞에: A w)">While</button>\n""",
        """      <button data-cmd="ins:while" title="a w (앞에: A w)">While</button>\n      <button data-cmd="ins:for" title="a f (앞에: A f)">For</button>\n""")
    sub("""      <button data-cmd="wrap:while" title="s w">While</button>\n""",
        """      <button data-cmd="wrap:while" title="s w">While</button>\n      <button data-cmd="wrap:for" title="s f">For</button>\n""")
    sub("it('ins:while', '뒤에 While 넣기', 'W'), ", "it('ins:while', '뒤에 While 넣기', 'W'), it('ins:for', '뒤에 For 넣기', 'F'), ")
    sub("it('wrap:while', 'While로 감싸기', 'S W'), ", "it('wrap:while', 'While로 감싸기', 'S W'), it('wrap:for', 'For로 감싸기', 'S F'), ")
    sub("""<kbd>a</kbd> / <kbd>A</kbd> 다음 <kbd>i</kbd> <kbd>w</kbd> <kbd>d</kbd> <kbd>k</kbd> <kbd>c</kbd></dt><dd>If · While · Do-While · Case · 호출 블록을""",
        """<kbd>a</kbd> / <kbd>A</kbd> 다음 <kbd>i</kbd> <kbd>w</kbd> <kbd>f</kbd> <kbd>d</kbd> <kbd>k</kbd> <kbd>c</kbd></dt><dd>If · While · For · Do-While · Case · 호출 블록을""")
    sub("""<kbd>s</kbd> 다음 <kbd>w</kbd> <kbd>d</kbd> <kbd>i</kbd> <kbd>k</kbd></dt><dd>고른 블록(들)을 While · Do-While · If · Case로 감싸기</dd>""",
        """<kbd>s</kbd> 다음 <kbd>w</kbd> <kbd>f</kbd> <kbd>d</kbd> <kbd>i</kbd> <kbd>k</kbd></dt><dd>고른 블록(들)을 While · For · Do-While · If · Case로 감싸기</dd>""")

    # --- 빈 갈래의 ∅ (E1): If · Case의 갈래에 빈 블록 하나만 있으면 가운데에, text.muted, 도형으로 ---
    sub("""    out.items.push({ k: 'process', id: n.id, x, y, w, h, text: n.text });""",
        """    const e = idx.get(n.id);
    out.items.push({ k: 'process', id: n.id, x, y, w, h, text: n.text, empty: !n.text && !!e && !!e.parent && multi(e.parent) && e.list.length === 1 });""")
    sub("""      s.push(txt(it.text, it.x + K.padX, it.y + K.padY));
    } else if (it.k === 'event') {""",
        """      s.push(txt(it.text, it.x + K.padX, it.y + K.padY));
      if (it.empty) {
        // 빈 갈래: 칸 가운데에 ∅ (원 지름 7px, 빗금이 원 밖으로 1px씩. 62번째 판, E1)
        const cx = it.x + it.w / 2, cy = it.y + it.h / 2, r = 3.5;
        s.push(`<g fill="none" stroke="${COL.muted}" stroke-width="1.1" stroke-linecap="round" pointer-events="none"><circle cx="${cx}" cy="${cy}" r="${r}"/><path d="M ${cx - r - 1} ${cy + r + 1} L ${cx + r + 1} ${cy - r - 1}"/></g>`);
      }
    } else if (it.k === 'event') {""")

    # --- Case 갈래 이름: 칸의 왼쪽, default만 오른쪽 (Q25) ---
    sub("""        s.push(`<text x="${dflt ? bx + 6 : bx + lw - 5}" y="${y + h - 5}"${dflt ? '' : ' text-anchor="end"'} font-family""",
        """        s.push(`<text x="${dflt ? bx + lw - 5 : bx + 6}" y="${y + h - 5}"${dflt ? ' text-anchor="end"' : ''} font-family""")
    sub("// 갈래 사이의 세로선은 빗금에서 아래로 내려온다. 갈래 이름은 빗금 아래 오른쪽 구석(default는 왼쪽 구석)에 적는다",
        "// 갈래 사이의 세로선은 빗금에서 아래로 내려온다. 갈래 이름은 칸의 왼쪽, default만 오른쪽에 적는다 (62번째 판, Q25)")

    # --- If · Case 조건 글자 뒤 바탕 (BH1): 머리 바탕색 테두리를 글자 바깥으로 3px ---
    sub("""      s.push(txt(it.text, cx, y + K.padY - 2, 'middle'));
      s.push(`<text x="${x + 6}" y="${y + h - 5}" font-family="${FAM_SANS}" font-size="12" fill="${COL.label}" pointer-events="none">참</text>`);""",
        """      s.push(txt(it.text, cx, y + K.padY - 2, 'middle', HALO));
      s.push(`<text x="${x + 6}" y="${y + h - 5}" font-family="${FAM_SANS}" font-size="12" fill="${COL.label}" pointer-events="none">참</text>`);""")
    sub("""      const cx = Math.min(Math.max(xd, x + t.w / 2 + K.padX), x + w - t.w / 2 - K.padX);
      s.push(txt(it.text, cx, y + K.padY - 2, 'middle'));""",
        """      const cx = Math.min(Math.max(xd, x + t.w / 2 + K.padX), x + w - t.w / 2 - K.padX);
      s.push(txt(it.text, cx, y + K.padY - 2, 'middle', HALO));""")
    sub("""const rect = (x, y, w, h, fill, attr = '') =>""",
        """// 조건 글자 뒤 바탕: 빗금이 글자에 닿는 곳만 끊기게 머리 바탕색으로 테두리를 깐다 (size.text-halo 3px = 선 굵기 6의 바깥 절반. 62번째 판, BH1)
const HALO = ` stroke="${COL.if}" stroke-width="6" stroke-linejoin="round" paint-order="stroke"`;
const rect = (x, y, w, h, fill, attr = '') =>""")

    # --- 짧은 갈래 (SB1): 남는 높이를 블록마다 고르게, 나머지는 마지막 블록 ---
    sub("""function placeSeq(list, x, y, w, h, out, ins = 0) {
  let cy = y;
  list.forEach((c, i) => {
    const b = boxed(c), d = b ? ins : 0;
    if (b && i > 0 && boxed(list[i - 1])) cy += K.rgap + 1;
    const ch = i === list.length - 1 ? (y + h - cy - d) : M.get(c.id).h;""",
        """function placeSeq(list, x, y, w, h, out, ins = 0) {
  // 줄이 받은 높이가 더 크면 남는 높이를 블록 수로 똑같이 나눠 더하고, 나누어 떨어지지 않는 나머지는 마지막 블록이 받는다 (62번째 판, SB1)
  let need = 0;
  list.forEach((c, i) => { const b = boxed(c); if (b && i > 0 && boxed(list[i - 1])) need += K.rgap + 1; need += M.get(c.id).h; if (b && i === list.length - 1) need += ins; });
  const each = Math.floor(Math.max(0, h - need) / list.length);
  let cy = y;
  list.forEach((c, i) => {
    const b = boxed(c), d = b ? ins : 0;
    if (b && i > 0 && boxed(list[i - 1])) cy += K.rgap + 1;
    const ch = i === list.length - 1 ? (y + h - cy - d) : M.get(c.id).h + each;""")

elif stage == '2':
    # --- If 갈래 이름 고치기 (Q24): 처음 "참" · "거짓", 비우면 처음 이름. 고친 이름만 모델에 (labels) ---
    sub("""const isHL = n => n.type === 'range' && n.highlight;""",
        """const isHL = n => n.type === 'range' && n.highlight;
// If 갈래의 이름: 고친 것만 labels에 둔다. 비어 있으면 화면 언어의 처음 이름 (62번째 판, Q24)
const IFL = ['참', '거짓'];
const ifLabel = (n, i) => (n.labels && n.labels[i]) || IFL[i];""")
    sub("""  if (isLabel(id)) { const [a, i] = id.split('#'); return idx.get(a)?.node.labels[+i] ?? ''; }""",
        """  if (isLabel(id)) { const [a, i] = id.split('#'), p = idx.get(a)?.node; return !p ? '' : p.type === 'if' ? ifLabel(p, +i) : p.labels[+i] ?? ''; }""")
    sub("""    const [a, i] = e.id.split('#'), p = idx.get(a)?.node;
    if (p && !cancel && v.trim() && v !== e.orig) { pushUndo(); p.labels[+i] = v.trim(); }""",
        """    const [a, i] = e.id.split('#'), p = idx.get(a)?.node;
    if (p && p.type === 'if') {
      // 비우거나 처음 이름을 적으면 고치지 않은 이름으로 돌아간다
      const nv = v.trim(), next = !nv || nv === IFL[+i] ? '' : nv, cur = (p.labels && p.labels[+i]) || '';
      if (!cancel && next !== cur) {
        pushUndo();
        const ls = [...(p.labels || ['', ''])];
        ls[+i] = next;
        if (ls.every(x => !x)) delete p.labels; else p.labels = ls;
      }
    }
    else if (p && !cancel && v.trim() && v !== e.orig) { pushUndo(); p.labels[+i] = v.trim(); }""")
    sub("""      const y = laneFolded(n, 'yes') ? foldRowSize(n, 'yes') : measureSeq(n.yes);
      const no = laneFolded(n, 'no') ? foldRowSize(n, 'no') : measureSeq(n.no);
      r = { w: Math.max(headW, y.w + no.w), h: headH + Math.max(y.h, no.h), headH, yw: y.w, nw: no.w };""",
        """      const y = laneFolded(n, 'yes') ? foldRowSize(n, 'yes') : measureSeq(n.yes);
      const no = laneFolded(n, 'no') ? foldRowSize(n, 'no') : measureSeq(n.no);
      // 고친 갈래 이름이 길면 그 갈래를 넓힌다 (Case와 같은 셈)
      const yw = Math.max(y.w, tagW(ifLabel(n, 0)) + 18), nw = Math.max(no.w, tagW(ifLabel(n, 1)) + 18);
      r = { w: Math.max(headW, yw + nw), h: headH + Math.max(y.h, no.h), headH, yw, nw };""")
    sub("""    out.items.push({ k: 'ifHead', id: n.id, x, y, w, h: hh, sx: x + yW, text: n.text });""",
        """    out.items.push({ k: 'ifHead', id: n.id, x, y, w, h: hh, sx: x + yW, text: n.text, labels: [ifLabel(n, 0), ifLabel(n, 1)] });
    T.set(n.id + '#0', { x, y: y + hh - 20, w: yW, h: 20 });          // 갈래 이름을 고치는 자리
    T.set(n.id + '#1', { x: x + yW, y: y + hh - 20, w: w - yW, h: 20 });""")
    sub("""      s.push(`<text x="${x + 6}" y="${y + h - 5}" font-family="${FAM_SANS}" font-size="12" fill="${COL.label}" pointer-events="none">참</text>`);
      s.push(`<text x="${x + w - 6}" y="${y + h - 5}" text-anchor="end" font-family="${FAM_SANS}" font-size="12" fill="${COL.label}" pointer-events="none">거짓</text>`);""",
        """      if (ui) [[x, sx - x], [sx, x + w - sx]].forEach(([bx, lw], i) => s.push(`<rect x="${bx}" y="${y + h - 20}" width="${lw}" height="20" fill="#ffffff" fill-opacity="0" data-id="${it.id}" data-label="${i}" style="cursor:text"/>`));
      s.push(`<text x="${x + 6}" y="${y + h - 5}" font-family="${FAM_SANS}" font-size="12" fill="${COL.label}" pointer-events="none">${esc(it.labels[0])}</text>`);
      s.push(`<text x="${x + w - 6}" y="${y + h - 5}" text-anchor="end" font-family="${FAM_SANS}" font-size="12" fill="${COL.label}" pointer-events="none">${esc(it.labels[1])}</text>`);""")
    sub("""  // Case 머리의 갈래 이름을 더블클릭하면 그 이름을 고친다
  if (d.label != null && dn && dn.type === 'case') {""",
        """  // If · Case 머리의 갈래 이름을 더블클릭하면 그 이름을 고친다
  if (d.label != null && dn && multi(dn)) {""")
    sub("""function laneLabel() {
  if (locked()) return;
  const c = caseAt();
  if (!c || c.index < 0) return say('이름을 고칠 갈래 안의 블록을 고르세요. 갈래 이름을 더블클릭해도 됩니다');
  startEdit(c.node.id + '#' + c.index);
}""",
        """function branchAt() {
  // 고른 곳이 속한 가장 가까운 If나 Case와 그 갈래 번호(If는 참 0 · 거짓 1). 그것 자체를 골랐으면 번호는 -1
  const r = selRange();
  if (!r || r.event) return null;
  if (r.items.length === 1 && multi(r.items[0])) return { node: r.items[0], index: -1 };
  for (let c = container(r.items[0].id); c; c = container(c.node.id))
    if (multi(c.node)) return { node: c.node, index: c.node.type === 'if' ? (c.slot === 'yes' ? 0 : 1) : +c.slot.slice(1) };
  return null;
}
function laneLabel() {
  if (locked()) return;
  const c = branchAt();
  if (!c || c.index < 0) return say('이름을 고칠 갈래 안의 블록을 고르세요. 갈래 이름을 더블클릭해도 됩니다');
  startEdit(c.node.id + '#' + c.index);
  if (c.node.type === 'if') say(`If 갈래의 이름을 적으세요. 비우면 "${IFL[c.index]}"(으)로 돌아갑니다 (${endHint()})`);
}""")

    # --- MD3: Case 갈래가 하나만 남으면 If로 바꿀지, If에서 +를 누르면 Case로 바꿀지 묻는다 ---
    sub("""function laneAdd() {
  if (locked()) return;
  const c = caseAt();""",
        """function laneAdd() {
  if (locked()) return;
  const b = branchAt();
  if (b && b.node.type === 'if') {
    // If에서 갈래 넣기: Case로 바꿀지 묻는다 (묻는 모양은 정하지 않았다. 지금은 고르는 목록)
    askOn = b.node.id; selectOne(b.node.id); render();
    choose([{ cmd: 'toCase', label: 'Case로 바꾸고 갈래 하나 넣기' }, { cmd: 'keep', label: 'If 그대로 두기' }]);
    return say('If에는 갈래를 넣을 수 없습니다. Case로 바꿀까요? (j k · Enter, 숫자 키, Esc: 그만두기)');
  }
  const c = caseAt();""")
    sub("""  selectOne(t.id); render();
  say('갈래를 뺐습니다. 안의 블록도 함께 지워졌습니다 (u로 되돌리기)');
}""",
        """  selectOne(t.id); render();
  if (t.labels.length === 2) {
    // 갈래가 하나만 남았다: If처럼 보이므로 If로 바꿀지 묻는다
    askOn = t.id;
    choose([{ cmd: 'toIf', label: 'If로 바꾸기' }, { cmd: 'keep', label: 'Case 그대로 두기' }]);
    return say('갈래를 뺐습니다. 갈래가 하나만 남았습니다. If로 바꿀까요? (j k · Enter, 숫자 키, Esc: 그만두기)');
  }
  say('갈래를 뺐습니다. 안의 블록도 함께 지워졌습니다 (u로 되돌리기)');
}
// MD3의 물음에 대한 답. 바꾸기는 따로 실행 취소 한 번이다
let askOn = null;
function swapNode(old, n) {
  const e = idx.get(old.id);
  e.list.splice(e.index, 1, n);
  [...folded].forEach(k => { if (String(k).startsWith(old.id + ':')) folded.delete(k); });
}
function toIf() {
  // Case(갈래 하나 + default) → If: 조건은 Case의 글자, 참 갈래는 그 갈래(이름도), 거짓 갈래는 default
  const t = askOn && idx.get(askOn)?.node;
  askOn = null;
  if (!t || t.type !== 'case' || t.labels.length !== 2) return;
  const n = { id: t.id, type: 'if', text: t.text, yes: t.c0, no: t.c1, ...(t.labels[0] && t.labels[0] !== IFL[0] ? { labels: [t.labels[0], ''] } : {}) };
  apply(() => swapNode(t, n));
  selectOne(n.id); render();
  say('If로 바꿨습니다. 참 갈래의 이름은 Case 갈래의 이름입니다 (u로 되돌리기)');
}
function toCase() {
  // If → Case: 조건은 그대로, 참 갈래가 첫 갈래, 거짓 갈래가 default. 그 사이에 새 갈래를 넣고 이름을 적게 한다
  const t = askOn && idx.get(askOn)?.node;
  askOn = null;
  if (!t || t.type !== 'if') return;
  const n = { id: t.id, type: 'case', text: t.text, labels: [(t.labels && t.labels[0]) || '1', '2', 'default'], c0: t.yes, c1: [P()], c2: t.no };
  apply(() => swapNode(t, n));
  selectOne(n.c1[0].id); render();
  startEdit(n.id + '#1');
  say('Case로 바꾸고 갈래를 넣었습니다. 갈래 이름을 적으세요');
}""")
    sub("""  delDia: delDiagram, unwrap, fold,""",
        """  toIf, toCase, keep: () => { askOn = null; say('그대로 둡니다'); },
  delDia: delDiagram, unwrap, fold,""")
    sub("""       ...(caseAt() ? [it('laneAdd', 'Case: 갈래 넣기', '+'), it('laneRemove', 'Case: 이 갈래 빼기', '-'), it('laneLabel', 'Case: 갈래 이름 고치기', 'L'), null] : []),""",
        """       ...(caseAt() ? [it('laneAdd', 'Case: 갈래 넣기', '+'), it('laneRemove', 'Case: 이 갈래 빼기', '-'), it('laneLabel', 'Case: 갈래 이름 고치기', 'L'), null]
         : branchAt() ? [it('laneLabel', 'If: 갈래 이름 고치기', 'L'), it('laneAdd', 'If: Case로 바꾸기…', '+'), null] : []),""")
    sub("""<dt><kbd>+</kbd> / <kbd>-</kbd></dt><dd>Case 안에서: 지금 갈래 뒤에 갈래 넣기 / 지금 갈래 빼기. 갈래 이름은 더블클릭해서 고칩니다 (키는 아직 없습니다). default 갈래는 늘 맨 끝에 있고 뺄 수 없습니다</dd>""",
        """<dt><kbd>+</kbd> / <kbd>-</kbd></dt><dd>Case 안에서: 지금 갈래 뒤에 갈래 넣기 / 지금 갈래 빼기. default 갈래는 늘 맨 끝에 있고 뺄 수 없습니다. 갈래가 하나만 남으면 If로 바꿀지 묻고, If에서 <kbd>+</kbd>를 누르면 Case로 바꿀지 묻습니다</dd>
        <dt><kbd>Shift</kbd>+<kbd>L</kbd></dt><dd>If · Case 안에서: 지금 갈래의 이름 고치기. 갈래 이름을 더블클릭해도 됩니다. If의 이름을 비우면 "참" · "거짓"으로 돌아갑니다</dd>""")

    # --- 머리 모양 "제목처럼" (H1): 문서 설정. 모자 · 아치 없이 딱지 + 굵은 이름 + 아랫줄 ---
    sub("""        <label><input type="checkbox" id="optRanges" checked> 접기 영역 보기</label>""",
        """        <label><input type="checkbox" id="optRanges" checked> 접기 영역 보기</label>
        <label title="문서 설정: 파일에 저장되고 실행 취소의 대상입니다">머리 모양 <select id="optHead"><option value="shape">모자 · 아치</option><option value="title">제목처럼</option></select></label>
        <label title="사용자 설정: 두 번 누르는 키의 첫 키 뒤 0.4초가 지나면 이어 누를 키를 보입니다"><input type="checkbox" id="optKeyHint" checked> 키 안내</label>""")
    sub("""const isMethod = d => !!d && d.event != null && d.kind === 'method';""",
        """const isMethod = d => !!d && d.event != null && d.kind === 'method';
const titleHead = () => doc.settings?.headStyle === 'title';   // 머리 모양 "제목처럼" (문서 설정, 62번째 판, H1)
const TITLE = { tag: 16, gap: 6 };                            // size.title-tag · size.title-gap""")
    sub("""    if (d.event != null) {
      const et = tsize(d.event || ' ');
      W = Math.max(W, et.w + 2 * K.padX + 24);
      eh = K.hat + et.h + 2 * K.padY;
    }""",
        """    if (d.event != null && titleHead()) {
      // 제목처럼: 딱지 줄 + 굵은 이름 + 아랫줄. 글자는 다이어그램의 왼쪽 선에 맞춘다
      const et = tsize(d.event || ' ');
      W = Math.max(W, ...et.lines.map(l => boldW(l)), tagW('Method'));
      eh = TITLE.tag + et.h + TITLE.gap;
    } else if (d.event != null) {
      const et = tsize(d.event || ' ');
      W = Math.max(W, et.w + 2 * K.padX + 24);
      eh = K.hat + et.h + 2 * K.padY;
    }""")
    sub("""      out.items.push({ k: 'event', id: d.id, x: DX, y: Y, w: b.W, h: b.eh, text: d.event, method: isMethod(d) });
      L.set(d.id, { x: DX, y: Y, w: b.W, h: b.eh });
      T.set(d.id, { x: DX, y: Y + K.hat, w: b.W, h: b.eh - K.hat });""",
        """      const title = titleHead(), top0 = title ? TITLE.tag : K.hat;
      out.items.push({ k: 'event', id: d.id, x: DX, y: Y, w: b.W, h: b.eh, text: d.event, method: isMethod(d), title });
      L.set(d.id, { x: DX, y: Y, w: b.W, h: b.eh });
      T.set(d.id, { x: DX, y: Y + top0, w: b.W, h: b.eh - top0 });""")
    sub("""    } else if (it.k === 'event') {
      const { x, y, w, h } = it, bw = Math.min(110, w * 0.45), top = y + K.hat;""",
        """    } else if (it.k === 'event' && it.title) {
      // 제목처럼: 바탕 없이(종이 그대로) 흐린 딱지, 굵은 이름, 아래에 가는 줄. 고르는 자리는 머리 전체
      const { x, y, w, h } = it;
      s.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#ffffff" fill-opacity="0"${da(it.id)}/>`);
      s.push(`<text x="${x}" y="${y + 12}" font-family="${FAM_SANS}" font-size="12" fill="${COL.muted}" pointer-events="none">${it.method ? 'Method' : 'Event'}</text>`);
      s.push(txt(it.text, x, y + TITLE.tag, null, ' font-weight="600"'));
      s.push(`<line x1="${x}" y1="${y + h}" x2="${x + w}" y2="${y + h}" stroke="${COL.stroke}" stroke-width="1" pointer-events="none"/>`);
    } else if (it.k === 'event') {
      const { x, y, w, h } = it, bw = Math.min(110, w * 0.45), top = y + K.hat;""")
    sub("""$('#optRanges').addEventListener('change', e => { opts.showRegions = e.target.checked; render(); save(); });""",
        """$('#optRanges').addEventListener('change', e => { opts.showRegions = e.target.checked; render(); save(); });
// 머리 모양은 문서 설정이라 실행 취소의 대상이다. 키 안내는 사용자 설정(이 브라우저)
$('#optHead').addEventListener('change', e => { const v = e.target.value; apply(() => { if (v === 'title') doc.settings = { ...(doc.settings || {}), headStyle: 'title' }; else if (doc.settings) { delete doc.settings.headStyle; if (!Object.keys(doc.settings).length) delete doc.settings; } }); say(v === 'title' ? '머리 모양: 제목처럼' : '머리 모양: 모자 · 아치'); });
$('#optKeyHint').addEventListener('change', e => { opts.keyHint = e.target.checked; showMode(); save(); });""")
    sub("""  $('#zoomOut').textContent = Math.round(zoom * 100) + '%';""",
        """  $('#zoomOut').textContent = Math.round(zoom * 100) + '%';
  $('#optHead').value = titleHead() ? 'title' : 'shape';""")
    sub("""  return JSON.stringify({ format: 'ariadne-nsd', version: 0, diagrams: doc.diagrams, ...(doc.sfolds ? { siteFolds: doc.sfolds } : {}), view }, null, 2);""",
        """  return JSON.stringify({ format: 'ariadne-nsd', version: 0, ...(doc.settings ? { settings: doc.settings } : {}), diagrams: doc.diagrams, ...(doc.sfolds ? { siteFolds: doc.sfolds } : {}), view }, null, 2);""")
    sub("""    return { diagrams: ds, ...(Array.isArray(sf) && sf.every(f => f && typeof f.pre === 'string' && Array.isArray(f.rids)) ? { sfolds: sf } : {}) };""",
        """    return { ...(m.settings && typeof m.settings === 'object' && m.settings.headStyle === 'title' ? { settings: { headStyle: 'title' } } : {}),
      diagrams: ds, ...(Array.isArray(sf) && sf.every(f => f && typeof f.pre === 'string' && Array.isArray(f.rids)) ? { sfolds: sf } : {}) };""")
    sub("""    $('#optSyntax').checked = opts.syntax; $('#optMono').checked = opts.mono; $('#optRanges').checked = opts.showRegions !== false;""",
        """    $('#optSyntax').checked = opts.syntax; $('#optMono').checked = opts.mono; $('#optRanges').checked = opts.showRegions !== false; $('#optKeyHint').checked = opts.keyHint !== false;""")

    # --- 두 키 조합의 안내 상자 (K1): 첫 키 뒤 0.4초가 지나면 캔버스 아래에 ---
    sub("""function showMode() { $('#mode').textContent = editing ? '-- 고치기 --' : pend ? pend : visual ? '-- 영역 --' : ''; }""",
        """function showMode() { $('#mode').textContent = editing ? '-- 고치기 --' : pend ? pend : visual ? '-- 영역 --' : ''; syncHint(); }
// 두 번 누르는 키의 안내: [묶음 이름, [[둘째 키, 명령], …]] (62번째 판, K1)
const KEYHINT = {
  a: ['뒤에 넣기', [['i', 'If'], ['w', 'While'], ['f', 'For'], ['d', 'Do-While'], ['k', 'Case'], ['c', '호출 블록']]],
  A: ['앞에 넣기', [['i', 'If'], ['w', 'While'], ['f', 'For'], ['d', 'Do-While'], ['k', 'Case'], ['c', '호출 블록']]],
  s: ['감싸기', [['w', 'While'], ['f', 'For'], ['d', 'Do-While'], ['i', 'If'], ['k', 'Case']]],
  c: ['고치기', [['c', '글자를 비우고 새로 적기']]],
  d: ['잘라내기 · 풀기', [['d', '잘라내기'], ['s', '풀기 (제어 블록 벗기기, 호출 블록을 Method의 블록들로)']]],
  y: ['복사', [['y', '복사']]],
  z: ['접기', [['a', '접기 · 펴기'], ['o', '펴기'], ['c', '접기'], ['R', '모두 펴기'], ['M', '모두 접기'], ['f', '접기 영역 만들기'], ['d', '접기 영역 풀기']]],
  g: ['가기', [['g', '다이어그램의 처음'], ['d', '부르는 Method로']]],
  '[': ['앞 다이어그램', [['[', '앞 다이어그램으로']]],
  ']': ['뒤 다이어그램', [[']', '뒤 다이어그램으로']]]
};
let hintTimer = 0, hintFor = '';
function syncHint() {
  const box = $('#keyhint');
  if (!pend || editing || opts.keyHint === false || !KEYHINT[pend]) { clearTimeout(hintTimer); hintTimer = 0; hintFor = ''; box.hidden = true; return; }
  if (hintFor === pend) return;
  hintFor = pend; clearTimeout(hintTimer); box.hidden = true;
  hintTimer = setTimeout(() => { if (pend === hintFor) showHint(pend); }, 400);
}
function showHint(k) {
  // 캔버스 아래(상태 줄 바로 위)에 캔버스 폭만큼. 한 번에 나타나고 한 번에 사라진다
  const [title, rows] = KEYHINT[k], box = $('#keyhint'), r = stage.getBoundingClientRect();
  box.innerHTML = `<b class="kt"><kbd>${esc(k)}</kbd> ${esc(title)}</b><div class="kg">` + rows.map(([key, name]) => `<span><kbd>${esc(key)}</kbd>${esc(name)}</span>`).join('') + '</div>';
  box.style.left = (r.left + 10) + 'px';
  box.style.width = Math.max(200, r.width - 20) + 'px';
  box.style.bottom = (innerHeight - r.bottom + 10) + 'px';
  box.hidden = false;
}""")
    sub("""  <footer class="status" aria-live="polite">""",
        """  <div class="keyhint" id="keyhint" hidden></div>
  <footer class="status" aria-live="polite">""")
    sub(""".status .where { margin-left: auto; font-variant-numeric: tabular-nums; }""",
        """.status .where { margin-left: auto; font-variant-numeric: tabular-nums; }
.keyhint { position: fixed; z-index: 15; background: var(--panel); border: 1px solid var(--line); border-radius: 6px; padding: 10px; font-size: 13px; color: var(--fg); }
.keyhint[hidden] { display: none; }
.keyhint .kt { display: block; margin-bottom: 6px; }
.keyhint .kg { display: grid; grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); gap: 4px 16px; }
.keyhint kbd { font-family: var(--mono); font-weight: 600; color: var(--accent); margin-right: 6px; }""")
    sub("""두 번 누르는 키는 첫 키를 누르면 상태 줄 왼쪽에 그 키가 보이고, 맞지 않는 키나 <kbd>Esc</kbd>를 누르면 그만둡니다.</p>""",
        """두 번 누르는 키는 첫 키를 누르면 상태 줄 왼쪽에 그 키가 보이고, 0.4초 안에 둘째 키를 누르지 않으면 캔버스 아래에 이어 누를 키의 안내가 뜹니다(캔버스 위의 "키 안내"로 끔). 맞지 않는 키나 <kbd>Esc</kbd>를 누르면 그만둡니다.</p>""")

elif stage == '3':
    # --- 여러 다이어그램의 배치 (1.7, DA1): Event · 머리 없는 것은 왼쪽 무리, Method는 오른쪽 무리, 사이 88px, 16 : 10 ---
    sub("""  // 순서대로 위에서 아래로 쌓다가, 가장 큰 다이어그램의 높이를 넘으면 오른쪽 새 줄로 넘긴다 (^edit-multi-diagram)""",
        """  // 두 무리(왼쪽: Event와 머리 없는 것, 오른쪽: Method)를 각각 위에서 아래로 쌓다가 줄 높이를 넘으면 오른쪽 새 줄로 넘긴다.
  // 줄 높이는 그림 전체가 16 : 10에 가장 가까워지는 것을 4px씩 올려 보며 고른다 (62번째 판, 상세 설계 레이아웃 1.7, DA1)""")
    sub("""  const top = 24, limit = Math.max(K.colMin, ...boxes.map(b => b.H));
  let X = 24, Y = top, colW = 0, bottom = 0;
  for (const b of boxes) {
    if (Y > top && Y + b.H > top + limit) { X += colW + K.gap; Y = top; colW = 0; }
    const d = b.d, DX = X + b.gut, g0 = out.ghosts.length;""",
        """  const top = 24, left = 24, kindGap = 2 * K.gap;
  const groups = [boxes.filter(b => !isMethod(b.d)), boxes.filter(b => isMethod(b.d))];
  const stack = (group, limit) => {
    let X = 0, Y = 0, colW = 0, bottom = 0;
    const pos = [];
    for (const b of group) {
      if (Y > 0 && Y + b.H > limit) { X += colW + K.gap; Y = 0; colW = 0; }
      pos.push({ b, x: X, y: Y });
      colW = Math.max(colW, b.W + b.gut); bottom = Math.max(bottom, Y + b.H);
      Y += b.H + K.gap;
    }
    return { w: group.length ? X + colW : 0, h: bottom, pos };
  };
  const tall = g => g.reduce((a, b) => a + b.H, 0) + Math.max(0, g.length - 1) * K.gap;
  const h0 = Math.max(K.colMin, ...boxes.map(b => b.H)), h1 = Math.max(h0, ...groups.map(tall));
  let best = null;
  for (let lim = h0; ; lim += 4) {
    const [A, B] = groups.map(g => stack(g, lim));
    const W = A.w + B.w + (A.w && B.w ? kindGap : 0), H = Math.max(A.h, B.h), score = Math.abs(W / H - 1.6);
    if (!best || score < best.score - 1e-9) best = { score, A, B, W, H };
    if (lim >= h1) break;
  }
  const placed = [...best.A.pos.map(p => ({ ...p, x: left + p.x })), ...best.B.pos.map(p => ({ ...p, x: left + best.A.w + (best.A.w ? kindGap : 0) + p.x }))];
  for (const { b, x: X, y: py } of placed) {
    const Y = top + py;
    const d = b.d, DX = X + b.gut, g0 = out.ghosts.length;""")
    sub("""    out.ghosts.slice(g0).forEach(g => { g.left = DX; g.cols = b.cols; });
    colW = Math.max(colW, b.W + b.gut);
    bottom = Math.max(bottom, Y + b.H);
    Y += b.H + K.gap;
  }
  out.W = X + colW + 24; out.H = bottom + 24;""",
        """    out.ghosts.slice(g0).forEach(g => { g.left = DX; g.cols = b.cols; });
  }
  out.W = left + best.W + 24; out.H = top + best.H + 24;""")

    # --- 결과 기호 (← / =): 문서마다 하나, 보기 상태라 실행 취소의 대상이 아니다 ---
    sub("""  const res = n.result ? n.result + ' ← ' : '';""",
        """  const res = n.result ? n.result + ` ${resultSym()} ` : '';""")
    sub("""const callLine = n => {""",
        """function resultSym() { return opts.resultSym === '=' ? '=' : '←'; }
const callLine = n => {""")
    sub("""        <label title="사용자 설정: 두 번 누르는 키의""",
        """        <label title="문서 설정: 파일에 저장됩니다. 보기 상태라 실행 취소의 대상이 아닙니다">결과 기호 <select id="optSym"><option value="←">←</option><option value="=">=</option></select></label>
        <label title="사용자 설정: 두 번 누르는 키의""")
    sub("""$('#optKeyHint').addEventListener('change',""",
        """$('#optSym').addEventListener('change', e => { opts.resultSym = e.target.value; render(); save(); say('결과 기호: ' + resultSym()); });
$('#optKeyHint').addEventListener('change',""")
    sub("""  $('#optHead').value = titleHead() ? 'title' : 'shape';""",
        """  $('#optHead').value = titleHead() ? 'title' : 'shape';
  $('#optSym').value = resultSym();""")
    sub("""    opened: [...opened].filter(id => id.split('>').every(k => idx.has(k))).sort() };""",
        """    opened: [...opened].filter(id => id.split('>').every(k => idx.has(k))).sort(), ...(resultSym() === '=' ? { resultSym: '=' } : {}) };""")
    sub("""  if (m.view && typeof m.view.bands === 'boolean') { opts.showRegions = m.view.bands; $('#optRanges').checked = m.view.bands; }""",
        """  if (m.view && typeof m.view.bands === 'boolean') { opts.showRegions = m.view.bands; $('#optRanges').checked = m.view.bands; }
  opts.resultSym = m.view && m.view.resultSym === '=' ? '=' : '←';""")

    # --- 머리에서 괄호를 지우면 호출 블록의 인자도 지운다 (기억하지 않는다) ---
    sub("""    n.name = headName(t.event);
    // 넘겨주는 것이 비어 있으면 머리의 괄호 안 글자를 채운다
    if (!n.args) n.args = headParams(t.event);""",
        """    n.name = headName(t.event);
    // 받는 것이 없는 Method(괄호 없음)면 인자를 지운다. 넘겨주는 것이 비어 있으면 머리의 괄호 안 글자를 채운다 (62번째 판)
    if (!headParens(t.event)) n.args = '';
    else if (!n.args) n.args = headParams(t.event);""")

    # --- 호출 블록을 고치는 칸 둘: 결과 칸과 인자 칸, Tab으로 오간다. 이름은 칸이 아니다 ---
    sub("""  if (n && n.type === 'call') {
    // 한 줄로 고친다. 이름은 잠겨 있고 인자(괄호 안)와 결과(← 앞)만 바뀐다. 인자가 있으면 인자를, 없으면 맨 앞(결과 자리)을 고른 채로 연다
    const p = callParts(n), at = (p.res + p.name).length;
    if (p.post && how === 'start') editor.setSelectionRange(at + 1, at + 1);
    else if (p.post) editor.setSelectionRange(at + 1, orig.length - 1); else editor.setSelectionRange(0, 0);
    say(p.post ? '인자와 결과를 고칩니다: 결과 ← 이름(인자). 이름은 머리에서 고칩니다 (' + endHint() + ')' : '결과를 받으려면 맨 앞에 "결과 ← "를 적으세요. 이름은 머리에서 고칩니다 (' + endHint() + ')');
  }""",
        """  if (n && n.type === 'call') {
    // 칸이 둘이다: 이름 앞의 결과 칸, 이름 뒤의 인자 칸. 인자 칸에서 시작하고 Tab으로 오간다. 받는 것이 없는 Method면 결과 칸 하나 (62번째 판)
    const params = headParens(dia(n.target).event);
    editing.call = { res: n.result || '', args: n.args || '', params, field: params ? 'args' : 'res', box };
    callField(how);
  }""")
    sub("""const endHint = () => 'Enter · Esc: 정하기';""",
        """const endHint = () => 'Enter · Esc: 정하기';
function callField(how) {
  // 호출 블록의 칸 하나를 연다: 글자 칸을 그 칸의 자리에 옮기고 그 칸의 글자만 넣는다
  const c = editing.call, n = idx.get(editing.id).node, p = callParts(n), b = c.box;
  const x0 = b.x + K.padX + K.bar - 2;
  const x = c.field === 'res' ? x0 : x0 + tsize(p.pre).w + boldW(p.name) + tsize('(').w;
  editor.value = how === 'clear' ? '' : c[c.field];
  editor.style.left = (x * zoom) + 'px';
  editor.style.width = Math.max(90, Math.min(260, tsize(editor.value).w + 40)) * zoom + 'px';
  growEditor();
  if (how === 'start') editor.setSelectionRange(0, 0); else editor.select();
  const other = c.params ? (c.field === 'args' ? ' · Tab: 결과 칸' : ' · Tab: 인자 칸') : '';
  say((c.field === 'args' ? `인자 칸: ${p.name}( … )` : `결과 칸: … ${resultSym()} ${p.name}`) + other + ' · 이름은 머리에서 고칩니다 (' + endHint() + ')');
}""")
    sub("""  } else if (idx.get(e.id)?.node.type === 'call') {
    const n = idx.get(e.id).node, t = n.target != null ? dia(n.target) : null;
    if (!cancel && v !== e.orig && isMethod(t)) {
      const p = parseCall(v, headName(t.event));
      const bad = !p ? '이름은 호출 블록에서 고칠 수 없습니다. Method의 머리에서 고치거나 r로 다른 Method를 고르세요'
        : p.args && !headParens(t.event) ? '받는 것이 없는 Method입니다. 넘겨주려면 먼저 머리에 괄호를 붙이세요: 이름(받는 것)' : '';
      if (bad) {
        render(); startEdit(e.id, { fresh: e.fresh, retry: true }); editor.value = v; growEditor();
        return say(bad + ' (Esc: 그만두기)', true);
      }
      if (!e.fresh) pushUndo();
      n.args = p.args; n.result = p.result;
    }""",
        """  } else if (e.call) {
    // 두 칸의 글자를 한꺼번에 받아들인다. 한 줄로 적고, 받는 것이 있는 Method의 인자를 비우면 머리의 괄호 안 글자가 다시 들어간다
    const n = idx.get(e.id)?.node, t = n && n.target != null ? dia(n.target) : null, c = e.call;
    c[c.field] = v;
    if (n && !cancel && isMethod(t)) {
      const res = oneLine(c.res), args = c.params ? (oneLine(c.args) || headParams(t.event)) : '';
      if (res !== (n.result || '') || args !== (n.args || '')) {
        if (!e.fresh) pushUndo();
        n.args = args; n.result = res;
      }
    }""")
    sub("""  if (ev.key === 'Enter' && !ev.shiftKey) { ev.preventDefault(); commitEdit(false); }""",
        """  if (ev.key === 'Tab' && editing?.call) {
    // 호출 블록: 결과 칸과 인자 칸을 오간다
    ev.preventDefault();
    const c = editing.call;
    if (!c.params) return say('받는 것이 없는 Method라 결과 칸만 있습니다');
    c[c.field] = editor.value; c.field = c.field === 'args' ? 'res' : 'args';
    return callField('');
  }
  if (ev.key === 'Enter' && editing?.call) { ev.preventDefault(); commitEdit(false); }   // 호출 블록의 칸은 한 줄이다
  else if (ev.key === 'Enter' && !ev.shiftKey) { ev.preventDefault(); commitEdit(false); }""")

elif stage == '3b':
    # R로 새 Method를 만들어 부를 때: 이름을 처음 적는 동안은 괄호가 없어 인자가 지워진다. 그 인자를 들고 있다가 괄호 있는 이름을 적으면 되돌린다
    sub("""  const host = activeDia();
  const d = arg === 'new' ? newDia('', null, 'method') : dia(arg);
  if (!d) return;
  if (d.id === n.target) return say('그대로 둡니다');
  apply(() => {""",
        """  const host = activeDia();
  const d = arg === 'new' ? newDia('', null, 'method') : dia(arg);
  if (!d) return;
  if (d.id === n.target) return say('그대로 둡니다');
  const kept = { call: n.id, args: n.args };
  apply(() => {""")
    sub("""  if (arg === 'new') { selectOne(d.id); render(); startEdit(d.id, { fresh: true }); }
  else { selectOne(n.id); render(); say('부를 Method를 바꿨습니다. 인자와 결과는 그대로입니다'); }""",
        """  if (arg === 'new') { selectOne(d.id); render(); startEdit(d.id, { fresh: true }); if (editing) editing.keptArgs = kept; }
  else { selectOne(n.id); render(); say(headParens(d.event) ? '부를 Method를 바꿨습니다. 인자와 결과는 그대로입니다' : '부를 Method를 바꿨습니다. 받는 것이 없는 Method라 인자는 지웠습니다'); }""")
    sub("""    // 호출 블록의 이름은 머리를 따르므로 따로 고칠 것이 없다
    setText(e.id, v);""",
        """    // 호출 블록의 이름은 머리를 따르므로 따로 고칠 것이 없다
    setText(e.id, v);
    if (e.keptArgs && headParens(v)) { const c = idx.get(e.keptArgs.call)?.node; if (c && !c.args) c.args = e.keptArgs.args; }""")

elif stage == '4':
    # 안내 상자의 키는 상자 없이 고정폭 굵게 강조색 (도움말의 kbd 모양을 물려받지 않게)
    sub(""".keyhint kbd { font-family: var(--mono); font-weight: 600; color: var(--accent); margin-right: 6px; }""",
        """.keyhint kbd { all: unset; font-family: var(--mono); font-weight: 600; color: var(--accent); margin-right: 8px; }""")
    # 도움말: 이번에 바뀐 것
    sub("""      <h2>이번에 바뀐 것 (10-25, 61번째 판)</h2>""",
        """      <h2>이번에 바뀐 것 (10-31, 62번째 판)</h2>
      <ul>
        <li><b>2026-10-18 · 10-25에 정하고 넣지 못한 것을 모두 넣었습니다.</b></li>
        <li><b>For 블록:</b> While과 같은 모양이고 머리의 글자로 가릅니다. 넣기 <kbd>a</kbd> <kbd>f</kbd> · <kbd>A</kbd> <kbd>f</kbd>, 감싸기 <kbd>s</kbd> <kbd>f</kbd>. <kbd>f</kbd>만 누르면 그대로 접기 · 펴기입니다.</li>
        <li><b>빈 갈래의 ∅:</b> If · Case의 갈래에 빈 블록 하나만 있으면 가운데에 ∅가 보입니다.</li>
        <li><b>If 갈래의 이름을 고칩니다:</b> <kbd>Shift</kbd>+<kbd>L</kbd>이나 갈래 이름 더블클릭. 비우면 "참" · "거짓"으로 돌아갑니다.</li>
        <li><b>Case ↔ If:</b> Case의 갈래가 하나만 남으면 If로 바꿀지, If에서 <kbd>+</kbd>를 누르면 Case로 바꿀지 묻습니다. 묻는 모양과 글자를 옮기는 법은 아직 정하지 않아 임시입니다(조건은 그대로, 갈래 이름은 참 갈래로).</li>
        <li><b>Case 갈래 이름:</b> 칸의 왼쪽에, default만 오른쪽에 붙습니다.</li>
        <li><b>조건 글자 뒤 바탕:</b> 긴 조건이 빗금에 닿으면 글자 둘레에서 빗금이 끊깁니다.</li>
        <li><b>짧은 갈래:</b> 남는 높이를 그 갈래의 블록들이 고르게 나눠 받습니다.</li>
        <li><b>머리 모양 "제목처럼":</b> 캔버스 위 "머리 모양"에서 고릅니다. 문서 설정이라 파일에 저장되고 되돌릴 수 있습니다.</li>
        <li><b>두 키 안내:</b> 두 번 누르는 키의 첫 키 뒤 0.4초가 지나면 캔버스 아래에 이어 누를 키가 보입니다. "키 안내"로 끕니다.</li>
        <li><b>여러 다이어그램의 배치:</b> Event(와 머리 없는 것)는 왼쪽, Method는 오른쪽에 모아 놓고 두 무리 사이를 88px 띄웁니다. 그림 전체가 16 : 10에 가깝게 줄을 나눕니다.</li>
        <li><b>호출 블록을 고치는 칸이 둘입니다:</b> 이름 뒤의 인자 칸에서 시작하고 <kbd>Tab</kbd>으로 이름 앞의 결과 칸과 오갑니다. 이름은 칸이 아닙니다. 결과 기호(← / =)는 캔버스 위 "결과 기호"에서 고릅니다. Method의 머리에서 괄호를 지우면 그 Method를 부르는 호출 블록의 인자도 지워집니다.</li>
      </ul>

      <h2>앞서 바뀐 것 (10-25, 61번째 판)</h2>""")

else:
    raise SystemExit('unknown stage')

path.write_text(src, encoding='utf-8')
print('stage', stage, 'applied')
