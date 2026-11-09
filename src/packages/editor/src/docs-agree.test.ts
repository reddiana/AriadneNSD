// Facts of the editor written both in the code and in a document, compared value by value
// (coding guide 13): every key of the key table is in the keymap document (03-keymap), and the
// screen colors and the edit layer colors are the tables of 04-visual-design 3.4, in the UI's
// style sheet, in the overlay and in the web page around the editor.
import { readFileSync } from 'node:fs';

import { defaultTheme, primitiveColors } from '@ariadne-nsd/core';
import { describe, expect, it } from 'vitest';

import { editColors, editColorsOnDark } from './dom/overlay';
import { keyBindings } from './input/keys';
import { chromeCss } from './ui/styles';

const repo = new URL('../../../../', import.meta.url);
const read = (path: string): string =>
  readFileSync(new URL(path, repo), 'utf8')
    .replaceAll('\r\n', '\n')
    .replace(/<span class="color-chip"[^>]*><\/span> /g, '');

/** The code spans of a text: "`a` (`#fff`)" → ["a", "#fff"]. */
const codes = (text: string): string[] => [...text.matchAll(/`([^`]+)`/g)].map((m) => m[1] ?? '');

/** The cells of a table row. */
const cells = (line: string): string[] =>
  line
    .slice(1, -1)
    .split(/(?<!\\)\|/)
    .map((cell) => cell.trim());

/** The tables (as rows of cells, header left out) whose header row is exactly `header`. */
function tables(text: string, header: string): string[][][] {
  const found: string[][][] = [];
  const lines = text.split('\n');
  for (const [at, line] of lines.entries()) {
    if (line !== header) {
      continue;
    }
    const table: string[][] = [];
    for (const row of lines.slice(at + 2)) {
      if (!row.startsWith('|')) {
        break;
      }
      table.push(cells(row));
    }
    found.push(table);
  }
  return found;
}

describe('the keymap document', () => {
  const keymap = read('docs/02-ux-design/03-keymap.md');
  const named: Readonly<Record<string, string>> = {
    ArrowLeft: '←',
    ArrowRight: '→',
    ArrowUp: '↑',
    ArrowDown: '↓',
    Escape: 'Esc',
  };

  /** One key as the document writes it: `Ctrl+↑`; a letter with Shift alone is the capital. */
  function stroke(parts: ReadonlyArray<string>): string {
    const keys = parts.map((part) => named[part] ?? part);
    const last = keys[keys.length - 1] ?? '';
    if (keys.length === 2 && keys[0] === 'Shift' && /^[a-zA-Z]$/.test(last)) {
      return last.toUpperCase();
    }
    return keys.join('+');
  }

  /** A binding's keys (`'Ctrl+ArrowUp'`, `'g g'`) as the document would write them. */
  const spelled = (keys: string): string =>
    keys
      .split(' ')
      .map((key) => stroke(key === '+' ? ['+'] : key.split('+')))
      .join(' ');

  /**
   * Every key the key table of the document writes, in the spelling of `spelled`. A cell writes
   * `Ctrl`+`↑` `↓` for both arrows with Ctrl, `gg` or `a` `p` for two keys in a row, and lists
   * alternatives with spaces, commas or slashes.
   */
  function documentedKeys(): Set<string> {
    const found = new Set<string>();
    const [table] = tables(keymap, '| 묶음 | 명령 | Vim 키 | 표준 키 |');
    expect(table?.length).toBeGreaterThan(30);
    for (const row of table ?? []) {
      for (const cell of row.slice(2)) {
        for (const group of cell.matchAll(/((?:`[^`]+`\+)*)`([^`]+)`((?: `[^`]+`)*)/g)) {
          const modifiers = codes(group[1] ?? '');
          const keys = [group[2] ?? '', ...codes(group[3] ?? '')];
          for (const [at, key] of keys.entries()) {
            const isPair = modifiers.length === 0 && /^[^\sA-Z]{2}$|^z[A-Z]$/.test(key);
            found.add(isPair ? `${key.charAt(0)} ${key.charAt(1)}` : stroke([...modifiers, key]));
            const next = keys[at + 1];
            if (modifiers.length === 0 && next !== undefined) {
              found.add(`${stroke([key])} ${stroke([next])}`);
            }
          }
        }
      }
    }
    return found;
  }

  it('T-1167 · R-EDIT-04: every key of the key table is in the keymap document', () => {
    const documented = documentedKeys();
    // The kind letters after `a`, `A` and `s` are one sentence of the document.
    const sentence = /종류 글자는 ([^.]*)\./.exec(keymap)?.[1] ?? '';
    const kindLetters = new Set(codes(sentence));
    expect(kindLetters.size).toBeGreaterThan(5);
    const missing = keyBindings
      .map((binding) => binding.keys)
      .filter((keys) => {
        const kind = /^([aAs]) (\w)$/.exec(keys);
        if (kind !== null) {
          return !documented.has(kind[1] ?? '') || !kindLetters.has(kind[2] ?? '');
        }
        return !documented.has(spelled(keys));
      });
    expect([...new Set(missing)]).toEqual([]);
  });
});

