// Command availability and refusals (03-editor 5, 02-interaction-rules): why each command is not available on each kind of selection, and the rarer ways the commands run.
import type { Call, Content, Head } from '@ariadne-nsd/core';
import { describe, expect, it } from 'vitest';

import {
  arm,
  branch,
  caseBlock,
  contentOf,
  ifBlock,
  proc,
  testEngine,
  whileBlock,
} from '../engine-test-support';
import type { TestEngine } from '../engine-test-support';
import { indexDoc } from '../model/doc-index';
import type { Selection } from '../state/selection';
import { selectBlock, selectRange, selectedBlocks } from '../state/selection';

const withHeads = (
  content: Content,
  heads: Readonly<Record<string, readonly [Head['kind'], string]>>,
): Content => ({
  ...content,
  diagrams: content.diagrams.map((d) => {
    const head = heads[d.id];
    return head === undefined ? d : { ...d, head: { kind: head[0], text: head[1] } };
  }),
});

const call = (id: string, diagram: string): Call => ({
  id,
  kind: 'call',
  target: { kind: 'local', diagram },
  args: '',
  result: '',
  siteFolds: [],
});

// d1 (no header): p1; if i1 { r1: p2 | r2: p3 }; case k1 { a1: p4 } (no default);
//   case k2 { a2: p7 | default o2: p8 }; while w1 { p5 }; call c1 -> d2
// d2: Method "m(x)" { p6 }
// d3 (no header): p9
const sample = (): Content =>
  withHeads(
    contentOf(
      [
        proc('p1'),
        ifBlock('i1', branch('r1', [proc('p2')]), branch('r2', [proc('p3')])),
        caseBlock('k1', [arm('a1', '1', [proc('p4')])], null),
        caseBlock('k2', [arm('a2', '1', [proc('p7')])], branch('o2', [proc('p8')])),
        whileBlock('w1', [proc('p5')]),
        call('c1', 'd2'),
      ],
      [proc('p6')],
      [proc('p9')],
    ),
    { d2: ['method', 'm(x)'] },
  );

type Place =
  | 'none'
  | 'p1'
  | 'p2'
  | 'p6'
  | 'range'
  | 'i1'
  | 'k2'
  | 'c1'
  | 'label'
  | 'armLabel'
  | 'defaultLabel'
  | 'missing'
  | 'head';

const selectionAt = (content: Content, place: Place): Selection | null => {
  const ix = indexDoc(content);
  switch (place) {
    case 'none':
      return null;
    case 'range':
      return selectRange(ix, 'p1', 'i1');
    case 'label':
      return { kind: 'branchLabel', branch: 'r1' };
    case 'armLabel':
      return { kind: 'branchLabel', branch: 'a1' };
    case 'defaultLabel':
      return { kind: 'branchLabel', branch: 'o2' };
    case 'missing':
      return { kind: 'missingDefault', block: 'k1' };
    case 'head':
      return { kind: 'head', diagram: 'd2' };
    case 'p1':
    case 'p2':
    case 'p6':
    case 'i1':
    case 'k2':
    case 'c1':
      return selectBlock(ix, place);
  }
};

/** What the registry says of a command now: `true`, or the reason it is not available. */
const applies = (engine: TestEngine, id: string): unknown =>
  engine.registry
    .list()
    .find((spec) => spec.id === id)
    ?.when(engine.registry.context());

const notice = (engine: TestEngine): unknown => engine.session.chrome().notice?.message;

const selected = (engine: TestEngine): ReadonlyArray<string> =>
  selectedBlocks(engine.session.index(), engine.session.state.selection);

const bodyOf = (engine: TestEngine, owner: string): ReadonlyArray<string> =>
  engine.session
    .index()
    .seqs.get(owner)
    ?.seq.blocks.map((b) => b.id) ?? [];

const engineAt = (place: Place): TestEngine => {
  const engine = testEngine(sample());
  engine.select(selectionAt(engine.content(), place));
  return engine;
};

