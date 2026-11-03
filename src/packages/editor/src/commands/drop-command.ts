// Running a drop (03-editor 3.2): one insert, wrap or move, so one undo step. Dragging itself is
// not a command; Esc before the drop does nothing.
import type { Content, Id, IdGenerator, Result } from '@ariadne-nsd/core';
import { addDefaultBranch, insertBlock, moveTo, wrap } from '@ariadne-nsd/core';

import type { DragSource, DropAction } from '../input/drop';
import { indexDoc, placeOf } from '../model/doc-index';
import type { After, EditorSession } from '../session/session';
import { selectBlock, selectRange } from '../state/selection';

/** The dropped or new blocks become the selection; a new block opens its text field. */
function afterDrop(isNew: boolean) {
  return (ok: { readonly content: Content; readonly touched: ReadonlyArray<Id> }): After => {
    const index = indexDoc(ok.content);
    const blocks = ok.touched.filter((id) => index.blocks.has(id));
    const [first] = blocks;
    const last = blocks.at(-1);
    if (first === undefined || last === undefined) {
      return { selection: null };
    }
    const selection =
      placeOf(index, first).owner === placeOf(index, last).owner
        ? selectRange(index, first, last)
        : selectBlock(index, first);
    return isNew
      ? { selection, edit: { field: { kind: 'block', block: first }, caret: 'end' } }
      : { selection };
  };
}

/** What a source does when it lands on block `to` (`side` of it). */
function land(content: Content, source: DragSource, to: Id, ids: IdGenerator): Result {
  const target = { kind: 'blocks', first: to, last: to } as const;
  return source.kind === 'new'
    ? insertBlock(content, { target, side: 'after', kind: source.blockKind, ids })
    : moveTo(content, { target: source.target, to, side: 'after', ids });
}

/**
 * Runs what a drop does. Returns whether the document changed: `false` when the drop was refused
 * or left the blocks where they were (dropped back in their own place, no undo step).
 */
export function runDrop(session: EditorSession, action: DropAction): boolean {
  if (session.state.readOnly) {
    session.notify('reason.readOnly', 'warn');
    return false;
  }
  const content = session.state.doc.content;
  return runAction(session, action, content) && session.state.doc.content !== content;
}

/** Commits the drop's command. Returns whether it was taken, even when nothing moved. */
function runAction(session: EditorSession, action: DropAction, content: Content): boolean {
  switch (action.kind) {
    case 'insert':
      return session.commit(
        insertBlock(content, {
          target: { kind: 'blocks', first: action.to, last: action.to },
          side: action.side,
          kind: action.blockKind,
          ids: session.ids(),
        }),
        afterDrop(true),
      );
    case 'wrap':
      return session.commit(
        wrap(content, { target: action.target, kind: action.blockKind, ids: session.ids() }),
        afterDrop(true),
      );
    case 'move':
      return session.commit(
        moveTo(content, {
          target: action.target,
          to: action.to,
          side: action.side,
          ids: session.ids(),
        }),
        afterDrop(false),
      );
    case 'intoMissingDefault': {
      // One generator for both steps, so the second never reuses an id of the first.
      const ids = session.ids();
      const made = addDefaultBranch(content, { block: action.caseBlock, ids });
      if (!made.ok) {
        session.refuse(made.reason);
        return false;
      }
      const empty = made.touched[1];
      if (empty === undefined) {
        return false;
      }
      return session.commit(
        land(made.content, action.source, empty, ids),
        afterDrop(action.source.kind === 'new'),
      );
    }
  }
}
