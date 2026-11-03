import { describe, expect, it } from 'vitest';

import { createIdGenerator } from '../model/id';
import {
  defaultHeadName,
  deleteDiagram,
  editHead,
  moveDiagram,
  newDiagram,
  setHead,
  setSettings,
} from './diagram';
import {
  blockOf,
  call,
  contentOf,
  contentWith,
  diagram,
  diagramIds,
  diagramOf,
  empty,
  event,
  expectRefused,
  method,
  proc,
  runOk,
  whileBlock,
} from './test-support';

describe('editHead', () => {
  it('T-0102 · R-BLK-10: sets the text of an Event header', () => {
    const content = contentWith(diagram('d1', event('Tick'), [proc('b1')]));
    const result = runOk(editHead, content, { diagram: 'd1', text: 'Timer 1 ms' });
    expect(diagramOf(result.content, 'd1').head).toEqual(event('Timer 1 ms'));
    expect(result.touched).toEqual(['d1']);
  });

  it('T-0103 · R-BLK-11: renaming a Method leaves its call blocks pointing at it by id', () => {
    const content = contentWith(
      diagram('d1', event('Main'), [call('b1', 'd2', 'x')]),
      diagram('d2', method('sort(a)'), [proc('b2')]),
    );
    const result = runOk(editHead, content, { diagram: 'd2', text: 'order(a)' });
    expect(blockOf(result.content, 'b1')).toEqual(call('b1', 'd2', 'x'));
    expect(result.touched).toEqual(['d2']);
  });

  it('T-0104: 01-model 4: the same text leaves the content as it is', () => {
    const content = contentWith(diagram('d1', event('Tick'), [proc('b1')]));
    const result = runOk(editHead, content, { diagram: 'd1', text: 'Tick' });
    expect(result.content).toBe(content);
  });

  it('T-0105 · R-BLK-11: refuses an empty name, for an Event and for a Method without a name', () => {
    const content = contentWith(
      diagram('d1', event('Tick'), [proc('b1')]),
      diagram('d2', method('sort(a)'), [proc('b2')]),
    );
    expectRefused(editHead, content, { diagram: 'd1', text: '  ' }, 'emptyHeadName');
    expectRefused(editHead, content, { diagram: 'd2', text: ' (a, b)' }, 'emptyHeadName');
  });

  it('T-0106 · R-BLK-11: refuses a name another header has, Events and Methods together', () => {
    const content = contentWith(
      diagram('d1', event('Tick'), [proc('b1')]),
      diagram('d2', method('sort(a)'), [proc('b2')]),
      diagram('d3', method('swap'), [proc('b3')]),
    );
    // Only the name counts, without surrounding spaces.
    expectRefused(
      editHead,
      content,
      { diagram: 'd3', text: ' sort (a, lo, hi)' },
      'duplicateHeadName',
    );
    expectRefused(editHead, content, { diagram: 'd3', text: 'Tick' }, 'duplicateHeadName');
    expectRefused(editHead, content, { diagram: 'd1', text: 'swap ' }, 'duplicateHeadName');
  });

  it('T-0107 · R-BLK-11: names are case sensitive, and a header may keep its own name', () => {
    const content = contentWith(
      diagram('d1', event('Tick'), [proc('b1')]),
      diagram('d2', method('sort(a)'), [proc('b2')]),
    );
    runOk(editHead, content, { diagram: 'd2', text: 'tick' });
    const own = runOk(editHead, content, { diagram: 'd2', text: 'sort(a, n)' });
    expect(diagramOf(own.content, 'd2').head).toEqual(method('sort(a, n)'));
  });

  it('T-0108 · R-BLK-07: removing the parentheses clears the arguments of the call blocks', () => {
    const content = contentWith(
      diagram('d1', event('Main'), [call('b1', 'd2', 'x', 'r'), call('b2', 'd3', 'y')]),
      diagram('d2', method('sort(a)'), [proc('b3')]),
      diagram('d3', method('swap(p)'), [proc('b4')]),
    );
    const result = runOk(editHead, content, { diagram: 'd2', text: 'sort' });
    expect(blockOf(result.content, 'b1')).toEqual(call('b1', 'd2', '', 'r'));
    expect(blockOf(result.content, 'b2')).toBe(blockOf(content, 'b2'));
    expect(result.touched).toEqual(['d2', 'b1']);
  });

  it('T-0109 · R-BLK-07: adding parentheses fills empty arguments with the text inside them', () => {
    const content = contentWith(
      diagram('d1', event('Main'), [call('b1', 'd2'), whileBlock('b2', [call('b3', 'd2')])]),
      diagram('d2', method('reset'), [proc('b4')]),
    );
    const result = runOk(editHead, content, { diagram: 'd2', text: 'reset(level)' });
    expect(blockOf(result.content, 'b1')).toEqual(call('b1', 'd2', 'level'));
    expect(blockOf(result.content, 'b3')).toEqual(call('b3', 'd2', 'level'));
    expect(result.touched).toEqual(['d2', 'b1', 'b3']);
  });

  it('T-0110 · R-BLK-07: written arguments stay when the parameters change', () => {
    const content = contentWith(
      diagram('d1', event('Main'), [call('b1', 'd2', 'v, 0, n')]),
      diagram('d2', method('sort(a, lo, hi)'), [proc('b2')]),
    );
    const result = runOk(editHead, content, { diagram: 'd2', text: 'sort(a, n)' });
    expect(blockOf(result.content, 'b1')).toBe(blockOf(content, 'b1'));
  });

  it('T-0111: refuses a diagram without a header, and an unknown diagram', () => {
    const content = contentOf([proc('b1')]);
    expectRefused(editHead, content, { diagram: 'd1', text: 'Tick' }, 'noHead');
    expectRefused(editHead, content, { diagram: 'd9', text: 'Tick' }, 'notFound');
  });
});

