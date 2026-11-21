// Call blocks: replaced by their Method's blocks (R-EDIT-08), calls by a written name (R-BLK-08),
// and pasting calls into another document.
import { describe, expect, it } from 'vitest';

import type { Call, Content } from '../model/types';
import { editCall, insertNamedCall, nameCallTarget } from './call';
import { copy, paste } from './clipboard';
import { inlineCall, inlineMethod } from './inline';
import { unwrap } from './wrap';
import {
  blockOf,
  call,
  contentOf,
  contentWith,
  diagram,
  diagramIds,
  event,
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

  it('T-1079: inline: the call block becomes copies of the Method blocks; the Method stays', () => {
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

  it('T-1080: inline: the regions of the call site become fold regions; deeper ones go with the inner call', () => {
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

  it("T-1411: inline: a call site with its own regions brings only those, not the Method's (ADR-0047)", () => {
    const sited = contentWith(
      diagram('d1', null, [
        withSiteFolds(call('b2', 'd2'), [
          { id: 'f7', via: [], first: 'b10', last: 'b11', name: 'renamed' },
          { id: 'f8', via: ['b13'], first: 'b10', last: 'b10' },
        ]),
      ]),
      content.diagrams[1] ?? diagram('d2', method('x'), [proc('b9')]),
    );
    const result = runOk(inlineCall, sited, { block: 'b2', ownRegions: true });
    // f7 is the site's copy of f1, renamed there: it comes in with its name, and f1 does not.
    const copy = result.renamed.get('f7') ?? '';
    expect(foldsIn(result.content, 'd1')).toEqual([
      `${copy}:${result.renamed.get('b10') ?? ''}-${result.renamed.get('b11') ?? ''}`,
    ]);
    expect(result.renamed.has('f1')).toBe(false);
    const inner = blockOf(result.content, result.renamed.get('b13') ?? '');
    expect(inner.kind === 'call' ? inner.siteFolds.map((fold) => fold.first) : null).toEqual([
      'b10',
    ]);
    // A site that removed the copy brings no region at all.
    const removed = contentWith(
      diagram('d1', null, [call('b2', 'd2')]),
      content.diagrams[1] ?? diagram('d2', method('x'), [proc('b9')]),
    );
    const bare = runOk(inlineCall, removed, { block: 'b2', ownRegions: true });
    expect(foldsIn(bare.content, 'd1')).toEqual([]);
  });

  it('T-1081: inline: unwrap does the same on one call block; a call that calls nothing here is refused', () => {
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

describe('inlining a Method at every call and deleting it ("Method 풀어 넣고 지우기")', () => {
  // d1: Event { b1; call b2 -> d3; while b3 { call b4 -> d3 } }
  // d2: Method "other" { call b5 -> d3 }
  // d3: Method "m" { fold f1 over b10, b11: b10; while b11 { b12 } }
  const content: Content = contentWith(
    diagram('d1', event('start'), [
      proc('b1'),
      call('b2', 'd3'),
      whileBlock('b3', [call('b4', 'd3')]),
    ]),
    diagram('d2', method('other'), [call('b5', 'd3')]),
    diagram(
      'd3',
      method('m'),
      seq(
        [proc('b10', 'n'), whileBlock('b11', [proc('b12', 'swap')])],
        [{ id: 'f1', first: 'b10', last: 'b11', name: 'body' }],
      ),
    ),
  );

  it('T-1448: inline method: every call, also inside other Methods and loops, becomes copies; the Method goes', () => {
    const result = runOk(inlineMethod, content, { diagram: 'd3' });
    expect(diagramIds(result.content)).toEqual(['d1', 'd2']);
    expect(result.sites.map((site) => site.call)).toEqual(['b2', 'b4', 'b5']);
    const [first, second, third] = result.sites;
    expect(idsIn(result.content, 'd1')).toEqual(['b1', ...(first?.blocks ?? []), 'b3']);
    expect(idsIn(result.content, 'b3')).toEqual(second?.blocks);
    expect(idsIn(result.content, 'd2')).toEqual(third?.blocks);
    expect(result.touched).toEqual(result.sites.flatMap((site) => site.blocks));
    // Each site has its own copies, with their own ids.
    const copies = result.sites.map((site) => site.renamed.get('b12'));
    expect(new Set(copies).size).toBe(3);
    expect(blockOf(result.content, third?.renamed.get('b12') ?? '')).toMatchObject({
      kind: 'process',
      text: 'swap',
    });
  });

  it("T-1449: inline method: the folds go with each site as inlineCall's; a site with its own regions brings only those", () => {
    const sited = contentWith(
      diagram('d1', event('start'), [
        withSiteFolds(call('b2', 'd3'), [
          { id: 'f5', via: [], first: 'b12', last: 'b12', name: 'one' },
        ]),
        call('b4', 'd3'),
      ]),
      content.diagrams[2] ?? diagram('d3', method('x'), [proc('b9')]),
    );
    const result = runOk(inlineMethod, sited, {
      diagram: 'd3',
      ownRegions: (call) => call === 'b2',
    });
    const [own, plain] = result.sites;
    const name = (site: typeof own, id: string): string => site?.renamed.get(id) ?? '';
    // b2 had its own regions: only f5, inside the copied loop. b4 brings the Method's f1.
    expect(foldsIn(result.content, name(own, 'b11'))).toEqual([
      `${name(own, 'f5')}:${name(own, 'b12')}-${name(own, 'b12')}`,
    ]);
    expect(foldsIn(result.content, 'd1')).toEqual([
      `${name(plain, 'f1')}:${name(plain, 'b10')}-${name(plain, 'b11')}`,
    ]);
    // The same as inlineCall at each site, one after the other.
    const one = runOk(inlineCall, sited, { block: 'b2', ownRegions: true });
    expect(foldsIn(one.content, one.renamed.get('b11') ?? '')).toHaveLength(1);
  });

  it('T-1450: inline method: refused for a Method that calls itself, one nothing calls, and what is no Method', () => {
    const recursive = contentWith(
      diagram('d1', null, [call('b1', 'd2')]),
      diagram('d2', method('sort'), [proc('b10'), whileBlock('b11', [call('b12', 'd2')])]),
    );
    expectRefused(inlineMethod, recursive, { diagram: 'd2' }, 'recursiveMethod');
    const unused = contentWith(
      diagram('d1', null, [proc('b1')]),
      diagram('d2', method('m'), [proc('b10')]),
    );
    expectRefused(inlineMethod, unused, { diagram: 'd2' }, 'noCallers');
    expectRefused(inlineMethod, content, { diagram: 'd1' }, 'wrongKind');
    expectRefused(inlineMethod, content, { diagram: 'x' }, 'notFound');
  });

  it('T-1451: inline method: one command, so undo brings everything back; calls to other Methods stay', () => {
    const mutual = contentWith(
      diagram('d1', null, [call('b1', 'd2')]),
      diagram('d2', method('a'), [call('b10', 'd3')]),
      diagram('d3', method('b'), [proc('b20')]),
    );
    // `run` checks the input is left as it was: the editor's undo restores it in one step.
    const result = runOk(inlineMethod, mutual, { diagram: 'd2' });
    expect(diagramIds(result.content)).toEqual(['d1', 'd3']);
    expect(blockOf(result.content, idsIn(result.content, 'd1')[0] ?? '')).toMatchObject({
      kind: 'call',
      target: { kind: 'local', diagram: 'd3' },
    });
  });
});

describe('calls by a written name (R-BLK-08)', () => {
  const content = contentOf([proc('b1')]);

  it('T-1082: named call: inserts a call block calling a written name, one line and trimmed', () => {
    const result = runOk(insertNamedCall, content, {
      target: { kind: 'blocks', first: 'b1', last: 'b1' },
      side: 'after',
      name: ' printf\n',
    });
    expect(blockOf(result.content, 'b2')).toEqual(call('b2', { kind: 'named', name: 'printf' }));
  });

  it('T-1083: named call: the name is edited with the arguments; once written it cannot be emptied', () => {
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

  it('T-1084: named call: any call block can be made to call a written name', () => {
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

  it('T-1085: paste: a call goes to the Method of the same name here, whatever its id', () => {
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

  it('T-1086: paste: without that name here the call keeps the name it showed, not "(no name)"', () => {
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
      target: { kind: 'named', name: 'merge' },
    });
  });
});
