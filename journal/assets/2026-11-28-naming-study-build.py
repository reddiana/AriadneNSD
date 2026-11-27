# M83 삽입 · 붙여넣기의 앞 · 뒤 이름 시안을 만든다. 틀(CSS · 꼬리말)은 M79에서 가져온다.
# 실행: python journal/assets/2026-11-28-naming-study-build.py
from pathlib import Path

here = Path(__file__).parent
src = (here / '2026-11-28-endless-loop-study.html').read_text(encoding='utf-8')
style = src[src.index('<style>'):src.index('</style>') + 8]
style = style.replace('</style>', '''.menu { display: inline-grid; min-width: 230px; background: #fff; color: #151a22; border: 1px solid #c9d1de; border-radius: 6px; box-shadow: 0 4px 14px #0002; padding: 4px 0; font-size: 13px; }
.menu div { display: flex; justify-content: space-between; gap: 24px; padding: 3px 12px; }
.menu div.hd { color: #5a6476; font-size: 11.5px; padding-top: 6px; }
.menu div.new { background: #e3f3e8; }
.menu kbd { color: #5a6476; }
.menus { display: flex; flex-wrap: wrap; gap: 12px; align-items: flex-start; }
table.ba { border-collapse: collapse; font-size: 13px; width: 100%; }
table.ba th, table.ba td { border: 1px solid var(--line); padding: 4px 8px; text-align: left; vertical-align: top; }
table.ba th { color: var(--muted); font-weight: 600; background: var(--box); }
table.ba td.n { color: var(--pick); font-weight: 600; }
.tw { overflow-x: auto; }
</style>''')
footer = src[src.index('<footer'):src.index('참고 그림:')].rstrip() + '</footer>'


def menus(rows):
    out = '<div class="menus">'
    for title, items in rows:
        out += f'<div class="menu"><div class="hd">{title}</div>'
        for name, key, new in items:
            out += f'<div class="{"new" if new else ""}"><span>{name}</span><kbd>{key}</kbd></div>'
        out += '</div>'
    return out + '</div>'


now = menus([
    ('다이어그램 메뉴', [('삽입 ▸', '', 0), ('앞에 삽입 ▸', '', 0)]),
    ('다이어그램 › 삽입 ▸', [('처리 삽입', 'o', 0), ('If 삽입', 'a i', 0), ('While 삽입', 'a w', 0)]),
    ('다이어그램 › 앞에 삽입 ▸', [('앞에 처리 삽입', 'O', 0), ('앞에 If 삽입', 'A i', 0), ('앞에 While 삽입', 'A w', 0)]),
    ('편집 메뉴', [('붙여넣기', 'Ctrl+V', 0), ('앞에 붙여넣기', 'P', 0)]),
    ('분기 라벨에서', [('분기 삽입', 'o', 0), ('앞에 분기 삽입', 'O', 0)]),
])


def opt(a_sub, b_sub, a_ins, b_ins, a_p, b_p, a_br, b_br, arrows=False):
    up, dn, lf, rt = ('↑ ', '↓ ', '← ', '→ ') if arrows else ('', '', '', '')
    return menus([
        ('다이어그램 메뉴', [(dn + a_sub + ' ▸', '', 1), (up + b_sub + ' ▸', '', 1)]),
        (f'다이어그램 › {a_sub} ▸', [(a_ins.format(k), key, 1) for k, key in (('처리', 'o'), ('If', 'a i'), ('While', 'a w'))]),
        (f'다이어그램 › {b_sub} ▸', [(b_ins.format(k), key, 1) for k, key in (('처리', 'O'), ('If', 'A i'), ('While', 'A w'))]),
        ('편집 메뉴', [(dn + a_p, 'Ctrl+V', 1), (up + b_p, 'P', 1)]),
        ('분기 라벨에서', [(rt + a_br, 'o', 1), (lf + b_br, 'O', 1)]),
    ])