describe('setHead', () => {
  it('T-0112 · R-BLK-10: gives a diagram without a header an Event header with the default name', () => {
    const content = contentWith(
      diagram('d1', null, [proc('b1')]),
      diagram('d2', event('Event 1'), [proc('b2')]),
    );
    const result = runOk(setHead, content, { diagram: 'd1', kind: 'event' });
    expect(diagramOf(result.content, 'd1').head).toEqual(event('Event 2'));
    expect(result.touched).toEqual(['d1']);
  });

  it('T-0113 · R-BLK-11: gives a Method header; the default name skips names in use', () => {
    const content = contentWith(
      diagram('d1', null, [proc('b1')]),
      diagram('d2', method('Method 1(a)'), [proc('b2')]),
      diagram('d3', event('Method 2'), [proc('b3')]),
    );
    const result = runOk(setHead, content, { diagram: 'd1', kind: 'method' });
    expect(diagramOf(result.content, 'd1').head).toEqual(method('Method 3'));
  });

  it('T-0114 · R-BLK-11: changes an Event to a Method and back, keeping the text', () => {
    const content = contentWith(diagram('d1', event('Tick'), [proc('b1')]));
    const toMethod = runOk(setHead, content, { diagram: 'd1', kind: 'method' });
    expect(diagramOf(toMethod.content, 'd1').head).toEqual(method('Tick'));
    const back = runOk(setHead, toMethod.content, { diagram: 'd1', kind: 'event' });
    expect(diagramOf(back.content, 'd1').head).toEqual(event('Tick'));
  });

  it('T-0115 · R-BLK-11: a Method that call blocks call cannot become an Event', () => {
    const content = contentWith(
      diagram('d1', event('Main'), [call('b1', 'd2')]),
      diagram('d2', method('sort'), [proc('b2')]),
    );
    expectRefused(setHead, content, { diagram: 'd2', kind: 'event' }, 'methodHasCallers');
  });

  it('T-0116 · R-BLK-11: changing the kind refuses a text that reads as a clashing or empty name', () => {
    const content = contentWith(
      diagram('d1', event('sort(x)'), [proc('b1')]),
      diagram('d2', method('sort'), [proc('b2')]),
      diagram('d3', event('(x)'), [proc('b3')]),
    );
    expectRefused(setHead, content, { diagram: 'd1', kind: 'method' }, 'duplicateHeadName');
    expectRefused(setHead, content, { diagram: 'd3', kind: 'method' }, 'emptyHeadName');
  });

  it('T-0117 · R-BLK-07: removing a Method header turns its call blocks into lost ones', () => {
    const content = contentWith(
      diagram('d1', event('Main'), [call('b1', 'd2', 'v', 'r')]),
      diagram('d2', method(' sort (a)'), [proc('b2')]),
    );
    const result = runOk(setHead, content, { diagram: 'd2', kind: null });
    expect(diagramOf(result.content, 'd2').head).toBeNull();
    expect(blockOf(result.content, 'b1')).toEqual(
      call('b1', { kind: 'lost', lastName: 'sort' }, 'v', 'r'),
    );
    expect(result.touched).toEqual(['d2', 'b1']);
  });

  it('T-0118: invariant 7: a diagram left with neither header nor content disappears', () => {
    const content = contentWith(
      diagram('d1', event('Main'), [proc('b1')]),
      diagram('d2', method('Method 1'), [empty('b2')]),
    );
    const result = runOk(setHead, content, { diagram: 'd2', kind: null });
    expect(diagramIds(result.content)).toEqual(['d1']);
  });

  it('T-0119: invariant 7: the only diagram stays even with neither header nor content', () => {
    const content = contentWith(diagram('d1', event('Event 1'), [empty('b1')]));
    const result = runOk(setHead, content, { diagram: 'd1', kind: null });
    expect(diagramIds(result.content)).toEqual(['d1']);
  });

  it('T-0120: 01-model 4: the same kind leaves the content as it is', () => {
    const content = contentWith(diagram('d1', event('Tick'), [proc('b1')]));
    expect(runOk(setHead, content, { diagram: 'd1', kind: 'event' }).content).toBe(content);
    const plain = contentOf([proc('b1')]);
    expect(runOk(setHead, plain, { diagram: 'd1', kind: null }).content).toBe(plain);
    expectRefused(setHead, plain, { diagram: 'd9', kind: null }, 'notFound');
  });
});

