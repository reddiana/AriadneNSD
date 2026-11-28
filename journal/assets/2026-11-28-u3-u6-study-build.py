"""M93 시안(U3 · U6)을 만든다. 틀(style)은 M91 페이지에서 그대로 가져온다.

python journal/assets/2026-11-28-u3-u6-study-build.py
→ journal/assets/2026-11-28-u3-u6-study.html
"""
import pathlib
import re

HERE = pathlib.Path(__file__).parent
M91 = (HERE / "2026-11-28-interaction-abstraction-study.html").read_text(encoding="utf-8")
STYLE = re.search(r"<style>(.*?)</style>", M91, re.S).group(1)
STYLE = STYLE.replace("/* M89 · M90과 같은 틀.", "/* M91과 같은 틀(복사). M91:")
STYLE += """
.ns .chip { fill: var(--accent); stroke: none; }
.ns .chipt { fill: var(--panel); font-family: var(--mono); font-weight: 600; font-size: 11px; }
.ns .prev { stroke: var(--accent); stroke-width: 2.5; stroke-dasharray: 5 3; }
.ns .ptr { fill: var(--ink); stroke: var(--paper); stroke-width: 1; }
.ns .tip { fill: var(--accent); font-size: 11.5px; font-weight: 600; }
.ns .dg { fill: var(--paper); }
.ns .dsel { stroke: var(--sel); stroke-width: 2.5; }
.ns .colt { fill: var(--muted); font-size: 11.5px; font-weight: 600; }
.ns .arr { stroke: var(--pick); stroke-width: 1.6; }
"""

# ---------- NS 그림 조각 ----------

P_H = 34  # 처리 블록 높이
W_COND = 22  # 반복 블록의 조건 칸 높이
W_BAR = 14  # 반복 블록의 왼쪽 띠


def txt(x, y, s, cls="", size=None, anchor="middle"):
    st = f' style="font-size:{size}px"' if size else ""
    c = f' class="{cls}"' if cls else ""
    return f'<text{c} x="{x}" y="{y}" text-anchor="{anchor}"{st}>{s}</text>'


def item_h(it):
    if it[0] == "p":
        return P_H
    return W_COND + sum(item_h(i) for i in it[2])


def draw_items(items, x, y, w, h, cls_of=None):
    """본문의 블록들. 마지막 블록이 남은 높이를 채운다."""
    out = []
    cy = y
    for k, it in enumerate(items):
        ih = item_h(it) if k < len(items) - 1 else (y + h - cy)
        cls = it[-1] if isinstance(it[-1], str) and it[-1] in ("new", "sel") else ""
        if it[0] == "p":
            out.append(f'<rect x="{x}" y="{cy}" width="{w}" height="{ih}"/>')
            out.append(txt(x + w / 2, cy + ih / 2 + 4, it[1]))
        else:  # ("w", cond, inner, [cls])
            out.append(f'<rect x="{x}" y="{cy}" width="{w}" height="{ih}"/>')
            out.append(f'<line x1="{x + W_BAR}" y1="{cy + W_COND}" x2="{x + w}" y2="{cy + W_COND}"/>')
            out.append(f'<line x1="{x + W_BAR}" y1="{cy + W_COND}" x2="{x + W_BAR}" y2="{cy + ih}"/>')
            out.append(txt(x + w / 2, cy + 15, it[1], size=11.5))
            out += draw_items(it[2], x + W_BAR, cy + W_COND, w - W_BAR, ih - W_COND)
        if cls == "new":
            out.append(f'<rect class="newr" x="{x + 1.5}" y="{cy + 1.5}" width="{w - 3}" height="{ih - 3}" style="fill:none"/>')
        cy += ih
    return out


