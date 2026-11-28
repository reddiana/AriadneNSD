// The document the table tests run on, the selections of the tables' columns, and short ways to
// say what a command did.
import type { Block, Content, Diagram, Seq } from '@ariadne-nsd/core';
import { expect } from 'vitest';

import { arm, branch, contentOf, empty, ifBlock, proc, testEngine } from '../engine-test-support';
import { caseBlock, whileBlock } from '../engine-test-support';
import type { TestEngine } from '../engine-test-support';
import { indexDoc } from '../model/doc-index';
import type { Selection } from '../state/selection';
import { selectBlock, selectRange } from '../state/selection';

export const body = (blocks: ReadonlyArray<Block>, folds: Seq['folds'] = []): Seq => ({
  blocks,
  folds,
});

/**
 * The tests name the nodes in words (`w`, `ry`, `F`). The document has ids of the file format
 * (`b2`, `r1`, `f1`), so that what is copied can be read back.
 */
const names = {
  b: 'a w w1 w2 c y1 y2 n1 n2 k k1 k2 k3 k4 kd g1 g2 g3 gd1 p pa pb q f1 f2 z h1 hw h3 h4 o1 e',
  r: 'ry rn k1r k2r gr gd p1r p2r',
  f: 'F G H',
};
const ids = new Map(
  Object.entries(names).flatMap(([prefix, list]) =>
    list.split(' ').map((name, i) => [name, `${prefix}${String(i + 1)}`] as const),
  ),
);
const namesById = new Map([...ids].map(([name, real]) => [real, name]));

/** The id of the node the tests call `name`; diagram ids are their own names. */
export const id = (name: string): string => ids.get(name) ?? name;
/** The tests' name of a node, or its id for a node a command made. */
export const nameOf = (real: string): string => namesById.get(real) ?? real;

/** The content with every named id and reference replaced. */
const withIds = (content: Content): Content =>
  JSON.parse(
    JSON.stringify(content, (key, value: unknown) =>
      (key === 'id' || key === 'first' || key === 'last') && typeof value === 'string'
        ? id(value)
        : value,
    ),
  ) as Content;

const method = (id: string, name: string, seq: Seq): Diagram => ({
  id,
  head: { kind: 'method', text: name },
  body: seq,
});

export const call = (id: string, target: string): Block => ({
  id,
  kind: 'call',
  target: { kind: 'local', diagram: target },
  args: '',
  result: '',
  siteFolds: [],
});

const parallel = (id: string, first: Block, second: Block): Block => ({
  id,
  kind: 'parallel',
  text: id,
  branches: [branch(`${id}1r`, [first]), branch(`${id}2r`, [second])],
});

/**
 * Three Methods. `main()` holds one of each container: a loop `w`, an If `c`, a Case `k` without
 * a default, a Case `kd` with one (in the fold region `H`, its first branch holding the region
 * `G`), a parallel block `p`, a call `q` of `helper()` (shown opened), the region `F` at the top
 * level and a plain block at each end. `other()` ends with an empty block.
 */
export const rulesContent: Content = withIds({
  settings: contentOf().settings,
  diagrams: [
    method(
      'd1',
      'main()',
      body(
        [
          proc('a'),
          whileBlock('w', [proc('w1'), proc('w2')]),
          ifBlock(
            'c',
            branch('ry', [proc('y1'), proc('y2')]),
            branch('rn', [proc('n1'), proc('n2')]),
          ),
          caseBlock(
            'k',
            [arm('k1r', '1', [proc('k1'), proc('k2')]), arm('k2r', '2', [proc('k3'), proc('k4')])],
            null,
          ),
          {
            id: 'kd',
            kind: 'case',
            text: 'kd',
            arms: [
              {
                id: 'gr',
                label: 'g',
                body: body(
                  [proc('g1'), proc('g2'), proc('g3')],
                  [{ id: 'G', first: 'g1', last: 'g2' }],
                ),
              },
            ],
            otherwise: branch('gd', [proc('gd1')]),
          },
          parallel('p', proc('pa'), proc('pb')),
          call('q', 'd2'),
          proc('f1'),
          proc('f2'),
          proc('z'),
        ],
        [
          { id: 'H', first: 'kd', last: 'kd' },
          { id: 'F', first: 'f1', last: 'f2', name: 'region' },
        ],
      ),
    ),
    method('d2', 'helper()', body([proc('h1'), whileBlock('hw', [proc('h3'), proc('h4')])])),
    method('d3', 'other()', body([proc('o1'), empty('e')])),
  ],
});

/** A block in words: its text for a process block, `∅` when empty, else kind and contents. */
function blockOutline(block: Block): string {
  const inner = (seqs: ReadonlyArray<Seq>): string => `[${seqs.map(seqOutline).join(' | ')}]`;
  switch (block.kind) {
    case 'process':
      return block.text === '' ? '∅' : block.text;
    case 'exit':
      return `exit(${block.text})`;
    case 'call':
      return 'call';
    case 'while':
    case 'doWhile':
    case 'for':
      return `${block.kind}(${block.text})${inner([block.body])}`;
    case 'endless':
      return `endless${inner([block.body])}`;
    case 'if':
      return `if(${block.text})${inner([block.yes.body, block.no.body])}`;
    case 'case': {
      const all = [
        ...block.arms.map((a) => `${a.label}: ${seqOutline(a.body)}`),
        ...(block.otherwise === null ? [] : [`default: ${seqOutline(block.otherwise.body)}`]),
      ];
      return `case(${block.text})[${all.join(' | ')}]`;
    }
    case 'parallel':
      return `parallel(${block.text})${inner(block.branches.map((b) => b.body))}`;
  }
}

