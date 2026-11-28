// The tables of the interaction rules' common rules, read from the document, and the frame the
// table tests share (03-editor 3.5). The tables are the specification: each test writes the
// cell's words as they are in the document next to what the editor must do, and compares both.
// A changed cell fails its own test; a row or column added or removed fails the shape test.
import { readFileSync } from 'node:fs';

const repo = new URL('../../../../../', import.meta.url);

const rules = readFileSync(new URL('docs/02-ux-design/02-interaction-rules.md', repo), 'utf8')
  .replaceAll('\r\n', '\n')
  .split('\n');

/** A cell as read: wiki links become their shown text, and bold marks go. */
const plain = (cell: string): string =>
  cell
    .replace(/\[\[(?:[^\]|]*?)\\?\|([^\]]*)\]\]/g, '$1')
    .replace(/\[\[#?([^\]]*)\]\]/g, '$1')
    .replaceAll('**', '')
    .replaceAll('`', '')
    .replaceAll('\\|', '|')
    .trim();

const cellsOf = (line: string): string[] =>
  line
    .slice(1, -1)
    .split(/(?<!\\)\|/)
    .map(plain);

/** One table of the document: the header cells and the rows. */
export type Table = {
  readonly header: ReadonlyArray<string>;
  readonly rows: ReadonlyArray<ReadonlyArray<string>>;
};

/** The one table under the heading `heading` whose header row starts with `first`. */
export function ruleTable(heading: string, first: ReadonlyArray<string>): Table {
  const start = rules.indexOf(heading);
  if (start < 0) {
    throw new Error(`No heading ${heading}`);
  }
  for (let at = start + 1; at < rules.length; at += 1) {
    const line = rules[at] ?? '';
    if (/^##+ /.test(line)) {
      break;
    }
    if (!line.startsWith('|')) {
      continue;
    }
    const header = cellsOf(line);
    const body: string[][] = [];
    let end = at + 2;
    for (; (rules[end] ?? '').startsWith('|'); end += 1) {
      body.push(cellsOf(rules[end] ?? ''));
    }
    if (first.every((cell, i) => header[i] === cell)) {
      return { header, rows: body };
    }
    at = end - 1;
  }
  throw new Error(`No table ${first.join(' | ')} under ${heading}`);
}

/** The cell of the row named `row` (its first column) under the column `column`. */
export function cellOf(table: Table, row: string, column: string): string {
  const found = table.rows.find((cells) => cells[0] === row);
  const at = table.header.indexOf(column);
  const value = found?.[at];
  if (value === undefined) {
    throw new Error(`No cell ${row} × ${column}`);
  }
  return value;
}

/** One cell under test: where it is, what the document says there, and the editor's behavior. */
export type CellCase = {
  readonly row: string;
  readonly column: string;
  /** The cell's words in the document (plain text). */
  readonly doc: string;
  /** What the editor must do. Left out when the cell only restates what other cells check. */
  readonly check?: () => void | Promise<void>;
};

/** The cases with the name a test shows. */
export const withNames = <T extends CellCase>(
  cases: ReadonlyArray<T>,
): ReadonlyArray<T & { readonly name: string }> =>
  cases.map((c) => ({ ...c, name: `${c.row} × ${c.column}` }));

/** The `row × column` keys of a table's cells, the first column left out. */
export const tableKeys = (table: Table, skip: ReadonlyArray<string> = []): string[] =>
  table.rows.flatMap((cells) =>
    table.header
      .slice(1)
      .filter((column) => !skip.includes(column))
      .map((column) => `${cells[0] ?? ''} × ${column}`),
  );

export const caseKeys = (cases: ReadonlyArray<CellCase>): string[] =>
  cases.map((c) => `${c.row} × ${c.column}`);
