"""2026-10-17: 아키텍처가 아닌 ADR 열 개를 atelier/decisions/의 결정 기록(DR)으로 옮긴다.

- 파일을 git mv로 옮기고 새 번호(DR-0002~)를 붙인다. DR-0001은 이 결정 자체.
- 링크의 대상(파일 이름)은 모든 .md에서 고친다.
- 글자로 적힌 번호(ADR-0019 등)는 지금의 모습을 적은 문서에서만 고친다.
  세션 기록(atelier/sessions/)과 journal/은 그때의 기록이라 글자는 그대로 둔다.
저장소 맨 위에서 `py journal/assets/2026-10-17-split-decision-records.py`로 돌린다.
"""
import pathlib, re, subprocess

ROOT = pathlib.Path('.')
OLD = ['0011', '0013', '0015', '0019', '0020', '0023', '0024', '0025', '0027', '0028']
MAP = {}  # old number -> (old slug, new slug, new number)
for i, n in enumerate(OLD, start=2):
    f = next((ROOT / 'atelier/adr').glob(f'{n}-*.md'), None)
    if f is None:  # 이미 옮겼으면 decisions/에서 찾는다
        f = next((ROOT / 'atelier/decisions').glob(f'dr-{i:04d}-*.md'))
        rest = f.stem[len('dr-0000-'):]
    else:
        rest = f.stem[len(n) + 1:]
    new = f'{i:04d}'
    MAP[n] = (f'{n}-{rest}', f'dr-{new}-{rest}', new)

HISTORICAL = ('atelier/sessions/', 'journal/')

def is_hist(p):
    s = p.as_posix()
    return any(s.startswith(h) for h in HISTORICAL)

# 1. 파일 옮기기
for n, (old, new, num) in MAP.items():
    if not (ROOT / 'atelier/adr' / f'{old}.md').exists():
        continue
    subprocess.run(['git', 'mv', f'atelier/adr/{old}.md', f'atelier/decisions/{new}.md'], check=True)

# 2. 옮긴 파일의 머리
for n, (old, new, num) in MAP.items():
    p = ROOT / 'atelier/decisions' / f'{new}.md'
    s = p.read_text(encoding='utf-8')
    s = s.replace(f'title: "ADR-{n}:', f'title: "DR-{num}:', 1)
    s = s.replace(f'# ADR-{n}:', f'# DR-{num}:', 1)
    s = s.replace('tags:\n  - adr\n', 'tags:\n  - dr\n', 1)
    note = (f'> - 2026-10-17: 아키텍처 결정 기록 ADR-{n}에서 결정 기록 DR-{num}으로 옮겨 왔다. '
            'ADR은 아키텍처 결정만 두기로 했기 때문이다 → [[dr-0001-split-decision-records|DR-0001]]. '
            '본문은 그대로이고, 번호와 링크만 새 것으로 고쳤다. 본문의 "이 ADR"은 이 기록을 말한다.\n')
    if '으로 옮겨 왔다. ADR은 아키텍처' not in s:  # 다시 돌려도 한 번만
        s = s.replace('> [!NOTE] 이후 변경\n', '> [!NOTE] 이후 변경\n' + note, 1)
    p.write_text(s, encoding='utf-8', newline='\n')

# 3. 모든 문서의 링크와 번호
link_re = {n: re.compile(r'\[\[' + re.escape(old) + r'(?=[]|#\\])') for n, (old, _, _) in MAP.items()}
text_re = {n: re.compile(r'ADR-' + n + r'(?!\d)') for n in MAP}
changed = []
for p in ROOT.rglob('*.md'):
    if '.git' in p.parts or 'node_modules' in p.parts:
        continue
    s0 = s = p.read_text(encoding='utf-8')
    for n, (old, new, num) in MAP.items():
        s = link_re[n].sub('[[' + new, s)
        if not is_hist(p):
            s = text_re[n].sub(f'DR-{num}', s)
            s = s.replace(f'atelier/adr/{old}.md', f'atelier/decisions/{new}.md')
    if s != s0:
        p.write_text(s, encoding='utf-8', newline='\n')
        changed.append(p.as_posix())

for n, (old, new, num) in MAP.items():
    print(f'ADR-{n} {old} -> DR-{num} {new}')
print(len(changed), 'files changed')
for c in sorted(changed):
    print('  ', c)
