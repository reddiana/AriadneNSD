// The folding kept per opened call site (01-model 2, ADR-0046): what is taken from the Method,
// what the file keeps, and what happens to it when the call blocks change.
import { describe, expect, it } from 'vitest';

import { parseModelJson } from '../format/parse-model';
import { serializeModelJson } from '../format/model-json';
import { layout } from '../layout/layout';
import { foldedAfterInline, forgetRetargeted, isFoldedAt, settleSiteFolds } from './site-folded';
import type { Block, Content, Doc, View } from './types';

const call = (id: string, diagram: string): Block => ({
  id,
  kind: 'call',
  target: { kind: 'local', diagram },
  args: '',
  result: '',
  siteFolds: [],
});

const text = (id: string): Block => ({ id, kind: 'process', text: id });

/** d1: calls b1 and b2 of Method d2. d2: b3 in region f1, If b4 (r1, r2), call b8 of d2. d3: b9. */
const content: Content = {
  settings: { textKind: 'plain', theme: 'default', headStyle: 'title', locale: 'en' },
  diagrams: [
    { id: 'd1', head: null, body: { blocks: [call('b1', 'd2'), call('b2', 'd2')], folds: [] } },
    {
      id: 'd2',
      head: { kind: 'method', text: 'm' },
      body: {
        blocks: [
          text('b3'),
          {
            id: 'b4',
            kind: 'if',
            text: 'c',
            yes: { id: 'r1', body: { blocks: [text('b5'), text('b6')], folds: [] } },
            no: { id: 'r2', body: { blocks: [text('b7')], folds: [] } },
          },
          call('b8', 'd2'),
        ],
        folds: [{ id: 'f1', first: 'b3', last: 'b3' }],
      },
    },
    {
      id: 'd3',
      head: { kind: 'method', text: 'n' },
      body: { blocks: [text('b9')], folds: [] },
    },
  ],
};

const viewOf = (view: Partial<View>): View => ({
  folded: [],
  opened: [],
  bands: true,
  resultSymbol: '←',
  ...view,
});

const docOf = (view: Partial<View>): Doc => ({ content, view: viewOf(view) });

const savedFolded = (doc: Doc): unknown =>
  (JSON.parse(serializeModelJson(doc)) as { view: { folded: unknown } }).view.folded;

describe('taking the folding from the Method (ADR-0046)', () => {
  it('T-1324: a call site first shown takes what the Method has folded now, and only its own ids', () => {
    const view = settleSiteFolds(content, viewOf({ folded: ['f1', 'r1'], opened: [['b1']] }));
    expect(view.folded).toEqual(['f1', 'r1', 'b1/', 'b1/r1', 'b1/f1']);
  });

  it('T-1325: a call site that has its folding keeps it, whatever the Method does later', () => {
    const view = viewOf({ folded: ['f1', 'b1/'], opened: [['b1']] });
    expect(settleSiteFolds(content, view)).toBe(view);
    expect(isFoldedAt(new Set(view.folded), 'b1/', 'f1')).toBe(false);
  });

  it('T-1326: a call site without its folding yet shows the folding of the Method', () => {
    expect(isFoldedAt(new Set(['f1']), 'b1/', 'f1')).toBe(true);
    expect(isFoldedAt(new Set(['f1']), '', 'f1')).toBe(true);
  });

  it('T-1327: a call inside a closed call block takes its folding when it is drawn, not before', () => {
    const closed = viewOf({ folded: ['f1'], opened: [['b1', 'b8']] });
    expect(settleSiteFolds(content, closed)).toBe(closed);
    const drawn = settleSiteFolds(content, { ...closed, opened: [['b1'], ['b1', 'b8']] });
    expect(drawn.folded).toContain('b1/b8/f1');
  });

  it('T-1328: each path of nested call blocks has a folding of its own', () => {
    const doc = docOf({
      folded: ['b1/', 'b1/f1', 'b1/b8/'],
      opened: [['b1'], ['b1', 'b8']],
    });
    const result = layout(doc);
    const ids = result.nodes.flatMap((node) => ('id' in node ? [node.id] : []));
    expect(ids).toContain('b1/f1');
    expect(ids).toContain('b1/b8/b3');
    expect(ids).not.toContain('b1/b3');
  });
});

