"""어느 바탕에서나 읽히는 문자 로고 시안을 만든다 (2026-10-11).

usage: py 2026-10-11-wordmark-variants.py   (이 폴더에서 실행)

GitHub는 테마 설정에 따라 어두운 화면에 밝은 화면용 그림을 내줄 때가 있다.
그래서 밝은 화면용·어두운 화면용 두 파일로 나누지 않고 파일 하나로 쓰는 안을 견준다.
글자 모양은 확정한 문자 로고(W4-6b)의 윤곽선을 그대로 쓰고, 색과 뒤에 까는 판만 바꾼다.

만드는 파일:
  2026-10-11-wordmark-<시안>.svg            시안마다 하나
  2026-10-11-wordmark-any-background.html   견주어 보는 페이지
"""
import io
import re

SRC = "2026-10-10-wordmark-light.svg"
INK, CREAM, VERMILION, VERMILION_DARK_BG = "#14101A", "#F7F1EA", "#C9401F", "#EC6A45"

src = io.open(SRC, encoding="utf-8").read()
vb = [float(v) for v in re.search(r'viewBox="([^"]+)"', src).group(1).split()]
paths = re.findall(r"<path [^>]*/>", src)
assert len(paths) == 12, len(paths)   # Ariadne 7, ’s 2, NSD 3


def glyphs(name, poss, nsd):
    out = []
    for i, p in enumerate(paths):
        fill = name if i < 7 else poss if i < 9 else nsd
        out.append(re.sub(r'fill="[^"]*"', f'fill="{fill}"', p, count=1))
    return "".join(out)


def svg(name, poss, nsd, plate=None, pad=0, rx=0):
    x, y, w, h = vb[0] - pad, vb[1] - pad * 0.62, vb[2] + 2 * pad, vb[3] + 2 * pad * 0.62
    back = f'<rect x="{x:.0f}" y="{y:.0f}" width="{w:.0f}" height="{h:.0f}" rx="{rx}" fill="{plate}"/>' if plate else ""
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{x:.0f} {y:.0f} {w:.0f} {h:.0f}" role="img" aria-label="AriadneNSD">'
            f"<title>AriadneNSD</title>{back}{glyphs(name, poss, nsd)}</svg>\n")


# (id, 이름, 설명, svg, README에서의 폭)
VARIANTS = [
    ("p1-cream-plate", "P1 · 석고색 판", "글자는 지금 그대로 두고, 뒤에 그림 로고의 살색(석고색) 판을 깝니다. 글자 모양과 색이 하나도 바뀌지 않습니다.",
     svg(INK, VERMILION, VERMILION, plate=CREAM, pad=420, rx=300), 400),
    ("p2-vermilion-plate", "P2 · 주홍 판", "그림 로고와 같은 주홍 바탕에 석고색 글자. 소유격과 NSD는 먹색으로 갈라 줍니다. 그림 로고와 한 벌처럼 보입니다.",
     svg(CREAM, INK, INK, plate=VERMILION, pad=420, rx=300), 400),
    ("p3-vermilion-plate-cream", "P3 · 주홍 판, 글자는 모두 석고색", "P2에서 먹색을 빼고 글자를 모두 석고색으로. 색이 둘뿐이라 가장 단순합니다. 이름과 NSD는 글꼴로만 갈립니다.",
     svg(CREAM, CREAM, CREAM, plate=VERMILION, pad=420, rx=300), 400),
    ("n1-warm-grey", "N1 · 판 없이, 이름을 중간 밝기로", "판을 깔지 않고 Ariadne를 흰 바탕과 검은 바탕 모두에서 읽히는 회갈색으로 바꿉니다. 주홍도 두 바탕의 중간으로 맞춥니다. 어느 쪽에서도 대비가 조금 약합니다.",
     svg("#8C8079", "#DD5530", "#DD5530"), 340),
    ("n2-all-vermilion", "N2 · 판 없이, 글자를 모두 주홍으로", "판을 깔지 않고 글자를 모두 주홍 한 가지로. 이름과 NSD는 글꼴로만 갈립니다.",
     svg("#DD5530", "#DD5530", "#DD5530"), 340),
]

