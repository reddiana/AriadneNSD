"""Build M52 (where the key hint shows) from the template and the app's own screenshots.

The screenshots come from the user guide's pictures (src/apps/web/manual-shots): the last block
selected (tour-3a-start) and today's hint at the bottom (ref-insert-hint). Output: -study.html.
"""
import base64
import pathlib

here = pathlib.Path(__file__).parent
img = here.parent.parent / 'src' / 'apps' / 'manual' / 'img' / 'ko'


def png(name):
    return 'data:image/png;base64,' + base64.b64encode((img / name).read_bytes()).decode()


html = (here / '2026-11-02-key-hint-template.html').read_text(encoding='utf-8')
html = html.replace('{{BASE}}', png('tour-3a-start.png')).replace('{{NOW}}', png('ref-insert-hint.png'))
(here / '2026-11-02-key-hint-study.html').write_text(html, encoding='utf-8')
