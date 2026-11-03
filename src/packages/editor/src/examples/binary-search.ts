// Prototype M41 example 2 (journal/assets/2026-10-10-ns-prototype.html, `MORE`).
import type { DiagramSpec, LocalizedSpec } from './build-example';
import { event, method } from './build-example';

/** The diagrams with the two messages in one language. */
function binarySearchWith(found: string, notFound: string): ReadonlyArray<DiagramSpec> {
  return [
    event('main()', [
      'int a[] = {2, 3, 5, 7, 11, 13, 17};',
      [
        'doWhile',
        'key != 0',
        [
          'key = read_int();',
          ['call', 'binary_search(a, n, key)', 'a, 7, key', 'i'],
          ['if', 'i >= 0', [found], [notFound]],
        ],
      ],
    ]),
    method('binary_search(a, n, key)', [
      'lo = 0;',
      'hi = n - 1;',
      [
        'while',
        'lo <= hi',
        [
          'mid = lo + (hi - lo) / 2;',
          [
            'if',
            'a[mid] == key',
            ['return mid;'],
            [['if', 'a[mid] < key', ['lo = mid + 1;'], ['hi = mid - 1;']]],
          ],
        ],
      ],
      'return -1;',
    ]),
  ];
}

/** Binary search: an Event and a Method, and a call that receives the result. */
export const binarySearch: LocalizedSpec = {
  ko: binarySearchWith('printf("%d번째\\n", i);', 'printf("없음\\n");'),
  en: binarySearchWith('printf("found at %d\\n", i);', 'printf("not found\\n");'),
};
