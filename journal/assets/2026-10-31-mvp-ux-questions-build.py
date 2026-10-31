# 시안 M43(MVP 전에 정할 조작 물음) 페이지를 만든다
# 그림은 2026-10-31-mvp-ux-questions-shots.mjs가 프로토타입 64번째 판에서 뽑은 JSON을 쓴다
# 쓰는 법: python journal/assets/2026-10-31-mvp-ux-questions-build.py
import json, pathlib, re, html

here = pathlib.Path(__file__).parent
S = json.loads((here / '2026-10-31-mvp-ux-questions-shots.json').read_text(encoding='utf-8'))
SEL = '#d0500b'   # 고른 표시와 고치는 칸의 주황 (시각 디자인 명세)

def fig(name, nosel=False, extra='', crop=None):
    """프로토타입의 SVG에 고치는 칸 · 표시할 상자를 덧그린다. nosel이면 고른 표시를 지운다.
    crop='left' | 'right': 퀵소트처럼 다이어그램이 둘이면 물음에 필요한 쪽만 보인다(둘째 다이어그램의 왼쪽 끝에서 가른다)"""
    v = S[name]
    s = v['svg']
    vb = [float(x) for x in re.search(r'viewBox="([^"]+)"', s).group(1).split()]
    if crop:
        heads = [float(x) for x in re.findall(r'<path d="M ([\d.]+) [\d.]+ C', s)]
        cut = sorted(set(heads))[1] - 12
        vb = [0, 0, cut, vb[3]] if crop == 'left' else [cut, 0, vb[2] - cut, vb[3]]
    s = re.sub(r'viewBox="[^"]+" width="[^"]+" height="[^"]+"', f'viewBox="{vb[0]} {vb[1]} {vb[2]} {vb[3]}" style="width:100%;max-width:{vb[2]:.0f}px;height:auto"', s)
    s = s.replace(' id="svg"', '')
    s = re.sub(r' data-[a-z]+="[^"]*"', '', s)   # 편집용 속성은 그림에 필요 없음
    if nosel:
        s = re.sub(r'<rect x="[^"]*" y="[^"]*" width="[^"]*" height="[^"]*" fill="none" stroke="#d0500b"[^>]*></rect>', '', s)
    over = ''
    for m in v['marks']:
        over += f'<rect x="{m["x"]-1.5:.1f}" y="{m["y"]-1.5:.1f}" width="{m["w"]+3:.1f}" height="{m["h"]+3:.1f}" fill="none" stroke="{SEL}" stroke-width="3"/>'
    e = v['editor']
    if e:
        over += (f'<rect x="{e["x"]+1:.1f}" y="{e["y"]+1:.1f}" width="{e["w"]-2:.1f}" height="{e["h"]-2:.1f}" fill="#ffffff" stroke="{SEL}" stroke-width="2" rx="2"/>'
                 f'<text x="{e["x"]+8:.1f}" y="{e["y"]+e["h"]/2+5:.1f}" font-family="IBM Plex Mono, IBM Plex Sans KR, monospace" font-size="13" fill="#151a22">{html.escape(e["value"])}</text>'
                 f'<line x1="{e["x"]+8+len(e["value"])*13:.1f}" y1="{e["y"]+7:.1f}" x2="{e["x"]+8+len(e["value"])*13:.1f}" y2="{e["y"]+e["h"]-7:.1f}" stroke="#151a22" stroke-width="1.2"/>')
    s = s.replace('</svg>', over + extra + '</svg>')
    return f'<div class="fig">{s}</div>'

def card(tag, title, body, figs, pick=False, now=False, ref=False):
    badges = ''
    if pick: badges += '<span class="badge">Claude의 추천</span>'
    if now: badges += '<span class="badge gray">지금 64번째 판</span>'
    cls = 'card' + (' pick' if pick else '') + (' ref' if ref else '')
    items = ''.join(f'<li>{b}</li>' for b in body)
    return f'<article class="{cls}"><header><span class="tag">{tag}</span><h3>{title}</h3>{badges}</header>{"".join(figs)}<ul>{items}</ul></article>'

