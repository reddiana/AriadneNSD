// The tables of elements and containers of the interaction rules ("요소와 컨테이너"), compared
// with the editor: each container's representative element, inside, folded look and editing, and
// the rules T1 ~ T4 (03-editor 3.5).
import type { Box, HitRegion } from '@ariadne-nsd/core';
import { layout } from '@ariadne-nsd/core';
import { describe, expect, it } from 'vitest';

import { clipFromJson, diagramFromJson } from '../clipboard/clip-format';
import type { TestEngine } from '../engine-test-support';
import { findDrop } from '../input/drop';
import { hitTest } from '../input/hit-test';
import type { Hit } from '../input/hit-test';
import { childSeqs } from '../model/doc-index';
import { rowId } from '../model/shown-index';
import { selectedBlocks } from '../state/selection';
import {
  after,
  bodyOf,
  id,
  nameOf,
  perform,
  refusesAll,
  rulesEngine,
  select,
  seqOutline,
} from './rules-fixture';
import type { Selector } from './rules-fixture';
import { caseKeys, cellOf, ruleTable, tableKeys, withNames } from './rules-table';
import type { CellCase } from './rules-table';

const containers = ruleTable('### 요소와 컨테이너', ['컨테이너', '대표 요소']);
const rules = ruleTable('### 요소와 컨테이너', ['#', '규칙']);

const columns = ['대표 요소', '안', '접힌 모습', '편집'] as const;

/** What the keys press, then the selection in words: a block name, or its kind. */
function press(engine: TestEngine, from: Selector, ...keys: string[]): string {
  engine.select(from(engine));
  engine.keys(...keys);
  return selectionName(engine);
}

function selectionName(engine: TestEngine): string {
  const selection = engine.session.state.selection;
  if (selection === null) {
    return 'none';
  }
  switch (selection.kind) {
    case 'blocks':
      return selectedBlocks(engine.session.index(), selection).map(nameOf).join(' ');
    case 'branchLabel':
      return `label ${nameOf(selection.branch)}`;
    case 'fold':
      return `region ${nameOf(selection.fold)}`;
    case 'head':
      return `head ${selection.diagram}`;
    case 'missingDefault':
      return `missing ${nameOf(selection.block)}`;
    case 'peek':
      return `peek ${nameOf(selection.focus)}`;
  }
}

const folded = (engine: TestEngine, fold: Selector): Promise<unknown> =>
  perform(engine, fold, 'view.fold.toggle');

/** The drawing's region of one kind that `test` picks. */
function regionOf(engine: TestEngine, test: (region: HitRegion) => boolean): Box {
  const found = layout(engine.session.state.doc).regions.find(test);
  if (found === undefined) {
    throw new Error('no such region');
  }
  return found.box;
}

/** What the middle of a box points at. */
function pointedAt(engine: TestEngine, box: Box): Hit | null {
  const point = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  return hitTest(layout(engine.session.state.doc), engine.session.index(), point);
}

const clipped = (engine: TestEngine): string => {
  const json = engine.clipboard.data.json;
  const clip = json === null ? null : clipFromJson(json);
  return clip === null ? '' : seqOutline(clip);
};
const copied = async (selector: Selector): Promise<string> =>
  clipped(await after(selector, 'edit.copy'));

/** The ids of the shown tree: what the keys and the pointer see. */
const shownIds = (engine: TestEngine): ReadonlyArray<string> => [
  ...engine.session.shown().index.blocks.keys(),
];

const innerOf = (engine: TestEngine, name: string): ReadonlyArray<string> => {
  const block = engine.session.index().blocks.get(id(name))?.block;
  return block === undefined ? [] : childSeqs(block).map((c) => seqOutline(c.seq));
};

/** Editing inside works: the block is deleted. */
async function editsInside(inner: string): Promise<void> {
  const engine = rulesEngine();
  await perform(engine, select.block(inner), 'edit.delete');
  expect(engine.session.index().blocks.has(id(inner))).toBe(false);
}

type Entry = Pick<CellCase, 'doc' | 'check'>;
type Row = readonly [head: Entry, inside: Entry, closed: Entry, editing: Entry];

const cell = (doc: string, check: () => void | Promise<void>): Entry => ({ doc, check });

