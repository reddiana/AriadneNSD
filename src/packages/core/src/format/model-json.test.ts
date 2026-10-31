import { describe, expect, it } from 'vitest';

import type { Block, Doc, Seq } from '../model/types';
import { serializeModelJson } from './model-json';

const seq = (...blocks: Block[]): Seq => ({ blocks, folds: [] });
const process = (id: string, text = ''): Block => ({ id, kind: 'process', text });

const view = { folded: [], opened: [], bands: true, resultSymbol: '←' } as const;

const ifDoc: Doc = {
  content: {
    settings: { textKind: 'plain', theme: 'default', headStyle: 'shape' },
    diagrams: [
      {
        id: 'd1',
        head: null,
        body: seq(process('b1', 'x = read()'), {
          id: 'b2',
          kind: 'if',
          text: 'x > 0',
          yes: { id: 'r1', body: seq(process('b3', 'print(x)')) },
          no: { id: 'r2', body: seq(process('b4')) },
        }),
      },
    ],
  },
  view,
};

describe('model JSON serialization', () => {
  it('01-file-format 3.3: writes the small example with 2-space indent and keys in table order', () => {
    expect(serializeModelJson(ifDoc)).toBe(
      [
        '{',
        '  "format": "ariadne-nsd",',
        '  "version": 1,',
        '  "settings": {',
        '    "textKind": "plain",',
        '    "theme": "default",',
        '    "headStyle": "shape"',
        '  },',
        '  "diagrams": [',
        '    {',
        '      "id": "d1",',
        '      "body": [',
        '        {',
        '          "id": "b1",',
        '          "kind": "process",',
        '          "text": "x = read()"',
        '        },',
        '        {',
        '          "id": "b2",',
        '          "kind": "if",',
        '          "text": "x > 0",',
        '          "yes": {',
        '            "id": "r1",',
        '            "body": [',
        '              {',
        '                "id": "b3",',
        '                "kind": "process",',
        '                "text": "print(x)"',
        '              }',
        '            ]',
        '          },',
        '          "no": {',
        '            "id": "r2",',
        '            "body": [',
        '              {',
        '                "id": "b4",',
        '                "kind": "process",',
        '                "text": ""',
        '              }',
        '            ]',
        '          }',
        '        }',
        '      ]',
        '    }',
        '  ],',
        '  "view": {',
        '    "folded": [],',
        '    "opened": [],',
        '    "bands": true,',
        '    "resultSymbol": "←"',
        '  }',
        '}',
      ].join('\n'),
    );
  });

  it('R-FMT-03: the same document gives the same text, whatever order the objects were built in', () => {
    const shuffled: Doc = {
      view: { resultSymbol: '←', bands: true, opened: [], folded: [] },
      content: {
        diagrams: ifDoc.content.diagrams,
        settings: { headStyle: 'shape', theme: 'default', textKind: 'plain' },
      },
    };
    expect(serializeModelJson(shuffled)).toBe(serializeModelJson(ifDoc));
  });

  it('01-file-format 3.3: writes head, folds, labels, otherwise and siteFolds only when present', () => {
    const doc: Doc = {
      content: {
        settings: { textKind: 'plain', theme: 'default', headStyle: 'title' },
        diagrams: [
          {
            id: 'd1',
            head: { kind: 'method', text: 'f(a)' },
            body: {
              blocks: [
                {
                  id: 'b1',
                  kind: 'case',
                  text: 'k',
                  arms: [{ id: 'r1', label: '1', body: seq(process('b2')) }],
                  otherwise: { id: 'r2', label: 'else', body: seq(process('b3')) },
                },
                {
                  id: 'b4',
                  kind: 'call',
                  target: { kind: 'lost', lastName: 'g' },
                  args: '',
                  result: '',
                  siteFolds: [],
                },
              ],
              folds: [{ id: 'f1', first: 'b1', last: 'b4', name: 'all' }],
            },
          },
        ],
      },
      view,
    };
    const json = JSON.parse(serializeModelJson(doc)) as {
      diagrams: [{ head: unknown; folds: unknown; body: [Record<string, unknown>, object] }];
    };
    const [diagram] = json.diagrams;
    expect(diagram.head).toEqual({ kind: 'method', text: 'f(a)' });
    expect(diagram.folds).toEqual([{ id: 'f1', first: 'b1', last: 'b4', name: 'all' }]);
    expect(Object.keys(diagram.body[0])).toEqual(['id', 'kind', 'text', 'arms', 'otherwise']);
    expect(diagram.body[0].otherwise).toEqual({
      id: 'r2',
      label: 'else',
      body: [{ id: 'b3', kind: 'process', text: '' }],
    });
    expect(diagram.body[1]).toEqual({
      id: 'b4',
      kind: 'call',
      target: { kind: 'lost', lastName: 'g' },
      args: '',
      result: '',
    });

    const withoutDefault = serializeModelJson({
      ...doc,
      content: {
        ...doc.content,
        diagrams: [
          {
            id: 'd1',
            head: null,
            body: seq({ id: 'b1', kind: 'case', text: 'k', arms: [], otherwise: null }),
          },
        ],
      },
    });
    expect(withoutDefault).not.toContain('"otherwise"');
    expect(withoutDefault).not.toContain('"head"');
    expect(withoutDefault).not.toContain('"folds"');
  });

  it('01-model 2: writes only existing foldable ids, in document order, without duplicates', () => {
    const doc: Doc = {
      ...ifDoc,
      view: { ...view, folded: ['r2', 'gone', 'b1', 'r1', 'r2', 'b99'] },
    };
    const json = JSON.parse(serializeModelJson(doc)) as { view: { folded: unknown } };
    expect(json.view.folded).toEqual(['r1', 'r2']);
  });

  it('01-file-format 3.1: the opened paths are in document order and only those that exist', () => {
    const call = (id: string, diagram: string): Block => ({
      id,
      kind: 'call',
      target: { kind: 'local', diagram },
      args: '',
      result: '',
      siteFolds: [],
    });
    const doc: Doc = {
      content: {
        settings: ifDoc.content.settings,
        diagrams: [
          { id: 'd1', head: null, body: seq(call('b1', 'd2'), call('b2', 'd2')) },
          { id: 'd2', head: { kind: 'method', text: 'g()' }, body: seq(call('b3', 'd3')) },
          { id: 'd3', head: { kind: 'method', text: 'h()' }, body: seq(process('b4')) },
        ],
      },
      view: {
        ...view,
        opened: [['b2'], ['b1', 'b3'], ['b1'], ['b9'], ['b1', 'b2'], ['b2']],
      },
    };
    const json = JSON.parse(serializeModelJson(doc)) as { view: { opened: unknown } };
    expect(json.view.opened).toEqual([['b1'], ['b1', 'b3'], ['b2']]);
  });

  it('01-file-format 3.3: writes back an unknown textKind kept from the file', () => {
    expect(serializeModelJson(ifDoc, { textKind: 'cobol' })).toContain('"textKind": "cobol"');
    expect(serializeModelJson(ifDoc)).toContain('"textKind": "plain"');
  });
});
