// Prototype M41 example 5 (journal/assets/2026-10-10-ns-prototype.html, `MORE`).
import type { DiagramSpec } from './build-example';
import { method } from './build-example';

/** Dijkstra's shortest path: nested While, For and If. */
export const dijkstra: ReadonlyArray<DiagramSpec> = [
  method('dijkstra(graph, s)', [
    'dist = {v: INF for v in graph}',
    'dist[s] = 0',
    'pq = [(0, s)]',
    [
      'while',
      'pq',
      [
        'd, u = heappop(pq)',
        ['if', 'd > dist[u]', ['continue'], ['']],
        [
          'for',
          'for v, w in graph[u]',
          [
            [
              'if',
              'dist[u] + w < dist[v]',
              ['dist[v] = dist[u] + w', 'prev[v] = u', 'heappush(pq, (dist[v], v))'],
              [''],
            ],
          ],
        ],
      ],
    ],
    'return dist, prev',
  ]),
];