describe('what the file keeps (QA-03, QA-04)', () => {
  it('T-1329: a document with nothing folded at its call sites is written as if they had no folding', () => {
    const before = docOf({ opened: [['b1']] });
    const after = docOf({ folded: ['b1/', 'b2/'], opened: [['b1']] });
    expect(serializeModelJson(after)).toBe(serializeModelJson(before));
  });

  it('T-1330: a call site folded like the Method writes nothing: opening the file takes it again', () => {
    const before = docOf({ folded: ['f1'], opened: [['b1']] });
    const after = { ...before, view: settleSiteFolds(content, before.view) };
    expect(serializeModelJson(after)).toBe(serializeModelJson(before));
  });

  it('T-1331: a call site folded differently is written behind its path, in document order', () => {
    const folded = ['b2/', 'b2/r2', 'b1/', 'b1/f1', 'b1/r1'];
    expect(savedFolded(docOf({ folded, opened: [['b1'], ['b2']] }))).toEqual([
      'b1/',
      'b1/r1',
      'b1/f1',
      'b2/',
      'b2/r2',
    ]);
  });

  it('T-1332: a call site unfolded while the Method stays folded writes that it has its own folding', () => {
    expect(savedFolded(docOf({ folded: ['f1', 'b1/'], opened: [['b1']] }))).toEqual(['f1', 'b1/']);
  });

  it('T-1333: a closed call site keeps its folding in the file, and saving again gives the same bytes', () => {
    const doc = docOf({ folded: ['f1', 'b1/', 'b1/f1'] });
    const file = serializeModelJson(doc);
    expect(savedFolded(doc)).toEqual(['f1', 'b1/', 'b1/f1']);
    const opened = parseModelJson(file);
    expect(opened.ok && serializeModelJson(opened.value.doc)).toBe(file);
  });

  it('T-1334: call sites that are gone, ids not in the Method and other paths are not written', () => {
    const folded = ['b99/', 'b99/f1', 'b1/', 'b1/r99', 'b1/b9', 'b9/', 'b9/f1', 'b1/f1'];
    expect(savedFolded(docOf({ folded, opened: [['b1']] }))).toEqual(['b1/', 'b1/f1']);
  });

  it('T-1335: a call site whose target is lost writes nothing', () => {
    const lost: Content = {
      ...content,
      diagrams: content.diagrams.map((diagram) =>
        diagram.id === 'd1'
          ? {
              ...diagram,
              body: {
                folds: [],
                blocks: [
                  {
                    ...call('b1', 'd2'),
                    target: { kind: 'lost', lastName: 'm' },
                  } as Block,
                ],
              },
            }
          : diagram,
      ),
    };
    const doc: Doc = { content: lost, view: viewOf({ folded: ['b1/', 'b1/f1'] }) };
    expect(savedFolded(doc)).toEqual([]);
  });

  it('T-1336: a file from another version with entries it does not define opens and draws', () => {
    const file = serializeModelJson(docOf({ opened: [['b1']] })).replace(
      '"folded": []',
      '"folded": ["b1/x/y", "/", "b1//", "b99/f1"]',
    );
    const opened = parseModelJson(file);
    expect(opened.ok).toBe(true);
    if (opened.ok) {
      expect(() => layout(opened.value.doc)).not.toThrow();
      expect(savedFolded(opened.value.doc)).toEqual([]);
    }
  });
});

describe('when the call blocks change', () => {
  const retargeted = (target: Extract<Block, { kind: 'call' }>['target']): Content => ({
    ...content,
    diagrams: content.diagrams.map((diagram) =>
      diagram.id === 'd1'
        ? {
            ...diagram,
            body: {
              folds: [],
              blocks: [{ ...call('b1', 'd2'), target } as Block, call('b2', 'd2')],
            },
          }
        : diagram,
    ),
  });
  const view = viewOf({ folded: ['b1/', 'b1/f1', 'b1/b8/', 'b2/', 'b2/f1'] });

  it('T-1337: a call block calling another Method forgets the folding of its paths only', () => {
    const next = forgetRetargeted(
      content,
      retargeted({ kind: 'local', diagram: 'd3' }),
      view,
      false,
    );
    expect(next.folded).toEqual(['b2/', 'b2/f1']);
  });

  it('T-1338: a target lost with its Method keeps the folding, and undoing the deletion finds it', () => {
    const lost = retargeted({ kind: 'lost', lastName: 'm' });
    expect(forgetRetargeted(content, lost, view, false)).toBe(view);
    expect(forgetRetargeted(lost, content, view, true)).toBe(view);
  });

  it('T-1339: calling a Method from a lost target starts over', () => {
    const lost = retargeted({ kind: 'lost', lastName: 'm' });
    expect(forgetRetargeted(lost, content, view, false).folded).toEqual(['b2/', 'b2/f1']);
  });

  it('T-1340: replacing a call block folds the copies as they were shown at that call', () => {
    const renamed = new Map([
      ['f1', 'f7'],
      ['r1', 'r7'],
      ['b8', 'b70'],
    ]);
    const here = viewOf({ folded: ['r1', 'b1/', 'b1/f1', 'b1/b8/', 'b1/b8/r1'] });
    expect(foldedAfterInline(content, here, 'b1', renamed)).toEqual([
      ...here.folded,
      'f7',
      'b70/',
      'b70/r1',
    ]);
  });

  it('T-1341: replacing a closed call block without its folding folds the copies like the Method', () => {
    const renamed = new Map([['f1', 'f7']]);
    const here = viewOf({ folded: ['f1'] });
    expect(foldedAfterInline(content, here, 'b1', renamed)).toEqual(['f1', 'f7']);
  });
});
