"""Build M48 (manual TOC mockup) from the template, embedding the screenshots and drawings.

Inputs (same folder): 2026-11-02-manual-toc-template.html, -now-*.png (from -shots.spec.ts),
-wrap-*.svg (from -figs.test.ts, drawn by core's renderDoc). Output: -study.html.
"""
import base64
import pathlib

here = pathlib.Path(__file__).parent


def p(name):
    return here / f'2026-11-02-manual-toc-{name}'


def png(name):
    return 'data:image/png;base64,' + base64.b64encode(p(name).read_bytes()).decode()


html = p('template.html').read_text(encoding='utf-8')
html = (
    html.replace('{{NOW_MENU}}', png('now-help-menu.png'))
    .replace('{{NOW_KEYS}}', png('now-shortcuts.png'))
    .replace('{{WRAP_BEFORE}}', p('wrap-before.svg').read_text(encoding='utf-8'))
    .replace('{{WRAP_AFTER}}', p('wrap-after.svg').read_text(encoding='utf-8'))
)
p('study.html').write_text(html, encoding='utf-8')
