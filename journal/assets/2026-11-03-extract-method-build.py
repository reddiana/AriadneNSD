"""Build M54 (새 Method로 빼기 시안) from the template and the pictures the app's renderer drew.

The pictures come from 2026-11-03-extract-method-figs.test.ts (see its header for how to run it),
which writes -figs.json: one SVG per picture and the block font subset as WOFF.
Output: 2026-11-03-extract-method-study.html.
"""
import json
import pathlib

here = pathlib.Path(__file__).parent
figs = json.loads((here / '2026-11-03-extract-method-figs.json').read_text(encoding='utf-8'))
html = (here / '2026-11-03-extract-method-template.html').read_text(encoding='utf-8')
font = ("@font-face { font-family: '%s'; src: url(data:font/woff;base64,%s) format('woff'); }"
        % (figs.pop('fontFamily'), figs.pop('fontWoff')))
html = html.replace('{{FONT}}', font)
for key, svg in figs.items():
    html = html.replace('{{%s}}' % key, svg)
assert '{{' not in html, 'a picture is missing'
(here / '2026-11-03-extract-method-study.html').write_text(html, encoding='utf-8')
