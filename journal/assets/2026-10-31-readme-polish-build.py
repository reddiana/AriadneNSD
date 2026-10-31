# M42 시안을 만든다: 틀(…-readme-polish-template.html)의 {{IMGS}}에 README 그림을 data URI로 넣는다.
# 쓰는 법: python journal/assets/2026-10-31-readme-polish-build.py
import base64, pathlib
here = pathlib.Path(__file__).parent
def uri(name, mime):
    return f"data:{mime};base64," + base64.b64encode((here / name).read_bytes()).decode()
word = uri("2026-10-11-wordmark-n1-warm-grey.svg", "image/svg+xml")
dij = uri("2026-10-31-readme-dijkstra.png", "image/png")
mer = uri("2026-10-31-readme-merge-sort.png", "image/png")
imgs = (f'<img class="word" src="{word}" alt="AriadneNSD">'
        '<p>NS 차트(Nassi-Shneiderman Diagram) 편집기입니다. 블록을 고르고 감싸는 <b>구조 편집</b>으로 차트를 그리면, 레이아웃은 자동으로 맞춰집니다.</p>'
        f'<div class="imgs"><img src="{dij}" alt="다익스트라 최단 경로"><img src="{mer}" alt="병합 정렬"></div>'
        '<p class="cap">프로토타입으로 그린 NS 차트: 다익스트라 최단 경로(왼쪽)와 병합 정렬(오른쪽)</p>')
t = (here / "2026-10-31-readme-polish-template.html").read_text(encoding="utf-8")
(here / "2026-10-31-readme-polish-study.html").write_text(t.replace("{{IMGS}}", imgs), encoding="utf-8")
