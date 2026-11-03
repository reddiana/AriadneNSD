// Settings store (03-editor 6, 06-web 7): preferences kept in this browser's localStorage.

import { afterEach, describe, expect, it, vi } from 'vitest';

import type { KeyValueStorage } from './settings-store';
import { browserLocalStorage, createSettingsStore } from './settings-store';

/** localStorage in memory. `failWrites` makes every write throw (a full or blocked storage). */
function memoryStorage(initial: Record<string, string> = {}, failWrites = false) {
  const items = new Map(Object.entries(initial));
  const storage: KeyValueStorage = {
    get length() {
      return items.size;
    },
    key: (index) => [...items.keys()][index] ?? null,
    getItem: (name) => items.get(name) ?? null,
    setItem: (name, value) => {
      if (failWrites) {
        throw new DOMException('full', 'QuotaExceededError');
      }
      items.set(name, value);
    },
    removeItem: (name) => {
      items.delete(name);
    },
  };
  return { storage, items };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('settings store', () => {
  it('T-0787: 06-web 7: reads the stored settings at start, only its own', () => {
    const { storage } = memoryStorage({
      'ariadne-nsd.setting.file.autoSave': 'false',
      'ariadne-nsd.setting.view.zoom': '{"level":2}',
      'other-app.setting': '"x"',
    });
    const settings = createSettingsStore(storage, () => undefined);
    expect(settings.get('file.autoSave')).toBe(false);
    expect(settings.get('view.zoom')).toEqual({ level: 2 });
    expect(settings.get('other-app.setting')).toBeUndefined();
  });

  it('T-0788: ignores a broken stored setting and reports it', () => {
    const { storage } = memoryStorage({ 'ariadne-nsd.setting.bad': '{not json' });
    const errors: string[] = [];
    const settings = createSettingsStore(storage, (detail) => errors.push(detail));
    expect(settings.get('bad')).toBeUndefined();
    expect(errors[0]).toContain('Ignoring a broken setting ariadne-nsd.setting.bad');
  });

  it('T-0789: 06-web 7: stores a setting as JSON and removes it when set to undefined', () => {
    const { storage, items } = memoryStorage();
    const settings = createSettingsStore(storage, () => undefined);
    settings.set('ui.locale', 'ko');
    expect(items.get('ariadne-nsd.setting.ui.locale')).toBe('"ko"');
    expect(settings.get('ui.locale')).toBe('ko');
    settings.set('ui.locale', undefined);
    expect(items.has('ariadne-nsd.setting.ui.locale')).toBe(false);
    expect(settings.get('ui.locale')).toBeUndefined();
  });

  it('T-0790: keeps a setting for this page when the storage cannot write, and reports it', () => {
    const { storage } = memoryStorage({}, true);
    const errors: string[] = [];
    const settings = createSettingsStore(storage, (detail) => errors.push(detail));
    settings.set('a', 1);
    expect(settings.get('a')).toBe(1);
    expect(errors[0]).toContain('Could not store setting a');
  });

  it('T-0791: works in memory without a storage', () => {
    const settings = createSettingsStore(null, () => undefined);
    settings.set('a', true);
    expect(settings.get('a')).toBe(true);
  });

  it('T-0792: tells listeners about a change until they stop listening', () => {
    const settings = createSettingsStore(null, () => undefined);
    const changed: string[] = [];
    const stop = settings.onChange((key) => changed.push(key));
    settings.set('a', 1);
    stop();
    settings.set('b', 2);
    expect(changed).toEqual(['a']);
  });

  it('T-0793: 06-web 7: a setting changed in another tab is read and reported', () => {
    const { storage, items } = memoryStorage();
    const page = new EventTarget();
    const settings = createSettingsStore(storage, () => undefined, page);
    const changed: string[] = [];
    settings.onChange((key) => changed.push(key));
    const storageEvent = (key: string | null, newValue: string | null): Event =>
      Object.assign(new Event('storage'), { key, newValue });

    items.set('ariadne-nsd.setting.ui.theme', '"dark"');
    page.dispatchEvent(storageEvent('ariadne-nsd.setting.ui.theme', '"dark"'));
    expect(settings.get('ui.theme')).toBe('dark');

    items.delete('ariadne-nsd.setting.ui.theme');
    page.dispatchEvent(storageEvent('ariadne-nsd.setting.ui.theme', null));
    expect(settings.get('ui.theme')).toBeUndefined();

    // Other keys and "storage cleared" (key null) are not ours.
    page.dispatchEvent(storageEvent('other', '"x"'));
    page.dispatchEvent(storageEvent(null, null));
    expect(changed).toEqual(['ui.theme', 'ui.theme']);
  });

  it('T-0794: stops following other tabs after dispose', () => {
    const { storage, items } = memoryStorage();
    const page = new EventTarget();
    const settings = createSettingsStore(storage, () => undefined, page);
    const changed: string[] = [];
    settings.onChange((key) => changed.push(key));
    settings.dispose();
    items.set('ariadne-nsd.setting.a', '1');
    page.dispatchEvent(
      Object.assign(new Event('storage'), { key: 'ariadne-nsd.setting.a', newValue: '1' }),
    );
    expect(settings.get('a')).toBeUndefined();
    expect(changed).toEqual([]);
  });
});

describe('browser local storage', () => {
  it('T-0795: returns localStorage', () => {
    const { storage } = memoryStorage();
    vi.stubGlobal('window', { localStorage: storage });
    expect(browserLocalStorage()).toBe(storage);
  });

  it('T-0796: returns null where reading localStorage throws (blocked site data)', () => {
    vi.stubGlobal('window', {
      get localStorage(): Storage {
        throw new DOMException('blocked', 'SecurityError');
      },
    });
    expect(browserLocalStorage()).toBeNull();
  });
});