// Places left out of a row are where the command applies (`true`).
const refusals: Readonly<Record<string, Partial<Record<Place, string>>>> = {
  'edit.cut': {
    none: 'reason.nothingSelected',
    label: 'reason.undecidedOnBranchLabel',
    armLabel: 'reason.undecidedOnBranchLabel',
    defaultLabel: 'reason.undecidedOnBranchLabel',
    missing: 'reason.nothingToCut',
    head: 'reason.notOnHead',
  },
  'edit.copy': {
    none: 'reason.nothingSelected',
    label: 'reason.undecidedOnBranchLabel',
    armLabel: 'reason.undecidedOnBranchLabel',
    defaultLabel: 'reason.undecidedOnBranchLabel',
    missing: 'reason.nothingToCopy',
    head: 'reason.notOnHead',
  },
  'edit.paste': {
    none: 'reason.nothingSelected',
    label: 'reason.undecidedOnBranchLabel',
    armLabel: 'reason.undecidedOnBranchLabel',
    defaultLabel: 'reason.undecidedOnBranchLabel',
    head: 'reason.cannotPasteOnHead',
  },
  'edit.delete': {
    none: 'reason.nothingSelected',
    label: 'reason.undecidedOnBranchLabel',
    armLabel: 'reason.undecidedOnBranchLabel',
    defaultLabel: 'reason.undecidedOnBranchLabel',
    missing: 'reason.noDefaultToDelete',
  },
  'edit.text': {
    none: 'reason.nothingSelected',
    range: 'reason.selectOneBlock',
    defaultLabel: 'reason.defaultLabelFixed',
  },
  'edit.branchLabel': {
    none: 'reason.selectBranchLabel',
    p1: 'reason.selectInBranch',
    p6: 'reason.selectInBranch',
    range: 'reason.selectInBranch',
    i1: 'reason.selectInBranch',
    k2: 'reason.selectInBranch',
    c1: 'reason.selectInBranch',
    defaultLabel: 'reason.defaultLabelFixed',
    missing: 'reason.selectBranchLabel',
    head: 'reason.selectBranchLabel',
  },
  'edit.move.up': {
    none: 'reason.nothingSelected',
    label: 'reason.branchMovesSideways',
    armLabel: 'reason.branchMovesSideways',
    defaultLabel: 'reason.branchMovesSideways',
    missing: 'reason.nothingSelected',
  },
  'edit.move.left': { none: 'reason.nothingSelected', missing: 'reason.nothingSelected' },
  'block.insert.process': { head: 'reason.notOnHead' },
  'block.insert.if': {
    label: 'reason.notOnBranchLabel',
    armLabel: 'reason.notOnBranchLabel',
    defaultLabel: 'reason.notOnBranchLabel',
    head: 'reason.notOnHead',
  },
  'block.insert.call': {
    label: 'reason.notOnBranchLabel',
    armLabel: 'reason.notOnBranchLabel',
    defaultLabel: 'reason.notOnBranchLabel',
    head: 'reason.notOnHead',
  },
  'block.wrap.while': {
    none: 'reason.nothingSelected',
    label: 'reason.undecidedOnBranchLabel',
    armLabel: 'reason.undecidedOnBranchLabel',
    defaultLabel: 'reason.undecidedOnBranchLabel',
    missing: 'reason.nothingSelected',
    head: 'reason.cannotWrapHead',
  },
  'block.unwrap': {
    none: 'reason.nothingSelected',
    p1: 'reason.noControlBlock',
    p6: 'reason.noControlBlock',
    range: 'reason.noControlBlock',
    label: 'reason.nothingSelected',
    armLabel: 'reason.nothingSelected',
    defaultLabel: 'reason.nothingSelected',
    missing: 'reason.nothingSelected',
    head: 'reason.notOnHead',
  },
  'branch.insert': {
    none: 'reason.selectBranchLabel',
    p1: 'reason.selectInBranch',
    p6: 'reason.selectInBranch',
    range: 'reason.selectInBranch',
    i1: 'reason.selectInBranch',
    k2: 'reason.selectInBranch',
    c1: 'reason.selectInBranch',
    missing: 'reason.selectBranchLabel',
    head: 'reason.selectBranchLabel',
  },
  'branch.delete': {
    none: 'reason.selectBranchLabel',
    p1: 'reason.selectInBranch',
    p6: 'reason.selectInBranch',
    range: 'reason.selectInBranch',
    i1: 'reason.selectInBranch',
    k2: 'reason.selectInBranch',
    c1: 'reason.selectInBranch',
    missing: 'reason.selectBranchLabel',
    head: 'reason.selectBranchLabel',
  },
  'branch.convertIfToCase': {
    none: 'reason.notIf',
    p1: 'reason.notIf',
    p2: 'reason.notIf',
    p6: 'reason.notIf',
    range: 'reason.notIf',
    k2: 'reason.notIf',
    c1: 'reason.notIf',
    armLabel: 'reason.notIf',
    defaultLabel: 'reason.notIf',
    missing: 'reason.notIf',
    head: 'reason.notIf',
  },
  'branch.convertCaseToIf': {
    none: 'reason.notConvertible',
    p1: 'reason.notConvertible',
    p2: 'reason.notConvertible',
    p6: 'reason.notConvertible',
    range: 'reason.notConvertible',
    i1: 'reason.notConvertible',
    c1: 'reason.notConvertible',
    label: 'reason.notConvertible',
    armLabel: 'reason.notConvertible',
    missing: 'reason.notConvertible',
    head: 'reason.notConvertible',
  },
  'call.setTarget': {
    none: 'reason.selectCall',
    p1: 'reason.selectCall',
    p2: 'reason.selectCall',
    p6: 'reason.selectCall',
    range: 'reason.selectOneBlock',
    i1: 'reason.selectCall',
    k2: 'reason.selectCall',
    label: 'reason.selectCall',
    armLabel: 'reason.selectCall',
    defaultLabel: 'reason.selectCall',
    missing: 'reason.selectCall',
    head: 'reason.selectCall',
  },
  'diagram.event': { none: 'reason.nothingSelected', p6: 'reason.eventNotExtracted' },
  'diagram.method': { none: 'reason.nothingSelected', p6: 'reason.hasHead' },
  'diagram.extractMethod': {
    none: 'reason.nothingSelected',
    label: 'reason.selectBlocksToExtract',
    armLabel: 'reason.selectBlocksToExtract',
    defaultLabel: 'reason.selectBlocksToExtract',
    missing: 'reason.selectBlocksToExtract',
    head: 'reason.selectBlocksToExtract',
  },
  'diagram.removeHead': {
    none: 'reason.selectHead',
    p1: 'reason.selectHead',
    p2: 'reason.selectHead',
    p6: 'reason.selectHead',
    range: 'reason.selectHead',
    i1: 'reason.selectHead',
    k2: 'reason.selectHead',
    c1: 'reason.selectHead',
    label: 'reason.selectHead',
    armLabel: 'reason.selectHead',
    defaultLabel: 'reason.selectHead',
    missing: 'reason.selectHead',
  },
  'diagram.delete': { none: 'reason.nothingSelected' },
  'select.visual': {
    none: 'reason.nothingSelected',
    label: 'reason.nothingSelected',
    armLabel: 'reason.nothingSelected',
    defaultLabel: 'reason.nothingSelected',
    missing: 'reason.nothingSelected',
    head: 'reason.nothingSelected',
  },
  'select.clear': { none: 'reason.nothingSelected' },
};

