// The JSON Schema of the model JSON (R-WEB-10, UX LG3), served at /model.schema.json for other AIs
// and agents. It is written by hand from the parser, so this test keeps the two together: every
// golden file's model passes the schema, the schema's lists are core's lists, and what the parser
// refuses for its shape the schema refuses too.
//
// It lives outside src/ because it reads the golden files with node:fs (core-no-node-builtins).
import { readdir, readFile } from 'node:fs/promises';

import { Ajv2020 } from 'ajv/dist/2020.js';
import { describe, expect, it } from 'vitest';

import schema from '../schema/model.schema.json' with { type: 'json' };
import {
  blockKinds,
  callTargetKinds,
  headKinds,
  headStyles,
  locales,
  parseModelJson,
  resultSymbols,
  textKinds,
  themeIds,
} from '../src/index';

const goldenDirectory = new URL('../golden/', import.meta.url);

/**
 * Golden files whose model is not one this version writes. `unknown-settings-kept` holds a
 * newer app's language and locale on purpose (01-file-format 3.3): the parser keeps them, and the
 * schema lists only the values this version knows.
 */
const notCurrentValues = new Set(['unknown-settings-kept.ns.svg']);

const validate = new Ajv2020({ allErrors: true, strict: true }).compile(schema);

/** The model JSON inside a saved file (01-file-format 2: the CDATA of `<ans:document>`). */
function modelJsonOf(file: string): string {
  const match = /<ans:document[^>]*><!\[CDATA\[([\s\S]*?)\]\]><\/ans:document>/.exec(file);
  if (match?.[1] === undefined) {
    throw new Error('no model in the file');
  }
  return match[1];
}

function errorsOf(value: unknown): string {
  return validate(value) ? '' : JSON.stringify(validate.errors);
}

describe('model JSON Schema', () => {
  it('T-1141 · R-WEB-10 · UX LG3: every golden file’s model passes the schema, as it passes the parser', async () => {
    const names = (await readdir(goldenDirectory)).filter((name) => name.endsWith('.ns.svg'));
    expect(names.length).toBeGreaterThan(10);
    for (const name of names.filter((each) => !notCurrentValues.has(each))) {
      const json = modelJsonOf(await readFile(new URL(name, goldenDirectory), 'utf8'));
      expect(parseModelJson(json).ok, name).toBe(true);
      expect(errorsOf(JSON.parse(json)), name).toBe('');
    }
  });

  it('T-1142 · R-WEB-10 · UX LG3: its lists of values are core’s lists, in the same order', () => {
    const { properties, $defs } = schema;
    const settings = properties.settings.properties;
    expect(settings.textKind.enum).toEqual([...textKinds]);
    expect(settings.theme.enum).toEqual([...themeIds]);
    expect(settings.locale.enum).toEqual([...locales]);
    expect(settings.headStyle.enum).toEqual([...headStyles]);
    expect(properties.diagrams.items.properties.head.properties.kind.enum).toEqual([...headKinds]);
    expect(properties.view.properties.resultSymbol.enum).toEqual([...resultSymbols]);
    const kindsOf = (variants: ReadonlyArray<{ properties: { kind: object } }>) =>
      variants.flatMap(({ properties: { kind } }) =>
        'const' in kind ? [kind.const] : 'enum' in kind ? (kind.enum as unknown[]) : [],
      );
    expect(kindsOf($defs.block.oneOf)).toEqual([...blockKinds]);
    expect(kindsOf($defs.callTarget.oneOf)).toEqual([...callTargetKinds]);
  });

  it('T-1143 · R-WEB-10 · UX LG3: refuses the shapes the parser refuses', async () => {
    const json = modelJsonOf(
      await readFile(new URL('diagrams-and-calls.ns.svg', goldenDirectory), 'utf8'),
    );
    const good = JSON.parse(json) as Record<string, unknown>;
    const changes: ReadonlyArray<(model: Record<string, unknown>) => void> = [
      (model) => {
        model.extra = 1;
      },
      (model) => {
        delete model.view;
      },
      (model) => {
        model.format = 'other';
      },
      (model) => {
        model.diagrams = [{ id: 'd01', body: [{ id: 'b1', kind: 'process', text: '' }] }];
      },
      (model) => {
        model.diagrams = [{ id: 'd1', body: [{ id: 'b1', kind: 'loop', text: '' }] }];
      },
      (model) => {
        model.diagrams = [{ id: 'd1', body: [{ id: 'b1', kind: 'process', text: 1 }] }];
      },
      (model) => {
        model.diagrams = [
          {
            id: 'd1',
            body: [{ id: 'b1', kind: 'if', text: '', yes: { id: 'r1', body: [] }, no: {} }],
          },
        ];
      },
      (model) => {
        model.diagrams = [
          {
            id: 'd1',
            body: [{ id: 'b1', kind: 'call', target: { kind: 'other' }, args: '', result: '' }],
          },
        ];
      },
      (model) => {
        model.view = { folded: [], opened: [], bands: 'yes', resultSymbol: '←' };
      },
    ];
    for (const [index, change] of changes.entries()) {
      const model = structuredClone(good);
      change(model);
      expect(parseModelJson(JSON.stringify(model)).ok, `change ${String(index)}`).toBe(false);
      expect(validate(model), `change ${String(index)}`).toBe(false);
    }
  });
});
