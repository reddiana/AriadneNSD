import { describe, expect, it } from 'vitest';

import {
  arm,
  branch,
  caseBlock,
  contentOf,
  empty,
  ifBlock,
  proc,
  testEngine,
  whileBlock,
} from '../engine-test-support';
import { clipToJson } from '../clipboard/clip-format';
import { indexDoc } from '../model/doc-index';
import { selectBlock, selectRange, selectedBlocks } from '../state/selection';
import type { TestEngine } from '../engine-test-support';

const select = (engine: TestEngine, id: string): void => {
  engine.select(selectBlock(indexDoc(engine.content()), id));
};

const selected = (engine: TestEngine): ReadonlyArray<string> =>
  selectedBlocks(engine.session.index(), engine.session.state.selection);

const bodyOf = (engine: TestEngine, owner = 'd1'): ReadonlyArray<string> =>
  engine.session
    .index()
    .seqs.get(owner)
    ?.seq.blocks.map((b) => b.id) ?? [];

const textOf = (engine: TestEngine, id: string): string | undefined => {
  const block = engine.session.index().blocks.get(id)?.block;
  return block !== undefined && 'text' in block ? block.text : undefined;
};

describe('inserting and editing text (AT-03)', () => {
  it('T-0027 · R-EDIT-01: a + kind inserts after the selection and opens its text field', () => {
    const engine = testEngine(contentOf([proc('b1'), proc('b2')]));
    select(engine, 'b1');
    engine.keys('a', 'i');
    expect(bodyOf(engine)).toEqual(['b1', 'b3', 'b2']);
    expect(selected(engine)).toEqual(['b3']);
    expect(engine.session.state.editing?.field).toEqual({ kind: 'block', block: 'b3' });
    engine.session.commitEditing('n > 0');
    expect(textOf(engine, 'b3')).toBe('n > 0');
    // Inserting and writing are two undo steps (01-model 4.4).
    expect(engine.session.state.undo).toHaveLength(2);
    engine.keys('u', 'u');
    expect(bodyOf(engine)).toEqual(['b1', 'b2']);
  });

  it('T-0028 · UX MD2: closing the text field with the same text leaves no undo step', () => {
    const engine = testEngine(contentOf([proc('b1', 'x')]));
    select(engine, 'b1');
    engine.keys('Enter');
    expect(engine.session.state.editing?.caret).toBe('selectAll');
    engine.session.commitEditing('x');
    expect(engine.session.state.undo).toHaveLength(0);
    engine.keys('c', 'c');
    expect(engine.session.state.editing?.text).toBe('');
    engine.session.commitEditing('y');
    expect(textOf(engine, 'b1')).toBe('y');
    expect(engine.session.state.undo).toHaveLength(1);
  });

  it.each([
    [['o'], ['b1', 'b2']],
    [
      ['a', 'p'],
      ['b1', 'b2'],
    ],
    [['O'], ['b2', 'b1']],
    [
      ['A', 'p'],
      ['b2', 'b1'],
    ],
  ])('T-0029 · UX KP2: a process block (%j) goes next to an empty block too', (keys, body) => {
    const engine = testEngine(contentOf([empty('b1')]));
    select(engine, 'b1');
    engine.keys(...keys);
    expect(bodyOf(engine)).toEqual(body);
    expect(engine.session.state.editing?.field).toEqual({ kind: 'block', block: 'b2' });
  });

  it('T-0030: interaction rules 2: a control block on an empty block takes its place', () => {
    const engine = testEngine(contentOf([empty('b1')]));
    select(engine, 'b1');
    engine.keys('a', 'w');
    expect(bodyOf(engine)).toEqual(['b2']);
  });

  it('T-0031: interaction rules "블록 아이콘": with nothing selected, a block goes at the diagram end', () => {
    const engine = testEngine(contentOf([proc('b1')]));
    engine.run('block.insert.while');
    expect(bodyOf(engine)).toEqual(['b1', 'b2']);
  });
});

