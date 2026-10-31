# 프로토타입 63번째 판: 주소 끝의 이름(#dijkstra, #merge-sort)으로 README 그림의 예제를 머리 모양 "제목처럼"으로 연다
# 쓰는 법: python journal/assets/2026-10-31-prototype-63-patch.py
import pathlib
p = pathlib.Path(__file__).parent / "2026-10-10-ns-prototype.html"
s = p.read_text(encoding="utf-8")
def rep(old, new):
    global s
    assert s.count(old) == 1, old
    s = s.replace(old, new)
rep('<b id="edition">62번째 판</b>', '<b id="edition">63번째 판</b>')
rep('''/* ---------- 시작 ---------- */
if (!restore()) loadExample('code');
else { render(); say('지난번 상태를 되살렸습니다. 처음 예제는 "코드식"을 누르세요'); }''',
'''/* ---------- 주소로 예제 열기 (63번째 판) ---------- */
// README의 "프로토타입 편집기에서 열기": 주소 끝의 이름으로 그 그림의 예제를 그림과 같은 머리 모양 "제목처럼"으로 연다
const HASH_EXAMPLES = { dijkstra: 5, 'merge-sort': 7 };
function openFromHash() {
  const no = HASH_EXAMPLES[decodeURIComponent(location.hash.slice(1))];
  if (!no) return false;
  if (editing) commitEdit(false);
  loadMore(no);
  doc.settings = { ...(doc.settings || {}), headStyle: 'title' };
  render(); save();
  return true;
}
window.addEventListener('hashchange', () => { if (openFromHash()) stage.focus({ preventScroll: true }); });

/* ---------- 시작 ---------- */
const restored = restore();
if (openFromHash()) {}
else if (!restored) loadExample('code');
else { render(); say('지난번 상태를 되살렸습니다. 처음 예제는 "코드식"을 누르세요'); }''')
rep('''      <h2>이번에 바뀐 것 (10-31, 62번째 판)</h2>
      <ul>
''', '''      <h2>이번에 바뀐 것 (10-31, 63번째 판)</h2>
      <ul>
        <li><b>주소로 예제 열기:</b> 주소 끝에 <code>#dijkstra</code>나 <code>#merge-sort</code>를 붙여 열면 그 예제가 머리 모양 "제목처럼"으로 열립니다. 저장소 첫 화면(README)의 "프로토타입 편집기에서 열기"가 이 주소로 옵니다.</li>
      </ul>
      <h2>62번째 판 (10-31)</h2>
      <ul>
''')
p.write_text(s, encoding="utf-8")
print("ok")
