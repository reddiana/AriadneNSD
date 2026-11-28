// The clipboard commands: copy, cut, paste and delete.
import {
  clipFromJson,
  clipFromText,
  clipNamesFromJson,
  clipToJson,
  clipToText,
} from '../clipboard/clip-format';
import type { CommandSpec, ToolbarPlace } from '../contracts';
import type { EditorMessage } from '../i18n/messages';
import { message } from '../i18n/messages';
import { indexDoc } from '../model/doc-index';
import type { After } from '../session/session';
import type { Selection } from '../state/selection';
import { foldPath, peekBlocks, selectBlock, selectedBlocks, targetOf } from '../state/selection';
import { regionPlace } from './fold-commands';
import { spec } from './spec';
import type { Content, Id, Side, Target } from '@ariadne-nsd/core';
import { copy, cut, deleteBlocks, paste } from '@ariadne-nsd/core';
import type { CommandContext } from './command-helpers';
import { headStart, selectionAfterDelete, selectTouched } from './command-helpers';

export function clipboardCommands(ctx: CommandContext) {
  const { deps, session, index, content, intoMissingDefault, blocksOnly, pasting } = ctx;

  // Clipboard and delete.
  const writeClip = async (
    clip: Parameters<typeof clipToText>[0],
    notice: EditorMessage,
  ): Promise<void> => {
    const where = await deps.clipboard.write({
      text: clipToText(clip, {
        // The fixed words as drawn: in the document's drawing language (ADR-0041).
        locale: content().settings.locale,
        resultSymbol: session.state.doc.view.resultSymbol,
        diagrams: new Map(content().diagrams.map((diagram) => [diagram.id, diagram])),
      }),
      json: clipToJson(clip, index().diagrams),
    });
    session.notify(where === 'memory' ? 'notice.clipboardLocal' : notice);
  };

  /** What copy takes: blocks shown in an opened call, a region shown there, or the selection. */
  const copyTarget = (selection: Selection | null): Target | null => {
    const peeked = peekBlocks(index(), selection);
    const [first] = peeked;
    const last = peeked.at(-1);
    if (first !== undefined && last !== undefined) {
      return { kind: 'blocks', first, last };
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
      state.selection?.kind === 'peek' ? true : blocksOnly('reason.nothingToCopy')(state),
    run: async (state) => {
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
    context: ['blocks', 'fold', 'peek'],
  });

  const cutSpec = spec('edit.cut', {
    edits: true,
    when: blocksOnly('reason.nothingToCut'),
    run: async (state) => {
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
    context: ['blocks', 'fold'],
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
      const canPasteText = session.state.selection !== null;
      const answer =
        deps.askPastedDocument === undefined ? 'open' : await deps.askPastedDocument(canPasteText);
      if (answer === 'open') {
        await pasted.open(data.text);
        return;
      }
      if (answer === 'cancel') {
        return;
      }
    }
    const clip =
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
      // Below a header is the very start of its body (M87 F4).
      const start = headStart(index(), selection.diagram);
      if (start !== null) {
        session.commit(paste(content(), { ...start, clip, names, ids: session.ids() }), after);
      }
      return;
    }
    const target = targetOf(selection);
    if (target === null) {
      if (selection === null) {
        // Paste runs without a selection only to look for a pasted document (UX JP2).
        session.notify('reason.nothingSelected', 'warn');
      }
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
      when: (state) => {
        const selection = state.selection;
        if (selection?.kind === 'branchLabel') {
          return 'reason.undecidedOnBranchLabel';
        }
        if (selection?.kind === 'head') {
          // Below a header is the start of its body (M87 F4); above it there is nothing.
          return side === 'after' ? true : 'reason.cannotPasteOnHead';
        }
        if (selection === null && deps.pastedDocument !== undefined) {
          // The clipboard may hold a document to open (UX JP2); otherwise it says why.
          return true;
        }
        return selection?.kind === 'blocks' ||
          selection?.kind === 'missingDefault' ||
          selection?.kind === 'fold'
          ? true
          : 'reason.nothingSelected';
      },
      run: async () => {
        await runPaste(side);
      },
      menu: { menu: 'edit', group: 2, order },
      ...(toolbar === undefined ? {} : { toolbar }),
      context: ['blocks', 'missingDefault'],
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
