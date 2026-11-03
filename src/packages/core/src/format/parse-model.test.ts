import { describe, expect, it } from 'vitest';

import type { Doc } from '../model/types';
import { serializeModelJson } from './model-json';
import { parseModel, parseModelJson } from './parse-model';

const minimal = (): Record<string, unknown> => ({
  format: 'ariadne-nsd',
  version: 1,
  settings: { textKind: 'plain', theme: 'default', headStyle: 'shape' },
  diagrams: [{ id: 'd1', body: [{ id: 'b1', kind: 'process', text: '' }] }],
  view: { folded: [], opened: [], bands: true, resultSymbol: '←' },
});

const fullDoc: Doc = {
  content: {
    settings: { textKind: 'plain', theme: 'default', headStyle: 'title' },
    diagrams: [
      {
        id: 'd1',
        head: { kind: 'event', text: 'start' },
        body: {
          blocks: [
            {
              id: 'b1',
              kind: 'if',
              text: 'a',
              yes: {
                id: 'r1',
                label: 'yes!',
                body: { blocks: [{ id: 'b2', kind: 'process', text: 'x' }], folds: [] },
              },
              no: {
                id: 'r2',
                body: { blocks: [{ id: 'b3', kind: 'process', text: '' }], folds: [] },
              },
            },
            {
              id: 'b4',
              kind: 'case',
              text: 'k',
              arms: [
                {
                  id: 'r3',
                  label: '1',
                  body: { blocks: [{ id: 'b5', kind: 'process', text: '' }], folds: [] },
                },
              ],
              otherwise: null,
            },
            {
              id: 'b6',
              kind: 'while',
              text: 'w',
              body: { blocks: [{ id: 'b7', kind: 'process', text: '' }], folds: [] },
            },
            {
              id: 'b8',
              kind: 'doWhile',
              text: 'd',
              body: { blocks: [{ id: 'b9', kind: 'process', text: '' }], folds: [] },
            },
            {
              id: 'b10',
              kind: 'for',
              text: 'f',
              body: {
                blocks: [{ id: 'b11', kind: 'process', text: '' }],
                folds: [{ id: 'f1', first: 'b11', last: 'b11' }],
              },
            },
            {
              id: 'b12',
              kind: 'call',
              target: { kind: 'local', diagram: 'd2' },
              args: 'a, b',
              result: 'r',
              siteFolds: [{ id: 'f2', via: [], first: 'b14', last: 'b14', name: 'n' }],
            },
            {
              id: 'b13',
              kind: 'call',
              target: { kind: 'external', file: 'x.ns', diagram: 'd4', lastName: 'ext' },
              args: '',
              result: '',
              siteFolds: [],
            },
            {
              id: 'b15',
              kind: 'call',
              target: { kind: 'named', name: 'nm' },
              args: '',
              result: '',
              siteFolds: [],
            },
            {
              id: 'b16',
              kind: 'call',
              target: { kind: 'lost', lastName: 'old', file: 'y.ns' },
              args: '',
              result: '',
              siteFolds: [],
            },
          ],
          folds: [{ id: 'f3', first: 'b1', last: 'b4', name: 'two' }],
        },
      },
      {
        id: 'd2',
        head: { kind: 'method', text: 'g()' },
        body: { blocks: [{ id: 'b14', kind: 'process', text: '' }], folds: [] },
      },
    ],
  },
  view: {
    folded: ['r1', 'b6', 'f1', 'f2', 'f3'],
    opened: [['b12']],
    bands: false,
    resultSymbol: '=',
  },
};

