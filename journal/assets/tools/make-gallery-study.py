# M70 갤러리 배치 시안을 만든다: 템플릿에 예제 그림을 data URI로 넣는다.
# python journal/assets/tools/make-gallery-study.py
import base64, pathlib
root = pathlib.Path(__file__).resolve().parents[3]
thumbs = root / 'src/apps/web/src/examples/thumbnails'
def uri(p, mime):
    return f'data:{mime};base64,' + base64.b64encode(p.read_bytes()).decode()
img = {n: uri(thumbs / f'{n}.ko.webp', 'image/webp') for n in ['binary-search','quicksort','merge-sort','dijkstra','maze','raft']}
img['dijkstra-big'] = uri(root / 'journal/assets/2026-11-02-readme-dijkstra.ns.svg', 'image/svg+xml')
img['merge-sort-big'] = uri(root / 'journal/assets/2026-11-02-readme-merge-sort.ns.svg', 'image/svg+xml')
tpl = (root / 'journal/assets/tools/gallery-study.template.html').read_text(encoding='utf-8')
for k, v in img.items():
    tpl = tpl.replace('{{' + k + '}}', v)
(root / 'journal/assets/2026-11-22-gallery-layout-study.html').write_text(tpl, encoding='utf-8', newline='\n')
print('ok', len(tpl))
