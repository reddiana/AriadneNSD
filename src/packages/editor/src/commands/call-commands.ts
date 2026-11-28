// The call block commands (R-BLK-07, interaction rules "호출 블록").
import type { CommandSpec, PickerItem } from '../contracts';
import { message } from '../i18n/messages';
import { indexDoc } from '../model/doc-index';
import type { After } from '../session/session';
import type { EditorState } from '../state/editor-state';
import type { Selection } from '../state/selection';
import { selectBlock, targetOf } from '../state/selection';
import type { Applies } from './spec';
import { spec } from './spec';
import type {
  Content,
  Diagram,
  Id,
  IdGenerator,
  Result,
  Side,
  Target,
  View,
} from '@ariadne-nsd/core';
import {
  foldedAfterInline,
  hasOwnSite,
  headName,
  headParams,
  inlineMethod,
  insertCall,
  insertNamedCall,
  makeMethod,
  nameCallTarget,
  newDiagram,
  newMethodAndCall,
  setCallTarget,
  sitePrefix,
} from '@ariadne-nsd/core';
import type { Found, CommandContext } from './command-helpers';
import {
  oneBlock,
  appliesIf,
  selectTouched,
  currentDiagram,
  headStart,
  methodsOf,
  afterHead,
} from './command-helpers';

