// The algorithm gallery: well-known algorithms drawn as NS charts, for a page that shows them to
// programmers who love algorithms. Not in the Examples menu (R-EDIT-25). The algorithmic examples
// are in it too, built from their example entries. Text follows the examples: code stays code,
// comments and fold region names are in the opener's language.

import type { Settings } from '@ariadne-nsd/core';

import type { LocalizedSpec } from '../examples/build-example';
import { buildExample } from '../examples/build-example';
import type { ExampleInfo, ExampleText } from '../examples/examples';
import { examples } from '../examples/examples';
import { aStar } from './a-star';
import { bfs } from './bfs';
import { dfs } from './dfs';
import { gameOfLife } from './game-of-life';
import { gcd } from './gcd';
import { hanoi } from './hanoi';
import { heapSort } from './heap-sort';
import { kmp } from './kmp';
import { knapsack } from './knapsack';
import { lcs } from './lcs';
import { maxFlow } from './max-flow';
import { nQueens } from './n-queens';
import { redBlackTree } from './red-black-tree';
import { segmentTree } from './segment-tree';
import { topologicalSort } from './topological-sort';
import { unionFind } from './union-find';

/** The shelf of the gallery an algorithm is on. */
export type GalleryCategory = 'classic' | 'hard' | 'fun';

/** One algorithm of the gallery: an example with the shelf it is on. */
export type GalleryEntry = ExampleInfo & { readonly category: GalleryCategory };

function entry(
  id: string,
  category: GalleryCategory,
  name: ExampleText,
  what: ExampleText,
  diagrams: LocalizedSpec,
): GalleryEntry {
  return {
    id,
    category,
    name,
    what,
    build: (settings: Pick<Settings, 'headStyle' | 'locale'>) =>
      buildExample(diagrams[settings.locale], settings),
  };
}

/** An example of the Examples menu, on a gallery shelf. */
function fromExample(id: string, category: GalleryCategory): GalleryEntry {
  const example = examples.find((candidate) => candidate.id === id);
  if (example === undefined) {
    throw new Error(`no example ${id}`);
  }
  return { ...example, category };
}

/** The gallery's algorithms, shelf by shelf. */
export const gallery: ReadonlyArray<GalleryEntry> = [
  fromExample('binary-search', 'classic'),
  fromExample('quicksort', 'classic'),
  fromExample('merge-sort', 'classic'),
  entry(
    'heap-sort',
    'classic',
    { ko: '힙 정렬', en: 'Heap sort' },
    { ko: '최대 힙을 만들고 하나씩 꺼낸다', en: 'Build a max-heap, then take the top out' },
    heapSort,
  ),
  fromExample('dijkstra', 'classic'),
  entry(
    'bfs',
    'classic',
    { ko: '너비 우선 탐색', en: 'Breadth-first search' },
    { ko: '격자에서 가장 적은 걸음', en: 'The fewest steps on a grid' },
    bfs,
  ),
  entry(
    'dfs',
    'classic',
    { ko: '깊이 우선 탐색', en: 'Depth-first search' },
    { ko: '재귀 · 전위와 후위', en: 'Recursion · pre-order and post-order' },
    dfs,
  ),
  entry(
    'topological-sort',
    'classic',
    { ko: '위상 정렬 (Kahn)', en: "Topological sort (Kahn's)" },
    { ko: '들어오는 간선이 없는 정점부터', en: 'Vertices with no incoming edge first' },
    topologicalSort,
  ),
  entry(
    'union-find',
    'classic',
    { ko: '유니온-파인드', en: 'Union-find' },
    { ko: '경로 압축 · 랭크 · 크러스컬 MST', en: "Path compression · rank · Kruskal's MST" },
    unionFind,
  ),
  entry(
    'kmp',
    'classic',
    { ko: 'KMP 문자열 검색', en: 'KMP string search' },
    { ko: '텍스트에서 물러나지 않는다', en: 'Never steps back in the text' },
    kmp,
  ),
  entry(
    'knapsack',
    'classic',
    { ko: '0/1 배낭 문제', en: '0/1 knapsack' },
    { ko: '동적 계획법 표 · 고른 물건 되짚기', en: 'DP table · reading the items back' },
    knapsack,
  ),
  entry(
    'lcs',
    'classic',
    { ko: '최장 공통 부분 수열', en: 'Longest common subsequence' },
    { ko: '동적 계획법 표 · 거꾸로 따라가기', en: 'DP table · walking it back' },
    lcs,
  ),
  entry(
    'red-black-tree',
    'hard',
    { ko: '레드-블랙 트리 삽입', en: 'Red-black tree insert' },
    { ko: '고치기의 세 경우 · 회전 둘', en: 'Three fix-up cases · two rotations' },
    redBlackTree,
  ),
  entry(
    'a-star',
    'hard',
    { ko: 'A* 탐색', en: 'A* search' },
    { ko: 'g + h 순서의 우선순위 큐', en: 'A priority queue ordered by g + h' },
    aStar,
  ),
  entry(
    'max-flow',
    'hard',
    { ko: '최대 유량 (에드먼즈-카프)', en: 'Maximum flow (Edmonds–Karp)' },
    { ko: 'BFS로 찾은 증가 경로 · 잔여 그래프', en: 'Augmenting paths by BFS · residual graph' },
    maxFlow,
  ),
  entry(
    'segment-tree',
    'hard',
    { ko: '세그먼트 트리', en: 'Segment tree' },
    { ko: '만들기 · 구간 합 · 값 바꾸기', en: 'Build · range sum · point update' },
    segmentTree,
  ),
  fromExample('raft', 'hard'),
  entry(
    'hanoi',
    'fun',
    { ko: '하노이의 탑', en: 'Tower of Hanoi' },
    { ko: '자기를 두 번 부르는 세 줄', en: 'Three lines that call themselves twice' },
    hanoi,
  ),
  entry(
    'n-queens',
    'fun',
    { ko: 'N-퀸', en: 'N-Queens' },
    { ko: '되추적 · 놓고 되돌리기', en: 'Backtracking · place and take back' },
    nQueens,
  ),
  entry(
    'game-of-life',
    'fun',
    { ko: '콘웨이의 생명 게임', en: "Conway's Game of Life" },
    { ko: '한 세대 · 이웃 수의 Case', en: 'One generation · a Case on the neighbours' },
    gameOfLife,
  ),
  entry(
    'gcd',
    'fun',
    { ko: '유클리드 호제법', en: "Euclid's algorithm" },
    { ko: '최대공약수와 확장 유클리드', en: 'GCD and extended Euclid' },
    gcd,
  ),
  fromExample('maze', 'fun'),
];