const places: ReadonlyArray<Place> = [
  'none',
  'p1',
  'p2',
  'p6',
  'range',
  'i1',
  'k2',
  'c1',
  'label',
  'armLabel',
  'defaultLabel',
  'missing',
  'head',
];

const availability = Object.entries(refusals).flatMap(([id, row]) =>
  places.map((place) => [id, place, row[place] ?? true] as const),
);

describe('why a command is not available (03-editor 5)', () => {
  it.each(availability)('T-0558: %s with %s selected gives %j', (id, place, expected) => {
    expect(applies(engineAt(place), id)).toBe(expected);
  });

  it('T-0559: a refused command changes nothing and tells why in the status bar as a warning', () => {
    const engine = engineAt('head');
    const before = engine.content();
    engine.run('block.insert.if');
    expect(engine.content()).toBe(before);
    expect(engine.session.chrome().notice).toMatchObject({
      message: 'reason.notOnHead',
      level: 'warn',
    });
  });

  it('T-0797 · BUG-10: copy and cut on the empty default cell say there is no block there, not no default to delete', () => {
    const engine = engineAt('missing');
    engine.run('edit.copy');
    expect(notice(engine)).toBe('reason.nothingToCopy');
    engine.run('edit.cut');
    expect(notice(engine)).toBe('reason.nothingToCut');
    engine.run('edit.delete');
    expect(notice(engine)).toBe('reason.noDefaultToDelete');
  });

  it('T-0798 · BUG-11: paste, wrap and unwrap on a header say it is a header, not that nothing is selected', () => {
    const engine = engineAt('head');
    engine.run('edit.paste');
    expect(notice(engine)).toBe('reason.cannotPasteOnHead');
    engine.run('block.wrap.while');
    expect(notice(engine)).toBe('reason.cannotWrapHead');
    engine.run('block.unwrap');
    expect(notice(engine)).toBe('reason.notOnHead');
  });

  it('T-0560: undo, redo and zoom reset are refused when there is nothing to do', () => {
    const engine = engineAt('p1');
    expect(applies(engine, 'edit.undo')).toBe('reason.nothingToUndo');
    expect(applies(engine, 'edit.redo')).toBe('reason.nothingToRedo');
    expect(applies(engine, 'view.zoom.reset')).toBe('reason.zoomLimit');
    engine.run('view.zoom.out');
    expect(engine.session.state.zoom).toBe(0.9);
    expect(applies(engine, 'view.zoom.reset')).toBe(true);
  });

  it('T-0561: deleting the only diagram is refused', () => {
    const engine = testEngine(contentOf([proc('b1')]));
    engine.select(selectBlock(indexDoc(engine.content()), 'b1'));
    expect(applies(engine, 'diagram.delete')).toBe('reason.lastDiagram');
  });
});

