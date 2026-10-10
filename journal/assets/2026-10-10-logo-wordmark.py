"""문자 로고를 글꼴 없이도 보이도록 윤곽선 SVG로 만든다.

usage: wordmark.py <GFSDidot-Regular.ttf> <IBMPlexMono-Medium.ttf> <out.svg> <ink> <accent>

모양: `Ariadne`(먹색, Didot) + `’s`(주홍, Didot) + `NSD`(주홍, Plex Mono).
글로 적는 공식 이름은 AriadneNSD이고, `Ariadne’s NSD`는 이 그림에서만 쓴다.
"""
import sys
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.boundsPen import BoundsPen

didot, plex, out, ink, accent = sys.argv[1:6]

def run(path, text, size, x, fill, tracking=0.0):
    f = TTFont(path)
    gs, cmap, upm = f.getGlyphSet(), f.getBestCmap(), f["head"].unitsPerEm
    s = size / upm
    parts, hi = [], 0
    for ch in text:
        g = gs[cmap[ord(ch)]]
        pen = SVGPathPen(gs)
        g.draw(pen)
        bp = BoundsPen(gs)
        g.draw(bp)
        if bp.bounds:
            hi = max(hi, bp.bounds[3] * s)
        parts.append(f'<path fill="{fill}" transform="translate({x:.1f} 0) scale({s:.4f} {-s:.4f})" d="{pen.getCommands()}"/>')
        x += g.width * s + tracking * size
    return "".join(parts), x - tracking * size, hi

x, body, top = 0, "", 0
for font, text, size, fill, gap, tr in [
    (didot, "Ariadne", 1000, ink, 0, 0),
    (didot, "’s", 1000, accent, 0, 0),
    (plex, "NSD", 600, accent, 230, 0.06),
]:
    b, x, hi = run(font, text, size, x + gap, fill, tr)
    body, top = body + b, max(top, hi)
pad = 30
svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{-pad} {-top - pad:.0f} {x + 2 * pad:.0f} {top + 2 * pad:.0f}" '
       f'role="img" aria-label="AriadneNSD"><title>AriadneNSD</title>{body}</svg>\n')
open(out, "w", encoding="utf-8", newline="\n").write(svg)
print(f"{x + 2 * pad:.0f} x {top + 2 * pad:.0f}")
