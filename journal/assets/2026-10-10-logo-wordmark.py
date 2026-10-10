"""문자 로고를 글꼴 없이도 보이도록 윤곽선 SVG로 만든다.
usage: wordmark.py <didot.ttf> <plexmono.ttf> <out.svg> <ink> <accent>
"""
import sys
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.boundsPen import BoundsPen

didot, plex, out, ink, accent = sys.argv[1:6]

def run(path, text, size, x, tracking=0.0):
    f = TTFont(path)
    gs, cmap, upm = f.getGlyphSet(), f.getBestCmap(), f["head"].unitsPerEm
    s = size / upm
    parts, ymax, ymin = [], 0, 0
    for ch in text:
        g = gs[cmap[ord(ch)]]
        pen = SVGPathPen(gs)
        g.draw(pen)
        bp = BoundsPen(gs)
        g.draw(bp)
        if bp.bounds:
            ymin, ymax = min(ymin, bp.bounds[1] * s), max(ymax, bp.bounds[3] * s)
        parts.append(f'<path transform="translate({x:.1f} 0) scale({s:.4f} {-s:.4f})" d="{pen.getCommands()}"/>')
        x += g.width * s + tracking * size
    return "".join(parts), x - tracking * size, ymin, ymax

a, x1, lo1, hi1 = run(didot, "Ariadne", 1000, 0)
b, x2, lo2, hi2 = run(plex, "NSD", 600, x1 + 80, 0.06)
pad = 30
top, bottom = max(hi1, hi2) + pad, -min(lo1, lo2) + pad
svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{-pad} {-top:.0f} {x2 + 2 * pad:.0f} {top + bottom:.0f}" role="img" aria-label="AriadneNSD">'
       f'<title>AriadneNSD</title><g fill="{ink}">{a}</g><g fill="{accent}">{b}</g></svg>\n')
open(out, "w", encoding="utf-8").write(svg)
print(f"{x2 + 2 * pad:.0f} x {top + bottom:.0f}")
