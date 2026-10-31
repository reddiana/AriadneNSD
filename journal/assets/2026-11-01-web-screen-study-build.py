# 시안 M44(웹 화면 배치)를 만든다. 다이어그램 그림은 프로토타입 64번째 판이 그린 SVG(M43의 그림 묶음)를 그대로 쓴다
# 쓰는 법: python journal/assets/2026-11-01-web-screen-study-build.py
import json, pathlib, re

here = pathlib.Path(__file__).parent
S = json.loads((here / '2026-10-31-mvp-ux-questions-shots.json').read_text(encoding='utf-8'))

def diagram(name='q2-start'):
    s = S[name]['svg'].replace(' id="svg"', '')
    s = re.sub(r' data-[a-z]+="[^"]*"', '', s)
    s = re.sub(r'<rect x="[^"]*" y="[^"]*" width="[^"]*" height="[^"]*" fill="none" stroke="#d0500b"[^>]*></rect>', '', s)
    s = re.sub(r'width="[^"]+" height="[^"]+"', 'class="dg"', s, count=1)
    return s

DG = diagram()

# 작은 선 아이콘 (24 칸, 선 1.6)
I = {
 'new': '<path d="M6 3h8l4 4v14H6z M14 3v4h4"/>',
 'open': '<path d="M3 7h6l2 2h10v10H3z"/>',
 'save': '<path d="M5 4h11l3 3v13H5z M8 4v5h7V4 M8 20v-6h8v6"/>',
 'export': '<path d="M12 3v12 M7 8l5-5 5 5 M5 15v5h14v-5"/>',
 'recent': '<circle cx="12" cy="12" r="8"/><path d="M12 7v5l3 2"/>',
 'insert': '<rect x="4" y="4" width="16" height="16"/><path d="M12 8v8 M8 12h8"/>',
 'wrap': '<path d="M4 6h16v12H4z M8 9h8v6H8z"/>',
 'fold': '<path d="M5 6h14 M5 12h14 M5 18h14 M8 9l4-3 4 3"/>',
 'undo': '<path d="M9 7L4 12l5 5 M4 12h11a5 5 0 0 1 0 10h-2"/>',
 'redo': '<path d="M15 7l5 5-5 5 M20 12H9a5 5 0 0 0 0 10h2"/>',
 'zoom': '<circle cx="10" cy="10" r="6"/><path d="M15 15l5 5 M8 10h4 M10 8v4"/>',
 'gear': '<circle cx="12" cy="12" r="3"/><path d="M12 3v3 M12 18v3 M3 12h3 M18 12h3 M5.6 5.6l2.1 2.1 M16.3 16.3l2.1 2.1 M5.6 18.4l2.1-2.1 M16.3 7.7l2.1-2.1"/>',
 'help': '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .9-1 1.7v.5 M12 17.5v.5"/>',
 'menu': '<path d="M4 7h16 M4 12h16 M4 17h16"/>',
 'copy': '<path d="M8 8h11v12H8z M5 16V4h11"/>',
 'cut': '<circle cx="7" cy="17" r="3"/><circle cx="17" cy="17" r="3"/><path d="M9 15L18 4 M15 15L6 4"/>',
 'paste': '<path d="M7 5h10v16H7z M9 3h6v4H9z"/>',
}
def ic(k, size=18):
    return f'<svg class="ic" width="{size}" height="{size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">{I[k]}</svg>'

def flyout(title, rows, style):
    r = ''.join(f'<div class="fr"><span>{a}</span><kbd>{b}</kbd></div>' if a else '<hr>' for a, b in rows)
    return f'<div class="fly" style="{style}"><div class="ft">{title}</div>{r}</div>'
INSERT_ROWS = [('처리', 'o'), ('If', 'a i'), ('Case', 'a k'), ('While', 'a w'), ('For', 'a f'), ('Do-While', 'a d'), ('', ''), ('앞에 넣기', 'Shift')]

def status(text='예제.ns.svg · 저장됨 · 1분 전 자동 저장'):
    return f'<div class="st">{text}</div>'