describe('the screen and edit layer colors', () => {
  const design = read('docs/02-ux-design/04-visual-design.md');
  const screenTables = tables(design, '| 토큰 | 밝은 화면 | 어두운 화면 | 역할 |');
  const [paperTable] = tables(design, '| 토큰 | 밝은 종이 | 어두운 종이 | 역할 |');
  const normalize = (value: string): string => value.replace(/\s+/g, '').toLowerCase();

  /** A table of 3.4 as token → [light, dark]. */
  function screenColors(
    table: ReadonlyArray<ReadonlyArray<string>> | undefined,
  ): Map<string, string[]> {
    const colors = new Map<string, string[]>();
    for (const row of table ?? []) {
      const [token] = codes(row[0] ?? '');
      if (token !== undefined) {
        colors.set(
          token,
          [row[1] ?? '', row[2] ?? ''].map((cell) => normalize(codes(cell)[0] ?? '')),
        );
      }
    }
    return colors;
  }
  const normal = screenColors(screenTables[0]);
  const highContrast = screenColors(screenTables[1]);

  /** The `--prefix-*` declarations of each `selector {` block of a style sheet part. */
  function declarations(css: string, selector: string, prefix: string): Map<string, string> {
    const at = css.indexOf(`${selector} {`);
    expect(at, selector).toBeGreaterThan(-1);
    const block = css.slice(at, css.indexOf('}', at));
    return new Map(
      [...block.matchAll(new RegExp(`--${prefix}-([a-z-]+):\\s*([^;]+);`, 'g'))].map((m) => [
        `ui.${m[1] ?? ''}`,
        normalize(m[2] ?? ''),
      ]),
    );
  }

  /** The colors of one scheme in one table, as `ui.*` → value. */
  const scheme = (colors: Map<string, string[]>, dark: boolean): Map<string, string> =>
    new Map(
      [...colors].map(([token, [light = '', darkValue = '']]) => [token, dark ? darkValue : light]),
    );

  it('T-1168 · R-NFR-07: the UI’s screen color tokens are the tables of 3.4, light and dark, normal and high contrast', () => {
    const contrast = chromeCss.indexOf('@media (prefers-contrast: more)');
    const [base, more] = [chromeCss.slice(0, contrast), chromeCss.slice(contrast)];
    const dark = ".ans-app[data-scheme='dark']";
    expect(normal.size).toBeGreaterThan(8);
    expect(declarations(base, '.ans-app', 'ui')).toEqual(scheme(normal, false));
    expect(declarations(base, dark, 'ui')).toEqual(scheme(normal, true));
    expect(declarations(more, '.ans-app', 'ui')).toEqual(scheme(highContrast, false));
    expect(declarations(more, dark, 'ui')).toEqual(scheme(highContrast, true));
    // Colors are written only where a token is defined; the example thumbnails sit on the paper.
    const rest = chromeCss
      .replace(/--ui-[a-z-]+:[^;]+;/g, '')
      .replaceAll(`background: ${defaultTheme.colors.paper};`, '');
    expect(rest.match(/#[0-9a-f]{3,8}\b|rgba?\(/gi)).toBeNull();
  });

  it('T-1169 · R-NFR-07: the web page around the editor uses the same screen colors', () => {
    const css = read('src/apps/web/src/web.css');
    const sheets = [
      { media: '', colors: scheme(normal, false) },
      { media: '@media (prefers-color-scheme: dark) {', colors: scheme(normal, true) },
      { media: '@media (prefers-contrast: more) {', colors: scheme(highContrast, false) },
      {
        media: '@media (prefers-contrast: more) and (prefers-color-scheme: dark) {',
        colors: scheme(highContrast, true),
      },
    ];
    for (const { media, colors } of sheets) {
      const part = media === '' ? css : css.slice(css.indexOf(media));
      const found = declarations(part, ':root', 'web');
      expect(found.size, media).toBeGreaterThan(0);
      for (const [token, value] of found) {
        expect(value, `${media} ${token}`).toBe(colors.get(token));
      }
    }
  });

  it('T-1170 · UX TM4: the edit layer colors are the table of 3.4, on light and on dark paper', () => {
    /** A cell's color: its `#hex`, or the value of the primitive it names. */
    const colorOf = (cell: string): string => {
      const [first, second] = codes(cell);
      const value = second ?? first ?? '';
      return value.startsWith('#')
        ? value
        : (Object.entries(primitiveColors).find(([token]) => token === value)?.[1] ?? value);
    };
    const light: Record<string, string> = {};
    const dark: Record<string, string> = {};
    for (const row of paperTable ?? []) {
      const [token] = codes(row[0] ?? '');
      if (token !== undefined) {
        light[token] = colorOf(row[1] ?? '');
        dark[token] = colorOf(row[2] ?? '');
      }
    }
    expect(light).toEqual(editColors);
    expect(dark).toEqual(editColorsOnDark);
  });
});
