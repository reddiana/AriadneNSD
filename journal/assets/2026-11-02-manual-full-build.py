"""Build M51 (the whole Korean user guide as one page) from the built manual.

Run `pnpm --filter @ariadne-nsd/manual build` in src/ first. This inlines the style and the
pictures of src/apps/manual/dist/ko/index.html and adds a review band on top.
Output: 2026-11-02-manual-full-study.html
"""
import base64
import pathlib
import re

here = pathlib.Path(__file__).parent
dist = here.parent.parent / 'src' / 'apps' / 'manual' / 'dist'
html = (dist / 'ko' / 'index.html').read_text(encoding='utf-8')
css = (dist / 'style.css').read_text(encoding='utf-8')


def image(match):
    data = (dist / match.group(1)).read_bytes()
    return 'src="data:image/png;base64,' + base64.b64encode(data).decode() + '"'


html = re.sub(r'src="\.\./(img/[^"]+\.png)"', image, html)
html = html.replace('<link rel="stylesheet" href="../style.css" />', '<style>\n' + css + '\n</style>')
html = html.replace('<title>사용법 – AriadneNSD</title>', '<title>M51 사용법 초안</title>')
band = (
    '<div style="background:#fff6e0;color:#5a4410;font-size:13.5px;padding:10px 16px">'
    '시안 M51 · 2026-11-02 · <code>ariadnensd.com/manual/ko/</code>의 전체 초안(5분 둘러보기 + 찾아보기). '
    '그림은 모두 MVP를 조작하며 찍었고, 단축키 전체는 앱의 단축키 목록에서 뽑았습니다. 영어판도 같은 내용으로 있습니다. '
    '이 페이지 안의 앱 · 영어판 링크는 사이트에 올린 뒤에 동작합니다.</div>'
)
html = html.replace('<body>', '<body>\n' + band, 1)
# The artifact page wraps the content in its own document: keep the head's title and style and
# the body's content, and follow the viewer's theme switch as well as the system setting.
head = re.search(r'<head>(.*)</head>', html, re.S).group(1)
body = re.search(r'<body>(.*)</body>', html, re.S).group(1)
head = re.sub(r'<meta [^>]*>\s*', '', head)
dark = re.search(r'@media \(prefers-color-scheme: dark\) \{\s*:root \{(.*?)\}\s*\}', head, re.S)
tokens = dark.group(1)
head = head.replace(
    dark.group(0),
    '@media (prefers-color-scheme: dark) {\n  :root:not([data-theme="light"]) {'
    + tokens
    + '}\n}\n:root[data-theme="dark"] {'
    + tokens
    + '}',
)
page = head.strip() + '\n' + body.strip() + '\n'
(here / '2026-11-02-manual-full-study.html').write_text(page, encoding='utf-8')
