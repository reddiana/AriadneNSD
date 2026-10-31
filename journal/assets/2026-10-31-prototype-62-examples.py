import re
from pathlib import Path
A = Path(r'C:\myProject\AriadneNSD\journal\assets')
b = (A / '2026-10-31-readme-sample-build.py').read_text(encoding='utf-8')
start = b.index('const M41 = [\n')
end = b.index('\n];\n', start)
block = b[start:end + 3]
# Raft(이미 프로토타입에 있음)와 구분 줄은 뺀다
block = re.sub(r"\n  \{ no: 4, name: 'Raft[^\n]*\n", '\n', block)
block = re.sub(r"\n  \{ sep: [^\n]*\n", '\n', block)
block = block.replace('const M41 = [', 'const MORE = [', 1)
assert 'raft' not in block and 'sep:' not in block

p = A / '2026-10-10-ns-prototype.html'
s = p.read_text(encoding='utf-8')


def sub(old, new):
    global s
    n = s.count(old)
    if n != 1:
        raise SystemExit(f'expected 1, found {n}: {old[:80]}')
    s = s.replace(old, new)


sub("""      <button data-cmd="exRaft" title="다이어그램 열: 이벤트 처리기 일곱과 Method 셋">Raft</button>
""", """      <button data-cmd="exRaft" title="다이어그램 열: 이벤트 처리기 일곱과 Method 셋">Raft</button>
      <select id="exMore" title="README 그림 후보(시안 M41)의 예제"><option value="">더 보기…</option></select>
""")
sub("""/* ---------- 저장 (이 브라우저에만) ---------- */""",
    """// 시안 M41(README 그림 후보)의 예제. 번호는 M41의 번호 (62번째 판, 2026-10-31)
""" + block + """
function loadMore(no) {
  const c = MORE.find(x => x.no === +no);
  if (c) loadDiagrams(c.list, c.mono, `M41 ${c.no}번 예제: ${c.name}`);
}
[...MORE].sort((x, y) => x.no - y.no).forEach(c => { const o = document.createElement('option'); o.value = c.no; o.textContent = `${c.no}. ${c.name}`; $('#exMore').appendChild(o); });
$('#exMore').addEventListener('change', e => { const v = e.target.value; e.target.value = ''; if (v) { if (editing) commitEdit(false); loadMore(v); stage.focus({ preventScroll: true }); } });

/* ---------- 저장 (이 브라우저에만) ---------- */""")
sub("""        <li><b>2026-10-18 · 10-25에 정하고 넣지 못한 것을 모두 넣었습니다.</b></li>""",
    """        <li><b>2026-10-18 · 10-25에 정하고 넣지 못한 것을 모두 넣었습니다.</b></li>
        <li><b>예제를 더했습니다:</b> 위 "예제"의 "더 보기…"에서 자판기, 이진 탐색, 엘리베이터, 다익스트라, 미로 찾기, 병합 정렬, 이진 탐색(한 장)을 고릅니다(시안 M41의 후보들).</li>""")
p.write_text(s, encoding='utf-8')
print('ok', block.count('{ no:'), 'examples')