const containerRows: Readonly<Record<string, Row>> = {
  다이어그램: [
    cell('헤더', async () => {
      const engine = await after(select.head('d1'), 'edit.copy');
      const diagram = diagramFromJson(engine.clipboard.data.json ?? '');
      expect(diagram?.body.blocks.length).toBe(10);
    }),
    cell('본문', () => {
      const engine = rulesEngine();
      expect(press(engine, select.head('d1'), 'ArrowDown')).toBe('a');
      expect(press(engine, select.block('a'), 'ArrowUp')).toBe('head d1');
    }),
    cell('접지 않는다', () => refusesAll(select.head('d1'), 'view.fold.toggle')),
    cell('할 수 있다', () => editsInside('a')),
  ],
  '반복 블록(While · For · Do-While · 무한 반복)': [
    cell('블록 자신(조건 칸과 띠)', async () => {
      expect(await copied(select.block('w'))).toBe('while(w)[w1 w2]');
      const engine = rulesEngine();
      const band = regionOf(engine, (r) => r.kind === 'head' && r.blockId === id('w'));
      expect(pointedAt(engine, band)).toMatchObject({ kind: 'block', block: id('w') });
    }),
    cell('본문', () => {
      expect(innerOf(rulesEngine(), 'w')).toEqual(['w1 w2']);
    }),
    cell('본문의 위치에 접힌 줄("⋯ 블록 n개")', async () => {
      const engine = rulesEngine();
      await folded(engine, select.block('w'));
      expect(shownIds(engine)).toContain(rowId(id('w')));
      expect(shownIds(engine)).not.toContain(id('w1'));
    }),
    cell('할 수 있다', () => editsInside('w1')),
  ],
  '분기 블록(If · Case · 병렬 처리)': [
    cell('블록 자신(조건 칸과 띠)', async () => {
      expect(await copied(select.block('c'))).toBe('if(c)[y1 y2 | n1 n2]');
      const engine = rulesEngine();
      const band = regionOf(engine, (r) => r.kind === 'head' && r.blockId === id('c'));
      expect(pointedAt(engine, band)).toMatchObject({ kind: 'block', block: id('c') });
    }),
    cell('분기들', () => {
      expect(innerOf(rulesEngine(), 'c')).toEqual(['y1 y2', 'n1 n2']);
    }),
    cell('분기마다 따로 접힌다', async () => {
      const engine = rulesEngine();
      await folded(engine, select.block('c'));
      expect(shownIds(engine)).toEqual(expect.arrayContaining([rowId(id('ry')), rowId(id('rn'))]));
    }),
    cell('할 수 있다', () => editsInside('y1')),
  ],
  분기: [
    cell('분기 라벨(병렬 처리는 위 띠에서 그 분기 바로 위의 구간)', async () => {
      expect(await copied(select.label('ry'))).toBe('y1 y2');
      for (const branch of ['ry', 'p2r']) {
        const engine = rulesEngine();
        const box = regionOf(engine, (r) => r.kind === 'branchLabel' && r.branchId === id(branch));
        expect(pointedAt(engine, box)).toMatchObject({
          kind: 'branchLabel',
          branch: id(branch),
        });
      }
    }),
    cell('그 분기의 블록', () => {
      const engine = rulesEngine();
      expect(press(engine, select.label('ry'), 'ArrowDown')).toBe('y1');
    }),
    cell('접힌 줄', async () => {
      const engine = rulesEngine();
      await folded(engine, select.label('ry'));
      expect(shownIds(engine)).toContain(rowId(id('ry')));
      expect(shownIds(engine)).not.toContain(id('y1'));
    }),
    cell('할 수 있다', () => editsInside('n1')),
  ],
  '접기 영역': [
    cell('이름 띠(펴졌을 때), 접힌 칸(접혔을 때)', async () => {
      const engine = rulesEngine();
      const open = regionOf(engine, (r) => r.kind === 'fold' && r.foldId === id('F'));
      expect(pointedAt(engine, open)).toMatchObject({ block: id('F'), isHead: true });
      await folded(engine, select.fold('F'));
      const cellBox = regionOf(engine, (r) => r.kind === 'fold' && r.foldId === id('F'));
      expect(pointedAt(engine, cellBox)).toMatchObject({ block: id('F'), isHead: false });
      expect(await copied(select.fold('F'))).toBe('<F: f1 f2>');
    }),
    cell('묶은 블록 범위', () => {
      const engine = rulesEngine();
      expect(
        selectedBlocks(engine.session.index(), { kind: 'fold', fold: id('F') }).map(nameOf),
      ).toEqual(['f1', 'f2']);
    }),
    cell('접힌 칸에 이름이 보인다', async () => {
      const engine = rulesEngine();
      await folded(engine, select.fold('F'));
      expect(JSON.stringify(engine.session.rendering.scene)).toContain('"region"');
      expect(shownIds(engine)).not.toContain(id('f1'));
    }),
    cell('할 수 있다', () => editsInside('f1')),
  ],
  '펴 보인 호출 블록': [
    cell('띠(호출 블록 자신)', () => {
      const engine = rulesEngine();
      const box = regionOf(engine, (r) => r.kind === 'peekBand' && r.blockId === id('q'));
      expect(pointedAt(engine, box)).toMatchObject({ kind: 'block', block: id('q') });
    }),
    cell('호출하는 Method의 블록', () => {
      expect(shownIds(rulesEngine())).toEqual(
        expect.arrayContaining([`${id('q')}/${id('h1')}`, `${id('q')}/${id('hw')}`]),
      );
    }),
    cell('호출 블록', async () => {
      const engine = rulesEngine();
      await folded(engine, select.block('q'));
      expect(shownIds(engine)).toContain(id('q'));
      expect(shownIds(engine)).not.toContain(`${id('q')}/${id('h1')}`);
    }),
    cell('안의 블록은 읽기 전용이다(C5)', () =>
      refusesAll(select.peek('h1'), 'edit.delete', 'edit.cut', 'edit.text'),
    ),
  ],
};