for vid, *_rest in VARIANTS:
    body = next(v[3] for v in VARIANTS if v[0] == vid)
    io.open(f"2026-10-11-wordmark-{vid}.svg", "w", encoding="utf-8", newline="\n").write(body)

lady = io.open("2026-10-10-logo-aegean-lady-rounded.svg", encoding="utf-8").read()
lady_inner = re.search(r"<svg[^>]*>(.*)</svg>", lady, re.S).group(1).replace('id="r"', 'id="lady-clip"').replace("url(#r)", "url(#lady-clip)")
now_light = svg(INK, VERMILION, VERMILION)
now_dark = svg(CREAM, VERMILION_DARK_BG, VERMILION_DARK_BG)


def inline(s, width):
    # 페이지 안에 여러 번 넣으므로 제목 요소는 빼고 폭을 준다
    s = re.sub(r"<title>.*?</title>", "", s)
    return s.replace("<svg ", f'<svg class="wm" style="width:{width}px" ', 1).strip()


def panel(kind, mark, width, note=""):
    label = "GitHub 밝은 화면" if kind == "light" else "GitHub 어두운 화면"
    return (f'<figure class="shot {kind}"><figcaption>{label}{note}</figcaption>'
            f'<div class="readme"><svg class="lady" viewBox="0 0 382 382" aria-hidden="true"><use href="#lady"/></svg>'
            f'{inline(mark, width)}<p>NS 차트(Nassi-Shneiderman Diagram) 편집기입니다.</p></div></figure>')


rows = [f'''<section class="row now">
  <header><h2>지금 · 파일 둘</h2><p>밝은 화면용과 어두운 화면용을 따로 두고 GitHub가 고르게 합니다. GitHub가 잘못 고르면 오른쪽처럼 됩니다.</p></header>
  <div class="pair three">{panel("light", now_light, 340)}{panel("dark", now_dark, 340, " · 맞게 골랐을 때")}{panel("dark", now_light, 340, " · 잘못 골랐을 때")}</div>
</section>''']
for vid, name, desc, body, width in VARIANTS:
    rows.append(f'''<section class="row" id="{vid}">
  <header><h2>{name}</h2><p>{desc}</p></header>
  <div class="pair">{panel("light", body, width)}{panel("dark", body, width)}</div>
</section>''')

