// The table of insert positions of the interaction rules ("삽입 위치"), compared with the editor
// cell by cell: insert and paste from the keyboard, and a drop on the same element where the
// element can be pointed at (03-editor 3.5).
import type { Box, LayoutResult, NewBlockKind } from '@ariadne-nsd/core';
import { layout } from '@ariadne-nsd/core';
import { describe, expect, it } from 'vitest';

import { runDrop } from '../commands/drop-command';
import type { TestEngine } from '../engine-test-support';
import { betweenBand, findDrop } from '../input/drop';
import type { DragSource } from '../input/drop';
import { screenIdIn } from '../model/shown-index';
import {
  after,
  bodyOf,
  id,
  outlineOf,
  pasted,
  refusesAll,
  rulesEngine,
  select,
} from './rules-fixture';
import type { Selector } from './rules-fixture';
import { caseKeys, cellOf, ruleTable, tableKeys, withNames } from './rules-table';
import type { CellCase } from './rules-table';

const positions = ruleTable('### 삽입 위치', ['선택하거나 가리킨 요소']);

const AFTER = '뒤(아래 · 오른쪽)';
const BEFORE = '앞(위 · 왼쪽)';

type Point = { readonly x: number; readonly y: number };

const newBlock = (blockKind: NewBlockKind): DragSource => ({ kind: 'new', blockKind });

/** Drops a new block at a point of the drawing. Returns whether something can be dropped. */
function dropAt(
  engine: TestEngine,
  at: (drawn: LayoutResult) => Point,
  kind: NewBlockKind = 'process',
): boolean {
  const drawn = layout(engine.session.state.doc);
  const drop = findDrop(drawn, engine.session.index(), at(drawn), newBlock(kind), null);
  if (drop === null) {
    return false;
  }
  // A process block dropped on an empty block changes nothing: the empty block stays.
  runDrop(engine.session, drop.action);
  return true;
}

const boxOf = (drawn: LayoutResult, screen: string): Box => {
  const box = drawn.boxes.get(screen);
  if (box === undefined) {
    throw new Error(`no box ${screen}`);
  }
  return box;
};

/** A point 3px inside the top or the bottom edge of a box. */
const edgeOf = (box: Box, edge: 'top' | 'bottom'): Point => ({
  x: box.x + box.width / 2,
  y: edge === 'top' ? box.y + 3 : box.y + box.height - 3,
});

const center = (box: Box): Point => ({ x: box.x + box.width / 2, y: box.y + box.height / 2 });

const onBlock =
  (name: string, edge: 'top' | 'bottom') =>
  (drawn: LayoutResult): Point =>
    edgeOf(boxOf(drawn, id(name)), edge);

/** The region of the drawing of one kind that belongs to a block. */
const onRegion =
  (kind: 'missingDefault' | 'peekBand', block: string) =>
  (drawn: LayoutResult): Point => {
    const found = drawn.regions.find((r) => r.kind === kind && r.blockId === id(block));
    if (found === undefined) {
      throw new Error(`no ${kind} of ${block}`);
    }
    return center(found.box);
  };

const INSERT = { after: 'block.insert', before: 'block.insertBefore' } as const;
type Way = keyof typeof INSERT;
const PASTE = { after: 'edit.paste', before: 'edit.pasteBefore' } as const;

/** The body of `main()` after an insert from the keyboard. */
const inserted = async (selector: Selector, way: Way, kind = 'process'): Promise<string> =>
  bodyOf(await after(selector, `${INSERT[way]}.${kind}`));

/** The body of `main()` after pasting the block `a`. */
const pastedA = async (selector: Selector, way: Way): Promise<string> =>
  bodyOf(await pasted(select.block('a'), selector, PASTE[way]));

/** The body of `main()` after dropping a new block. */
function dropped(at: (drawn: LayoutResult) => Point, kind: NewBlockKind = 'process'): string {
  const engine = rulesEngine();
  expect(dropAt(engine, at, kind)).toBe(true);
  return bodyOf(engine);
}

const REGION = '<F: f1 f2>';