describe('newDiagram', () => {
  it('T-0121 · R-EDIT-18: a new Method goes after the last Method', () => {
    const content = contentWith(
      diagram('d1', event('Main'), [proc('b1')]),
      diagram('d2', method('Method 1'), [proc('b2')]),
      diagram('d3', event('Tick'), [proc('b3')]),
    );
    const result = runOk(newDiagram, content, { kind: 'method' });
    expect(diagramIds(result.content)).toEqual(['d1', 'd2', 'd4', 'd3']);
    expect(diagramOf(result.content, 'd4')).toEqual(
      diagram('d4', method('Method 2'), [empty('b4')]),
    );
    expect(result.touched).toEqual(['d4']);
  });

  it('T-0122 · R-EDIT-18: a new Event goes after the last Event or diagram without a header', () => {
    const content = contentWith(
      diagram('d1', null, [proc('b1')]),
      diagram('d2', method('sort'), [proc('b2')]),
      diagram('d3', event('Tick'), [proc('b3')]),
      diagram('d4', method('swap'), [proc('b4')]),
    );
    const result = runOk(newDiagram, content, { kind: 'event' });
    expect(diagramIds(result.content)).toEqual(['d1', 'd2', 'd3', 'd5', 'd4']);
    expect(diagramOf(result.content, 'd5').head).toEqual(event('Event 1'));
  });

  it('T-0123 · R-EDIT-18: the first of its kind goes first (Event) or last (Method)', () => {
    const methods = contentWith(diagram('d1', method('sort'), [proc('b1')]));
    expect(diagramIds(runOk(newDiagram, methods, { kind: 'event' }).content)).toEqual(['d2', 'd1']);
    const events = contentWith(diagram('d1', event('Main'), [proc('b1')]));
    expect(diagramIds(runOk(newDiagram, events, { kind: 'method' }).content)).toEqual(['d1', 'd2']);
  });

  it('T-0124: invariant 7: the blank diagram of a new document goes when another diagram comes', () => {
    const content = contentOf([empty('b1')]);
    const result = runOk(newDiagram, content, { kind: 'method' });
    expect(diagramIds(result.content)).toEqual(['d2']);
  });

  it('T-0125: 01-model 1.7: takes its ids from the given generator', () => {
    const content = contentOf([proc('b1')]);
    const ids = createIdGenerator(content, ['d7', 'b7']);
    const result = runOk(newDiagram, content, { kind: 'event', ids });
    expect(diagramOf(result.content, 'd8').body.blocks).toEqual([empty('b8')]);
  });
});