/** T1: the representative is the whole container; beside it is outside, beside inner inside. */
async function representative(): Promise<void> {
  expect(await copied(select.label('ry'))).toBe('y1 y2');
  expect(await copied(select.fold('F'))).toBe('<F: f1 f2>');
  expect(await copied(select.block('w'))).toBe('while(w)[w1 w2]');
  const beside = await after(select.fold('F'), 'block.insert.process');
  expect(bodyOf(beside)).toContain('<F: f1 f2> ∅ z');
  const inside = await after(select.block('f2'), 'block.insert.process');
  expect(bodyOf(inside)).toContain('<F: f1 f2 ∅> z');
  const loop = await after(select.block('w'), 'block.insert.process');
  expect(bodyOf(loop)).toContain('while(w)[w1 w2] ∅ if');
  const body = await after(select.block('w2'), 'block.insert.process');
  expect(bodyOf(body)).toContain('while(w)[w1 w2 ∅] if');
}

/** T2: a folded container is selected, moved, copied and deleted like one block. */
async function foldedIsOne(): Promise<void> {
  const engine = rulesEngine();
  await folded(engine, select.fold('F'));
  expect(press(engine, select.block('z'), 'ArrowUp')).toBe('region F');
  await perform(engine, select.fold('F'), 'edit.move.down');
  expect(bodyOf(engine)).toMatch(/z <F: f1 f2>$/);
  await perform(engine, select.fold('F'), 'edit.copy');
  expect(clipped(engine)).toBe('<F: f1 f2>');
  await perform(engine, select.fold('F'), 'edit.delete');
  expect(bodyOf(engine)).toMatch(/call z$/);
  // A folded row selected is all the blocks of its branch selected.
  const row = rulesEngine();
  await folded(row, select.label('ry'));
  expect(selectionName(row)).toBe('y1 y2');
  await perform(row, select.range('y1', 'y2'), 'edit.copy');
  expect(clipped(row)).toBe('y1 y2');
  // A drag of the folded row or cell is the drop's tests (drop-folds.test.ts).
}

/** T3: the representative is one step; a branch label stops only on the way up. */
function arrows(): void {
  const engine = rulesEngine();
  expect(press(engine, select.block('w1'), 'ArrowUp')).toBe('w');
  expect(press(engine, select.block('w'), 'ArrowDown')).toBe('w1');
  expect(press(engine, select.fold('F'), 'ArrowDown')).toBe('f1');
  expect(press(engine, select.block('f1'), 'ArrowUp')).toBe('region F');
  expect(press(engine, select.block('y1'), 'ArrowUp')).toBe('label ry');
  expect(press(engine, select.block('c'), 'ArrowDown')).toBe('y1');
}

/** An engine with the name bands off: the unfolded regions are not drawn. */
function bandless(): TestEngine {
  const engine = rulesEngine();
  engine.run('view.bands');
  return engine;
}

