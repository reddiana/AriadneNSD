// Syntax highlighting of block text (R-LAY-07, ADR-0032): one small lexer per language.
// A block's text is a fragment of code, often not a complete statement (`i < n`), so the lexer
// only sorts out words: keywords, strings, numbers and comments. It never fails.
import type { TextKind } from '../model/types';

/** What a token is. Strings and numbers share one color (`syntax.literal`, visual design 3.3). */
export type TokenKind = 'keyword' | 'string' | 'number' | 'comment' | 'other';

/** A piece of text and its kind. The texts of a tokenized string join back to that string. */
export type Token = {
  readonly kind: TokenKind;
  readonly text: string;
};

/** How one language writes comments, strings and keywords. */
type Language = {
  readonly keywords: ReadonlySet<string>;
  /** Markers that start a comment to the end of the line. */
  readonly lineComments: ReadonlyArray<string>;
  /** The start and end of a comment that may span lines. */
  readonly blockComment: readonly [open: string, close: string] | null;
  /** Quote characters that start a string. */
  readonly quotes: string;
  /** Quotes whose string may span lines; other strings end at the end of the line. */
  readonly multiLineQuotes: string;
  /** Three quotes start a string that ends at three quotes (Python, Java text blocks). */
  readonly hasTripleQuotes: boolean;
  /** A backslash escapes the next character inside these quotes. */
  readonly escapingQuotes: string;
  /** `$` is part of a word (`$x` in Bash, Java and JavaScript names). */
  readonly isDollarInWord: boolean;
  /** `#include` and other directives at the start of a line are keywords (C, C++). */
  readonly hasDirectives: boolean;
  /** `#` starts a comment only at the start of a word (Bash: `${#a}` and `a#b` are not). */
  readonly isCommentAtWordStart: boolean;
  /** Word prefixes that make the next quote a string (Python `f"…"`, `rb'…'`). */
  readonly stringPrefixes: ReadonlySet<string>;
  /** `'` separates digits in numbers (C++ `1'000`). */
  readonly isQuoteDigitSeparator: boolean;
};

const words = (text: string): ReadonlySet<string> => new Set(text.split(/\s+/).filter(Boolean));

const cKeywords =
  'auto break case char const continue default do double else enum extern float for goto if ' +
  'inline int long register restrict return short signed sizeof static struct switch typedef ' +
  'union unsigned void volatile while _Bool _Complex _Imaginary _Alignas _Alignof _Atomic ' +
  '_Generic _Noreturn _Static_assert _Thread_local alignas alignof bool constexpr false nullptr ' +
  'static_assert thread_local true typeof typeof_unqual';

const cppKeywords =
  'alignas alignof and and_eq asm auto bitand bitor bool break case catch char char8_t char16_t ' +
  'char32_t class co_await co_return co_yield compl concept const const_cast consteval ' +
  'constexpr constinit continue decltype default delete do double dynamic_cast else enum ' +
  'explicit export extern false final float for friend goto if inline int long mutable ' +
  'namespace new noexcept not not_eq nullptr operator or or_eq override private protected ' +
  'public register reinterpret_cast requires return short signed sizeof static static_assert ' +
  'static_cast struct switch template this thread_local throw true try typedef typeid typename ' +
  'union unsigned using virtual void volatile wchar_t while xor xor_eq';

const javaKeywords =
  'abstract assert boolean break byte case catch char class const continue default do double ' +
  'else enum extends final finally float for goto if implements import instanceof int ' +
  'interface long native new package private protected public return short static strictfp ' +
  'super switch synchronized this throw throws transient try void volatile while true false ' +
  'null var record yield sealed permits';

// JavaScript and the TypeScript words that are keywords wherever they stand. Type names
// (`number`, `string`) are left out: they are common variable names in a fragment.
const javascriptKeywords =
  'async await break case catch class const continue debugger default delete do else export ' +
  'extends false finally for function if import in instanceof let new null of return static ' +
  'super switch this throw true try typeof undefined var void while with yield abstract as ' +
  'declare enum implements interface keyof namespace private protected public readonly ' +
  'satisfies type';

const pythonKeywords =
  'False None True and as assert async await break class continue def del elif else except ' +
  'finally for from global if import in is lambda nonlocal not or pass raise return try while ' +
  'with yield match case';

// Reserved words of the shell, and the builtins that work like them in scripts.
const bashKeywords =
  'if then else elif fi case esac for select while until do done in function time ' +
  'break continue return exit local export readonly declare';

const cLike = {
  lineComments: ['//'],
  blockComment: ['/*', '*/'],
  multiLineQuotes: '',
  hasTripleQuotes: false,
  isDollarInWord: false,
  hasDirectives: false,
  isCommentAtWordStart: false,
  stringPrefixes: words(''),
  isQuoteDigitSeparator: false,
} as const;

