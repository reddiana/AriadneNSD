// The clipboard commands: copy, cut, paste and delete.
import {
  clipFromJson,
  clipFromText,
  clipNamesFromJson,
  clipToJson,
  clipToText,
  diagramFromJson,
  diagramToJson,
  diagramToText,
} from '../clipboard/clip-format';
import type { CommandSpec, ToolbarPlace } from '../contracts';
import type { EditorMessage } from '../i18n/messages';
import { message } from '../i18n/messages';
import { indexDoc } from '../model/doc-index';
import type { After } from '../session/session';
import type { Selection } from '../state/selection';
import {
  diagramOf,
  foldPath,
  peekBlocks,
  selectBlock,
  selectedBlocks,
  targetOf,
} from '../state/selection';
import { regionPlace } from './fold-commands';
import { spec } from './spec';
import type { CallTextContext, Clip, Content, Diagram, Id, Side, Target } from '@ariadne-nsd/core';
import { copy, cut, deleteBlocks, deleteBranch, paste, pasteDiagram } from '@ariadne-nsd/core';
import type { CommandContext } from './command-helpers';
import {
  afterBranchDelete,
  afterHead,
  branchTarget,
  currentDiagram,
  emptyOfNewBranch,
  headStart,
  selectionAfterDelete,
  selectTouched,
} from './command-helpers';