describe('the selection after a command (03-editor 2.3)', () => {
  it('T-0032 · UX Q19: after deleting, the next block, else the previous, else the holder', () => {
    const engine = testEngine(contentOf([proc('b1'), proc('b2'), whileBlock('b3', [proc('b4')])]));
    select(engine, 'b1');
    engine.keys('x');
    expect(selected(engine)).toEqual(['b2']);
    select(engine, 'b4');
    engine.keys('Delete');
    expect(selected(engine)).toEqual(['b3']);
    select(engine, 'b3');
    engine.keys('x');
    expect(selected(engine)).toEqual(['b2']);
  });

  it('T-0033 · UX Q19: undo keeps the selection while what it names is still there', () => {
    const engine = testEngine(contentOf([proc('b1'), proc('b2')]));
    select(engine, 'b1');
    engine.keys('o');
    engine.session.commitEditing('');
    expect(selected(engine)).toEqual(['b3']);
    engine.keys('u');
    expect(engine.session.state.selection).toBeNull();
    select(engine, 'b2');
    engine.keys('U');
    expect(selected(engine)).toEqual(['b2']);
  });

  it('T-0034 · R-EDIT-06: wrapping selects the new block and opens its condition', () => {
    const engine = testEngine(contentOf([proc('b1'), proc('b2')]));
    engine.select(selectRange(indexDoc(engine.content()), 'b1', 'b2'));
    engine.keys('s', 'w');
    expect(bodyOf(engine)).toEqual(['b3']);
    expect(bodyOf(engine, 'b3')).toEqual(['b1', 'b2']);
    expect(engine.session.state.editing?.field).toEqual({ kind: 'block', block: 'b3' });
  });

  it('T-0035 · R-EDIT-07: unwrapping from inside keeps the selection and says what was removed', () => {
    const engine = testEngine(contentOf([whileBlock('b1', [proc('b2'), proc('b3')])]));
    select(engine, 'b2');
    engine.keys('d', 's');
    expect(bodyOf(engine)).toEqual(['b2', 'b3']);
    expect(selected(engine)).toEqual(['b2']);
    expect(engine.session.chrome().notice?.message).toEqual({
      key: 'notice.unwrapped',
      params: { kind: 'While' },
    });
  });

  it('T-0520 · R-EDIT-07: unwrap is greyed out when no control block would come off', () => {
    const engine = testEngine(contentOf([proc('b1'), whileBlock('b2', [proc('b3')])]));
    const unwrapWhen = (): unknown =>
      engine.registry
        .list()
        .find((spec) => spec.id === 'block.unwrap')
        ?.when(engine.registry.context());
    select(engine, 'b1');
    expect(unwrapWhen()).toBe('reason.noControlBlock');
    select(engine, 'b2');
    expect(unwrapWhen()).toBe(true);
    select(engine, 'b3');
    expect(unwrapWhen()).toBe(true);
  });

  it('T-0036 · R-EDIT-11: moving keeps the moved blocks selected', () => {
    const engine = testEngine(contentOf([proc('b1'), proc('b2')]));
    select(engine, 'b2');
    engine.keys('Alt+k');
    expect(bodyOf(engine)).toEqual(['b2', 'b1']);
    expect(selected(engine)).toEqual(['b2']);
    engine.keys('Alt+k');
    expect(engine.session.chrome().notice?.message).toBe('reason.atTop');
  });
});

describe('the clipboard (AT-12)', () => {
  it('T-0037 · R-EDIT-10: dd cuts, p pastes after the selection with new ids', async () => {
    const engine = testEngine(contentOf([proc('b1', 'one'), proc('b2', 'two')]));
    select(engine, 'b1');
    engine.keys('d', 'd');
    await engine.settle();
    expect(bodyOf(engine)).toEqual(['b2']);
    expect(engine.clipboard.data.text).toBe('one');
    expect(engine.clipboard.data.json).not.toBeNull();
    engine.keys('p');
    await engine.settle();
    expect(bodyOf(engine)).toEqual(['b2', 'b3']);
    expect(textOf(engine, 'b3')).toBe('one');
    expect(selected(engine)).toEqual(['b3']);
  });

  it('T-0038 · AT-12: text from another program becomes one process block per line', async () => {
    const engine = testEngine(contentOf([proc('b1')]));
    engine.clipboard.data = { text: 'first\n  second', json: null };
    select(engine, 'b1');
    engine.keys('P');
    await engine.settle();
    expect(bodyOf(engine).map((id) => textOf(engine, id))).toEqual(['first', 'second', 'b1']);
  });

  it('T-0039 · AT-12: the custom format wins over the text', async () => {
    const engine = testEngine(contentOf([proc('b1')]));
    engine.clipboard.data = {
      text: 'ignored',
      json: clipToJson({ blocks: [whileBlock('b9', [proc('b8', 'inner')])], folds: [] }),
    };
    select(engine, 'b1');
    engine.run('edit.paste');
    await engine.settle();
    const [, pasted] = bodyOf(engine);
    expect(
      pasted === undefined ? null : engine.session.index().blocks.get(pasted)?.block.kind,
    ).toBe('while');
  });

  it('T-0040: interaction rules "붙여넣기": nothing selected pastes nothing', async () => {
    const engine = testEngine(contentOf([proc('b1')]));
    engine.clipboard.data = { text: 'x', json: null };
    engine.run('edit.paste');
    await engine.settle();
    expect(bodyOf(engine)).toEqual(['b1']);
    expect(engine.session.chrome().notice?.message).toBe('reason.nothingSelected');
  });

  it('T-0041: 03-keymap: v, then j j and y copies the range', async () => {
    const engine = testEngine(contentOf([proc('b1'), proc('b2'), proc('b3')]));
    select(engine, 'b1');
    engine.keys('v', 'j', 'j', 'y');
    await engine.settle();
    expect(engine.clipboard.data.text).toBe('b1\nb2\nb3');
    expect(engine.session.state.mode).toBe('normal');
  });
});

