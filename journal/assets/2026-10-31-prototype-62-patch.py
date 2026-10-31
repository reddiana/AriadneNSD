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

else:
    raise SystemExit('unknown stage')

path.write_text(src, encoding='utf-8')
print('stage', stage, 'applied')