def case_block(x, y, w, cols, body_h=None, label_cls=None):
    """Case `state`. cols = [(라벨, 폭, [블록…], 표시)]. 표시: None · 'new'(새 분기) · 'pv'(미리보기 테두리)."""
    head_h, lab_h = 28, 22
    bh = body_h or max(sum(item_h(i) for i in c[2]) for c in cols)
    total = head_h + lab_h + bh
    out = [f'<rect x="{x}" y="{y}" width="{w}" height="{total}"/>',
           txt(x + w / 2, y + 18, "state"),
           f'<line x1="{x}" y1="{y + head_h}" x2="{x + w}" y2="{y + head_h}"/>',
           f'<line x1="{x}" y1="{y + head_h + lab_h}" x2="{x + w}" y2="{y + head_h + lab_h}"/>']
    cx = x
    fills = []
    marks = []
    for i, (lab, cw, items, mark) in enumerate(cols):
        if i > 0:
            out.append(f'<line x1="{cx}" y1="{y + head_h}" x2="{cx}" y2="{y + total}"/>')
        if mark == "new":
            fills.append(f'<rect class="newr" x="{cx + 1.5}" y="{y + head_h + 1.5}" width="{cw - 3}" height="{lab_h + bh - 3}"/>')
        if mark == "pv":
            marks.append(f'<rect class="prev" x="{cx + 1.5}" y="{y + head_h + 1.5}" width="{cw - 3}" height="{lab_h + bh - 3}"/>')
        if label_cls and label_cls[0] == i:
            out.append(f'<rect class="selr" x="{cx + 1.5}" y="{y + head_h + 1.5}" width="{cw - 3}" height="{lab_h - 3}"/>')
        out.append(txt(cx + cw / 2, y + head_h + 16, lab))
        out += draw_items(items, cx, y + head_h + lab_h, cw, bh)
        cx += cw
    return fills + out + marks, total


def chip(x, y, label):
    """끌고 있는 블록 아이콘과 포인터."""
    return [f'<rect class="chip" x="{x}" y="{y}" width="{len(label) * 7.5 + 16}" height="20" rx="4"/>',
            f'<text class="chipt" x="{x + 8}" y="{y + 14}">{label}</text>',
            f'<path class="ptr" d="M{x - 6} {y - 14} l0 15 l4 -4 l3 7 l3 -1.5 l-3 -7 l5.5 0 z"/>']


def svg(w, h, label, parts):
    body = "\n".join(parts)
    return f'<svg class="ns" width="{w}" height="{h}" viewBox="0 0 {w} {h}" role="img" aria-label="{label}">\n{body}\n</svg>'


def bar(w, y, s):
    return [f'<rect class="bar" x="10" y="{y}" width="{w - 20}" height="18"/>', f'<text class="st" x="16" y="{y + 13}">{s}</text>']


BASE = [("1", 90, [("p", "start()")], None), ("2", 90, [("p", "stop()")], None),
        ("default", 100, [("p", "wait()")], None)]
W = 300  # Case 폭


def u3_drag(mode):
    """드래그하는 순간: While 아이콘이 분기 라벨 2 위. mode = 'case' | 'branch'."""
    cols = [list(c) for c in BASE]
    if mode == "branch":
        cols[1][3] = "pv"
    parts, h = case_block(10, 34, W, [tuple(c) for c in cols])
    if mode == "case":
        parts.append(f'<rect class="prev" x="11.5" y="35.5" width="{W - 3}" height="{h - 3}"/>')
    parts += chip(150, 62 + 8, "While")
    parts.append(f'<text class="tip" x="10" y="20" text-anchor="start">While로 감싸기</text>')
    return svg(W + 20, h + 44, "드래그하는 순간", parts)


def u3_wrap_case():
    parts = [f'<rect class="newr" x="11.5" y="11.5" width="{W - 3}" height="{W_COND - 3}"/>',
             f'<rect x="10" y="10" width="{W}" height="{W_COND + 84}"/>',
             txt(10 + W / 2, 25, "조건", size=11.5),
             f'<line x1="{10 + W_BAR}" y1="{10 + W_COND}" x2="{10 + W_BAR}" y2="{10 + W_COND + 84}"/>',
             f'<rect class="newr" x="11.5" y="{10 + W_COND}" width="{W_BAR - 3}" height="{84 - 1.5}"/>']
    cols = [("1", 86, [("p", "start()")], None), ("2", 86, [("p", "stop()")], None),
            ("default", W - W_BAR - 172, [("p", "wait()")], None)]
    p2, h = case_block(10 + W_BAR, 10 + W_COND, W - W_BAR, cols)
    parts += p2
    parts += bar(W + 20, 10 + W_COND + h + 8, "While로 감쌌습니다")
    return svg(W + 20, 10 + W_COND + h + 30, "Case 전체를 While로 감싼 결과", parts)


