// What the check mode (`?perf`) gives the editor in place of the web shell: nothing writes.
import { describe, expect, it } from 'vitest';

import type { KeyValueStorage } from '../storage/settings-store';
import { createSettingsStore } from '../storage/settings-store';
import { memoryClipboard, noSaveFonts, perfDocumentStore, readOnlyStorage } from './perf-ports';

/** A storage that records every write. */
function recordingStorage(initial: Readonly<Record<string, string>>): {
  readonly storage: KeyValueStorage;
  readonly writes: string[];
} {
  const values = new Map(Object.entries(initial));
  const writes: string[] = [];
  return {
    writes,
    storage: {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => {
        writes.push(`set ${key}`);
        values.set(key, value);
      },
      removeItem: (key) => {
        writes.push(`remove ${key}`);
        values.delete(key);
      },
      key: (index) => [...values.keys()][index] ?? null,
      get length() {
        return values.size;
      },
    },
  };
}

describe('the check mode writes nothing (AT-05)', () => {
  it('T-1129: reads the user settings but keeps its own changes in memory', () => {
    const { storage, writes } = recordingStorage({ 'ariadne-nsd.setting.ui.locale': '"ko"' });
    const settings = createSettingsStore(readOnlyStorage(storage), () => undefined);
    expect(settings.get('ui.locale')).toBe('ko');
    settings.set('ui.locale', 'en');
    settings.set('headStyle', 'title');
    settings.set('keyHint', undefined);
    expect(settings.get('ui.locale')).toBe('en');
    expect(writes).toEqual([]);
    expect(storage.getItem('ariadne-nsd.setting.ui.locale')).toBe('"ko"');
    expect(readOnlyStorage(null)).toBeNull();
  });

  it('T-1130: refuses to save the measured document, so no file, backup or browser document is made', async () => {
    const store = perfDocumentStore('perf.ns.svg');
    expect(store.canWriteInPlace).toBe(false);
    expect(await store.write('<svg/>')).toMatchObject({ ok: false, reason: 'denied' });
    expect(await store.writeAs('<svg/>', 'copy.ns.svg')).toMatchObject({ ok: false });
    expect(await store.read()).toBe('');
    expect(await store.readOther('other.ns.svg')).toBeNull();
    await expect(noSaveFonts()).rejects.toThrow('does not save');
  });

  it('T-1131: copies into memory, not the system clipboard', async () => {
    const clipboard = memoryClipboard();
    expect(await clipboard.read()).toEqual({ text: null, json: null });
    expect(await clipboard.write({ text: 'step 1', json: '[]' })).toBe('memory');
    expect(await clipboard.read()).toEqual({ text: 'step 1', json: '[]' });
  });
});
