// The table of text fields of the interaction rules ("텍스트 필드"), compared with the editor cell
// by cell: whether a field can be edited, what emptying it leaves, and whether it opens right
// after its element is made (03-editor 3.5). The quoted notices are compared with the Korean
// catalog.
import type { Block, Content, Seq } from '@ariadne-nsd/core';
import { describe, expect, it } from 'vitest';

import { arm, caseBlock, proc, testEngine } from '../engine-test-support';
import type { TestEngine } from '../engine-test-support';
import type { MessageKey } from '../i18n/messages';
import { korean } from '../i18n/messages.ko';
import { indexDoc } from '../model/doc-index';
import type { EditField } from '../state/editor-state';
import type { Selection } from '../state/selection';
import { selectBlock } from '../state/selection';
import { around, blockOf, localCall, namedCall } from './rules-blocks';
import { noticeKey, perform, refused } from './rules-fixture';
import { caseKeys, cellOf, ruleTable, split, tableKeys } from './rules-table';
import type { CellCase, Table } from './rules-table';

const read = ruleTable('### 텍스트 필드', ['요소', '필드']);
/** An element has one row for each of its fields: both name the row. */
const fields: Table = {
  header: ['요소 · 필드', ...read.header.slice(2)],
  rows: read.rows.map(([element = '', field = '', ...rest]) => [`${element} · ${field}`, ...rest]),
};

const columns = ['편집', '비우면', '새로 만든 직후'] as const;

type Selected = (engine: TestEngine) => Selection;

const onBlock =
  (id: string): Selected =>
  (engine) =>
    selectBlock(indexDoc(engine.content()), id);
const x = onBlock('x');
const onLabel =
  (id: string): Selected =>
  () => ({ kind: 'branchLabel', branch: id });
const onHead: Selected = () => ({ kind: 'head', diagram: 'd1' });

const engineOn = (block: Block, folds: Seq['folds'] = []): TestEngine =>
  testEngine(around(block, folds));

const blockIn = (engine: TestEngine, id = 'x'): Block => {
  const found = engine.session.index().blocks.get(id)?.block;
  if (found === undefined) {
    throw new Error(`no block ${id}`);
  }
  return found;
};
const textOf = (engine: TestEngine, id = 'x'): string => {
  const found = blockIn(engine, id);
  return 'text' in found ? found.text : '';
};
const labelOf = (engine: TestEngine, id: string): string | undefined =>
  engine.session.index().branches.get(id)?.branch.label;
const headOf = (engine: TestEngine): string => engine.content().diagrams[0]?.head?.text ?? '';
const open = (engine: TestEngine): EditField | undefined => engine.session.state.editing?.field;

/** The edit command opens `expected` on what is selected. */
async function opens(engine: TestEngine, on: Selected, expected: object): Promise<void> {
  await perform(engine, on, 'edit.text');
  expect(open(engine)).toMatchObject(expected);
}

/** Opens the field of what is selected, empties it and closes it. */
async function emptied(engine: TestEngine, on: Selected, field?: EditField): Promise<TestEngine> {
  if (field === undefined) {
    await perform(engine, on, 'edit.text');
  } else {
    engine.select(on(engine));
    expect(engine.session.startEditing(field, 'selectAll')).toBe(true);
  }
  engine.session.clearNotice();
  engine.session.commitEditing('');
  return engine;
}

/** The command refuses with the notice the cell quotes. */
async function refusedWith(
  engine: TestEngine,
  on: Selected,
  key: MessageKey,
  quoted?: string,
): Promise<void> {
  await refused(engine, on, 'edit.text');
  expect(noticeKey(engine)).toBe(key);
  if (quoted !== undefined) {
    expect(korean[key]).toBe(quoted);
  }
}

/** A command on the block `p0`: what field is open right after. */
async function madeWith(command: string): Promise<TestEngine> {
  const engine = engineOn(blockOf.process);
  await perform(engine, onBlock('p0'), command);
  return engine;
}
const focusOf = (engine: TestEngine): string => {
  const selection = engine.session.state.selection;
  return selection?.kind === 'blocks' ? selection.focus : '';
};
/** Inserting the kind opens the text of the new block. */
async function insertsOpen(kind: string): Promise<void> {
  const engine = await madeWith(`block.insert.${kind}`);
  expect(open(engine)).toEqual({ kind: 'block', block: focusOf(engine) });
}

/** Inserting a call block to the item of the list with this title. */
async function insertCall(title: string): Promise<TestEngine> {
  const engine = engineOn(blockOf.process);
  engine.select(onBlock('p0')(engine));
  engine.run('block.insert.call');
  const items = engine.picker()?.items ?? [];
  engine.picker()?.choose(items.findIndex((item) => item.title === title));
  await engine.settle();
  return engine;
}

