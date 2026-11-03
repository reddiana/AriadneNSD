// Golden files (07-testing 3): one `.ns.svg` per case in packages/core/golden/, the input and the
// expected output in one file, compared byte for byte (R-FMT-03, QA-03, QA-04). Each file is what
// saving writes: the drawing from renderDoc, the model, and the block font subset.
//
// Update them after an intended change to the drawing or the file format, and commit the new
// files with the code that changed them:
//   pnpm --filter @ariadne-nsd/core golden:update
// It rewrites the files first, then runs this test again: the reopen test reads the files on disk,
// which the update writes only when its run ends.
//
// This test lives outside src/ because it uses the Node font subsetter (node:fs), which core's
// own code must not use (.dependency-cruiser.cjs, core-no-node-builtins).
import { readdir, readFile } from 'node:fs/promises';

import { blockFont } from '@ariadne-nsd/fonts';
import type { Subsetter } from '@ariadne-nsd/fonts';
import { createNodeSubsetter, readFontFile } from '@ariadne-nsd/fonts/node';
import { beforeAll, describe, expect, it } from 'vitest';

import type { Block, Doc, KeptSettings, Locale, Seq } from '../src/index';
import { assembleSvgFile, openSvgFile, renderDoc } from '../src/index';

const goldenDirectory = new URL('../golden/', import.meta.url);

let subsetter: Subsetter;
let ttf: Uint8Array;

beforeAll(async () => {
  subsetter = await createNodeSubsetter();
  ttf = await readFontFile(blockFont.files.ttf);
});

/** What saving writes for a document (the same steps as the editor's serializeDocument). */
function save(doc: Doc, kept: KeptSettings | undefined): string {
  const rendering = renderDoc(doc);
  return assembleSvgFile({
    doc,
    ...(kept === undefined ? {} : { kept }),
    drawing: rendering.svg,
    fonts: [
      { family: blockFont.familyName, woff: subsetter.subsetToWoff(ttf, rendering.codePoints) },
    ],
  });
}

const seq = (...blocks: Block[]): Seq => ({ blocks, folds: [] });
const process = (id: string, text: string): Block => ({ id, kind: 'process', text });
const settings = { textKind: 'plain', theme: 'default', headStyle: 'shape', locale: 'en' } as const;
const view = { folded: [], opened: [], bands: true, resultSymbol: '←' } as const;
const inLocale = (doc: Doc, locale: Locale): Doc => ({
  ...doc,
  content: { ...doc.content, settings: { ...doc.content.settings, locale } },
});
const oneDiagram = (...blocks: Block[]): Doc => ({
  content: { settings, diagrams: [{ id: 'd1', head: null, body: seq(...blocks) }] },
  view,
});

/** Event and Method headers, a call opened in place, a lost call and a fold. */
const diagramsAndCalls: Doc = {
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
};

const inTheme = (doc: Doc, theme: string): Doc => ({
  ...doc,
  content: { ...doc.content, settings: { ...doc.content.settings, theme } },
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
  { name: 'diagrams-and-calls', doc: diagramsAndCalls },
  // One golden per theme (visual design 8): the theme's name in the model, its colors in the
  // drawing. Headers, calls, a peek and a fold, so every token is drawn.
  { name: 'theme-dark', doc: inTheme(diagramsAndCalls, 'dark') },
  { name: 'theme-high-contrast', doc: inTheme(diagramsAndCalls, 'high-contrast') },
  { name: 'theme-print', doc: inTheme(diagramsAndCalls, 'print') },
  {
    name: 'unknown-settings-kept',
    doc: {
      ...oneDiagram(process('b1', 'x')),
      content: {
        settings: { ...settings, theme: 'midnight' },
        diagrams: oneDiagram(process('b1', 'x')).content.diagrams,
      },
    },
    kept: { textKind: 'cobol', locale: { written: 'xx', drawnIn: 'en' } },
  },
  {
    name: 'korean-fixed-words',
    // Branch labels left empty, so the drawing writes the fixed words of the document's locale.
    doc: inLocale(
      oneDiagram(
        {
          id: 'b1',
          kind: 'if',
          text: '맞나?',
          yes: { id: 'r1', body: seq(process('b2', '')) },
          no: { id: 'r2', body: seq(process('b3', '')) },
        },
        {
          id: 'b4',
          kind: 'case',
          text: 'k',
          arms: [{ id: 'r3', label: '1', body: seq(process('b5', '')) }],
          otherwise: { id: 'r4', body: seq(process('b6', '')) },
        },
      ),
      'ko',
    ),
  },
];

const suffix = '.ns.svg';

/** The case names of the golden files on disk, sorted. */
async function goldenNames(): Promise<ReadonlyArray<string>> {
  const files = await readdir(goldenDirectory);
  return files
    .filter((file) => file.endsWith(suffix))
    .map((file) => file.slice(0, -suffix.length))
    .sort();
}

describe('golden files', () => {
  for (const { name, doc, kept } of cases) {
    it(`T-0352 · R-FMT-03: ${name} is saved as the golden file`, async () => {
      await expect(save(doc, kept)).toMatchFileSnapshot(`../golden/${name}.ns.svg`);
    });
  }

  it('T-0353: every golden file has a case', async () => {
    expect(await goldenNames()).toEqual(cases.map((goldenCase) => goldenCase.name).sort());
  });

  it('T-0354 · QA-04: every golden file opens and saves to the same bytes', async () => {
    for (const name of await goldenNames()) {
      const file = `${name}${suffix}`;
      const bytes = await readFile(new URL(file, goldenDirectory));
      const opened = openSvgFile(bytes.toString('utf8'));
      if (!opened.ok) {
        throw new Error(`${file}: ${opened.detail}`);
      }
      const saved = save(opened.value.doc, opened.value.kept);
      expect(Buffer.from(saved, 'utf8').equals(bytes), file).toBe(true);
    }
  });
});

describe('saved file size', () => {
  it('T-0355 · QA-09: 100 blocks with 300 different Hangul syllables save to 300 KB or less', () => {
    const syllables = Array.from({ length: 300 }, (_, index) =>
      String.fromCodePoint(0xac00 + index * 37),
    );
    const blocks = Array.from({ length: 100 }, (_, index) =>
      process(`b${String(index + 1)}`, syllables.slice(index * 3, index * 3 + 3).join('')),
    );
    const file = save(oneDiagram(...blocks), undefined);
    expect(Buffer.byteLength(file, 'utf8')).toBeLessThanOrEqual(300 * 1024);
  });
});
