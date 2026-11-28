// The branch commands.
import type { CommandSpec } from '../contracts';
import { indexDoc } from '../model/doc-index';
import type { EditorState } from '../state/editor-state';
import { selectBlock } from '../state/selection';
import type { Applies } from './spec';
import { spec } from './spec';
import type { Id, Side } from '@ariadne-nsd/core';
import { convertCaseToIf, convertIfToCase, deleteBranch } from '@ariadne-nsd/core';
import type { CommandContext } from './command-helpers';
import {
  afterBranchDelete,
  appliesIf,
  blockArg,
  branchOfSelection,
  oneBlock,
} from './command-helpers';

export function branchCommands(ctx: CommandContext) {
  const { session, index, content, runInsertBranch } = ctx;

  // Branches.
  const branchInsertSpec = (side: Side, id: string, order: number): CommandSpec =>
    spec(id, {
      edits: true,
      when: (state) => appliesIf(branchOfSelection(index(), state.selection)),
      run: (state) => {
        const branch = branchOfSelection(index(), state.selection);
        if ('value' in branch) {
          runInsertBranch(branch.value, side);
        }
      },
      menu: { menu: 'diagram', group: 3, order },
      context: ['branchLabel'],
    });

  const branchDeleteSpec = spec('branch.delete', {
    edits: true,
    when: (state) => appliesIf(branchOfSelection(index(), state.selection)),
    run: (state) => {
      const branch = branchOfSelection(index(), state.selection);
      const place = 'value' in branch ? index().branches.get(branch.value) : undefined;
      if (place === undefined) {
        return;
      }
      session.commit(
        deleteBranch(content(), { branch: place.branch.id }),
        afterBranchDelete(place),
      );
    },
    menu: { menu: 'diagram', group: 3, order: 3 },
    context: ['branchLabel'],
  });

  /** The If or Case a convert command acts on: the argument, the selected block or label. */
  const convertTarget = (state: EditorState, args: unknown): Id | null => {
    const fromArgs = blockArg(args);
    if (fromArgs !== null) {
      return fromArgs;
    }
    const selection = state.selection;
    if (selection?.kind === 'branchLabel') {
      return index().branches.get(selection.branch)?.block.id ?? null;
    }
    const block = oneBlock(index(), selection);
    return 'value' in block ? block.value : null;
  };

  const convertIfSpec = spec('branch.convertIfToCase', {
    edits: true,
    when: (state) => {
      const id = convertTarget(state, undefined);
      return id !== null && index().blocks.get(id)?.block.kind === 'if' ? true : 'reason.notIf';
    },
    run: (state, args) => {
      const block = convertTarget(state, args);
      if (block === null) {
        return;
      }
      session.commit(convertIfToCase(content(), { block, ids: session.ids() }), (ok) => {
        const [made] = ok.touched;
        return made === undefined
          ? { selection: selectBlock(indexDoc(ok.content), block) }
          : {
              selection: { kind: 'branchLabel', branch: made },
              edit: { field: { kind: 'branchLabel', branch: made }, caret: 'selectAll' },
            };
      });
    },
  });

  /** Whether "Case를 If로 바꾸기" applies: a Case with one branch and the default (UX MD3). */
  const convertCaseWhen = (state: EditorState): Applies => {
    const id = convertTarget(state, undefined);
    const block = id === null ? undefined : index().blocks.get(id)?.block;
    return block?.kind === 'case' && block.arms.length === 1 && block.otherwise !== null
      ? true
      : 'reason.notConvertible';
  };

  // No longer asked after deleting a branch: a command of its own (M87 F6).
  const convertCaseSpec = spec('branch.convertCaseToIf', {
    edits: true,
    when: convertCaseWhen,
    run: (state, args) => {
      const block = convertTarget(state, args);
      if (block !== null) {
        session.commit(convertCaseToIf(content(), { block }), (ok) => ({
          selection: selectBlock(indexDoc(ok.content), block),
        }));
      }
    },
    menu: { menu: 'diagram', group: 3, order: 4 },
    context: ['blocks', 'branchLabel'],
    inContext: (state) => convertCaseWhen(state) === true,
  });

  return { branchInsertSpec, branchDeleteSpec, convertIfSpec, convertCaseSpec };
}
