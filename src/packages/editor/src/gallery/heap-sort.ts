// Heap sort for the algorithm gallery: build a max-heap in place, then move the largest to the back.
import type { DiagramSpec, LocalizedSpec } from '../examples/build-example';
import { method } from '../examples/build-example';

type HeapSortWords = {
  readonly buildHeap: string;
  readonly sortDown: string;
  readonly largestToBack: string;
  readonly heapOrderHolds: string;
};

function heapSortWith(words: HeapSortWords): ReadonlyArray<DiagramSpec> {
  return [
    method('heap_sort(a)', [
      'n = len(a)',
      [
        'range',
        words.buildHeap,
        [
          [
            'for',
            'for i in range(n // 2 - 1, -1, -1)',
            [['call', 'sift_down(a, i, n)', 'a, i, n']],
          ],
        ],
      ],
      [
        'range',
        words.sortDown,
        [
          [
            'for',
            'for end in range(n - 1, 0, -1)',
            [
              `a[0], a[end] = a[end], a[0]    # ${words.largestToBack}`,
              ['call', 'sift_down(a, i, n)', 'a, 0, end'],
            ],
          ],
        ],
      ],
    ]),
    method('sift_down(a, i, n)', [
      [
        'endless',
        [
          'largest = i',
          'l, r = 2 * i + 1, 2 * i + 2',
          ['if', 'l < n and a[l] > a[largest]', ['largest = l'], ['']],
          ['if', 'r < n and a[r] > a[largest]', ['largest = r'], ['']],
          ['if', 'largest == i', [['exit', `return    # ${words.heapOrderHolds}`]], ['']],
          'a[i], a[largest] = a[largest], a[i]',
          'i = largest',
        ],
      ],
    ]),
  ];
}

/** Heap sort: a max-heap built bottom-up, then the root swapped to the back n - 1 times. */
export const heapSort: LocalizedSpec = {
  ko: heapSortWith({
    buildHeap: '최대 힙 만들기',
    sortDown: '하나씩 꺼내 뒤에 놓기',
    largestToBack: '가장 큰 것을 맨 뒤로',
    heapOrderHolds: '힙 조건을 지킴',
  }),
  en: heapSortWith({
    buildHeap: 'Build a max-heap',
    sortDown: 'Take them out one by one',
    largestToBack: 'largest to the back',
    heapOrderHolds: 'heap order holds',
  }),
  de: heapSortWith({
    buildHeap: 'Max-Heap aufbauen',
    sortDown: 'Einzeln entnehmen',
    largestToBack: 'das größte nach hinten',
    heapOrderHolds: 'Heap-Eigenschaft gilt',
  }),
};
