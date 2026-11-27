// Union-find for the algorithm gallery: path compression and union by rank, used by Kruskal's MST.
import type { DiagramSpec, LocalizedSpec } from '../examples/build-example';
import { method } from '../examples/build-example';

type UnionFindWords = {
  readonly pathCompression: string;
  readonly sameSet: string;
  readonly lowerUnderHigher: string;
  readonly lightestFirst: string;
};

function unionFindWith(words: UnionFindWords): ReadonlyArray<DiagramSpec> {
  return [
    method('kruskal(n, edges)', [
      ['call', 'make_sets(n)', 'n'],
      'mst = []',
      [
        'for',
        `for w, u, v in sorted(edges)    # ${words.lightestFirst}`,
        [
          ['call', 'union(x, y)', 'u, v', 'merged'],
          ['if', 'merged', ['mst.append((u, v, w))'], ['']],
        ],
      ],
      'return mst',
    ]),
    method('make_sets(n)', ['parent = list(range(n))', 'rank = [0] * n']),
    method('find(x)', [
      [
        'if',
        'parent[x] != x',
        [
          ['call', 'find(x)', 'parent[x]', 'root'],
          `parent[x] = root    # ${words.pathCompression}`,
        ],
        [''],
      ],
      'return parent[x]',
    ]),
    method('union(x, y)', [
      ['call', 'find(x)', 'x', 'rx'],
      ['call', 'find(x)', 'y', 'ry'],
      ['if', 'rx == ry', [['exit', `return False    # ${words.sameSet}`]], ['']],
      ['if', 'rank[rx] < rank[ry]', ['rx, ry = ry, rx'], ['']],
      `parent[ry] = rx    # ${words.lowerUnderHigher}`,
      ['if', 'rank[rx] == rank[ry]', ['rank[rx] += 1'], ['']],
      'return True',
    ]),
  ];
}

/** Union-find with path compression and union by rank, and Kruskal's MST that uses it. */
export const unionFind: LocalizedSpec = {
  ko: unionFindWith({
    pathCompression: '경로 압축',
    sameSet: '이미 같은 집합',
    lowerUnderHigher: '낮은 트리를 높은 트리 밑에',
    lightestFirst: '가벼운 간선부터',
  }),
  en: unionFindWith({
    pathCompression: 'path compression',
    sameSet: 'already in one set',
    lowerUnderHigher: 'lower tree under the higher',
    lightestFirst: 'lightest edge first',
  }),
};
