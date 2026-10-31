import type { Arm, Branch, Case, Content, Id, If } from '../model/types';
import { done, fail, freshArmLabel, idsFor } from './common';
import { emptySeq } from './seq-edit';
import { indexContent, replaceBlock } from './tree';
import type { BlockEntry, BranchEntry } from './tree';
import type { Result, Side, WithIds } from './types';

/** Arguments of `insertBranch`. */
export type InsertBranchArgs = WithIds & {
  /** The branch whose label is selected. */
  readonly branch: Id;
  readonly side: Side;
};

/**
 * Inserts a new Case branch after (or before) the selected branch (R-EDIT-11, UX Q10 · Q5).
 * The default branch stays last, so "after the default" inserts right before it. The new branch
 * holds an empty block and gets a number label not used yet; the editor opens its label.
 * On an If this is refused with `askConvertIfToCase` (UX MD3). Touched: the new branch.
 */
export function insertBranch(content: Content, args: InsertBranchArgs): Result {
  const found = findBranch(content, args.branch);
  if (!('entry' in found)) {
    return found;
  }
  const { entry, owner } = found;
  const block = entry.block;
  if (block.kind === 'if') {
    return fail('askConvertIfToCase', block.id);
  }
  const ids = idsFor(content, args);
  const arm: Arm = {
    id: ids.next('branch'),
    label: freshArmLabel(block.arms),
    body: emptySeq(ids),
  };
  const at =
    entry.slot === 'otherwise'
      ? block.arms.length
      : args.side === 'after'
        ? entry.armIndex + 1
        : entry.armIndex;
  const arms = [...block.arms.slice(0, at), arm, ...block.arms.slice(at)];
  return done(
    replaceBlock(content, owner, () => ({ ...block, arms })),
    [arm.id],
  );
}

/** Arguments of `deleteBranch`. */
export type DeleteBranchArgs = {
  readonly branch: Id;
};

/**
 * Deletes a Case branch with its blocks (R-EDIT-11, UX MD3). The default branch and the last
 * non-default branch cannot be deleted, nor can an If branch. When one non-default branch and
 * the default are left, the note `offerConvertCaseToIf` asks whether to make it an If.
 * Touched: the Case.
 */
export function deleteBranch(content: Content, args: DeleteBranchArgs): Result {
  const found = findBranch(content, args.branch);
  if (!('entry' in found)) {
    return found;
  }
  const { entry, owner } = found;
  const block = entry.block;
  if (block.kind === 'if') {
    return fail('ifBranchesFixed', args.branch);
  }
  if (entry.slot === 'otherwise') {
    return fail('defaultBranchFixed', args.branch);
  }
  if (block.arms.length <= 1) {
    return fail('lastArm', args.branch);
  }
  const arms = block.arms.filter((arm) => arm.id !== args.branch);
  const next = replaceBlock(content, owner, () => ({ ...block, arms }));
  return arms.length === 1 && block.otherwise !== null
    ? done(next, [block.id], { kind: 'offerConvertCaseToIf', node: block.id })
    : done(next, [block.id]);
}

/** Arguments of `convertCaseToIf` and `convertIfToCase`. */
export type ConvertArgs = WithIds & {
  readonly block: Id;
};

/**
 * Turns a Case with one branch and a default into an If (UX MD3): the condition is the Case's
 * text, the true branch is that branch (its label too), and the false branch is the default.
 * The block and branch ids stay. How to rewrite the text is undecided (01-model, open questions),
 * so the text is kept as it is. Touched: the block.
 */
export function convertCaseToIf(content: Content, args: ConvertArgs): Result {
  const entry = indexContent(content).blocks.get(args.block);
  if (entry === undefined) {
    return fail('notFound', args.block);
  }
  const block = entry.block;
  if (block.kind !== 'case') {
    return fail('wrongKind', args.block);
  }
  const [arm] = block.arms;
  if (block.arms.length !== 1 || arm === undefined || block.otherwise === null) {
    return fail('notConvertible', args.block);
  }
  const yes: Branch =
    arm.label === ''
      ? { id: arm.id, body: arm.body }
      : { id: arm.id, label: arm.label, body: arm.body };
  const no: Branch = { id: block.otherwise.id, body: block.otherwise.body };
  const converted: If = { id: block.id, kind: 'if', text: block.text, yes, no };
  return done(
    replaceBlock(content, entry, () => converted),
    [block.id],
  );
}

/**
 * Turns an If into a Case and inserts one branch, as asked after inserting a branch on an If
 * (UX MD3): the true branch becomes the first branch (labelled `1` if it had no label), a new
 * empty branch comes second, and the false branch becomes the default (its label is dropped,
 * since the default's label is fixed). The block and branch ids stay. Touched: the new branch.
 */
export function convertIfToCase(content: Content, args: ConvertArgs): Result {
  const entry = indexContent(content).blocks.get(args.block);
  if (entry === undefined) {
    return fail('notFound', args.block);
  }
  const block = entry.block;
  if (block.kind !== 'if') {
    return fail('wrongKind', args.block);
  }
  const ids = idsFor(content, args);
  const first: Arm = { id: block.yes.id, label: block.yes.label ?? '1', body: block.yes.body };
  const added: Arm = { id: ids.next('branch'), label: freshArmLabel([first]), body: emptySeq(ids) };
  const converted: Case = {
    id: block.id,
    kind: 'case',
    text: block.text,
    arms: [first, added],
    otherwise: { id: block.no.id, body: block.no.body },
  };
  return done(
    replaceBlock(content, entry, () => converted),
    [added.id],
  );
}

/** Arguments of `addDefaultBranch`. */
export type AddDefaultBranchArgs = WithIds & {
  /** The Case without a default branch. */
  readonly block: Id;
};

/**
 * Gives a Case without a default branch an empty default branch (UX CD1). The editor runs this
 * when the user types into or inserts on the drawn empty default cell, together with that edit as
 * one undo step. Touched: the new branch, then its empty block.
 */
export function addDefaultBranch(content: Content, args: AddDefaultBranchArgs): Result {
  const entry = indexContent(content).blocks.get(args.block);
  if (entry === undefined) {
    return fail('notFound', args.block);
  }
  const block = entry.block;
  if (block.kind !== 'case' || block.otherwise !== null) {
    return fail('wrongKind', args.block);
  }
  const ids = idsFor(content, args);
  const otherwise: Branch = { id: ids.next('branch'), body: emptySeq(ids) };
  const [first] = otherwise.body.blocks;
  return done(
    replaceBlock(content, entry, () => ({ ...block, otherwise })),
    first === undefined ? [otherwise.id] : [otherwise.id, first.id],
  );
}

type FoundBranch = { readonly entry: BranchEntry; readonly owner: BlockEntry };

function findBranch(content: Content, branch: Id): FoundBranch | Result {
  const index = indexContent(content);
  const entry = index.branches.get(branch);
  if (entry === undefined) {
    return fail('notFound', branch);
  }
  const owner = index.blocks.get(entry.block.id);
  if (owner === undefined) {
    throw new Error(`Branch ${branch} has no indexed block`);
  }
  return { entry, owner };
}