export function clipboardCommands(ctx: CommandContext) {
  const { deps, session, index, content, intoMissingDefault, blocksOnly, pasting } = ctx;
  const { runInsertBranch } = ctx;

  // Clipboard and delete.
  /** How copied blocks are drawn as text: as in the diagram. */
  const drawn = (): CallTextContext => ({
    // The fixed words as drawn: in the document's drawing language (ADR-0041).
    locale: content().settings.locale,
    resultSymbol: session.state.doc.view.resultSymbol,
    diagrams: new Map(content().diagrams.map((diagram) => [diagram.id, diagram])),
  });
  const write = async (text: string, json: string, notice: EditorMessage): Promise<void> => {
    const where = await deps.clipboard.write({ text, json });
    session.notify(where === 'memory' ? 'notice.clipboardLocal' : notice);
  };
  const writeClip = (clip: Clip, notice: EditorMessage): Promise<void> =>
    write(clipToText(clip, drawn()), clipToJson(clip, index().diagrams), notice);
  /** Copy on a header takes the whole diagram (UX HC1). */
  const writeDiagram = (diagram: Diagram): Promise<void> =>
    write(
      diagramToText(diagram, drawn()),
      diagramToJson(diagram, index().diagrams),
      'notice.copiedDiagram',
    );

  /** What copy takes: blocks shown in an opened call, a region shown there, or the selection. */
  const copyTarget = (selection: Selection | null): Target | null => {
    const peeked = peekBlocks(index(), selection);
    const [first] = peeked;
    const last = peeked.at(-1);
    if (first !== undefined && last !== undefined) {
      return { kind: 'blocks', first, last };
    }
    // A branch label: the blocks of the branch (M87 F7).
    if (selection?.kind === 'branchLabel') {
      return branchTarget(index(), selection.branch);
    }
    if (selection?.kind !== 'fold' || foldPath(selection).length === 0) {
      return targetOf(selection);
    }
    const place = regionPlace(index(), selection.fold, foldPath(selection));
    const blocks = place === null ? undefined : index().seqs.get(place.owner)?.seq.blocks;
    const from = place === null ? undefined : blocks?.[place.lo];
    const to = place === null ? undefined : blocks?.[place.hi];
    return from === undefined || to === undefined
      ? null
      : { kind: 'blocks', first: from.id, last: to.id };
  };

  const copySpec = spec('edit.copy', {
    edits: false,
    // Blocks shown in an opened call are copied as the Method has them (R-EDIT-15).
    when: (state) =>
      state.selection?.kind === 'peek' || state.selection?.kind === 'head'
        ? true
        : blocksOnly('reason.nothingToCopy')(state),
    run: async (state) => {
      if (state.selection?.kind === 'head') {
        const diagram = index().diagrams.get(state.selection.diagram);
        if (diagram !== undefined) {
          await writeDiagram(diagram);
        }
        return;
      }
      const target = copyTarget(state.selection);
      if (target === null) {
        session.notify('reason.nothingToCopy', 'warn');
        return;
      }
      const copied = copy(content(), { target });
      if (!copied.ok) {
        session.refuse(copied.reason);
        return;
      }
      await writeClip(copied.clip, message('notice.copied', { count: copied.clip.blocks.length }));
    },
    menu: { menu: 'edit', group: 2, order: 2 },
    toolbar: { group: 3, order: 2, icon: 'edit.copy' },
    context: ['blocks', 'fold', 'peek', 'branchLabel', 'head'],
  });

  /**
   * Cut on a branch label: copies the blocks of the branch and deletes the branch, as delete does
   * there, in one undo step (M87 F7). A branch that cannot be deleted refuses as delete does.
   */
  const cutBranch = async (branch: Id): Promise<void> => {
    const ix = index();
    const place = ix.branches.get(branch);
    const target = branchTarget(ix, branch);
    if (place === undefined || target === null) {
      return;
    }
    const deleted = deleteBranch(content(), { branch });
    if (!deleted.ok) {
      session.refuse(deleted.reason);
      return;
    }
    const copied = copy(content(), { target });
    if (!copied.ok) {
      session.refuse(copied.reason);
      return;
    }
    if (session.commit(deleted, afterBranchDelete(place))) {
      await writeClip(copied.clip, message('notice.cut', { count: copied.clip.blocks.length }));
    }
  };

  const cutSpec = spec('edit.cut', {
    edits: true,
    when: blocksOnly('reason.nothingToCut'),
    run: async (state) => {
      if (state.selection?.kind === 'branchLabel') {
        await cutBranch(state.selection.branch);
        return;
      }
      const target = targetOf(state.selection);
      if (target === null) {
        return;
      }
      const ix = index();
      const next = selectionAfterDelete(ix, selectedBlocks(ix, state.selection));
      const result = cut(content(), { target, ids: session.ids() });
      if (!result.ok) {
        session.refuse(result.reason);
        return;
      }
      const isApplied = session.commit(result, (ok) => ({
        selection:
          next !== null
            ? selectBlock(indexDoc(ok.content), next)
            : selectTouched(ok.content, ok.touched),
      }));
      if (isApplied) {
        await writeClip(result.clip, message('notice.cut', { count: result.clip.blocks.length }));
      }
    },
    menu: { menu: 'edit', group: 2, order: 1 },
    toolbar: { group: 3, order: 1, icon: 'edit.cut' },
    context: ['blocks', 'fold', 'branchLabel'],
  });

  // A paste reads the system clipboard asynchronously. Saving waits for it, so Ctrl+V then
  // Ctrl+S saves the pasted document, not the one before it.
  const pasteNow = async (side: Side, release: () => void): Promise<void> => {
    const data = await deps.clipboard.read();
    // A whole AriadneNSD document pasted as text (the model JSON or a share link from another
    // AI) opens as a new document after asking (UX JP1 · JP2). Blocks copied in the app come with
    // the custom format and paste as they are.
    const pasted = deps.pastedDocument;
    if (data.json === null && data.text !== null && pasted?.isDocument(data.text) === true) {
      // Saving no longer waits: the modals that follow may save (UX US1).
      release();
      const answer = deps.askPastedDocument === undefined ? 'open' : await deps.askPastedDocument();
      if (answer === 'open') {
        await pasted.open(data.text);
        return;
      }
      if (answer === 'cancel') {
        return;
      }
    }
    const diagram = data.json === null ? null : diagramFromJson(data.json);
    const clip =
      diagram?.body ??
      (data.json === null ? null : clipFromJson(data.json)) ??
      (data.text === null ? null : clipFromText(data.text));
    if (clip === null) {
      session.notify('reason.emptyClip', 'warn');
      return;
    }
    // The names of the Methods the copied calls called: another document links by name.
    const names = data.json === null ? new Map<Id, string>() : clipNamesFromJson(data.json);
    // The selection may have changed while the clipboard was read.
    const state = session.state;
    if (state.readOnly) {
      session.notify('reason.readOnly', 'warn');
      return;
    }
    const after = (ok: {
      readonly content: Content;
      readonly touched: ReadonlyArray<Id>;
    }): After => ({
      selection: selectTouched(ok.content, ok.touched),
    });
    const selection = state.selection;
    if (diagram !== null) {
      // A copied diagram comes back as a new one, whatever is selected (UX HC1).
      const beside = diagramOf(index(), selection);
      session.commit(
        pasteDiagram(content(), { diagram, after: beside, names, ids: session.ids() }),
        (ok) => {
          const [made] = ok.touched;
          return made === undefined ? { selection } : afterHead(made, false);
        },
      );
      return;
    }
    if (selection?.kind === 'branchLabel') {
      // A new branch beside the label takes the blocks (UX BL2).
      runInsertBranch(selection.branch, side, (made, branch, ids) =>
        paste(made, { target: emptyOfNewBranch(made, branch), side: 'after', clip, names, ids }),
      );
      return;
    }
    if (selection?.kind === 'missingDefault') {
      intoMissingDefault(
        selection.block,
        (made, empty, ids) =>
          paste(made, {
            target: { kind: 'blocks', first: empty, last: empty },
            side,
            clip,
            names,
            ids,
          }),
        after,
      );
      return;
    }
    if (selection?.kind === 'head') {
      if (side === 'before') {
        session.notify('reason.cannotPasteOnHead', 'warn');
        return;
      }
      // Below a header is the very start of its body (M87 F4).
      const start = headStart(index(), selection.diagram);
      if (start !== null) {
        session.commit(paste(content(), { ...start, clip, names, ids: session.ids() }), after);
      }
      return;
    }
    // With nothing selected the blocks go at the end of the current diagram, as inserted blocks
    // do (UX PS1).
    const current = selection === null ? currentDiagram(index(), state) : null;
    const target: Target | null =
      current === null ? targetOf(selection) : { kind: 'diagramEnd', diagram: current };
    if (target === null) {
      return;
    }
    session.commit(paste(content(), { target, side, clip, names, ids: session.ids() }), after);
  };

  const runPaste = async (side: Side): Promise<void> => {
    let release = (): void => undefined;
    pasting.pending = new Promise((resolve) => {
      release = resolve;
    });
    try {
      await pasteNow(side, release);
    } finally {
      release();
    }
  };

  const pasteSpec = (side: Side, id: string, order: number, toolbar?: ToolbarPlace): CommandSpec =>
    spec(id, {
      edits: true,
      // What the clipboard holds decides the rest: above a header only a diagram can go.
      when: (state) => (state.selection?.kind === 'peek' ? 'reason.peekReadOnly' : true),
      run: async () => {
        await runPaste(side);
      },
      menu: { menu: 'edit', group: 2, order },
      ...(toolbar === undefined ? {} : { toolbar }),
      context: ['blocks', 'missingDefault', 'branchLabel', 'head'],
    });

  const deleteSpec = spec('edit.delete', {
    edits: true,
    // On a header, Delete removes the header (03-keymap); on a branch label, the branch, as the
    // keys do (interaction rules "분기 라벨 선택").
    when: (state) =>
      state.selection?.kind === 'head' || state.selection?.kind === 'branchLabel'
        ? true
        : blocksOnly('reason.noDefaultToDelete')(state),
    run: (state) => {
      if (state.selection?.kind === 'head') {
        session.runCommand('diagram.removeHead');
        return;
      }
      if (state.selection?.kind === 'branchLabel') {
        session.runCommand('branch.delete');
        return;
      }
      const target = targetOf(state.selection);
      if (target === null) {
        return;
      }
      const ix = index();
      const next = selectionAfterDelete(ix, selectedBlocks(ix, state.selection));
      session.commit(deleteBlocks(content(), { target, ids: session.ids() }), (ok) => ({
        selection:
          next !== null
            ? selectBlock(indexDoc(ok.content), next)
            : selectTouched(ok.content, ok.touched),
      }));
    },
    menu: { menu: 'edit', group: 2, order: 5 },
    context: ['blocks', 'fold'],
  });

  return { cutSpec, copySpec, pasteSpec, deleteSpec };
}