def cap(text):
    return f'<p class="cap">{text}</p>'

def section(qid, title, q, cards, note=''):
    return (f'<section id="{re.sub(r"[^a-z0-9]+", "-", qid.lower()).strip("-")}"><span class="part">{qid}</span><h2>{title}</h2><p class="q">{q}</p>'
            f'<div class="cards">{"".join(cards)}</div>{note}</section>')

K = lambda *ks: ' '.join(f'<kbd>{k}</kbd>' for k in ks)
secs = []

# ---------- Q1 · Q2 ----------
secs.append(section('Q1 · Q2', 'Q1 · Q2. 고치기를 시작하는 방법과 더블클릭',
  f'<b>Q1은 확인만 받으면 됩니다.</b> 64번째 판에서는 글자가 있는 것(블록 글자, 머리의 이름, 호출 블록의 인자와 결과, 접기 영역의 이름)을 모두 {K("i")} {K("cc")} {K("Enter")} {K("F2")}로 똑같이 고칩니다. 다른 곳은 <b>더블클릭</b> 하나입니다: 접힌 칸을 더블클릭하면 이름을 고치지 않고 <b>펼칩니다</b>. 이름 띠를 더블클릭하면 접습니다. <b>Q2: 더블클릭을 어디서나 "고치기"로 맞출까요?</b> 장면: 접힌 칸 "로그 남기기"를 고르고 더블클릭.',
  [card('지금 장면', '접힌 칸 "로그 남기기"를 고름', ['이 칸을 더블클릭합니다.'], [fig('q2-start')], ref=True),
   card('Q2 · 1번', '더블클릭은 어디서나 고치기', [
      '이름을 고치는 칸이 열립니다(블록과 같음). 그림은 지금의 <kbd>Enter</kbd>와 같은 결과입니다.',
      '펴려면 접기 · 펴기 명령(<kbd>za</kbd> · <kbd>f</kbd>)을 쓰거나, 칸 왼쪽에 새로 그릴 작은 세모(▸)를 한 번 누릅니다. 이름 띠도 같습니다: 더블클릭은 이름 고치기, 세모(▾)는 접기.',
      '세모는 편집할 때만 보이는 표시라 저장되는 그림에는 들어가지 않습니다.',
      '"더블클릭 = <kbd>Enter</kbd>"가 어디서나 맞습니다. 이름을 고치려다 펼쳐 버리는 일이 없습니다.'],
      [fig('q2-opt1')], pick=True),
   card('Q2 · 2번', '접힌 것에서는 더블클릭이 펴기 · 접기', [
      '칸이 펼쳐집니다. 이름은 <kbd>Enter</kbd>나 <kbd>i</kbd>로 고칩니다.',
      '접힌 것을 펴는 마우스 동작이 하나로 빠릅니다(세모를 겨누지 않아도 됨).',
      '<span class="bad">더블클릭의 뜻이 곳에 따라 셋(고치기 · 펴기 · 접기)입니다.</span>'],
      [fig('q2-opt2')], now=True)]))

