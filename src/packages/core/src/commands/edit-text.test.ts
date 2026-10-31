import { describe, expect, it } from 'vitest';

import { editText } from './edit-text';
import {
  arm,
  blockOf,
  branch,
  caseBlock,
  contentOf,
  expectRefused,
  ifBlock,
  proc,
  runOk,
  whileBlock,
} from './test-support';

describe('editText', () => {
  it('R-EDIT-01: sets the text of a block, keeping the rest', () => {
    const content = contentOf([proc('b1'), whileBlock('b2', [proc('b3')], 'old')]);
    const result = runOk(editText, content, { node: 'b2', text: 'i < n' });
    expect(blockOf(result.content, 'b2')).toMatchObject({ kind: 'while', text: 'i < n' });
    expect(result.touched).toEqual(['b2']);
    // Structural sharing: the untouched block is the same object (ADR-0029).
    expect(blockOf(result.content, 'b1')).toBe(blockOf(content, 'b1'));
  });

  it('01-model 4.4: the same text leaves the content as it is', () => {
    const content = contentOf([proc('b1', 'x')]);
    expect(runOk(editText, content, { node: 'b1', text: 'x' }).content).toBe(content);
  });

  it('R-EDIT-12: sets and clears an If branch label', () => {
    const content = contentOf([
      ifBlock('b1', branch('r1', [proc('b2')]), branch('r2', [proc('b3')], 'no')),
    ]);
    const set = runOk(editText, content, { node: 'r1', text: 'found' });
    expect(blockOf(set.content, 'b1')).toMatchObject({ yes: { id: 'r1', label: 'found' } });
    expect(set.touched).toEqual(['r1']);
    const cleared = runOk(editText, content, { node: 'r2', text: '' });
    const ifNode = blockOf(cleared.content, 'b1');
    expect(ifNode.kind === 'if' ? 'label' in ifNode.no : null).toBe(false);
  });

  it('R-EDIT-11: sets a Case branch label but not an empty one, nor the default label', () => {
    const content = contentOf([
      caseBlock('b1', [arm('r1', '1', [proc('b2')])], branch('r2', [proc('b3')])),
    ]);
    const result = runOk(editText, content, { node: 'r1', text: 'RED' });
    expect(blockOf(result.content, 'b1')).toMatchObject({ arms: [{ id: 'r1', label: 'RED' }] });
    expectRefused(editText, content, { node: 'r1', text: '' }, 'emptyLabel');
    expectRefused(editText, content, { node: 'r2', text: 'other' }, 'defaultLabelFixed');
  });

  it('R-EDIT-01: refuses a missing node, a diagram header and call blocks (later features)', () => {
    const content = contentOf([
      proc('b1'),
      {
        id: 'b2',
        kind: 'call',
        target: { kind: 'named', name: 'f' },
        args: '',
        result: '',
        siteFolds: [],
      },
    ]);
    expectRefused(editText, content, { node: 'b9', text: 'x' }, 'notFound');
    expectRefused(editText, content, { node: 'd1', text: 'x' }, 'unsupported');
    expectRefused(editText, content, { node: 'b2', text: 'x' }, 'unsupported');
  });
});
