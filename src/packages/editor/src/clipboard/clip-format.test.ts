import { describe, expect, it } from 'vitest';

import { branch, empty, ifBlock, proc, seq, whileBlock } from '../engine-test-support';
import { clipFromJson, clipFromText, clipToJson, clipToText } from './clip-format';

const clip = seq([
  proc('b1', 'read n'),
  ifBlock('b2', branch('r1', [proc('b3', 'x')]), branch('r2', [empty('b4')], 'no'), 'n > 0'),
  whileBlock('b5', [proc('b6', 'tick')], 'running'),
]);

describe('clipboard formats (03-editor 3.3)', () => {
  it('R-EDIT-10: copied blocks are indented lines for other programs', () => {
    expect(clipToText(clip, 'en')).toBe(
      ['read n', 'n > 0', '    true:', '        x', '    no:', 'running', '    tick'].join('\n'),
    );
    expect(clipToText(clip, 'ko').split('\n')[2]).toBe('    참:');
  });

  it('R-EDIT-10: the model JSON reads back as the same blocks', () => {
    expect(clipFromJson(clipToJson(clip))).toEqual(clip);
    expect(clipFromJson('{"format":"nope"}')).toBeNull();
    expect(clipFromJson('not json')).toBeNull();
  });

  it('AT-12: text from elsewhere becomes one process block per line', () => {
    expect(clipFromText('first\r\n    second\n\n  ')).toEqual(
      seq([proc('b1', 'first'), proc('b2', 'second')]),
    );
    expect(clipFromText('  \n')).toBeNull();
  });
});
