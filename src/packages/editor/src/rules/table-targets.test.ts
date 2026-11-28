// The two tables of command targets of the interaction rules ("명령마다 받는 대상"), compared
// with the editor: the containers around each selection, nearest first (table 1), and what each
// command takes and whether it goes up the containers (table 2). One test per cell
// (03-editor 3.5).
import type { Content, Seq } from '@ariadne-nsd/core';
import { describe, expect, it } from 'vitest';

import { clipFromJson, diagramFromJson } from '../clipboard/clip-format';
import { foldTargets, regionToRemove } from '../commands/fold-commands';
import { unwrapHolder } from '../commands/command-helpers';
import { arm, branch, caseBlock, contentOf, ifBlock, proc } from '../engine-test-support';
import { testEngine, whileBlock } from '../engine-test-support';
import type { TestEngine } from '../engine-test-support';
import type { Selection } from '../state/selection';
import {
  after,
  bodyOf,
  diagramNames,
  foldedNames,
  noticeKey,
  outlineOf,
  perform,
  refused,
  refusesAll,
  rulesEngine,
  select,
  seqOutline,
  call,
  body,
} from './rules-fixture';
import type { Selector } from './rules-fixture';
import { caseKeys, cellOf, ruleTable, tableKeys, withNames } from './rules-table';
import type { CellCase } from './rules-table';

const chains = ruleTable('### 명령마다 받는 대상', ['선택한 요소', '사슬']);
const targets = ruleTable('### 명령마다 받는 대상', ['명령', '받는 대상']);

// Table 1.

/**
 * A loop `w1` holding the region `F2`, which holds the region `F1` (the If alone) and a block
 * `s`; the If's true branch holds two blocks. In the loop's body a Case without a default too.
 * The Method `d2` has a loop `hw`, called by `q` (shown opened).
 */
const nested: Content = {
  settings: contentOf().settings,
  diagrams: [
    {
      id: 'd1',
      head: { kind: 'method', text: 'main()' },
      body: body([
        {
          id: 'w1',
          kind: 'while',
          text: 'w1',
          body: body(
            [
              ifBlock('if1', branch('ry', [proc('y1'), proc('y2')]), branch('rn', [proc('n1')])),
              proc('s'),
              caseBlock('k', [arm('k1r', '1', [proc('k1'), proc('k2')])], null),
              call('q', 'd2'),
            ],
            [
              { id: 'F1', first: 'if1', last: 'if1' },
              { id: 'F2', first: 'if1', last: 's' },
            ],
          ),
        },
      ]),
    },
    {
      id: 'd2',
      head: { kind: 'method', text: 'helper' },
      body: body([whileBlock('hw', [proc('h1'), proc('h2')])]),
    },
  ],
};

function nestedEngine(): TestEngine {
  const engine = testEngine(nested);
  const view = engine.session.state.doc.view;
  engine.session.setView({ ...view, opened: [['q']] });
  return engine;
}

/** What folding could act on, nearest first: each target's entries (a call: its path). */
function chain(engine: TestEngine, selection: Selection | null): ReadonlyArray<string> {
  return foldTargets(engine.session.index(), engine.session.state.doc.view, selection).map((t) =>
    t.items
      .map((item) => (item.kind === 'call' ? `open ${item.path.join('/')}` : item.entry))
      .join('+'),
  );
}

const chainOf = (selector: Selector): ReadonlyArray<string> => {
  const engine = nestedEngine();
  return chain(engine, selector(engine));
};

/** The control block "unwrap" takes off for a selection that is not a block range. */
const holderOf = (selector: Selector): string | null => {
  const engine = nestedEngine();
  return unwrapHolder(engine.session.index(), selector(engine));
};

/** The region "remove" acts on, or why none. */
const regionOf = (selector: Selector): unknown => {
  const engine = nestedEngine();
  return regionToRemove(engine.session.index(), selector(engine));
};

