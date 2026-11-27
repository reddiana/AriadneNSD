// Topological sort for the algorithm gallery: Kahn's algorithm, which takes vertices of in-degree 0.
import type { DiagramSpec, LocalizedSpec } from '../examples/build-example';
import { method } from '../examples/build-example';

type TopologicalSortWords = {
  readonly countInDegrees: string;
  readonly noIncoming: string;
  readonly cycle: string;
};

function topologicalSortWith(words: TopologicalSortWords): ReadonlyArray<DiagramSpec> {
  return [
    method('topo_sort(graph)', [
      [
        'range',
        words.countInDegrees,
        [
          'indeg = {v: 0 for v in graph}',
          ['for', 'for u in graph', [['for', 'for v in graph[u]', ['indeg[v] += 1']]]],
        ],
      ],
      `q = deque(v for v in graph if indeg[v] == 0)    # ${words.noIncoming}`,
      'order = []',
      [
        'while',
        'q',
        [
          'u = q.popleft()',
          'order.append(u)',
          [
            'for',
            'for v in graph[u]',
            ['indeg[v] -= 1', ['if', 'indeg[v] == 0', ['q.append(v)'], ['']]],
          ],
        ],
      ],
      ['if', 'len(order) < len(graph)', [['exit', `return None    # ${words.cycle}`]], ['']],
      'return order',
    ]),
  ];
}

/** Topological sort (Kahn): a queue of the vertices nothing points to any more. */
export const topologicalSort: LocalizedSpec = {
  ko: topologicalSortWith({
    countInDegrees: '들어오는 간선 세기',
    noIncoming: '들어오는 간선이 없는 정점',
    cycle: '사이클이 있다',
  }),
  en: topologicalSortWith({
    countInDegrees: 'Count incoming edges',
    noIncoming: 'vertices with no incoming edge',
    cycle: 'there is a cycle',
  }),
};
