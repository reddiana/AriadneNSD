// Prototype `loadQuickExample()` (journal/assets/2026-10-10-ns-prototype.html).
import type { DiagramSpec } from './build-example';
import { method } from './build-example';

/** Quicksort (Lomuto partition): two Methods that call each other. */
export const quicksort: ReadonlyArray<DiagramSpec> = [
  method('quicksort(a, lo, hi)', [
    [
      'if',
      'lo < hi',
      [
        ['call', 'partition(a, lo, hi)', 'a, lo, hi', 'p'],
        ['call', 'quicksort(a, lo, hi)', 'a, lo, p - 1'],
        ['call', 'quicksort(a, lo, hi)', 'a, p + 1, hi'],
      ],
      [''],
    ],
  ]),
  method('partition(a, lo, hi)', [
    'pivot = a[hi];',
    'i = lo - 1;',
    'j = lo;',
    ['while', 'j < hi', [['if', 'a[j] <= pivot', ['i++;', 'swap(a[i], a[j]);'], ['']], 'j++;']],
    'swap(a[i + 1], a[hi]);',
    'return i + 1;',
  ]),
];
