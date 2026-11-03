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
    case 'peek':
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
  it('T-0672: interaction rules 2: keys on a header other than the arrows', () => {
    const heads = indexDoc({
      ...contentOf([proc('a')], [proc('b'), proc('c')]),
      diagrams: contentOf([proc('a')], [proc('b'), proc('c')]).diagrams.map((d) => ({
        ...d,
        head: { kind: 'method' as const, text: d.id },
      })),
    });
    const on = (navigation: Navigation): unknown =>
      navigate(heads, { kind: 'head', diagram: 'd2' }, null, navigation);
    expect(on({ kind: 'unit', direction: 'up' })).toEqual({ kind: 'stay' });
    expect(on({ kind: 'unit', direction: 'down' })).toEqual({
      kind: 'select',
      selection: selectBlock(heads, 'b'),
    });
    expect(on({ kind: 'branch', direction: 'left' })).toEqual({ kind: 'stay' });
    expect(on({ kind: 'diagram', direction: 'previous' })).toEqual({
      kind: 'select',
      selection: { kind: 'head', diagram: 'd1' },
    });
    expect(on({ kind: 'diagram', direction: 'next' })).toEqual({
      kind: 'stay',
      reason: 'noDiagramThere',
    });
    expect(on({ kind: 'edge', end: 'first' })).toEqual({
      kind: 'select',
      selection: { kind: 'head', diagram: 'd2' },
    });
    expect(on({ kind: 'edge', end: 'last' })).toEqual({
      kind: 'select',
      selection: selectBlock(heads, 'c'),
    });
    // With nothing selected, a header selected last is selected again.
    expect(navigate(heads, null, 'd2', step('down'))).toEqual({
      kind: 'select',
      selection: { kind: 'head', diagram: 'd2' },
    });
  });

  it('T-0673: 03-editor 2.2: on a branch label, unit keys go from its If block and branch keys from its branch', () => {
    const label: Selection = { kind: 'branchLabel', branch: 'r2' };
    expect(navigate(index, label, null, { kind: 'unit', direction: 'up' })).toEqual({
      kind: 'select',
      selection: selectBlock(index, 'a'),
    });
    // The label is inside its branch: the rightmost branch of a top-level If has no side branch.
    expect(navigate(index, label, null, { kind: 'branch', direction: 'right' })).toEqual({
      kind: 'stay',
    });
    expect(navigate(index, label, null, { kind: 'branch', direction: 'left' })).toEqual({
      kind: 'select',
      selection: selectBlock(index, 'c'),
    });
    expect(navigate(index, label, null, step('up'))).toEqual({
      kind: 'select',
      selection: selectBlock(index, 'b1'),
    });
    expect(navigate(index, { kind: 'branchLabel', branch: 'nope' }, null, step('up'))).toEqual({
      kind: 'stay',
    });
    expect(navigate(index, { kind: 'fold', fold: 'f1' }, null, step('down'))).toEqual({
      kind: 'stay',
    });
  });

  it('T-0674: 03-editor 2.2: { at the top of a diagram stays; inside a block it goes to the holder', () => {
    expect(from('a', { kind: 'unit', direction: 'up' })).toBe('stay');
    expect(from('c', { kind: 'unit', direction: 'up' })).toBe('b1');
    expect(from('w1', { kind: 'unit', direction: 'down' })).toBe('stay');
  });

  it('T-0675 · UX CD1: from the empty default cell, Right with nothing after the Case stays; Ctrl+Left goes to the last branch', () => {
    const cases = indexDoc(contentOf([caseBlock('k1', [arm('r1', '1', [proc('x')])], null)]));
    const missing: Selection = { kind: 'missingDefault', block: 'k1' };
    expect(navigate(cases, missing, null, step('right'))).toEqual({ kind: 'stay' });
    expect(navigate(cases, missing, null, step('up'))).toEqual({
      kind: 'select',
      selection: selectBlock(cases, 'k1'),
    });
    expect(navigate(cases, { kind: 'missingDefault', block: 'x' }, null, step('up'))).toEqual({
      kind: 'stay',
    });
    // The cell is the rightmost column of its Case.
    expect(navigate(cases, missing, null, { kind: 'branch', direction: 'left' })).toEqual({
      kind: 'select',
      selection: selectBlock(cases, 'x'),
    });
    expect(navigate(cases, missing, null, { kind: 'branch', direction: 'right' })).toEqual({
      kind: 'stay',
    });
  });

  it('T-0799 · BUG-12: Ctrl+→ on a branch label goes to the next branch of that If · Case, not from the If · Case block', () => {
    // a; if b1 { yes: case k1 { 1: x | 2: y | default: empty } | no: e }
    const nested = indexDoc(
      contentOf([
        proc('a'),
        ifBlock(
          'b1',
          branch('r1', [
            caseBlock('k1', [arm('m1', '1', [proc('x')]), arm('m2', '2', [proc('y')])], null),
          ]),
          branch('r2', [proc('e')]),
        ),
      ]),
    );
    const ctrl = (selection: Selection, direction: 'left' | 'right'): unknown =>
      navigate(nested, selection, null, { kind: 'branch', direction });
    const label = (id: string): Selection => ({ kind: 'branchLabel', branch: id });
    const missing: Selection = { kind: 'missingDefault', block: 'k1' };
    const selected = (id: string) => ({ kind: 'select', selection: selectBlock(nested, id) });
    // The true label of an If goes to the false branch, the false label to the outer side (none).
    expect(ctrl(label('r1'), 'right')).toEqual(selected('e'));
    expect(ctrl(label('r2'), 'left')).toEqual(selected('k1'));
    expect(ctrl(label('r2'), 'right')).toEqual({ kind: 'stay' });
    // Case arm labels: the next arm, the empty default cell, or the outer If's side branch.
    expect(ctrl(label('m1'), 'right')).toEqual(selected('y'));
    expect(ctrl(label('m2'), 'right')).toEqual({
      kind: 'select',
      selection: { kind: 'missingDefault', block: 'k1' },
    });
    expect(ctrl(label('m1'), 'left')).toEqual({ kind: 'stay' });
    // The empty default cell is the Case's rightmost column.
    expect(ctrl(missing, 'left')).toEqual(selected('y'));
    expect(ctrl(missing, 'right')).toEqual(selected('e'));
  });
});
