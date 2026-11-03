// Running a drop (03-editor 3.2): insert, wrap, move and the missing default of a Case, each one undo step.
import { describe, expect, it } from 'vitest';

import {
  arm,
  branch,
  caseBlock,
  contentOf,
  ifBlock,
  proc,
  testEngine,
} from '../engine-test-support';
import { runDrop } from './drop-command';

const ids = (blocks: ReadonlyArray<{ readonly id: string }> | undefined): string[] =>
  (blocks ?? []).map((block) => block.id);

describe('runDrop', () => {
  it('T-0576 · R-EDIT-09: inserting a new block puts it next to the target, selects it and opens its text', () => {
    const engine = testEngine(contentOf([proc('b1'), proc('b2')]));
    const { session } = engine;
    expect(runDrop(session, { kind: 'insert', to: 'b1', side: 'after', blockKind: 'while' })).toBe(
      true,
    );
    const blocks = engine.content().diagrams[0]?.body.blocks ?? [];
    expect(blocks).toHaveLength(3);
    const made = blocks[1];
    expect(made?.kind).toBe('while');
    expect(session.state.selection).toMatchObject({
      kind: 'blocks',
      anchor: made?.id,
      focus: made?.id,
    });
    expect(session.state.editing).toMatchObject({
      field: { kind: 'block', block: made?.id },
      caret: 'end',
    });
    expect(session.state.undo).toHaveLength(1);
  });

  it('T-0577: inserting before a block puts the new block in front of it', () => {
    const engine = testEngine(contentOf([proc('b1')]));
    runDrop(engine.session, { kind: 'insert', to: 'b1', side: 'before', blockKind: 'process' });
    const blocks = engine.content().diagrams[0]?.body.blocks ?? [];
    expect(blocks.map((b) => b.kind)).toEqual(['process', 'process']);
    expect(blocks[1]?.id).toBe('b1');
  });

  it('T-0578 · R-EDIT-09: wrapping puts the target inside a new control block, selects it and opens its condition', () => {
    const engine = testEngine(contentOf([proc('b1'), proc('b2'), proc('b3')]));
    const { session } = engine;
    expect(
      runDrop(session, {
        kind: 'wrap',
        target: { kind: 'blocks', first: 'b1', last: 'b2' },
        blockKind: 'if',
      }),
    ).toBe(true);
    const blocks = engine.content().diagrams[0]?.body.blocks ?? [];
    expect(blocks.map((b) => b.kind)).toEqual(['if', 'process']);
    const made = blocks[0];
    expect(made?.kind === 'if' ? ids(made.yes.body.blocks) : null).toEqual(['b1', 'b2']);
    expect(session.state.selection).toMatchObject({ kind: 'blocks', anchor: made?.id });
    expect(session.state.editing).toMatchObject({ field: { kind: 'block', block: made?.id } });
  });

  it('T-0579 · R-EDIT-09: moving blocks puts them next to the target and keeps them selected as a range, without editing', () => {
    const engine = testEngine(contentOf([proc('b1'), proc('b2'), proc('b3'), proc('b4')]));
    const { session } = engine;
    expect(
      runDrop(session, {
        kind: 'move',
        target: { kind: 'blocks', first: 'b1', last: 'b2' },
        to: 'b4',
        side: 'after',
      }),
    ).toBe(true);
    expect(ids(engine.content().diagrams[0]?.body.blocks)).toEqual(['b3', 'b4', 'b1', 'b2']);
    expect(session.state.selection).toMatchObject({ kind: 'blocks', anchor: 'b1', focus: 'b2' });
    expect(session.state.editing).toBeNull();
    expect(session.state.undo).toHaveLength(1);
  });

  it('T-0580: a move to where the blocks already are reports success but adds no undo step', () => {
    const engine = testEngine(contentOf([proc('b1'), proc('b2')]));
    const { session } = engine;
    const before = engine.content();
    expect(
      runDrop(session, {
        kind: 'move',
        target: { kind: 'blocks', first: 'b1', last: 'b1' },
        to: 'b2',
        side: 'before',
      }),
    ).toBe(true);
    expect(engine.content()).toBe(before);
    expect(session.state.undo).toHaveLength(0);
    expect(session.chrome().notice).toBeNull();
  });

  it('T-0581: a move into the moved block itself is refused, changes nothing and says why', () => {
    const engine = testEngine(
      contentOf([ifBlock('i1', branch('y', [proc('p1')]), branch('n', [proc('p2')]))]),
    );
    const { session } = engine;
    const before = engine.content();
    expect(
      runDrop(session, {
        kind: 'move',
        target: { kind: 'blocks', first: 'i1', last: 'i1' },
        to: 'p1',
        side: 'after',
      }),
    ).toBe(false);
    expect(engine.content()).toBe(before);
    expect(session.state.undo).toHaveLength(0);
    expect(session.chrome().notice?.level).toBe('warn');
  });

  it('T-0582: in view only nothing is dropped and the status bar says why', () => {
    const engine = testEngine(contentOf([proc('b1')]), { readOnly: true });
    const { session } = engine;
    const before = engine.content();
    expect(runDrop(session, { kind: 'insert', to: 'b1', side: 'after', blockKind: 'if' })).toBe(
      false,
    );
    expect(engine.content()).toBe(before);
    expect(session.chrome().notice).toMatchObject({ message: 'reason.readOnly', level: 'warn' });
  });

  it('T-0583 · UX CD1: a new block dropped on the missing default makes the default and opens the new block', () => {
    const engine = testEngine(
      contentOf([
        caseBlock('c1', [arm('a1', '1', [proc('p1')]), arm('a2', '2', [proc('p2')])], null),
      ]),
    );
    const { session } = engine;
    expect(
      runDrop(session, {
        kind: 'intoMissingDefault',
        caseBlock: 'c1',
        source: { kind: 'new', blockKind: 'for' },
      }),
    ).toBe(true);
    const made = engine.content().diagrams[0]?.body.blocks[0];
    const otherwise = made?.kind === 'case' ? made.otherwise : null;
    expect(otherwise).not.toBeNull();
    const kinds = (otherwise?.body.blocks ?? []).map((b) => b.kind);
    expect(kinds).toContain('for');
    const forBlock = otherwise?.body.blocks.find((b) => b.kind === 'for');
    expect(session.state.selection).toMatchObject({ kind: 'blocks', anchor: forBlock?.id });
    expect(session.state.editing).toMatchObject({ field: { kind: 'block', block: forBlock?.id } });
    // Making the default and filling it is one undo step.
    expect(session.state.undo).toHaveLength(1);
    engine.run('edit.undo');
    const undone = engine.content().diagrams[0]?.body.blocks[0];
    expect(undone?.kind === 'case' ? undone.otherwise : 'not a case').toBeNull();
  });

  it('T-0584 · UX CD1: blocks dropped on the missing default move into the new default, selected, not edited', () => {
    const engine = testEngine(
      contentOf([
        caseBlock('c1', [arm('a1', '1', [proc('p1')]), arm('a2', '2', [proc('p2')])], null),
        proc('b1'),
      ]),
    );
    const { session } = engine;
    expect(
      runDrop(session, {
        kind: 'intoMissingDefault',
        caseBlock: 'c1',
        source: {
          kind: 'blocks',
          target: { kind: 'blocks', first: 'b1', last: 'b1' },
          blocks: ['b1'],
        },
      }),
    ).toBe(true);
    const blocks = engine.content().diagrams[0]?.body.blocks ?? [];
    expect(ids(blocks)).toEqual(['c1']);
    const made = blocks[0];
    const otherwise = made?.kind === 'case' ? made.otherwise : null;
    expect(ids(otherwise?.body.blocks)).toContain('b1');
    expect(session.state.selection).toMatchObject({ kind: 'blocks', anchor: 'b1' });
    expect(session.state.editing).toBeNull();
  });

  it('T-0585: a Case that already has a default refuses the missing-default drop and changes nothing', () => {
    const engine = testEngine(
      contentOf([caseBlock('c1', [arm('a1', '1', [proc('p1')])], branch('o1', [proc('p2')]))]),
    );
    const { session } = engine;
    const before = engine.content();
    expect(
      runDrop(session, {
        kind: 'intoMissingDefault',
        caseBlock: 'c1',
        source: { kind: 'new', blockKind: 'process' },
      }),
    ).toBe(false);
    expect(engine.content()).toBe(before);
    expect(session.chrome().notice).toMatchObject({ message: 'reason.wrongKind', level: 'warn' });
  });
});