# ---------- Q4 ----------
secs.append(section('Q4', 'Q4. 비울 수 없는 칸을 비웠을 때',
  '머리 <code>partition(a, lo, hi)</code>의 이름을 고치다가 글자를 모두 지우고 <kbd>Enter</kbd>를 눌렀습니다. 머리의 이름은 비울 수 없습니다. 다른 비울 수 없는 칸은 이미 기본 글자로 돌아갑니다: 호출 블록의 인자(머리의 괄호 안 글자), 접기 영역의 이름(기본 이름). <b>머리의 이름도 같은 규칙으로 할까요?</b> 이름이 <b>겹칠 때</b> 칸을 다시 여는 것은 두 안 모두 그대로입니다.',
  [card('지금 장면', '이름을 다 지우고 Enter', ['고치는 칸이 비어 있습니다.'], [fig('q4-start', crop='right')], ref=True),
   card('Q4 · 1번', '고치기 전의 이름으로 돌아가고 칸이 닫힘', [
      '머리는 <code>partition(a, lo, hi)</code>로 남고, 상태 줄에 "이름은 비울 수 없어 고치기 전 이름으로 두었습니다"라고 알립니다.',
      '비울 수 없는 칸은 어디서나 "기본 글자로 돌아간다" 한 규칙이 됩니다.',
      '<kbd>Esc</kbd>와 같은 결과라 손이 덜 갑니다.'],
      [fig('q4-opt1', crop='right')], pick=True),
   card('Q4 · 2번', '받아들이지 않고 칸을 다시 엶', [
      '빈 칸이 다시 열리고 "머리의 이름은 비울 수 없습니다 (Esc: 그만두기)"라고 알립니다. 이름을 적거나 <kbd>Esc</kbd>를 눌러야 나옵니다.',
      '<span class="bad">다른 비울 수 없는 칸과 규칙이 다릅니다.</span>'],
      [fig('q4-opt2', crop='right')], now=True)]))

# ---------- Q6 ----------
secs.append(section('Q6', 'Q6. 순서 바꾸기를 명령 하나로',
  f'순서를 바꾸는 일이 넷입니다: 블록, Case의 갈래, If의 참 · 거짓, 다이어그램(같은 종류 안에서). 지금 블록은 잘라내고 붙이기({K("dd")} {K("p")})로만 옮기고, 갈래와 다이어그램은 키보드로 옮길 수 없습니다(요구사항 R-EDIT-11 · R-EDIT-18, 키보드만으로 모두 R-NFR-05). <b>"옮기기" 명령 하나로 묶을까요?</b>',
  [card('지금 장면 ①', '블록 "i = lo - 1;"을 고름', ['위로 한 칸 옮기려 합니다.'], [fig('q6-start', crop='right')], ref=True),
   card('Q6 · 1번', '"옮기기" 하나: <kbd>Alt</kbd>+방향키', [
      '<b>블록:</b> <kbd>Alt</kbd>+<kbd>↑</kbd> <kbd>↓</kbd>(또는 <kbd>Alt</kbd>+<kbd>k</kbd> <kbd>j</kbd>)로 바로 위 · 아래 블록과 자리를 바꿉니다. 줄의 끝에서 더 옮기면 제어 블록 밖으로 나옵니다. 옆 제어 블록 <b>안으로</b> 들어가지는 않습니다(그건 잘라내고 붙이기).',
      '<b>갈래:</b> If · Case 안에서 <kbd>Alt</kbd>+<kbd>←</kbd> <kbd>→</kbd>는 지금 갈래를 옆 갈래와 통째로 맞바꿉니다(아래 그림 ②). Case의 default는 늘 맨 끝이라 움직이지 않습니다.',
      '<b>머리:</b> 머리를 골랐으면 다이어그램의 순서를 바꿉니다.',
      'VS Code의 줄 옮기기(<kbd>Alt</kbd>+<kbd>↑</kbd> <kbd>↓</kbd>)와 같은 손입니다. 끌어 놓기는 같은 일을 마우스로 하는 방법이 됩니다.'],
      [cap('① 블록을 위로: 결과'), fig('q6-opt1-block', crop='right'), cap('② Case 갈래 CMD_STOP을 왼쪽으로(그 갈래의 <code>motor_off();</code>를 고른 채 <kbd>Alt</kbd>+<kbd>←</kbd>): 전과 후'), fig('q6-case-start'), fig('q6-opt1-lane')], pick=True),
   card('Q6 · 2번', '블록은 잘라내고 붙이기, 갈래와 다이어그램은 명령 따로', [
      '블록은 지금처럼 <kbd>dd</kbd> <kbd>p</kbd>(한 칸 아래), <kbd>dd</kbd> <kbd>k</kbd> <kbd>P</kbd>(한 칸 위)로 옮깁니다.',
      '갈래 맞바꾸기와 다이어그램 순서 바꾸기는 각각 메뉴 명령을 둡니다(키는 따로 정함).',
      '<span class="bad">같은 "옮기기"가 대상마다 방법이 다릅니다. 갈래를 키보드로 옮기려면 키가 더 늘어납니다.</span>'],
      [cap('그림은 지금 장면 ①과 같음(블록을 고른 채로 아무 일도 없음)'), fig('q6-start', crop='right')], now=True)],
  '<p class="note">If의 참 · 거짓을 맞바꿀 때 조건 글자를 뒤집을지(<code>lo &lt; hi</code> → <code>!(lo &lt; hi)</code>)는 이 물음에 넣지 않았습니다. 1번이면 갈래만 맞바꾸고 조건 글자는 사용자가 고칩니다(그림을 보고 바로 알 수 있도록 상태 줄에 알림).</p>'))