describe('deleteDiagram', () => {
  it('T-0126 · R-EDIT-18: deletes a diagram; the call blocks calling it become lost', () => {
    const content = contentWith(
      diagram('d1', event('Main'), [call('b1', 'd2', 'v'), call('b2', 'd3')]),
      diagram('d2', method('sort(a)'), [call('b3', 'd2', 'a')]),
      diagram('d3', method('swap'), [proc('b4')]),
    );
    const result = runOk(deleteDiagram, content, { diagram: 'd2' });
    expect(diagramIds(result.content)).toEqual(['d1', 'd3']);
    expect(blockOf(result.content, 'b1')).toEqual(
      call('b1', { kind: 'lost', lastName: 'sort' }, 'v'),
    );
    expect(blockOf(result.content, 'b2')).toBe(blockOf(content, 'b2'));
    expect(result.touched).toEqual(['b1']);
  });

  it('T-0127: invariant 1: the only diagram cannot be deleted', () => {
    const content = contentWith(diagram('d1', event('Main'), [proc('b1')]));
    expectRefused(deleteDiagram, content, { diagram: 'd1' }, 'lastDiagram');
    expectRefused(deleteDiagram, content, { diagram: 'd9' }, 'notFound');
  });
});

describe('moveDiagram', () => {
  const content = contentWith(
    diagram('d1', event('Main'), [proc('b1')]),
    diagram('d2', method('sort'), [proc('b2')]),
    diagram('d3', null, [proc('b3')]),
    diagram('d4', method('swap'), [proc('b4')]),
  );

  it('T-0128 · R-EDIT-18: swaps with the previous diagram of its kind, skipping the others', () => {
    const up = runOk(moveDiagram, content, { diagram: 'd4', direction: 'up' });
    expect(diagramIds(up.content)).toEqual(['d1', 'd4', 'd3', 'd2']);
    expect(up.touched).toEqual(['d4']);
    const down = runOk(moveDiagram, content, { diagram: 'd1', direction: 'down' });
    expect(diagramIds(down.content)).toEqual(['d3', 'd2', 'd1', 'd4']);
  });

  it('T-0129 · R-EDIT-18: refuses at either end of its kind', () => {
    expectRefused(moveDiagram, content, { diagram: 'd2', direction: 'up' }, 'atTop');
    expectRefused(moveDiagram, content, { diagram: 'd3', direction: 'down' }, 'atBottom');
    expectRefused(moveDiagram, content, { diagram: 'd9', direction: 'up' }, 'notFound');
  });
});

describe('setSettings', () => {
  it('T-0130 · R-LAY-10: changes the header shape', () => {
    const content = contentOf([proc('b1')]);
    const result = runOk(setSettings, content, { headStyle: 'shape' });
    expect(result.content.settings).toEqual({
      textKind: 'plain',
      theme: 'default',
      headStyle: 'shape',
      locale: 'en',
    });
    expect(result.content.diagrams).toBe(content.diagrams);
    expect(result.touched).toEqual([]);
  });

  it('T-0131: 01-model 4: the same settings leave the content as it is', () => {
    const content = contentOf([proc('b1')]);
    expect(runOk(setSettings, content, { headStyle: 'title' }).content).toBe(content);
    expect(runOk(setSettings, content, {}).content).toBe(content);
  });
});

describe('defaultHeadName', () => {
  it('T-0132 · R-BLK-10: is "Event n" or "Method n" with the smallest unused n', () => {
    const content = contentWith(
      diagram('d1', event('Event 1'), [proc('b1')]),
      diagram('d2', method('Event 2(x)'), [proc('b2')]),
    );
    expect(defaultHeadName(content, 'event')).toBe('Event 3');
    expect(defaultHeadName(content, 'method')).toBe('Method 1');
  });
});
