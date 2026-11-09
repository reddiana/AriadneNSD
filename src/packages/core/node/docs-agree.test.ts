// Facts written both in the code and in a document, compared value by value (coding guide 13):
// the format version in the file format spec's front matter, the colors of the visual design
// (04-visual-design 3 and 9.3) against the palette and the themes, and the libraries of every
// package against the technology stack of the architecture (03-architecture 8.1 and 8.2).
//
// It lives outside src/ because it reads the documents with node:fs (core-no-node-builtins).
import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import schema from '../schema/model.schema.json' with { type: 'json' };
import type { ColorToken } from '../src/index';
import { currentFormatVersion, primitiveColors, themeFor } from '../src/index';

const repo = new URL('../../../../', import.meta.url);
const read = (path: string): string =>
  readFileSync(new URL(path, repo), 'utf8').replaceAll('\r\n', '\n');

/** The text of a document without the color chips put before color codes. */
const plain = (path: string): string =>
  read(path).replace(/<span class="color-chip"[^>]*><\/span> /g, '');

/** The lines of one section: from its heading to the next heading of the same or a higher level. */
function section(text: string, heading: string): string[] {
  const lines = text.split('\n');
  const start = lines.findIndex((line) => line.startsWith(`${heading} `) || line === heading);
  if (start === -1) {
    throw new Error(`no section ${heading}`);
  }
  const level = /^#+/.exec(heading)?.[0].length ?? 0;
  const end = lines.findIndex(
    (line, at) => at > start && /^#+ /.test(line) && (/^#+/.exec(line)?.[0].length ?? 0) <= level,
  );
  return lines.slice(start + 1, end === -1 ? undefined : end);
}

/** The cells of the table rows of some lines, header and separator left out. */
function rows(lines: ReadonlyArray<string>): string[][] {
  return lines
    .filter((line) => line.startsWith('|') && !/^\|\s*-/.test(line))
    .map((line) =>
      line
        .slice(1, -1)
        .split(/(?<!\\)\|/)
        .map((cell) => cell.trim()),
    )
    .slice(1);
}