const callFields = (engine: TestEngine): ReadonlyArray<string> => {
  const found = blockIn(engine);
  if (found.kind !== 'call') {
    return [];
  }
  return [found.args, found.result, found.target.kind === 'named' ? found.target.name : ''];
};
const part = (name: 'args' | 'result' | 'name'): EditField => ({
  kind: 'call',
  block: 'x',
  part: name,
});

const conditions = ['while', 'for', 'doWhile', 'if', 'case'] as const;
const each = async <T>(
  items: ReadonlyArray<T>,
  check: (item: T) => Promise<void>,
): Promise<void> => {
  for (const item of items) {
    await check(item);
  }
};

/** A Case without a default: what its empty default cell is. */
const noDefault = caseBlock('x', [arm('r1', '1', [proc('i1')])], null, 'k');
const onMissing: Selected = () => ({ kind: 'missingDefault', block: 'x' });

/** A fold region over the block `x`. */
const regionOver = (name?: string): Seq['folds'] => [
  { id: 'f1', first: 'x', last: 'x', ...(name === undefined ? {} : { name }) },
];
const onFold: Selected = () => ({ kind: 'fold', fold: 'f1' });

/** The call of `d2` opened in place, and its first block selected. */
function opened(): { engine: TestEngine; peek: Selected } {
  const engine = engineOn(localCall('d2'));
  const view = engine.session.state.doc.view;
  engine.session.setView({ ...view, opened: [['x']] });
  return { engine, peek: () => ({ kind: 'peek', path: ['x'], anchor: 'm1', focus: 'm1' }) };
}

type Entry = Pick<CellCase, 'doc' | 'check'>;
type Row = readonly [editing: Entry, empty: Entry, made: Entry];

const cell = (doc: string, check?: () => void | Promise<void>): Entry =>
  check === undefined ? { doc } : { doc, check };
const blank = cell('');

