// Call blocks: replaced by their Method's blocks (R-EDIT-08), calls by a written name (R-BLK-08),
// and pasting calls into another document.
import { describe, expect, it } from 'vitest';

import type { Call, Content } from '../model/types';
import { editCall, insertNamedCall, nameCallTarget } from './call';
import { copy, paste } from './clipboard';
import { inlineCall } from './inline';
import { unwrap } from './wrap';
import {
  blockOf,
  call,
  contentOf,
  contentWith,
  diagram,
  expectRefused,
  foldsIn,
  idsIn,
  method,
  proc,
  runOk,
  seq,
  whileBlock,
} from './test-support';

const withSiteFolds = (block: Call, siteFolds: Call['siteFolds']): Call => ({
  ...block,
  siteFolds,
});

describe('replacing a call block with its Method (R-EDIT-08)', () => {
  const content: Content = contentWith(
    diagram('d1', null, [proc('b1', 'before'), call('b2', 'd2', 'a, 0', 'p'), proc('b3', 'after')]),
    diagram(
      'd2',
      method('sort(a, lo)'),
      seq(
        [proc('b10', 'n'), whileBlock('b11', [proc('b12', 'swap')]), call('b13', 'd2')],
        [{ id: 'f1', first: 'b10', last: 'b11', name: 'body' }],
      ),
    ),
  );

  it('inline: the call block becomes copies of the Method blocks; the Method stays', () => {
    const result = runOk(inlineCall, content, { block: 'b2' });
    expect(idsIn(result.content, 'd1')).toEqual(['b1', 'b14', 'b15', 'b17', 'b3']);
    expect(blockOf(result.content, 'b14')).toEqual({ id: 'b14', kind: 'process', text: 'n' });
    // A call inside keeps calling the same Method (here itself).
    expect(blockOf(result.content, 'b17')).toMatchObject({
      kind: 'call',
      target: { kind: 'local', diagram: 'd2' },
    });
    expect(foldsIn(result.content, 'd1')).toEqual(['f2:b14-b15']);
    expect(result.content.diagrams[1]).toBe(content.diagrams[1]);
    expect(result.touched).toEqual(['b14', 'b15', 'b17']);
    expect(result.renamed.get('b12')).toBe('b16');
    expect(result.renamed.get('f1')).toBe('f2');
  });

  it('inline: the regions of the call site become fold regions; deeper ones go with the inner call', () => {
    const sited = contentWith(
      diagram('d1', null, [
        withSiteFolds(call('b2', 'd2'), [
          { id: 'f5', via: [], first: 'b12', last: 'b12', name: 'one' },
          { id: 'f6', via: ['b13'], first: 'b10', last: 'b10' },
          { id: 'f7', via: [], first: 'b10', last: 'b11' },
        ]),
      ]),
      content.diagrams[1] ?? diagram('d2', method('x'), [proc('b9')]),
    );
    const result = runOk(inlineCall, sited, { block: 'b2' });
    // f7 repeats the Method's region f1: left out, like on the screen.
    expect(foldsIn(result.content, 'b15')).toEqual([`${result.renamed.get('f5') ?? ''}:b16-b16`]);
    const inner = blockOf(result.content, result.renamed.get('b13') ?? '');
    expect(inner.kind === 'call' ? inner.siteFolds.map((fold) => fold.via) : null).toEqual([[]]);
  });

  it('inline: unwrap does the same on one call block; a call that calls nothing here is refused', () => {
    const viaUnwrap = runOk(unwrap, content, {
      target: { kind: 'blocks', first: 'b2', last: 'b2' },
    });
    expect(idsIn(viaUnwrap.content, 'd1')).toEqual(['b1', 'b14', 'b15', 'b17', 'b3']);
    const named = contentOf([call('b1', { kind: 'named', name: 'printf' })]);
    expectRefused(inlineCall, named, { block: 'b1' }, 'notCallable');
    expectRefused(inlineCall, content, { block: 'b1' }, 'wrongKind');
    expectRefused(inlineCall, content, { block: 'x' }, 'notFound');
  });
});

