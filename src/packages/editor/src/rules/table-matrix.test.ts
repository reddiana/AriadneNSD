// The command × target matrix of the interaction rules ("명령 × 대상 매트릭스"), compared with
// the editor cell by cell: every cell is one test, with the cell's words and what the command
// must do on that selection (03-editor 3.5).
import { describe, expect, it } from 'vitest';

import { clipFromJson, diagramFromJson } from '../clipboard/clip-format';
import type { TestEngine } from '../engine-test-support';
import {
  after,
  bodyOf,
  diagramNames,
  foldedNames as folded,
  id,
  nameOf,
  outlineOf,
  pasted,
  perform,
  refused,
  refusesAll,
  rulesEngine,
  select,
  seqOutline,
} from './rules-fixture';
import type { Selector } from './rules-fixture';
import { caseKeys, cellOf, ruleTable, split, tableKeys } from './rules-table';
import type { CellCase } from './rules-table';

const matrix = ruleTable('### 명령 × 대상 매트릭스', ['명령', '블록']);

const columns = [
  '블록',
  '분기 라벨',
  '헤더',
  '접기 영역(이름 띠 · 접힌 칸)',
  '빈 default 칸',
  '펴 보인 블록',
  '선택 없음',
] as const;

type Entry = Pick<CellCase, 'doc' | 'check' | 'pending'>;
type Row = readonly [
  block: Entry,
  label: Entry,
  head: Entry,
  fold: Entry,
  missing: Entry,
  peek: Entry,
  none: Entry,
];

const cell = (doc: string, check: () => void | Promise<void>): Entry => ({ doc, check });
/** A cell that says "거절": none of the commands runs. */
const no = (selector: Selector, ...commands: string[]): Entry =>
  cell('거절', () => refusesAll(selector, ...commands));

const block = {
  a: select.block('a'),
  label: select.label('k1r'),
  head: select.head('d1'),
  fold: select.fold('F'),
  missing: select.missing('k'),
  peek: select.peek('h1'),
  none: select.none(),
};

const editing = (engine: TestEngine): unknown => engine.session.state.editing?.field;

/** What is on the clipboard, in words. */
function clipboard(engine: TestEngine): string {
  const json = engine.clipboard.data.json;
  const clip = json === null ? null : clipFromJson(json);
  return clip === null ? '' : seqOutline(clip);
}

async function copies(selector: Selector, blocks: string): Promise<void> {
  const engine = rulesEngine();
  const before = await perform(engine, selector, 'edit.copy');
  expect(engine.content()).toBe(before.content);
  expect(clipboard(engine)).toBe(blocks);
}

/** The command opens a text field. */
async function opens(selector: Selector, field: object): Promise<void> {
  const engine = await after(selector, 'edit.text');
  expect(editing(engine)).toEqual(field);
}

/** The body of `main()` starts with these words. */
const starts = (engine: TestEngine, words: string): void => {
  expect(bodyOf(engine).startsWith(words), bodyOf(engine)).toBe(true);
};
/** The body of `main()` holds these words. */
const holds = (engine: TestEngine, words: string): void => {
  expect(bodyOf(engine)).toContain(words);
};

/** The default branch of the Case `k` after the command, in words. */
const defaultOfK = (engine: TestEngine): string => {
  const outline = outlineOf(engine, 'k');
  return /default: (.*)\]$/.exec(outline)?.[1] ?? '';
};

const REGION = '<F: f1 f2>';