/** T4: a region without a name band is not there for keys, moves and drops. */
async function invisible(): Promise<void> {
  const keys = bandless();
  // Up from `f1` goes on into the opened call above, with no stop for the region.
  expect(press(keys, select.block('f1'), 'ArrowUp')).toBe('peek h4');
  expect(press(keys, select.block('z'), 'ArrowUp')).toBe('f2');
  const moved = bandless();
  await perform(moved, select.block('z'), 'edit.move.up');
  expect(bodyOf(moved)).toContain('call <F: f1 z f2>');
  const drop = bandless();
  const drawn = layout(drop.session.state.doc);
  const box = drawn.boxes.get(id('f1'));
  const found = findDrop(
    drawn,
    drop.session.index(),
    { x: (box?.x ?? 0) + 5, y: (box?.y ?? 0) + 3 },
    { kind: 'new', blockKind: 'process' },
    null,
  );
  expect(found?.action).toMatchObject({ kind: 'insert', to: id('f1'), side: 'before' });
  expect(found?.action).not.toHaveProperty('outsideFold');
  // Removing the region still works there, and says which one.
  const removed = bandless();
  await perform(removed, select.block('f1'), 'fold.remove');
  expect(bodyOf(removed)).toContain('call f1 f2 z');
  expect(removed.session.chrome().notice?.message).toMatchObject({
    key: 'notice.foldRemoved',
    params: { name: 'region' },
  });
  // Folding still works there.
  const closed = bandless();
  await perform(closed, select.block('f1'), 'view.fold.toggle');
  expect(closed.session.state.doc.view.folded).toContain(id('F'));
}

/** T4's second half: folding there says which region it applied to. */
async function foldingSaysWhere(): Promise<void> {
  const engine = bandless();
  await perform(engine, select.block('f1'), 'view.fold.toggle');
  expect(engine.session.chrome().notice?.message).toMatchObject({
    params: { name: 'region' },
  });
}

const ruleRows: ReadonlyArray<CellCase> = [
  {
    row: 'T1',
    column: '내용',
    doc: '대표 요소를 선택하거나 가리키면 컨테이너 전체다. 대표 요소의 곁(앞 · 뒤)은 컨테이너의 밖이고, 안의 블록의 곁은 컨테이너의 안이다',
    check: representative,
  },
  {
    row: 'T2',
    column: '내용',
    doc: '접힌 컨테이너(접힌 칸, 접힌 줄)는 블록 하나처럼 선택 · 이동 · 복사 · 삭제 · 드래그한다. 접힌 줄을 선택한 것은 그 분기나 본문의 블록을 모두 선택한 것과 같다',
    check: foldedIsOne,
  },
  {
    row: 'T3',
    column: '내용',
    doc: '대표 요소는 방향키에서 한 칸이다. 안의 첫 블록에서 ↑는 대표 요소로, 대표 요소에서 ↓는 안의 첫 블록으로 간다. 분기 라벨은 올라갈 때만 멈춘다',
    check: arrows,
  },
  {
    row: 'T4',
    column: '내용',
    doc: '화면에 보이지 않는 컨테이너(이름 띠를 끈 펴진 접기 영역)는 방향키 · 드롭 · 이동에서 없는 것과 같다. 접기 · 펴기와 접기 영역 풀기는 그 영역에도 적용되고, 적용하면 어디에 적용했는지 알린다',
    check: invisible,
  },
];

const containerCases: ReadonlyArray<CellCase> = Object.entries(containerRows).flatMap(
  ([row, entries]) => entries.map((entry, i) => ({ row, column: columns[i] ?? '', ...entry })),
);
const named = withNames(containerCases);

describe('the table of containers', () => {
  it('T-1716: the table of containers has the rows and columns that are tested', () => {
    expect(tableKeys(containers)).toEqual(caseKeys(containerCases));
  });

  it.each(named)('T-1717: a cell of the containers: $name', async (c) => {
    expect(cellOf(containers, c.row, c.column), 'the cell in the document').toBe(c.doc);
    await c.check?.();
  });
});

describe('the rules T1 ~ T4', () => {
  it('T-1718: the table of container rules has the rules that are tested', () => {
    expect(rules.rows.map((r) => r[0])).toEqual(ruleRows.map((r) => r.row));
  });

  it.each(withNames(ruleRows))('T-1719: a rule of the containers: $row', async (c) => {
    expect(cellOf(rules, c.row, c.column), 'the cell in the document').toBe(c.doc);
    await c.check?.();
  });

  it('T-1720: folding a region that is not drawn says which region it folded', foldingSaysWhere);
});
