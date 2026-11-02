"""Build M53 (how the canvas shows focus) from the template and the app's own screenshots.

The screenshots are the MVP with the "binary search" example (1100x700): nothing selected
(-none.png) and the first header selected (-first.png). Output: -study.html.
"""
import base64
import pathlib

here = pathlib.Path(__file__).parent


def png(name):
    return 'data:image/png;base64,' + base64.b64encode((here / name).read_bytes()).decode()


html = (here / '2026-11-03-canvas-focus-template.html').read_text(encoding='utf-8')
html = html.replace('{{NONE}}', png('2026-11-03-canvas-focus-none.png')).replace(
    '{{FIRST}}', png('2026-11-03-canvas-focus-first.png'))
(here / '2026-11-03-canvas-focus-study.html').write_text(html, encoding='utf-8')
