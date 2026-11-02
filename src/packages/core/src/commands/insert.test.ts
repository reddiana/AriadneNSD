import { describe, expect, it } from 'vitest';

import { createIdGenerator } from '../model/id';
import { insertBlock } from './insert';
import {
  blockOf,
  branch,
  contentOf,
  empty,
  expectRefused,
  foldsIn,
  idsIn,
  ifBlock,
  proc,
  runOk,
  seq,
} from './test-support';

const blocks = { kind: 'blocks' } as const;

describe('insertBlock', () => {
  it('R-EDIT-01: inserts a process block after the selected block', () => {
    const content = contentOf([proc('b1'), proc('b2')]);
    const result = runOk(insertBlock, content, {
      target: { ...blocks, first: 'b1', last: 'b1' },
      side: 'after',
      kind: 'process',
    });
    expect(idsIn(result.content, 'd1')).toEqual(['b1', 'b3', 'b2']);
    expect(result.touched).toEqual(['b3']);
    expect(blockOf(result.content, 'b3')).toEqual({ id: 'b3', kind: 'process', text: '' });
  });

  it('R-EDIT-01: inserts before the selection, and after the end of a range', () => {
    const content = contentOf([proc('b1'), proc('b2'), proc('b3')]);
    const before = runOk(insertBlock, content, {
      target: { ...blocks, first: 'b3', last: 'b2' },
      side: 'before',
      kind: 'process',
    });
    expect(idsIn(before.content, 'd1')).toEqual(['b1', 'b4', 'b2', 'b3']);
    const after = runOk(insertBlock, content, {
      target: { ...blocks, first: 'b1', last: 'b2' },
      side: 'after',
      kind: 'process',
    });
    expect(idsIn(after.content, 'd1')).toEqual(['b1', 'b2', 'b4', 'b3']);
  });

  it('R-BLK-01..06: a new control block has empty text and empty inner blocks', () => {
    const content = contentOf([proc('b1')]);
    const at = { target: { ...blocks, first: 'b1', last: 'b1' }, side: 'after' } as const;
    const ifResult = runOk(insertBlock, content, { ...at, kind: 'if' });
    expect(blockOf(ifResult.content, 'b2')).toEqual({
      id: 'b2',
      kind: 'if',
      text: '',
      yes: { id: 'r1', body: seq([empty('b3')]) },
      no: { id: 'r2', body: seq([empty('b4')]) },
    });
    const caseResult = runOk(insertBlock, content, { ...at, kind: 'case' });
    const made = blockOf(caseResult.content, 'b2');
    expect(made.kind === 'case' ? made.arms.map((a) => a.label) : null).toEqual(['1', '2']);
    expect(made.kind === 'case' ? made.otherwise?.body.blocks.length : null).toBe(1);
    for (const kind of ['while', 'doWhile', 'for'] as const) {
      const loop = runOk(insertBlock, content, { ...at, kind });
      expect(blockOf(loop.content, 'b2')).toEqual({
        id: 'b2',
        kind,
        text: '',
        body: seq([empty('b3')]),
      });
    }
  });

  it('R-EDIT-01: a control block inserted on an empty block takes its place', () => {
    const content = contentOf([proc('b1'), empty('b2')]);
    const result = runOk(insertBlock, content, {
      target: { ...blocks, first: 'b2', last: 'b2' },
      side: 'before',
      kind: 'while',
    });
    expect(idsIn(result.content, 'd1')).toEqual(['b1', 'b3']);
    expect(result.touched).toEqual(['b3']);
  });

  it('R-EDIT-01: a process block on an empty block changes nothing (the editor opens it)', () => {
    const content = contentOf([empty('b1')]);
    const result = runOk(insertBlock, content, {
      target: { ...blocks, first: 'b1', last: 'b1' },
      side: 'after',
      kind: 'process',
    });
    expect(result.content).toBe(content);
    expect(result.touched).toEqual(['b1']);
  });

  it('UX KP2: with besideEmpty a process block goes next to the empty block', () => {
    const content = contentOf([empty('b1')]);
    const at = { target: { ...blocks, first: 'b1', last: 'b1' }, kind: 'process' } as const;
    const after = runOk(insertBlock, content, { ...at, side: 'after', besideEmpty: true });
    expect(idsIn(after.content, 'd1')).toEqual(['b1', 'b2']);
    expect(after.touched).toEqual(['b2']);
    const before = runOk(insertBlock, content, { ...at, side: 'before', besideEmpty: true });
    expect(idsIn(before.content, 'd1')).toEqual(['b2', 'b1']);
  });

  it('R-EDIT-01: inserts inside a branch when a block of the branch is selected', () => {
    const content = contentOf([
      ifBlock('b1', branch('r1', [proc('b2')]), branch('r2', [proc('b3')])),
    ]);
    const result = runOk(insertBlock, content, {
      target: { ...blocks, first: 'b3', last: 'b3' },
      side: 'after',
      kind: 'process',
    });
    expect(idsIn(result.content, 'r2')).toEqual(['b3', 'b4']);
    expect(idsIn(result.content, 'd1')).toEqual(['b1']);
  });

  it('R-EDIT-01: with nothing selected, inserts at the end of the diagram', () => {
    const content = contentOf([proc('b1')]);
    const result = runOk(insertBlock, content, {
      target: { kind: 'diagramEnd', diagram: 'd1' },
      side: 'after',
      kind: 'if',
    });
    expect(idsIn(result.content, 'd1')).toEqual(['b1', 'b2']);
  });

  it('01-model 4.3 (UX MD1): a block inserted at the end of a fold joins it when a block inside was selected', () => {
    const content = contentOf(
      seq([proc('b1'), proc('b2'), proc('b3')], [{ id: 'f1', first: 'b1', last: 'b2' }]),
    );
    const after = runOk(insertBlock, content, {
      target: { ...blocks, first: 'b2', last: 'b2' },
      side: 'after',
      kind: 'process',
    });
    expect(foldsIn(after.content, 'd1')).toEqual(['f1:b1-b4']);
    const before = runOk(insertBlock, content, {
      target: { ...blocks, first: 'b1', last: 'b1' },
      side: 'before',
      kind: 'process',
    });
    expect(foldsIn(before.content, 'd1')).toEqual(['f1:b4-b2']);
  });

  it('01-model 4.3 (UX MD1): a block inserted next to a whole selected fold stays outside', () => {
    const content = contentOf(
      seq([proc('b1'), proc('b2'), proc('b3')], [{ id: 'f1', first: 'b1', last: 'b2' }]),
    );
    const result = runOk(insertBlock, content, {
      target: { kind: 'fold', fold: 'f1' },
      side: 'after',
      kind: 'process',
    });
    expect(idsIn(result.content, 'd1')).toEqual(['b1', 'b2', 'b4', 'b3']);
    expect(foldsIn(result.content, 'd1')).toEqual(['f1:b1-b2']);
  });

  it('01-model 4.3: a block inserted between the ends of a fold is inside it', () => {
    const content = contentOf(
      seq([proc('b1'), proc('b2')], [{ id: 'f1', first: 'b1', last: 'b2' }]),
    );
    const result = runOk(insertBlock, content, {
      target: { ...blocks, first: 'b1', last: 'b1' },
      side: 'after',
      kind: 'process',
    });
    expect(idsIn(result.content, 'd1')).toEqual(['b1', 'b3', 'b2']);
    expect(foldsIn(result.content, 'd1')).toEqual(['f1:b1-b2']);
  });

  it('01-model 1.7: new ids come from the given generator', () => {
    const content = contentOf([proc('b1')]);
    const ids = createIdGenerator(content, ['b2', 'b3']);
    const result = runOk(insertBlock, content, {
      target: { ...blocks, first: 'b1', last: 'b1' },
      side: 'after',
      kind: 'process',
      ids,
    });
    expect(result.touched).toEqual(['b4']);
  });

  it('R-EDIT-01: refuses a target that is not there or not contiguous', () => {
    const content = contentOf([
      ifBlock('b1', branch('r1', [proc('b2')]), branch('r2', [proc('b3')])),
    ]);
    expectRefused(
      insertBlock,
      content,
      { target: { ...blocks, first: 'b9', last: 'b9' }, side: 'after', kind: 'process' },
      'notFound',
    );
    expectRefused(
      insertBlock,
      content,
      { target: { ...blocks, first: 'b2', last: 'b3' }, side: 'after', kind: 'process' },
      'notContiguous',
    );
    expectRefused(
      insertBlock,
      content,
      { target: { kind: 'fold', fold: 'f9' }, side: 'after', kind: 'process' },
      'notFound',
    );
  });
});
