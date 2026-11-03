import type { Block, Branch, Content, Id } from '../model/types';
import { done, fail, unchanged } from './common';
import { renameFold, siteFoldOf } from './fold';
import { indexContent, replaceBlock } from './tree';
import type { Result } from './types';

/** Arguments of `editText`. */
export type EditTextArgs = {
  /** A block (its text), a branch of an If or Case (its label), or a fold region (its name). */
  readonly node: Id;
  readonly text: string;
};

/**
 * Sets the text of a block or the label of a branch (R-EDIT-01, R-EDIT-12).
 * The editor runs this once when the inline editor closes, so one edit is one undo step
 * (01-model 4.4, UX MD2).
 * - An If branch label set to `''` is removed, so the editor shows its own "true" / "false".
 * - A Case branch label cannot be empty (the editor puts the label back), and the default
 *   branch's label cannot be edited.
 * - A fold region's name: `renameFold` (`''` removes it, R-EDIT-23).
 * - Header text and call block arguments have commands of their own.
 * The same text as before leaves the content as it is. Touched: the node.
 */
export function editText(content: Content, args: EditTextArgs): Result {
  const index = indexContent(content);
  const block = index.blocks.get(args.node);
  if (block !== undefined) {
    if (block.block.kind === 'call') {
      return fail('unsupported', args.node);
    }
    if (block.block.text === args.text) {
      return unchanged(content, [args.node]);
    }
    const next = replaceBlock(content, block, (old) => withText(old, args.text));
    return done(next, [args.node]);
  }

  const branch = index.branches.get(args.node);
  if (branch === undefined) {
    if (index.folds.has(args.node) || siteFoldOf(content, args.node) !== null) {
      return renameFold(content, { fold: args.node, name: args.text });
    }
    return index.diagrams.has(args.node)
      ? fail('unsupported', args.node)
      : fail('notFound', args.node);
  }
  if (branch.slot === 'otherwise') {
    return fail('defaultLabelFixed', args.node);
  }
  if (branch.slot === 'arm' && args.text === '') {
    return fail('emptyLabel', args.node);
  }
  if ((branch.branch.label ?? '') === args.text) {
    return unchanged(content, [args.node]);
  }
  const owner = index.blocks.get(branch.block.id);
  if (owner === undefined) {
    throw new Error(`Branch ${args.node} has no indexed block`);
  }
  const next = replaceBlock(content, owner, (old) => withLabel(old, args.node, args.text));
  return done(next, [args.node]);
}

function withText(block: Block, text: string): Block {
  switch (block.kind) {
    case 'call':
      return block;
    case 'process':
    case 'if':
    case 'case':
    case 'while':
    case 'doWhile':
    case 'for':
      return { ...block, text };
  }
}

function withLabel(block: Block, branch: Id, label: string): Block {
  if (block.kind === 'if') {
    const relabel = (b: Branch): Branch => {
      if (b.id !== branch) {
        return b;
      }
      return label === '' ? { id: b.id, body: b.body } : { ...b, label };
    };
    return { ...block, yes: relabel(block.yes), no: relabel(block.no) };
  }
  if (block.kind === 'case') {
    return {
      ...block,
      arms: block.arms.map((arm) => (arm.id === branch ? { ...arm, label } : arm)),
    };
  }
  return block;
}
