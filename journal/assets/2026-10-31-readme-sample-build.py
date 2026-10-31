# README 첫 화면에 넣을 다이어그램 그림의 후보 시안(M41)을 만든다.
# 프로토타입(M01)을 그대로 복사하고, 후보 예제와 그 그림을 늘어놓는 갤러리를 덧붙인다.
# 쓰는 법: python 2026-10-31-readme-sample-build.py  (이 폴더에서)
from pathlib import Path

here = Path(__file__).parent
src = (here / '2026-10-10-ns-prototype.html').read_text(encoding='utf-8')
out = here / '2026-10-31-readme-sample-study.html'

CANDS = r"""
/* ---------- M41: README 그림 후보 ---------- */
const M41 = [
  { no: 5, name: '다익스트라 최단 경로', note: '코드식 · 다이어그램 하나 · 겹친 While · If 둘. 교과서 알고리즘 가운데 크기와 모양이 NS 차트에 잘 맞음', mono: true, list: [
    ['dijkstra(graph, s)', [
      'dist = {v: INF for v in graph}',
      'dist[s] = 0',
      'pq = [(0, s)]',
      ['while', 'pq', [
        'd, u = heappop(pq)',
        ['if', 'd > dist[u]', ['continue'], ['']],
        ['for', 'for v, w in graph[u]', [
          ['if', 'dist[u] + w < dist[v]',
            ['dist[v] = dist[u] + w', 'prev[v] = u', 'heappush(pq, (dist[v], v))'],
            ['']]
        ]]
      ]],
      'return dist, prev'
    ], 'method']
  ]},
  { no: 6, name: '미로 찾기 (아리아드네의 실)', note: '코드식 · Event 하나와 Method 하나. solve는 main과 자기 자신, 두 곳에서 불림(재귀). 실을 풀고 감는 되추적이 제품 이름의 이야기와 이어짐', mono: true, list: [
    ['main()', [
      'maze = read_maze()',
      ['call', 'solve(maze, p)', 'maze, maze.entrance', 'found'],
      ['if', 'found', ['draw_thread(path)'], ['print("출구 없음")']]
    ]],
    ['solve(maze, p)', [
      ['if', 'p == maze.exit', ['return True'], ['']],
      ['if', 'maze.wall(p) or p in visited', ['return False'], ['']],
      'visited.add(p)',
      'path.append(p)    # 실을 푼다',
      ['while', 'for d in (N, E, S, W)', [
        ['call', 'solve(maze, p)', 'maze, p + d', 'ok'],
        ['if', 'ok', ['return True'], ['']]
      ]],
      'path.pop()        # 실을 감는다',
      'return False'
    ], 'method']
  ]},
  { no: 7, name: '병합 정렬', note: '코드식 · 다이어그램 하나. 자기 자신을 두 번 부름(재귀)', mono: true, list: [
    ['merge_sort(a, lo, hi)', [
      ['if', 'hi - lo < 2', ['return'], ['']],
      'mid = (lo + hi) >> 1',
      ['call', 'merge_sort(a, lo, hi)', 'a, lo, mid'],
      ['call', 'merge_sort(a, lo, hi)', 'a, mid, hi'],
      'i, j, tmp = lo, mid, []',
      ['while', 'i < mid and j < hi', [
        ['if', 'a[i] <= a[j]', ['tmp.append(a[i])', 'i += 1'], ['tmp.append(a[j])', 'j += 1']]
      ]],
      'tmp += a[i:mid] + a[j:hi]',
      'a[lo:hi] = tmp'
    ], 'method']
  ]},
  { no: 8, name: '이진 탐색 (한 장)', note: '2번에서 main을 빼고 이진 탐색만. 가장 작고 깔끔함', mono: true, list: [
    ['binary_search(a, key)', [
      'lo, hi = 0, len(a) - 1',
      ['while', 'lo <= hi', [
        'mid = (lo + hi) // 2',
        ['if', 'a[mid] == key', ['return mid'], [
          ['if', 'a[mid] < key', ['lo = mid + 1'], ['hi = mid - 1']]
        ]]
      ]],
      'return -1'
    ], 'method']
  ]},
  { sep: '앞서 본 후보 (첫 판)' },
  { no: 1, name: '자판기', note: '문장식 · Event 둘과 Method 하나 · Case · If · While · 호출. 누구나 아는 장면이라 처음 보는 사람도 읽힘', mono: false, list: [
    ['동전이 들어오면', [
      '동전의 종류를 알아본다',
      ['if', '받는 동전인가?',
        ['잔액에 동전의 값을 더한다', '잔액을 화면에 보인다', ['call', '살 수 있는 음료에 불을 켠다']],
        ['동전을 반환구로 돌려보낸다']]
    ]],
    ['음료 버튼을 누르면', [
      ['case', '고른 음료', [
        ['커피', ['값 = 1,200원']],
        ['녹차', ['값 = 1,000원']],
        ['생수', ['값 = 800원']],
        ['default', ['알림음을 낸다', '끝낸다']]
      ]],
      ['if', '잔액 ≥ 값?',
        ['음료를 내보낸다', '잔액에서 값을 뺀다',
          ['while', '잔액 > 0', ['가장 큰 동전으로 거스름을 낸다', '잔액에서 그 동전의 값을 뺀다']],
          '화면을 처음으로 되돌린다'],
        ['"잔액이 모자랍니다"를 보인다']]
    ]],
    ['살 수 있는 음료에 불을 켠다', [
      ['while', '버튼마다', [
        ['if', '값 ≤ 잔액이고 재고가 있는가?', ['버튼의 불을 켠다'], ['버튼의 불을 끈다']]
      ]]
    ], 'method']
  ]},
  { no: 2, name: '이진 탐색', note: '코드식(C) · Event 하나와 Method 하나 · Do-While · While · 겹친 If · 결과를 받는 호출. 개발자에게 익숙하고 작음', mono: true, list: [
    ['main()', [
      'int a[] = {2, 3, 5, 7, 11, 13, 17};',
      ['dowhile', 'key != 0', [
        'key = read_int();',
        ['call', 'binary_search(a, n, key)', 'a, 7, key', 'i'],
        ['if', 'i >= 0', ['printf("%d번째\\n", i);'], ['printf("없음\\n");']]
      ]]
    ]],
    ['binary_search(a, n, key)', [
      'lo = 0;',
      'hi = n - 1;',
      ['while', 'lo <= hi', [
        'mid = lo + (hi - lo) / 2;',
        ['if', 'a[mid] == key', ['return mid;'], [
          ['if', 'a[mid] < key', ['lo = mid + 1;'], ['hi = mid - 1;']]
        ]]
      ]],
      'return -1;'
    ], 'method']
  ]},
  { no: 3, name: '엘리베이터', note: '문장식 · Event 둘과 Method 하나 · 갈래 넷의 Case · 이름 붙은 영역 · While · 호출 둘. 가장 넓고 볼거리가 많음', mono: false, list: [
    ['층 버튼이 눌리면', [
      '눌린 층을 요청 목록에 더한다',
      '버튼에 불을 켠다',
      ['if', '엘리베이터가 서 있는가?', [['call', '다음 행선지를 정한다']], ['']]
    ]],
    ['제어 주기마다 (100ms)', [
      ['case', '상태', [
        ['올라감', [['if', '행선지에 닿았는가?', ['멈춘다', '상태 = 문 열림'], ['한 층 올라간다']]]],
        ['내려감', [['if', '행선지에 닿았는가?', ['멈춘다', '상태 = 문 열림'], ['한 층 내려간다']]]],
        ['문 열림', [
          ['range', '문 열고 닫기', ['문을 연다', '3초 기다린다',
            ['while', '문 사이에 사람이 있는 동안', ['1초 더 기다린다']], '문을 닫는다'], true],
          '이 층의 요청을 지운다',
          ['call', '다음 행선지를 정한다']]],
        ['서 있음', ['']]
      ]]
    ]],
    ['다음 행선지를 정한다', [
      ['if', '요청 목록이 비었는가?', ['상태 = 서 있음'], [
        '진행 방향에서 가장 가까운 요청을 고른다',
        ['if', '행선지 > 지금 층?', ['상태 = 올라감'], ['상태 = 내려감']]
      ]]
    ], 'method']
  ]},
  { no: 4, name: 'Raft (지금 프로토타입의 예제)', note: '참고: 프로토타입에 이미 있는 다이어그램 열 개. README에는 크지만 "실제 쓰임새"로는 가장 그럴듯함', raft: true }
];
function m41Load(c) {
  if (c.raft) loadRaftExample(); else loadDiagrams(c.list, c.mono, c.name);
  selectOne(null); render();
}
function m41Gallery() {
  const g = $('#m41cards');
  for (const c of M41) {
    if (c.sep) { const h = document.createElement('h2'); h.className = 'm41sep'; h.textContent = c.sep; g.appendChild(h); continue; }
    m41Load(c);
    const lay = layout();
    const card = document.createElement('section');
    card.className = 'm41card';
    card.innerHTML = `<h2><span class="m41tag">${c.no}</span>${c.name}</h2><p>${c.note}</p>` +
      `<div class="m41fig"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${lay.W} ${lay.H}" width="${lay.W}" style="max-width:100%;height:auto;background:#fff">${drawSVG(lay, false)}</svg></div>` +
      `<button type="button">${c.no}번을 편집기에서 열기</button>`;
    card.querySelector('button').onclick = () => { $('#m41').hidden = true; m41Load(c); stage.focus({ preventScroll: true }); };
    g.appendChild(card);
  }
  m41Load(M41[0]);
  $('#m41back').onclick = () => { $('#m41').hidden = false; };
}
m41Gallery();
{
  const m = /shot=(\d+)/.exec(location.hash);
  const c = m && M41.find(x => x.no === +m[1]);
  if (c) {
    m41Load(c);
    const lay = layout();
    document.body.innerHTML = `<svg id="shot" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${lay.W} ${lay.H}" width="${lay.W}" height="${lay.H}" style="display:block;background:#fff">${drawSVG(lay, false)}</svg>`;
    document.body.style.cssText = 'margin:0;background:#fff';
    window.SHOT = { w: lay.W, h: lay.H };
  }
}
"""