describe('branches (R-EDIT-11, UX MD3)', () => {
  const caseContent = () =>
    contentOf([
      caseBlock(
        'b1',
        [arm('r1', '1', [proc('b2')]), arm('r2', '2', [proc('b3')])],
        branch('r3', [proc('b4')]),
      ),
    ]);

  it('T-0042 · R-EDIT-11: o on a branch label inserts a branch and opens its label', () => {
    const engine = testEngine(caseContent());
    engine.select({ kind: 'branchLabel', branch: 'r1' });
    engine.keys('o');
    expect(engine.session.state.selection).toEqual({ kind: 'branchLabel', branch: 'r4' });
    expect(engine.session.state.editing).toMatchObject({
      field: { kind: 'branchLabel', branch: 'r4' },
      caret: 'selectAll',
    });
  });

  it('T-0043 · UX MD3: deleting down to one branch asks to make an If; Esc keeps the Case', () => {
    const engine = testEngine(caseContent());
    engine.select({ kind: 'branchLabel', branch: 'r1' });
    engine.keys('x');
    expect(engine.session.chrome().question?.message).toBe('question.convertCaseToIf');
    expect(engine.session.state.selection).toEqual({ kind: 'branchLabel', branch: 'r2' });
    engine.keys('Escape');
    expect(engine.session.chrome().question).toBeNull();
    expect(engine.session.index().blocks.get('b1')?.block.kind).toBe('case');
  });

  it('T-0044 · UX MD3: inserting a branch on an If asks to make it a Case; Enter converts', () => {
    const engine = testEngine(
      contentOf([ifBlock('b1', branch('r1', [proc('b2')]), branch('r2', [proc('b3')]))]),
    );
    engine.select({ kind: 'branchLabel', branch: 'r2' });
    engine.keys('o');
    expect(engine.session.chrome().question?.message).toBe('question.convertIfToCase');
    engine.keys('Enter');
    expect(engine.session.index().blocks.get('b1')?.block.kind).toBe('case');
    expect(engine.session.state.editing?.field.kind).toBe('branchLabel');
  });

  it('T-0045 · R-EDIT-12: an If branch label opens with its drawn word', () => {
    const engine = testEngine(
      contentOf([ifBlock('b1', branch('r1', [proc('b2')]), branch('r2', [proc('b3')]))]),
    );
    select(engine, 'b2');
    engine.keys('L');
    expect(engine.session.state.editing).toMatchObject({ initial: 'true' });
    engine.session.commitEditing('yes');
    const block = engine.session.index().blocks.get('b1')?.block;
    expect(block?.kind === 'if' ? block.yes.label : null).toBe('yes');
  });

  it('T-0046 · UX CD1: typing into the empty default cell makes the default branch, one undo step', () => {
    const engine = testEngine(contentOf([caseBlock('b1', [arm('r1', '1', [proc('b2')])], null)]));
    engine.select({ kind: 'missingDefault', block: 'b1' });
    engine.keys('Enter');
    engine.session.commitEditing('other');
    const block = engine.session.index().blocks.get('b1')?.block;
    expect(block?.kind === 'case' ? block.otherwise?.body.blocks[0] : null).toMatchObject({
      text: 'other',
    });
    expect(engine.session.state.undo).toHaveLength(1);
    engine.keys('u');
    const undone = engine.session.index().blocks.get('b1')?.block;
    expect(undone?.kind === 'case' ? undone.otherwise : 'not a case').toBeNull();
  });

  it('T-0047 · UX CD1: inserting on the empty default cell makes the branch; deleting there does nothing', () => {
    const engine = testEngine(contentOf([caseBlock('b1', [arm('r1', '1', [proc('b2')])], null)]));
    engine.select({ kind: 'missingDefault', block: 'b1' });
    engine.keys('x');
    expect(engine.session.chrome().notice?.message).toBe('reason.noDefaultToDelete');
    engine.keys('a', 'w');
    const block = engine.session.index().blocks.get('b1')?.block;
    expect(block?.kind === 'case' ? block.otherwise?.body.blocks[0]?.kind : null).toBe('while');
    expect(engine.session.state.undo).toHaveLength(1);
  });
});

