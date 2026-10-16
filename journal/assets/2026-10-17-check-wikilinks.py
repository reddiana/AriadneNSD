# 저장소의 위키링크([[이름#제목|글]], [[이름#^블록]], ![[그림]])가 모두 살아 있는지 본다
# 쓰는 법: py -X utf8 journal/assets/2026-10-17-check-wikilinks.py [폴더 ...] [--sessions]   (기본: docs atelier journal tech-notes, 세션 기록은 뺌)
# 파일 이름으로 건 링크를 찾고(README는 경로로), 제목은 Obsidian처럼 마크다운 제목의 글자 그대로 견준다
import os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
ALL = '--sessions' in sys.argv   # 세션 기록과 타임라인까지 본다 (그때의 기록이라 ADR처럼 없앤 것을 가리킬 수 있음)
dirs = [a for a in sys.argv[1:] if not a.startswith('--')] or ['docs', 'atelier', 'journal', 'tech-notes']
files = {}
for base, _, names in os.walk(ROOT):
    if '.git' in base or '.obsidian' in base:
        continue
    for n in names:
        rel = os.path.relpath(os.path.join(base, n), ROOT).replace('\\', '/')
        stem = n[:-3] if n.endswith('.md') else n
        files.setdefault(stem, []).append(rel)
        if n == 'README.md':
            files[rel[:-3]] = [rel]

def headings(rel):
    hs, blocks = set(), set()
    for line in open(os.path.join(ROOT, rel), encoding='utf-8'):
        m = re.match(r'#{1,6}\s+(.*?)\s*$', line)
        if m:
            hs.add(m.group(1))
        for b in re.findall(r'\^([A-Za-z0-9-]+)\s*$', line):
            blocks.add(b)
    return hs, blocks

bad = 0
for d in dirs:
    for base, _, names in os.walk(os.path.join(ROOT, d)):
        if os.sep + 'sessions' in base and not ALL:
            continue
        for n in names:
            if not n.endswith('.md'):
                continue
            path = os.path.join(base, n)
            rel = os.path.relpath(path, ROOT).replace('\\', '/')
            text = open(path, encoding='utf-8').read()
            text = re.sub(r'```.*?```', '', text, flags=re.S)
            text = re.sub(r'`[^`\n]*\[\[[^`\n]*`', '', text)   # 코드 안에 적은 링크 예시만 뺀다 (링크 안의 코드 표시는 남긴다)
            for m in re.finditer(r'!?\[\[([^\]]+)\]\]', text):
                target = m.group(1).replace('\\|', '|').split('|')[0]
                name, _, anchor = target.partition('#')
                name = name.strip()
                if not name:
                    cands = [rel]
                else:
                    cands = files.get(name) or files.get(name + '.md')
                if not cands:
                    print(f'{rel}: 없는 파일 [[{target}]]'); bad += 1; continue
                if anchor and cands[0].endswith('.md'):
                    hs, blocks = headings(cands[0])
                    ok = anchor[1:] in blocks if anchor.startswith('^') else anchor.split('#')[-1] in hs
                    if not ok:
                        print(f'{rel}: 없는 제목 [[{target}]]'); bad += 1
print('깨진 링크', bad)