describe('the Event and Method command titles (interaction rules "새 Method로 빼기와 새 다이어그램")', () => {
  const title = (engine: TestEngine, id: string): unknown => {
    const spec = engine.registry.list().find((s) => s.id === id);
    return typeof spec?.title === 'function' ? spec.title(engine.registry.context()) : spec?.title;
  };

  it.each([
    ['none', 'diagram.method', 'command.diagram.method'],
    ['p1', 'diagram.method', 'command.diagram.method.add'],
    ['p1', 'diagram.event', 'command.diagram.event.add'],
    ['head', 'diagram.event', 'command.diagram.event.change'],
    ['p6', 'diagram.method', 'command.diagram.method'],
    ['head', 'diagram.method', 'command.diagram.method.change'],
    ['p6', 'diagram.event', 'command.diagram.event'],
  ] as const)('T-0562: with %s selected, %s is called %s', (place, id, expected) => {
    expect(title(engineAt(place), id)).toBe(expected);
  });
});

describe('rarer ways the commands run (02-interaction-rules)', () => {
  it('T-0563: the insert process command on a Case branch label adds a branch after it, as o does', () => {
    const engine = engineAt('armLabel');
    engine.run('block.insert.process');
    const k1 = engine.session.index().blocks.get('k1')?.block;
    expect(k1?.kind === 'case' ? k1.arms.length : 0).toBe(2);
    expect(engine.session.state.selection?.kind).toBe('branchLabel');
    expect(engine.session.state.editing?.field.kind).toBe('branchLabel');
  });

  it('T-0564: a branch added after the default branch goes before it, and the user is told', () => {
    const engine = engineAt('defaultLabel');
    engine.run('branch.insert');
    const k2 = engine.session.index().blocks.get('k2')?.block;
    expect(k2?.kind === 'case' ? k2.arms.map((a) => a.id) : []).toHaveLength(2);
    expect(k2?.kind === 'case' ? k2.otherwise?.id : null).toBe('o2');
    expect(notice(engine)).toBe('notice.defaultStaysLast');
  });

  it('T-0565: with nothing selected after a header, a new block goes at the end of that diagram', () => {
    const engine = engineAt('head');
    engine.select(null);
    engine.run('block.insert.process');
    expect(bodyOf(engine, 'd2')).toHaveLength(2);
    expect(bodyOf(engine, 'd2')[0]).toBe('p6');
  });

  it('T-0566: a Case with one branch and a default becomes an If and stays selected', () => {
    const engine = engineAt('k2');
    engine.run('branch.convertCaseToIf');
    expect(engine.session.index().blocks.get('k2')?.block.kind).toBe('if');
    expect(selected(engine)).toEqual(['k2']);
  });

  it('T-0567: Delete on a header removes the header and selects the first block', () => {
    const engine = engineAt('head');
    engine.run('edit.delete');
    expect(engine.content().diagrams.find((d) => d.id === 'd2')?.head).toBeNull();
    expect(selected(engine)).toEqual(['p6']);
  });

  it('T-0568: pasting on the empty default cell makes the default branch with the pasted blocks', async () => {
    const engine = engineAt('p1');
    engine.run('edit.copy');
    await engine.settle();
    engine.select({ kind: 'missingDefault', block: 'k1' });
    engine.run('edit.paste');
    await engine.settle();
    const k1 = engine.session.index().blocks.get('k1')?.block;
    const pasted = k1?.kind === 'case' ? k1.otherwise?.body.blocks : undefined;
    expect(pasted?.map((b) => b.kind === 'process' && b.text)).toEqual(['p1']);
    expect(engine.session.state.undo).toHaveLength(1);
  });

  it('T-0569: a paste is dropped when the document became view only while the clipboard was read', async () => {
    const engine = engineAt('p1');
    engine.run('edit.copy');
    await engine.settle();
    const before = engine.content();
    engine.run('edit.paste');
    engine.session.setReadOnly(true);
    await engine.settle();
    expect(engine.content()).toBe(before);
    expect(notice(engine)).toBe('reason.readOnly');
  });

  it('T-0570: pasting an empty clipboard says so', async () => {
    const engine = engineAt('p1');
    engine.run('edit.paste');
    await engine.settle();
    expect(notice(engine)).toBe('reason.emptyClip');
  });

  it('T-0571: a call block inserted on the empty default cell makes the default branch', async () => {
    const engine = engineAt('missing');
    engine.run('block.insert.call');
    engine.picker()?.choose(0);
    await engine.settle();
    const k1 = engine.session.index().blocks.get('k1')?.block;
    const made = k1?.kind === 'case' ? k1.otherwise?.body.blocks : undefined;
    expect(made?.map((b) => b.kind)).toEqual(['call']);
    expect(engine.session.state.undo).toHaveLength(1);
  });

  it('T-0572: a call block is not inserted when the document became view only while the list was open', async () => {
    const engine = engineAt('p1');
    const before = engine.content();
    engine.run('block.insert.call');
    engine.session.setReadOnly(true);
    engine.picker()?.choose(0);
    await engine.settle();
    expect(engine.content()).toBe(before);
    expect(notice(engine)).toBe('reason.readOnly');
  });

  it('T-0573: choosing "New Method" as a call target makes the Method and edits its name, in one undo step', async () => {
    const engine = engineAt('c1');
    engine.run('call.setTarget');
    expect(engine.picker()?.active).toBe(0);
    engine.picker()?.choose(1);
    await engine.settle();
    const made = engine.content().diagrams.find((d) => !['d1', 'd2', 'd3'].includes(d.id));
    expect(made?.head).toEqual({ kind: 'method', text: 'Method 1' });
    const c1 = engine.session.index().blocks.get('c1')?.block;
    expect(c1?.kind === 'call' ? c1.target : null).toEqual({ kind: 'local', diagram: made?.id });
    expect(engine.session.state.editing?.field).toEqual({ kind: 'head', diagram: made?.id });
    expect(engine.session.state.undo).toHaveLength(1);
  });

  it('T-0574: closing the call target list changes nothing', async () => {
    const engine = engineAt('c1');
    const before = engine.content();
    engine.run('call.setTarget');
    engine.picker()?.choose(null);
    await engine.settle();
    expect(engine.content()).toBe(before);
  });

  it.each([
    // Drawn order: d1, d3, then the Method d2.
    ['p1', 'd1', ['p9']],
    ['p9', 'd3', { kind: 'head', diagram: 'd2' }],
    ['p6', 'd2', ['p9']],
  ] as const)(
    'T-0575: deleting the diagram of %s (%s) selects the next diagram drawn: %j',
    (block, diagram, expected) => {
      const engine = testEngine(sample());
      engine.select(selectBlock(indexDoc(engine.content()), block));
      engine.run('diagram.delete');
      expect(engine.content().diagrams.map((d) => d.id)).not.toContain(diagram);
      expect(notice(engine)).toBe('notice.diagramDeleted');
      if (Array.isArray(expected)) {
        expect(selected(engine)).toEqual(expected);
      } else {
        expect(engine.session.state.selection).toEqual(expected);
      }
    },
  );
});