# ---------- 넓은 화면 (1366 × 657, 노트북 브라우저의 보이는 칸) ----------
def screen_a():
    top = ''.join(ic(k) for k in ['new', 'open', 'save', 'export'])
    mid = ''.join(f'<span class="{"on" if k == "insert" else ""}">{ic(k)}</span>' for k in ['insert', 'wrap', 'fold', 'undo', 'redo', 'zoom'])
    bot = ''.join(ic(k) for k in ['gear', 'help'])
    return f'''<div class="scr a"><div class="rail"><div class="g">{top}</div><div class="g">{mid}</div><div class="g end">{bot}</div></div>
<div class="cv"><div class="fname">예제.ns.svg <small>저장됨</small></div><div class="paper">{DG}</div>
{flyout('블록 넣기', INSERT_ROWS, 'left:6px;top:118px')}</div></div>'''

def screen_b():
    menus = ''.join(f'<span class="{"on" if m == "넣기" else ""}">{m}</span>' for m in ['파일', '편집', '넣기', '보기', '도움말'])
    tools = ''.join(ic(k, 16) for k in ['new', 'open', 'save']) + '<i class="sep"></i>' + ''.join(ic(k, 16) for k in ['undo', 'redo']) + '<i class="sep"></i>' + ''.join(ic(k, 16) for k in ['cut', 'copy', 'paste']) + '<i class="sep"></i>' + ''.join(ic(k, 16) for k in ['insert', 'wrap', 'fold']) + '<i class="sep"></i>' + ic('zoom', 16)
    return f'''<div class="scr b"><div class="mbar"><b>AriadneNSD</b>{menus}<span class="fn">예제.ns.svg · 저장됨</span></div><div class="tbar">{tools}</div>
<div class="cv"><div class="paper">{DG}</div>{flyout('넣기', INSERT_ROWS, 'left:118px;top:0')}</div></div>'''

def screen_c():
    tabs = ''.join(f'<span class="{"on" if t == "홈" else ""}">{t}</span>' for t in ['파일', '홈', '넣기', '보기', '도움말'])
    def big(k, t): return f'<div class="big">{ic(k, 22)}<span>{t}</span></div>'
    def small(t, k): return f'<div class="sm">{ic(k, 13)}<span>{t}</span></div>'
    groups = [
        ('클립보드', big('paste', '붙이기') + f'<div class="col">{small("잘라내기", "cut")}{small("복사", "copy")}</div>'),
        ('블록', ''.join(f'<div class="blk">{t}</div>' for t in ['처리', 'If', 'Case', 'While', 'For', 'Do-While'])),
        ('묶기', big('wrap', '감싸기') + big('wrap', '풀기')),
        ('보기', big('fold', '접기') + big('zoom', '확대')),
    ]
    rib = ''.join(f'<div class="rg"><div class="rb">{b}</div><div class="rl">{t}</div></div>' for t, b in groups)
    return f'''<div class="scr c"><div class="tabs"><b>AriadneNSD</b>{tabs}<span class="fn">예제.ns.svg · 저장됨</span></div><div class="rib">{rib}</div>
<div class="cv"><div class="paper">{DG}</div></div></div>'''

def screen_d():
    groups = ['새로 · 열기 · SVG 보기 · 받기', '예제: 코드식 · 문장식 · Case · 퀵소트 · Raft · 더 보기', '뒤에 넣기: 처리 · If · Case · While · For · Do-While · 호출 · Event · Method',
              '감싸기: While · For · Do-While · If · Case · 풀기', '보기: 접기·펴기 · 접기 영역 만들기 · 풀기', '되돌리기 · 다시 · 지우기', '잘라내기 · 복사 · 붙여넣기']
    g = ''.join(f'<span>{x}</span>' for x in groups)
    return f'''<div class="scr d"><div class="pbar"><b>AriadneNSD</b>{g}</div><div class="pmain"><div class="cv"><div class="opts">구문 강조 · 고정폭 · 접기 영역 보기 · 머리 모양 · 결과 기호 · 키 안내 · − 100% +</div><div class="paper">{DG}</div></div>
<div class="side"><b>써 보는 법</b><p>h j k l … 키 표 …</p><p>이번에 바뀐 것 …</p></div></div><div class="pst">블록을 클릭해 보세요.</div></div>'''

