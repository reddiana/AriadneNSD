// KMP string search for the algorithm gallery: the prefix function, then one pass over the text.
import type { DiagramSpec, LocalizedSpec } from '../examples/build-example';
import { method } from '../examples/build-example';

type KmpWords = {
  readonly fallBack: string;
  readonly found: string;
  readonly longestBorder: string;
};

function kmpWith(words: KmpWords): ReadonlyArray<DiagramSpec> {
  return [
    method('kmp_search(text, pat)', [
      ['call', 'prefix_function(p)', 'pat', 'pi'],
      'matches, k = [], 0',
      [
        'for',
        'for i, c in enumerate(text)',
        [
          ['while', 'k > 0 and c != pat[k]', [`k = pi[k - 1]    # ${words.fallBack}`]],
          ['if', 'c == pat[k]', ['k += 1'], ['']],
          [
            'if',
            'k == len(pat)',
            [`matches.append(i - k + 1)    # ${words.found}`, 'k = pi[k - 1]'],
            [''],
          ],
        ],
      ],
      'return matches',
    ]),
    method('prefix_function(p)', [
      `pi = [0] * len(p)    # ${words.longestBorder}`,
      'k = 0',
      [
        'for',
        'for i in range(1, len(p))',
        [
          ['while', 'k > 0 and p[i] != p[k]', ['k = pi[k - 1]']],
          ['if', 'p[i] == p[k]', ['k += 1'], ['']],
          'pi[i] = k',
        ],
      ],
      'return pi',
    ]),
  ];
}

/** Knuth–Morris–Pratt: never moves back in the text, falls back in the pattern instead. */
export const kmp: LocalizedSpec = {
  ko: kmpWith({
    fallBack: '패턴 안에서 물러난다',
    found: '찾았다',
    longestBorder: 'p[:i+1]의 접두사이자 접미사인 가장 긴 길이',
  }),
  en: kmpWith({
    fallBack: 'fall back in the pattern',
    found: 'found',
    longestBorder: 'longest proper prefix of p[:i+1] that is also its suffix',
  }),
  de: kmpWith({
    fallBack: 'im Muster zurückfallen',
    found: 'gefunden',
    longestBorder: 'längstes echtes Präfix von p[:i+1], das auch sein Suffix ist',
  }),
};