def u3_wrap_branch():
    cols = [BASE[0], ("2", 90, [("w", "조건", [("p", "stop()")], "new")], None), BASE[2]]
    parts, h = case_block(10, 10, W, cols)
    parts += bar(W + 20, 10 + h + 8, "While로 감쌌습니다")
    return svg(W + 20, 10 + h + 30, "분기 2의 블록을 While로 감싼 결과", parts)


def u3_proc_below():
    parts, h = case_block(10, 10, W, BASE)
    y = 10 + h
    parts += [f'<rect class="newr" x="10" y="{y}" width="{W}" height="{P_H}"/>', f'<rect x="10" y="{y}" width="{W}" height="{P_H}"/>',
              txt(10 + W / 2, y + 21, "∅", "mut")]
    parts += bar(W + 20, y + P_H + 8, "처리 블록을 넣었습니다")
    return svg(W + 20, y + P_H + 30, "처리 블록을 Case 아래에 넣은 결과", parts)


def u3_proc_branch():
    cols = [("1", 70, [("p", "start()")], None), ("2", 70, [("p", "stop()")], None),
            ("3", 70, [("p", "∅")], "new"), ("default", W - 210, [("p", "wait()")], None)]
    parts, h = case_block(10, 10, W, cols)
    parts += bar(W + 20, 10 + h + 8, "분기 3을 만들고 처리 블록을 넣었습니다")
    return svg(W + 20, 10 + h + 30, "분기 2 옆에 새 분기를 만들어 처리 블록을 넣은 결과", parts)


# ---------- U6: 다이어그램의 배치 ----------

def dgm(x, y, name, cls=""):
    w, hh, bh = 104, 20, 26
    out = []
    if cls == "new":
        out.append(f'<rect class="newr" x="{x}" y="{y}" width="{w}" height="{hh + bh}"/>')
    out += [f'<rect class="dg" x="{x}" y="{y}" width="{w}" height="{hh + bh}"/>' if cls != "new" else "",
            f'<rect x="{x}" y="{y}" width="{w}" height="{hh + bh}"/>',
            f'<line x1="{x}" y1="{y + hh}" x2="{x + w}" y2="{y + hh}"/>',
            txt(x + w / 2, y + 14, name, size=11.5),
            txt(x + w / 2, y + hh + 17, "∅" if cls == "new" else "⋯", "mut", size=11.5)]
    if cls == "sel":
        out.append(f'<rect class="dsel" x="{x + 1.5}" y="{y + 1.5}" width="{w - 3}" height="{hh - 3}"/>')
    return out


def u6_canvas(methods, label, note):
    """Event 한 줄(왼쪽), Method 두 줄(오른쪽, 한 줄에 셋). methods = [(이름, 표시)]."""
    parts = [txt(62, 18, "Event", "colt"), txt(250, 18, "Method", "colt")]
    parts += dgm(10, 28, "onStart") + dgm(10, 84, "onClick")
    for i, (name, cls) in enumerate(methods):
        col, row = divmod(i, 3)
        parts += dgm(140 + col * 116, 28 + row * 56, name, cls)
    parts += bar(370, 206, note)
    return svg(370, 230, label, parts)


SEL_AFTER = [("sort", ""), ("partition", "sel"), ("Method 1", "new"), ("swap", ""), ("print", "")]
SEL_END = [("sort", ""), ("partition", "sel"), ("swap", ""), ("print", ""), ("Method 1", "new")]

# ---------- 페이지 ----------

