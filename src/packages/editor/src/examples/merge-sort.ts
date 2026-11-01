// Prototype M41 example 7 (journal/assets/2026-10-10-ns-prototype.html, `MORE`).
import type { DiagramSpec } from './build-example';
import { method } from './build-example';

/** Merge sort: one Method that calls itself twice. */
export const mergeSort: ReadonlyArray<DiagramSpec> = [
  method('merge_sort(a, lo, hi)', [
    ['if', 'hi - lo < 2', ['return'], ['']],
    'mid = (lo + hi) >> 1',
    ['call', 'merge_sort(a, lo, hi)', 'a, lo, mid'],
    ['call', 'merge_sort(a, lo, hi)', 'a, mid, hi'],
    'i, j, tmp = lo, mid, []',
    [
      'while',
      'i < mid and j < hi',
      [['if', 'a[i] <= a[j]', ['tmp.append(a[i])', 'i += 1'], ['tmp.append(a[j])', 'j += 1']]],
    ],
    'tmp += a[i:mid] + a[j:hi]',
    'a[lo:hi] = tmp',
  ]),
];
