import { describe, expect, it } from 'vitest';

import {
  addDefaultBranch,
  convertCaseToIf,
  convertIfToCase,
  deleteBranch,
  insertBranch,
} from './branch';
import {
  arm,
  blockOf,
  branch,
  caseBlock,
  contentOf,
  empty,
  expectRefused,
  ifBlock,
  proc,
  runOk,
  seq,
} from './test-support';

const labels = (content: Parameters<typeof blockOf>[0]): ReadonlyArray<string> | null => {
  const block = blockOf(content, 'b1');
  return block.kind === 'case' ? block.arms.map((a) => a.label) : null;
};

describe('Case branches', () => {
  const content = contentOf([
    caseBlock(
      'b1',
      [arm('r1', '1', [proc('b2')]), arm('r2', '2', [proc('b3')])],
      branch('r3', [proc('b4')]),
    ),
  ]);

  it('T-0054 · R-EDIT-11: inserts a branch after or before the selected one, with an unused number label', () => {
    const after = runOk(insertBranch, content, { branch: 'r1', side: 'after' });
    expect(labels(after.content)).toEqual(['1', '3', '2']);
    expect(after.touched).toEqual(['r4']);
    const before = runOk(insertBranch, content, { branch: 'r1', side: 'before' });
    expect(labels(before.content)).toEqual(['3', '1', '2']);
  });

  it('T-0055 · R-EDIT-11: a branch inserted after the default goes right before it', () => {
    const result = runOk(insertBranch, content, { branch: 'r3', side: 'after' });
    expect(labels(result.content)).toEqual(['1', '2', '3']);
    const made = blockOf(result.content, 'b1');
    expect(made.kind === 'case' ? made.otherwise?.id : null).toBe('r3');
  });

  it('T-0056 · R-EDIT-11 (UX MD3): inserting a branch on an If asks to convert it to a Case', () => {
    const ifContent = contentOf([
      ifBlock('b1', branch('r1', [proc('b2')]), branch('r2', [proc('b3')])),
    ]);
    expectRefused(insertBranch, ifContent, { branch: 'r1', side: 'after' }, 'askConvertIfToCase');
    expectRefused(insertBranch, ifContent, { branch: 'r9', side: 'after' }, 'notFound');
  });

  it('T-0057 · R-EDIT-11: deletes a branch with its blocks; offers If when one branch is left (UX MD3)', () => {
    const result = runOk(deleteBranch, content, { branch: 'r1' });
    expect(labels(result.content)).toEqual(['2']);
    expect(result.touched).toEqual(['b1']);
    expect(result.note).toEqual({ kind: 'offerConvertCaseToIf', node: 'b1' });
  });

  it('T-0058 · R-EDIT-11 (UX MD3): the default and the last branch cannot be deleted, nor If branches', () => {
    expectRefused(deleteBranch, content, { branch: 'r3' }, 'defaultBranchFixed');
    const one = contentOf([
      caseBlock('b1', [arm('r1', '1', [proc('b2')])], branch('r2', [proc('b3')])),
    ]);
    expectRefused(deleteBranch, one, { branch: 'r1' }, 'lastArm');
    const ifContent = contentOf([
      ifBlock('b1', branch('r1', [proc('b2')]), branch('r2', [proc('b3')])),
    ]);
    expectRefused(deleteBranch, ifContent, { branch: 'r1' }, 'ifBranchesFixed');
  });

  it('T-0059 · R-EDIT-11: deleting from a Case without default gives no offer', () => {
    const noDefault = contentOf([
      caseBlock('b1', [arm('r1', '1', [proc('b2')]), arm('r2', '2', [proc('b3')])], null),
    ]);
    expect(runOk(deleteBranch, noDefault, { branch: 'r2' }).note).toBeUndefined();
  });
});

describe('If and Case conversion (UX MD3)', () => {
  it('T-0060 · R-EDIT-11: a Case with one branch and a default becomes an If, ids kept', () => {
    const content = contentOf([
      caseBlock('b1', [arm('r1', 'RED', [proc('b2')])], branch('r2', [proc('b3')]), 'color'),
    ]);
    const result = runOk(convertCaseToIf, content, { block: 'b1' });
    expect(blockOf(result.content, 'b1')).toEqual(
      ifBlock('b1', branch('r1', [proc('b2')], 'RED'), branch('r2', [proc('b3')]), 'color'),
    );
    expect(result.touched).toEqual(['b1']);
  });

  it('T-0061 · R-EDIT-11: only a Case with exactly one branch and a default converts', () => {
    const two = contentOf([
      caseBlock(
        'b1',
        [arm('r1', '1', [proc('b2')]), arm('r2', '2', [proc('b3')])],
        branch('r3', [proc('b4')]),
      ),
    ]);
    expectRefused(convertCaseToIf, two, { block: 'b1' }, 'notConvertible');
    expectRefused(convertCaseToIf, contentOf([proc('b1')]), { block: 'b1' }, 'wrongKind');
    expectRefused(convertCaseToIf, contentOf([proc('b1')]), { block: 'b2' }, 'notFound');
  });

  it('T-0062 · R-EDIT-11: an If becomes a Case with a new branch between true and default', () => {
    const content = contentOf([
      ifBlock('b1', branch('r1', [proc('b2')]), branch('r2', [proc('b3')], 'no')),
    ]);
    const result = runOk(convertIfToCase, content, { block: 'b1' });
    expect(blockOf(result.content, 'b1')).toEqual(
      caseBlock(
        'b1',
        [arm('r1', '1', [proc('b2')]), { id: 'r3', label: '2', body: seq([empty('b4')]) }],
        branch('r2', [proc('b3')]),
        'c',
      ),
    );
    expect(result.touched).toEqual(['r3']);
    expectRefused(convertIfToCase, contentOf([proc('b1')]), { block: 'b1' }, 'wrongKind');
  });
});

describe('the missing default branch (UX CD1)', () => {
  it('T-0063 · UX CD1: gives a Case without a default an empty default branch', () => {
    const content = contentOf([caseBlock('b1', [arm('r1', '1', [proc('b2')])], null)]);
    const result = runOk(addDefaultBranch, content, { block: 'b1' });
    expect(blockOf(result.content, 'b1')).toEqual(
      caseBlock('b1', [arm('r1', '1', [proc('b2')])], branch('r2', [empty('b3')])),
    );
    expect(result.touched).toEqual(['r2', 'b3']);
  });

  it('T-0064 · UX CD1: refuses a Case that has a default, other blocks and unknown ids', () => {
    const withDefault = contentOf([
      caseBlock('b1', [arm('r1', '1', [proc('b2')])], branch('r2', [proc('b3')])),
    ]);
    expectRefused(addDefaultBranch, withDefault, { block: 'b1' }, 'wrongKind');
    expectRefused(addDefaultBranch, contentOf([proc('b1')]), { block: 'b1' }, 'wrongKind');
    expectRefused(addDefaultBranch, contentOf([proc('b1')]), { block: 'b9' }, 'notFound');
  });
});
