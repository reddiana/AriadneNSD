# 요구사항의 블록 ID(^web-file)를 번호 ID(WEB-02)로 바꾸고, 요구사항 목록을 표로 바꾼다(2026-10-25 → DR-0016).
# 한 번 쓰고 마는 스크립트다. 무엇을 어떻게 바꿨는지 남기려고 저장소에 둔다.
# 쓰는 법: python -I site/tools/req-ids-to-table.py <저장소 폴더>
#   - docs/01-requirements/01-requirements.md의 요구사항 목록을 표로 바꾼다
#   - docs/ · atelier/ · journal/ · til/의 링크와 글 속 ID를 새 ID로 바꾼다
#   - 옛 ID → 새 ID 대응표를 표준 출력으로 낸다
import re
import sys
from pathlib import Path

repo = Path(sys.argv[1])
req = repo / "docs/01-requirements/01-requirements.md"
PREFIX = {
    "all": "ALL", "obs": "OBS", "dsk": "DSK", "web": "WEB", "gd": "GD", "cf": "CF",
    "skill": "SKILL", "ide": "IDE", "blk": "BLK", "edit": "EDIT", "help": "EDIT",
    "lay": "LAY", "fmt": "FMT", "exp": "EXP", "imp": "EXP", "code": "CODE",
    "rep": "REP", "nfr": "NFR",
}
ITEM = re.compile(r"^- \[ \] #(P\d) (.*) \^([a-z0-9-]+)$")
NFR = re.compile(r"^- (\*\*[^*]+:\*\*) (.*) \^(nfr-[a-z0-9-]+)$")

lines = req.read_text(encoding="utf-8").split("\n")
mapping, counters = {}, {}
for line in lines:
    m = ITEM.match(line) or NFR.match(line)
    if m:
        old = m.group(3)
        p = PREFIX[old.split("-")[0]]
        counters[p] = counters.get(p, 0) + 1
        mapping[old] = f"{p}-{counters[p]:02d}"

ids = "|".join(sorted(map(re.escape, mapping), key=len, reverse=True))
LINK = re.compile(r"(\[\[(?:01-requirements)?#)\^(" + ids + r")(?![a-z0-9-])")
CODE = re.compile(r"`\^(" + ids + r")`")


def relink(text):
    text = LINK.sub(lambda m: m.group(1) + mapping[m.group(2)], text)
    return CODE.sub(lambda m: "`" + mapping[m.group(1)] + "`", text)


def cell(text):
    # 표 안에서는 위키링크의 별칭 구분자를 \| 로
    return re.sub(r"\[\[([^\]|]*)\|", r"[[\1\\|", relink(text))


out, i = [], 0
while i < len(lines):
    m = ITEM.match(lines[i]) or NFR.match(lines[i])
    if not m:
        out.append(relink(lines[i]))
        i += 1
        continue
    nfr = bool(NFR.match(lines[i]))
    if out and out[-1].strip():
        out.append("")
    out.append("| ID | 품질 | 요구사항 |" if nfr else "| ID | 요구사항 | 우선순위 |")
    out.append("| --- | --- | --- |")
    while i < len(lines) and (m := (NFR.match(lines[i]) if nfr else ITEM.match(lines[i]))):
        body = m.group(2)
        i += 1
        subs = []
        while i < len(lines) and lines[i].startswith("\t- "):
            subs.append(lines[i][3:])
            i += 1
        if subs:
            body += "".join("<br>· " + s for s in subs)
        nid = mapping[m.group(3)]
        if nfr:
            out.append(f"| {nid} | {m.group(1).strip('*').rstrip(':')} | {cell(body)} |")
        else:
            out.append(f"| {nid} | {cell(body)} | #{m.group(1)} |")
    if i < len(lines) and lines[i].strip():
        out.append("")

req.write_text("\n".join(out), encoding="utf-8", newline="\n")

changed = 0
for top in ["docs", "atelier", "journal", "til"]:
    for f in (repo / top).rglob("*.md"):
        if f == req:
            continue
        t = f.read_text(encoding="utf-8")
        n = relink(t)
        if n != t:
            f.write_text(n, encoding="utf-8", newline="\n")
            changed += 1

print(f"# 바꾼 파일 {changed}개")
for old, new in mapping.items():
    print(f"{old}\t{new}")
