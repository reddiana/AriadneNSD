// Breadth-first search for the algorithm gallery: the fewest steps on a grid, level by level.
import type { DiagramSpec, LocalizedSpec } from '../examples/build-example';
import { method } from '../examples/build-example';

type BfsWords = {
  readonly firstArrival: string;
  readonly unreachable: string;
};

function bfsWith(words: BfsWords): ReadonlyArray<DiagramSpec> {
  return [
    method('bfs(grid, start, goal)', [
      'dist = {start: 0}',
      'q = deque([start])',
      [
        'while',
        'q',
        [
          'p = q.popleft()',
          ['if', 'p == goal', [['exit', 'return dist[p]']], ['']],
          [
            'for',
            'for d in (N, E, S, W)',
            [
              'n = p + d',
              [
                'if',
                'grid.open(n) and n not in dist',
                [`dist[n] = dist[p] + 1    # ${words.firstArrival}`, 'q.append(n)'],
                [''],
              ],
            ],
          ],
        ],
      ],
      `return -1    # ${words.unreachable}`,
    ]),
  ];
}

/** BFS on a grid: the first time a cell is reached is by the fewest steps. */
export const bfs: LocalizedSpec = {
  ko: bfsWith({ firstArrival: '처음 닿을 때가 가장 가깝다', unreachable: '갈 수 없다' }),
  en: bfsWith({ firstArrival: 'first arrival is the shortest', unreachable: 'unreachable' }),
  de: bfsWith({ firstArrival: 'die erste Ankunft ist die kürzeste', unreachable: 'unerreichbar' }),
};