/** The lexer of each language, `null` for plain text (not highlighted). */
const languages: Readonly<Record<TextKind, Language | null>> = {
  plain: null,
  c: {
    ...cLike,
    keywords: words(cKeywords),
    quotes: `"'`,
    escapingQuotes: `"'`,
    hasDirectives: true,
  },
  cpp: {
    ...cLike,
    keywords: words(cppKeywords),
    quotes: `"'`,
    escapingQuotes: `"'`,
    hasDirectives: true,
    isQuoteDigitSeparator: true,
  },
  java: {
    ...cLike,
    keywords: words(javaKeywords),
    quotes: `"'`,
    escapingQuotes: `"'`,
    hasTripleQuotes: true,
    isDollarInWord: true,
  },
  javascript: {
    ...cLike,
    keywords: words(javascriptKeywords),
    quotes: '"\'`',
    escapingQuotes: '"\'`',
    multiLineQuotes: '`',
    isDollarInWord: true,
  },
  python: {
    keywords: words(pythonKeywords),
    lineComments: ['#'],
    blockComment: null,
    quotes: `"'`,
    escapingQuotes: `"'`,
    multiLineQuotes: '',
    hasTripleQuotes: true,
    isDollarInWord: false,
    hasDirectives: false,
    isCommentAtWordStart: false,
    stringPrefixes: words('r u b f br rb fr rf R U B F BR RB FR RF Br bR Rb rB Fr fR Rf rF'),
    isQuoteDigitSeparator: false,
  },
  bash: {
    keywords: words(bashKeywords),
    lineComments: ['#'],
    blockComment: null,
    quotes: `"'`,
    escapingQuotes: '"',
    multiLineQuotes: `"'`,
    hasTripleQuotes: false,
    isDollarInWord: true,
    hasDirectives: false,
    isCommentAtWordStart: true,
    stringPrefixes: words(''),
    isQuoteDigitSeparator: false,
  },
};

/** The languages of block text, in the order the document settings list them (R-LAY-06). */
export const textKinds: ReadonlyArray<TextKind> = Object.keys(languages) as TextKind[];

/** Whether a value is a language this version knows. Others are kept but drawn as plain text. */
export function isTextKind(value: unknown): value is TextKind {
  return typeof value === 'string' && Object.hasOwn(languages, value);
}

/** Letters (any script), digits, `_`: the characters of a word. */
const wordPart = /[\p{L}\p{M}\p{N}_]/u;
const wordStart = /[\p{L}\p{Nl}_]/u;
const digit = /[0-9]/;

/**
 * Splits block text into tokens of a language (ADR-0032). Plain text is one `other` token.
 * Unterminated strings end at the end of the line (or of the text, for strings that may span
 * lines); an unterminated block comment runs to the end of the text.
 */
export function tokenize(text: string, kind: TextKind): ReadonlyArray<Token> {
  const language = languages[kind];
  if (language === null || text === '') {
    return text === '' ? [] : [{ kind: 'other', text }];
  }
  return new Lexer(text, language).run();
}

class Lexer {
  private readonly tokens: Token[] = [];
  private at = 0;

  constructor(
    private readonly text: string,
    private readonly language: Language,
  ) {}

  run(): ReadonlyArray<Token> {
    while (this.at < this.text.length) {
      const end = this.comment() ?? this.string() ?? this.number() ?? this.word();
      if (end === null) {
        this.push('other', this.at + 1);
      }
    }
    return this.tokens;
  }

  /** Adds the text from here to `end` as a token, joining it to an `other` token before it. */
  private push(kind: TokenKind, end: number): number {
    const piece = this.text.slice(this.at, end);
    const last = this.tokens[this.tokens.length - 1];
    if (kind === 'other' && last?.kind === 'other') {
      this.tokens[this.tokens.length - 1] = { kind, text: last.text + piece };
    } else {
      this.tokens.push({ kind, text: piece });
    }
    this.at = end;
    return end;
  }

  private startsWith(marker: string, at = this.at): boolean {
    return this.text.startsWith(marker, at);
  }

  private lineEnd(from: number): number {
    const end = this.text.indexOf('\n', from);
    return end === -1 ? this.text.length : end;
  }

  private comment(): number | null {
    const { blockComment, lineComments } = this.language;
    if (blockComment !== null && this.startsWith(blockComment[0])) {
      const close = this.text.indexOf(blockComment[1], this.at + blockComment[0].length);
      return this.push('comment', close === -1 ? this.text.length : close + blockComment[1].length);
    }
    for (const marker of lineComments) {
      if (this.startsWith(marker) && this.isCommentHere()) {
        return this.push('comment', this.lineEnd(this.at));
      }
    }
    return null;
  }

