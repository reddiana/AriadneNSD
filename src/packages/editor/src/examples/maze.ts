// Prototype M41 example 6 (journal/assets/2026-10-10-ns-prototype.html, `MORE`).
import type { DiagramSpec } from './build-example';
import { event, method } from './build-example';

/** Maze (Ariadne's thread): backtracking with a recursive Method. */
export const maze: ReadonlyArray<DiagramSpec> = [
  event('main()', [
    'maze = read_maze()',
    ['call', 'solve(maze, p)', 'maze, maze.entrance', 'found'],
    ['if', 'found', ['draw_thread(path)'], ['print("출구 없음")']],
  ]),
  method('solve(maze, p)', [
    ['if', 'p == maze.exit', ['return True'], ['']],
    ['if', 'maze.wall(p) or p in visited', ['return False'], ['']],
    'visited.add(p)',
    'path.append(p)    # 실을 푼다',
    [
      'while',
      'for d in (N, E, S, W)',
      [
        ['call', 'solve(maze, p)', 'maze, p + d', 'ok'],
        ['if', 'ok', ['return True'], ['']],
      ],
    ],
    'path.pop()        # 실을 감는다',
    'return False',
  ]),
];
