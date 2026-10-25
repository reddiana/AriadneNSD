# 요구사항 ID를 R- 체계로 바꾼다(2026-10-25 → DR-0016). req-ids-to-table.py 다음에 한 번 쓰고 마는 스크립트다.
# 쓰는 법: python -I site/tools/req-ids-to-r.py <저장소 폴더>
#   - 01-requirements.md: ID가 없던 요구사항에 ID를 매기고, 블록 종류 표를 블록 요구사항 표와 합치고,
#     ID 앞에 R-를 붙이고, 요구사항 표마다 블록 ID(^r-fmt)를 단다
#   - 모든 문서의 링크를 [[01-requirements#^r-fmt|R-FMT-03]]으로 바꾼다 (Obsidian은 표의 한 줄을 가리키지 못한다)
#   - 예전에 없앤 요구사항(^exp-png-folded, ^edit-region)으로 가는 링크는 요구사항 변경 기록으로 돌린다
import re
import sys
from pathlib import Path

repo = Path(sys.argv[1])
REQ = repo / "docs/01-requirements/01-requirements.md"
t = REQ.read_text(encoding="utf-8")
HEAD = "| ID | 요구사항 | 우선순위 |\n| --- | --- | --- |\n"


def sub(old, new):
    global t
    assert t.count(old) == 1, old[:60]
    t = t.replace(old, new)


# 1. 핵심 원칙
sub("""- NS 차트는 **트리 구조**다. 이 프로그램은 도형을 자유롭게 배치하는 그림판이 아니라, **구조를 편집하면 그림이 자동으로 그려지는 편집기**다. 사용자는 좌표를 직접 다루지 않는다. → [[0004-structure-editor|ADR-0004]]
- 구조적으로 잘못된 차트(예: 반복문 밖으로 튀어나온 블록)는 만들 수 없어야 한다.
- **주 사용자는 실무에서 설계 문서를 쓰는 사람이다.** 코드와 함께 두는 문서, PDF와 인쇄의 품질을 앞에 둔다. 교육용 기능(실행 애니메이션 등)은 그 뒤다.
- **저장 파일 하나가 그림이자 원본이다.** 파일은 어디서나 열리는 SVG 이미지이고, 그 안에 다이어그램 모델이 함께 들어 있어 다시 열어 편집할 수 있다. → [[0005-model-embedded-svg|ADR-0005]]
""", """| ID | 원칙 |
| --- | --- |
| CORE-01 | NS 차트는 **트리 구조**다. 이 프로그램은 도형을 자유롭게 배치하는 그림판이 아니라, **구조를 편집하면 그림이 자동으로 그려지는 편집기**다. 사용자는 좌표를 직접 다루지 않는다. → [[0004-structure-editor\\|ADR-0004]] |
| CORE-02 | 구조적으로 잘못된 차트(예: 반복문 밖으로 튀어나온 블록)는 만들 수 없어야 한다. |
| CORE-03 | **주 사용자는 실무에서 설계 문서를 쓰는 사람이다.** 코드와 함께 두는 문서, PDF와 인쇄의 품질을 앞에 둔다. 교육용 기능(실행 애니메이션 등)은 그 뒤다. |
| CORE-04 | **저장 파일 하나가 그림이자 원본이다.** 파일은 어디서나 열리는 SVG 이미지이고, 그 안에 다이어그램 모델이 함께 들어 있어 다시 열어 편집할 수 있다. → [[0005-model-embedded-svg\\|ADR-0005]] |
""")

# 2. 배포 대상 표
for i, name in enumerate(["| 웹 (정적 페이지) |", "| Obsidian 플러그인 |", "| 데스크톱 애플리케이션 |", "| Google Drive |",
                          "| Confluence |", "| IDE 플러그인 (VSCode, IntelliJ) |", "| Claude skill |"], 1):
    sub("\n" + name, f"\n| TGT-{i:02d} " + name)
sub("| 배포 대상 | 언제 | 값 | 저장하는 것 | 절 |\n| --- | --- | --- | --- | --- |",
    "| ID | 배포 대상 | 언제 | 값 | 저장하는 것 | 절 |\n| --- | --- | --- | --- | --- | --- |")
sub("`.ns`와 `.ns.svg`의 파일 내용은 **동일한 형식**(다이어그램 모델이 포함된 SVG)이다. 뒤에 `.svg`를 붙이거나 떼는 것만으로 서로 열 수 있다.\n\n모든 무료 배포 대상에 공통:",
    "모든 배포 대상에 공통:")
sub("| ALL-01 | 후원 링크(Buy Me a Coffee): 편집을", "| ALL-01 | 무료 배포 대상의 후원 링크(Buy Me a Coffee): 편집을")
sub("데스크톱: 도움말·정보 창에 둔다 | #P3 |\n",
    "데스크톱: 도움말·정보 창에 둔다 | #P3 |\n| ALL-02 | `.ns`와 `.ns.svg`의 파일 내용은 **같은 형식**(다이어그램 모델이 포함된 SVG)이다. 뒤에 `.svg`를 붙이거나 떼는 것만으로 서로 열 수 있다 | #P0 |\n")

