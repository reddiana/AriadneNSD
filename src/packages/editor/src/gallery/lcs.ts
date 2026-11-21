// Longest common subsequence for the algorithm gallery: the length table, then one answer read back.
import type { DiagramSpec, LocalizedSpec } from '../examples/build-example';
import { method } from '../examples/build-example';

type LcsWords = {
  readonly cell: string;
  readonly table: string;
  readonly readBack: string;
  readonly common: string;
};

function lcsWith(words: LcsWords): ReadonlyArray<DiagramSpec> {
  return [
    method('lcs(a, b)', [
      'n, m = len(a), len(b)',
      `L = [[0] * (m + 1) for _ in range(n + 1)]    # ${words.cell}`,
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
                'for j in range(1, m + 1)',
                [
                  [
                    'if',
                    'a[i - 1] == b[j - 1]',
                    ['L[i][j] = L[i - 1][j - 1] + 1'],
                    ['L[i][j] = max(L[i - 1][j], L[i][j - 1])'],
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
          'i, j, out = n, m, []',
          [
            'while',
            'i > 0 and j > 0',
            [
              [
                'if',
                'a[i - 1] == b[j - 1]',
                [`out.append(a[i - 1])    # ${words.common}`, 'i -= 1', 'j -= 1'],
                [['if', 'L[i - 1][j] >= L[i][j - 1]', ['i -= 1'], ['j -= 1']]],
              ],
            ],
          ],
        ],
      ],
      "return ''.join(reversed(out))",
    ]),
  ];
}

/** LCS: the classic two-dimensional table, and the path back through it. */
export const lcs: LocalizedSpec = {
  ko: lcsWith({
    cell: 'a[:i]와 b[:j]의 LCS 길이',
    table: '표 채우기',
    readBack: '표를 거꾸로 따라가기',
    common: '둘 다에 있는 글자',
  }),
  en: lcsWith({
    cell: 'LCS length of a[:i] and b[:j]',
    table: 'Fill the table',
    readBack: 'Walk the table back',
    common: 'a character in both',
  }),
};
