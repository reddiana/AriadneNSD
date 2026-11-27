// A* search for the algorithm gallery: Dijkstra ordered by g + h, with stale queue entries skipped.
import type { DiagramSpec, LocalizedSpec } from '../examples/build-example';
import { method } from '../examples/build-example';

type AStarWords = {
  readonly costSoFar: string;
  readonly stale: string;
  readonly better: string;
  readonly noPath: string;
};

function aStarWith(words: AStarWords): ReadonlyArray<DiagramSpec> {
  return [
    method('a_star(graph, start, goal, h)', [
      `g = {start: 0}    # ${words.costSoFar}`,
      'came_from = {}',
      'open = [(h(start), start)]',
      [
        'while',
        'open',
        [
          'f, u = heappop(open)',
          ['if', 'f > g[u] + h(u)', [['exit', `continue    # ${words.stale}`]], ['']],
          [
            'if',
            'u == goal',
            [
              ['call', 'reconstruct(came_from, u)', 'came_from, u', 'path'],
              ['exit', 'return path'],
            ],
            [''],
          ],
          [
            'for',
            'for v, w in graph[u]',
            [
              'tentative = g[u] + w',
              [
                'if',
                'tentative < g.get(v, INF)',
                [
                  `came_from[v] = u    # ${words.better}`,
                  'g[v] = tentative',
                  'heappush(open, (tentative + h(v), v))',
                ],
                [''],
              ],
            ],
          ],
        ],
      ],
      `return None    # ${words.noPath}`,
    ]),
    method('reconstruct(came_from, u)', [
      'path = [u]',
      ['while', 'u in came_from', ['u = came_from[u]', 'path.append(u)']],
      'return path[::-1]',
    ]),
  ];
}

/** A*: the open list ordered by f = g + h, where h never overestimates the rest of the way. */
export const aStar: LocalizedSpec = {
  ko: aStarWith({
    costSoFar: '출발점에서 온 비용',
    stale: '낡은 항목: 그 뒤에 더 짧은 길을 찾았다',
    better: '더 짧은 길을 찾았다',
    noPath: '길이 없다',
  }),
  en: aStarWith({
    costSoFar: 'cost from the start',
    stale: 'stale entry: a shorter path was found since',
    better: 'found a shorter path',
    noPath: 'no path',
  }),
};