o1 = opt('아래에 삽입', '위에 삽입', '아래에 {} 삽입', '위에 {} 삽입', '아래에 붙여넣기', '위에 붙여넣기', '오른쪽에 분기 삽입', '왼쪽에 분기 삽입')
o2 = opt('뒤에 삽입', '앞에 삽입', '뒤에 {} 삽입', '앞에 {} 삽입', '뒤에 붙여넣기', '앞에 붙여넣기', '뒤에 분기 삽입', '앞에 분기 삽입')
o3 = opt('아래에 삽입', '위에 삽입', '아래에 {} 삽입', '위에 {} 삽입', '아래에 붙여넣기', '위에 붙여넣기', '오른쪽에 분기 삽입', '왼쪽에 분기 삽입', arrows=True)

MONO = 'font-family="IBM Plex Mono, monospace" fill="#151a22"'
fig = f'''<svg width="560" height="180" viewBox="0 0 560 180" font-family="IBM Plex Sans KR, sans-serif" font-size="12">
<defs><marker id="ah" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L8,4 L0,8z" fill="#1d7a46"/></marker></defs>
<rect x="20.5" y="20.5" width="200" height="32" fill="#edf0f5" stroke="#5b77ad"/><text x="30" y="41" {MONO}>합 ← 0</text>
<rect x="20.5" y="52.5" width="200" height="32" fill="#edf0f5" stroke="#5b77ad"/><rect x="21.5" y="53.5" width="198" height="30" fill="none" stroke="#2c55c9" stroke-width="2"/><text x="30" y="73" {MONO}>i ← 0</text>
<rect x="20.5" y="84.5" width="200" height="32" fill="#edf0f5" stroke="#5b77ad"/><text x="30" y="105" {MONO}>출력(합)</text>
<line x1="232" y1="68" x2="232" y2="40" stroke="#1d7a46" stroke-width="1.5" marker-end="url(#ah)"/><text x="240" y="42" fill="#1d7a46">위에 (O · A · P)</text>
<line x1="232" y1="70" x2="232" y2="100" stroke="#1d7a46" stroke-width="1.5" marker-end="url(#ah)"/><text x="240" y="104" fill="#1d7a46">아래에 (o · a · p)</text>
<text x="20" y="145" fill="#5a6476">고른 블록 i ← 0 (파란 테두리)의 위 · 아래</text>
<rect x="360.5" y="20.5" width="180" height="32" fill="#f6ebdc" stroke="#5b77ad"/><polyline points="360.5,20.5 450.5,52.5 540.5,20.5" fill="none" stroke="#5b77ad"/><text x="450" y="34" text-anchor="middle" {MONO}>x &gt; 0</text>
<text x="364" y="49" font-size="10" fill="#5a6476">참</text><text x="536" y="49" font-size="10" fill="#5a6476" text-anchor="end">거짓</text>
<rect x="360.5" y="52.5" width="90" height="32" fill="#edf0f5" stroke="#5b77ad"/><rect x="450.5" y="52.5" width="90" height="32" fill="#edf0f5" stroke="#5b77ad"/>
<rect x="361.5" y="53.5" width="88" height="30" fill="none" stroke="#2c55c9" stroke-width="2"/><text x="370" y="73" {MONO}>양수</text><text x="460" y="73" {MONO}>음수</text>
<line x1="405" y1="100" x2="350" y2="100" stroke="#1d7a46" stroke-width="1.5" marker-end="url(#ah)"/><text x="310" y="120" fill="#1d7a46">왼쪽에 (O)</text>
<line x1="405" y1="100" x2="465" y2="100" stroke="#1d7a46" stroke-width="1.5" marker-end="url(#ah)"/><text x="430" y="120" fill="#1d7a46">오른쪽에 (o)</text>
<text x="310" y="145" fill="#5a6476">고른 분기(참)의 왼쪽 · 오른쪽</text>
<text x="310" y="163" fill="#5a6476">If에서 넣으면 Case로 바꿀지 묻는다</text>
</svg>'''


def ba(rows):
    h = '<div class="tw"><table class="ba"><tr><th>자리</th><th>지금</th><th>바꾼 뒤 (한국어)</th><th>바꾼 뒤 (영어)</th></tr>'
    for a, b, c, d in rows:
        h += f'<tr><td>{a}</td><td>{b}</td><td class="n">{c}</td><td>{d}</td></tr>'
    return h + '</table></div>'