/** The nearest control block of a block range: unwrap takes it off, leaving this. */
async function unwraps(selector: Selector): Promise<ReadonlyArray<string>> {
  const engine = nestedEngine();
  await perform(engine, selector, 'block.unwrap');
  return [...engine.session.index().blocks.keys()];
}

const blockIn =
  (id: string): Selector =>
  (engine) => ({
    kind: 'blocks',
    seq: { owner: engine.session.index().blocks.get(id)?.owner ?? '', slot: 'body' },
    anchor: id,
    focus: id,
  });
const rawLabel =
  (id: string): Selector =>
  () => ({ kind: 'branchLabel', branch: id });
const rawFold =
  (fold: string): Selector =>
  () => ({ kind: 'fold', fold });
const rawMissing =
  (block: string): Selector =>
  () => ({ kind: 'missingDefault', block });

type Entry = Pick<CellCase, 'doc' | 'check'>;
const cell = (doc: string, check?: () => void | Promise<void>): Entry =>
  check === undefined ? { doc } : { doc, check };

const chainRows: Readonly<Record<string, Entry>> = {
  '블록(하나, 연속 범위, 접힌 줄)': cell(
    '블록 범위 → (하나이고 제어 블록 · 호출 블록이면 그 블록) → 그것을 포함하는 접기 영역(작은 것부터) → 분기 · 본문 → 상위 제어 블록 → … → 다이어그램',
    async () => {
      expect(chainOf(blockIn('y1'))).toEqual(['ry', 'F1', 'F2', 'w1']);
      // One control block alone: its inside first.
      expect(chainOf(blockIn('if1'))).toEqual(['ry', 'F1', 'F2', 'w1']);
      expect(chainOf(blockIn('w1'))).toEqual(['w1']);
      // A call block alone: opening it comes first.
      expect(chainOf(blockIn('q'))[0]).toBe('open q');
      expect(regionOf(blockIn('y1'))).toEqual({ fold: 'F1' });
      // The nearest control block holding the range goes.
      expect(await unwraps(blockIn('y1'))).not.toContain('if1');
      expect(await unwraps(blockIn('s'))).not.toContain('w1');
    },
  ),
  '분기 라벨': cell('분기 → 그 분기 블록 → …', () => {
    expect(chainOf(rawLabel('ry'))).toEqual(['ry', 'F1', 'F2', 'w1']);
    expect(holderOf(rawLabel('ry'))).toBe('if1');
    expect(regionOf(rawLabel('ry'))).toEqual({ fold: 'F1' });
  }),
  헤더: cell('다이어그램', async () => {
    const head: Selector = () => ({ kind: 'head', diagram: 'd1' });
    expect(chainOf(head)).toEqual([]);
    expect(holderOf(head)).toBeNull();
    await refused(nestedEngine(), head, 'block.unwrap');
  }),
  '접기 영역(이름 띠 · 접힌 칸)': cell(
    '접기 영역 → 그것을 포함하는 접기 영역(작은 것부터) → 분기 · 본문 → 상위 제어 블록 → …',
    () => {
      expect(chainOf(rawFold('F1'))).toEqual(['F1', 'F2', 'w1']);
      expect(holderOf(rawFold('F1'))).toBe('w1');
      expect(regionOf(rawFold('F2'))).toEqual({ fold: 'F2' });
    },
  ),
  '빈 default 칸': cell('그 Case → …', () => {
    expect(chainOf(rawMissing('k'))).toEqual(chainOf(blockIn('k')));
    expect(chainOf(rawMissing('k'))).toEqual(['k1r', 'w1']);
    expect(holderOf(rawMissing('k'))).toBe('k');
  }),
  '펴 보인 블록': cell(
    '펴 보인 범위 → 그 위치의 접기 영역 → 그 위치의 분기 · 본문 → … → 펴 보인 호출 블록',
    async () => {
      const engine = nestedEngine();
      const peek: Selector = () => ({ kind: 'peek', path: ['q'], anchor: 'h1', focus: 'h1' });
      await perform(engine, peek, 'fold.make');
      engine.session.cancelEditing();
      const made = engine.session.index().blocks.get('q')?.block;
      const fold = made?.kind === 'call' ? (made.siteFolds[0]?.id ?? '') : '';
      // The region just made is folded: unfold it, so the next fold goes on from the blocks.
      const view = engine.session.state.doc.view;
      engine.session.setView({ ...view, folded: view.folded.filter((e) => e !== fold) });
      expect(chain(engine, peek(engine))).toEqual([fold, 'q/hw', 'open q']);
    },
  ),
  '선택 없음': cell('없다', async () => {
    expect(chainOf(select.none())).toEqual([]);
    await refusesAll(select.none(), 'block.unwrap', 'fold.remove', 'view.fold.toggle');
  }),
};

