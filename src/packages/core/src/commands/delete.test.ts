import { describe, expect, it } from 'vitest';

import { deleteBlocks } from './delete';
import {
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
  whileBlock,
} from './test-support';

describe('deleteBlocks', () => {
  it('T-0096 · R-EDIT-01: deletes the selected range with what is inside', () => {
    const content = contentOf([proc('b1'), whileBlock('b2', [proc('b3')]), proc('b4')]);
    const result = runOk(deleteBlocks, content, {
      target: { kind: 'blocks', first: 'b1', last: 'b2' },
    });
    expect(idsIn(result.content, 'd1')).toEqual(['b4']);
    expect(result.touched).toEqual([]);
  });

  it('T-0097: 01-model 4.1: a sequence left with no blocks gets one empty block', () => {
    const content = contentOf([
      ifBlock('b1', branch('r1', [proc('b2'), proc('b3')]), branch('r2', [proc('b4')])),
    ]);
    const result = runOk(deleteBlocks, content, {
      target: { kind: 'blocks', first: 'b2', last: 'b3' },
    });
    expect(idsIn(result.content, 'r1')).toEqual(['b5']);
    expect(result.touched).toEqual(['b5']);
  });

  it('T-0098: 01-model 4.3: fold regions shrink to the blocks left, and go when none is left', () => {
    const content = contentOf(
      seq(
        [proc('b1'), proc('b2'), proc('b3'), proc('b4')],
        [
          { id: 'f1', first: 'b1', last: 'b3' },
          { id: 'f2', first: 'b3', last: 'b3' },
        ],
      ),
    );
    const result = runOk(deleteBlocks, content, {
      target: { kind: 'blocks', first: 'b3', last: 'b4' },
    });
    expect(foldsIn(result.content, 'd1')).toEqual(['f1:b1-b2']);
  });

  it('T-0099 · R-EDIT-01: deleting a whole fold region deletes its blocks', () => {
    const content = contentOf(
      seq([proc('b1'), proc('b2'), proc('b3')], [{ id: 'f1', first: 'b2', last: 'b3' }]),
    );
    const result = runOk(deleteBlocks, content, { target: { kind: 'fold', fold: 'f1' } });
    expect(idsIn(result.content, 'd1')).toEqual(['b1']);
    expect(foldsIn(result.content, 'd1')).toEqual([]);
  });

  it('T-0100 · R-EDIT-01: refuses to delete the only, empty block, and a missing target', () => {
    expectRefused(
      deleteBlocks,
      contentOf([empty('b1')]),
      { target: { kind: 'blocks', first: 'b1', last: 'b1' } },
      'alreadyEmpty',
    );
    expectRefused(
      deleteBlocks,
      contentOf([proc('b1')]),
      { target: { kind: 'blocks', first: 'b2', last: 'b2' } },
      'notFound',
    );
    expectRefused(
      deleteBlocks,
      contentOf([proc('b1')]),
      { target: { kind: 'diagramEnd', diagram: 'd1' } },
      'wrongKind',
    );
  });

  it('T-0101 · R-EDIT-01: an empty block among others can be deleted', () => {
    const result = runOk(deleteBlocks, contentOf([empty('b1'), proc('b2')]), {
      target: { kind: 'blocks', first: 'b1', last: 'b1' },
    });
    expect(idsIn(result.content, 'd1')).toEqual(['b2']);
  });
});