ba1 = ba([
    ('다이어그램 메뉴의 하위 메뉴', '삽입 ▸ / 앞에 삽입 ▸', '아래에 삽입 ▸ / 위에 삽입 ▸', 'Insert Below ▸ / Insert Above ▸ (지금 Insert ▸ / Insert Before ▸)'),
    ('블록 넣기 (<code>o</code> · <code>a</code>+종류 / <code>O</code> · <code>A</code>+종류)', 'If 삽입 / 앞에 If 삽입', '아래에 If 삽입 / 위에 If 삽입', 'Insert If Below / Insert If Above'),
    ('붙여넣기 (<code>p</code> · <code>Ctrl</code>+<code>V</code> / <code>P</code>)', '붙여넣기 / 앞에 붙여넣기', '아래에 붙여넣기 / 위에 붙여넣기', 'Paste Below / Paste Above'),
    ('분기 넣기 (분기 라벨에서 <code>o</code> / <code>O</code>)', '분기 삽입 / 앞에 분기 삽입', '오른쪽에 분기 삽입 / 왼쪽에 분기 삽입', 'Insert Branch Right / Insert Branch Left'),
    ('키 힌트 (<code>a</code> / <code>A</code>)', '뒤에 삽입 / 앞에 삽입', '아래에 삽입 / 위에 삽입', 'Insert below / Insert above'),
    ('툴바 블록 아이콘의 툴팁', 'If: 뒤에 삽입 (a i) · Shift+클릭: 앞에 (A i) · …', 'If: 아래에 삽입 (a i) · Shift+클릭: 위에 (A i) · …', 'If: insert below (a i) · Shift+click: above (A i) · …'),
    ('알림', 'default 분기는 늘 맨 끝이라 그 앞에 삽입했습니다.', 'default 분기는 늘 맨 오른쪽이라 그 왼쪽에 삽입했습니다.', 'The default branch always stays rightmost, so the new branch went to its left.'),
    ('다이어그램 사이 이동', '앞 다이어그램 / 뒤 다이어그램', '이전 다이어그램 / 다음 다이어그램', 'Previous Diagram / Next Diagram'),
])


def card(tag, title, body, items, pick=False):
    badge = '<span class="badge">Claude의 추천</span>' if pick else ''
    lis = ''.join(f'<li>{i}</li>' for i in items)
    return f'''      <article class="card{' pick' if pick else ''}"><header><span class="tag">{tag}</span><h3>{title}</h3>{badge}</header>
        <div class="fig">{body}</div><ul>{lis}</ul></article>'''


def bad(s):
    return f'<span class="bad">{s}</span>'