# ---------- 휴대폰 폭 (390 × 700) ----------
def phone(kind):
    if kind == 'a':
        bar = ''.join(ic(k, 16) for k in ['menu', 'insert', 'undo', 'redo', 'help'])
        return f'<div class="ph"><div class="cvp"><div class="fname">예제.ns.svg</div><div class="paper">{DG}</div></div><div class="pbt">{bar}</div></div>'
    if kind == 'b':
        return f'<div class="ph"><div class="mbar">{ic("menu", 16)}<b>예제.ns.svg</b></div><div class="tbar">{"".join(ic(k, 14) for k in ["undo", "redo", "insert", "wrap"])}</div><div class="cvp"><div class="paper">{DG}</div></div></div>'
    if kind == 'c':
        return f'<div class="ph"><div class="tabs"><span class="on">홈</span><span>넣기</span><span>보기</span>…</div><div class="rib s"><div class="blk">처리</div><div class="blk">If</div><div class="blk">Case</div><div class="blk">While</div></div><div class="cvp"><div class="paper">{DG}</div></div></div>'
    return f'<div class="ph"><div class="pbar"><b>AriadneNSD</b><span class="btn">메뉴</span><span class="btn">안내</span></div><div class="cvp"><div class="paper">{DG}</div></div><div class="pst">Raft 예제 …</div></div>'

def card(tag, title, body, scr, ph, room, pick=False, ref=False, now=False):
    badges = ('<span class="badge">Claude의 추천</span>' if pick else '') + ('<span class="badge gray">지금 프로토타입</span>' if now else '')
    li = ''.join(f'<li>{b}</li>' for b in body)
    return f'''<article class="card{" pick" if pick else ""}{" ref" if ref else ""}"><header><span class="tag">{tag}</span><h3>{title}</h3>{badges}</header>
<div class="row"><div class="fig wide">{scr}</div><div class="fig narrow">{ph}</div></div>
<p class="room">{room}</p><ul>{li}</ul></article>'''

cards = [
 card('W1 · 1번', '왼쪽 아이콘 막대 (SequenceDiagram.org처럼)', [
   '왼쪽 끝 좁은 막대(폭 44px)에 아이콘을 세로로 둡니다: 위는 파일(새로 · 열기 · 저장 · 내보내기), 가운데는 편집(블록 넣기 · 감싸기 · 접기 · 되돌리기 · 다시 · 확대), 아래는 설정 · 도움말.',
   '아이콘을 누르면 옆에 펼침 메뉴가 열리고, 명령 이름과 <b>키</b>가 함께 보입니다(그림: 블록 넣기). 마우스로 쓰다 보면 키를 익히게 됩니다.',
   '파일 이름과 저장 상태는 캔버스 왼쪽 위에 작게 떠 있습니다.',
   '휴대폰에서는 막대가 화면 아래로 내려가 엄지로 누릅니다(MB1 "화면은 다이어그램에게").',
   '<span class="bad">아이콘만으로는 뜻을 짐작하기 어렵습니다. 마우스를 올리면 이름이 뜨지만 처음엔 하나씩 눌러 봐야 합니다.</span>'],
   screen_a(), phone('a'), '다이어그램에 남는 칸: <b>1322 × 657</b> (가로 97% · 세로 100%)', pick=True),
 card('W1 · 2번', '위 메뉴 막대 + 아이콘 도구 모음 (draw.io처럼)', [
   '맨 위에 글자 메뉴(파일 · 편집 · 넣기 · 보기 · 도움말), 그 아래에 자주 쓰는 명령의 아이콘 줄. 데스크톱 프로그램과 같아 처음 온 사람이 가장 쉽게 찾습니다.',
   '메뉴에도 명령 이름과 키가 함께 보입니다(그림: 넣기).',
   '파일 이름과 저장 상태는 메뉴 줄 오른쪽에.',
   '휴대폰에서는 메뉴가 ☰ 하나로 접힙니다.',
   '<span class="bad">위로 두 줄(약 72px)을 늘 차지해 그림이 그만큼 낮아집니다. 같은 명령이 메뉴와 아이콘 줄에 두 번 있습니다.</span>'],
   screen_b(), phone('b'), '다이어그램에 남는 칸: <b>1366 × 585</b> (가로 100% · 세로 89%)'),
 card('W1 · 3번', '리본 (Office처럼)', [
   '탭(파일 · 홈 · 넣기 · 보기 · 도움말)을 고르면 아래에 큰 단추 묶음이 나옵니다. 블록 여섯이 이름 그대로 단추로 보여 가장 눈에 띕니다.',
   '<span class="bad">리본은 명령이 수백 개인 프로그램을 위한 것입니다. 우리 명령은 서른 남짓이라 탭마다 빈 곳이 많고, 위로 약 120px을 차지합니다.</span>',
   '<span class="bad">휴대폰에서 리본은 한 줄로 줄여도 자리를 많이 씁니다.</span>'],
   screen_c(), phone('c'), '다이어그램에 남는 칸: <b>1366 × 537</b> (가로 100% · 세로 82%)'),
 card('참고', '지금 프로토타입 (65번째 판)', [
   '단추 묶음이 위에 여러 줄로 감기고, 오른쪽에 안내 패널(340px), 캔버스 위에 설정 줄, 아래에 상태 줄이 있습니다. 요구사항을 점검하려고 모든 명령을 꺼내 둔 모습입니다.',
   '제품에서는 이 가운데 무엇을 남길지 고릅니다. 예제 단추와 안내 패널은 제품에 없습니다.'],
   screen_d(), phone('d'), '다이어그램에 남는 칸: <b>1026 × 487</b> (가로 75% · 세로 74%)', ref=True, now=True),
]