# ---------- Q10 (Q5 포함) ----------
secs.append(section('Q10 · Q5', 'Q10의 남은 것과 Q5. 갈래의 이름을 고르기, 갈래 넣고 지우기',
  f'갈래의 이름도 고를 수 있게 하기로 2026-10-13에 정했습니다(Q10 · 2번). 남은 세부가 셋이고, 셋째가 Q5(갈래를 앞에 넣는 방법)의 답이 됩니다. 그림의 주황 테두리는 "갈래 이름을 고른 모습"(지금은 없음)입니다. 지금은 갈래 이름을 {K("Shift")}+{K("L")}이나 더블클릭으로 고치고, 갈래는 {K("+")} {K("-")}로 넣고 뺍니다.',
  [card('Q10-a · 1번', 'If의 "참" · "거짓"도 고를 수 있음', [
      'Case와 같은 규칙입니다. 고르고 <kbd>i</kbd> · <kbd>Enter</kbd>로 이름을 고칩니다(비우면 "참" · "거짓"으로 돌아감).',
      'If에는 갈래를 넣거나 지울 수 없으니(Case로 바꿀지 물음), 고르는 것은 이름을 고칠 때뿐입니다.'],
      [fig('q10-if', crop='left')], pick=True),
   card('Q10-a · 2번', 'Case의 갈래 이름만 고를 수 있음', [
      'If의 이름은 지금처럼 <kbd>Shift</kbd>+<kbd>L</kbd>이나 더블클릭으로만 고칩니다.',
      '<span class="bad">If와 Case에서 이름을 고치는 방법이 다릅니다.</span>'],
      [fig('q10-case')]),
   card('Q10-b · 1번', '키보드로 가는 길: 갈래의 첫 블록에서 <kbd>k</kbd>', [
      '갈래의 첫 블록에서 <kbd>k</kbd>(↑)를 누르면 그 갈래의 이름을 고르고, 한 번 더 누르면 If · Case 블록을 고릅니다. 내려갈 때(<kbd>j</kbd>)는 멈추지 않습니다.',
      '그림: Case 위의 블록 <code>cmd = uart_read();</code>에서 <kbd>j</kbd>를 누르면 지금처럼 Case를 고르고, 갈래 CMD_START의 첫 블록 <code>motor_on();</code>에서 <kbd>k</kbd>를 누르면 갈래 이름 CMD_START를 고릅니다.',
      '마우스로는 갈래 이름을 누르면 고릅니다.'],
      [fig('q10-pass')], pick=True),
   card('Q10-b · 2번', '위아래로는 멈추지 않음', [
      '갈래 이름은 마우스로 누르거나 <kbd>Shift</kbd>+<kbd>L</kbd>로만 고릅니다.',
      '<span class="bad">키보드만으로는 갈래 이름을 고를 수 없어, 갈래를 넣고 지우는 데 갈래 전용 키가 남아야 합니다.</span>'],
      [fig('q10-case')]),
   card('Q10-c · 1번 (Q5)', '갈래 이름을 고르고 블록과 같은 키: <kbd>o</kbd> <kbd>O</kbd> <kbd>x</kbd>', [
      '갈래 이름을 고른 채 <kbd>o</kbd>는 <b>뒤에</b>, <kbd>O</kbd>는 <b>앞에</b> 새 갈래를 넣습니다. 블록의 "뒤에, <kbd>Shift</kbd>는 앞에"(R3)와 같습니다. 그래서 첫 갈래 앞에도 넣을 수 있습니다(Q5).',
      '<kbd>x</kbd> · <kbd>Delete</kbd>는 그 갈래를 지웁니다(안의 블록도 함께. Case에 갈래가 하나만 남으면 If로 바꿀지 물음은 그대로).',
      '<kbd>+</kbd> <kbd>-</kbd>는 없앱니다. 갈래 전용 키를 외우지 않아도 됩니다.',
      '그림: 첫 갈래 이름 CMD_START를 고르고 <kbd>O</kbd>를 누른 결과(새 갈래 "4"가 맨 앞).'],
      [fig('q5-before')], pick=True),
   card('Q10-c · 2번', '<kbd>+</kbd> <kbd>-</kbd>를 그대로 (뒤에만 넣음)', [
      '갈래 안의 블록을 고르고 <kbd>+</kbd>를 누르면 지금 갈래 <b>뒤에</b> 넣습니다. 앞에 넣는 키는 없습니다. 첫 갈래 앞에 넣으려면 넣고 옮깁니다(Q6).',
      '그림: 갈래 CMD_START의 <code>motor_on();</code>을 고르고 <kbd>+</kbd>를 누른 결과(새 갈래 "4"가 둘째).'],
      [fig('q5-now')], now=True)]))