describe('keys and modes (03-keymap)', () => {
  it('T-0048: interaction rules 2: Esc twice clears the selection; a move key comes back to it', () => {
    const engine = testEngine(contentOf([proc('b1'), proc('b2')]));
    select(engine, 'b2');
    engine.keys('Escape');
    expect(engine.session.chrome().notice?.message).toBe('notice.escAgain');
    expect(selected(engine)).toEqual(['b2']);
    engine.keys('Escape');
    expect(engine.session.state.selection).toBeNull();
    engine.keys('j');
    expect(selected(engine)).toEqual(['b2']);
  });

  it('T-0049 · UX K1: the key hint shows 0.4 s after the first key; Esc cancels', () => {
    const engine = testEngine(contentOf([proc('b1')]));
    select(engine, 'b1');
    engine.keys('a');
    expect(engine.session.chrome()).toMatchObject({
      pendingKeys: 'a',
      isKeyHintShown: false,
      keyHintTitle: 'keyHint.a',
    });
    engine.timers.runAll();
    expect(engine.session.chrome().isKeyHintShown).toBe(true);
    engine.keys('Escape');
    expect(engine.session.chrome()).toMatchObject({ pendingKeys: null, isKeyHintShown: false });
    expect(engine.session.chrome().notice?.message).toBe('notice.keyCancelled');
  });

  it('T-0050: 03-keymap: a Vim key the table lacks is reported, other keys go to the browser', () => {
    const engine = testEngine(contentOf([proc('b1')]));
    expect(engine.keys('q', 'Tab')).toEqual([true, false]);
    expect(engine.session.chrome().notice?.message).toEqual({
      key: 'notice.unknownKey',
      params: { keys: 'q' },
    });
  });

  it('T-0051: 03-editor 1.1: zoom goes in 10% steps between 40% and 300%', () => {
    const engine = testEngine(contentOf([proc('b1')]));
    engine.keys('+');
    expect(engine.session.state.zoom).toBe(1.1);
    for (let i = 0; i < 30; i += 1) {
      engine.keys('+');
    }
    expect(engine.session.state.zoom).toBe(3);
    expect(engine.session.chrome().notice?.message).toBe('reason.zoomLimit');
    engine.run('view.zoom.reset');
    expect(engine.session.state.zoom).toBe(1);
  });
});

describe('view only (03-editor 6.4)', () => {
  it('T-0052: 03-editor 6.4: editing commands are refused; moving and copying still work', async () => {
    const engine = testEngine(contentOf([proc('b1'), proc('b2')]), { readOnly: true });
    select(engine, 'b1');
    engine.keys('x');
    expect(bodyOf(engine)).toEqual(['b1', 'b2']);
    expect(engine.session.chrome().notice?.message).toBe('reason.readOnly');
    engine.keys('j');
    expect(selected(engine)).toEqual(['b2']);
    engine.keys('y', 'y');
    await engine.settle();
    expect(engine.clipboard.data.text).toBe('b2');
    const cut = engine.registry.list().find((spec) => spec.id === 'edit.cut');
    expect(cut?.when(engine.registry.context())).toBe('reason.readOnly');
  });

  it('T-0521: saving right after a paste waits for the paste', async () => {
    const engine = testEngine(contentOf([proc('b1'), proc('b2')]));
    select(engine, 'b1');
    engine.keys('y', 'y');
    await engine.settle();
    engine.keys('p', 'Ctrl+S');
    await engine.settle();
    expect(bodyOf(engine)).toHaveLength(3);
    expect(engine.saves).toEqual([engine.content()]);
  });

  it('T-0053: 03-editor 5: the registry gives every command its keys and a title', () => {
    const engine = testEngine(contentOf([proc('b1')]));
    const cut = engine.registry.list().find((spec) => spec.id === 'edit.cut');
    expect(cut?.keys).toEqual(['d d', 'Ctrl+X']);
    expect(cut?.title).toBe('command.edit.cut');
    const save = engine.registry.list().find((spec) => spec.id === 'file.save');
    const title = save?.title;
    expect(typeof title === 'function' ? title(engine.registry.context()) : title).toBe(
      'command.file.save',
    );
  });
});