// Table 2.

const clipboardBlocks = (engine: TestEngine): string => {
  const json = engine.clipboard.data.json;
  const clip: Seq | null = json === null ? null : clipFromJson(json);
  return clip === null ? '' : seqOutline(clip);
};

/** Runs the command on each selection and checks it ran: no refusal in the status bar. */
async function takes(command: string, ...selectors: Selector[]): Promise<void> {
  for (const selector of selectors) {
    const engine = rulesEngine();
    await perform(engine, selector, command);
    expect(noticeKey(engine), command).not.toMatch(/^reason\./);
  }
}

const a = select.block('a');
const labelK = select.label('k1r');
const foldF = select.fold('F');
const missingK = select.missing('k');
const peekH = select.peek('h1');
const head = select.head('d1');

type Pair = readonly [accepts: Entry, climbs: Entry];

const targetRows: Readonly<Record<string, Pair>> = {
  '텍스트 편집': [
    cell('요소의 필드(텍스트 필드)', () => takes('edit.text', a, labelK, head, foldF, missingK)),
    cell('아니오', async () => {
      // The default branch has no label; the Case around it is not edited instead.
      await refusesAll(select.label('gd'), 'edit.text');
    }),
  ],
  '삽입 · 붙여넣기': [
    // The places are the table of insert positions.
    cell('삽입 위치(삽입 위치)'),
    cell('해당 없음'),
  ],
  복사: [
    cell('블록 범위, 분기(그 블록 전체), 접기 영역, 다이어그램, 펴 보인 범위', async () => {
      expect(clipboardBlocks(await after(select.range('a', 'w'), 'edit.copy'))).toBe(
        'a while(w)[w1 w2]',
      );
      expect(clipboardBlocks(await after(labelK, 'edit.copy'))).toBe('k1 k2');
      expect(clipboardBlocks(await after(foldF, 'edit.copy'))).toBe('<F: f1 f2>');
      const diagram = await after(head, 'edit.copy');
      expect(diagramFromJson(diagram.clipboard.data.json ?? '')).not.toBeNull();
      expect(clipboardBlocks(await after(select.peek('hw'), 'edit.copy'))).toBe('while(w)[h3 h4]');
    }),
    cell('아니오', () => refusesAll(missingK, 'edit.copy')),
  ],
  잘라내기: [
    cell('복사와 같은 대상을 복사하고 삭제한다(다이어그램은 거절)', async () => {
      const engine = await after(select.range('a', 'w'), 'edit.cut');
      expect(clipboardBlocks(engine)).toBe('a while(w)[w1 w2]');
      expect(bodyOf(engine)).toMatch(/^if\(c\)/);
      const label = await after(labelK, 'edit.cut');
      expect(clipboardBlocks(label)).toBe('k1 k2');
      expect(outlineOf(label, 'k')).toBe('case(k)[2: k3 k4]');
      expect(clipboardBlocks(await after(foldF, 'edit.cut'))).toBe('<F: f1 f2>');
      await refusesAll(head, 'edit.cut');
    }),
    cell('아니오', () => refusesAll(missingK, 'edit.cut')),
  ],
  삭제: [
    cell('블록 범위, 분기, 접기 영역(그 블록 전체). 헤더에서는 헤더만 제거한다', async () => {
      expect(bodyOf(await after(select.range('a', 'w'), 'edit.delete'))).toMatch(/^if\(c\)/);
      expect(outlineOf(await after(labelK, 'edit.delete'), 'k')).toBe('case(k)[2: k3 k4]');
      expect(bodyOf(await after(foldF, 'edit.delete'))).toMatch(/call z$/);
      const headless = await after(select.head('d3'), 'edit.delete');
      expect(diagramNames(headless)).toEqual(['main()', 'helper()', '-']);
    }),
    cell('아니오', () => refusesAll(missingK, 'edit.delete')),
  ],
  '이동(위 · 아래)': [
    cell('블록 범위, 접기 영역, 다이어그램(순서)', async () => {
      expect(bodyOf(await after(select.range('a', 'w'), 'edit.move.down'))).toMatch(/^if\(c\)/);
      expect(bodyOf(await after(foldF, 'edit.move.down'))).toMatch(/z <F: f1 f2>$/);
      expect(diagramNames(await after(head, 'edit.move.down'))[0]).toBe('helper()');
    }),
    cell('아니오', () => refusesAll(labelK, 'edit.move.up', 'edit.move.down')),
  ],
  '이동(왼쪽 · 오른쪽)': [
    cell('분기. 헤더에서는 다이어그램(순서)', async () => {
      expect(outlineOf(await after(labelK, 'edit.move.right'), 'k')).toBe(
        'case(k)[2: k3 k4 | 1: k1 k2]',
      );
      expect(diagramNames(await after(head, 'edit.move.right'))[0]).toBe('helper()');
    }),
    cell('예', async () => {
      expect(outlineOf(await after(select.block('y1'), 'edit.move.right'), 'c')).toBe(
        'if(c)[n1 n2 | y1 y2]',
      );
    }),
  ],
  감싸기: [
    cell('블록 범위, 분기(그 블록 전체), 접기 영역(그 블록 전체)', async () => {
      expect(bodyOf(await after(select.range('a', 'w'), 'block.wrap.while'))).toMatch(
        /^while\(\)\[a while\(w\)\[w1 w2\]\] if/,
      );
      expect(outlineOf(await after(labelK, 'block.wrap.while'), 'k')).toContain(
        '1: while()[k1 k2]',
      );
      expect(bodyOf(await after(foldF, 'block.wrap.while'))).toContain('<F: while()[f1 f2]> z');
    }),
    cell('아니오', () => refusesAll(missingK, 'block.wrap.while')),
  ],
  풀기: [
    cell('제어 블록, 호출 블록', async () => {
      expect(bodyOf(await after(select.block('w'), 'block.unwrap'))).toMatch(/^a w1 w2 if/);
      expect(bodyOf(await after(select.block('q'), 'block.unwrap'))).toContain('] h1 while');
    }),
    cell('예', async () => {
      expect(bodyOf(await after(select.block('y1'), 'block.unwrap'))).toContain('y1 y2 n1 n2 case');
    }),
  ],
  '접기 · 펴기': [
    cell('제어 블록의 안쪽, 분기, 접기 영역, 호출 블록(펴 보기)', async () => {
      const toggled = async (selector: Selector): Promise<ReadonlyArray<string>> =>
        foldedNames(await after(selector, 'view.fold.toggle'));
      expect(await toggled(select.block('c'))).toEqual(['ry', 'rn']);
      expect(await toggled(select.label('ry'))).toEqual(['ry']);
      expect(await toggled(foldF)).toEqual(['F']);
      const closed = await after(select.block('q'), 'view.fold.toggle');
      expect(closed.session.state.doc.view.opened).toEqual([]);
    }),
    cell('예', async () => {
      const engine = await after(select.block('w1'), 'view.fold.toggle');
      expect(foldedNames(engine)).toEqual(['w']);
    }),
  ],
  '접기 영역 풀기': [
    cell('접기 영역', async () => {
      expect(bodyOf(await after(foldF, 'fold.remove'))).toContain('call f1 f2 z');
    }),
    cell('예', async () => {
      expect(bodyOf(await after(select.block('f2'), 'fold.remove'))).toContain('call f1 f2 z');
    }),
  ],
  '접기 영역 만들기': [
    cell('블록 범위(펴 보인 범위는 그 위치의 접기 영역이 된다), 분기(그 블록 전체)', async () => {
      await takes('fold.make', select.range('a', 'w'), peekH, labelK);
      const engine = await after(labelK, 'fold.make');
      expect(outlineOf(engine, 'k')).toContain('<');
    }),
    cell('아니오', async () => {
      await refusesAll(missingK, 'fold.make');
      await refusesAll(foldF, 'fold.make');
    }),
  ],
  '새 Method로 빼기': [
    cell('블록 범위, 분기(그 블록 전체), 접기 영역', async () => {
      await takes('diagram.extractMethod', select.range('a', 'w'), foldF, labelK);
      const engine = await after(labelK, 'diagram.extractMethod');
      expect(diagramNames(engine)).toHaveLength(4);
    }),
    cell('아니오', () => refusesAll(missingK, 'diagram.extractMethod')),
  ],
};

