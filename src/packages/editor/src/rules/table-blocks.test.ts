// The table of block kinds of the interaction rules ("블록 종류"), compared with the editor cell
// by cell: what each kind holds, its text, its branches, wrapping, what happens right after it
// is inserted, and unwrapping (03-editor 3.5).
import type { Block } from '@ariadne-nsd/core';
import { describe, expect, it } from 'vitest';

import { testEngine } from '../engine-test-support';
import type { TestEngine } from '../engine-test-support';
import { childSeqs, indexDoc, isBranching, isControl } from '../model/doc-index';
import { selectBlock } from '../state/selection';
import { around, blockOf, localCall, namedCall } from './rules-blocks';
import type { KindUnderTest } from './rules-blocks';
import { noticeKey, perform, refused, seqOutline } from './rules-fixture';
import type { Selector } from './rules-fixture';
import { caseKeys, cellOf, ruleTable, split, tableKeys } from './rules-table';
import type { CellCase } from './rules-table';

const kinds = ruleTable('### 블록 종류', ['종류', '분류']);

const columns = [
  '분류',
  '텍스트',
  '분기의 규칙',
  '감싸면 선택한 블록이 들어가는 곳',
  '새로 삽입한 직후',
  '풀면',
] as const;

const x: Selector = (engine) => selectBlock(indexDoc(engine.content()), 'x');
const label =
  (branch: string): Selector =>
  () => ({ kind: 'branchLabel', branch });

const engineOn = (block: Block): TestEngine => testEngine(around(block));

const blockIn = (engine: TestEngine, id = 'x'): Block => {
  const found = engine.session.index().blocks.get(id)?.block;
  if (found === undefined) {
    throw new Error(`no block ${id}`);
  }
  return found;
};

/** The first diagram's body in words. */
const bodyWords = (engine: TestEngine): string =>
  seqOutline(engine.content().diagrams[0]?.body ?? { blocks: [], folds: [] });

const field = (engine: TestEngine): unknown => engine.session.state.editing?.field;

/** The block the command made: the one that is selected afterwards. */
const madeBlock = (engine: TestEngine): Block => {
  const selection = engine.session.state.selection;
  return blockIn(engine, selection?.kind === 'blocks' ? selection.focus : '');
};

/** Wrapping the block `p0` in the kind: what the lines of the new block hold. */
async function wrapped(kind: string): Promise<ReadonlyArray<string>> {
  const engine = engineOn(blockOf.process);
  await perform(engine, () => selectBlock(indexDoc(engine.content()), 'p0'), `block.wrap.${kind}`);
  const made = engine.content().diagrams[0]?.body.blocks[0];
  return made === undefined ? [] : childSeqs(made).map((child) => seqOutline(child.seq));
}

/** A process, exit or call block cannot be wrapped around anything: there is no command. */
const cannotWrap = (kind: string): void => {
  expect(testEngine(around(blockOf.process)).registry.has(`block.wrap.${kind}`)).toBe(false);
};

async function holdsNothing(kind: KindUnderTest): Promise<void> {
  expect(isControl(blockOf[kind])).toBe(false);
  expect(childSeqs(blockOf[kind])).toEqual([]);
  await Promise.resolve();
}

async function textIsEdited(block: Block): Promise<void> {
  const engine = engineOn(block);
  await perform(engine, x, 'edit.text');
  expect(field(engine)).toEqual({ kind: 'block', block: 'x' });
}

/** Right after inserting the kind below `p0`: the new block, and the field that is open. */
async function justInserted(kind: string): Promise<TestEngine> {
  const engine = engineOn(blockOf.process);
  await perform(
    engine,
    () => selectBlock(indexDoc(engine.content()), 'p0'),
    `block.insert.${kind}`,
  );
  return engine;
}

async function opensText(kind: string): Promise<void> {
  const engine = await justInserted(kind);
  const made = madeBlock(engine);
  expect(made.kind).toBe(kind);
  expect(field(engine)).toEqual({ kind: 'block', block: made.id });
}

/** Unwrapping `x`: the first diagram afterwards. */
async function unwrapped(block: Block): Promise<string> {
  const engine = engineOn(block);
  await perform(engine, x, 'block.unwrap');
  return bodyWords(engine);
}

/** Inserting a call: picks the item of the list, then returns the field that opens. */
async function insertedCall(title: string): Promise<unknown> {
  const engine = engineOn(blockOf.process);
  engine.select(selectBlock(indexDoc(engine.content()), 'p0'));
  engine.run('block.insert.call');
  const items = engine.picker()?.items ?? [];
  engine.picker()?.choose(items.findIndex((item) => item.title === title));
  await engine.settle();
  const open = engine.session.state.editing?.field;
  return open?.kind === 'call' ? open.part : open;
}

