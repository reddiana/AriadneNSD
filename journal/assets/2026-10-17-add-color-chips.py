"""시각 디자인 명세의 색 코드와 색 토큰 앞에 색 칩을 붙인다 (2026-10-17, 메인테이너 inbox).

- `#rrggbb`만 든 코드 조각, 그리고 원시 · 문서 팔레트의 색 토큰 이름만 든 코드 조각 앞에 칩을 붙인다.
- UI 테마의 토큰(`ui.*`)은 밝은 테마와 어두운 테마의 값이 달라 토큰에는 칩을 붙이지 않는다(값에는 붙는다).
- 토큰의 색은 문서 안의 3.2 원시 팔레트와 3.3 문서 팔레트 표에서 읽는다. 값이 바뀌면 다시 돌리면 된다.
- 붙였던 칩은 먼저 모두 걷어 내므로 몇 번 돌려도 같다.
- 3.2 원시 팔레트 표(값이 바로 옆에 있음)와 9.3 흑백 인쇄 팔레트(토큰의 색이 기본 팔레트와 다름)에서는 토큰에 칩을 붙이지 않는다.

사용: py journal/assets/2026-10-17-add-color-chips.py
"""
import re
import sys
from pathlib import Path

DOC = Path(__file__).resolve().parents[2] / "docs/02-ux-design/04-visual-design.md"
CHIP = ('<span class="color-chip" style="display:inline-block;width:0.9em;height:0.9em;'
        'background:{c};border:1px solid #8888;vertical-align:-0.1em"></span> ')
CHIP_RE = re.compile(r'<span class="color-chip"[^>]*></span> ')

text = CHIP_RE.sub("", DOC.read_text(encoding="utf-8"))
lines = text.split("\n")

# 원시 팔레트: | `ink.900` | `#151a22` | 9 | `fill.paper` | `#ffffff` | 100 |
prim, section = {}, ""
for l in lines:
    if l.startswith("#"):
        section = l
    if not section.startswith("### 3.2"):
        continue
    for name, hexv in re.findall(r"`([a-z]+\.[a-z0-9-]+)` \| `(#[0-9a-fA-F]{6})`", l):
        prim[name] = hexv
# 문서 팔레트: | `block.process` | `fill.slate` | …
sem = {}
for l in lines:
    m = re.match(r"\| `([a-z]+\.[a-z0-9-]+)` \| `([a-z]+\.[a-z0-9-]+)` \|", l)
    if m and m.group(2) in prim:
        sem[m.group(1)] = prim[m.group(2)]
colors = {**prim, **sem}

out, fence, section = [], False, ""
for l in lines:
    if l.startswith("```"):
        fence = not fence
    if l.startswith("#"):
        section = l
    if fence:
        out.append(l)
        continue
    skip_tokens = section.startswith("### 3.2") or section.startswith("### 9.3")

    def chip(m):
        s = m.group(1)
        if re.fullmatch(r"#[0-9a-fA-F]{6}", s):
            return CHIP.format(c=s) + m.group(0)
        if not skip_tokens and s in colors:
            return CHIP.format(c=colors[s]) + m.group(0)
        return m.group(0)

    out.append(re.sub(r"`([^`\n]+)`", chip, l))

DOC.write_text("\n".join(out), encoding="utf-8")
print(f"tokens: {len(colors)}, chips: {sum(o.count('color-chip') for o in out)}", file=sys.stderr)