  private isCommentHere(): boolean {
    if (!this.language.isCommentAtWordStart || this.at === 0) {
      return true;
    }
    return /[\s;|&()]/.test(this.text.charAt(this.at - 1));
  }

  /** A string starting here, with an optional word prefix (Python). */
  private string(from = this.at): number | null {
    const quote = this.text.charAt(from);
    if (quote === '' || !this.language.quotes.includes(quote)) {
      return null;
    }
    const triple = quote.repeat(3);
    if (this.language.hasTripleQuotes && this.startsWith(triple, from)) {
      const close = this.text.indexOf(triple, from + 3);
      return this.push('string', close === -1 ? this.text.length : close + 3);
    }
    const isEscaping = this.language.escapingQuotes.includes(quote);
    const isMultiLine = this.language.multiLineQuotes.includes(quote);
    let at = from + 1;
    while (at < this.text.length) {
      const char = this.text.charAt(at);
      if (char === quote) {
        return this.push('string', at + 1);
      }
      if (char === '\n' && !isMultiLine) {
        break;
      }
      at += isEscaping && char === '\\' && this.text.charAt(at + 1) !== '\n' ? 2 : 1;
    }
    return this.push('string', Math.min(at, this.text.length));
  }

  private number(): number | null {
    const text = this.text;
    const first = text.charAt(this.at);
    const startsNumber =
      digit.test(first) ||
      (first === '.' && digit.test(text.charAt(this.at + 1)) && text.charAt(this.at - 1) !== '.');
    if (!startsNumber || this.isAfterWord()) {
      return null;
    }
    let at = this.at;
    while (at < text.length) {
      const char = text.charAt(at);
      if (char === '.' && text.charAt(at + 1) === '.') {
        break; // a range `1..10`: the dots are not part of the number
      }
      if ((char === '+' || char === '-') && /[eEpP]/.test(text.charAt(at - 1))) {
        at += 1;
      } else if (
        /[0-9A-Za-z_.]/.test(char) ||
        (char === "'" &&
          this.language.isQuoteDigitSeparator &&
          /[0-9a-fA-F]/.test(text.charAt(at + 1)))
      ) {
        at += 1;
      } else {
        break;
      }
    }
    return this.push('number', at);
  }

  private isAfterWord(): boolean {
    const before = this.text.charAt(this.at - 1);
    return before !== '' && (wordPart.test(before) || this.isDollar(before));
  }

  private isDollar(char: string): boolean {
    return this.language.isDollarInWord && char === '$';
  }

  private word(): number | null {
    const text = this.text;
    const first = text.charAt(this.at);
    if (this.language.hasDirectives && first === '#' && this.isLineStart()) {
      let at = this.at + 1;
      while (at < text.length && /[A-Za-z_]/.test(text.charAt(at))) {
        at += 1;
      }
      return at > this.at + 1 ? this.push('keyword', at) : null;
    }
    // The first character may be one the regular expression treats as two UTF-16 units.
    const firstPoint = String.fromCodePoint(text.codePointAt(this.at) ?? 0);
    if (!wordStart.test(firstPoint) && !this.isDollar(first)) {
      return null;
    }
    let at = this.at + firstPoint.length;
    while (at < text.length) {
      const point = String.fromCodePoint(text.codePointAt(at) ?? 0);
      if (!wordPart.test(point) && !this.isDollar(point)) {
        break;
      }
      at += point.length;
    }
    const word = text.slice(this.at, at);
    if (this.language.stringPrefixes.has(word)) {
      // The prefix joins the string: `f"…"` is one string token, pushed from here.
      const end = this.string(at);
      if (end !== null) {
        return end;
      }
    }
    return this.push(this.language.keywords.has(word) ? 'keyword' : 'other', at);
  }

  private isLineStart(): boolean {
    const before = this.text.slice(0, this.at);
    const lineStart = before.lastIndexOf('\n') + 1;
    return before.slice(lineStart).trim() === '';
  }
}

/**
 * Tokens split into the lines of the text (`\n`), for drawing one line at a time. A token that
 * spans lines (a block comment) is cut at each line break; the breaks themselves are dropped.
 */
export function tokenLines(tokens: ReadonlyArray<Token>): ReadonlyArray<ReadonlyArray<Token>> {
  const lines: Token[][] = [[]];
  for (const token of tokens) {
    token.text.split('\n').forEach((piece, index) => {
      if (index > 0) {
        lines.push([]);
      }
      if (piece !== '') {
        lines[lines.length - 1]?.push({ kind: token.kind, text: piece });
      }
    });
  }
  return lines;
}
