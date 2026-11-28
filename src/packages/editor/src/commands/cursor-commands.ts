// The move, text editing, undo, selection and view commands.
import type { CommandSpec, MenuPlace } from '../contracts';
import type { Navigation } from '../navigation/navigate';
import { navigate } from '../navigation/navigate';
import { fromShown, shownLastSelected, toShown } from '../navigation/shown-selection';
import type { After } from '../session/session';
import type { Caret } from '../state/editor-state';
import { zoomRange } from '../state/editor-state';
import { extendBy, targetOf } from '../state/selection';
import { always, spec } from './spec';
import type { Id, View } from '@ariadne-nsd/core';
import { move, moveBranch, moveDiagram } from '@ariadne-nsd/core';
import type { DocIndex } from '../model/doc-index';
import type { CommandContext } from './command-helpers';
import { branchOfSelection, fieldOfSelection } from './command-helpers';

/**
 * The fold regions that are not drawn: the unfolded ones while the name bands are off. Moving
 * blocks treats them as not there (UX FM1).
 */
function hiddenFolds(index: DocIndex, view: View): ReadonlySet<Id> {
  return new Set(
    view.bands ? [] : [...index.folds.keys()].filter((id) => !view.folded.includes(id)),
  );
}

export function cursorCommands(ctx: CommandContext) {
  const { deps, session, index, content, blockField } = ctx;

  // Move.
  const moveSpec = (direction: 'up' | 'down' | 'left' | 'right', order: number): CommandSpec =>
    spec(`edit.move.${direction}`, {
      edits: true,
      when: (state) => {
        const selection = state.selection;
        if (selection?.kind === 'branchLabel') {
          return direction === 'left' || direction === 'right'
            ? true
            : 'reason.branchMovesSideways';
        }
        return selection?.kind === 'blocks' ||
          selection?.kind === 'head' ||
          selection?.kind === 'fold'
          ? true
          : 'reason.nothingSelected';
      },
      run: (state) => {
        const selection = state.selection;
        const keep = (): After => ({ selection });
        if (selection?.kind === 'head') {
          // On a header the diagram moves among its kind (UX Q6): up and left go earlier.
          const way = direction === 'up' || direction === 'left' ? 'up' : 'down';
          session.commit(
            moveDiagram(content(), { diagram: selection.diagram, direction: way }),
            keep,
          );
          return;
        }
        if (selection?.kind === 'branchLabel') {
          if (direction === 'left' || direction === 'right') {
            session.commit(moveBranch(content(), { branch: selection.branch, direction }), keep);
          }
          return;
        }
        const target = targetOf(selection);
        if (target !== null) {
          const hidden = hiddenFolds(index(), state.doc.view);
          session.commit(
            move(content(), { target, direction, hiddenFolds: hidden, ids: session.ids() }),
            keep,
          );
        }
      },
      menu: { menu: 'edit', group: 4, order },
      context: ['blocks', 'branchLabel', 'head', 'fold'],
    });

  // Text editing.
  const textSpec = (id: string, caret: Caret | 'clear', menu?: MenuPlace): CommandSpec =>
    spec(id, {
      edits: true,
      when: (state) => {
        const field = fieldOfSelection(index(), state.selection, blockField);
        if ('reason' in field) {
          return field.reason;
        }
        const found = session.fieldText(field.value);
        return 'reason' in found ? found.reason : true;
      },
      run: (state) => {
        const field = fieldOfSelection(index(), state.selection, blockField);
        if ('value' in field) {
          const started = session.startEditing(field.value, caret);
          if (started !== true) {
            session.notify(started, 'warn');
          }
        }
      },
      ...(menu === undefined ? {} : { menu }),
      context: ['blocks', 'branchLabel', 'missingDefault', 'head', 'fold'],
      // The name of a fold region of an opened call site is edited there (R-EDIT-16).
      onPeek: true,
    });

  const branchLabelSpec = spec('edit.branchLabel', {
    edits: true,
    when: (state) => {
      const branch = branchOfSelection(index(), state.selection);
      if ('reason' in branch) {
        return branch.reason;
      }
      const found = session.fieldText({ kind: 'branchLabel', branch: branch.value });
      return 'reason' in found ? found.reason : true;
    },
    run: (state) => {
      const branch = branchOfSelection(index(), state.selection);
      if ('value' in branch) {
        session.startEditing({ kind: 'branchLabel', branch: branch.value }, 'selectAll');
      }
    },
  });

  // Undo.
  const undoSpec = spec('edit.undo', {
    edits: true,
    when: (state) => (state.undo.length > 0 ? true : 'reason.nothingToUndo'),
    run: () => {
      session.history('undo');
    },
    menu: { menu: 'edit', group: 1, order: 1 },
    toolbar: { group: 2, order: 1, icon: 'edit.undo' },
  });

  const redoSpec = spec('edit.redo', {
    edits: true,
    when: (state) => (state.redo.length > 0 ? true : 'reason.nothingToRedo'),
    run: () => {
      session.history('redo');
    },
    menu: { menu: 'edit', group: 1, order: 2 },
    toolbar: { group: 2, order: 2, icon: 'edit.redo' },
  });

  // Selection (no menu; keys, the palette and the shortcut list show them).
  const navigationSpec = (id: string, navigation: Navigation): CommandSpec =>
    spec(id, {
      edits: false,
      when: always,
      run: (state) => {
        // Moves go over what is shown: folded things are one, opened calls hold their Method.
        const shown = session.shown();
        const result = navigate(
          shown.index,
          toShown(shown, index(), state.selection),
          shownLastSelected(shown, state.lastSelected),
          navigation,
        );
        if (result.kind === 'select') {
          session.select(fromShown(shown, index(), result.selection));
        } else if (result.reason !== undefined) {
          session.notify(`notice.${result.reason}`);
        }
      },
    });

  const extendSpec = (id: string, direction: 'up' | 'down'): CommandSpec =>
    spec(id, {
      edits: false,
      when: always,
      run: (state) => {
        if (state.selection === null) {
          session.runCommand(direction === 'up' ? 'select.up' : 'select.down');
          return;
        }
        const extended = extendBy(index(), state.selection, direction);
        if (extended === null) {
          session.notify('notice.sameParentOnly');
        } else {
          session.select(extended);
        }
      },
    });

  const selectionSpecs: ReadonlyArray<CommandSpec> = [
    navigationSpec('select.left', { kind: 'step', direction: 'left' }),
    navigationSpec('select.down', { kind: 'step', direction: 'down' }),
    navigationSpec('select.up', { kind: 'step', direction: 'up' }),
    navigationSpec('select.right', { kind: 'step', direction: 'right' }),
    extendSpec('select.extendUp', 'up'),
    extendSpec('select.extendDown', 'down'),
    navigationSpec('select.unitUp', { kind: 'unit', direction: 'up' }),
    navigationSpec('select.unitDown', { kind: 'unit', direction: 'down' }),
    navigationSpec('select.branchLeft', { kind: 'branch', direction: 'left' }),
    navigationSpec('select.branchRight', { kind: 'branch', direction: 'right' }),
    navigationSpec('select.first', { kind: 'edge', end: 'first' }),
    navigationSpec('select.last', { kind: 'edge', end: 'last' }),
    navigationSpec('select.previousDiagram', { kind: 'diagram', direction: 'previous' }),
    navigationSpec('select.nextDiagram', { kind: 'diagram', direction: 'next' }),
    spec('select.visual', {
      edits: false,
      // Blocks shown inside an opened call block widen the same way (interaction rules 2).
      when: (state) =>
        state.selection?.kind === 'blocks' || state.selection?.kind === 'peek'
          ? true
          : 'reason.nothingSelected',
      run: () => {
        session.setMode('visual');
        session.notify('notice.visual');
      },
    }),
    spec('select.clear', {
      edits: false,
      when: (state) => (state.selection === null ? 'reason.nothingSelected' : true),
      run: () => {
        session.select(null);
      },
    }),
  ];

  // View.
  const zoomSpec = (id: string, order: number, next: (zoom: number) => number): CommandSpec =>
    spec(id, {
      edits: false,
      when: (state) => {
        const zoom = Math.min(zoomRange.max, Math.max(zoomRange.min, next(state.zoom)));
        return Math.abs(zoom - state.zoom) < 1e-9 ? 'reason.zoomLimit' : true;
      },
      run: (state) => {
        deps.zoomTo(next(state.zoom));
      },
      menu: { menu: 'view', group: 4, order },
    });

  return { undoSpec, redoSpec, textSpec, branchLabelSpec, moveSpec, selectionSpecs, zoomSpec };
}