/** A sequence in words; a fold region is `<name: its blocks>`. */
export function seqOutline(seq: Seq): string {
  return seq.blocks
    .map((block) => {
      const opens = seq.folds
        .filter((f) => f.first === block.id)
        .map((f) => `<${nameOf(f.id)}: `)
        .join('');
      const closes = '>'.repeat(seq.folds.filter((f) => f.last === block.id).length);
      return `${opens}${blockOutline(block)}${closes}`;
    })
    .join(' ');
}

/** A diagram's body in words. */
export function bodyOf(engine: TestEngine, diagram = 'd1'): string {
  const found = engine.content().diagrams.find((d) => d.id === diagram);
  return found === undefined ? '' : seqOutline(found.body);
}

/** One block of the document in words; empty when it is gone. */
export function outlineOf(engine: TestEngine, name: string): string {
  const place = engine.session.index().blocks.get(id(name));
  return place === undefined ? '' : blockOutline(place.block);
}

export const diagramNames = (engine: TestEngine): ReadonlyArray<string> =>
  engine.content().diagrams.map((d) => d.head?.text ?? '-');

/** The engine on a content, with the call `q` opened when there is one. */
export function rulesEngine(content: Content = rulesContent): TestEngine {
  const engine = testEngine(content);
  if (engine.session.index().blocks.has(id('q'))) {
    const view = engine.session.state.doc.view;
    engine.session.setView({ ...view, opened: [[id('q')]] });
  }
  return engine;
}

export type Selector = (engine: TestEngine) => Selection | null;

/** The selections of the tables, made on the current content. */
export const select = {
  block:
    (name: string): Selector =>
    (engine) =>
      selectBlock(indexDoc(engine.content()), id(name)),
  range:
    (first: string, last: string): Selector =>
    (engine) =>
      selectRange(indexDoc(engine.content()), id(first), id(last)),
  label:
    (branchId: string): Selector =>
    () => ({ kind: 'branchLabel', branch: id(branchId) }),
  head:
    (diagram: string): Selector =>
    () => ({ kind: 'head', diagram }),
  fold:
    (fold: string): Selector =>
    () => ({ kind: 'fold', fold: id(fold) }),
  missing:
    (block: string): Selector =>
    () => ({ kind: 'missingDefault', block: id(block) }),
  peek:
    (name: string): Selector =>
    () => ({ kind: 'peek', path: [id('q')], anchor: id(name), focus: id(name) }),
  none: (): Selector => () => null,
};

/** What the document and the editor were before a command. */
type Before = {
  readonly content: Content;
  readonly view: unknown;
  readonly undo: number;
};

/** Selects and runs a command; waits for the clipboard. Returns what was there before. */
export async function perform(
  engine: TestEngine,
  selector: Selector,
  command: string,
): Promise<Before> {
  engine.select(selector(engine));
  engine.session.clearNotice();
  const before = {
    content: engine.content(),
    view: engine.session.state.doc.view,
    undo: engine.session.state.undo.length,
  };
  engine.run(command);
  await engine.settle();
  return before;
}

/** What is folded, in the tests' names: a block, branch or region, `q/hw` at a call site. */
export const foldedNames = (engine: TestEngine): ReadonlyArray<string> =>
  engine.session.state.doc.view.folded
    // `q/` says the call site has folding of its own (ADR-0046); nothing is folded by it.
    .filter((entry) => !entry.endsWith('/'))
    .map((entry) => entry.split('/').map(nameOf).join('/'));

/** The status bar's message key. */
export function noticeKey(engine: TestEngine): string {
  const value = engine.session.chrome().notice?.message;
  if (value === undefined) {
    return '';
  }
  return typeof value === 'string' ? value : value.key;
}

/** The command did not run: nothing changed, no field opened, and the status bar says why. */
export async function refused(
  engine: TestEngine,
  selector: Selector,
  command: string,
): Promise<void> {
  const before = await perform(engine, selector, command);
  expect(engine.content(), command).toBe(before.content);
  expect(engine.session.state.doc.view, command).toBe(before.view);
  expect(engine.session.state.undo.length, command).toBe(before.undo);
  expect(engine.session.state.editing, command).toBeNull();
  expect(noticeKey(engine), command).toMatch(/^reason\./);
  expect(engine.session.chrome().notice?.level, command).toBe('warn');
}

/** Refused on a fresh engine, for each of the commands. */
export async function refusesAll(selector: Selector, ...commands: string[]): Promise<void> {
  for (const command of commands) {
    await refused(rulesEngine(), selector, command);
  }
}

/** A fresh engine after one command on a selection. */
export async function after(selector: Selector, command: string): Promise<TestEngine> {
  const engine = rulesEngine();
  await perform(engine, selector, command);
  return engine;
}

/** A fresh engine with `copied` on the clipboard, after pasting on a selection. */
export async function pasted(
  copied: Selector,
  selector: Selector,
  command: 'edit.paste' | 'edit.pasteBefore',
): Promise<TestEngine> {
  const engine = rulesEngine();
  await perform(engine, copied, 'edit.copy');
  await perform(engine, selector, command);
  return engine;
}
