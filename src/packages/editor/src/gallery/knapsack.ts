// 0/1 knapsack for the algorithm gallery: the dynamic programming table, then the items read back.
import type { DiagramSpec, LocalizedSpec } from '../examples/build-example';
import { method } from '../examples/build-example';

type KnapsackWords = {
  readonly table: string;
  readonly cell: string;
  readonly leaveOut: string;
  readonly putIn: string;
  readonly readBack: string;
  readonly itemTaken: string;
};

function knapsackWith(words: KnapsackWords): ReadonlyArray<DiagramSpec> {
  return [
    method('knapsack(w, v, W)', [
      'n = len(w)',
      `dp = [[0] * (W + 1) for _ in range(n + 1)]    # ${words.cell}`,
      [
        'range',
        words.table,
        [
          [
            'for',
            'for i in range(1, n + 1)',
            [
              [
                'for',
                'for c in range(W + 1)',
                [
                  `dp[i][c] = dp[i - 1][c]    # ${words.leaveOut}`,
                  [
                    'if',
                    'w[i - 1] <= c',
                    [
                      `take = dp[i - 1][c - w[i - 1]] + v[i - 1]    # ${words.putIn}`,
                      ['if', 'take > dp[i][c]', ['dp[i][c] = take'], ['']],
                    ],
                    [''],
                  ],
                ],
              ],
            ],
          ],
        ],
      ],
      [
        'range',
        words.readBack,
        [
          'items, c = [], W',
          [
            'for',
            'for i in range(n, 0, -1)',
            [
              [
                'if',
                'dp[i][c] != dp[i - 1][c]',
                [`items.append(i - 1)    # ${words.itemTaken}`, 'c -= w[i - 1]'],
                [''],
              ],
            ],
          ],
        ],
      ],
      'return dp[n][W], items',
    ]),
  ];
}

/** 0/1 knapsack: each item in or out, the best value for every capacity, then the chosen items. */
export const knapsack: LocalizedSpec = {
  ko: knapsackWith({
    table: '표 채우기',
    cell: '앞 i개로 무게 c까지 담는 최대 가치',
    leaveOut: 'i번째를 넣지 않는다',
    putIn: 'i번째를 넣는다',
    readBack: '고른 물건 되짚기',
    itemTaken: '이 물건을 넣었다',
  }),
  en: knapsackWith({
    table: 'Fill the table',
    cell: 'best value of the first i items within weight c',
    leaveOut: 'leave item i out',
    putIn: 'put item i in',
    readBack: 'Read the chosen items back',
    itemTaken: 'this item was taken',
  }),
  de: knapsackWith({
    table: 'Tabelle füllen',
    cell: 'bester Wert der ersten i Gegenstände bis Gewicht c',
    leaveOut: 'Gegenstand i weglassen',
    putIn: 'Gegenstand i einpacken',
    readBack: 'Gewählte Gegenstände zurückverfolgen',
    itemTaken: 'dieser Gegenstand wurde gewählt',
  }),
};