describe('model JSON parsing', () => {
  it('T-0414 · R-FMT-02: reads back every node kind as the same document', () => {
    const result = parseModelJson(serializeModelJson(fullDoc));
    expect(result).toEqual({ ok: true, value: { doc: fullDoc, kept: {} } });
  });

  it('T-0415: 01-file-format 3.3: reads files that write empty lists and folds out', () => {
    const value = minimal();
    value.diagrams = [
      {
        id: 'd1',
        folds: [],
        body: [
          {
            id: 'b1',
            kind: 'call',
            target: { kind: 'named', name: 'n' },
            args: '',
            result: '',
            siteFolds: [],
          },
        ],
      },
    ];
    const result = parseModel(value);
    expect(result.ok).toBe(true);
  });

  it('T-0416: 01-file-format 3.3: shows an unknown textKind as plain and keeps the value for saving', () => {
    const value = minimal();
    value.settings = { textKind: 'cobol', theme: 'midnight', headStyle: 'shape' };
    const result = parseModel(value);
    if (!result.ok) {
      throw new Error(result.detail);
    }
    expect(result.value.doc.content.settings).toEqual({
      textKind: 'plain',
      theme: 'midnight',
      headStyle: 'shape',
    });
    expect(result.value.kept).toEqual({ textKind: 'cobol' });
    const saved = serializeModelJson(result.value.doc, result.value.kept);
    expect(saved).toContain('"textKind": "cobol"');
    expect(saved).toContain('"theme": "midnight"');
  });

  it('T-0417: 01-file-format 7: a version 0 file is a prototype file and cannot be edited', () => {
    expect(parseModel({ ...minimal(), version: 0 })).toMatchObject({
      ok: false,
      reason: 'prototype',
    });
  });

  it('T-0418: 01-file-format 5: a newer version cannot be edited and asks for an update', () => {
    expect(parseModel({ ...minimal(), version: 2 })).toMatchObject({
      ok: false,
      reason: 'newerVersion',
    });
  });

  it('T-0419 · QA-02: broken input is refused with a reason, never thrown', () => {
    const broken: unknown[] = [
      null,
      42,
      'text',
      [],
      { ...minimal(), format: 'other' },
      { ...minimal(), version: 1.5 },
      { ...minimal(), version: '1' },
      { ...minimal(), extra: true },
      { ...minimal(), settings: { textKind: 'plain', theme: 'default', headStyle: 'hat' } },
      { ...minimal(), diagrams: 'none' },
      { ...minimal(), diagrams: [{ id: 'x1', body: [] }] },
      { ...minimal(), diagrams: [{ id: 'd1', body: [{ id: 'b1', kind: 'loop', text: '' }] }] },
      { ...minimal(), diagrams: [{ id: 'd1', body: [{ id: 'b1', kind: 'process' }] }] },
      { ...minimal(), diagrams: [{ id: 'd1', head: null, body: [] }] },
      {
        ...minimal(),
        diagrams: [{ id: 'd1', body: [{ id: 'b1', kind: 'process', text: '', label: 'x' }] }],
      },
      { ...minimal(), view: { folded: [], opened: [], bands: 'yes', resultSymbol: '←' } },
      { ...minimal(), view: { folded: [], opened: [], bands: true, resultSymbol: ':=' } },
      { ...minimal(), view: { folded: [], opened: ['b1'], bands: true, resultSymbol: '←' } },
    ];
    for (const value of broken) {
      expect(parseModel(value)).toMatchObject({ ok: false, reason: 'damaged' });
    }
    expect(parseModelJson('{ "format": ')).toMatchObject({ ok: false, reason: 'damaged' });
  });

  it('T-0420: 01-model 2: keeps dangling view ids when reading (weak references)', () => {
    const value = minimal();
    value.view = { folded: ['r9'], opened: [['b9']], bands: true, resultSymbol: '←' };
    const result = parseModel(value);
    expect(result.ok && result.value.doc.view.folded).toEqual(['r9']);
  });

  it('T-0421: 01-model 3: refuses a document that breaks the invariants, without repairing it', () => {
    const value = minimal();
    value.diagrams = [
      { id: 'd1', body: [{ id: 'b1', kind: 'process', text: '' }] },
      { id: 'd2', body: [{ id: 'b1', kind: 'process', text: 'x' }] },
    ];
    expect(parseModel(value)).toMatchObject({ ok: false, reason: 'damaged' });
    expect(parseModel(value, () => null).ok).toBe(true);
    expect(parseModel(minimal(), () => 'no')).toEqual({
      ok: false,
      reason: 'damaged',
      detail: 'invariant: no',
    });
  });
});
