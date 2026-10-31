import { describe, expect, it } from 'vitest';

import { displayKey, isStandardKey, menuKey, nextStep, splitKeys } from './keys';

describe('keys', () => {
  it('03-keymap: tells standard keys from Vim keys', () => {
    expect(isStandardKey('Ctrl+X')).toBe(true);
    expect(isStandardKey('Delete')).toBe(true);
    expect(isStandardKey('F2')).toBe(true);
    expect(isStandardKey('Shift+Delete')).toBe(true);
    expect(isStandardKey('d d')).toBe(false);
    expect(isStandardKey('x')).toBe(false);
    expect(isStandardKey('?')).toBe(false);
    expect(isStandardKey('Shift+L')).toBe(false);
  });

  it('03-editor 5.1: a menu shows the standard key, or the only key there is', () => {
    expect(menuKey(['d d', 'Ctrl+X'])).toBe('Ctrl+X');
    expect(menuKey(['?'])).toBe('?');
    expect(menuKey([])).toBeNull();
  });

  it('writes sequences of letters as Vim does and names arrow keys', () => {
    expect(displayKey('d d')).toBe('dd');
    expect(displayKey('a i')).toBe('ai');
    expect(displayKey('Ctrl+Shift+P')).toBe('Ctrl+Shift+P');
    expect(displayKey('Alt+ArrowUp')).toBe('Alt+↑');
  });

  it('splits keys into the two columns of the shortcut list', () => {
    expect(splitKeys(['y y', 'Ctrl+C'])).toEqual({ vim: ['y y'], standard: ['Ctrl+C'] });
  });

  it('UX K1: finds the second key after a pending first key', () => {
    expect(nextStep('a i', 'a')).toBe('i');
    expect(nextStep('a', 'a')).toBeNull();
    expect(nextStep('s i', 'a')).toBeNull();
  });
});
