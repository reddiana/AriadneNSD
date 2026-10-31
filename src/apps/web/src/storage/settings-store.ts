// The web shell's `SettingsStore` (03-editor 6, 06-web 7 "환경 설정"): this browser's
// localStorage. Reads are synchronous because everything is read at start.

import type { SettingsStore } from '../editor-contract';

const prefix = 'ariadne-nsd.setting.';

/** The part of `Storage` the settings store uses. */
export type KeyValueStorage = Pick<
  Storage,
  'getItem' | 'setItem' | 'removeItem' | 'key' | 'length'
>;

/**
 * Creates the settings store. Values are JSON. Another tab changing a setting is reported through
 * `onChange` (the `storage` event), so both tabs show the same preferences.
 */
export function createSettingsStore(
  storage: KeyValueStorage | null,
  onError: (detail: string) => void,
  target: Pick<Window, 'addEventListener' | 'removeEventListener'> | null = null,
): SettingsStore & { readonly dispose: () => void } {
  const values = new Map<string, unknown>();
  if (storage !== null) {
    for (let index = 0; index < storage.length; index += 1) {
      const name = storage.key(index);
      if (name?.startsWith(prefix) === true) {
        readInto(values, storage, name, onError);
      }
    }
  }
  const listeners = new Set<(key: string) => void>();
  const onStorage = (event: StorageEvent): void => {
    if (storage === null || event.key?.startsWith(prefix) !== true) {
      return;
    }
    const key = event.key.slice(prefix.length);
    if (event.newValue === null) {
      values.delete(key);
    } else {
      readInto(values, storage, event.key, onError);
    }
    for (const listener of listeners) {
      listener(key);
    }
  };
  target?.addEventListener('storage', onStorage);
  return {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters -- the signature of 03-editor 6.
    get<T>(key: string): T | undefined {
      return values.get(key) as T | undefined;
    },
    set(key: string, value: unknown): void {
      values.set(key, value);
      try {
        if (value === undefined) {
          storage?.removeItem(prefix + key);
        } else {
          storage?.setItem(prefix + key, JSON.stringify(value));
        }
      } catch (error) {
        onError(`Could not store setting ${key}: ${String(error)}`);
      }
      for (const listener of listeners) {
        listener(key);
      }
    },
    onChange(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    dispose() {
      target?.removeEventListener('storage', onStorage);
      listeners.clear();
    },
  };
}

function readInto(
  values: Map<string, unknown>,
  storage: KeyValueStorage,
  name: string,
  onError: (detail: string) => void,
): void {
  const text = storage.getItem(name);
  if (text === null) {
    return;
  }
  try {
    values.set(name.slice(prefix.length), JSON.parse(text) as unknown);
  } catch (error) {
    onError(`Ignoring a broken setting ${name}: ${String(error)}`);
  }
}

/** Returns `window.localStorage`, or `null` where reading it throws (blocked storage). */
export function browserLocalStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    // Some browsers throw on access when site data is blocked; the settings then live in memory.
    return null;
  }
}
