"""M71: 갤러리의 머지 소트 NS 그림(.ns.svg)을 플로차트 템플릿에 넣어 비교 페이지를 만든다.

python journal/assets/tools/make-merge-sort-flowchart.py
"""
import pathlib
import re

root = pathlib.Path(__file__).resolve().parents[3]
svg = (root / "src/apps/gallery/generated/merge-sort.ko.ns.svg").read_text(encoding="utf-8")
svg = re.sub(r"<metadata>.*?</metadata>", "", svg, flags=re.S)  # 모델 JSON은 그림에 필요 없음
tpl = (root / "journal/assets/tools/merge-sort-flowchart.template.html").read_text(encoding="utf-8")
out = root / "journal/assets/2026-11-22-merge-sort-flowchart.html"
with open(out, "w", encoding="utf-8", newline="") as f:
    f.write(tpl.replace("%%NS_SVG%%", svg))
print(out)
