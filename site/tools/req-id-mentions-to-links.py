# 글 속에 코드 표기로만 적은 요구사항 ID(`R-FMT-03`)를 링크([[01-requirements#^r-fmt|R-FMT-03]])로 바꾼다(2026-10-25 → DR-0016).
# 형식을 설명하는 예시(아래 SKIP)와 메인테이너의 inbox 원문은 건드리지 않는다.
# 쓰는 법: python -I site/tools/req-id-mentions-to-links.py <저장소 폴더>
import re
import sys
from pathlib import Path

repo = Path(sys.argv[1])
REQ = repo / "docs/01-requirements/01-requirements.md"
anchor, cur = {}, []
for line in REQ.read_text(encoding="utf-8").split("\n"):
    m = re.match(r"^\| (R-[A-Z]+-\d\d) +\|", line)
    if m:
        cur.append(m.group(1))
    a = re.match(r"^\^(r-[a-z0-9-]+)$", line)
    if a:
        for x in cur:
            anchor[x] = a.group(1)
        cur = []

SKIP_FILES = {"inbox.md", "dr-0016-requirement-ids.md", "requirement-changes.md"}
# 형식을 설명하는 줄: "ID(`R-EDIT-06` 등)", 요구사항 문서의 읽는 법, DR 목록의 한 줄
SKIP_LINE = re.compile(r"`R-[A-Z]+-\d\d` 등\)|^> - 요구사항마다 ID|dr-0016-requirement-ids\\?\|0016")
MENTION = re.compile(r"`(R-[A-Z]+)-(\d\d|\*)`")


def link(m, in_table, here):
    rid = f"{m.group(1)}-{m.group(2)}"
    if m.group(2) == "*":
        a = "r-" + m.group(1)[2:].lower()
    elif rid in anchor:
        a = anchor[rid]
    else:
        return m.group(0)
    sep = "\\|" if in_table else "|"
    return f"[[{'' if here else '01-requirements'}#^{a}{sep}{rid}]]"


changed = 0
for top in ["docs", "atelier", "journal", "til"]:
    for f in (repo / top).rglob("*.md"):
        if f.name in SKIP_FILES:
            continue
        here = f == REQ
        out = []
        for line in f.read_text(encoding="utf-8").split("\n"):
            if not SKIP_LINE.search(line):
                tab = line.lstrip().startswith("|")
                line = MENTION.sub(lambda m: link(m, tab, here), line)
            out.append(line)
        new = "\n".join(out)
        if new != f.read_text(encoding="utf-8"):
            f.write_text(new, encoding="utf-8", newline="\n")
            changed += 1
            print(f.relative_to(repo))
print(f"# 바꾼 파일 {changed}개")