const chainCases: ReadonlyArray<CellCase> = Object.entries(chainRows).map(([row, entry]) => ({
  row,
  column: '사슬',
  ...entry,
}));
const targetCases: ReadonlyArray<CellCase> = Object.entries(targetRows).flatMap(
  ([row, [accepts, climbs]]) => [
    { row, column: '받는 대상', ...accepts },
    { row, column: '상위로 올라가는가', ...climbs },
  ],
);
const chainNamed = withNames(chainCases);
const targetNamed = withNames(targetCases);

describe('table 1: the containers around a selection', () => {
  it('T-1710: table 1 of the command targets has the rows that are tested', () => {
    expect(tableKeys(chains)).toEqual(caseKeys(chainCases));
  });

  it.each(chainNamed)('T-1711: a row of table 1: $name', async (c) => {
    expect(cellOf(chains, c.row, c.column), 'the cell in the document').toBe(c.doc);
    await c.check?.();
  });
});

describe('table 2: what each command takes', () => {
  const run = async (c: CellCase): Promise<void> => {
    expect(cellOf(targets, c.row, c.column), 'the cell in the document').toBe(c.doc);
    await c.check?.();
  };

  it('T-1712: table 2 of the command targets has the rows and columns that are tested', () => {
    expect(tableKeys(targets)).toEqual(caseKeys(targetCases));
  });

  it.each(targetNamed)('T-1713: a cell of table 2: $name', run);
});

/**
 * Tables 1 and 2 say the empty default cell stands for its Case and that "remove region" goes
 * up, so a region holding the Case would go. The matrix says the cell is refused, and so does
 * the editor.
 */
async function missingGoesUp(): Promise<void> {
  const content: Content = {
    ...nested,
    diagrams: [
      {
        id: 'd1',
        head: { kind: 'method', text: 'main()' },
        body: body(
          [caseBlock('k', [arm('k1r', '1', [proc('k1')])], null)],
          [{ id: 'F3', first: 'k', last: 'k' }],
        ),
      },
    ],
  };
  const engine = testEngine(content);
  await perform(engine, rawMissing('k'), 'fold.remove');
  expect(engine.content().diagrams[0]?.body.folds).toEqual([]);
}

describe.skip('tables that differ from each other and from the editor (reported)', () => {
  it('T-1721: remove region on the empty default cell goes up to the region around', missingGoesUp);
});
