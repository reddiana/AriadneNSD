import fc from 'fast-check';
import { describe, expect, it } from 'vitest';

import type {
  Block,
  Branch,
  CallTarget,
  Content,
  Diagram,
  Doc,
  FoldMark,
  Seq,
  SiteFold,
} from '../model/types';
import type { KeptSettings } from './model-json';
import { serializeModelJson } from './model-json';
import { parseModelJson } from './parse-model';
import { assembleSvgFile, openSvgFile } from './svg-file';

// Documents are generated as shapes without ids, then numbered in document order, so that ids
// are unique and fold ranges point at blocks of their own sequence.

type RawFold = { readonly from: number; readonly to: number; readonly name: string | undefined };
type RawSeq = { readonly blocks: ReadonlyArray<RawBlock>; readonly folds: ReadonlyArray<RawFold> };
type RawBranch = { readonly label: string | undefined; readonly body: RawSeq };
type RawBlock =
  | { readonly kind: 'process'; readonly text: string }
  | { readonly kind: 'if'; readonly text: string; readonly yes: RawBranch; readonly no: RawBranch }
  | {
      readonly kind: 'case';
      readonly text: string;
      readonly arms: ReadonlyArray<{ readonly label: string; readonly body: RawSeq }>;
      readonly otherwise: RawBranch | null;
    }
  | { readonly kind: 'while' | 'doWhile' | 'for'; readonly text: string; readonly body: RawSeq }
  | {
      readonly kind: 'call';
      readonly target: CallTarget;
      readonly args: string;
      readonly result: string;
      readonly siteFolds: ReadonlyArray<RawFold & { readonly via: ReadonlyArray<number> }>;
    };

const text = fc.oneof(
  fc.string(),
  fc.string({ unit: 'binary' }),
  // Any UTF-16 code unit, so lone surrogates too.
  fc.string({ unit: fc.integer({ min: 0, max: 0xffff }).map((code) => String.fromCharCode(code)) }),
  fc.constantFrom(
    '',
    ']]>',
    'a]]>]]>b',
    '<![CDATA[',
    '&amp;',
    '"\\',
    String.fromCharCode(0xfffe),
    '한글 ← 1',
    '\r\n',
  ),
);
const optionalText = fc.option(text, { nil: undefined });
const blockRef = fc.nat(40).map((number) => `b${String(number + 1)}`);
const diagramRef = fc.nat(5).map((number) => `d${String(number + 1)}`);
const rawFold = fc.record({ from: fc.nat(), to: fc.nat(), name: optionalText });

const target: fc.Arbitrary<CallTarget> = fc.oneof(
  diagramRef.map((diagram) => ({ kind: 'local' as const, diagram })),
  text.map((name) => ({ kind: 'named' as const, name })),
  fc.record({
    kind: fc.constant('external' as const),
    file: text,
    diagram: diagramRef,
    lastName: text,
  }),
  fc.record({ lastName: text, file: optionalText }).map(({ lastName, file }) => ({
    kind: 'lost' as const,
    lastName,
    ...(file === undefined ? {} : { file }),
  })),
);

function rawSeq(depth: number): fc.Arbitrary<RawSeq> {
  return fc.record({
    blocks: fc.array(rawBlock(depth), { minLength: 1, maxLength: 3 }),
    folds: fc.array(rawFold, { maxLength: 2 }),
  });
}

function rawBlock(depth: number): fc.Arbitrary<RawBlock> {
  const leaves: fc.Arbitrary<RawBlock>[] = [
    text.map((value) => ({ kind: 'process' as const, text: value })),
    fc.record({
      kind: fc.constant('call' as const),
      target,
      args: text,
      result: text,
      siteFolds: fc.array(
        fc.record({
          from: fc.nat(),
          to: fc.nat(),
          name: optionalText,
          via: fc.array(fc.nat(), { maxLength: 2 }),
        }),
        { maxLength: 2 },
      ),
    }),
  ];
  if (depth === 0) {
    return fc.oneof(...leaves);
  }
  const body = rawSeq(depth - 1);
  const branch = fc.record({ label: optionalText, body });
  return fc.oneof(
    ...leaves,
    fc.record({ kind: fc.constant('if' as const), text, yes: branch, no: branch }),
    fc.record({
      kind: fc.constant('case' as const),
      text,
      arms: fc.array(fc.record({ label: text, body }), { maxLength: 2 }),
      otherwise: fc.option(branch, { nil: null }),
    }),
    fc.record({
      kind: fc.constantFrom('while' as const, 'doWhile' as const, 'for' as const),
      text,
      body,
    }),
  );
}

