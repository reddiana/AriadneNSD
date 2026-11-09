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

  it('T-1171 · R-WEB-10 · UX LG3: passes the models whose rules it cannot see, which the parser refuses (02-model-schema 3)', () => {
    const process = (id: string, text = 'x') => ({ id, kind: 'process', text });
    const model = (diagrams: unknown[]) => ({
      format: 'ariadne-nsd',
      version: 1,
      settings: { textKind: 'plain', theme: 'default', headStyle: 'title', locale: 'en' },
      diagrams,
      view: { folded: [], opened: [], bands: true, resultSymbol: '←' },
    });
    const withFolds = (folds: unknown[]) =>
      model([{ id: 'd1', body: [process('b1'), process('b2'), process('b3')], folds }]);
    const call = {
      id: 'b2',
      kind: 'call',
      target: { kind: 'local', diagram: 'd1' },
      args: '',
      result: '',
    };
    const cases: ReadonlyArray<readonly [string, unknown]> = [
      ['an id used twice (3)', model([{ id: 'd1', body: [process('b1'), process('b1')] }])],
      [
        'a Case without a branch (4)',
        model([{ id: 'd1', body: [{ id: 'b1', kind: 'case', text: 'x', arms: [] }] }]),
      ],
      [
        'a fold over a block of another sequence (5)',
        withFolds([{ id: 'f1', first: 'b1', last: 'b9' }]),
      ],
      ['a fold that ends before it starts (5)', withFolds([{ id: 'f1', first: 'b3', last: 'b1' }])],
      [
        'two folds that cross (5)',
        withFolds([
          { id: 'f1', first: 'b1', last: 'b2' },
          { id: 'f2', first: 'b2', last: 'b3' },
        ]),
      ],
      [
        'two folds over the same blocks (5)',
        withFolds([
          { id: 'f1', first: 'b1', last: 'b2' },
          { id: 'f2', first: 'b1', last: 'b2' },
        ]),
      ],
      [
        'a local call to a diagram that is not a Method (6)',
        model([{ id: 'd1', head: { kind: 'event', text: 'e' }, body: [process('b1'), call] }]),
      ],
      [
        'a blank diagram beside another (7)',
        model([
          { id: 'd1', body: [process('b1')] },
          { id: 'd2', body: [process('b2', '')] },
        ]),
      ],
    ];
    for (const [what, value] of cases) {
      expect(errorsOf(value), what).toBe('');
      expect(parseModelJson(JSON.stringify(value)).ok, what).toBe(false);
    }
    // The other way: the parser keeps a value of a newer version that the schema does not list.
    const newer = model([{ id: 'd1', body: [process('b1')] }]);
    newer.settings.theme = 'sepia';
    expect(parseModelJson(JSON.stringify(newer)).ok).toBe(true);
    expect(validate(newer)).toBe(false);
  });
});