/** An element next to which a new block goes into the line: after it, or before it. */
async function nextToBlock(way: Way): Promise<void> {
  const expected = way === 'after' ? 'call <F: f1 f2> z ∅' : 'call <F: f1 f2> ∅ z';
  expect(await inserted(select.block('z'), way)).toContain(expected);
  // A range: the new block goes next to its end on that side.
  const range = select.range('a', 'w');
  expect(await inserted(range, way)).toContain(
    way === 'after' ? 'while(w)[w1 w2] ∅ if' : '∅ a while(w)',
  );
  // The first and last block of a fold region: the new block joins the region.
  const edge = way === 'after' ? 'f2' : 'f1';
  const joined = way === 'after' ? '<F: f1 f2 ∅> z' : '<F: ∅ f1 f2> z';
  expect(await inserted(select.block(edge), way)).toContain(joined);
  expect(await pastedA(select.block(edge), way)).toContain(joined.replace('∅', 'a'));
  // A drop: next to a block, and at the region's own end (the inside end of its frame).
  expect(dropped(onBlock('a', way === 'after' ? 'bottom' : 'top'))).toContain(
    way === 'after' ? 'a ∅ while' : '∅ a while',
  );
  const atEdge =
    way === 'after'
      ? (drawn: LayoutResult): Point => {
          const frame = boxOf(drawn, id('F'));
          return { x: frame.x + frame.width / 2, y: frame.y + frame.height - betweenBand - 3 };
        }
      : onBlock('f1', 'top');
  expect(dropped(atEdge)).toContain(joined);
}

/** On an empty block: a control block and a paste take its place, a process goes next to it. */
async function onEmpty(way: Way): Promise<void> {
  const third = async (selector: Selector, command: string): Promise<string> =>
    bodyOf(await after(selector, command), 'd3');
  const empty = select.block('e');
  expect(await third(empty, `${INSERT[way]}.while`)).toBe('o1 while()[∅]');
  expect(await third(empty, `${INSERT[way]}.process`)).toBe('o1 ∅ ∅');
  expect(bodyOf(await pasted(select.block('a'), empty, PASTE[way]), 'd3')).toBe('o1 a');
  for (const kind of ['process', 'while'] as const) {
    const engine = rulesEngine();
    expect(dropAt(engine, (drawn) => center(boxOf(drawn, id('e'))), kind)).toBe(true);
    expect(bodyOf(engine, 'd3')).toBe(kind === 'process' ? 'o1 ∅' : 'o1 while()[∅]');
  }
}

const branches = (engine: TestEngine): string => outlineOf(engine, 'k');

/** On a branch label: a new branch on that side, holding a process block or what is pasted. */
async function besideBranch(way: Way): Promise<void> {
  const made = (holding: string): RegExp => {
    const added = `[^|]*: ${holding}`;
    const first = '1: k1 k2';
    const parts = way === 'after' ? [first, added] : [added, first];
    return new RegExp(`^case\\(k\\)\\[${parts.join(' \\| ')} \\| 2: k3 k4\\]$`);
  };
  const label = select.label('k1r');
  expect(branches(await after(label, `${INSERT[way]}.process`))).toMatch(made('∅'));
  expect(branches(await pasted(select.block('a'), label, PASTE[way]))).toMatch(made('a'));
  // If becomes a Case, and the status bar says so.
  const converted = await after(select.label('ry'), `${INSERT[way]}.process`);
  expect(outlineOf(converted, 'c')).toMatch(/^case\(c\)/);
  expect(converted.session.chrome().notice).not.toBeNull();
}

type Entry = Pick<CellCase, 'doc' | 'check'>;
const cell = (doc: string, check: () => void | Promise<void>): Entry => ({ doc, check });

