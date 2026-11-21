// Maximum flow for the algorithm gallery: Ford–Fulkerson with a BFS for each augmenting path
// (Edmonds–Karp), on a residual capacity table that has the reverse edges too.
import type { DiagramSpec, LocalizedSpec } from '../examples/build-example';
import { method } from '../examples/build-example';

type MaxFlowWords = {
  readonly residual: string;
  readonly noPath: string;
  readonly bottleneck: string;
  readonly push: string;
  readonly undo: string;
  readonly shortest: string;
};

function maxFlowWith(words: MaxFlowWords): ReadonlyArray<DiagramSpec> {
  return [
    method('max_flow(cap, s, t)', [
      `flow = 0    # ${words.residual}`,
      [
        'while',
        'True',
        [
          ['call', 'bfs_path(cap, s, t)', 'cap, s, t', 'parent'],
          ['if', 't not in parent', [`return flow    # ${words.noPath}`], ['']],
          [
            'range',
            words.bottleneck,
            [
              'b, v = INF, t',
              ['while', 'v != s', ['u = parent[v]', 'b = min(b, cap[u][v])', 'v = u']],
            ],
          ],
          [
            'range',
            words.push,
            [
              'v = t',
              [
                'while',
                'v != s',
                ['u = parent[v]', 'cap[u][v] -= b', `cap[v][u] += b    # ${words.undo}`, 'v = u'],
              ],
            ],
          ],
          'flow += b',
        ],
      ],
    ]),
    method('bfs_path(cap, s, t)', [
      `parent = {s: s}    # ${words.shortest}`,
      'q = deque([s])',
      [
        'while',
        'q and t not in parent',
        [
          'u = q.popleft()',
          [
            'for',
            'for v in cap[u]',
            [['if', 'v not in parent and cap[u][v] > 0', ['parent[v] = u', 'q.append(v)'], ['']]],
          ],
        ],
      ],
      'return parent',
    ]),
  ];
}

/** Edmonds–Karp: augment along the shortest residual path until none is left, O(VE²). */
export const maxFlow: LocalizedSpec = {
  ko: maxFlowWith({
    residual: 'cap[u][v]: 남은 용량 (역방향 간선 포함)',
    noPath: '증가 경로가 없다',
    bottleneck: '경로의 병목 찾기',
    push: '경로를 따라 흘려 보내기',
    undo: '되돌릴 수 있게',
    shortest: '간선 수가 가장 적은 경로',
  }),
  en: maxFlowWith({
    residual: 'cap[u][v]: residual capacity, reverse edges included',
    noPath: 'no augmenting path',
    bottleneck: 'Find the bottleneck',
    push: 'Push the flow along the path',
    undo: 'so it can be undone',
    shortest: 'the path with the fewest edges',
  }),
};
