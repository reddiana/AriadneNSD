import { describe, expect, it } from 'vitest';

import type { Block, Doc, Head, Locale, Seq } from '@ariadne-nsd/core';
import {
  assembleSvgFile,
  checkInvariants,
  createDoc,
  locales,
  openSvgFile,
  parseModelJson,
  serializeModelJson,
} from '@ariadne-nsd/core';

import { binarySearch } from './binary-search';
import type { BlockSpec, DiagramSpec, LocalizedSpec } from './build-example';
import { dijkstra } from './dijkstra';
import { elevator } from './elevator';
import { examples } from './examples';
import { maze } from './maze';
import { mergeSort } from './merge-sort';
import { quicksort } from './quicksort';
import { raft } from './raft';
import { timerInterrupt } from './timer-interrupt';
import { uartCase } from './uart-case';
import { vendingMachine } from './vending-machine';

/** A code-only example: the same diagrams and headers on every screen. */
function same<T>(value: T): Readonly<Record<Locale, T>> {
  return { ko: value, en: value };
}

// Hangul syllables and jamo: an English example has none (maintainer, 2026-11-03: "영어판은
// 영어가 나와야지요").
const hangul = /[ᄀ-ᇿ㄰-㆏가-힯]/u;

// What each example must hold, as in the prototype (journal/assets/2026-10-10-ns-prototype.html):
// the headers in order on each screen, and the number of blocks.
const expected: ReadonlyArray<{
  readonly id: string;
  readonly heads: Readonly<Record<Locale, ReadonlyArray<Head>>>;
  readonly blocks: number;
  readonly spec: LocalizedSpec;
}> = [
  {
    id: 'merge-sort',
    heads: same([{ kind: 'method', text: 'merge_sort(a, lo, hi)' }]),
    blocks: 15,
    spec: same(mergeSort),
  },
  {
    id: 'dijkstra',
    heads: same([{ kind: 'method', text: 'dijkstra(graph, s)' }]),
    blocks: 15,
    spec: same(dijkstra),
  },
  {
    id: 'uart-case',
    heads: {
      ko: [{ kind: 'event', text: 'UART 수신 인터럽트' }],
      en: [{ kind: 'event', text: 'UART receive interrupt' }],
    },
    blocks: 13,
    spec: uartCase,
  },
  {
    id: 'timer-interrupt',
    heads: {
      ko: [{ kind: 'event', text: 'TIM2 인터럽트 (1ms)' }],
      en: [{ kind: 'event', text: 'TIM2 interrupt (1ms)' }],
    },
    blocks: 17,
    spec: timerInterrupt,
  },
  {
    id: 'binary-search',
    heads: same([
      { kind: 'event', text: 'main()' },
      { kind: 'method', text: 'binary_search(a, n, key)' },
    ]),
    blocks: 17,
    spec: binarySearch,
  },
  {
    id: 'quicksort',
    heads: same([
      { kind: 'method', text: 'quicksort(a, lo, hi)' },
      { kind: 'method', text: 'partition(a, lo, hi)' },
    ]),
    blocks: 16,
    spec: same(quicksort),
  },
  {
    id: 'maze',
    heads: same([
      { kind: 'event', text: 'main()' },
      { kind: 'method', text: 'solve(maze, p)' },
    ]),
    blocks: 20,
    spec: maze,
  },
  {
    id: 'vending-machine',
    heads: {
      ko: [
        { kind: 'event', text: '동전이 들어오면' },
        { kind: 'event', text: '음료 버튼을 누르면' },
        { kind: 'method', text: '살 수 있는 음료에 불을 켠다' },
      ],
      en: [
        { kind: 'event', text: 'When a coin is inserted' },
        { kind: 'event', text: 'When a drink button is pressed' },
        { kind: 'method', text: 'Light up the drinks you can buy' },
      ],
    },
    blocks: 24,
    spec: vendingMachine,
  },
  {
    id: 'elevator',
    heads: {
      ko: [
        { kind: 'event', text: '층 버튼이 눌리면' },
        { kind: 'event', text: '제어 주기마다 (100ms)' },
        { kind: 'method', text: '다음 행선지를 정한다' },
      ],
      en: [
        { kind: 'event', text: 'When a floor button is pressed' },
        { kind: 'event', text: 'Every control cycle (100ms)' },
        { kind: 'method', text: 'Choose the next destination' },
      ],
    },
    blocks: 28,
    spec: elevator,
  },
  {
    id: 'raft',
    heads: {
      ko: [
        { kind: 'event', text: '선거 타이머가 끝나면' },
        { kind: 'event', text: '투표 요청을 받으면' },
        { kind: 'event', text: '투표 응답을 받으면' },
        { kind: 'event', text: '하트비트 타이머가 끝나면' },
        { kind: 'event', text: '클라이언트 요청을 받으면' },
        { kind: 'event', text: '로그 복제 요청을 받으면' },
        { kind: 'event', text: '로그 복제 응답을 받으면' },
        { kind: 'method', text: '모든 피어에게 로그를 보낸다' },
        { kind: 'method', text: '커밋된 항목을 상태 기계에 적용한다' },
        { kind: 'method', text: '팔로워로 물러난다' },
      ],
      en: [
        { kind: 'event', text: 'When the election timer runs out' },
        { kind: 'event', text: 'When a vote request arrives' },
        { kind: 'event', text: 'When a vote reply arrives' },
        { kind: 'event', text: 'When the heartbeat timer runs out' },
        { kind: 'event', text: 'When a client request arrives' },
        { kind: 'event', text: 'When a log replication request arrives' },
        { kind: 'event', text: 'When a log replication reply arrives' },
        { kind: 'method', text: 'Send the log to every peer' },
        { kind: 'method', text: 'Apply committed entries to the state machine' },
        { kind: 'method', text: 'Step down to follower' },
      ],
    },
    blocks: 74,
    spec: raft,
  },
];

