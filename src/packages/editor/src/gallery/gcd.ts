// Euclid's algorithm for the algorithm gallery: the GCD as a loop, and the extended version as
// recursion that also finds x and y with a·x + b·y = gcd(a, b).
import type { DiagramSpec, LocalizedSpec } from '../examples/build-example';
import { event, method } from '../examples/build-example';

type GcdWords = {
  readonly backSubstitute: string;
};

function gcdWith(words: GcdWords): ReadonlyArray<DiagramSpec> {
  return [
    event('main()', [
      ['call', 'gcd(a, b)', '240, 46', 'g'],
      'print(g)    # 2',
      ['call', 'ext_gcd(a, b)', '240, 46', 'g, x, y'],
      'print(x, y)    # -9 47: 240·(-9) + 46·47 = 2',
    ]),
    method('gcd(a, b)', [
      ['while', 'b != 0', ['a, b = b, a % b    # gcd(a, b) = gcd(b, a mod b)']],
      'return a',
    ]),
    method('ext_gcd(a, b)', [
      ['if', 'b == 0', [['exit', 'return a, 1, 0']], ['']],
      ['call', 'ext_gcd(a, b)', 'b, a % b', 'g, x, y'],
      `return g, y, x - (a // b) * y    # ${words.backSubstitute}`,
    ]),
  ];
}

/** Euclid: gcd(a, b) = gcd(b, a mod b), and the extended form that gives Bézout's x and y. */
export const gcd: LocalizedSpec = {
  ko: gcdWith({ backSubstitute: '거꾸로 대입한다' }),
  en: gcdWith({ backSubstitute: 'substitute back' }),
  de: gcdWith({ backSubstitute: 'rückwärts einsetzen' }),
};
