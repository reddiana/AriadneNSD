// The skill's documents, run as tests (doctest, as for /llms.txt): every ```json example in SKILL.md
// and its references opens with the app's parser and passes the model's JSON Schema, the lists of
// values it names are core's lists, and the files it links to exist.
import { readdirSync, readFileSync } from 'node:fs';

import {
  blockKinds,
  headStyles,
  locales,
  parseModelJson,
  textKinds,
  themeIds,
} from '@ariadne-nsd/core';
import schema from '@ariadne-nsd/core/model.schema.json' with { type: 'json' };
import { Ajv2020 } from 'ajv/dist/2020.js';
import { describe, expect, it } from 'vitest';

const skill = new URL('../skill/', import.meta.url);
const read = (path: string): string =>
  readFileSync(new URL(path, skill), 'utf8').replaceAll('\r\n', '\n');
const documents = [
  'SKILL.md',
  ...readdirSync(new URL('references/', skill)).map((name) => `references/${name}`),
];
const validate = new Ajv2020({ strict: true }).compile(schema);

type Example = { readonly line: number; readonly text: string; readonly skip: string | null };

/** The ```json blocks of a text, with the reason when the line before says to skip it. */
function jsonExamples(text: string): Example[] {
  const lines = text.split('\n');
  const examples: Example[] = [];
  for (let index = 0; index < lines.length; index += 1) {
    if (lines[index]?.trim() !== '```json') {
      continue;
    }
    const end = lines.findIndex((line, at) => at > index && line.trim() === '```');
    const before = [...lines.slice(0, index)].reverse().find((line) => line.trim() !== '') ?? '';
    const skip = /<!-- doctest: skip: (.+?) -->/.exec(before)?.[1] ?? null;
    examples.push({ line: index + 1, text: lines.slice(index + 1, end).join('\n'), skip });
    index = end;
  }
  return examples;
}

/** The model an example stands for: itself, or a model around a single block. */
function modelOf(example: Example): unknown {
  const value = JSON.parse(example.text) as Record<string, unknown>;
  if ('format' in value) {
    return value;
  }
  if ('kind' in value) {
    return {
      format: 'ariadne-nsd',
      version: 1,
      settings: { textKind: 'plain', theme: 'default', headStyle: 'title', locale: 'en' },
      diagrams: [{ id: 'd1', body: [value] }],
      view: { folded: [], opened: [], bands: true, resultSymbol: '←' },
    };
  }
  throw new Error(`line ${String(example.line)}: not a model or a block`);
}

/** Values as code, joined with commas, or with commas and a last "or". */
function listed(values: ReadonlyArray<string>, last: 'or' | ','): string {
  const marked = values.map((value) => `\`${value}\``);
  return last === ','
    ? marked.join(', ')
    : `${marked.slice(0, -1).join(', ')} or ${marked.at(-1) ?? ''}`;
}

describe('the skill’s documents (doctest)', () => {
  it('T-1469 · R-SKILL-01: every JSON example in SKILL.md and its references opens and passes the schema, or says why it is not checked', () => {
    let opened = 0;
    let skipped = 0;
    for (const path of documents) {
      for (const example of jsonExamples(read(path))) {
        const at = `${path}:${String(example.line)}`;
        if (example.skip !== null) {
          skipped += 1;
          continue;
        }
        const model = modelOf(example);
        const parsed = parseModelJson(JSON.stringify(model));
        expect(parsed.ok ? '' : `${parsed.reason}: ${parsed.detail}`, at).toBe('');
        expect(validate(model) ? '' : JSON.stringify(validate.errors), at).toBe('');
        opened += 1;
      }
    }
    expect({ opened, skipped }).toEqual({ opened: 7, skipped: 1 });
  });

  it('T-1470 · R-SKILL-01: SKILL.md names core’s lists of values, and its block table has every kind', () => {
    const text = read('SKILL.md');
    expect(text).toContain(`The block kinds are ${listed(blockKinds, ',')}.`);
    expect(text).toContain(`for syntax colors only: ${listed(textKinds, ',')}.`);
    expect(text).toContain(`\`settings.theme\`: ${listed(themeIds, 'or')}.`);
    expect(text).toContain(`\`settings.headStyle\`: ${listed(headStyles, 'or')}.`);
    expect(text).toContain(`\`settings.locale\`: ${listed(locales, 'or')}`);
    const table = text.slice(text.indexOf('| Block | JSON |'));
    const rows = table.slice(0, table.indexOf('\n\n'));
    const kinds = [...rows.matchAll(/"id":"b\d+","kind":"(\w+)"/g)].map((match) => match[1]);
    expect(kinds).toEqual([...blockKinds]);
  });

  it('T-1471 · R-SKILL-01: SKILL.md has the front matter a skill needs, and every file it links to exists', () => {
    const text = read('SKILL.md');
    const frontMatter = /^---\n([\s\S]*?)\n---\n/.exec(text)?.[1] ?? '';
    expect(/^name: (.+)$/m.exec(frontMatter)?.[1]).toBe('ariadne-nsd');
    const description = /^description: (.+)$/m.exec(frontMatter)?.[1] ?? '';
    expect(description.length).toBeGreaterThan(100);
    expect(description.length).toBeLessThanOrEqual(1024);
    for (const path of documents) {
      const base = new URL(path, skill);
      for (const [, target = ''] of read(path).matchAll(/\]\(([^)#:]+\.md)\)/g)) {
        expect(() => readFileSync(new URL(target, base)), `${path} → ${target}`).not.toThrow();
      }
    }
  });
});