function numberDoc(
  diagrams: ReadonlyArray<{ readonly head: Diagram['head']; readonly body: RawSeq }>,
): Content['diagrams'] {
  const counters = { b: 0, r: 0, f: 0 };
  const next = (prefix: keyof typeof counters): string => {
    counters[prefix] += 1;
    return `${prefix}${String(counters[prefix])}`;
  };
  const pick = <T>(items: ReadonlyArray<T>, index: number): T => items[index % items.length] as T;

  const seq = (raw: RawSeq): Seq => {
    const blocks = raw.blocks.map(block);
    const ids = blocks.map((item) => item.id);
    const folds = raw.folds.map((fold): FoldMark => ({
      id: next('f'),
      first: pick(ids, fold.from),
      last: pick(ids, fold.to),
      ...(fold.name === undefined ? {} : { name: fold.name }),
    }));
    return { blocks, folds };
  };
  const branch = (raw: RawBranch): Branch => {
    const id = next('r');
    return { id, ...(raw.label === undefined ? {} : { label: raw.label }), body: seq(raw.body) };
  };
  const block = (raw: RawBlock): Block => {
    const id = next('b');
    switch (raw.kind) {
      case 'process':
        return { id, kind: raw.kind, text: raw.text };
      case 'if':
        return { id, kind: raw.kind, text: raw.text, yes: branch(raw.yes), no: branch(raw.no) };
      case 'case':
        return {
          id,
          kind: raw.kind,
          text: raw.text,
          arms: raw.arms.map((arm) => ({ id: next('r'), label: arm.label, body: seq(arm.body) })),
          otherwise: raw.otherwise === null ? null : branch(raw.otherwise),
        };
      case 'while':
      case 'doWhile':
      case 'for':
        return { id, kind: raw.kind, text: raw.text, body: seq(raw.body) };
      case 'call':
        return {
          id,
          kind: raw.kind,
          target: raw.target,
          args: raw.args,
          result: raw.result,
          siteFolds: raw.siteFolds.map((fold): SiteFold => ({
            id: next('f'),
            via: fold.via.map((number) => `b${String(number + 1)}`),
            first: `b${String(fold.from + 1)}`,
            last: `b${String(fold.to + 1)}`,
            ...(fold.name === undefined ? {} : { name: fold.name }),
          })),
        };
    }
  };
  return diagrams.map((diagram, index) => ({
    id: `d${String(index + 1)}`,
    head: diagram.head,
    body: seq(diagram.body),
  }));
}

const head = fc.option(
  fc.record({ kind: fc.constantFrom('event' as const, 'method' as const), text }),
  { nil: null },
);

const someId = fc.oneof(
  fc.nat(30).map((number) => `b${String(number + 1)}`),
  fc.nat(10).map((number) => `r${String(number + 1)}`),
  fc.nat(10).map((number) => `f${String(number + 1)}`),
);

const docAndKept: fc.Arbitrary<{ readonly doc: Doc; readonly kept: KeptSettings }> = fc
  .record({
    diagrams: fc.array(fc.record({ head, body: rawSeq(2) }), { minLength: 1, maxLength: 3 }),
    theme: text,
    headStyle: fc.constantFrom('shape' as const, 'title' as const),
    keptTextKind: fc.option(
      text.filter((value) => value !== 'plain'),
      { nil: undefined },
    ),
    folded: fc.array(someId, { maxLength: 8 }),
    opened: fc.array(fc.array(blockRef, { minLength: 1, maxLength: 3 }), { maxLength: 4 }),
    bands: fc.boolean(),
    resultSymbol: fc.constantFrom('←' as const, '=' as const),
  })
  .map((raw) => ({
    doc: {
      content: {
        settings: { textKind: 'plain', theme: raw.theme, headStyle: raw.headStyle },
        diagrams: numberDoc(raw.diagrams),
      },
      view: {
        folded: raw.folded,
        opened: raw.opened,
        bands: raw.bands,
        resultSymbol: raw.resultSymbol,
      },
    },
    kept: raw.keptTextKind === undefined ? {} : { textKind: raw.keptTextKind },
  }));

const drawing = {
  width: 10,
  height: 10,
  viewBox: '0 0 10 10',
  paper: '#ffffff',
  content: '<g class="ans-render"></g>',
};

// Generated documents follow the format but not always the invariants (fold ranges, call
// targets), so these tests check the format alone.
const formatOnly = (): null => null;

describe('round trip', () => {
  it('R-FMT-02: model JSON reads back as the same content, and writes the same text again', () => {
    fc.assert(
      fc.property(docAndKept, ({ doc, kept }) => {
        const json = serializeModelJson(doc, kept);
        const read = parseModelJson(json, formatOnly);
        if (!read.ok) {
          throw new Error(read.detail);
        }
        expect(read.value.doc.content).toEqual(doc.content);
        expect(read.value.kept).toEqual(kept);
        expect(serializeModelJson(read.value.doc, read.value.kept)).toBe(json);
      }),
    );
  });

  it('QA-04: a saved SVG file opens as the same document and saves to the same bytes', () => {
    fc.assert(
      fc.property(docAndKept, ({ doc, kept }) => {
        const file = assembleSvgFile({ doc, kept, drawing, fonts: [] });
        const opened = openSvgFile(file, formatOnly);
        if (!opened.ok) {
          throw new Error(opened.detail);
        }
        expect(opened.value.doc.content).toEqual(doc.content);
        expect(assembleSvgFile({ ...opened.value, drawing, fonts: [] })).toBe(file);
      }),
    );
  });

  it('QA-02: opening any text never throws', () => {
    fc.assert(
      fc.property(fc.string(), docAndKept, fc.nat(), fc.nat(), (noise, { doc }, from, length) => {
        const file = assembleSvgFile({ doc, drawing, fonts: [] });
        const at = from % (file.length + 1);
        // Cut, damage or replace a part of a real file.
        const damaged = file.slice(0, at) + noise + file.slice(at + (length % 20));
        expect(typeof openSvgFile(damaged).ok).toBe('boolean');
        expect(typeof openSvgFile(noise).ok).toBe('boolean');
      }),
    );
  });
});