const rows: Readonly<Record<string, Row>> = {
  '처리 · 탈출 블록 · 텍스트': [
    cell('할 수 있다', () =>
      each(['process', 'exit'] as const, (kind) =>
        opens(engineOn(blockOf[kind]), x, { kind: 'block', block: 'x' }),
      ),
    ),
    cell('빈 채로 둔다', () =>
      each(['process', 'exit'] as const, async (kind) => {
        expect(textOf(await emptied(engineOn(blockOf[kind]), x))).toBe('');
      }),
    ),
    cell('인라인 에디터를 연다', () => each(['process', 'exit'], insertsOpen)),
  ],
  'While · For · Do-While · If · Case · 조건': [
    cell('할 수 있다', () =>
      each(conditions, (kind) => opens(engineOn(blockOf[kind]), x, { kind: 'block', block: 'x' })),
    ),
    cell('빈 채로 둔다', () =>
      each(conditions, async (kind) => {
        expect(textOf(await emptied(engineOn(blockOf[kind]), x)), kind).toBe('');
      }),
    ),
    cell('인라인 에디터를 연다', () => each(conditions, insertsOpen)),
  ],
  '병렬 처리 · 위 띠의 텍스트': [
    cell('할 수 있다', () => opens(engineOn(blockOf.parallel), x, { kind: 'block', block: 'x' })),
    cell('빈 채로 둔다', async () => {
      expect(textOf(await emptied(engineOn(blockOf.parallel), x))).toBe('');
    }),
    cell('인라인 에디터를 연다', () => insertsOpen('parallel')),
  ],
  '무한 반복 · 없다': [
    cell('"무한 반복에는 텍스트가 없습니다."라고 알리고 거절한다', () =>
      refusedWith(
        engineOn(blockOf.endless),
        x,
        'reason.endlessHasNoText',
        '무한 반복에는 텍스트가 없습니다.',
      ),
    ),
    blank,
    cell('선택만 한다', async () => {
      const engine = await madeWith('block.insert.endless');
      expect(open(engine)).toBeUndefined();
      expect(blockIn(engine, focusOf(engine)).kind).toBe('endless');
    }),
  ],
  'If의 분기 라벨 · 라벨': [
    cell('할 수 있다', () =>
      opens(engineOn(blockOf.if), onLabel('r1'), { kind: 'branchLabel', branch: 'r1' }),
    ),
    cell('기본값("참" · "거짓")으로 복원한다', async () => {
      const engine = engineOn(blockOf.if);
      await perform(engine, onLabel('r1'), 'edit.text');
      engine.session.commitEditing('mine');
      await emptied(engine, onLabel('r1'));
      expect(labelOf(engine, 'r1')).toBeUndefined();
    }),
    blank,
  ],
  'Case의 분기 라벨 · 라벨(필수 필드)': [
    cell('할 수 있다', () =>
      opens(engineOn(blockOf.case), onLabel('r1'), { kind: 'branchLabel', branch: 'r1' }),
    ),
    cell('편집 전의 라벨로 복원하고 알린다', async () => {
      const engine = await emptied(engineOn(blockOf.case), onLabel('r1'));
      expect(labelOf(engine, 'r1')).toBe('1');
      expect(noticeKey(engine)).toBe('reason.emptyLabel');
      expect(open(engine)).toBeUndefined();
    }),
    cell('새 분기의 라벨 인라인 에디터를 연다', async () => {
      const engine = engineOn(blockOf.case);
      await perform(engine, onLabel('r1'), 'branch.insert');
      const selection = engine.session.state.selection;
      expect(open(engine)).toEqual({
        kind: 'branchLabel',
        branch: selection?.kind === 'branchLabel' ? selection.branch : '',
      });
    }),
  ],
  'default 분기의 라벨 · 없다': [
    cell('"default 분기의 라벨은 바꿀 수 없습니다."라고 알리고 거절한다', () =>
      refusedWith(
        engineOn(blockOf.case),
        onLabel('r2'),
        'reason.defaultLabelFixed',
        'default 분기의 라벨은 바꿀 수 없습니다.',
      ),
    ),
    blank,
    blank,
  ],
  '병렬 처리의 분기 · 없다': [
    // A double click on the top band is the DOM view's (create-editor.test.ts).
    cell(
      '텍스트 편집 명령은 알리고 거절한다. 그 분기 위의 위 띠 구간을 더블클릭하면 병렬 처리 블록의 텍스트를 편집한다',
      () =>
        refusedWith(engineOn(blockOf.parallel), onLabel('r1'), 'reason.parallelBranchHasNoLabel'),
    ),
    blank,
    cell('새 분기를 선택만 한다', async () => {
      const engine = engineOn(blockOf.parallel);
      await perform(engine, onLabel('r1'), 'branch.insert');
      expect(engine.session.state.selection?.kind).toBe('branchLabel');
      expect(open(engine)).toBeUndefined();
    }),
  ],
  '헤더 · 이름(필수 필드. Method는 괄호 안의 받는 것까지)': [
    cell('할 수 있다', () =>
      opens(engineOn(blockOf.process), onHead, { kind: 'head', diagram: 'd1' }),
    ),
    cell(
      '편집 전의 이름으로 복원하고 알린다. 이름이 중복되면 받아들이지 않고 인라인 에디터를 다시 연다',
      async () => {
        const engine = await emptied(engineOn(blockOf.process), onHead);
        expect(headOf(engine)).toBe('start');
        expect(noticeKey(engine)).toBe('reason.emptyHeadName');
        expect(open(engine)).toBeUndefined();
        await perform(engine, onHead, 'edit.text');
        engine.session.commitEditing('plain');
        expect(headOf(engine)).toBe('start');
        expect(noticeKey(engine)).toBe('reason.duplicateHeadName');
        expect(open(engine)).toEqual({ kind: 'head', diagram: 'd1' });
      },
    ),
    cell('기본 이름을 모두 선택한 채 인라인 에디터를 연다', async () => {
      const engine = await madeWith('diagram.newMethod');
      expect(open(engine)?.kind).toBe('head');
      expect(engine.session.state.editing?.caret).toBe('selectAll');
      expect(engine.session.state.editing?.text).toBe('Method 1');
    }),
  ],
  '호출 블록 · 인자(받는 것이 있는 Method를 호출하면 필수 필드)': [
    cell('할 수 있다', () => opens(engineOn(localCall('d3', 'k')), x, part('args'))),
    cell('헤더의 괄호 안 텍스트로 복원한다', async () => {
      const engine = await emptied(engineOn(localCall('d3', 'k')), x, part('args'));
      expect(callFields(engine)[0]).toBe('n');
    }),
    cell('인라인 에디터를 연다', async () => {
      expect(open(await insertCall('takes(n)'))).toMatchObject({ part: 'args' });
    }),
  ],
  '호출 블록 · 결과': [
    cell('할 수 있다', () => opens(engineOn(localCall('d2')), x, part('result'))),
    cell('빈 채로 둔다', async () => {
      const engine = await emptied(engineOn(localCall('d2')), x, part('result'));
      expect(callFields(engine)[1]).toBe('');
    }),
    blank,
  ],
  '이름을 입력하는 호출 블록 · 이름(한 번 입력하면 필수 필드)': [
    cell('할 수 있다', async () => {
      const engine = engineOn(namedCall);
      engine.select(x(engine));
      expect(engine.session.startEditing(part('name'), 'selectAll')).toBe(true);
      await Promise.resolve();
    }),
    cell('편집 전의 이름으로 복원하고 알린다', async () => {
      const engine = await emptied(engineOn(namedCall), x, part('name'));
      expect(callFields(engine)[2]).toBe('lib');
      expect(noticeKey(engine)).toBe('reason.emptyCallName');
    }),
    cell('인라인 에디터를 연다', async () => {
      expect(open(await insertCall('picker.namedCall'))).toMatchObject({ part: 'name' });
    }),
  ],
  '같은 문서의 Method를 호출하는 호출 블록 · 이름': [
    cell('할 수 없다(헤더의 이름을 따른다)', () => {
      const engine = engineOn(localCall('d2'));
      expect(engine.session.callParts(blockIn(engine))).not.toContain('name');
      expect(engine.session.startEditing(part('name'), 'selectAll')).not.toBe(true);
    }),
    blank,
    blank,
  ],
  '접기 영역(이름 띠 · 접힌 칸) · 이름': [
    cell('할 수 있다(펴 보인 곳에서는 그 위치의 접기 영역만)', async () => {
      await opens(engineOn(blockOf.process, regionOver()), onFold, { kind: 'fold', fold: 'f1' });
      // A region of the call site opens; a region of the Method seen there does not.
      const { engine, peek } = opened();
      await perform(engine, peek, 'fold.make');
      expect(open(engine)).toMatchObject({ kind: 'fold', path: ['x'] });
      const content: Content = engine.content();
      const withOwn: Content = {
        ...content,
        diagrams: content.diagrams.map((d) =>
          d.id === 'd2'
            ? { ...d, body: { ...d.body, folds: [{ id: 'f9', first: 'm2', last: 'm2' }] } }
            : d,
        ),
      };
      const other = testEngine(withOwn);
      expect(
        other.session.startEditing({ kind: 'fold', fold: 'f9', path: ['x'] }, 'selectAll'),
      ).toBe('reason.methodFoldHere');
    }),
    cell('이름을 지우고 기본 이름을 보인다', async () => {
      const engine = await emptied(engineOn(blockOf.process, regionOver('mine')), onFold);
      expect(engine.content().diagrams[0]?.body.folds[0]?.name ?? '').toBe('');
      expect(engine.session.foldName('f1')).toBe('work');
    }),
    cell('기본 이름을 모두 선택한 채 접힌 칸에서 인라인 에디터를 연다', async () => {
      const engine = await madeWith('fold.make');
      const field = open(engine);
      expect(field?.kind).toBe('fold');
      expect(engine.session.state.editing?.caret).toBe('selectAll');
      expect(engine.session.state.editing?.text).toBe('before');
      expect(engine.session.state.doc.view.folded).toContain(
        field?.kind === 'fold' ? field.fold : '',
      );
    }),
  ],
  '빈 default 칸 · 입력한 텍스트': [
    cell('할 수 있다. 입력하면 default 분기가 생기고 그 블록의 텍스트가 된다', async () => {
      const engine = engineOn(noDefault);
      await opens(engine, onMissing, { kind: 'missingDefault', block: 'x' });
      engine.session.commitEditing('else');
      const made = blockIn(engine);
      const [first] = made.kind === 'case' ? (made.otherwise?.body.blocks ?? []) : [];
      expect(first?.kind === 'process' ? first.text : null).toBe('else');
    }),
    cell('모델을 바꾸지 않는다', async () => {
      const engine = engineOn(noDefault);
      const before = engine.content();
      await emptied(engine, onMissing);
      expect(engine.content()).toBe(before);
    }),
    blank,
  ],
  '펴 보인 블록 · 없다': [
    cell('편집할 수 없다고 알리고 거절한다(C5)', async () => {
      const { engine, peek } = opened();
      await refusedWith(engine, peek, 'reason.peekReadOnly');
    }),
    blank,
    blank,
  ],
};

const cases: ReadonlyArray<CellCase> = Object.entries(rows).flatMap(([row, entries]) =>
  entries.map((entry, i) => ({ row, column: columns[i] ?? '', ...entry })),
);
const { active } = split(cases);

describe('the table of text fields', () => {
  it('T-1708: the table of text fields has the rows and columns that are tested', () => {
    expect(tableKeys(fields)).toEqual(caseKeys(cases));
  });

  it.each(active)('T-1709: a cell of the text fields: $name', async (c) => {
    expect(cellOf(fields, c.row, c.column), 'the cell in the document').toBe(c.doc);
    await c.check?.();
  });
});