# 2.4 ~ 2.7, 3.7: 절 머리글 속의 요구사항
sub("웹 버전에 Drive 연동을 더한 형태다. Drive에서 만드는 파일은 `.ns.svg`로 저장한다. →", "웹 버전에 Drive 연동을 더한 형태다. →")
sub("| GD-04 | Drive 미리보기와 썸네일에서 다이어그램 그림이 보임 | #P1 |\n",
    "| GD-04 | Drive 미리보기와 썸네일에서 다이어그램 그림이 보임 | #P1 |\n| GD-05 | Drive에서 만드는 파일은 `.ns.svg`로 저장한다 | #P1 |\n")
sub("다른 배포 대상은 모두 무료이고, 이 대상은 유료로 판다. 기능은 무료 버전과 같고, Confluence 안에서 바로 쓸 수 있다는 편의로 가치를 낸다.",
    "Confluence 안에서 바로 쓸 수 있다는 편의로 가치를 낸다.")
sub("셸)의 자리를 남겨 둔다 → [[0036-code-layout\\|ADR-0036]] | #P2 |\n",
    "셸)의 자리를 남겨 둔다 → [[0036-code-layout\\|ADR-0036]] | #P2 |\n| CF-02 | 유료로 판다(다른 배포 대상은 모두 무료다). 기능은 무료 버전과 같다 | #P2 |\n")
sub("코드를 짜는 자리에서 그 코드를 NS 다이어그램으로 보고 고친다. **코드가 원본이다.** 다이어그램은 코드에서 만들어 보여 주는 것이고, 다이어그램을 고치면 코드가 바뀐다. `.ns` 파일은 만들지 않는다. 그림이 필요하면 내보내기로 뽑는다.",
    "코드를 짜는 자리에서 그 코드를 NS 다이어그램으로 보고 고친다.")
sub("코드가 바로 따라 바뀐다 | #P3 |\n",
    "코드가 바로 따라 바뀐다 | #P3 |\n| IDE-07 | **코드가 원본이다.** 다이어그램은 코드에서 만들어 보여 주는 것이고, 다이어그램을 고치면 코드가 바뀐다. `.ns` 파일은 만들지 않는다. 그림이 필요하면 내보내기로 뽑는다 | #P2 |\n")
sub("정확하게 알린다. 서버가 없으므로 자동으로 보내지 않는다. 사용자가 보낼 내용을 보고 직접 보낸다.", "정확하게 알린다.")
sub("\"이 문제를 알리시겠어요?\"를 묻는다 | #P3 |\n",
    "\"이 문제를 알리시겠어요?\"를 묻는다 | #P3 |\n| REP-03 | 보고서를 자동으로 보내지 않는다(서버가 없다). 사용자가 보낼 내용을 보고 직접 보낸다 | #P3 |\n")

# 3.1 블록: 블록 종류 표와 블록 요구사항 표를 하나로
old_blk = {m.group(1): m.group(2) for m in re.finditer(r"^\| (BLK-0\d) \| (.*) \| #P\d \|$", t, re.M)}
start = t.index("| 블록 | 설명 | 우선순위 |")
end = t.index("\n\n", t.index("| BLK-06 |")) + 1
rows = [
    ("처리(Process) 블록: 한 단계의 명령", "P0"),
    ("선택(If-Then-Else) 블록: 조건에 따라 참 갈래나 거짓 갈래를 실행", "P0"),
    ("전위 판정 반복(While) 블록: 조건을 먼저 검사하고 본문을 반복", "P0"),
    ("후위 판정 반복(Do-While / Repeat-Until) 블록: 본문을 먼저 실행하고 조건을 검사", "P0"),
    (old_blk["BLK-02"], "P0"),
    ("횟수 반복(For) 블록: While의 변형", "P0"),
    (old_blk["BLK-04"], "P1"),
    (old_blk["BLK-05"], "P1"),
    (old_blk["BLK-06"], "P2"),
    (old_blk["BLK-01"], "P1"),
    (old_blk["BLK-03"], "P1"),
    ("탈출(Exit / Break / Return) 블록: 반복 · 함수 탈출", "P2"),
    ("병렬 처리(Parallel) 블록: 동시 실행 갈래", "P2"),
    ("주석 블록", "P2"),
]
t = t[:start] + HEAD + "".join(f"| BLK-{i:02d} | {r} | #{p} |\n" for i, (r, p) in enumerate(rows, 1)) + "\n" + \
    "블록과 머리를 어떤 모양으로 그리는지는 설계에 있다 → [[02-interaction-rules#블록의 모양]]\n" + t[end:]
BLK = {"BLK-02": "BLK-05", "BLK-04": "BLK-07", "BLK-05": "BLK-08", "BLK-06": "BLK-09", "BLK-01": "BLK-10", "BLK-03": "BLK-11"}