# ---------- Q8 ----------
secs.append(section('Q8', 'Q8. 고른 것을 담은 것에 듣는 명령',
  f'접기 영역 "센서 읽기" 안의 블록 <code>adc_start(CH0);</code>을 골랐습니다(주황 상자는 그 접기 영역의 이름 띠). 이 상태에서 {K("zd")}(접기 영역 풀기)를 누르면 지금은 <b>그 블록을 담은 접기 영역</b>이 풀립니다. {K("za")}(접기 · 펴기)와 {K("ds")}(풀기)도 같습니다: 고른 것을 담은 가장 가까운 것에 듣습니다. 처음(2026-10-11)의 추천은 "보기만 바꾸는 명령만 찾아 올라가고, 내용을 바꾸는 명령(<kbd>zd</kbd> · <kbd>ds</kbd>)은 고른 것에만"이었습니다. 그 뒤 키를 Vim에 맞추며 <kbd>ds</kbd>가 안쪽에서도 듣게 바꿨습니다(Vim의 <code>ds(</code>, 45번째 판). <b>지금대로 둘까요?</b>',
  [card('지금 장면', '접기 영역 안의 블록을 고름', ['주황 상자: 이 블록을 담은 접기 영역의 이름 띠'], [fig('q8-start')], ref=True),
   card('Q8 · 1번', '지금대로: 담은 것을 찾아 올라감', [
      '<kbd>za</kbd> · <kbd>zd</kbd> · <kbd>ds</kbd> 모두 고른 것, 아니면 그것을 담은 가장 가까운 것에 듣습니다. 상태 줄에 무엇에 들었는지 알립니다("접기 영역 \'센서 읽기\'을(를) 풀었습니다").',
      'Vim에서 괄호 안 아무 데서나 <code>ds(</code>가 듣는 것과 같습니다. 잘못 풀었으면 <kbd>u</kbd> 한 번.',
      '규칙이 한 문장입니다: "고른 것을 담은 가장 가까운 것".'],
      [fig('q8-now')], pick=True, now=True),
   card('Q8 · 2번', '내용을 바꾸는 명령은 고른 것에만', [
      '<kbd>zd</kbd> · <kbd>ds</kbd>는 접기 영역(이름 띠나 접힌 칸)이나 제어 블록 자체를 골라야 듣습니다. 안쪽 블록을 고르고 누르면 아무 일도 없고 "접기 영역을 고르세요"라고 알립니다.',
      '<kbd>za</kbd>(보기만 바꿈)는 지금처럼 찾아 올라갑니다.',
      '<span class="bad">45번째 판에서 Vim에 맞춰 바꾼 <kbd>ds</kbd>를 되돌립니다.</span>'],
      [fig('q8-start', nosel=False)])]))

