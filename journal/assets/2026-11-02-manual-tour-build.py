"""Build M49 (the "5분 둘러보기" draft) from the template, embedding the screenshots.

Screenshots come from 2026-11-02-manual-tour-shots.spec.ts (copy it into src/apps/web/e2e and run
it with Playwright). Output: 2026-11-02-manual-tour-study.html.
"""
import base64
import pathlib
import re

here = pathlib.Path(__file__).parent
html = (here / '2026-11-02-manual-tour-template.html').read_text(encoding='utf-8')


def embed(match):
    data = (here / f'2026-11-02-manual-tour-{match.group(1)}.png').read_bytes()
    return 'data:image/png;base64,' + base64.b64encode(data).decode()


html = re.sub(r'\{\{([0-9a-z-]+)\}\}', embed, html)
(here / '2026-11-02-manual-tour-study.html').write_text(html, encoding='utf-8')
