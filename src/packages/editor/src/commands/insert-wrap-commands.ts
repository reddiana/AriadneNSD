// The insert, wrap, unwrap and inline commands.
import type { EditorMessage } from '../i18n/messages';
import { message } from '../i18n/messages';
import { indexDoc, isControl, seqOfBlock } from '../model/doc-index';
import type { Selection } from '../state/selection';
import { foldPath, selectedBlocks, targetOf } from '../state/selection';
import { isOpenable } from './fold-commands';
import { spec } from './spec';
import type { BlockKind, Id, NewBlockKind, Side, Target, View } from '@ariadne-nsd/core';
import {
  foldedAfterInline,
  hasOwnSite,
  headName,
  inlineCall,
  insertBlock,
  sitePrefix,
  unwrap,
  wrap,
} from '@ariadne-nsd/core';
import type { CommandContext } from './command-helpers';
import {
  blockKinds,
  wrapKinds,
  kindNames,
  unwrapHolder,
  selectTouched,
  currentDiagram,
  headStart,
  branchTarget,
} from './command-helpers';

export function insertWrapCommands(ctx: CommandContext) {
  const { session, index, content, intoMissingDefault, afterInsert, insertWhen, runInsertBranch } =
    ctx;

  // Insert, wrap.

  const runInsert = (kind: NewBlockKind, side: Side): void => {
    const state = session.state;
    const selection = state.selection;
    if (selection?.kind === 'branchLabel') {
      runInsertBranch(selection.branch, side);
      return;
    }
    if (selection?.kind === 'missingDefault') {
      intoMissingDefault(
        selection.block,
        (made, empty, ids) =>
          insertBlock(made, {
            target: { kind: 'blocks', first: empty, last: empty },
            side,
            kind,
            ids,
          }),
        afterInsert,
      );
      return;
    }
    if (selection?.kind === 'head') {
      const start = headStart(index(), selection.diagram);
      if (start !== null) {
        session.commit(insertBlock(content(), { ...start, kind, ids: session.ids() }), afterInsert);
      }
      return;
    }
    const diagram = currentDiagram(index(), state);
    const target: Target | null =
      targetOf(selection) ?? (diagram === null ? null : { kind: 'diagramEnd', diagram });
    if (target === null) {
      session.notify('reason.nothingSelected', 'warn');
      return;
    }
    // o / O put a new block even next to an empty one (UX KP2); a control block fills it.
    session.commit(
      insertBlock(content(), { target, side, kind, ids: session.ids(), besideEmpty: true }),
      afterInsert,
    );
  };

  const insertSpecs = blockKinds.flatMap((kind, order) => [
    spec(`block.insert.${kind}`, {
      edits: true,
      when: insertWhen(kind, 'after'),
      run: () => {
        runInsert(kind, 'after');
      },
      menu: { menu: 'diagram', group: 1, order: order + 11, submenu: 'insert' },
      // For has no toolbar icon: it looks like While and confused people (UX TB1). Keys and menus.
      ...(kind === 'for' ? {} : { toolbar: { group: 4, order: order + 1, icon: `block.${kind}` } }),
      context: ['blocks', 'missingDefault'],
    }),
    spec(`block.insertBefore.${kind}`, {
      edits: true,
      when: insertWhen(kind, 'before'),
      run: () => {
        runInsert(kind, 'before');
      },
      menu: { menu: 'diagram', group: 1, order: order + 1, submenu: 'insertBefore' },
    }),
  ]);

  const wrapSpecs = wrapKinds.map((kind, order) =>
    spec(`block.wrap.${kind}`, {
      edits: true,
      when: (state) => {
        const selection = state.selection;
        if (selection?.kind === 'head') {
          return 'reason.cannotWrapHead';
        }
        // On a branch label the blocks of the branch are wrapped (M87 F7).
        return selection?.kind === 'blocks' ||
          selection?.kind === 'fold' ||
          selection?.kind === 'branchLabel'
          ? true
          : 'reason.nothingSelected';
      },
      run: (state) => {
        const selection = state.selection;
        const target =
          selection?.kind === 'branchLabel'
            ? branchTarget(index(), selection.branch)
            : targetOf(selection);
        if (target === null) {
          return;
        }
        session.commit(wrap(content(), { target, kind, ids: session.ids() }), afterInsert);
      },
      menu: { menu: 'diagram', group: 2, order: order + 1, submenu: 'wrap' },
      context: ['blocks', 'fold', 'branchLabel'],
    }),
  );

  const unwrapSpec = spec('block.unwrap', {
    edits: true,
    // Greyed out when nothing would come off: same checks as core's `unwrap`, read from the index.
    when: (state) => {
      if (state.selection?.kind === 'head') {
        return 'reason.notOnHead';
      }
      if (unwrapHolder(index(), state.selection) !== null) {
        return true;
      }
      if (state.selection?.kind === 'fold' && foldPath(state.selection).length === 0) {
        return index().folds.has(state.selection.fold)
          ? 'reason.noControlBlock'
          : 'reason.nothingSelected';
      }
      if (state.selection?.kind !== 'blocks') {
        return 'reason.nothingSelected';
      }
      const ix = index();
      const selected = selectedBlocks(ix, state.selection);
      const [first] = selected;
      if (first === undefined) {
        return 'reason.nothingSelected';
      }
      const firstBlock = ix.blocks.get(first)?.block;
      if (selected.length === 1 && firstBlock?.kind === 'call') {
        return isOpenable(ix, first) ? true : 'reason.notCallable';
      }
      if (selected.length === 1 && firstBlock !== undefined && isControl(firstBlock)) {
        return true;
      }
      return seqOfBlock(ix, first).holder === null ? 'reason.noControlBlock' : true;
    },
    run: (state) => {
      const ix = index();
      const outer = unwrapHolder(ix, state.selection);
      if (outer !== null) {
        runUnwrapHolder(outer, state.selection);
        return;
      }
      const target = targetOf(state.selection);
      if (target === null) {
        return;
      }
      const selected = selectedBlocks(ix, state.selection);
      const [only] = selected;
      const onlyBlock = only === undefined ? undefined : ix.blocks.get(only)?.block;
      if (selected.length === 1 && onlyBlock?.kind === 'call') {
        runInline(onlyBlock.id, state.doc.view);
        return;
      }
      const isWhole = selected.length === 1 && onlyBlock !== undefined && isControl(onlyBlock);
      // Which block goes: the selected control block, or the nearest one holding the selection.
      const holder = only === undefined ? null : seqOfBlock(ix, only).holder;
      const removed = isWhole
        ? onlyBlock
        : holder === null
          ? undefined
          : ix.blocks.get(holder)?.block;
      const isApplied = session.commit(unwrap(content(), { target, ids: session.ids() }), (ok) => ({
        selection: isWhole ? selectTouched(ok.content, ok.touched) : state.selection,
      }));
      if (isApplied && removed !== undefined) {
        session.notify(unwrappedNotice(removed.kind));
      }
    },
    menu: { menu: 'diagram', group: 2, order: 10 },
    context: ['blocks', 'branchLabel', 'fold', 'missingDefault'],
  });

  /**
   * Takes off the control block `holder` around a selection that is not a block range (UX Q8). A
   * fold region comes out with its blocks and stays selected; a branch label or the empty default
   * cell goes with the block, so what came out is selected instead.
   */
  const runUnwrapHolder = (holder: Id, selection: Selection | null): void => {
    const removed = index().blocks.get(holder)?.block;
    const result = unwrap(content(), {
      target: { kind: 'blocks', first: holder, last: holder },
      ids: session.ids(),
    });
    const isApplied = session.commit(result, (ok) => ({
      selection:
        selection?.kind === 'fold' && indexDoc(ok.content).folds.has(selection.fold)
          ? selection
          : selectTouched(ok.content, ok.touched),
    }));
    if (isApplied && removed !== undefined) {
      session.notify(unwrappedNotice(removed.kind));
    }
  };

  /**
   * Replaces a call block with its Method's blocks (R-EDIT-08). The copies show the way the
   * Method's blocks were shown at this call: folded as they were here, the regions of this call
   * site folded as they were, calls opened inside it still opened (UX CB8, ADR-0046).
   */
  const runInline = (call: Id, view: View): void => {
    const block = index().blocks.get(call)?.block;
    const target = block?.kind === 'call' ? block.target : null;
    const head =
      target?.kind === 'local' ? (index().diagrams.get(target.diagram)?.head ?? null) : null;
    const result = inlineCall(content(), {
      block: call,
      ids: session.ids(),
      ownRegions: hasOwnSite(new Set(view.folded), sitePrefix([call])),
    });
    if (!result.ok) {
      session.refuse(result.reason);
      return;
    }
    const renamed = result.renamed;
    const folded = foldedAfterInline(content(), view, call, renamed);
    const opened = view.opened.flatMap((path) => {
      if (path[0] !== call) {
        return [path];
      }
      const [inner, ...rest] = path.slice(1);
      const copy = inner === undefined ? undefined : renamed.get(inner);
      return copy === undefined ? [] : [[copy, ...rest]];
    });
    const isApplied = session.commit(result, (ok) => ({
      selection: selectTouched(ok.content, ok.touched),
      view: { ...view, folded, opened },
    }));
    if (isApplied) {
      session.notify(message('notice.inlined', { name: head === null ? '' : headName(head) }));
    }
  };

  return { insertSpecs, wrapSpecs, unwrapSpec };
}

/** The notice after unwrapping a block of this kind. */
function unwrappedNotice(kind: BlockKind): EditorMessage {
  // The new kinds have names in the screen language, so they have notices of their own.
  if (kind === 'endless') {
    return 'notice.unwrappedEndless';
  }
  if (kind === 'parallel') {
    return 'notice.unwrappedParallel';
  }
  return message('notice.unwrapped', { kind: kindNames[kind] ?? kind });
}
