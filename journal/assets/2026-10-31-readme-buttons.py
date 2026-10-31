# README의 버튼 그림을 만든다 (시안 M42의 나11 채운 버튼. 나8의 작은 버튼은 2026-10-31에 뺐음).
# 글자는 Pretendard(SIL OFL 1.1)의 글꼴 모양을 선(path)으로 옮겨, GitHub · 사이트 · Obsidian 어디서나 같은 모양이 되게 한다.
# 쓰는 법: python journal/assets/2026-10-31-readme-buttons.py   (fonttools가 필요: pip install fonttools)
import pathlib
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

here = pathlib.Path(__file__).parent
FONTS = pathlib.Path("C:/Windows/Fonts")

def text_path(font_file, text, size, x0, baseline):
    f = TTFont(FONTS / font_file)
    gs, cmap, hmtx = f.getGlyphSet(), f.getBestCmap(), f["hmtx"]
    s = size / f["head"].unitsPerEm
    pen = SVGPathPen(gs)
    x = 0
    for ch in text:
        g = cmap[ord(ch)]
        gs[g].draw(TransformPen(pen, (s, 0, 0, -s, x0 + x * s, baseline)))
        x += hmtx[g][0]
    asc, desc = f["hhea"].ascent, f["hhea"].descent
    return pen.getCommands(), x * s, (asc + desc) / 2 * s

def button(name, text, font_file, size, pad_x, h, radius, fill, stroke, ink, play=False):
    _, w_text, mid = text_path(font_file, text, size, 0, 0)
    tri = size * 0.62 if play else 0
    gap = size * 0.45 if play else 0
    w = round(pad_x * 2 + tri + gap + w_text)
    base = h / 2 + mid
    d, _, _ = text_path(font_file, text, size, pad_x + tri + gap, base)
    parts = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}" role="img" aria-label="{text}">',
             f'<title>{text}</title>',
             f'<rect x="0.5" y="0.5" width="{w - 1}" height="{h - 1}" rx="{radius}" fill="{fill}"' + (f' stroke="{stroke}"' if stroke else '') + '/>']
    if play:  # 재생 세모(▶)
        cy, th = h / 2, tri * 0.9
        parts.append(f'<path d="M{pad_x:.2f} {cy - th / 2:.2f}L{pad_x + tri:.2f} {cy:.2f}L{pad_x:.2f} {cy + th / 2:.2f}Z" fill="{ink}"/>')
    parts.append(f'<path d="{d}" fill="{ink}"/></svg>')
    (here / name).write_text("".join(parts) + "\n", encoding="utf-8")
    print(name, w, h)

# 채운 버튼(나2의 모양): 인용절의 링크 자리
button("2026-10-31-readme-prototype-button.svg", "AriadneNSD 프로토타입", "Pretendard-Bold.ttf", 14, 16, 32, 16, "#284b63", None, "#faf8f8", play=True)
