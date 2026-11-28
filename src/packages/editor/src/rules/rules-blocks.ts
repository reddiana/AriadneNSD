// One block of each kind, for the tables of block kinds and text fields: a document of one
// diagram around the block under test, and the Methods calls may call.
import type { Block, Content, Diagram, Seq } from '@ariadne-nsd/core';

import { arm, branch, caseBlock, contentOf, ifBlock, proc } from '../engine-test-support';
import { whileBlock } from '../engine-test-support';

const seq = (blocks: ReadonlyArray<Block>, folds: Seq['folds'] = []): Seq => ({ blocks, folds });

const loop = (kind: 'for' | 'doWhile', blocks: ReadonlyArray<Block>): Block => ({
  id: 'x',
  kind,
  text: 'cond',
  body: seq(blocks),
});

export const localCall = (target: string, args = ''): Block => ({
  id: 'x',
  kind: 'call',
  target: { kind: 'local', diagram: target },
  args,
  result: 'r',
  siteFolds: [],
});

export const namedCall: Block = {
  id: 'x',
  kind: 'call',
  target: { kind: 'named', name: 'lib' },
  args: 'n',
  result: '',
  siteFolds: [],
};

/** A block with the id `x` of each kind, with something in every line it holds. */
export const blockOf = {
  process: proc('x', 'work'),
  exit: { id: 'x', kind: 'exit', text: 'break' } satisfies Block,
  while: whileBlock('x', [proc('i1'), proc('i2')], 'cond'),
  for: loop('for', [proc('i1'), proc('i2')]),
  doWhile: loop('doWhile', [proc('i1'), proc('i2')]),
  endless: { id: 'x', kind: 'endless', body: seq([proc('i1'), proc('i2')]) } satisfies Block,
  if: ifBlock('x', branch('r1', [proc('i1')]), branch('r2', [proc('i2')]), 'cond'),
  case: caseBlock('x', [arm('r1', '1', [proc('i1')])], branch('r2', [proc('i2')]), 'cond'),
  parallel: {
    id: 'x',
    kind: 'parallel',
    text: 'band',
    branches: [branch('r1', [proc('i1')]), branch('r2', [proc('i2')])],
  } satisfies Block,
  call: localCall('d2'),
} as const;

export type KindUnderTest = keyof typeof blockOf;

/** The Method `d2` receives nothing (no parentheses), `d3` receives `n`. */
const methods: ReadonlyArray<Diagram> = [
  { id: 'd2', head: { kind: 'method', text: 'plain' }, body: seq([proc('m1'), proc('m2')]) },
  { id: 'd3', head: { kind: 'method', text: 'takes(n)' }, body: seq([proc('m3')]) },
];

/** A document whose first diagram, headed as an Event, holds a block before, `block` and one after. */
export function around(block: Block, folds: Seq['folds'] = []): Content {
  const content = contentOf([]);
  return {
    ...content,
    diagrams: [
      {
        id: 'd1',
        head: { kind: 'event', text: 'start' },
        body: seq([proc('p0', 'before'), block, proc('p9', 'after')], folds),
      },
      ...methods,
    ],
  };
}
