// Conway's Game of Life for the algorithm gallery: one generation, with the rules as a Case on the
// number of live neighbours, on a board whose edges wrap around.
import type { DiagramSpec, LocalizedSpec } from '../examples/build-example';
import { method } from '../examples/build-example';

type LifeWords = {
  readonly newBoard: string;
  readonly survives: string;
  readonly born: string;
  readonly dies: string;
  readonly torus: string;
};

function lifeWith(words: LifeWords): ReadonlyArray<DiagramSpec> {
  return [
    method('life_step(grid)', [
      'rows, cols = len(grid), len(grid[0])',
      `nxt = [[0] * cols for _ in range(rows)]    # ${words.newBoard}`,
      [
        'for',
        'for r in range(rows)',
        [
          [
            'for',
            'for c in range(cols)',
            [
              ['call', 'live_neighbors(grid, r, c)', 'grid, r, c', 'n'],
              [
                'case',
                'n',
                [
                  ['2', [`nxt[r][c] = grid[r][c]    # ${words.survives}`]],
                  ['3', [`nxt[r][c] = 1    # ${words.born}`]],
                  ['default', [`nxt[r][c] = 0    # ${words.dies}`]],
                ],
              ],
            ],
          ],
        ],
      ],
      'return nxt',
    ]),
    method('live_neighbors(grid, r, c)', [
      'rows, cols = len(grid), len(grid[0])',
      'n = 0',
      [
        'for',
        'for dr in (-1, 0, 1)',
        [
          [
            'for',
            'for dc in (-1, 0, 1)',
            [
              [
                'if',
                '(dr, dc) != (0, 0)',
                [`n += grid[(r + dr) % rows][(c + dc) % cols]    # ${words.torus}`],
                [''],
              ],
            ],
          ],
        ],
      ],
      'return n',
    ]),
  ];
}

/** Game of Life: B3/S23 as a Case with three branches. */
export const gameOfLife: LocalizedSpec = {
  ko: lifeWith({
    newBoard: '다음 세대는 새 판에',
    survives: '산 칸은 살고 빈 칸은 그대로',
    born: '태어나거나 산다',
    dies: '외로움이나 과밀로 죽는다',
    torus: '가장자리는 맞은편과 이어진다',
  }),
  en: lifeWith({
    newBoard: 'the next generation on a new board',
    survives: 'stays as it is',
    born: 'born or survives',
    dies: 'dies of loneliness or overcrowding',
    torus: 'the edges wrap around',
  }),
  de: lifeWith({
    newBoard: 'die nächste Generation auf ein neues Feld',
    survives: 'bleibt, wie sie ist',
    born: 'wird geboren oder überlebt',
    dies: 'stirbt an Vereinsamung oder Überbevölkerung',
    torus: 'die Ränder sind miteinander verbunden',
  }),
};
