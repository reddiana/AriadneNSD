// Dumps the gallery specs (both locales) as JSON for the Python harness. Run by run.sh via vitest.
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
declare const test: (name: string, fn: () => void) => void; // vitest global

import { aStar } from '../../../packages/editor/src/gallery/a-star';
import { bfs } from '../../../packages/editor/src/gallery/bfs';
import { dfs } from '../../../packages/editor/src/gallery/dfs';
import { gameOfLife } from '../../../packages/editor/src/gallery/game-of-life';
import { gcd } from '../../../packages/editor/src/gallery/gcd';
import { hanoi } from '../../../packages/editor/src/gallery/hanoi';
import { heapSort } from '../../../packages/editor/src/gallery/heap-sort';
import { kmp } from '../../../packages/editor/src/gallery/kmp';
import { knapsack } from '../../../packages/editor/src/gallery/knapsack';
import { lcs } from '../../../packages/editor/src/gallery/lcs';
import { maxFlow } from '../../../packages/editor/src/gallery/max-flow';
import { nQueens } from '../../../packages/editor/src/gallery/n-queens';
import { producerConsumer } from '../../../packages/editor/src/gallery/producer-consumer';
import { redBlackTree } from '../../../packages/editor/src/gallery/red-black-tree';
import { segmentTree } from '../../../packages/editor/src/gallery/segment-tree';
import { topologicalSort } from '../../../packages/editor/src/gallery/topological-sort';
import { unionFind } from '../../../packages/editor/src/gallery/union-find';

const all = {
  'a-star': aStar,
  bfs,
  dfs,
  'game-of-life': gameOfLife,
  gcd,
  hanoi,
  'heap-sort': heapSort,
  kmp,
  knapsack,
  lcs,
  'max-flow': maxFlow,
  'n-queens': nQueens,
  'producer-consumer': producerConsumer,
  'red-black-tree': redBlackTree,
  'segment-tree': segmentTree,
  'topological-sort': topologicalSort,
  'union-find': unionFind,
};

test('dump specs', () => {
  writeFileSync(resolve(__dirname, 'specs.json'), JSON.stringify(all, null, 1));
});