/** The code spans of a cell: "`a` (`#fff`)" → ["a", "#fff"]. */
const codes = (cell: string): string[] => [...cell.matchAll(/`([^`]+)`/g)].map((m) => m[1] ?? '');

describe('the file format spec', () => {
  it('T-1162 · R-FMT-02: its front matter names the format version that core writes and the schema allows', () => {
    const spec = read('docs/05-spec/01-file-format.md');
    const frontMatter = /^---\n([\s\S]*?)\n---/.exec(spec)?.[1] ?? '';
    expect(/^format-version: (\d+)$/m.exec(frontMatter)?.[1]).toBe(String(currentFormatVersion));
    expect(schema.properties.version.const).toBe(currentFormatVersion);
  });
});

describe('the visual design', () => {
  const doc = plain('docs/02-ux-design/04-visual-design.md');

  /** Every "`token` | `#hex`" and "`token` (`#hex`)" of the document: the primitives it names. */
  function documentedPrimitives(): Map<string, string> {
    const found = new Map<string, string>();
    const add = (token: string, value: string): void => {
      expect(found.get(token) ?? value, token).toBe(value);
      found.set(token, value);
    };
    for (const row of rows(section(doc, '### 3.2'))) {
      for (let at = 0; at + 1 < row.length; at += 3) {
        const [token, value] = [codes(row[at] ?? '')[0], codes(row[at + 1] ?? '')[0]];
        if (token !== undefined && value !== undefined) {
          add(token, value);
        }
      }
    }
    for (const match of doc.matchAll(/`([a-z]+(?:\.[a-z0-9-]+)?)` ?\(`(#[0-9a-f]{6})`\)/g)) {
      add(match[1] ?? '', match[2] ?? '');
    }
    return found;
  }

  it('T-1163 · R-LAY-08: the primitive palette is the one of the document, token by token', () => {
    const documented = documentedPrimitives();
    expect(Object.fromEntries(documented)).toEqual(primitiveColors);
  });

  /** The token → primitive table of a theme (3.3, 3.5, 3.6) as the colors it gives. */
  function themeTable(heading: string): Map<string, string> {
    const colors = new Map<string, string>();
    for (const row of rows(section(doc, heading))) {
      const [token] = codes(row[0] ?? '');
      const [primitive, value] = codes(row[1] ?? '');
      if (token === undefined || primitive === undefined) {
        continue;
      }
      const color = primitiveColors[primitive as keyof typeof primitiveColors];
      expect(color, `${heading} ${token} → ${primitive}`).toBeDefined();
      if (value !== undefined) {
        expect(value, `${heading} ${primitive}`).toBe(color);
      }
      colors.set(token, color);
    }
    return colors;
  }

  it('T-1164 · R-LAY-08 · R-NFR-07: each theme gives every token the color of its table in the document', () => {
    for (const [id, heading] of [
      ['default', '### 3.3'],
      ['dark', '### 3.5'],
      ['high-contrast', '### 3.6'],
    ] as const) {
      expect(Object.fromEntries(themeTable(heading)), id).toEqual(themeFor(id).colors);
    }
  });

  it('T-1165 · R-LAY-08: the black and white print theme is the table of 9.3', () => {
    const print = themeFor('print').colors;
    const tokens = Object.keys(print) as ColorToken[];
    const covered = new Set<string>();
    for (const row of rows(section(doc, '### 9.3'))) {
      const [value] = codes(row[1] ?? '');
      const sameAs = /^`([a-z.]+)`와 같음/.exec(row[1] ?? '')?.[1] as ColorToken | undefined;
      for (const name of codes(row[0] ?? '')) {
        const matching = name.endsWith('.*')
          ? tokens.filter((token) => token.startsWith(name.slice(0, -1)))
          : tokens.filter((token) => token === name);
        expect(matching.length, name).toBeGreaterThan(0);
        for (const token of matching) {
          expect(print[token], token).toBe(sameAs === undefined ? value : print[sameAs]);
          covered.add(token);
        }
      }
    }
    expect([...covered].sort()).toEqual([...tokens].sort());
  });
});

describe('the technology stack', () => {
  const architecture = read('docs/03-architecture/03-architecture.md');
  const stack = (heading: string): string => section(architecture, heading).join('\n');
  const shipped = stack('### 8.1');
  const tools = stack('### 8.2');

  type Manifest = {
    readonly dependencies?: Readonly<Record<string, string>>;
    readonly devDependencies?: Readonly<Record<string, string>>;
  };
  const manifests = [
    'src/package.json',
    'src/packages/core/package.json',
    'src/packages/editor/package.json',
    'src/packages/fonts/package.json',
    'src/apps/web/package.json',
    'src/apps/manual/package.json',
  ].map((path) => ({ path, manifest: JSON.parse(read(path)) as Manifest }));

  /** Whether a text names a package: the name itself, as a word, in any case. */
  const names = (text: string, name: string): boolean =>
    new RegExp(
      `(^|[^\\w@/-])${name.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')}($|[^\\w/-])`,
      'i',
    ).test(text);
  /** Our own packages and the type packages of a library listed under the library's name. */
  const isOwnOrTypes = (name: string): boolean =>
    name.startsWith('@ariadne-nsd/') || name.startsWith('@types/');

  it('T-1166: every library the product ships is in 8.1, and every development tool in 8.2', () => {
    const missing: string[] = [];
    for (const { path, manifest } of manifests) {
      for (const name of Object.keys(manifest.dependencies ?? {}).filter((n) => !isOwnOrTypes(n))) {
        if (!names(shipped, name)) {
          missing.push(`${path}: dependency ${name} is not in 8.1`);
        }
      }
      for (const name of Object.keys(manifest.devDependencies ?? {}).filter(
        (n) => !isOwnOrTypes(n),
      )) {
        if (!names(tools, name)) {
          missing.push(`${path}: devDependency ${name} is not in 8.2`);
        }
      }
    }
    expect(missing).toEqual([]);
  });
});
