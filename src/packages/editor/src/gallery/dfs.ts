// Depth-first search for the algorithm gallery: recursive, with pre-order and post-order visits.
import type { DiagramSpec, LocalizedSpec } from '../examples/build-example';
import { method } from '../examples/build-example';

type DfsWords = {
  readonly everyComponent: string;
  readonly onEnter: string;
  readonly onLeave: string;
  readonly reversed: string;
};

function dfsWith(words: DfsWords): ReadonlyArray<DiagramSpec> {
  return [
    method('dfs_all(graph)', [
      'visited, order = set(), []',
      [
        'for',
        `for v in graph    # ${words.everyComponent}`,
        [['if', 'v not in visited', [['call', 'dfs(graph, u)', 'graph, v']], ['']]],
      ],
      `return order[::-1]    # ${words.reversed}`,
    ]),
    method('dfs(graph, u)', [
      `visited.add(u)    # ${words.onEnter}`,
      [
        'for',
        'for v in graph[u]',
        [['if', 'v not in visited', [['call', 'dfs(graph, u)', 'graph, v']], ['']]],
      ],
      `order.append(u)    # ${words.onLeave}`,
    ]),
  ];
}

/** DFS: go deep first; the reversed finishing order is a topological order of a DAG. */
export const dfs: LocalizedSpec = {
  ko: dfsWith({
    everyComponent: '떨어진 조각마다',
    onEnter: '들어갈 때 (전위)',
    onLeave: '나올 때 (후위)',
    reversed: 'DAG라면 위상 순서',
  }),
  en: dfsWith({
    everyComponent: 'every component',
    onEnter: 'on entry (pre-order)',
    onLeave: 'on exit (post-order)',
    reversed: 'a topological order of a DAG',
  }),
};
