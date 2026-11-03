// Documents in this browser (R-WEB-09): the pure rules of names, order and size.

import { describe, expect, it } from 'vitest';

import type { BrowserDocument } from './browser-documents';
import { byteSize, findByName, isSameName, newestFirst, uniqueName } from './browser-documents';

function document(key: string, name: string, savedAt: number): BrowserDocument {
  return { key, name, text: '', savedAt, size: 0 };
}

describe('browser documents', () => {
  it('T-0907 · UX BS3: lists the one saved last first', () => {
    const list = [document('a', 'A', 1), document('b', 'B', 3), document('c', 'C', 2)];
    expect(newestFirst(list).map((item) => item.key)).toEqual(['b', 'c', 'a']);
  });

  it('T-0908 · R-WEB-09: names are the same apart from case and surrounding spaces', () => {
    expect(isSameName('Merge Sort', ' merge sort ')).toBe(true);
    expect(isSameName('Merge Sort', 'Merge  Sort')).toBe(false);
    expect(findByName([document('a', 'Merge Sort', 1)], 'MERGE SORT')?.key).toBe('a');
    expect(findByName([document('a', 'Merge Sort', 1)], 'Quick Sort')).toBeUndefined();
  });

  it('T-0909 · R-WEB-09: a taken name gets the next free number', () => {
    expect(uniqueName('A', [])).toBe('A');
    expect(uniqueName('A', ['a', 'A (2)'])).toBe('A (3)');
  });

  it('T-0910: counts the size in UTF-8 bytes', () => {
    expect(byteSize('ab')).toBe(2);
    expect(byteSize('합')).toBe(3);
  });
});