const rows: Readonly<Record<string, Row>> = {
  '텍스트 편집': [
    cell('텍스트', () => opens(block.a, { kind: 'block', block: id('a') })),
    cell('라벨(default 분기와 병렬 처리의 분기는 거절)', async () => {
      await opens(block.label, { kind: 'branchLabel', branch: id('k1r') });
      await refusesAll(select.label('gd'), 'edit.text');
      await refusesAll(select.label('p1r'), 'edit.text');
    }),
    cell('이름', () => opens(block.head, { kind: 'head', diagram: 'd1' })),
    cell('이름', () => opens(block.fold, { kind: 'fold', fold: id('F') })),
    cell('입력하면 default 분기를 만든다', async () => {
      const engine = await after(block.missing, 'edit.text');
      expect(editing(engine)).toEqual({ kind: 'missingDefault', block: id('k') });
      expect(defaultOfK(engine)).toBe('');
      engine.session.commitEditing('x');
      expect(defaultOfK(engine)).toBe('x');
    }),
    no(block.peek, 'edit.text'),
    no(block.none, 'edit.text'),
  ],
  '삽입(처리)': [
    cell('아래 · 위', async () => {
      starts(await after(block.a, 'block.insert.process'), 'a ∅ while(w)');
      starts(await after(block.a, 'block.insertBefore.process'), '∅ a while(w)');
    }),
    cell('분기를 오른쪽 · 왼쪽에', async () => {
      const right = await after(block.label, 'block.insert.process');
      expect(outlineOf(right, 'k')).toMatch(/^case\(k\)\[1: k1 k2 \| [^|]*: ∅ \| 2: k3 k4\]$/);
      const left = await after(block.label, 'block.insertBefore.process');
      expect(outlineOf(left, 'k')).toMatch(/^case\(k\)\[[^|]*: ∅ \| 1: k1 k2 \| 2: k3 k4\]$/);
    }),
    cell('본문의 맨 앞(위는 거절)', async () => {
      starts(await after(block.head, 'block.insert.process'), '∅ a ');
      await refusesAll(block.head, 'block.insertBefore.process');
    }),
    cell('영역 밖의 아래 · 위', async () => {
      holds(await after(block.fold, 'block.insert.process'), `${REGION} ∅ z`);
      holds(await after(block.fold, 'block.insertBefore.process'), `∅ ${REGION} z`);
    }),
    cell('default 분기를 만들고 그 안에', async () => {
      for (const command of ['block.insert.process', 'block.insertBefore.process']) {
        expect(defaultOfK(await after(block.missing, command))).toBe('∅');
      }
    }),
    no(block.peek, 'block.insert.process', 'block.insertBefore.process'),
    cell('맨 끝', async () => {
      for (const command of ['block.insert.process', 'block.insertBefore.process']) {
        const engine = await after(block.none, command);
        expect(bodyOf(engine).endsWith(' z ∅'), bodyOf(engine)).toBe(true);
      }
    }),
  ],
  '삽입(제어 블록)': [
    cell('아래 · 위(빈 블록은 교체)', async () => {
      starts(await after(block.a, 'block.insert.while'), 'a while()[∅] while(w)');
      starts(await after(block.a, 'block.insertBefore.while'), 'while()[∅] a ');
      for (const command of ['block.insert.while', 'block.insertBefore.while']) {
        expect(bodyOf(await after(select.block('e'), command), 'd3')).toBe('o1 while()[∅]');
      }
    }),
    { doc: '거절', check: () => refusesAll(block.label, 'block.insert.while'), pending: 'BL3' },
    cell('본문의 맨 앞(위는 거절)', async () => {
      starts(await after(block.head, 'block.insert.while'), 'while()[∅] a ');
      await refusesAll(block.head, 'block.insertBefore.while');
    }),
    cell('영역 밖의 아래 · 위', async () => {
      holds(await after(block.fold, 'block.insert.while'), `${REGION} while()[∅] z`);
      holds(await after(block.fold, 'block.insertBefore.while'), `while()[∅] ${REGION} z`);
    }),
    cell('default 분기를 만들고 그 안에', async () => {
      for (const command of ['block.insert.while', 'block.insertBefore.while']) {
        expect(defaultOfK(await after(block.missing, command))).toBe('while()[∅]');
      }
    }),
    no(block.peek, 'block.insert.while', 'block.insertBefore.while'),
    cell('맨 끝', async () => {
      const engine = await after(block.none, 'block.insert.while');
      expect(bodyOf(engine).endsWith(' z while()[∅]'), bodyOf(engine)).toBe(true);
    }),
  ],
  붙여넣기: [
    cell('아래 · 위(빈 블록은 교체)', async () => {
      starts(await pasted(block.a, block.a, 'edit.paste'), 'a a while(w)');
      starts(await pasted(select.block('o1'), block.a, 'edit.pasteBefore'), 'o1 a while(w)');
      for (const command of ['edit.paste', 'edit.pasteBefore'] as const) {
        expect(bodyOf(await pasted(block.a, select.block('e'), command), 'd3')).toBe('o1 a');
      }
    }),
    cell('새 분기를 오른쪽 · 왼쪽에 만들어 그 안에', async () => {
      const right = await pasted(block.a, block.label, 'edit.paste');
      expect(outlineOf(right, 'k')).toMatch(/^case\(k\)\[1: k1 k2 \| [^|]*: a \| 2: k3 k4\]$/);
      const left = await pasted(block.a, block.label, 'edit.pasteBefore');
      expect(outlineOf(left, 'k')).toMatch(/^case\(k\)\[[^|]*: a \| 1: k1 k2 \| 2: k3 k4\]$/);
    }),
    cell('본문의 맨 앞(위는 거절). 다이어그램을 복사했으면 새 다이어그램', async () => {
      starts(await pasted(select.block('z'), block.head, 'edit.paste'), 'z a ');
      const engine = rulesEngine();
      await perform(engine, select.block('z'), 'edit.copy');
      await refused(engine, block.head, 'edit.pasteBefore');
      for (const command of ['edit.paste', 'edit.pasteBefore'] as const) {
        const whole = await pasted(select.head('d3'), block.head, command);
        expect(diagramNames(whole)).toHaveLength(4);
      }
    }),
    cell('영역 밖의 아래 · 위', async () => {
      holds(await pasted(block.a, block.fold, 'edit.paste'), `${REGION} a z`);
      holds(await pasted(block.a, block.fold, 'edit.pasteBefore'), `a ${REGION} z`);
    }),
    cell('default 분기를 만들고 그 안에', async () => {
      for (const command of ['edit.paste', 'edit.pasteBefore'] as const) {
        expect(defaultOfK(await pasted(block.a, block.missing, command))).toBe('a');
      }
    }),
    cell('거절', async () => {
      const engine = rulesEngine();
      await perform(engine, block.a, 'edit.copy');
      await refused(engine, block.peek, 'edit.paste');
      await refused(engine, block.peek, 'edit.pasteBefore');
    }),
    cell('맨 끝', async () => {
      for (const command of ['edit.paste', 'edit.pasteBefore'] as const) {
        const engine = rulesEngine();
        await perform(engine, block.a, 'edit.copy');
        // Copying selected `a` in main(): with nothing selected its diagram is the current one.
        await perform(engine, block.none, command);
        expect(bodyOf(engine).endsWith(' z a'), bodyOf(engine)).toBe(true);
      }
    }),
  ],
  복사: [
    cell('블록', () => copies(select.block('w'), 'while(w)[w1 w2]')),
    cell('분기의 블록 전체', () => copies(block.label, 'k1 k2')),
    cell('다이어그램', async () => {
      const engine = await after(block.head, 'edit.copy');
      expect(diagramFromJson(engine.clipboard.data.json ?? '')?.head?.text).toBe('main()');
    }),
    cell('영역 전체', () => copies(block.fold, REGION)),
    no(block.missing, 'edit.copy'),
    cell('Method의 블록', () => copies(block.peek, 'h1')),
    no(block.none, 'edit.copy'),
  ],
  잘라내기: [
    cell('블록', async () => {
      const engine = await after(block.a, 'edit.cut');
      starts(engine, 'while(w)');
      expect(clipboard(engine)).toBe('a');
    }),
    cell('블록을 복사하고 분기를 삭제', async () => {
      const engine = await after(block.label, 'edit.cut');
      expect(outlineOf(engine, 'k')).toBe('case(k)[2: k3 k4]');
      expect(clipboard(engine)).toBe('k1 k2');
    }),
    no(block.head, 'edit.cut'),
    cell('영역 전체', async () => {
      const engine = await after(block.fold, 'edit.cut');
      holds(engine, 'call z');
      expect(bodyOf(engine)).not.toContain('f1');
      expect(clipboard(engine)).toBe(REGION);
    }),
    no(block.missing, 'edit.cut'),
    no(block.peek, 'edit.cut'),
    no(block.none, 'edit.cut'),
  ],
  삭제: [
    cell('블록', async () => {
      const engine = await after(block.a, 'edit.delete');
      starts(engine, 'while(w)');
      expect(engine.clipboard.data.json).toBeNull();
    }),
    cell('분기(If와 최소 개수는 거절)', async () => {
      const engine = await after(block.label, 'edit.delete');
      expect(outlineOf(engine, 'k')).toBe('case(k)[2: k3 k4]');
      await refusesAll(select.label('ry'), 'edit.delete');
      // A Case keeps one branch besides the default, a parallel block two.
      await refusesAll(select.label('gr'), 'edit.delete');
      await refusesAll(select.label('p1r'), 'edit.delete');
    }),
    cell('헤더만 제거', async () => {
      const engine = await after(select.head('d3'), 'edit.delete');
      expect(diagramNames(engine)).toEqual(['main()', 'helper()', '-']);
      expect(bodyOf(engine, 'd3')).toBe('o1 ∅');
    }),
    cell('영역 전체', async () => {
      const engine = await after(block.fold, 'edit.delete');
      holds(engine, 'call z');
      expect(bodyOf(engine)).not.toContain('f1');
    }),
    no(block.missing, 'edit.delete'),
    no(block.peek, 'edit.delete'),
    no(block.none, 'edit.delete'),
  ],
  이동: [
    cell('위 · 아래(좌우는 상위 분기)', async () => {
      starts(await after(block.a, 'edit.move.down'), 'while(w)[w1 w2] a ');
      starts(await after(select.block('w'), 'edit.move.up'), 'while(w)[w1 w2] a ');
      const moved = await after(select.block('y1'), 'edit.move.right');
      expect(outlineOf(moved, 'c')).toBe('if(c)[n1 n2 | y1 y2]');
      const back = await after(select.block('k3'), 'edit.move.left');
      expect(outlineOf(back, 'k')).toBe('case(k)[2: k3 k4 | 1: k1 k2]');
    }),
    cell('분기를 좌우로(위 · 아래는 거절)', async () => {
      const right = await after(block.label, 'edit.move.right');
      expect(outlineOf(right, 'k')).toBe('case(k)[2: k3 k4 | 1: k1 k2]');
      const left = await after(select.label('k2r'), 'edit.move.left');
      expect(outlineOf(left, 'k')).toBe('case(k)[2: k3 k4 | 1: k1 k2]');
      await refusesAll(block.label, 'edit.move.up', 'edit.move.down');
    }),
    cell('다이어그램의 순서', async () => {
      const down = await after(block.head, 'edit.move.down');
      expect(diagramNames(down)).toEqual(['helper()', 'main()', 'other()']);
      const up = await after(select.head('d3'), 'edit.move.up');
      expect(diagramNames(up)).toEqual(['main()', 'other()', 'helper()']);
    }),
    cell('영역 전체', async () => {
      holds(await after(block.fold, 'edit.move.down'), `z ${REGION}`);
      holds(await after(block.fold, 'edit.move.up'), `${REGION} call z`);
    }),
    no(block.missing, 'edit.move.up', 'edit.move.down', 'edit.move.left', 'edit.move.right'),
    no(block.peek, 'edit.move.up', 'edit.move.down', 'edit.move.left', 'edit.move.right'),
    no(block.none, 'edit.move.up', 'edit.move.down', 'edit.move.left', 'edit.move.right'),
  ],
  감싸기: [
    cell('블록', async () => {
      starts(await after(block.a, 'block.wrap.while'), 'while()[a] while(w)');
    }),
    cell('분기의 블록 전체', async () => {
      const engine = await after(block.label, 'block.wrap.while');
      expect(outlineOf(engine, 'k')).toBe('case(k)[1: while()[k1 k2] | 2: k3 k4]');
    }),
    no(block.head, 'block.wrap.while'),
    cell('영역 전체', async () => {
      holds(await after(block.fold, 'block.wrap.while'), '<F: while()[f1 f2]> z');
    }),
    no(block.missing, 'block.wrap.while'),
    no(block.peek, 'block.wrap.while'),
    no(block.none, 'block.wrap.while'),
  ],
  풀기: [
    cell('제어 블록 · 호출 블록(그 밖은 상위 제어 블록)', async () => {
      starts(await after(select.block('w'), 'block.unwrap'), 'a w1 w2 if(c)');
      holds(
        await after(select.block('q'), 'block.unwrap'),
        'parallel(p)[pa | pb] h1 while(w)[h3 h4]',
      );
      holds(await after(select.block('y1'), 'block.unwrap'), 'while(w)[w1 w2] y1 y2 n1 n2 case(k)');
    }),
    cell('그 If · Case', async () => {
      holds(await after(select.label('ry'), 'block.unwrap'), 'y1 y2 n1 n2 case(k)');
      holds(await after(block.label, 'block.unwrap'), 'n2] k1 k2 k3 k4 <H: ');
    }),
    no(block.head, 'block.unwrap'),
    cell('영역의 상위 제어 블록', async () => {
      holds(await after(select.fold('G'), 'block.unwrap'), '<H: <G: g1 g2> g3 gd1>');
    }),
    cell('그 Case', async () => {
      holds(await after(block.missing, 'block.unwrap'), 'n2] k1 k2 k3 k4 <H: ');
    }),
    no(block.peek, 'block.unwrap'),
    no(block.none, 'block.unwrap'),
  ],
  '접기 · 펴기': [
    cell('제어 블록 · 호출 블록(그 밖은 상위 컨테이너)', async () => {
      expect(folded(await after(select.block('w'), 'view.fold.toggle'))).toEqual(['w']);
      const call = await after(select.block('q'), 'view.fold.toggle');
      expect(call.session.state.doc.view.opened).toEqual([]);
      expect(folded(await after(select.block('y1'), 'view.fold.toggle'))).toEqual(['ry']);
    }),
    cell('그 분기', async () => {
      expect(folded(await after(select.label('ry'), 'view.fold.toggle'))).toEqual(['ry']);
    }),
    no(block.head, 'view.fold.toggle'),
    cell('그 영역', async () => {
      expect(folded(await after(block.fold, 'view.fold.toggle'))).toEqual(['F']);
    }),
    cell('그 Case의 분기들', async () => {
      expect(folded(await after(block.missing, 'view.fold.toggle'))).toEqual(['k1r', 'k2r']);
    }),
    cell('그 위치에서만', async () => {
      const engine = await after(select.peek('hw'), 'view.fold.toggle');
      expect(folded(engine)).toEqual(['q/hw']);
    }),
    no(block.none, 'view.fold.toggle'),
  ],
  '접기 영역 만들기': [
    cell('그 범위를 접기 영역으로', async () => {
      const engine = await after(select.range('a', 'w'), 'fold.make');
      expect(bodyOf(engine)).toMatch(/^<\w+: a while\(w\)\[w1 w2\]> if/);
    }),
    { doc: '거절', check: () => refusesAll(block.label, 'fold.make'), pending: 'BL4' },
    no(block.head, 'fold.make'),
    no(block.fold, 'fold.make'),
    no(block.missing, 'fold.make'),
    cell('그 위치의 접기 영역', async () => {
      const engine = await after(block.peek, 'fold.make');
      const made = engine.session.index().blocks.get(id('q'))?.block;
      expect(
        made?.kind === 'call' ? made.siteFolds.map((f) => [f.first, f.last].map(nameOf)) : [],
      ).toEqual([['h1', 'h1']]);
      expect(bodyOf(engine, 'd2')).toBe('h1 while(w)[h3 h4]');
    }),
    no(block.none, 'fold.make'),
  ],
  '접기 영역 풀기': [
    cell('그것을 포함하는 가장 작은 접기 영역', async () => {
      const inner = await after(select.block('g1'), 'fold.remove');
      holds(inner, '<H: case(kd)[g: g1 g2 g3 | default: gd1]>');
      const outer = await after(select.block('g3'), 'fold.remove');
      holds(outer, ' case(kd)[g: <G: g1 g2> g3 | default: gd1] parallel');
      await refusesAll(block.a, 'fold.remove');
    }),
    cell('그 분기를 포함하는 가장 작은 접기 영역', async () => {
      const engine = await after(select.label('gr'), 'fold.remove');
      holds(engine, ' case(kd)[g: <G: g1 g2> g3 | default: gd1] parallel');
    }),
    no(block.head, 'fold.remove'),
    cell('그 영역', async () => {
      holds(await after(block.fold, 'fold.remove'), 'call f1 f2 z');
    }),
    no(block.missing, 'fold.remove'),
    cell('그 위치의 접기 영역', async () => {
      const engine = await after(block.peek, 'fold.make');
      engine.session.cancelEditing();
      await perform(engine, block.peek, 'fold.remove');
      const made = engine.session.index().blocks.get(id('q'))?.block;
      expect(made?.kind === 'call' ? made.siteFolds : null).toEqual([]);
    }),
    no(block.none, 'fold.remove'),
  ],
  '새 Method로 빼기': [
    cell('블록', async () => {
      const engine = await after(block.a, 'diagram.extractMethod');
      expect(diagramNames(engine)).toHaveLength(4);
      starts(engine, 'call while(w)');
    }),
    { doc: '거절', check: () => refusesAll(block.label, 'diagram.extractMethod'), pending: 'BL4' },
    cell('거절(키 m은 Method로 바꾸기)', async () => {
      await refusesAll(block.head, 'diagram.extractMethod');
      const engine = rulesEngine();
      engine.session.commit({ ok: true, content: eventContent(engine), touched: [] }, () => ({
        selection: { kind: 'head', diagram: 'd3' },
      }));
      engine.keys('m');
      expect(engine.content().diagrams).toHaveLength(3);
      expect(engine.content().diagrams[2]?.head?.kind).toBe('method');
    }),
    cell('영역이 Method가 된다', async () => {
      const engine = await after(block.fold, 'diagram.extractMethod');
      holds(engine, 'call call z');
      expect(diagramNames(engine)).toHaveLength(4);
    }),
    no(block.missing, 'diagram.extractMethod'),
    no(block.peek, 'diagram.extractMethod'),
    no(block.none, 'diagram.extractMethod'),
  ],
};

