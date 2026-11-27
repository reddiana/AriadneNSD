// Tower of Hanoi for the algorithm gallery: move n - 1 out of the way, the largest, then n - 1 back.
import type { DiagramSpec, LocalizedSpec } from '../examples/build-example';
import { event, method } from '../examples/build-example';

type HanoiWords = {
  readonly move: string;
  readonly moves: string;
  readonly outOfTheWay: string;
};

function hanoiWith(words: HanoiWords): ReadonlyArray<DiagramSpec> {
  return [
    event('main()', [
      `n = 3    # ${words.moves}`,
      ['call', 'hanoi(n, src, dst, via)', 'n, "A", "C", "B"'],
    ]),
    method('hanoi(n, src, dst, via)', [
      ['if', 'n == 0', [['exit', 'return']], ['']],
      ['call', 'hanoi(n, src, dst, via)', 'n - 1, src, via, dst'],
      `print(f"${words.move}")    # ${words.outOfTheWay}`,
      ['call', 'hanoi(n, src, dst, via)', 'n - 1, via, dst, src'],
    ]),
  ];
}

/** Tower of Hanoi: 2^n - 1 moves from three lines of recursion. */
export const hanoi: LocalizedSpec = {
  ko: hanoiWith({
    move: '원반 {n}: {src} -> {dst}',
    moves: '2**3 - 1 = 7번 옮긴다',
    outOfTheWay: '위의 n - 1개는 via에 비켜 있다',
  }),
  en: hanoiWith({
    move: 'disk {n}: {src} -> {dst}',
    moves: '2**3 - 1 = 7 moves',
    outOfTheWay: 'the n - 1 above wait on via',
  }),
};