function* seqBlocks(seq: Seq): Generator<Block> {
  for (const block of seq.blocks) {
    yield block;
    switch (block.kind) {
      case 'process':
      case 'call':
        break;
      case 'if':
        yield* seqBlocks(block.yes.body);
        yield* seqBlocks(block.no.body);
        break;
      case 'case':
        for (const arm of block.arms) {
          yield* seqBlocks(arm.body);
        }
        if (block.otherwise !== null) {
          yield* seqBlocks(block.otherwise.body);
        }
        break;
      case 'while':
      case 'doWhile':
      case 'for':
        yield* seqBlocks(block.body);
        break;
    }
  }
}

function allBlocks(doc: Doc): Block[] {
  return doc.content.diagrams.flatMap((diagram) => [...seqBlocks(diagram.body)]);
}

// The document without its words: each diagram's id and kind, each block's id and kind in walk
// order, and where the fold regions are. Both languages of an example must give the same.
function docShape(doc: Doc): string[] {
  const folds = (seq: Seq): string[] => [
    ...seq.folds.map((fold) => `${fold.id}:${fold.first}-${fold.last}`),
    ...seq.blocks.flatMap((block) => {
      switch (block.kind) {
        case 'process':
        case 'call':
          return [];
        case 'if':
          return [...folds(block.yes.body), ...folds(block.no.body)];
        case 'case':
          return [
            ...block.arms.flatMap((arm) => folds(arm.body)),
            ...(block.otherwise === null ? [] : folds(block.otherwise.body)),
          ];
        case 'while':
        case 'doWhile':
        case 'for':
          return folds(block.body);
      }
    }),
  ];
  return doc.content.diagrams.flatMap((diagram) => [
    `${diagram.id}:${diagram.head?.kind ?? 'none'}`,
    ...[...seqBlocks(diagram.body)].map((block) => `${block.id}:${block.kind}`),
    ...folds(diagram.body),
  ]);
}

// Every string of the document, in one walk order: header, then each sequence's blocks
// (branch labels, condition, call target header, args, result) followed by its fold names.
function docTexts(doc: Doc): string[] {
  const out: string[] = [];
  const headOf = (id: string): string =>
    doc.content.diagrams.find((diagram) => diagram.id === id)?.head?.text ?? '<missing>';
  const seq = (s: Seq): void => {
    for (const block of s.blocks) {
      switch (block.kind) {
        case 'process':
          out.push(block.text);
          break;
        case 'if':
          out.push(block.text);
          seq(block.yes.body);
          seq(block.no.body);
          break;
        case 'case':
          out.push(block.text);
          for (const arm of block.arms) {
            out.push(arm.label);
            seq(arm.body);
          }
          if (block.otherwise !== null) {
            out.push('default');
            seq(block.otherwise.body);
          }
          break;
        case 'while':
        case 'doWhile':
        case 'for':
          out.push(block.text);
          seq(block.body);
          break;
        case 'call':
          out.push(block.target.kind === 'local' ? headOf(block.target.diagram) : '<not local>');
          out.push(block.args, block.result);
          break;
      }
    }
    out.push(...s.folds.map((fold) => fold.name ?? '<no name>'));
  };
  for (const diagram of doc.content.diagrams) {
    out.push(diagram.head?.text ?? '<no head>');
    seq(diagram.body);
  }
  return out;
}

// The same walk over the short notation. A range's blocks stay in place and its name comes
// after the blocks of the sequence it is in, as in `docTexts`.
function specTexts(spec: ReadonlyArray<DiagramSpec>): string[] {
  const out: string[] = [];
  const seq = (list: ReadonlyArray<BlockSpec>): void => {
    const names: string[] = [];
    const add = (items: ReadonlyArray<BlockSpec>): void => {
      for (const item of items) {
        if (typeof item === 'string') {
          out.push(item);
          continue;
        }
        switch (item[0]) {
          case 'if':
            out.push(item[1]);
            seq(item[2]);
            seq(item[3]);
            break;
          case 'case':
            out.push(item[1]);
            for (const [label, body] of item[2]) {
              out.push(label);
              seq(body);
            }
            break;
          case 'while':
          case 'doWhile':
          case 'for':
            out.push(item[1]);
            seq(item[2]);
            break;
          case 'call':
            out.push(item[1], item[2] ?? '', item[3] ?? '');
            break;
          case 'range':
            add(item[2]);
            names.push(item[1]);
            break;
        }
      }
    };
    add(list);
    out.push(...names);
  };
  for (const diagram of spec) {
    out.push(diagram.head.text);
    seq(diagram.body);
  }
  return out;
}

