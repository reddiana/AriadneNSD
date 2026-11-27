// N-Queens for the algorithm gallery: backtracking row by row, with the attacked columns and
// diagonals kept in sets so each check is O(1).
import type { DiagramSpec, LocalizedSpec } from '../examples/build-example';
import { event, method } from '../examples/build-example';

type NQueensWords = {
  readonly solutions: string;
  readonly allPlaced: string;
  readonly attacked: string;
  readonly place: string;
  readonly undo: string;
};

function nQueensWith(words: NQueensWords): ReadonlyArray<DiagramSpec> {
  return [
    event('main()', [
      'n = 8',
      'board, solutions = [], []',
      'cols, diag1, diag2 = set(), set(), set()',
      ['call', 'place(row)', '0'],
      `print(len(solutions))    # ${words.solutions}`,
    ]),
    method('place(row)', [
      [
        'if',
        'row == n',
        [`solutions.append(board[:])    # ${words.allPlaced}`, ['exit', 'return']],
        [''],
      ],
      [
        'for',
        'for c in range(n)',
        [
          [
            'if',
            'c in cols or row - c in diag1 or row + c in diag2',
            [['exit', `continue    # ${words.attacked}`]],
            [''],
          ],
          `board.append(c)    # ${words.place}`,
          'cols.add(c); diag1.add(row - c); diag2.add(row + c)',
          ['call', 'place(row)', 'row + 1'],
          `board.pop()    # ${words.undo}`,
          'cols.remove(c); diag1.remove(row - c); diag2.remove(row + c)',
        ],
      ],
    ]),
  ];
}

/** N-Queens: place a queen per row, back up when no column is safe. */
export const nQueens: LocalizedSpec = {
  ko: nQueensWith({
    solutions: '92가지',
    allPlaced: '여왕을 다 놓았다',
    attacked: '공격받는 칸',
    place: '놓아 본다',
    undo: '되돌린다',
  }),
  en: nQueensWith({
    solutions: '92 solutions',
    allPlaced: 'every queen placed',
    attacked: 'attacked square',
    place: 'try it here',
    undo: 'take it back',
  }),
};