page = f'''<title>M44 웹 화면 배치</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans+KR:wght@400;500;600&display=swap">
<style>
/* M43과 같은 틀. 화면 그림은 HTML로 그렸고, 그 안의 다이어그램은 프로토타입이 그린 SVG 그대로 (만드는 스크립트 2026-11-01-web-screen-study-build.py) */
:root {{
  --bg: #eef1f6; --panel: #ffffff; --fg: #1c2230; --muted: #5a6476; --line: #d4dbe6;
  --accent: #2c55c9; --pick: #1d7a46; --pick-soft: #e3f3e8; --warn: #a8501a; --box: #f5f7fb;
  --font: 'IBM Plex Sans KR', 'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif;
  --mono: 'IBM Plex Mono', 'IBM Plex Sans KR', Consolas, monospace;
  /* 화면 그림 안의 색: 편집기 화면은 밝은 테마로 고정해 그린다 */
  --ui-bg: #eef1f6; --ui-panel: #ffffff; --ui-line: #d4dbe6; --ui-fg: #1c2230; --ui-muted: #5a6476; --ui-acc: #2c55c9; --ui-acc-soft: #e4eafb;
}}
@media (prefers-color-scheme: dark) {{
  :root:not([data-theme="light"]) {{ --bg: #12151b; --panel: #1a1e26; --fg: #e5e8ee; --muted: #9aa3b3; --line: #2b313c; --accent: #8ba7ff; --pick: #6fd197; --pick-soft: #1b3326; --warn: #f0a46c; --box: #222833; color-scheme: dark; }}
}}
:root[data-theme="dark"] {{ --bg: #12151b; --panel: #1a1e26; --fg: #e5e8ee; --muted: #9aa3b3; --line: #2b313c; --accent: #8ba7ff; --pick: #6fd197; --pick-soft: #1b3326; --warn: #f0a46c; --box: #222833; color-scheme: dark; }}
* {{ box-sizing: border-box; }}
body {{ background: var(--bg); color: var(--fg); font-family: var(--font); font-size: 15px; line-height: 1.65; padding-block: 28px 56px; padding-left: max(16px, env(safe-area-inset-left, 0px)); padding-right: max(16px, env(safe-area-inset-right, 0px)); }}
main {{ max-width: 1240px; margin-inline: auto; display: grid; gap: 40px; }}
h1 {{ font-size: 26px; font-weight: 600; margin: 0 0 8px; letter-spacing: -.01em; text-wrap: balance; }}
h2 {{ font-size: 19px; font-weight: 600; margin: 0 0 4px; }}
h3 {{ font-size: 15px; font-weight: 600; margin: 0; }}
p {{ margin: 0; }}
.lede, .q {{ color: var(--muted); max-width: 86ch; }}
.lede b, .q b {{ color: var(--fg); font-weight: 600; }}
section {{ display: grid; gap: 14px; min-width: 0; }}
.part {{ font-family: var(--mono); font-size: 12px; font-weight: 600; color: var(--accent); letter-spacing: .04em; }}
.cards {{ display: grid; gap: 16px; }}
.card {{ background: var(--panel); border: 1px solid var(--line); border-radius: 8px; padding: 16px; display: grid; gap: 10px; min-width: 0; }}
.card.pick {{ border-color: var(--pick); box-shadow: inset 0 0 0 1px var(--pick); }}
.card.ref {{ border-style: dashed; }}
.card header {{ display: flex; flex-wrap: wrap; gap: 6px 10px; align-items: baseline; }}
.tag {{ font-family: var(--mono); font-size: 12px; font-weight: 600; color: var(--accent); }}
.badge {{ font-size: 11.5px; font-weight: 600; color: var(--pick); background: var(--pick-soft); border-radius: 999px; padding: 1px 9px; }}
.badge.gray {{ color: var(--muted); background: var(--bg); }}
.card ul {{ margin: 0; padding-left: 1.2em; font-size: 13.5px; color: var(--muted); display: grid; gap: 4px; max-width: 110ch; }}
.card li b, .room b {{ color: var(--fg); font-weight: 600; }}
.room {{ font-size: 13.5px; font-family: var(--mono); color: var(--muted); }}
.bad {{ color: var(--warn); font-weight: 600; }}
.note {{ font-size: 13.5px; color: var(--muted); border-left: 3px solid var(--line); padding-left: 12px; max-width: 90ch; }}
.sum {{ background: var(--panel); border: 1px solid var(--line); border-left: 4px solid var(--accent); border-radius: 0 8px 8px 0; padding: 14px 18px; display: grid; gap: 8px; max-width: 90ch; }}
.sum ol {{ margin: 0; padding-left: 1.3em; display: grid; gap: 5px; font-size: 14px; }}
code, kbd {{ font-family: var(--mono); font-size: 12.5px; }}
.row {{ display: flex; gap: 14px; align-items: flex-start; overflow-x: auto; }}
.fig {{ flex: none; border: 1px solid var(--line); border-radius: 6px; background: var(--box); padding: 8px; }}
.fig.wide .scr {{ width: 683px; height: 329px; }}
.fig.narrow .ph {{ width: 156px; height: 329px; }}

/* ---------- 화면 그림 (1366 × 657을 절반으로) ---------- */
.scr, .ph {{ position: relative; overflow: hidden; background: var(--ui-bg); color: var(--ui-fg); font-family: var(--font); font-size: 7px; line-height: 1.3; border: 1px solid #b9c3d3; border-radius: 4px; display: flex; flex-direction: column; }}
.scr .ic, .ph .ic {{ display: block; color: #3a4456; }}
.cv, .cvp {{ position: relative; flex: 1; min-height: 0; background-image: radial-gradient(#d3d9e4 .6px, transparent .6px); background-size: 9px 9px; padding: 14px; overflow: hidden; }}
.paper {{ background: #fff; border-radius: 2px; box-shadow: 0 1px 2px rgba(20,30,60,.15); display: inline-block; padding: 4px; }}
.paper .dg {{ display: block; width: 250px; height: auto; }}
.ph .paper .dg {{ width: 130px; }}
.fname {{ font-size: 7.5px; font-weight: 600; margin-bottom: 6px; }}
.fname small {{ font-weight: 400; color: var(--ui-muted); }}
.fly {{ position: absolute; z-index: 3; background: #fff; border: 1px solid var(--ui-line); border-radius: 3px; box-shadow: 0 4px 10px rgba(0,0,0,.15); padding: 3px; width: 92px; }}
.fly .ft {{ font-weight: 600; padding: 1px 4px 3px; color: var(--ui-muted); }}
.fly .fr {{ display: flex; justify-content: space-between; padding: 1.5px 4px; }}
.fly .fr kbd {{ font-size: 6.5px; color: var(--ui-muted); }}
.fly hr {{ border: 0; border-top: 1px solid var(--ui-line); margin: 2px 0; }}
/* 1번 */
.scr.a {{ flex-direction: row; }}
.a .rail {{ width: 22px; background: #fff; border-right: 1px solid var(--ui-line); display: flex; flex-direction: column; align-items: center; padding: 6px 0; gap: 10px; }}
.a .rail .g {{ display: grid; gap: 6px; justify-items: center; }}
.a .rail .g.end {{ margin-top: auto; }}
.a .rail .ic {{ width: 12px; height: 12px; }}
.a .rail .on {{ background: var(--ui-acc-soft); border-radius: 3px; padding: 2px; margin: -2px; color: var(--ui-acc); }}
.a .fly {{ left: 2px !important; }}
.ph .pbt {{ height: 30px; background: #fff; border-top: 1px solid var(--ui-line); display: flex; justify-content: space-around; align-items: center; }}
/* 2번 */
.b .mbar {{ height: 16px; background: #fff; display: flex; gap: 10px; align-items: center; padding: 0 8px; border-bottom: 1px solid var(--ui-line); }}
.b .mbar .on {{ background: var(--ui-acc-soft); color: var(--ui-acc); padding: 1px 3px; border-radius: 2px; }}
.mbar .fn, .tabs .fn {{ margin-left: auto; color: var(--ui-muted); }}
.b .tbar, .ph .tbar {{ height: 20px; background: #fff; display: flex; gap: 6px; align-items: center; padding: 0 8px; border-bottom: 1px solid var(--ui-line); }}
.tbar .ic {{ width: 10px; height: 10px; }}
.sep {{ width: 1px; height: 11px; background: var(--ui-line); }}
.ph .mbar {{ height: 18px; background: #fff; display: flex; gap: 6px; align-items: center; padding: 0 6px; border-bottom: 1px solid var(--ui-line); }}
/* 3번 */
.tabs {{ height: 14px; background: #fff; display: flex; gap: 10px; align-items: flex-end; padding: 0 8px; }}
.tabs span {{ padding: 1px 4px; }}
.tabs .on {{ border: 1px solid var(--ui-line); border-bottom-color: #f7f9fc; background: #f7f9fc; border-radius: 2px 2px 0 0; color: var(--ui-acc); }}
.rib {{ height: 46px; background: #f7f9fc; border-top: 1px solid var(--ui-line); border-bottom: 1px solid var(--ui-line); display: flex; padding: 3px 6px; gap: 0; }}
.rib.s {{ height: 22px; gap: 3px; align-items: center; }}
.rg {{ display: flex; flex-direction: column; border-right: 1px solid var(--ui-line); padding: 0 6px; }}
.rb {{ flex: 1; display: flex; gap: 4px; align-items: center; flex-wrap: wrap; max-width: 150px; }}
.rl {{ text-align: center; color: var(--ui-muted); font-size: 6px; }}
.big {{ display: grid; justify-items: center; gap: 1px; font-size: 6.5px; }}
.big .ic {{ width: 14px; height: 14px; }}
.sm {{ display: flex; gap: 2px; align-items: center; font-size: 6px; }}
.sm .ic {{ width: 8px; height: 8px; }}
.col {{ display: grid; gap: 2px; }}
.blk {{ border: 1px solid var(--ui-line); background: #fff; border-radius: 2px; padding: 1px 4px; font-size: 6.5px; }}
/* 참고: 지금 프로토타입 */
.d .pbar, .ph .pbar {{ background: #fff; border-bottom: 1px solid var(--ui-line); display: flex; flex-wrap: wrap; gap: 3px 8px; padding: 4px 6px; align-items: center; }}
.d .pbar span {{ border: 1px solid var(--ui-line); border-radius: 2px; padding: 0 3px; font-size: 6.2px; }}
.ph .pbar .btn {{ border: 1px solid var(--ui-line); border-radius: 2px; padding: 0 3px; margin-left: auto; }}
.ph .pbar .btn + .btn {{ margin-left: 0; }}
.pmain {{ flex: 1; display: flex; min-height: 0; }}
.d .side {{ width: 170px; background: #fff; border-left: 1px solid var(--ui-line); padding: 6px; color: var(--ui-muted); }}
.d .side b {{ color: var(--ui-fg); }}
.opts {{ background: #fff; border: 1px solid var(--ui-line); border-radius: 3px; padding: 2px 5px; margin-bottom: 6px; width: fit-content; font-size: 6.3px; }}
.pst {{ height: 15px; background: #fff; border-top: 1px solid var(--ui-line); padding: 2px 8px; color: var(--ui-muted); }}
</style>
<main>
  <div>
    <h1>M44 · 웹 화면 배치</h1>
    <p class="lede">웹 버전(MVP)의 화면을 설계합니다. 이 시안은 첫 물음 <b>W1. 화면 전체의 배치</b>만 묻습니다. 배치가 정해지면 같은 그림 위에서 블록 넣기의 자리(W2), 파일 이름 · 저장 상태 · 최근 파일(W3), 도움말(W4), 설정(W5)을 차례로 묻습니다. 그림 속 다이어그램은 프로토타입이 그린 그림 그대로이고, 화면은 노트북 브라우저의 보이는 칸(1366 × 657)을 절반으로 줄여 그렸습니다. 오른쪽 작은 그림은 휴대폰(폭 390px)입니다.</p>
  </div>
  <section>
    <span class="part">W1</span>
    <h2>W1. 화면 전체의 배치</h2>
    <p class="q">본보기는 <a href="https://sequencediagram.org/">SequenceDiagram.org</a>입니다(메인테이너, 2026-10-25). 그곳은 왼쪽 끝에 작은 아이콘이 세로로 늘어서고, 아이콘을 누르면 메뉴가 펼쳐집니다(Claude의 기억. 안내 페이지에 화면 배치가 적혀 있지 않아 확인하지 못함). 명령은 모두 한 목록(명령 레지스트리, ADR-0033)에서 나오므로, 어느 안이든 메뉴 · 아이콘 · 오른쪽 클릭 메뉴가 같은 명령을 보여 줍니다. 판단 기준은 UX 원칙의 <b>"화면은 다이어그램에게"</b>(MB1), <b>"키보드만으로 모두"</b>, 그리고 처음 온 사람이 명령을 찾을 수 있는가입니다.</p>
    <div class="cards">{"".join(cards)}</div>
    <p class="note">어느 안이든 공통: 오른쪽 클릭 메뉴는 지금처럼 있고, 메뉴에는 명령 이름 옆에 키가 보입니다. 화면 아래의 상태 줄(고른 것, 알림)은 W3에서 함께 묻습니다. 광고(R-WEB-08, MVP 밖)는 저장 · 내보내기 때만 보이므로 이 배치에 자리를 두지 않습니다.</p>
  </section>
  <section>
    <h2>답하실 것</h2>
    <div class="sum"><ol>
      <li>W1의 <b>번호</b>, 또는 고칠 점(섞기도 됩니다. 예: "1번인데 파일 이름은 위에 줄로").</li>
      <li>정하면 같은 배치 위에 W2(블록 넣기) 그림을 그려 이어서 묻습니다.</li>
    </ol></div>
  </section>
</main>
<footer data-license-note style="max-width:1240px;margin:32px auto 0;padding:14px 20px 40px;font-size:13px;line-height:1.6;opacity:.8;border-top:1px solid currentColor">이 페이지는 <a href="https://github.com/reddiana/AriadneNSD" style="color:inherit">AriadneNSD</a>의 시안입니다. 글과 그림은 <a href="https://creativecommons.org/licenses/by/4.0/deed.ko" style="color:inherit">CC BY 4.0</a>으로 공개합니다. 출처를 "AriadneNSD (https://github.com/reddiana/AriadneNSD)"로 밝히면 옮기거나 고쳐 쓸 수 있습니다. <span lang="en">A design study from the AriadneNSD project. Text and figures are licensed under CC BY 4.0.</span></footer>
'''
(here / '2026-11-01-web-screen-study.html').write_text(page, encoding='utf-8', newline='\n')
print('ok', len(page))