# 3.2 편집의 하위 절 속 요구사항
sub("(모든 배포 대상) | #P1 |\n",
    "(모든 배포 대상) | #P1 |\n| EDIT-22 | 여러 블록 선택은 언제나 **같은 부모 아래에서 연속으로 붙어 있는 블록 범위**다 → [[0008-contiguous-selection\\|ADR-0008]] | #P0 |\n"
    "| EDIT-23 | 접기 영역에 이름을 붙인다 → [[0017-fold-name-in-model\\|ADR-0017]] | #P1 |\n")
sub("선택은 항상 **같은 부모 아래에서 연속으로 붙어 있는 블록 범위**다.", "선택의 범위는 [[#EDIT-22]]이다.")
sub("접히는 것은 두 가지다: **제어 블록의 안쪽**([[#EDIT-13]])과 **접기 영역**([[#EDIT-14]]). 접기 영역에는 이름을 붙일 수 있고, 접힘 상태와 이름은 파일에 함께 저장한다. 저장되는 그림은 지금 화면 그대로다. → [[0017-fold-name-in-model|ADR-0017]], [[0018-save-as-shown|ADR-0018]]",
    "접히는 것은 두 가지다: **제어 블록의 안쪽**([[#EDIT-13]])과 **접기 영역**([[#EDIT-14]]). 접기 영역의 이름은 [[#EDIT-23]], 접힘 상태와 이름을 파일에 저장하는 것은 [[#FMT-11]]이다.")
sub("(모델에는 텍스트가 그대로 남음) | #P1 |\n",
    "(모델에는 텍스트가 그대로 남음) | #P1 |\n| FMT-11 | 접힘 상태와 접기 영역의 이름은 파일에 함께 저장한다. 저장되는 그림은 지금 화면 그대로다 → [[0017-fold-name-in-model\\|ADR-0017]], [[0018-save-as-shown\\|ADR-0018]] | #P1 |\n")

# R- 붙이기와 표마다 블록 ID
IDROW = re.compile(r"^\| ([A-Z]+-\d\d) \|", re.M)
interim = {}  # 중간 ID(오늘 잠깐 쓴 WEB-02 등) → R- ID
def renum(m):
    return f"| R-{m.group(1)} |"
t = IDROW.sub(renum, t)
lines, out, anchor_of, seen = t.split("\n"), [], {}, {}
i = 0
while i < len(lines):
    out.append(lines[i])
    m = re.match(r"^\| (R-([A-Z]+)-\d\d) \|", lines[i])
    if m:
        area = m.group(2).lower()
        # 이 표의 첫 ID 줄에서 앵커 이름을 정한다
        if not (out[-2].startswith("| R-") if len(out) > 1 else False):
            seen[area] = seen.get(area, 0) + 1
            cur = f"r-{area}" + (f"-{seen[area]}" if seen[area] > 1 else "")
        anchor_of[m.group(1)] = cur
        if i + 1 == len(lines) or not lines[i + 1].startswith("|"):
            out += ["", "^" + cur]
    i += 1
t = "\n".join(out)

for rid in anchor_of:
    old = rid[2:]
    interim[old] = rid
for o, n in BLK.items():
    interim[o] = "R-" + n
# 중간 ID의 BLK-01~06은 위 BLK 표를 따른다. 새로 생긴 BLK(01~04, 06, 12~14)는 링크된 적이 없다
for k in ["BLK-01", "BLK-02", "BLK-03", "BLK-04", "BLK-05", "BLK-06"]:
    interim[k] = "R-" + BLK[k]

ids = "|".join(sorted(map(re.escape, interim), key=len, reverse=True))


def link(target, rid, in_table):
    sep = "\\|" if in_table else "|"
    return f"[[{target}#^{anchor_of[rid]}{sep}{rid}]]"


LINK = re.compile(r"\[\[(01-requirements)?#(" + ids + r")(?:\\?\|[^\]]*)?\]\]")
CODE = re.compile(r"`(" + ids + r")`")
OLD = {"exp-png-folded": "exp-png-folded", "edit-region": "edit-region"}
OLDLINK = re.compile(r"\[\[01-requirements#\^(exp-png-folded|edit-region)\]\]")


def relink(text, here_req):
    res = []
    for line in text.split("\n"):
        tab = line.lstrip().startswith("|")
        line = LINK.sub(lambda m: link(m.group(1) or "", interim[m.group(2)], tab), line)
        line = CODE.sub(lambda m: "`" + interim[m.group(1)] + "`", line)
        line = OLDLINK.sub(lambda m: f"[[requirement-changes#^r-before-ids{'\\|' if tab else '|'}{m.group(1)}]]", line)
        res.append(line)
    return "\n".join(res)


REQ.write_text(relink(t, True), encoding="utf-8", newline="\n")
changed = 0
for top in ["docs", "atelier", "journal", "til"]:
    for f in (repo / top).rglob("*.md"):
        if f == REQ:
            continue
        s = f.read_text(encoding="utf-8")
        n = relink(s, False)
        if n != s:
            f.write_text(n, encoding="utf-8", newline="\n")
            changed += 1
print(f"# 바꾼 파일 {changed}개, 요구사항 {len(anchor_of)}개")
for old, new in sorted(interim.items(), key=lambda x: x[1]):
    print(f"{old}\t{new}\t{anchor_of[new]}")