def card(n, title, badge, body, figs):
    b = f'<span class="badge">{badge}</span>' if badge else ""
    pick = " pick" if badge == "추천" else ""
    fig_html = "".join(f'<figure><div class="scene">{s}</div><figcaption>{c}</figcaption></figure>' for s, c in figs)
    return f"""<div class="card{pick}">
  <header><span class="num">{n}</span><h3>{title}</h3>{b}</header>
  {body}
  {fig_html}
</div>"""


U3_CARDS = "\n".join([
    card(1, "분기 라벨 = 그 분기(키보드와 같게)", "추천",
         """<ul><li><b>제어 블록 아이콘</b>: 그 분기의 블록을 감싼다(키보드의 감싸기 BL1과 같음).</li>
<li><b>처리 · 탈출 · 호출 아이콘</b>: 옆에 새 분기를 만들어 넣는다(키보드의 삽입 Q5 · BL3과 같음).</li>
<li><b>끌어 온 블록</b>: 옆에 새 분기를 만들어 넣는다(붙여넣기 BL2와 같음).</li>
<li>Case 전체를 감싸려면 머리 칸(<code>state</code>)이나 If의 조건 칸 위에 놓는다.</li></ul>""",
         [(u3_wrap_branch(), "While 아이콘 → 분기 2의 <code>stop()</code>을 감쌈"),
          (u3_proc_branch(), "처리 아이콘 → 분기 2 옆에 새 분기 3")]),
    card(2, "감싸기만 그 분기로", "",
         """<ul><li><b>제어 블록 아이콘</b>: 그 분기의 블록을 감싼다(1과 같음).</li>
<li><b>처리 · 탈출 · 호출 아이콘, 끌어 온 블록</b>: 지금처럼 Case 블록의 아래(위)로.</li>
<li>바뀌는 칸이 하나라 작지만, 같은 라벨 위에서 감싸기는 분기, 삽입은 블록이 된다.</li></ul>""",
         [(u3_wrap_branch(), "While 아이콘 → 분기 2의 <code>stop()</code>을 감쌈"),
          (u3_proc_below(), "처리 아이콘 → Case 아래")]),
    card(3, "지금대로: 분기 라벨 = 그 If · Case 블록", "지금",
         """<ul><li><b>제어 블록 아이콘</b>: 그 If · Case 전체를 감싼다.</li>
<li><b>처리 · 탈출 · 호출 아이콘, 끌어 온 블록</b>: Case 블록의 아래(위)로.</li>
<li>키보드(분기 라벨 = 그 분기)와 드롭이 다르다. 조작 규칙의 트레이드오프에 적는다.</li></ul>""",
         [(u3_wrap_case(), "While 아이콘 → Case 전체를 감쌈"),
          (u3_proc_below(), "처리 아이콘 → Case 아래")]),
])