describe('examples', () => {
  it('T-0321 · R-EDIT-25: lists the ten examples in order, each named in both languages', () => {
    expect(examples.map((example) => example.id)).toEqual(expected.map((entry) => entry.id));
    for (const example of examples) {
      expect(example.name.ko).not.toBe('');
      expect(example.name.en).not.toBe('');
      expect(example.what.ko).not.toBe('');
      expect(example.what.en).not.toBe('');
    }
  });

  describe.each(expected)('$id', (entry) => {
    const example = examples.find((candidate) => candidate.id === entry.id);
    if (example === undefined) {
      throw new Error(`no example ${entry.id}`);
    }
    const doc = example.build({ headStyle: 'title', locale: 'en' });

    it('T-0322 · R-EDIT-25: keeps every invariant, with either header shape', () => {
      expect(checkInvariants(doc.content)).toEqual([]);
      expect(checkInvariants(example.build({ headStyle: 'shape', locale: 'ko' }).content)).toEqual(
        [],
      );
    });

    it('T-0323 · R-EDIT-25: uses the given header shape and the settings and view of a new document', () => {
      // The drawing language is passed in too, like the header shape (ADR-0041).
      const shape = example.build({ headStyle: 'shape', locale: 'ko' });
      expect(shape.content.settings).toEqual(
        createDoc({ headStyle: 'shape', locale: 'ko' }).content.settings,
      );
      expect(doc.content.settings).toEqual(createDoc({ headStyle: 'title' }).content.settings);
      expect(doc.view).toEqual(createDoc().view);
    });

    it('T-0324 · R-EDIT-25: builds the same document every time', () => {
      expect(example.build({ headStyle: 'title', locale: 'en' })).toEqual(doc);
    });

    it('T-0325 · R-EDIT-25: has the diagrams, headers and blocks of the prototype', () => {
      for (const locale of locales) {
        const built = example.build({ headStyle: 'title', locale });
        expect(built.content.diagrams.map((diagram) => diagram.head)).toEqual(entry.heads[locale]);
        expect(allBlocks(built)).toHaveLength(entry.blocks);
      }
    });

    it('T-0326 · R-EDIT-25: keeps every text of the short notation as written', () => {
      for (const locale of locales) {
        const built = example.build({ headStyle: 'title', locale });
        expect(docTexts(built)).toEqual(specTexts(entry.spec[locale]));
      }
    });

    it('T-0837 · R-EDIT-25: an English screen opens it in English, with no Hangul in any text', () => {
      const texts = docTexts(doc);
      expect(texts.filter((text) => hangul.test(text))).toEqual([]);
    });

    it('T-0838 · R-EDIT-25: a Korean screen opens the Korean one, with the blocks of the English one in the same places', () => {
      const korean = example.build({ headStyle: 'title', locale: 'ko' });
      expect(docTexts(korean)).toEqual(specTexts(entry.spec.ko));
      expect(docShape(korean)).toEqual(docShape(doc));
    });

    it('T-0327 · R-EDIT-25: links every call block to a Method in the document', () => {
      const methods = new Set(
        doc.content.diagrams.filter((d) => d.head?.kind === 'method').map((d) => d.id),
      );
      for (const block of allBlocks(doc)) {
        if (block.kind === 'call') {
          expect(block.target.kind).toBe('local');
          if (block.target.kind === 'local') {
            expect(methods.has(block.target.diagram)).toBe(true);
          }
        }
      }
    });

    it('T-0328 · R-FMT-02: saves to model JSON and opens as the same document', () => {
      const json = serializeModelJson(doc);
      const read = parseModelJson(json);
      if (!read.ok) {
        throw new Error(read.detail);
      }
      expect(read.value.doc.content).toEqual(doc.content);
      expect(serializeModelJson(read.value.doc, read.value.kept)).toBe(json);
    });

    it('T-0329 · QA-04: saves to an SVG file and opens as the same document', () => {
      const drawing = {
        width: 10,
        height: 10,
        viewBox: '0 0 10 10',
        paper: '#ffffff',
        content: '<g class="ans-render"></g>',
      };
      const file = assembleSvgFile({ doc, drawing, fonts: [] });
      const opened = openSvgFile(file);
      if (!opened.ok) {
        throw new Error(opened.detail);
      }
      expect(opened.value.doc.content).toEqual(doc.content);
    });
  });
});