const rows: Readonly<Record<string, readonly [after: Entry, before: Entry]>> = {
  '블록(하나, 연속 범위)': [
    cell('바로 아래, 같은 줄. 접기 영역의 끝 블록이면 그 영역 안', () => nextToBlock('after')),
    cell('바로 위. 접기 영역의 처음 블록이면 그 영역 안', () => nextToBlock('before')),
  ],
  '빈 블록': [
    cell(
      '제어 블록 삽입 · 붙여넣기 · 드롭은 빈 블록을 교체한다. 처리 삽입은 다른 블록처럼 아래에 삽입한다',
      () => onEmpty('after'),
    ),
    cell('같다(처리 삽입은 위에)', () => onEmpty('before')),
  ],
  '분기 라벨': [
    {
      // The document still has the words from before BL3: they change at the cleanup.
      doc: '그 분기의 오른쪽에 새 분기(처리 삽입은 빈 블록 하나를, 붙여넣기는 붙인 블록을 담는다). default 분기의 오른쪽이면 그 왼쪽에 놓고 알린다. If는 Case로 바꾸고 알린다. 처리가 아닌 블록의 삽입은 거절한다',
      check: async () => {
        await besideBranch('after');
        const atDefault = await after(select.label('gd'), 'block.insert.process');
        expect(outlineOf(atDefault, 'kd')).toMatch(/\| [^|]*: ∅ \| default: gd1\]$/);
        expect(atDefault.session.chrome().notice).not.toBeNull();
        const loop = await after(select.label('k1r'), 'block.insert.while');
        expect(branches(loop)).toMatch(/\| [^|]*: while\(\)\[∅\] \| 2: k3 k4\]$/);
      },
    },
    cell('그 분기의 왼쪽에 새 분기', () => besideBranch('before')),
  ],
  '접기 영역(이름 띠 · 접힌 칸)': [
    cell('영역 밖의 아래', async () => {
      const fold = select.fold('F');
      expect(await inserted(fold, 'after')).toContain(`${REGION} ∅ z`);
      expect(await pastedA(fold, 'after')).toContain(`${REGION} a z`);
      // A drop on the bottom band inside the region's box goes after it, outside it.
      expect(dropped((drawn) => edgeOf(boxOf(drawn, id('F')), 'bottom'))).toContain(
        `${REGION} ∅ z`,
      );
    }),
    cell('영역 밖의 위', async () => {
      const fold = select.fold('F');
      expect(await inserted(fold, 'before')).toContain(`∅ ${REGION} z`);
      expect(await pastedA(fold, 'before')).toContain(`a ${REGION} z`);
      expect(dropped((drawn) => edgeOf(boxOf(drawn, id('F')), 'top'))).toContain(`∅ ${REGION} z`);
    }),
  ],
  헤더: [
    cell('본문의 맨 앞', async () => {
      const head = select.head('d1');
      expect(await inserted(head, 'after')).toMatch(/^∅ a /);
      expect(await pastedA(head, 'after')).toMatch(/^a a /);
      // A drop on the bottom band inside the header.
      expect(
        dropped((drawn) => {
          const diagram = drawn.diagrams.find((d) => d.id === 'd1');
          const body = diagram?.body ?? { x: 0, y: 0, width: 0, height: 0 };
          return { x: body.x + body.width / 2, y: body.y - 3 };
        }),
      ).toMatch(/^∅ a /);
    }),
    cell('거절한다', async () => {
      await refusesAll(select.head('d1'), 'block.insertBefore.process');
      const engine = await pasted(select.block('a'), select.head('d1'), 'edit.pasteBefore');
      expect(bodyOf(engine)).toMatch(/^a while/);
    }),
  ],
  '빈 default 칸': [
    cell('default 분기를 만들고 그 안에', async () => {
      const missing = select.missing('k');
      expect(await inserted(missing, 'after')).toContain('| default: ∅]');
      expect(await pastedA(missing, 'after')).toContain('| default: a]');
      expect(dropped(onRegion('missingDefault', 'k'))).toContain('| default: ∅]');
    }),
    cell('같다', async () => {
      const missing = select.missing('k');
      expect(await inserted(missing, 'before')).toContain('| default: ∅]');
      expect(await pastedA(missing, 'before')).toContain('| default: a]');
    }),
  ],
  '선택 없음': [
    cell('지금 다이어그램의 맨 끝', async () => {
      expect(await inserted(select.none(), 'after')).toMatch(/ z ∅$/);
      expect(await pastedA(select.none(), 'after')).toMatch(/ z a$/);
    }),
    cell('같다', async () => {
      expect(await inserted(select.none(), 'before')).toMatch(/ z ∅$/);
      expect(await pastedA(select.none(), 'before')).toMatch(/ z a$/);
    }),
  ],
  '펴 보인 블록': [
    cell('거절한다(C5)', async () => {
      await refusesAll(select.peek('h1'), 'block.insert.process', 'edit.paste');
      const engine = rulesEngine();
      expect(dropAt(engine, (drawn) => center(boxOf(drawn, screenIdIn([id('q')], id('h1')))))).toBe(
        false,
      );
    }),
    cell('거절한다', () =>
      refusesAll(select.peek('h1'), 'block.insertBefore.process', 'edit.pasteBefore'),
    ),
  ],
};

const cases: ReadonlyArray<CellCase> = Object.entries(rows).flatMap(([row, [below, above]]) => [
  { row, column: AFTER, ...below },
  { row, column: BEFORE, ...above },
]);
const named = withNames(cases);

const run = async (c: CellCase): Promise<void> => {
  expect(cellOf(positions, c.row, c.column), 'the cell in the document').toBe(c.doc);
  await c.check?.();
};

describe('the table of insert positions', () => {
  it('T-1703: the table of insert positions has the rows and columns that are tested', () => {
    // The last column says which decision each row comes from.
    expect(tableKeys(positions, ['근거'])).toEqual(caseKeys(cases));
  });

  it.each(named)('T-1704: a cell of the insert positions: $name', run);
});
