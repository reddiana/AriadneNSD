// Syntax highlighting of block text (R-LAY-07, ADR-0032): the lexer of each language.
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';

import type { TextKind } from '../model/types';
import type { Token, TokenKind } from './syntax';
import { isTextKind, textKinds, tokenize, tokenLines } from './syntax';

/** The tokens of a text that are not `other`, as `kind:text`. */
function marked(text: string, kind: TextKind): ReadonlyArray<string> {
  return tokenize(text, kind)
    .filter((token) => token.kind !== 'other')
    .map((token) => `${token.kind}:${token.text}`);
}

const of = (kind: TokenKind, text: string): Token => ({ kind, text });

describe('block text languages', () => {
  it('R-LAY-06: lists plain text first, then the code languages', () => {
    expect(textKinds).toEqual(['plain', 'c', 'cpp', 'java', 'javascript', 'python', 'bash']);
    expect(isTextKind('python')).toBe(true);
    expect(isTextKind('cobol')).toBe(false);
    expect(isTextKind('toString')).toBe(false);
    expect(isTextKind(3)).toBe(false);
  });

  it('R-LAY-07: plain text is one token and is not highlighted', () => {
    expect(tokenize('if x // y "z" 1', 'plain')).toEqual([of('other', 'if x // y "z" 1')]);
    expect(tokenize('', 'c')).toEqual([]);
    expect(tokenize('', 'plain')).toEqual([]);
  });

  it('R-LAY-07: the tokens of any text in any language join back to the text', () => {
    fc.assert(
      fc.property(
        fc.string({ unit: fc.constantFrom(...'ab1 .#/*"\'`\\\n$_e+x0f가'.split('')) }),
        fc.constantFrom(...textKinds),
        (text, kind) => {
          const tokens = tokenize(text, kind);
          expect(tokens.map((token) => token.text).join('')).toBe(text);
          expect(tokens.every((token) => token.text !== '')).toBe(true);
          const lines = tokenLines(tokens).map((line) => line.map((t) => t.text).join(''));
          expect(lines).toEqual(text.split('\n'));
        },
      ),
    );
  });
});

describe('C and C++', () => {
  it('R-LAY-07: keywords, strings, characters, numbers and both comments', () => {
    expect(marked('for (int i = 0; i < n; i++) // next', 'c')).toEqual([
      'keyword:for',
      'keyword:int',
      'number:0',
      'comment:// next',
    ]);
    expect(marked('printf("%d\\n", x); /* done */ c = \'a\';', 'c')).toEqual([
      'string:"%d\\n"',
      'comment:/* done */',
      "string:'a'",
    ]);
    expect(marked('x = 0x1Fu + 1.5e-3f + .5', 'c')).toEqual([
      'number:0x1Fu',
      'number:1.5e-3f',
      'number:.5',
    ]);
  });

  it('R-LAY-07: a directive at the start of a line is a keyword, a name with digits is not a number', () => {
    expect(marked('  #include <stdio.h>', 'c')).toEqual(['keyword:#include']);
    expect(marked('a # b', 'c')).toEqual([]);
    expect(marked('x1 = y2', 'c')).toEqual([]);
  });

  it('R-LAY-07: C++ has its own keywords and digit separators', () => {
    expect(marked("auto p = new Node(1'000); // C++", 'cpp')).toEqual([
      'keyword:auto',
      'keyword:new',
      "number:1'000",
      'comment:// C++',
    ]);
    expect(marked('class template', 'c')).toEqual([]);
    expect(marked('class template', 'cpp')).toEqual(['keyword:class', 'keyword:template']);
  });

  it('R-LAY-07: an unterminated string ends at the line, an unterminated comment at the text', () => {
    expect(tokenize('s = "open\nnext', 'c')).toEqual([
      of('other', 's = '),
      of('string', '"open'),
      of('other', '\nnext'),
    ]);
    expect(marked('a /* open\nstill', 'c')).toEqual(['comment:/* open\nstill']);
  });
});

describe('Java and JavaScript', () => {
  it('R-LAY-07: Java keywords, text blocks and names with $', () => {
    expect(marked('final var s = """\nhi""";', 'java')).toEqual([
      'keyword:final',
      'keyword:var',
      'string:"""\nhi"""',
    ]);
    expect(marked('$if = null', 'java')).toEqual(['keyword:null']);
  });

  it('R-LAY-07: JavaScript template strings may span lines; TypeScript words are keywords', () => {
    expect(marked('const t = `a\nb`; // x', 'javascript')).toEqual([
      'keyword:const',
      'string:`a\nb`',
      'comment:// x',
    ]);
    expect(marked('type Id = string; let n: number', 'javascript')).toEqual([
      'keyword:type',
      'keyword:let',
    ]);
  });
});

describe('Python', () => {
  it('R-LAY-07: # is the comment and // is floor division, not a comment', () => {
    expect(marked('total = a // 2  # half', 'python')).toEqual(['number:2', 'comment:# half']);
  });

  it('R-LAY-07: keywords, prefixed and triple-quoted strings', () => {
    expect(marked('if x is not None: print(f"{x}")', 'python')).toEqual([
      'keyword:if',
      'keyword:is',
      'keyword:not',
      'keyword:None',
      'string:f"{x}"',
    ]);
    expect(marked("doc = '''a\nb'''", 'python')).toEqual(["string:'''a\nb'''"]);
    expect(marked('for i in range(1, 10)', 'python')).toEqual([
      'keyword:for',
      'keyword:in',
      'number:1',
      'number:10',
    ]);
  });
});

describe('Bash', () => {
  it('R-LAY-07: # starts a comment only at the start of a word', () => {
    expect(marked('echo ${#files} a#b # count', 'bash')).toEqual(['comment:# count']);
    expect(marked('# all', 'bash')).toEqual(['comment:# all']);
  });

  it('R-LAY-07: reserved words, both quotes and variables', () => {
    expect(marked('if [ "$n" -gt 0 ]; then echo \'a\\\'; fi', 'bash')).toEqual([
      'keyword:if',
      'string:"$n"',
      'number:0',
      'keyword:then',
      "string:'a\\'",
      'keyword:fi',
    ]);
    expect(marked('$done done', 'bash')).toEqual(['keyword:done']);
  });
});

describe('numbers and words', () => {
  it('R-LAY-07: a range keeps its dots out of the numbers', () => {
    expect(marked('k ← 1..10', 'c')).toEqual(['number:1', 'number:10']);
  });

  it('R-LAY-07: words in other scripts are words, not keywords', () => {
    expect(marked('합계if = 0', 'c')).toEqual(['number:0']);
    expect(marked('𝑥 if', 'c')).toEqual(['keyword:if']);
  });
});
