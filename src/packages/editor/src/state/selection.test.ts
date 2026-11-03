import { describe, expect, it } from 'vitest';

import {
  arm,
  branch,
  caseBlock,
  contentOf,
  ifBlock,
  proc,
  whileBlock,
} from '../engine-test-support';
import { indexDoc } from '../model/doc-index';
import {
  diagramOf,
  extendBy,
  extendTo,
  focusBlock,
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
  it('T-0264 · R-EDIT-05 (ADR-0008): Shift+click deeper widens to the nearest common sequence', () => {
    const widened = extendTo(index, selectBlock(index, 'a'), 'c');
    expect(selectedBlocks(index, widened)).toEqual(['a', 'w1']);
    const across = extendTo(index, selectBlock(index, 'e'), 'f');
    expect(selectedBlocks(index, across)).toEqual(['b1']);
  });

  it('T-0265 · R-EDIT-05: Shift+click in another diagram selects only that block', () => {
    expect(extendTo(index, selectBlock(index, 'a'), 'z')).toEqual(selectBlock(index, 'z'));
  });

  it('T-0266 · R-EDIT-05: Shift+Down stays under one parent', () => {
    const one = extendBy(index, selectBlock(index, 'c'), 'down');
    expect(selectedBlocks(index, one)).toEqual(['c', 'd']);
    expect(extendBy(index, one, 'down')).toBeNull();
    expect(selectedBlocks(index, extendBy(index, selectBlock(index, 'w1'), 'up'))).toEqual([
      'a',
      'w1',
    ]);
  });

  it('T-0267: 03-editor 2: a selection whose ids are gone is dropped', () => {
    const later = indexDoc(contentOf([proc('a')]));
    expect(validSelection(later, selectBlock(index, 'c'))).toBeNull();
    expect(validSelection(later, selectRange(index, 'a', 'w1'))).toEqual(selectBlock(later, 'a'));
    expect(validSelection(later, { kind: 'branchLabel', branch: 'r1' })).toBeNull();
  });

  it('T-0268: turns a block range into a command target', () => {
    expect(targetOf(selectRange(index, 'w1', 'a'))).toEqual({
      kind: 'blocks',
      first: 'w1',
      last: 'a',
    });
    expect(targetOf({ kind: 'branchLabel', branch: 'r1' })).toBeNull();
  });
  it('T-0676: 03-editor 2: a range whose sequence moved is written again with its new owner', () => {
    // c and d moved out of the While to the top level.
    const later = indexDoc(contentOf([proc('c'), proc('d')]));
    expect(validSelection(later, selectRange(index, 'c', 'd'))).toEqual(
      selectRange(later, 'c', 'd'),
    );
    expect(selectedBlocks(later, selectRange(index, 'a', 'w1'))).toEqual([]);
  });

  it('T-0677: 03-editor 2: a header, a label and a missing default cell are kept only while they exist', () => {
    const cases = indexDoc(
      contentOf([
        caseBlock('k1', [arm('a1', '1', [proc('x')])], null),
        caseBlock('k2', [arm('a2', '1', [proc('y')])], branch('o2', [proc('z')])),
      ]),
    );
    expect(validSelection(cases, { kind: 'missingDefault', block: 'k1' })).not.toBeNull();
    expect(validSelection(cases, { kind: 'missingDefault', block: 'k2' })).toBeNull();
    expect(validSelection(cases, { kind: 'missingDefault', block: 'x' })).toBeNull();
    expect(validSelection(cases, { kind: 'head', diagram: 'd1' })).toBeNull();
    expect(validSelection(cases, { kind: 'fold', fold: 'f1' })).toBeNull();
  });

  it('T-0678: the diagram and the main block of each kind of selection', () => {
    expect(diagramOf(index, null)).toBeNull();
    expect(diagramOf(index, selectBlock(index, 'z'))).toBe('d2');
    expect(diagramOf(index, { kind: 'head', diagram: 'd2' })).toBe('d2');
    expect(diagramOf(index, { kind: 'branchLabel', branch: 'r2' })).toBe('d1');
    expect(diagramOf(index, { kind: 'branchLabel', branch: 'nope' })).toBeNull();
    expect(diagramOf(index, { kind: 'missingDefault', block: 'b1' })).toBe('d1');
    expect(diagramOf(index, { kind: 'fold', fold: 'f1' })).toBeNull();
    expect(focusBlock(index, null)).toBeNull();
    expect(focusBlock(index, selectRange(index, 'a', 'w1'))).toBe('w1');
    expect(focusBlock(index, { kind: 'branchLabel', branch: 'r1' })).toBe('b1');
    expect(focusBlock(index, { kind: 'missingDefault', block: 'b1' })).toBe('b1');
    expect(focusBlock(index, { kind: 'head', diagram: 'd2' })).toBeNull();
  });

  it('T-0679 · R-EDIT-05: Shift+click from a selection that is not a block range selects only that block', () => {
    expect(extendTo(index, null, 'c')).toEqual(selectBlock(index, 'c'));
    expect(extendTo(index, { kind: 'branchLabel', branch: 'r1' }, 'c')).toEqual(
      selectBlock(index, 'c'),
    );
    const gone = {
      kind: 'blocks',
      seq: { owner: 'd1', slot: 'body' },
      anchor: 'x',
      focus: 'x',
    } as const;
    expect(extendTo(index, gone, 'c')).toEqual(selectBlock(index, 'c'));
    expect(extendBy(index, { kind: 'head', diagram: 'd1' }, 'down')).toBeNull();
  });
});
