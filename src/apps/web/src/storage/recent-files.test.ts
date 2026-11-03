import { describe, expect, it } from 'vitest';

import type { RecentFile } from './recent-files';
import { forgetRecent, orderRecent, recentFilesLimit, touchRecent } from './recent-files';

function copy(key: string, usedAt: number): RecentFile {
  return { key, name: `${key}.ns.svg`, usedAt, source: { kind: 'copy', text: '' } };
}

describe('recent files', () => {
  it('T-0401 · R-EXP-04: puts the last opened file first', () => {
    const { list } = touchRecent([copy('a', 1), copy('b', 2)], copy('c', 3));
    expect(list.map((item) => item.key)).toEqual(['c', 'b', 'a']);
  });

  it('T-0402 · R-EXP-04: keeps one entry per file and moves it to the top', () => {
    const { list } = touchRecent([copy('b', 2), copy('a', 1)], copy('a', 5));
    expect(list.map((item) => item.key)).toEqual(['a', 'b']);
    expect(list[0]?.usedAt).toBe(5);
  });

  it('T-0403 · R-EXP-04: remembers ten files and reports the ones that fell off', () => {
    const full = Array.from({ length: recentFilesLimit }, (_, index) =>
      copy(`f${String(index)}`, index),
    );
    const { list, dropped } = touchRecent(full, copy('new', 100));
    expect(list).toHaveLength(10);
    expect(list[0]?.key).toBe('new');
    expect(dropped.map((item) => item.key)).toEqual(['f0']);
  });

  it('T-0404: forgets a file by key', () => {
    expect(forgetRecent([copy('a', 1), copy('b', 2)], 'a').map((item) => item.key)).toEqual(['b']);
  });

  it('T-0405: orders stored entries newest first', () => {
    expect(orderRecent([copy('a', 1), copy('b', 3), copy('c', 2)]).map((item) => item.key)).toEqual(
      ['b', 'c', 'a'],
    );
  });
});
