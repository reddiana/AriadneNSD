// The header, diagram and extract-Method commands.
import type { CommandSpec } from '../contracts';
import { message } from '../i18n/messages';
import { indexDoc } from '../model/doc-index';
import { drawnDiagrams } from '../navigation/navigate';
import { diagramOf, selectBlock } from '../state/selection';
import { always, commandTitle, spec } from './spec';
import type { HeadKind, Id } from '@ariadne-nsd/core';
import { deleteDiagram, extractMethod, newDiagram, setHead } from '@ariadne-nsd/core';
import type { CommandContext } from './command-helpers';
import { isKeyArg, appliesIf, headAction, extractTarget, afterHead } from './command-helpers';

export function methodCommands(ctx: CommandContext) {
  const { deps, session, index, content } = ctx;

  // Headers and diagrams (R-BLK-10, R-BLK-11, R-EDIT-18).
  const headKindSpec = (kind: HeadKind, order: number): CommandSpec => {
    const id = `diagram.${kind}`;
    return spec(id, {
      edits: true,
      title: (ctx) => {
        const action = headAction(index(), ctx.state.selection, kind);
        if (!('value' in action)) {
          return commandTitle(id);
        }
        switch (action.value.kind) {
          case 'add':
            return commandTitle(`${id}.add`);
          case 'change':
            return commandTitle(`${id}.change`);
        }
      },
      when: (state) => appliesIf(headAction(index(), state.selection, kind)),
      run: (state) => {
        const action = headAction(index(), state.selection, kind);
        if (!('value' in action)) {
          return;
        }
        const { diagram } = action.value;
        // A new header opens its name for typing, the default name selected (R-BLK-10).
        const isNew = action.value.kind === 'add';
        session.commit(setHead(content(), { diagram, kind }), () => afterHead(diagram, isNew));
      },
      menu: { menu: 'diagram', group: 5, order },
      context: ['blocks', 'head'],
    });
  };

  // Extract into a new Method (R-EDIT-19): the name is typed at once, and closing the field goes
  // back to the call block left in place (UX XM2).
  const runExtract = (): void => {
    const target = extractTarget(session.state.selection);
    if (!('value' in target)) {
      return;
    }
    const result = extractMethod(content(), { target: target.value, ids: session.ids() });
    if (!result.ok) {
      session.refuse(result.reason);
      return;
    }
    const [diagram, call] = result.touched;
    const made = result.content.diagrams.find((d) => d.id === diagram);
    if (diagram === undefined || call === undefined || made === undefined) {
      return;
    }
    const count = made.body.blocks.length;
    const isApplied = session.commit(result, () => ({
      selection: { kind: 'head', diagram },
      edit: { field: { kind: 'head', diagram }, caret: 'selectAll', extracted: { call, count } },
    }));
    if (isApplied) {
      const key = result.removedFolds > 0 ? 'notice.extractedFoldsRemoved' : 'notice.extracted';
      session.notify(message(key, { count }));
    }
  };

  /**
   * `m` on blocks of a diagram without a header could mean either: a small list just below the
   * selection asks which (UX XM3). Enter or `1` extracts, `2` gives the diagram a Method header.
   */
  const askExtractOrHead = async (diagram: Id): Promise<void> => {
    const chosen = await deps.pick(
      'picker.methodKey',
      [
        { title: 'command.diagram.extractMethod', isLiteral: false },
        { title: 'command.diagram.method.add', isLiteral: false },
      ],
      0,
    );
    if (chosen === null) {
      return;
    }
    if (session.state.readOnly) {
      session.notify('reason.readOnly', 'warn');
      return;
    }
    if (chosen === 0) {
      runExtract();
    } else {
      session.commit(setHead(content(), { diagram, kind: 'method' }), () =>
        afterHead(diagram, true),
      );
    }
  };

  const extractSpec = spec('diagram.extractMethod', {
    edits: true,
    when: (state) => appliesIf(extractTarget(state.selection)),
    run: async (state, args) => {
      const diagram = diagramOf(index(), state.selection);
      const isHeaderless =
        diagram !== null && (index().diagrams.get(diagram)?.head ?? null) === null;
      if (isKeyArg(args) && isHeaderless && 'value' in extractTarget(state.selection)) {
        await askExtractOrHead(diagram);
        return;
      }
      runExtract();
    },
    menu: { menu: 'diagram', group: 4, order: 2 },
    context: ['blocks', 'fold'],
  });

  const removeHeadSpec = spec('diagram.removeHead', {
    edits: true,
    when: (state) => (state.selection?.kind === 'head' ? true : 'reason.selectHead'),
    run: (state) => {
      if (state.selection?.kind !== 'head') {
        return;
      }
      const diagram = state.selection.diagram;
      session.commit(setHead(content(), { diagram, kind: null }), (ok) => {
        // The first block of the diagram, unless the diagram went with its header (invariant 7).
        const first = ok.content.diagrams.find((d) => d.id === diagram)?.body.blocks[0];
        return {
          selection: first === undefined ? null : selectBlock(indexDoc(ok.content), first.id),
        };
      });
    },
    menu: { menu: 'diagram', group: 5, order: 3 },
    context: ['head'],
  });

  const newDiagramSpec = (kind: HeadKind, id: string, order: number): CommandSpec =>
    spec(id, {
      edits: true,
      when: always,
      run: () => {
        session.commit(newDiagram(content(), { kind, ids: session.ids() }), (ok) => {
          const [diagram] = ok.touched;
          return diagram === undefined ? { selection: null } : afterHead(diagram, true);
        });
      },
      menu: { menu: 'diagram', group: 6, order },
    });

  const deleteDiagramSpec = spec('diagram.delete', {
    edits: true,
    when: (state) => {
      if (diagramOf(index(), state.selection) === null) {
        return 'reason.nothingSelected';
      }
      return index().content.diagrams.length > 1 ? true : 'reason.lastDiagram';
    },
    run: (state) => {
      const ix = index();
      const diagram = diagramOf(ix, state.selection);
      if (diagram === null) {
        return;
      }
      // Next, the side diagram after it in drawn order, or the one before (its header).
      const order = drawnDiagrams(ix);
      const at = order.indexOf(diagram);
      const next = order[at + 1] ?? order[at - 1] ?? null;
      const isApplied = session.commit(deleteDiagram(content(), { diagram }), (ok) => {
        const there = next === null ? undefined : ok.content.diagrams.find((d) => d.id === next);
        if (there === undefined) {
          return { selection: null };
        }
        const first = there.body.blocks[0];
        if (there.head !== null) {
          return { selection: { kind: 'head', diagram: there.id } };
        }
        return {
          selection: first === undefined ? null : selectBlock(indexDoc(ok.content), first.id),
        };
      });
      if (isApplied) {
        session.notify('notice.diagramDeleted');
      }
    },
    menu: { menu: 'diagram', group: 6, order: 3 },
    context: ['head'],
  });

  const diagramSpecs: ReadonlyArray<CommandSpec> = [
    headKindSpec('event', 1),
    headKindSpec('method', 2),
    removeHeadSpec,
    extractSpec,
    newDiagramSpec('event', 'diagram.newEvent', 1),
    newDiagramSpec('method', 'diagram.newMethod', 2),
    deleteDiagramSpec,
  ];

  return { diagramSpecs };
}