U6_CARDS = "\n".join([
    card(1, "모두 지금 다이어그램의 바로 뒤", "추천",
         """<ul><li>새 Event · 새 Method(메뉴), 호출 블록의 "새 Method를 만들고 호출", "Method 만들기"가 모두 붙여넣기 · 새 Method로 빼기와 같은 자리에 놓인다.</li>
<li>지금 다이어그램과 종류가 다르거나 선택한 것이 없으면 그 종류의 맨 뒤.</li>
<li>PowerPoint · Google Slides의 새 슬라이드, Excel의 새 시트(+)와 같다(원칙 ④).</li>
<li>뒤의 다이어그램은 한 칸씩 밀린다(붙여넣기 · 빼기에서 이미 그렇다).</li></ul>""",
         [(u6_canvas(SEL_AFTER, "partition 바로 뒤에 Method 1", "새 Method: partition 바로 뒤"),
           "partition의 헤더를 선택하고 새 Method → 그 바로 뒤")]),
    card(2, "호출에서 만든 Method만 바로 뒤", "",
         """<ul><li>"Method 만들기" · "새 Method를 만들고 호출"은 지금 다이어그램의 호출 블록에서 나오므로 새 Method로 빼기(XM1)처럼 바로 뒤.</li>
<li>메뉴의 새 Event · 새 Method는 지금처럼 그 종류의 맨 뒤.</li>
<li>기준: 지금 다이어그램에서 나온 것은 곁에, 빈 새 다이어그램은 끝에.</li></ul>""",
         [(u6_canvas(SEL_AFTER, "호출에서 만든 Method는 바로 뒤", "Method 만들기: partition 바로 뒤"),
           "partition 안의 호출 블록에서 Method 만들기 → 바로 뒤"),
          (u6_canvas(SEL_END, "메뉴의 새 Method는 맨 뒤", "새 Method(메뉴): 맨 뒤"),
           "메뉴의 새 Method → 맨 뒤")]),
    card(3, "지금대로", "지금",
         """<ul><li>새 Event · 새 Method와 호출에서 만든 Method는 그 종류의 맨 뒤.</li>
<li>붙여넣은 다이어그램과 새 Method로 빼기로 만든 Method만 지금 다이어그램의 바로 뒤.</li>
<li>뷰포트가 맨 뒤로 스크롤해 보던 자리에서 멀어질 수 있다.</li></ul>""",
         [(u6_canvas(SEL_END, "맨 뒤에 Method 1", "새 Method: 맨 뒤(지금)"),
           "partition을 선택하고 있어도 새 Method → 맨 뒤")]),
])

