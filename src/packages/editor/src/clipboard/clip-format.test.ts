import type { CallTextContext, Locale } from '@ariadne-nsd/core';
import { describe, expect, it } from 'vitest';

import {
  arm,
  branch,
  caseBlock,
  empty,
  ifBlock,
  proc,
  seq,
  whileBlock,
} from '../engine-test-support';
import { clipFromJson, clipFromText, clipToJson, clipToText } from './clip-format';

const clip = seq([
  proc('b1', 'read n'),
  ifBlock('b2', branch('r1', [proc('b3', 'x')]), branch('r2', [empty('b4')], 'no'), 'n > 0'),
  whileBlock('b5', [proc('b6', 'tick')], 'running'),
]);

/** A document without Method diagrams, with the default result symbol. */
const drawn = (locale: Locale): CallTextContext => ({
  locale,
  resultSymbol: '←',
  diagrams: new Map(),
});

describe('clipboard formats (03-editor 3.3)', () => {
  it('T-0200 · R-EDIT-10: copied blocks are indented lines for other programs', () => {
    expect(clipToText(clip, drawn('en'))).toBe(
      ['read n', 'n > 0', '    true:', '        x', '    no:', 'running', '    tick'].join('\n'),
    );
    expect(clipToText(clip, drawn('ko')).split('\n')[2]).toBe('    참:');
  });

  it('T-0557 · R-EDIT-10: call, loop and Case blocks become indented lines too', () => {
    const others = seq([
      {
        id: 'c1',
        kind: 'call',
        target: { kind: 'named', name: 'sort' },
        args: 'xs',
        result: 'ys',
        siteFolds: [],
      },
      {
        id: 'c2',
        kind: 'call',
        target: { kind: 'named', name: 'reset' },
        args: '',
        result: '',
        siteFolds: [],
      },
      { id: 'd1', kind: 'doWhile', text: 'more', body: seq([proc('b1', 'step')]) },
      { id: 'f1', kind: 'for', text: 'i in xs', body: seq([proc('b2', 'use i')]) },
      caseBlock('k1', [arm('a1', '1', [proc('b3', 'one')])], branch('o1', [proc('b4', 'other')])),
      caseBlock('k2', [arm('a2', '2', [])], branch('o2', [], 'else')),
      caseBlock('k3', [arm('a3', '3', [])], null),
      proc('b5', 'first line\nsecond line'),
    ]);
    expect(clipToText(others, drawn('en')).split('\n')).toEqual([
      // A call is written as it is drawn.
      'ys ← sort(xs)',
      'reset',
      '    step',
      // A Do-While's condition comes after its blocks.
      'more',
      'i in xs',
      '    use i',
      'k',
      '    1:',
      '        one',
      '    default:',
      '        other',
      'k',
      '    2:',
      '    else:',
      'k',
      '    3:',
      'first line',
      'second line',
    ]);
  });

  it('T-0800 · BUG-13: a copied call block keeps its Method name, written as it is drawn', () => {
    const calls = seq([
      {
        id: 'c1',
        kind: 'call',
        target: { kind: 'local', diagram: 'd2' },
        args: 'xs',
        result: 'ys',
        siteFolds: [],
      },
      {
        id: 'c2',
        kind: 'call',
        target: { kind: 'local', diagram: 'd2' },
        args: 'xs',
        result: '',
        siteFolds: [],
      },
      {
        id: 'c3',
        kind: 'call',
        target: { kind: 'local', diagram: 'd2' },
        args: '',
        result: '',
        siteFolds: [],
      },
      {
        id: 'c4',
        kind: 'call',
        target: { kind: 'lost', lastName: 'Old' },
        args: 'a',
        result: 'r',
        siteFolds: [],
      },
      {
        id: 'c5',
        kind: 'call',
        target: { kind: 'named', name: '' },
        args: '',
        result: '',
        siteFolds: [],
      },
    ]);
    const diagrams = new Map([
      [
        'd2',
        { id: 'd2', head: { kind: 'method' as const, text: 'MergeSort(list)' }, body: seq([]) },
      ],
    ]);
    expect(clipToText(calls, { locale: 'en', resultSymbol: '←', diagrams }).split('\n')).toEqual([
      'ys ← MergeSort(xs)',
      'MergeSort(xs)',
      'MergeSort()',
      'r ← Old(a)',
      '(no name)',
    ]);
    expect(clipToText(calls, { locale: 'en', resultSymbol: '=', diagrams }).split('\n')[0]).toBe(
      'ys = MergeSort(xs)',
    );
  });

  it('T-0201 · R-EDIT-10: the model JSON reads back as the same blocks', () => {
    expect(clipFromJson(clipToJson(clip))).toEqual(clip);
    expect(clipFromJson('{"format":"nope"}')).toBeNull();
    expect(clipFromJson('not json')).toBeNull();
  });

  it('T-0202 · AT-12: text from elsewhere becomes one process block per line', () => {
    expect(clipFromText('first\r\n    second\n\n  ')).toEqual(
      seq([proc('b1', 'first'), proc('b2', 'second')]),
    );
    expect(clipFromText('  \n')).toBeNull();
  });
});