type Entry = Pick<CellCase, 'doc' | 'check' | 'pending'>;
type Row = readonly [
  group: Entry,
  text: Entry,
  branches: Entry,
  wrapping: Entry,
  inserted: Entry,
  unwrapping: Entry,
];

const cell = (doc: string, check?: () => void | Promise<void>): Entry =>
  check === undefined ? { doc } : { doc, check };

const loops = ['while', 'for', 'doWhile'] as const;
const forEach = async <T>(
  items: ReadonlyArray<T>,
  check: (item: T) => Promise<void> | void,
): Promise<void> => {
  for (const item of items) {
    await check(item);
  }
};

const isLoop = (block: Block): boolean => {
  const [only, ...rest] = childSeqs(block);
  return rest.length === 0 && only?.branch === null;
};

const rows: Readonly<Record<string, Row>> = {
  처리: [
    cell('안에 블록이 없다', () => holdsNothing('process')),
    cell('텍스트', () => textIsEdited(blockOf.process)),
    cell('—'),
    cell('감쌀 수 없다', () => {
      cannotWrap('process');
    }),
    cell('텍스트의 인라인 에디터를 연다', () => opensText('process')),
    cell('—'),
  ],
  탈출: [
    cell('안에 블록이 없다', () => holdsNothing('exit')),
    cell('텍스트', () => textIsEdited(blockOf.exit)),
    cell('—'),
    cell('감쌀 수 없다', () => {
      cannotWrap('exit');
    }),
    cell('텍스트의 인라인 에디터를 연다', () => opensText('exit')),
    cell('—'),
  ],
  'While · For · Do-While': [
    cell('반복 블록', () => {
      for (const kind of loops) {
        expect(isLoop(blockOf[kind]), kind).toBe(true);
      }
    }),
    cell('조건', () => forEach(loops, (kind) => textIsEdited(blockOf[kind]))),
    cell('—'),
    cell('본문', () =>
      forEach(loops, async (kind) => {
        expect(await wrapped(kind), kind).toEqual(['before']);
      }),
    ),
    cell('조건의 인라인 에디터를 연다', () => forEach(loops, opensText)),
    cell('본문의 블록이 남는다', () =>
      forEach(loops, async (kind) => {
        expect(await unwrapped(blockOf[kind]), kind).toBe('before i1 i2 after');
      }),
    ),
  ],
  '무한 반복': [
    cell('반복 블록', () => {
      expect(isLoop(blockOf.endless)).toBe(true);
    }),
    cell('없다', async () => {
      await refused(engineOn(blockOf.endless), x, 'edit.text');
    }),
    cell('—'),
    cell('본문', async () => {
      expect(await wrapped('endless')).toEqual(['before']);
    }),
    cell('선택만 한다', async () => {
      const engine = await justInserted('endless');
      expect(madeBlock(engine).kind).toBe('endless');
      expect(field(engine)).toBeUndefined();
    }),
    cell('본문의 블록이 남는다', async () => {
      expect(await unwrapped(blockOf.endless)).toBe('before i1 i2 after');
    }),
  ],
  If: [
    cell('분기 블록', () => {
      expect(isBranching(blockOf.if)).toBe(true);
    }),
    cell('조건', () => textIsEdited(blockOf.if)),
    cell('분기는 참 · 거짓 둘이다. 분기를 삽입하면 Case로 바꾼다', async () => {
      expect(childSeqs(blockOf.if)).toHaveLength(2);
      const engine = engineOn(blockOf.if);
      await perform(engine, label('r1'), 'branch.insert');
      expect(blockIn(engine).kind).toBe('case');
    }),
    cell('참 분기(거짓 분기는 빈 블록)', async () => {
      expect(await wrapped('if')).toEqual(['before', '∅']);
    }),
    cell('조건의 인라인 에디터를 연다', () => opensText('if')),
    cell('내용이 있는 분기를 순서대로 이어 붙인다', async () => {
      expect(await unwrapped(blockOf.if)).toBe('before i1 i2 after');
    }),
  ],
  Case: [
    cell('분기 블록', () => {
      expect(isBranching(blockOf.case)).toBe(true);
    }),
    cell('조건', () => textIsEdited(blockOf.case)),
    cell(
      'default가 아닌 분기 하나 이상과 default. default는 항상 맨 오른쪽이고 삭제할 수 없다',
      async () => {
        const engine = engineOn(blockOf.case);
        // The only branch besides the default stays, and so does the default.
        await refused(engine, label('r1'), 'branch.delete');
        await refused(engine, label('r2'), 'branch.delete');
        await refused(engine, label('r2'), 'edit.move.left');
        await refused(engine, label('r1'), 'edit.move.right');
        // A branch inserted on the right of the default goes to its left.
        await perform(engine, label('r2'), 'branch.insert');
        const made = blockIn(engine);
        expect(made.kind === 'case' ? [made.arms.length, made.otherwise?.id] : []).toEqual([
          2,
          'r2',
        ]);
      },
    ),
    cell('첫 분기(다른 분기는 빈 블록)', async () => {
      expect(await wrapped('case')).toEqual(['before', '∅', '∅']);
    }),
    cell('조건의 인라인 에디터를 연다', () => opensText('case')),
    cell('내용이 있는 분기를 순서대로 이어 붙인다', async () => {
      expect(await unwrapped(blockOf.case)).toBe('before i1 i2 after');
    }),
  ],
  '병렬 처리': [
    cell('분기 블록', () => {
      expect(isBranching(blockOf.parallel)).toBe(true);
    }),
    cell('위 띠의 텍스트(비울 수 있다)', async () => {
      await textIsEdited(blockOf.parallel);
      const engine = engineOn(blockOf.parallel);
      await perform(engine, x, 'edit.text');
      engine.session.commitEditing('');
      const made = blockIn(engine);
      expect(made.kind === 'parallel' ? made.text : null).toBe('');
    }),
    cell('분기는 둘 이상이고 라벨이 없다', async () => {
      const engine = engineOn(blockOf.parallel);
      await refused(engine, label('r1'), 'branch.delete');
      await refused(engine, label('r1'), 'edit.text');
      await perform(engine, label('r1'), 'branch.insert');
      expect(childSeqs(blockIn(engine))).toHaveLength(3);
      expect(field(engine)).toBeUndefined();
    }),
    cell('첫 분기(둘째 분기는 빈 블록)', async () => {
      expect(await wrapped('parallel')).toEqual(['before', '∅']);
    }),
    cell('위 띠 텍스트의 인라인 에디터를 연다', () => opensText('parallel')),
    cell('내용이 있는 분기를 순서대로 이어 붙인다', async () => {
      expect(await unwrapped(blockOf.parallel)).toBe('before i1 i2 after');
    }),
  ],
  호출: [
    cell('안에 블록이 없다(펴 보면 Method의 블록이 보인다)', async () => {
      await holdsNothing('call');
      const engine = engineOn(blockOf.call);
      await perform(engine, x, 'view.fold.toggle');
      expect(engine.session.state.doc.view.opened).toEqual([['x']]);
      expect([...engine.session.shown().index.blocks.keys()]).toContain('x/m1');
    }),
    cell('인자 · 결과. 이름을 입력하는 호출 블록은 이름도', () => {
      const parts = (block: Block): ReadonlyArray<string> => {
        const engine = engineOn(block);
        return engine.session.callParts(blockIn(engine));
      };
      expect(parts(localCall('d3', 'n'))).toEqual(['args', 'result']);
      expect(parts(namedCall)).toEqual(['args', 'result', 'name']);
    }),
    cell('—'),
    cell('감쌀 수 없다', () => {
      cannotWrap('call');
    }),
    cell(
      '인자의 인라인 에디터를 연다(받는 것이 없는 Method를 호출하면 결과, 이름을 입력하는 호출 블록은 이름)',
      async () => {
        expect(await insertedCall('takes(n)')).toBe('args');
        expect(await insertedCall('plain')).toBe('result');
        expect(await insertedCall('picker.namedCall')).toBe('name');
      },
    ),
    cell('호출하는 Method의 블록으로 바뀐다(이름을 입력하는 호출 블록은 풀 수 없다)', async () => {
      expect(await unwrapped(blockOf.call)).toBe('before m1 m2 after');
      const engine = engineOn(namedCall);
      await refused(engine, x, 'block.unwrap');
      expect(noticeKey(engine)).toBe('reason.notCallable');
    }),
  ],
};

const cases: ReadonlyArray<CellCase> = Object.entries(rows).flatMap(([row, entries]) =>
  entries.map((entry, i) => ({ row, column: columns[i] ?? '', ...entry })),
);
const { active } = split(cases);

describe('the table of block kinds', () => {
  it('T-1706: the table of block kinds has the rows and columns that are tested', () => {
    expect(tableKeys(kinds)).toEqual(caseKeys(cases));
  });

  it.each(active)('T-1707: a cell of the block kinds: $name', async (c) => {
    expect(cellOf(kinds, c.row, c.column), 'the cell in the document').toBe(c.doc);
    await c.check?.();
  });
});
