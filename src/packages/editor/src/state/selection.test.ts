import { describe, expect, it } from 'vitest';

import { branch, contentOf, ifBlock, proc, whileBlock } from '../engine-test-support';
import { indexDoc } from '../model/doc-index';
import {
  extendBy,
  extendTo,
  selectBlock,
  selectRange,
  selectedBlocks,
  targetOf,
  validSelection,
} from './selection';

// a; while w1 { c; d }; if b1 { yes: e | no: f }
const content = contentOf(
  [
    proc('a'),
    whileBlock('w1', [proc('c'), proc('d')]),
    ifBlock('b1', branch('r1', [proc('e')]), branch('r2', [proc('f')])),
  ],
  [proc('z')],
);
const index = indexDoc(content);

describe('selection (03-editor 2)', () => {
  it('R-EDIT-05 (ADR-0008): Shift+click deeper widens to the nearest common sequence', () => {
    const widened = extendTo(index, selectBlock(index, 'a'), 'c');
    expect(selectedBlocks(index, widened)).toEqual(['a', 'w1']);
    const across = extendTo(index, selectBlock(index, 'e'), 'f');
    expect(selectedBlocks(index, across)).toEqual(['b1']);
  });

  it('R-EDIT-05: Shift+click in another diagram selects only that block', () => {
    expect(extendTo(index, selectBlock(index, 'a'), 'z')).toEqual(selectBlock(index, 'z'));
  });

  it('R-EDIT-05: Shift+Down stays under one parent', () => {
    const one = extendBy(index, selectBlock(index, 'c'), 'down');
    expect(selectedBlocks(index, one)).toEqual(['c', 'd']);
    expect(extendBy(index, one, 'down')).toBeNull();
    expect(selectedBlocks(index, extendBy(index, selectBlock(index, 'w1'), 'up'))).toEqual([
      'a',
      'w1',
    ]);
  });

  it('03-editor 2: a selection whose ids are gone is dropped', () => {
    const later = indexDoc(contentOf([proc('a')]));
    expect(validSelection(later, selectBlock(index, 'c'))).toBeNull();
    expect(validSelection(later, selectRange(index, 'a', 'w1'))).toEqual(selectBlock(later, 'a'));
    expect(validSelection(later, { kind: 'branchLabel', branch: 'r1' })).toBeNull();
  });

  it('turns a block range into a command target', () => {
    expect(targetOf(selectRange(index, 'w1', 'a'))).toEqual({
      kind: 'blocks',
      first: 'w1',
      last: 'a',
    });
    expect(targetOf({ kind: 'branchLabel', branch: 'r1' })).toBeNull();
  });
});