/** The document with the header of `other()` as an Event, for the `m` key. */
function eventContent(engine: TestEngine) {
  const content = engine.content();
  return {
    ...content,
    diagrams: content.diagrams.map((d) =>
      d.id === 'd3' ? { ...d, head: { kind: 'event' as const, text: 'other' } } : d,
    ),
  };
}

const cases: ReadonlyArray<CellCase> = Object.entries(rows).flatMap(([row, entries]) =>
  entries.map((entry, i) => ({ row, column: columns[i] ?? '', ...entry })),
);
const { active, pending } = split(cases);

const read = (c: CellCase): string => cellOf(matrix, c.row, c.column);

const run = async (c: CellCase): Promise<void> => {
  expect(read(c), 'the cell in the document').toBe(c.doc);
  await c.check?.();
};

describe('the command × target matrix', () => {
  it('T-1700: the matrix has the rows and columns that are tested', () => {
    expect(tableKeys(matrix)).toEqual(caseKeys(cases));
  });

  it.each(active)('T-1701: a cell of the matrix: $name', run);

  // Turned on when the branch of BL3 · BL4 is merged: update the cell's words and the behavior.
  describe.skip('cells waiting for BL3 · BL4', () => {
    it.each(pending)('T-1702: a cell of the matrix that BL3 or BL4 changes: $name', run);
  });
});
