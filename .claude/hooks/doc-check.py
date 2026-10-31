"""문서 검사 훅 (Claude Code의 PostToolUse).

Claude가 파일을 고칠 때마다 돌아, 바뀐 마크다운 문서에서 두 가지를 찾는다.
1. 표의 칸 수가 머리줄과 다른 줄 (표 안 위키링크의 | 를 \\| 로 쓰지 않으면 칸이 늘어난다)
2. [[문서#제목]] 링크의 제목이 그 문서에 없는 것

찾으면 stderr에 적고 2로 끝난다. Claude Code는 그 글을 Claude에게 보여 주어 바로 고치게 한다.
손으로도 돌릴 수 있다: python .claude/hooks/doc-check.py --all
"""
import json, pathlib, re, subprocess, sys

ROOT = pathlib.Path(__file__).resolve().parents[2]
DIRS = ['docs', 'atelier', 'journal', 'til']


def md_files():
    out = []
    for d in DIRS:
        out += (ROOT / d).rglob('*.md')
    return out


def checked(p):
    """검사할 문서인가. 지난 기록(세션 기록)은 그때의 모습이라 고치지 않는다."""
    r = p.relative_to(ROOT).as_posix()
    return p.suffix == '.md' and r.split('/')[0] in DIRS and not r.startswith('atelier/sessions/')


def changed_files():
    """git이 보기에 바뀌었거나 새로 생긴 문서."""
    try:
        res = subprocess.run(['git', '-C', str(ROOT), 'status', '--porcelain', '-uall', '-z'],
                             capture_output=True, check=True)
    except Exception:
        return []
    out = []
    for item in res.stdout.decode('utf-8', 'replace').split('\0'):
        if len(item) > 3:
            p = ROOT / item[3:]
            if p.exists():
                out.append(p)
    return out


def cells(line):
    t = re.sub(r'`[^`]*`', '', line).replace('\\|', '')
    return t.count('|')


def table_problems(p, lines):
    head = None
    for i, l in enumerate(lines, 1):
        s = l.lstrip('> ').rstrip()
        if s.startswith('|'):
            n = cells(s)
            if head is None:
                head = n
            elif n != head:
                yield f'{p}:{i}: 표의 칸 수가 머리줄과 다름 ({n - 1}칸, 머리줄 {head - 1}칸): {s[:80]}'
        else:
            head = None


def main():
    sys.stderr.reconfigure(encoding='utf-8')
    if '--all' in sys.argv:
        targets = md_files()
    else:
        try:
            data = json.load(sys.stdin)
        except Exception:
            data = {}
        targets = changed_files()
        f = (data.get('tool_input') or {}).get('file_path')
        if f:
            targets.append(pathlib.Path(f).resolve())
    targets = sorted({p for p in targets if p.is_relative_to(ROOT) and checked(p)})
    if not targets:
        return 0

    heads = {}
    for p in md_files():
        t = p.read_text(encoding='utf-8')
        heads[p.stem] = {m.group(1).strip() for m in re.finditer(r'^#{1,6} (.+)$', t, re.M)}

    problems = []
    for p in targets:
        rel = p.relative_to(ROOT).as_posix()
        t = p.read_text(encoding='utf-8')
        problems += table_problems(rel, t.split('\n'))
        # 코드 표기로 감싼 링크는 형식을 보이는 예시라 검사하지 않는다
        code = [(c.start(), c.end()) for c in re.finditer(r'```.*?```|`\[\[[^`\n]*`', t, flags=re.S)]
        for m in re.finditer(r'\[\[([^\]|#\\]+)#([^\]|\\^]+)', t):
            if any(a <= m.start() < b for a, b in code):
                continue
            f, h = m.group(1).split('/')[-1], m.group(2).strip()
            # README는 여럿이라 이름만으로 어느 것인지 모른다
            if f != 'README' and f in heads and h not in heads[f]:
                line = t.count('\n', 0, m.start()) + 1
                problems.append(f'{rel}:{line}: 링크한 제목이 없음: [[{f}#{h}]]')

    if problems:
        print('문서 검사(.claude/hooks/doc-check.py)에서 고칠 곳:', file=sys.stderr)
        for x in problems:
            print('  ' + x, file=sys.stderr)
        return 2
    return 0


if __name__ == '__main__':
    sys.exit(main())