describe('calls by a written name (R-BLK-08)', () => {
  const content = contentOf([proc('b1')]);

  it('named call: inserts a call block calling a written name, one line and trimmed', () => {
    const result = runOk(insertNamedCall, content, {
      target: { kind: 'blocks', first: 'b1', last: 'b1' },
      side: 'after',
      name: ' printf\n',
    });
    expect(blockOf(result.content, 'b2')).toEqual(call('b2', { kind: 'named', name: 'printf' }));
  });

  it('named call: the name is edited with the arguments; once written it cannot be emptied', () => {
    const named = contentOf([call('b1', { kind: 'named', name: 'printf' })]);
    const result = runOk(editCall, named, { block: 'b1', name: 'puts', args: 's' });
    expect(blockOf(result.content, 'b1')).toMatchObject({ target: { name: 'puts' }, args: 's' });
    expectRefused(editCall, named, { block: 'b1', name: ' ' }, 'emptyCallName');
    const unnamed = contentOf([call('b1', { kind: 'named', name: '' })]);
    expect(runOk(editCall, unnamed, { block: 'b1', name: '' }).content).toBe(unnamed);
    const local = contentWith(
      diagram('d1', null, [call('b1', 'd2')]),
      diagram('d2', method('f'), [proc('b2')]),
    );
    expectRefused(editCall, local, { block: 'b1', name: 'g' }, 'wrongKind');
  });

  it('named call: any call block can be made to call a written name', () => {
    const local = contentWith(
      diagram('d1', null, [
        withSiteFolds(call('b1', 'd2', 'x'), [{ id: 'f1', via: [], first: 'b2', last: 'b2' }]),
      ]),
      diagram('d2', method('f(x)'), [proc('b2')]),
    );
    const result = runOk(nameCallTarget, local, { block: 'b1', name: 'g' });
    expect(blockOf(result.content, 'b1')).toEqual({
      ...call('b1', { kind: 'named', name: 'g' }, 'x'),
    });
    expect(runOk(nameCallTarget, result.content, { block: 'b1', name: 'g' }).content).toBe(
      result.content,
    );
    expectRefused(nameCallTarget, local, { block: 'b2', name: 'g' }, 'wrongKind');
    expectRefused(nameCallTarget, local, { block: 'x', name: 'g' }, 'notFound');
  });
});

describe('pasting call blocks with the names of their Methods', () => {
  const source = contentWith(
    diagram('d1', null, [call('b1', 'd2')]),
    diagram('d2', method('merge(a)'), [proc('b2')]),
  );
  const clip = (() => {
    const copied = copy(source, { target: { kind: 'blocks', first: 'b1', last: 'b1' } });
    if (!copied.ok) {
      throw new Error('copy failed');
    }
    return copied.clip;
  })();
  const names = new Map([['d2', 'merge']]);

  it('paste: a call goes to the Method of the same name here, whatever its id', () => {
    const other = contentWith(
      diagram('d1', null, [proc('b1')]),
      diagram('d5', method('merge(xs)'), [proc('b2')]),
    );
    const result = runOk(paste, other, {
      target: { kind: 'blocks', first: 'b1', last: 'b1' },
      side: 'after',
      clip,
      names,
    });
    expect(blockOf(result.content, 'b3')).toMatchObject({
      target: { kind: 'local', diagram: 'd5' },
    });
  });

  it('paste: without that name here the call keeps the name it showed, not "(no name)"', () => {
    const other = contentWith(
      diagram('d1', null, [proc('b1')]),
      diagram('d2', method('split'), [proc('b2')]),
    );
    const result = runOk(paste, other, {
      target: { kind: 'blocks', first: 'b1', last: 'b1' },
      side: 'after',
      clip,
      names,
    });
    // Not tied to the Method that happens to have the same id.
    expect(blockOf(result.content, 'b3')).toMatchObject({
      target: { kind: 'lost', lastName: 'merge' },
    });
  });
});