html = f'''<title>M83 앞 · 뒤의 이름</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans+KR:wght@400;500;600&display=swap">
{style}

<main>
  <div>
    <h1>M83 · 삽입 · 붙여넣기의 앞 · 뒤</h1>
    <p class="lede">inbox의 세 물음을 하나로 묶었습니다. "insert나 삽입이 뒤에 넣는다는 느낌이 안 든다", "<code>Ctrl</code>+<code>V</code>와 <code>p</code>는 같은 동작인데 메뉴에서는 이름이 다르다", "앞에 / 뒤에가 혼란스럽다". 이 페이지에서 <b>이름(W1)</b>을 고릅니다. <b>1번이 Claude의 추천</b>입니다. 키는 그대로 두고 이름만 바꿉니다.</p>
  </div>

  <section>
    <span class="part">지금</span>
    <h2>지금의 이름과 문제</h2>
    {now}
    <div class="sum"><ol>
      <li><b>표시가 한쪽에만 있습니다.</b> 뒤에 넣는 쪽은 그냥 "삽입" · "붙여넣기"이고, 앞에 넣는 쪽에만 "앞에"를 붙였습니다. 그래서 "삽입"이 어디에 넣는지 이름만으로는 모릅니다. 다른 앱에서 "삽입"은 보통 커서 <i>앞</i>에 넣습니다.</li>
      <li><b><code>Ctrl</code>+<code>V</code>와 <code>p</code>는 같은 명령</b>(뒤에 붙여넣기)입니다. 메뉴는 표준 키가 있으면 그것만 보여서 "붙여넣기 <code>Ctrl</code>+<code>V</code>"로 보이고, 키 표는 <code>p</code>를 "뒤에 붙여넣기"라고 부릅니다. 그래서 둘이 다른 명령처럼 보입니다. 이름에 "아래에"(또는 "뒤에")가 붙으면 메뉴의 <code>Ctrl</code>+<code>V</code> 줄과 키 표의 <code>p</code> 줄이 같은 이름이 됩니다.</li>
      <li><b>"앞 · 뒤"는 그림의 방향이 아닙니다.</b> 블록은 위아래로 쌓이고 분기는 좌우로 놓이는데, 둘 다 "앞 · 뒤"라고 부릅니다. "앞"은 "위"로도 "눈앞"으로도 읽힙니다.</li>
    </ol></div>
  </section>

  <section>
    <span class="part">들어가는 자리</span>
    <h2>어디에 들어가나 (1번의 말로)</h2>
    <div class="fig">{fig}</div>
  </section>

  <section>
    <span class="part">W1</span>
    <h2>W1. 앞 · 뒤를 무엇이라 부를까</h2>
    <p class="q">세 판 모두 양쪽에 늘 표시를 붙입니다(문제 1, 2). 메뉴의 키 표시는 지금 규칙(표준 키가 있으면 그것만) 그대로입니다. 초록 줄이 바뀌는 줄입니다.</p>
    <div class="cards">
{card('W1 · 1번', '그림의 방향으로: 위 · 아래, 왼쪽 · 오른쪽', o1, ['블록은 <b>위에 · 아래에</b>, 분기는 <b>왼쪽에 · 오른쪽에</b>. 화면에서 들어갈 자리를 그대로 말합니다.', 'Word · Excel 표의 "위에 삽입 · 아래에 삽입 · 왼쪽에 삽입"과 같은 말입니다. 영어도 Insert Above / Below / Left / Right.', 'Vim의 <code>p</code>(줄을 아래에) · <code>P</code>(위에)와도 맞습니다.'], True)}
{card('W1 · 2번', '앞 · 뒤를 양쪽에 늘 붙임', o2, ['고칠 것이 가장 적습니다("삽입" → "뒤에 삽입", "붙여넣기" → "뒤에 붙여넣기").', bad('방향 문제(문제 3)는 그대로입니다. 분기의 "앞 · 뒤"도 좌우인지 바로 읽히지 않습니다.')])}
{card('W1 · 3번', '1번에 화살표', o3, ['1번의 말 앞에 ↑ ↓ ← →를 붙입니다. 읽기 전에 방향이 보입니다.', bad('메뉴의 다른 줄에는 화살표가 없어서 이 줄들만 튑니다. 블록 아이콘 자리와 겹칩니다.')])}
    </div>
  </section>

  <section>
    <span class="part">W1 · 1번 · 전 / 후</span>
    <h2>1번으로 바꾸면 달라지는 문구</h2>
    <p class="q">명령의 id(<code>block.insertBefore.*</code> 등)와 키는 그대로이고, 사용자에게 보이는 글만 바뀝니다. 사용법 · 키 표 · 조작 규칙의 말도 함께 맞춥니다.</p>
    {ba1}
  </section>

  <section>
    <h2>답하실 것</h2>
    <div class="sum"><ol>
      <li>W1의 <b>번호</b> 또는 고칠 점(전 / 후 표의 문구 하나하나도).</li>
      <li>정하면 문구(한국어 · 영어) · 키 표 · 조작 규칙 · 사용법을 맞춥니다.</li>
    </ol></div>
  </section>
</main>

{footer}'''
(here / '2026-11-28-before-after-naming-study.html').write_text(html, encoding='utf-8', newline='\n')
print('written', len(html))