OVERLAY = """
<div id="m41">
  <header>
    <h1>M41 README 그림 후보</h1>
    <p>저장소 첫 화면(README)의 소개 아래에 넣을 다이어그램 그림의 후보입니다. 그림은 프로토타입(M01)의 그리는 코드로 그렸고, 고른 것을 2배 해상도 PNG로 찍어 넣습니다. 번호로 골라 주세요. 글자를 바꾸거나 두 후보를 섞으셔도 됩니다. 5 ~ 8번은 “알고리즘이 좋고, 한 곳에서만 쓰이는 Method는 별로”를 받고 더한 것입니다(다이어그램이 하나이거나, Method가 두 곳 이상에서 불림).  5번의 안쪽 반복은 62번째 판의 For 블록으로 그렸습니다.</p>
  </header>
  <div id="m41cards"></div>
</div>
<button id="m41back" type="button">← 후보 목록</button>
"""

STYLE = """
<style>
#m41 { position: fixed; inset: 0; z-index: 50; overflow: auto; background: var(--bg); color: var(--fg); padding: 24px 16px 48px; font-family: var(--font); }
#m41 header { max-width: 1100px; margin: 0 auto 16px; }
#m41 h1 { font-size: 22px; margin: 0 0 6px; }
#m41 header p { color: var(--muted); margin: 0; line-height: 1.6; }
#m41cards { max-width: 1100px; margin: 0 auto; display: grid; gap: 20px; }
.m41card { background: var(--panel); border: 1px solid var(--line); border-radius: 10px; padding: 16px; }
.m41card h2 { font-size: 17px; margin: 0 0 4px; display: flex; align-items: center; gap: 8px; }
.m41card p { color: var(--muted); margin: 0 0 12px; line-height: 1.5; }
.m41tag { display: inline-grid; place-items: center; width: 26px; height: 26px; border-radius: 50%; background: var(--accent); color: var(--panel); font-size: 14px; }
.m41fig { overflow-x: auto; padding: 12px; background: #fff; border: 1px solid var(--line); border-radius: 6px; }
.m41card button, #m41back { margin-top: 10px; font: inherit; padding: 6px 12px; border-radius: 6px; border: 1px solid var(--line); background: var(--accent-soft); color: var(--fg); cursor: pointer; }
.m41sep { font-size: 16px; color: var(--muted); margin: 16px 0 0; border-top: 1px solid var(--line); padding-top: 16px; }
#m41back { position: fixed; right: 16px; bottom: 16px; z-index: 40; margin: 0; }
</style>
"""

assert src.count('})();\n</script>') == 1
html = src.replace('<title>M01 AriadneNSD 프로토타입</title>', '<title>M41 README 그림 후보</title>')
# 프로토타입 파일에는 <head> · <body>가 없다(펴낼 때 감싸짐). 앱 상자 앞에 끼운다
assert html.count('<div class="app">') == 1
html = html.replace('<div class="app">', STYLE + OVERLAY + '<div class="app">', 1)
html = html.replace('})();\n</script>', CANDS + '})();\n</script>')
out.write_text(html, encoding='utf-8')
print('wrote', out)
