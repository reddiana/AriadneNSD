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
import type { Selection } from '../state/selection';
import { selectBlock } from '../state/selection';
import type { Navigation } from './navigate';
import { navigate } from './navigate';

// a; if b1 { yes: c, d | no: e }; f; while w1 { g }
const content = contentOf([
  proc('a'),
  ifBlock('b1', branch('r1', [proc('c'), proc('d')]), branch('r2', [proc('e')])),
  proc('f'),
  whileBlock('w1', [proc('g')]),
]);
const index = indexDoc(content);

const from = (id: string, navigation: Navigation): Selection | string => {
  const result = navigate(index, selectBlock(index, id), null, navigation);
  if (result.kind === 'stay') {
    return result.reason ?? 'stay';
  }
  const selection = result.selection;
  switch (selection.kind) {
    case 'blocks':
      return selection.focus;
    case 'branchLabel':
      return `label:${selection.branch}`;
    case 'missingDefault':
      return `missing:${selection.block}`;
    case 'head':
    case 'fold':
      return selection.kind;
  }
};
const step = (direction: 'up' | 'down' | 'left' | 'right'): Navigation => ({
  kind: 'step',
  direction,
});

describe('keyboard navigation (03-editor 2.2)', () => {
  it('T-0252 · R-EDIT-03: Down goes in drawn order but never into a side branch', () => {
    expect(from('a', step('down'))).toBe('b1');
    expect(from('b1', step('down'))).toBe('c');
    expect(from('d', step('down'))).toBe('f');
    expect(from('e', step('down'))).toBe('f');
  });

  it('T-0253 · UX ND1: Down with nothing below selects the block holding this one; at the top, it stays', () => {
    expect(from('g', step('down'))).toBe('w1');
    // From the While, Down goes into its body again, as from any control block.
    expect(from('w1', step('down'))).toBe('g');
    const flat = indexDoc(contentOf([proc('x'), proc('y')]));
    const last = navigate(flat, selectBlock(flat, 'y'), null, step('down'));
    expect(last.kind).toBe('stay');
  });

  it('T-0254 · R-EDIT-03 (UX Q10): Up from the first block of a branch selects its label, then the If', () => {
    expect(from('c', step('up'))).toBe('label:r1');
    const label = navigate(index, { kind: 'branchLabel', branch: 'r1' }, null, step('up'));
    expect(label.kind === 'select' ? label.selection : null).toEqual(selectBlock(index, 'b1'));
  });

  it('T-0255 · R-EDIT-03: Up from below an If lands at the bottom of its leftmost branch', () => {
    expect(from('f', step('up'))).toBe('d');
    expect(from('d', step('up'))).toBe('c');
  });

  it('T-0256 · R-EDIT-03 (UX Q11): Left and Right cross branches, then leave the If', () => {
    expect(from('c', step('right'))).toBe('e');
    expect(from('d', step('right'))).toBe('e');
    expect(from('e', step('left'))).toBe('c');
    expect(from('c', step('left'))).toBe('b1');
    expect(from('e', step('right'))).toBe('f');
    expect(from('b1', step('right'))).toBe('c');
    expect(from('w1', step('right'))).toBe('g');
    expect(from('g', step('left'))).toBe('w1');
    expect(from('a', step('left'))).toBe('stay');
  });

  it('T-0257 · R-EDIT-03: on a branch label, Left and Right go to the next label, Down into the branch', () => {
    const fromLabel = (direction: 'up' | 'down' | 'left' | 'right') =>
      navigate(index, { kind: 'branchLabel', branch: 'r1' }, null, step(direction));
    expect(fromLabel('right')).toEqual({
      kind: 'select',
      selection: { kind: 'branchLabel', branch: 'r2' },
    });
    expect(fromLabel('left')).toEqual({ kind: 'stay', reason: 'leftmostBranch' });
    expect(fromLabel('down')).toEqual({ kind: 'select', selection: selectBlock(index, 'c') });
  });

  it('T-0258 · R-EDIT-03: Ctrl+Up / Down treat a control block as one block', () => {
    expect(from('f', { kind: 'unit', direction: 'up' })).toBe('b1');
    expect(from('a', { kind: 'unit', direction: 'down' })).toBe('b1');
    expect(from('d', { kind: 'unit', direction: 'down' })).toBe('f');
    expect(from('c', { kind: 'unit', direction: 'up' })).toBe('b1');
  });

  it('T-0259 · R-EDIT-03: Ctrl+Left / Right go to the side branch, or up and down outside one', () => {
    expect(from('d', { kind: 'branch', direction: 'right' })).toBe('e');
    expect(from('e', { kind: 'branch', direction: 'right' })).toBe('stay');
    expect(from('a', { kind: 'branch', direction: 'right' })).toBe('b1');
  });

  it('T-0260 · R-EDIT-03: gg and G select the first and last block of the diagram', () => {
    expect(from('e', { kind: 'edge', end: 'first' })).toBe('a');
    expect(from('a', { kind: 'edge', end: 'last' })).toBe('g');
  });

  it('T-0261 · R-EDIT-03: [[ and ]] go to the neighbouring diagram, if there is one', () => {
    expect(from('a', { kind: 'diagram', direction: 'next' })).toBe('noDiagramThere');
    const two = indexDoc(contentOf([proc('a')], [proc('b'), proc('c')]));
    const result = navigate(two, selectBlock(two, 'a'), null, {
      kind: 'diagram',
      direction: 'next',
    });
    expect(result).toEqual({ kind: 'select', selection: selectBlock(two, 'b') });
  });

  it('T-0262: interaction rules 2: with nothing selected, a move key starts at the last selected block', () => {
    expect(navigate(index, null, 'e', step('down'))).toEqual({
      kind: 'select',
      selection: selectBlock(index, 'e'),
    });
    expect(navigate(index, null, null, step('down'))).toEqual({
      kind: 'select',
      selection: selectBlock(index, 'a'),
    });
  });

  it('T-0263 · UX CD1: the empty default cell of a Case is reached from the last branch', () => {
    const cases = indexDoc(
      contentOf([
        caseBlock('k1', [arm('r1', '1', [proc('x')]), arm('r2', '2', [proc('y')])], null),
        proc('z'),
      ]),
    );
    const right = navigate(cases, selectBlock(cases, 'y'), null, step('right'));
    expect(right).toEqual({ kind: 'select', selection: { kind: 'missingDefault', block: 'k1' } });
    const left = navigate(cases, { kind: 'missingDefault', block: 'k1' }, null, step('left'));
    expect(left).toEqual({ kind: 'select', selection: selectBlock(cases, 'y') });
    const down = navigate(cases, { kind: 'missingDefault', block: 'k1' }, null, step('down'));
    expect(down).toEqual({ kind: 'select', selection: selectBlock(cases, 'z') });
  });
});
