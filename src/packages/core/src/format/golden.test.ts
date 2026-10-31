// Golden files (07-testing 2): one `.ns.svg` per case in packages/core/golden/, the input and the
// expected output in one file. Update them with `pnpm --filter @ariadne-nsd/core exec vitest run
// src/format -u` and commit the change with the code that caused it.
//
// Until the renderer is joined in, the drawing is an empty placeholder and only the model part is
// compared. The integration step replaces `placeholderDrawing` with layout and rendering.
import { describe, expect, it } from 'vitest';

import type { Block, Doc, Seq } from '../model/types';
import type { KeptSettings } from './model-json';
import type { Drawing } from './svg-file';
import { assembleSvgFile, openSvgFile } from './svg-file';

declare global {
  // Vite's import.meta.glob, which Vitest provides. Merging into ImportMeta needs an interface.
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface ImportMeta {
    glob: (
      pattern: string,
      options: { query: '?raw'; import: 'default'; eager: true },
    ) => Record<string, string>;
  }
}

const goldenFiles = import.meta.glob('../../golden/*.ns.svg', {
  query: '?raw',
  import: 'default',
  eager: true,
});

const placeholderDrawing: Drawing = {
  width: 200,
  height: 100,
  viewBox: '0 0 200 100',
  paper: '#ffffff',
  content: '<g class="ans-render"></g>',
};

const seq = (...blocks: Block[]): Seq => ({ blocks, folds: [] });
const process = (id: string, text: string): Block => ({ id, kind: 'process', text });
const settings = { textKind: 'plain', theme: 'default', headStyle: 'shape' } as const;
const view = { folded: [], opened: [], bands: true, resultSymbol: '←' } as const;
const oneDiagram = (...blocks: Block[]): Doc => ({
  content: { settings, diagrams: [{ id: 'd1', head: null, body: seq(...blocks) }] },
  view,
});

const cases: ReadonlyArray<{
  readonly name: string;
  readonly doc: Doc;
  readonly kept?: KeptSettings;
}> = [
  { name: 'process', doc: oneDiagram(process('b1', 'x = read()')) },
  { name: 'empty-block', doc: oneDiagram(process('b1', '')) },
  {
    name: 'if',
    doc: oneDiagram(process('b1', 'x = read()'), {
      id: 'b2',
      kind: 'if',
      text: 'x > 0',
      yes: { id: 'r1', body: seq(process('b3', 'print(x)')) },
      no: { id: 'r2', label: 'otherwise', body: seq(process('b4', '')) },
    }),
  },
  {
    name: 'case',
    doc: oneDiagram({
      id: 'b1',
      kind: 'case',
      text: 'key',
      arms: [
        { id: 'r1', label: '1', body: seq(process('b2', 'one()')) },
        { id: 'r2', label: "'a'..'z'", body: seq(process('b3', 'letter()')) },
      ],
      otherwise: { id: 'r3', body: seq(process('b4', 'other()')) },
    }),
  },
  {
    name: 'case-without-default',
    doc: oneDiagram({
      id: 'b1',
      kind: 'case',
      text: 'key',
      arms: [{ id: 'r1', label: '1', body: seq(process('b2', 'one()')) }],
      otherwise: null,
    }),
  },
  {
    name: 'loops',
    doc: oneDiagram(
      { id: 'b1', kind: 'while', text: 'i < n', body: seq(process('b2', 'i ← i + 1')) },
      { id: 'b3', kind: 'doWhile', text: 'until done', body: seq(process('b4', 'step()')) },
      { id: 'b5', kind: 'for', text: 'i = 0 to 9', body: seq(process('b6', 'sum ← sum + i')) },
    ),
  },
  {
    name: 'korean-and-english',
    doc: oneDiagram(process('b1', '합계 ← 0'), process('b2', '출력(sum)과 "따옴표" & <꺾쇠>')),
  },
  { name: 'cdata-end-in-text', doc: oneDiagram(process('b1', 'a[b[0]]>c ]]> end')) },
  {
    name: 'folds-and-view',
    doc: {
      content: {
        settings,
        diagrams: [
          {
            id: 'd1',
            head: null,
            body: {
              blocks: [
                process('b1', 'a'),
                { id: 'b2', kind: 'while', text: 'w', body: seq(process('b3', 'b')) },
                process('b4', 'c'),
              ],
              folds: [
                { id: 'f1', first: 'b1', last: 'b2', name: 'setup' },
                { id: 'f2', first: 'b4', last: 'b4' },
              ],
            },
          },
        ],
      },
      // Written in the order of the document, whatever order they were folded in.
      view: { folded: ['f2', 'b2', 'f1'], opened: [], bands: false, resultSymbol: '=' },
    },
  },
  {
    name: 'diagrams-and-calls',
    doc: {
      content: {
        settings: { ...settings, headStyle: 'title' },
        diagrams: [
          {
            id: 'd1',
            head: { kind: 'event', text: 'start' },
            body: seq(
              {
                id: 'b1',
                kind: 'call',
                target: { kind: 'local', diagram: 'd2' },
                args: 'a, 0, n',
                result: 'p',
                siteFolds: [{ id: 'f1', via: [], first: 'b3', last: 'b3', name: 'swap' }],
              },
              {
                id: 'b2',
                kind: 'call',
                target: { kind: 'lost', lastName: 'gone' },
                args: '',
                result: '',
                siteFolds: [],
              },
            ),
          },
          {
            id: 'd2',
            head: { kind: 'method', text: 'partition(a, lo, hi)' },
            body: seq(process('b3', 'swap')),
          },
        ],
      },
      view: { folded: ['f1'], opened: [['b1']], bands: true, resultSymbol: '←' },
    },
  },
  {
    name: 'unknown-settings-kept',
    doc: {
      ...oneDiagram(process('b1', 'x')),
      content: {
        settings: { ...settings, theme: 'midnight' },
        diagrams: oneDiagram(process('b1', 'x')).content.diagrams,
      },
    },
    kept: { textKind: 'cobol' },
  },
];

const metadataOf = (file: string): string =>
  file.slice(file.indexOf('<metadata>'), file.indexOf('</metadata>'));

describe('golden files', () => {
  for (const { name, doc, kept } of cases) {
    it(`R-FMT-03: ${name} is saved as the golden file`, async () => {
      const file = assembleSvgFile({
        doc,
        ...(kept === undefined ? {} : { kept }),
        drawing: placeholderDrawing,
        fonts: [],
      });
      await expect(file).toMatchFileSnapshot(`../../golden/${name}.ns.svg`);
    });
  }

  it('finds the golden files', () => {
    expect(Object.keys(goldenFiles).length).toBeGreaterThanOrEqual(cases.length);
  });

  for (const [path, file] of Object.entries(goldenFiles)) {
    it(`QA-04: ${path} opens and saves to the same model part`, () => {
      const opened = openSvgFile(file);
      if (!opened.ok) {
        throw new Error(opened.detail);
      }
      const saved = assembleSvgFile({ ...opened.value, drawing: placeholderDrawing, fonts: [] });
      expect(metadataOf(saved)).toBe(metadataOf(file));
    });
  }
});