# ---------- Q11 ----------
secs.append(section('Q11', 'Q11. 좌우 이동은 세 겹인가 두 겹인가',
  f'좌우로 가는 키가 세 겹입니다: {K("h")} {K("l")}(←→)는 옆 갈래, {K("Ctrl")}+{K("←")} {K("→")}는 한 겹 바깥까지 보고 옆 갈래, {K("[[")} {K("]]")}는 옆 다이어그램. 앞의 둘은 <b>가장 바깥쪽 갈래의 끝</b>에서만 다릅니다. 장면: Case의 갈래 CMD_STOP 안에 있는 If의 거짓 갈래(빈 블록)를 골랐습니다.',
  [card('지금 장면', 'If의 거짓 갈래(오른쪽 끝)를 고름', ['여기서 오른쪽으로 갑니다.'], [fig('q11-start')], ref=True),
   card('Q11 · 1번', '두 겹: <kbd>Ctrl</kbd>+<kbd>←</kbd> <kbd>→</kbd>를 없앰', [
      '<kbd>l</kbd>(→)만 남습니다. If의 맨 오른쪽 갈래에서는 If 다음 블록 <code>state = IDLE;</code>로 갑니다(그림).',
      '바깥 Case의 옆 갈래로 가려면 <kbd>l</kbd>을 더 누릅니다(If 다음 블록에서 다시 <kbd>l</kbd>은 Case 갈래 CMD_SPEED).',
      '외울 키가 하나 줄어듭니다. <kbd>Ctrl</kbd>+<kbd>↑</kbd> <kbd>↓</kbd>(제어 블록을 한 덩어리로)는 그대로입니다.'],
      [fig('q11-right')]),
   card('Q11 · 2번', '세 겹 그대로', [
      '<kbd>Ctrl</kbd>+<kbd>→</kbd>는 If 안에 더 갈 곳이 없으니 한 겹 바깥 Case의 옆 갈래 CMD_SPEED의 첫 블록 <code>speed = uart_read();</code>로 바로 갑니다(그림).',
      '2026-10-10에 써 보며 정한 키입니다. 겹친 If · Case 안에서 옆 갈래로 건너뛸 때 빠릅니다.',
      '이미 들어 있고 시험도 있어 MVP에 더 할 일이 없습니다.'],
      [fig('q11-ctrl')], pick=True, now=True)],
  '<p class="note">처음 추천은 1번(없앰)이었습니다. 다만 "실제로 쓰였다면 지금대로"라고 적어 두었습니다. 써 보시며 <kbd>Ctrl</kbd>+<kbd>→</kbd>를 쓰셨다면 2번, 안 쓰셨다면 1번이 맞습니다. 추천을 2번으로 바꾼 까닭은 이미 들어 있어 MVP의 일이 늘지 않기 때문입니다.</p>'))

# ---------- Q12 ----------
def menu(items):
    rows = ''.join(f'<div class="mrow{" hl" if hl else ""}"><span>{t}</span><kbd>{k}</kbd></div>' for t, k, hl in items)
    return f'<div class="fig"><div class="menu">{rows}</div></div>'
