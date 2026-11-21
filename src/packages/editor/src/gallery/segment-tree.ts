// Segment tree for the algorithm gallery: range sums with build, query and point update, each a
// recursive Method over node `node` that covers a[lo..hi].
import type { DiagramSpec, LocalizedSpec } from '../examples/build-example';
import { event, method } from '../examples/build-example';

type SegmentTreeWords = {
  readonly children: string;
  readonly outside: string;
  readonly inside: string;
};

function segmentTreeWith(words: SegmentTreeWords): ReadonlyArray<DiagramSpec> {
  return [
    event('main()', [
      'a = [5, 8, 6, 3, 2, 7, 2, 6]',
      'n = len(a)',
      `tree = [0] * (4 * n)    # ${words.children}`,
      ['call', 'build(node, lo, hi)', '1, 0, n - 1'],
      ['call', 'query(node, lo, hi, l, r)', '1, 0, n - 1, 2, 5', 's'],
      'print(s)    # 18',
      ['call', 'update(node, lo, hi, i, x)', '1, 0, n - 1, 3, 10'],
      ['call', 'query(node, lo, hi, l, r)', '1, 0, n - 1, 2, 5', 's'],
      'print(s)    # 25',
    ]),
    method('build(node, lo, hi)', [
      [
        'if',
        'lo == hi',
        ['tree[node] = a[lo]'],
        [
          'mid = (lo + hi) // 2',
          ['call', 'build(node, lo, hi)', '2 * node, lo, mid'],
          ['call', 'build(node, lo, hi)', '2 * node + 1, mid + 1, hi'],
          'tree[node] = tree[2 * node] + tree[2 * node + 1]',
        ],
      ],
    ]),
    method('query(node, lo, hi, l, r)', [
      ['if', 'r < lo or hi < l', [`return 0    # ${words.outside}`], ['']],
      ['if', 'l <= lo and hi <= r', [`return tree[node]    # ${words.inside}`], ['']],
      'mid = (lo + hi) // 2',
      ['call', 'query(node, lo, hi, l, r)', '2 * node, lo, mid, l, r', 'left'],
      ['call', 'query(node, lo, hi, l, r)', '2 * node + 1, mid + 1, hi, l, r', 'right'],
      'return left + right',
    ]),
    method('update(node, lo, hi, i, x)', [
      [
        'if',
        'lo == hi',
        ['tree[node] = x'],
        [
          'mid = (lo + hi) // 2',
          [
            'if',
            'i <= mid',
            [['call', 'update(node, lo, hi, i, x)', '2 * node, lo, mid, i, x']],
            [['call', 'update(node, lo, hi, i, x)', '2 * node + 1, mid + 1, hi, i, x']],
          ],
          'tree[node] = tree[2 * node] + tree[2 * node + 1]',
        ],
      ],
    ]),
  ];
}

/** Segment tree: range sum queries and point updates in O(log n). */
export const segmentTree: LocalizedSpec = {
  ko: segmentTreeWith({
    children: '노드 k의 자식은 2k와 2k + 1',
    outside: '겹치지 않는다',
    inside: '구간 안에 다 들어온다',
  }),
  en: segmentTreeWith({
    children: 'the children of node k are 2k and 2k + 1',
    outside: 'no overlap',
    inside: 'fully inside the range',
  }),
};