HTML = f"""<meta charset="utf-8">
<title>M93 분기 라벨 위 드롭과 새 다이어그램의 위치</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans+KR:wght@400;500;600&display=swap">
<style>{STYLE}</style>

<main>
  <div>
    <h1>M93 · 분기 라벨 위 드롭과 새 다이어그램의 위치</h1>
    <p class="lede">M91의 "추상화가 드러낸 칸" 가운데 남은 <b>U3</b>과 <b>U6</b>입니다. 조작 규칙의 미결정 사항 "분기 라벨과 드래그 앤 드롭" · "새 다이어그램의 위치"에 해당합니다. 한 번에 하나씩 여쭙니다(Q1 → Q2). 지금 모습은 0.6.3 코드(<code>input/drop.ts</code>, <code>core/commands/diagram.ts</code>)로 확인했습니다. 앱의 동작은 아직 바꾸지 않았습니다.</p>
  </div>

  <section>
    <p class="part">Q1 · U3</p>
    <h2>분기 라벨 위에 블록 아이콘을 놓으면 무엇이 대상인가요?</h2>
    <p class="q">키보드에서 분기 라벨은 <b>그 분기</b>입니다(삽입은 옆에 새 분기, 복사 · 감싸기는 그 분기의 블록 전체, 공통 규칙 T1). 드롭에서는 <b>그 If · Case 블록</b>이라, 툴바의 While 아이콘을 분기 라벨 2 위에 놓으면 Case 전체를 감쌉니다. 분기 라벨을 끌어 분기를 옮기는 것(U4)은 백로그로 미뤘으니 여기서는 놓는 쪽만 정합니다.</p>
    <div class="two">
      <figure><div class="scene">{u3_drag("case")}</div><figcaption><b>지금(3).</b> While 아이콘을 분기 라벨 2 위에 끌면 Case 전체에 미리보기 테두리.</figcaption></figure>
      <figure><div class="scene">{u3_drag("branch")}</div><figcaption><b>1 · 2.</b> 분기 2에만 미리보기 테두리. 파란 점선 = 미리보기, 녹색 = 드롭하면 새로 생기는 것.</figcaption></figure>
    </div>
    <div class="cards">
{U3_CARDS}
    </div>
    <div class="tw">
      <table>
        <tr><th>분기 라벨 위에 놓는 것</th><th>1</th><th>2</th><th>3 (지금)</th><th>견줄 키보드 조작</th></tr>
        <tr><td>제어 블록 아이콘(If · Case · While · For · 병렬 처리)</td><td>그 분기의 블록을 감쌈</td><td>그 분기의 블록을 감쌈</td><td>If · Case 전체를 감쌈</td><td>분기 라벨에서 감싸기 = 그 분기의 블록(BL1)</td></tr>
        <tr><td>처리 · 탈출 · 호출 아이콘</td><td>옆에 새 분기, 그 안에</td><td>If · Case 아래</td><td>If · Case 아래</td><td>분기 라벨에서 삽입 = 옆에 새 분기(Q5 · BL3)</td></tr>
        <tr><td>끌어 온 블록(이동)</td><td>옆에 새 분기, 그 안에</td><td>If · Case 위 · 아래</td><td>If · Case 위 · 아래</td><td>분기 라벨에서 붙여넣기 = 옆에 새 분기(BL2)</td></tr>
        <tr><td>If · Case 전체를 감싸는 곳</td><td>머리 칸 · 조건 칸</td><td>머리 칸 · 조건 칸</td><td>머리 칸 · 조건 칸 · 분기 라벨</td><td>If · Case 블록을 선택하고 감싸기</td></tr>
      </table>
    </div>
    <p class="q">추천은 <b>1</b>입니다. 같은 분기 라벨이 키보드와 드롭에서 같은 것을 가리키고(원칙 ③ · T1), 표 한 줄로 적힙니다. 2는 아이콘의 종류에 따라 라벨이 분기였다 블록이었다 합니다. 확신이 중간인 까닭: Case 전체를 감싸려던 사용자가 습관으로 분기 라벨 위에 놓으면 다른 결과가 나옵니다. 미리보기 테두리가 그 분기에만 그려져 놓기 전에 보입니다.</p>
  </section>

  <section>
    <p class="part">Q2 · U6</p>
    <h2>새 Event · Method 다이어그램은 어디에 놓을까요?</h2>
    <p class="q">지금 다이어그램을 만드는 길은 다섯입니다. <b>지금 다이어그램의 바로 뒤</b>: 붙여넣기, 새 Method로 빼기(XM1). <b>그 종류의 맨 뒤</b>: 메뉴의 새 Event · 새 Method, 호출 블록 목록의 "새 Method를 만들고 호출", "Method 만들기"(CB15). 어느 쪽이든 뷰포트는 새 다이어그램으로 스크롤하고 헤더 이름의 인라인 에디터가 열립니다. 그림: 왼쪽 Event, 오른쪽 Method(줄이 차면 오른쪽 줄로). 주황 = 선택한 헤더(<code>partition</code>), 녹색 = 새 다이어그램.</p>
    <div class="cards">
{U6_CARDS}
    </div>
    <div class="tw">
      <table>
        <tr><th>만드는 길</th><th>1</th><th>2</th><th>3 (지금)</th></tr>
        <tr><td>메뉴의 새 Event · 새 Method</td><td>바로 뒤</td><td>맨 뒤</td><td>맨 뒤</td></tr>
        <tr><td>"새 Method를 만들고 호출", "Method 만들기"</td><td>바로 뒤</td><td>바로 뒤</td><td>맨 뒤</td></tr>
        <tr><td>붙여넣기, 새 Method로 빼기</td><td>바로 뒤</td><td>바로 뒤</td><td>바로 뒤</td></tr>
        <tr><td>지금 다이어그램과 종류가 다를 때 · 선택한 것이 없을 때</td><td colspan="3">그 종류의 맨 뒤(셋 모두)</td></tr>
      </table>
    </div>
    <p class="q">추천은 <b>1</b>입니다. 만드는 길이 달라도 자리가 하나라 규칙이 한 줄이 되고(C2: 새 요소는 지금 요소의 곁), 흔한 도구의 "새 슬라이드 · 새 시트"와 같습니다. 2는 "지금 다이어그램에서 나온 것만 곁에"라는 기준이 분명하지만 자리가 둘로 남습니다. 3은 문서의 끝이 늘 새 다이어그램이라 찾기 쉬운 장점이 있습니다.</p>
  </section>
</main>
"""

(HERE / "2026-11-28-u3-u6-study.html").write_text(HTML, encoding="utf-8", newline="\n")
print("ok")
