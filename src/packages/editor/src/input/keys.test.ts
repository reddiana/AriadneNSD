import { describe, expect, it } from 'vitest';

import type { KeyInput } from './keys';
import { keyBindings, keysOf, readKey, strokeOf } from './keys';

const key = (code: string, modifiers: Partial<KeyInput> = {}): KeyInput => ({
  code,
  shiftKey: false,
  ctrlKey: false,
  altKey: false,
  metaKey: false,
  ...modifiers,
});

const normal = { mode: 'normal' as const, selection: 'blocks' as const };

describe('reading keys (03-editor 4)', () => {
  it('03-editor 4: letters are read by their place, so Korean input gives the same keys', () => {
    expect(strokeOf(key('KeyJ'))).toBe('j');
    expect(strokeOf(key('KeyO', { shiftKey: true }))).toBe('O');
    expect(strokeOf(key('KeyX', { ctrlKey: true }))).toBe('Ctrl+X');
    expect(strokeOf(key('KeyX', { metaKey: true }))).toBe('Ctrl+X');
    expect(strokeOf(key('KeyP', { ctrlKey: true, shiftKey: true }))).toBe('Ctrl+Shift+P');
    expect(strokeOf(key('KeyH', { altKey: true }))).toBe('Alt+h');
  });

  it('03-keymap: symbols, named keys and modifiers alone', () => {
    expect(strokeOf(key('BracketLeft', { shiftKey: true }))).toBe('{');
    expect(strokeOf(key('BracketRight'))).toBe(']');
    expect(strokeOf(key('Slash', { shiftKey: true }))).toBe('?');
    expect(strokeOf(key('Equal', { shiftKey: true }))).toBe('+');
    expect(strokeOf(key('Comma', { ctrlKey: true }))).toBe('Ctrl+,');
    expect(strokeOf(key('ArrowLeft', { ctrlKey: true, shiftKey: true }))).toBe(
      'Ctrl+Shift+ArrowLeft',
    );
    expect(strokeOf(key('NumpadEnter'))).toBe('Enter');
    expect(strokeOf(key('ShiftLeft', { shiftKey: true }))).toBeNull();
    expect(strokeOf(key('Lang1'))).toBeNull();
  });

  it('R-EDIT-04 (UX K1): the first key of a sequence waits; the second runs the command', () => {
    expect(readKey(keyBindings, null, 'd', normal)).toEqual({ kind: 'pending', first: 'd' });
    expect(readKey(keyBindings, 'd', 'd', normal)).toMatchObject({
      kind: 'command',
      binding: { command: 'edit.cut' },
    });
    expect(readKey(keyBindings, 'a', 'i', normal)).toMatchObject({
      binding: { command: 'block.insert.if' },
    });
    expect(readKey(keyBindings, 's', 'w', normal)).toMatchObject({
      binding: { command: 'block.wrap.while' },
    });
  });

  it('UX K1: a key that does not continue the sequence, or Esc, cancels it', () => {
    expect(readKey(keyBindings, 'd', 'q', normal)).toEqual({
      kind: 'cancelled',
      keys: 'd q',
      isEscape: false,
    });
    expect(readKey(keyBindings, 'g', 'Escape', normal)).toMatchObject({ isEscape: true });
  });

  it('03-keymap: o, O and x act on branches while a branch label is selected', () => {
    const onLabel = { mode: 'normal' as const, selection: 'branchLabel' as const };
    expect(readKey(keyBindings, null, 'o', onLabel)).toMatchObject({
      binding: { command: 'branch.insert' },
    });
    expect(readKey(keyBindings, null, 'x', onLabel)).toMatchObject({
      binding: { command: 'branch.delete' },
    });
    expect(readKey(keyBindings, null, 'o', normal)).toMatchObject({
      binding: { command: 'block.insert.process' },
    });
  });

  it('03-keymap: a p inserts a process block like o', () => {
    expect(readKey(keyBindings, 'a', 'p', normal)).toMatchObject({
      binding: { command: 'block.insert.process' },
    });
  });

  it('03-keymap: in a range (v), d cuts at once and s waits for a kind', () => {
    const visual = { mode: 'visual' as const, selection: 'blocks' as const };
    expect(readKey(keyBindings, null, 'd', visual)).toMatchObject({
      binding: { command: 'edit.cut' },
    });
    expect(readKey(keyBindings, null, 's', visual)).toEqual({ kind: 'pending', first: 's' });
    expect(readKey(keyBindings, null, 'q', visual)).toEqual({ kind: 'unbound', keys: 'q' });
  });

  it('03-editor 4: the key table gives each command its keys for display', () => {
    expect(keysOf(keyBindings, 'edit.cut')).toEqual(['d d', 'Ctrl+X']);
    expect(keysOf(keyBindings, 'edit.redo')).toEqual(['U', 'Ctrl+R', 'Ctrl+Y', 'Ctrl+Shift+Z']);
    expect(keysOf(keyBindings, 'select.clear')).toEqual(['Escape Escape']);
  });
});
