# 3.2 편집의 하위 절(여러 블록 선택 규칙, 감싸기 · 풀기, 접기 · 펼치기)을 없애고 그 내용을 요구사항 줄로 옮긴다(2026-10-26).
# 그 절로 가던 링크는 해당 요구사항 ID로 돌린다. 코드 표기(`…`) 안의 예시는 건드리지 않는다.
# 쓰는 법: python -I site/tools/req-subsections-to-rows.py <저장소 폴더>
import re
import sys
from pathlib import Path

repo = Path(sys.argv[1])
REQ = repo / "docs/01-requirements/01-requirements.md"
t = REQ.read_text(encoding="utf-8")

start = t.index("#### 여러 블록 선택 규칙")
end = t.index("### 3.3 레이아웃 · 렌더링")
t = t[:start] + t[end:]


def row(rid, new_text):
    global t
    m = re.search(r"^\| " + rid + r" +\| (.*?) +\| (#P\d) +\|$", t, re.M)
    assert m, rid
    t = t[: m.start()] + f"| {rid} | {new_text} | {m.group(2)} |" + t[m.end():]


row("R-EDIT-05", "여러 블록 선택. 고를 수 있는 범위는 [[#^r-edit\\|R-EDIT-22]] → [[02-interaction-rules#여러 블록 선택\\|상세]]")
row("R-EDIT-06", "선택한 블록들을 새 제어 블록 안에 넣어 감싸기 (IDE의 \"Surround With\"와 같은 기능) → [[02-interaction-rules#감싸기 · 풀기\\|상세]]")
row("R-EDIT-13", "제어 블록 접기/펼치기: 제어 블록의 안쪽을 접는다. If·Case는 갈래별로 → [[02-interaction-rules#접기 · 펼치기\\|상세]]")
row("R-EDIT-14", "접기 영역: 선택 영역을 접기 영역으로 만들어 접고 펼친다. 이름은 [[#^r-edit\\|R-EDIT-23]], 파일에 저장하는 것은 [[#^r-fmt\\|R-FMT-11]] → [[02-interaction-rules#접기 · 펼치기\\|상세]]")
REQ.write_text(t, encoding="utf-8", newline="\n")

TARGET = {"여러 블록 선택 규칙": ("r-edit", "R-EDIT-05"), "감싸기 · 풀기": ("r-edit", "R-EDIT-06"), "접기 · 펼치기": ("r-edit", "R-EDIT-13")}
LINK = re.compile(r"\[\[01-requirements#(여러 블록 선택 규칙|감싸기 · 풀기|접기 · 펼치기)(?:\\?\|[^\]]*)?\]\]")
for top in ["docs", "atelier", "journal", "til"]:
    for f in (repo / top).rglob("*.md"):
        if f.name == "inbox.md":
            continue
        s = f.read_text(encoding="utf-8")
        out = []
        for line in s.split("\n"):
            tab = line.lstrip().startswith("|")
            parts = re.split(r"(`+[^`]*`+)", line)
            for i in range(0, len(parts), 2):
                parts[i] = LINK.sub(lambda m: f"[[01-requirements#^{TARGET[m.group(1)][0]}{'\\|' if tab else '|'}{TARGET[m.group(1)][1]}]]", parts[i])
            out.append("".join(parts))
        n = "\n".join(out)
        if n != s:
            f.write_text(n, encoding="utf-8", newline="\n")
            print(f.relative_to(repo))