export function callCommands(ctx: CommandContext) {
  const { deps, session, index, content, intoMissingDefault, insertWhen } = ctx;

  // Call blocks (R-BLK-07, interaction rules "호출 블록").

  /**
   * Asks which Method to call: every Method, then "New Method, and call it", then "Call by a
   * written name" (R-BLK-08). `method: null` is a new Method; `isNamed` a written name.
   */
  const pickMethod = async (
    current: Id | null,
  ): Promise<{ readonly method: Diagram | null; readonly isNamed: boolean } | null> => {
    const methods = methodsOf(index());
    const items: PickerItem[] = [
      ...methods.map((m) => ({ title: m.head?.text ?? '', isLiteral: true })),
      { title: 'picker.newMethod', isLiteral: false },
      { title: 'picker.namedCall', isLiteral: false },
    ];
    const active = Math.max(
      0,
      methods.findIndex((m) => m.id === current),
    );
    const chosen = await deps.pick('picker.callTarget', items, active);
    if (chosen === null) {
      return null;
    }
    // The document may have become view only while the list was open.
    if (session.state.readOnly) {
      session.notify('reason.readOnly', 'warn');
      return null;
    }
    return { method: methods[chosen] ?? null, isNamed: chosen === methods.length + 1 };
  };

  /** After a call by a written name is made: its name is typed at once (R-BLK-08). */
  const afterNamed = (call: Id, made: Content): After => ({
    selection: selectBlock(indexDoc(made), call),
    edit: { field: { kind: 'call', block: call, part: 'name' }, caret: 'selectAll' },
  });

  /** After inserting a call block: select it and type its arguments (or result) at once. */
  const afterCall = (method: Diagram, call: Id, made: Content): After => {
    const receives = method.head !== null && headParams(method.head) !== null;
    return {
      selection: selectBlock(indexDoc(made), call),
      edit: {
        field: { kind: 'call', block: call, part: receives ? 'args' : 'result' },
        caret: 'end',
      },
    };
  };

  const runInsertCall = async (side: Side): Promise<void> => {
    const selection = session.state.selection;
    const picked = await pickMethod(null);
    if (picked === null) {
      return;
    }
    const { method, isNamed } = picked;
    // Below a selected header the call goes at the very start of its body (M87 F4).
    const start = selection?.kind === 'head' ? headStart(index(), selection.diagram) : null;
    const op = (
      made: Content,
      target: Target,
      ids: IdGenerator,
      place: { readonly side: Side; readonly outsideFolds?: boolean } = { side },
    ): Result => {
      if (isNamed) {
        return insertNamedCall(made, { target, ...place, name: '', ids });
      }
      return method === null
        ? newMethodAndCall(made, { target, ...place, ids })
        : insertCall(made, { target, ...place, diagram: method.id, ids });
    };
    const after = (ok: {
      readonly content: Content;
      readonly touched: ReadonlyArray<Id>;
    }): After => {
      const [first, second] = ok.touched;
      if (isNamed) {
        return first === undefined ? { selection: null } : afterNamed(first, ok.content);
      }
      if (method === null) {
        // A new Method: its name is written now, and the call block follows it (ADR-0022).
        return first === undefined ? { selection: null } : afterHead(first, true);
      }
      return first === undefined
        ? { selection: null }
        : afterCall(method, second ?? first, ok.content);
    };
    if (selection?.kind === 'missingDefault') {
      intoMissingDefault(
        selection.block,
        (made, empty, ids) => op(made, { kind: 'blocks', first: empty, last: empty }, ids),
        after,
      );
      return;
    }
    if (start !== null) {
      session.commit(op(content(), start.target, session.ids(), start), after);
      return;
    }
    const diagram = currentDiagram(index(), { ...session.state, selection });
    const target: Target | null =
      targetOf(selection) ?? (diagram === null ? null : { kind: 'diagramEnd', diagram });
    if (target === null) {
      session.notify('reason.nothingSelected', 'warn');
      return;
    }
    session.commit(op(content(), target, session.ids()), after);
  };

  const insertCallSpecs: ReadonlyArray<CommandSpec> = [
    spec('block.insert.call', {
      edits: true,
      when: (state) =>
        state.selection?.kind === 'branchLabel'
          ? 'reason.notOnBranchLabel'
          : insertWhen('process', 'after')(state),
      run: () => runInsertCall('after'),
      menu: { menu: 'diagram', group: 1, order: 17, submenu: 'insert' },
      context: ['blocks', 'missingDefault'],
    }),
    spec('block.insertBefore.call', {
      edits: true,
      when: (state) =>
        state.selection?.kind === 'branchLabel'
          ? 'reason.notOnBranchLabel'
          : insertWhen('process', 'before')(state),
      run: () => runInsertCall('before'),
      menu: { menu: 'diagram', group: 1, order: 7, submenu: 'insertBefore' },
    }),
  ];

  /** The one selected call block, or why there is none. */
  const selectedCall = (state: EditorState): Found<Id> => {
    const block = oneBlock(index(), state.selection);
    if ('reason' in block) {
      return block.reason === 'reason.nothingSelected' ? { reason: 'reason.selectCall' } : block;
    }
    return index().blocks.get(block.value)?.block.kind === 'call'
      ? block
      : { reason: 'reason.selectCall' };
  };

  const setTargetSpec = spec('call.setTarget', {
    edits: true,
    when: (state) => appliesIf(selectedCall(state)),
    run: async (state) => {
      const found = selectedCall(state);
      if (!('value' in found)) {
        return;
      }
      const call = found.value;
      const block = index().blocks.get(call)?.block;
      const current =
        block?.kind === 'call' && block.target.kind === 'local' ? block.target.diagram : null;
      const picked = await pickMethod(current);
      if (picked === null) {
        return;
      }
      const keep = (): After => ({ selection: session.state.selection });
      if (picked.isNamed) {
        // The name it shows now is where the written name starts (UX CB6).
        const shown = block?.kind === 'call' ? session.callName(block) : '';
        session.commit(nameCallTarget(content(), { block: call, name: shown }), (ok) =>
          afterNamed(call, ok.content),
        );
        return;
      }
      if (picked.method !== null) {
        session.commit(setCallTarget(content(), { block: call, diagram: picked.method.id }), keep);
        return;
      }
      // A new Method to call: made and chosen in one undo step, then its name is written.
      const made = newDiagram(content(), { kind: 'method', ids: session.ids() });
      const [diagram] = made.ok ? made.touched : [];
      if (!made.ok || diagram === undefined) {
        if (!made.ok) {
          session.refuse(made.reason);
        }
        return;
      }
      session.commit(setCallTarget(made.content, { block: call, diagram }), () =>
        afterHead(diagram, true),
      );
    },
    menu: { menu: 'diagram', group: 4, order: 1 },
    context: ['blocks'],
  });

  /** The one selected call block calling by a written name, or why there is none (R-EDIT-26). */
  const selectedNamedCall = (state: EditorState): Found<Id> => {
    const found = selectedCall(state);
    if (!('value' in found)) {
      return found;
    }
    const block = index().blocks.get(found.value)?.block;
    return block?.kind === 'call' && block.target.kind === 'named'
      ? found
      : { reason: 'reason.callHasMethod' };
  };

  /** Whether the selection is one call block calling by a written name. */
  const isNamedCall = (state: EditorState): boolean => 'value' in selectedNamedCall(state);

  /**
   * Method 만들기 (R-EDIT-26): makes the Method a call by name calls, links the call blocks of
   * that name to it, and goes to its header, in one undo step (UX CB15).
   */
  const runMakeMethod = (call: Id): void => {
    session.commit(makeMethod(content(), { block: call, ids: session.ids() }), (ok) => {
      const [diagram] = ok.touched;
      return { selection: diagram === undefined ? null : { kind: 'head', diagram } };
    });
  };

  const makeMethodSpec = spec('call.makeMethod', {
    edits: true,
    when: (state) => appliesIf(selectedNamedCall(state)),
    run: (state) => {
      const found = selectedNamedCall(state);
      if ('value' in found) {
        runMakeMethod(found.value);
      }
    },
    menu: { menu: 'diagram', group: 4, order: 4 },
    context: ['blocks'],
    inContext: isNamedCall,
  });

  /**
   * The Method "Method 풀어 넣고 지우기" acts on: the one the selected call block calls (`from`
   * is that call), or the selected Method header (`from` is `null`).
   */
  const inlineMethodTarget = (
    state: EditorState,
  ): Found<{ readonly diagram: Id; readonly from: Id | null }> => {
    const ix = index();
    const selection = state.selection;
    if (selection?.kind === 'head') {
      return ix.diagrams.get(selection.diagram)?.head?.kind === 'method'
        ? { value: { diagram: selection.diagram, from: null } }
        : { reason: 'reason.selectCallOrMethod' };
    }
    const found = selectedCall(state);
    if (!('value' in found)) {
      return found.reason === 'reason.selectCall' ? { reason: 'reason.selectCallOrMethod' } : found;
    }
    const block = ix.blocks.get(found.value)?.block;
    if (block?.kind !== 'call' || block.target.kind !== 'local') {
      return { reason: 'reason.notCallable' };
    }
    return { value: { diagram: block.target.diagram, from: block.id } };
  };

  /** Whether "Method 풀어 넣고 지우기" can run: the same checks as core's `inlineMethod`. */
  const inlineMethodApplies = (state: EditorState): Applies => {
    const found = inlineMethodTarget(state);
    if (!('value' in found)) {
      return found.reason;
    }
    const diagram = found.value.diagram;
    const callers = [...index().blocks.values()].filter(
      ({ block }) =>
        block.kind === 'call' && block.target.kind === 'local' && block.target.diagram === diagram,
    );
    if (callers.some((place) => place.diagram === diagram)) {
      return 'reason.recursiveMethod';
    }
    return callers.length > 0 ? true : 'reason.noCallers';
  };

  /**
   * Method 풀어 넣고 지우기: every call of the Method becomes a copy of its blocks, each shown
   * the way 풀기 shows it (UX CB8), and the Method goes, in one undo step. The blocks put in at
   * the call it was started from are selected; from the header, those at the first call.
   */
  const runInlineMethod = (diagram: Id, from: Id | null, view: View): void => {
    const before = content();
    const head = index().diagrams.get(diagram)?.head ?? null;
    const folded = new Set(view.folded);
    const result = inlineMethod(before, {
      diagram,
      ids: session.ids(),
      ownRegions: (call) => hasOwnSite(folded, sitePrefix([call])),
    });
    if (!result.ok) {
      session.refuse(result.reason);
      return;
    }
    let after = view;
    for (const site of result.sites) {
      const renamed = site.renamed;
      const opened = after.opened.flatMap((path) => {
        if (path[0] !== site.call) {
          return [path];
        }
        const [inner, ...rest] = path.slice(1);
        const copy = inner === undefined ? undefined : renamed.get(inner);
        return copy === undefined ? [] : [[copy, ...rest]];
      });
      after = {
        ...after,
        folded: foldedAfterInline(before, after, site.call, renamed),
        opened,
      };
    }
    const shown = result.sites.find((site) => site.call === from) ?? result.sites[0];
    const isApplied = session.commit(result, (ok) => ({
      selection: selectTouched(ok.content, shown?.blocks ?? []),
      view: after,
    }));
    if (isApplied) {
      session.notify(
        message('notice.methodInlined', {
          count: result.sites.length,
          name: head === null ? '' : headName(head),
        }),
      );
    }
  };

  const inlineMethodSpec = spec('diagram.inlineMethod', {
    edits: true,
    when: inlineMethodApplies,
    run: (state) => {
      const found = inlineMethodTarget(state);
      if ('value' in found) {
        runInlineMethod(found.value.diagram, found.value.from, state.doc.view);
      }
    },
    menu: { menu: 'diagram', group: 4, order: 5 },
    context: ['blocks', 'head'],
    // On a call block calling a Method of this document, or on a Method header.
    inContext: (state) => 'value' in inlineMethodTarget(state),
  });

  /**
   * `gd` (03-keymap): from a call block to the header of the Method it calls; from a block shown
   * in an opened call to the Method's own block (interaction rules "호출 블록 펴 보기"). On a
   * call by a written name it makes the Method first (Method 만들기, UX CB15).
   */
  const goToTarget = (state: EditorState): Found<Selection> => {
    const selection = state.selection;
    const ix = index();
    if (selection?.kind === 'peek') {
      return { value: selectBlock(ix, selection.focus) };
    }
    if (
      selection?.kind === 'fold' &&
      selection.path !== undefined &&
      ix.folds.has(selection.fold)
    ) {
      return { value: { kind: 'fold', fold: selection.fold } };
    }
    const found = selectedCall(state);
    if (!('value' in found)) {
      return found;
    }
    const block = ix.blocks.get(found.value)?.block;
    if (block?.kind !== 'call' || block.target.kind !== 'local') {
      return { reason: 'reason.notCallable' };
    }
    return { value: { kind: 'head', diagram: block.target.diagram } };
  };

  const goToSpec = spec('call.goTo', {
    edits: false,
    when: (state) => {
      if (isNamedCall(state)) {
        return state.readOnly ? 'reason.readOnly' : true;
      }
      return appliesIf(goToTarget(state));
    },
    run: (state) => {
      const named = selectedNamedCall(state);
      if ('value' in named) {
        runMakeMethod(named.value);
        return;
      }
      const found = goToTarget(state);
      if ('value' in found) {
        session.select(found.value);
      }
    },
    menu: { menu: 'diagram', group: 4, order: 3 },
    context: ['blocks', 'peek'],
    // On a call by name the context menu has "Method 만들기" instead.
    inContext: (state) => !isNamedCall(state),
  });

  return { insertCallSpecs, setTargetSpec, makeMethodSpec, inlineMethodSpec, goToSpec };
}