secs.append(section('Q12', 'Q12. "빼기"라는 말',
  '"빼기"가 두 뜻입니다: "갈래 빼기"는 갈래를 <b>지우고</b>, "Method로 빼기"는 블록을 Method로 <b>옮기고</b> 그 자리에 호출 블록을 남깁니다. 그림은 Case 안에서 오른쪽 클릭 메뉴의 한 부분입니다.',
  [card('Q12 · 1번', '"갈래 빼기"를 "갈래 지우기"로', [
      '"빼기"는 Method로 빼기에만 씁니다. "머리 떼기"는 그대로 둡니다.',
      '블록의 "지우기"와 같은 말이라 같은 일(안의 블록도 함께 사라짐)로 읽힙니다.'],
      [menu([('Case: 갈래 넣기', 'o', False), ('Case: 이 갈래 지우기', 'x', True), ('Case: 갈래 이름 고치기', 'i', False), ('새 Method로 빼기', 'm', False)])], pick=True),
   card('Q12 · 2번', '그대로 "갈래 빼기"', [
      '"넣기"의 짝으로 "빼기"가 자연스럽습니다.',
      '<span class="bad">"Method로 빼기"와 말이 같아, 갈래를 Method로 옮기는 것처럼 읽힐 수 있습니다.</span>'],
      [menu([('Case: 갈래 넣기', '+', False), ('Case: 이 갈래 빼기', '-', True), ('Case: 갈래 이름 고치기', 'L', False), ('새 Method로 빼기', 'm', False)])], now=True)],
  '<p class="note">1번 그림의 키(<kbd>o</kbd> <kbd>x</kbd> <kbd>i</kbd>)는 Q10-c를 1번으로 정했을 때의 모습입니다.</p>'))

# ---------- Q19 ----------
secs.append(section('Q19', 'Q19. 명령이 끝난 뒤에 무엇이 골라지는가',
  f'고른 것을 풀 수 있게 된 뒤(2026-10-15, {K("Esc")} 두 번 · 빈 캔버스 클릭) 남은 물음입니다. 64번째 판은 이미 아래 1번처럼 움직입니다. <b>이것을 규칙으로 적을까요?</b>',
  [card('Q19 · 1번', '만들거나 바꾼 것을 고르고, 지운 뒤에는 다음 블록', [
      '<b>넣기 · 감싸기 · 붙이기 · 옮기기:</b> 새로 생기거나 바뀐 것을 고릅니다.',
      '<b>지우기 · 잘라내기:</b> 다음 블록, 없으면 앞 블록, 둘 다 없으면 담고 있던 블록(①: <code>i = lo - 1;</code>을 지우면 <code>j = lo;</code>).',
      '<b>풀기(<kbd>ds</kbd>):</b> 남은 안의 블록들을 고릅니다(②: If를 풀면 갈래의 블록들).',
      '<b>실행 취소 · 다시 하기:</b> 고른 것이 남아 있으면 그대로, 사라졌으면 고른 것이 없습니다(③).',
      '이어서 다음 명령을 바로 누를 수 있습니다(지우고 또 지우기, 풀고 다시 감싸기).'],
      [cap('① 지운 뒤'), fig('q19-del-now', crop='right'), cap('② <code>while</code> 안의 If를 고르고 <kbd>ds</kbd>'), fig('q19-ds-now', crop='right'), cap('③ 그 뒤 <kbd>u</kbd>'), fig('q19-undo-now', crop='right')], pick=True, now=True),
   card('Q19 · 2번', '명령 뒤에는 고른 것이 없음', [
      '명령이 끝나면 고른 것을 풉니다. 이동 키를 누르면 마지막에 골랐던 블록부터 다시 고릅니다.',
      '그림이 고른 테두리 없이 깨끗하게 보입니다.',
      '<span class="bad">지우고 또 지우기처럼 이어 하는 일마다 이동 키를 한 번 더 눌러야 합니다.</span>'],
      [cap('① 지운 뒤'), fig('q19-del-now', nosel=True, crop='right'), cap('② <kbd>ds</kbd> 뒤'), fig('q19-ds-now', nosel=True, crop='right')])]))

page = (here / '2026-10-31-mvp-ux-questions-template.html').read_text(encoding='utf-8').replace('<!--SECTIONS-->', '\n'.join(secs))
(here / '2026-10-31-mvp-ux-questions-study.html').write_text(page, encoding='utf-8', newline='\n')
print('ok', len(page))
