// Prototype M41 example 6 (journal/assets/2026-10-10-ns-prototype.html, `MORE`).
import type { DiagramSpec, LocalizedSpec } from './build-example';
import { event, method } from './build-example';

/** The words of the example in one language. */
type MazeWords = {
  readonly noExit: string;
  /** The comments on `path.append(p)` and `path.pop()`, lined up with each other. */
  readonly unwind: string;
  readonly windBack: string;
};

function mazeWith(words: MazeWords): ReadonlyArray<DiagramSpec> {
  return [
    event('main()', [
      'maze = read_maze()',
      ['call', 'solve(maze, p)', 'maze, maze.entrance', 'found'],
      ['if', 'found', ['draw_thread(path)'], [`print("${words.noExit}")`]],
    ]),
    method('solve(maze, p)', [
      ['if', 'p == maze.exit', ['return True'], ['']],
      ['if', 'maze.wall(p) or p in visited', ['return False'], ['']],
      'visited.add(p)',
      `path.append(p)    # ${words.unwind}`,
      [
        'while',
        'for d in (N, E, S, W)',
        [
          ['call', 'solve(maze, p)', 'maze, p + d', 'ok'],
          ['if', 'ok', ['return True'], ['']],
        ],
      ],
      `path.pop()        # ${words.windBack}`,
      'return False',
    ]),
  ];
}

/** Maze (Ariadne's thread): backtracking with a recursive Method. */
export const maze: LocalizedSpec = {
  ko: mazeWith({ noExit: '출구 없음', unwind: '실을 푼다', windBack: '실을 감는다' }),
  en: mazeWith({ noExit: 'no way out', unwind: 'unwind the thread', windBack: 'wind it back' }),
};