html = f'''<title>문자 로고 바탕 시안</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans+KR:wght@400;500;600&display=swap">
<style>
/* 시안마다 한 줄: 왼쪽에 이름과 설명, 오른쪽에 GitHub의 밝은 화면과 어두운 화면을 나란히. 화면 칸의 색은 GitHub의 실제 바탕색으로 고정 */
:root {{
  --bg: #f3efe9; --panel: #fbf9f6; --fg: #1d1820; --muted: #6a6068; --line: #ddd5cb; --accent: #c9401f;
  --gh-light: #ffffff; --gh-light-fg: #1f2328; --gh-light-line: #d1d9e0;
  --gh-dark: #0d1117; --gh-dark-fg: #f0f6fc; --gh-dark-line: #3d444d;
  --font: 'IBM Plex Sans KR', 'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif;
  --mono: 'IBM Plex Mono', Consolas, monospace;
}}
@media (prefers-color-scheme: dark) {{
  :root:not([data-theme="light"]) {{ --bg: #17131a; --panel: #1f1a22; --fg: #ece6e0; --muted: #a59aa0; --line: #352e38; --accent: #ec6a45; color-scheme: dark; }}
}}
:root[data-theme="dark"] {{ --bg: #17131a; --panel: #1f1a22; --fg: #ece6e0; --muted: #a59aa0; --line: #352e38; --accent: #ec6a45; color-scheme: dark; }}
* {{ box-sizing: border-box; }}
body {{ background: var(--bg); color: var(--fg); font-family: var(--font); font-size: 15px; line-height: 1.65; padding-block: 32px 56px; padding-inline: 20px; }}
main {{ max-width: 1180px; margin-inline: auto; display: grid; gap: 28px; }}
h1 {{ font-size: 26px; font-weight: 600; margin: 0 0 8px; letter-spacing: -.01em; text-wrap: balance; }}
.lede {{ margin: 0; max-width: 68ch; color: var(--muted); }}
.lede b {{ color: var(--fg); font-weight: 600; }}
.row {{ display: grid; grid-template-columns: minmax(0, 250px) minmax(0, 1fr); gap: 20px 28px; padding-top: 24px; border-top: 1px solid var(--line); }}
.row header {{ min-width: 0; }}
.row h2 {{ font-size: 16px; font-weight: 600; margin: 0 0 6px; }}
.row.now h2 {{ color: var(--muted); }}
.row header p {{ margin: 0; font-size: 13.5px; color: var(--muted); }}
.pair {{ display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; min-width: 0; }}
.pair.three {{ grid-template-columns: repeat(3, minmax(0, 1fr)); }}
.shot {{ margin: 0; min-width: 0; display: grid; gap: 6px; }}
.shot figcaption {{ font-family: var(--mono); font-size: 11.5px; color: var(--muted); letter-spacing: .02em; }}
.readme {{ border-radius: 6px; padding: 26px 16px 20px; display: grid; justify-items: center; gap: 14px; border: 1px solid; min-width: 0; }}
.shot.light .readme {{ background: var(--gh-light); color: var(--gh-light-fg); border-color: var(--gh-light-line); }}
.shot.dark .readme {{ background: var(--gh-dark); color: var(--gh-dark-fg); border-color: var(--gh-dark-line); }}
.lady {{ width: 96px; height: 96px; display: block; }}
.wm {{ display: block; max-width: 100%; height: auto; }}
.pair.three .wm {{ max-width: 100%; }}
.readme p {{ margin: 0; font-size: 12.5px; opacity: .8; text-align: center; }}
.foot {{ border-top: 1px solid var(--line); padding-top: 20px; color: var(--muted); font-size: 13.5px; max-width: 72ch; }}
.foot code {{ font-family: var(--mono); font-size: 12.5px; }}
@media (max-width: 860px) {{
  .row {{ grid-template-columns: minmax(0, 1fr); }}
  .pair, .pair.three {{ grid-template-columns: minmax(0, 1fr); }}
}}
</style>

<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs><symbol id="lady" viewBox="0 0 382 382">{lady_inner}</symbol></defs></svg>

<main>
  <div>
    <h1>어느 바탕에서나 읽히는 문자 로고</h1>
    <p class="lede">GitHub는 테마 설정에 따라 <b>어두운 화면에 밝은 화면용 그림</b>을 내줄 때가 있습니다. 그러면 검은 <i>Ariadne</i>가 어두운 바탕에 묻힙니다. 아래 다섯 시안은 파일 하나로 두 바탕에서 모두 읽히게 한 것입니다. 글자 모양은 확정한 문자 로고(W4-6b) 그대로이고 색과 판만 다릅니다.</p>
  </div>
  {"".join(rows)}
  <p class="foot">화면 칸의 바탕은 GitHub의 기본 밝은 테마(<code>#ffffff</code>)와 기본 어두운 테마(<code>#0d1117</code>)의 색입니다. 판이 있는 시안은 README에서 폭 400px, 판이 없는 시안은 지금과 같은 340px로 그렸습니다. 시안 파일은 저장소의 <code>journal/assets/2026-10-11-wordmark-*.svg</code>에 있습니다.</p>
</main>
'''
io.open("2026-10-11-wordmark-any-background.html", "w", encoding="utf-8", newline="\n").write(html)
print("ok", len(html))
