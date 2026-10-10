"""문자 로고를 글꼴 없이도 보이도록 윤곽선 SVG로 만든다.

usage: 2026-10-10-logo-wordmark.py <fonts-dir> <out.svg> <ink> <accent>

모양 (시안 W4-6b, 2026-10-11에 정함):
  Ariadne  먹색   GFS Didot
  ’s       주홍   Playfair Display Italic, 조금 작게
  NSD      주홍   Josefin Sans (굵기 600), 자간은 글꼴의 기본 간격

글로 적는 공식 이름은 AriadneNSD이고, `Ariadne’s NSD`는 이 그림에서만 쓴다.

fonts-dir에 둘 파일 (모두 OFL, https://github.com/google/fonts 의 ofl/ 아래):
  didot.ttf            gfsdidot/GFSDidot-Regular.ttf
  playfair-italic.ttf  playfairdisplay/PlayfairDisplay-Italic[wght].ttf
  josefin.ttf          josefinsans/JosefinSans[wght].ttf
"""
import sys
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.boundsPen import BoundsPen

fonts, out, ink, accent = sys.argv[1:5]

def load(name, wght=None):
    f = TTFont(f"{fonts}/{name}.ttf")
    if "fvar" in f:
        axes = {a.axisTag: a.defaultValue for a in f["fvar"].axes}
        if wght:
            axes["wght"] = wght
        f = instancer.instantiateVariableFont(f, axes)
    return f

def run(f, text, size, x, fill, tracking=0.0):
    gs, cmap, upm = f.getGlyphSet(), f.getBestCmap(), f["head"].unitsPerEm
    s = size / upm
    parts, hi, lo = [], 0, 0
    for ch in text:
        g = gs[cmap[ord(ch)]]
        pen = SVGPathPen(gs)
        g.draw(pen)
        bp = BoundsPen(gs)
        g.draw(bp)
        if bp.bounds:
            hi, lo = max(hi, bp.bounds[3] * s), min(lo, bp.bounds[1] * s)
        parts.append(f'<path fill="{fill}" transform="translate({x:.1f} 0) scale({s:.4f} {-s:.4f})" d="{pen.getCommands()}"/>')
        x += g.width * s + tracking * size
    return "".join(parts), x - tracking * size, hi, lo

def cap_height(f):
    gs = f.getGlyphSet()
    bp = BoundsPen(gs)
    gs[f.getBestCmap()[ord("N")]].draw(bp)
    return bp.bounds[3] / f["head"].unitsPerEm

didot, italic, sans = load("didot"), load("playfair-italic"), load("josefin", 600)
# NSD의 대문자 높이는 이름의 대문자 높이의 0.92배
nsd_size = cap_height(didot) * 1000 * 0.92 / cap_height(sans)

x, body, top, bot = 0, "", 0, 0
for f, text, size, fill, gap, tr in [
    (didot, "Ariadne", 1000, ink, 0, 0),
    (italic, "’s", 800, accent, 10, 0),
    (sans, "NSD", nsd_size, accent, 190, 0),
]:
    b, x, hi, lo = run(f, text, size, x + gap, fill, tr)
    body, top, bot = body + b, max(top, hi), min(bot, lo)
pad = 30
svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{-pad} {-top - pad:.0f} {x + 2 * pad:.0f} {top - bot + 2 * pad:.0f}" '
       f'role="img" aria-label="AriadneNSD"><title>AriadneNSD</title>{body}</svg>\n')
open(out, "w", encoding="utf-8", newline="\n").write(svg)
print(f"{x + 2 * pad:.0f} x {top - bot + 2 * pad:.0f}")
