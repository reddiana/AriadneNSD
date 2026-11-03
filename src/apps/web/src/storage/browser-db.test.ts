// Browser database (06-web 1.1, 2): recent files and local backups in IndexedDB, or in memory.

import { afterEach, describe, expect, it, vi } from 'vitest';

import type { Backup, BrowserDb } from './browser-db';
import { memoryDb, openBrowserDb } from './browser-db';
import type { BrowserDocument } from './browser-documents';
import type { RecentFile } from './recent-files';
import { recentFilesLimit } from './recent-files';

type Failure = 'none' | 'requests' | 'transactions' | 'quota';

/** Fires a request's or transaction's handler later, as IndexedDB does. */
function later(work: () => void): void {
  setTimeout(work, 0);
}

/**
 * IndexedDB in memory, enough for the shell: object stores keyed by `key`. One factory keeps its
 * databases across opens. `open` decides how opening goes; `failure` breaks reads or writes.
 */
function fakeIndexedDb() {
  const databases = new Map<string, Map<string, Map<string, unknown>>>();
  const versions = new Map<string, number>();
  const control = {
    open: 'ok' as 'ok' | 'error' | 'blocked' | 'never',
    failure: 'none' as Failure,
    upgrades: 0,
  };
  const request = (run: () => unknown): IDBRequest => {
    const pending = {
      result: undefined as unknown,
      error: null as Error | null,
      onsuccess: null as (() => void) | null,
      onerror: null as (() => void) | null,
    };
    later(() => {
      if (control.failure === 'requests') {
        pending.error = new Error('read failed');
        pending.onerror?.();
        return;
      }
      pending.result = run();
      pending.onsuccess?.();
    });
    return pending as unknown as IDBRequest;
  };
  const database = (stores: Map<string, Map<string, unknown>>) => ({
    objectStoreNames: { contains: (name: string) => stores.has(name) },
    createObjectStore: (name: string) => {
      stores.set(name, new Map());
    },
    transaction: (name: string) => {
      const transaction = {
        error: null as Error | null,
        oncomplete: null as (() => void) | null,
        onerror: null as (() => void) | null,
        onabort: null as (() => void) | null,
        objectStore: () => {
          const objects = stores.get(name);
          if (objects === undefined) {
            throw new Error(`no store ${name}`);
          }
          return {
            getAll: () => request(() => [...objects.values()]),
            get: (key: string) => request(() => objects.get(key)),
            put: (value: { key: string }) => {
              if (control.failure !== 'transactions' && control.failure !== 'quota') {
                objects.set(value.key, value);
              }
            },
            delete: (key: string) => {
              if (control.failure !== 'transactions') {
                objects.delete(key);
              }
            },
          };
        },
      };
      later(() => {
        if (control.failure === 'transactions') {
          transaction.error = new Error('write failed');
          transaction.onerror?.();
        } else if (control.failure === 'quota') {
          transaction.error = new DOMException(
            'The quota has been exceeded.',
            'QuotaExceededError',
          );
          transaction.onerror?.();
        } else {
          transaction.oncomplete?.();
        }
      });
      return transaction;
    },
  });
  const factory = {
    open: (name: string, version: number) => {
      const opening = {
        result: undefined as unknown,
        error: null as Error | null,
        onblocked: null as (() => void) | null,
        onupgradeneeded: null as (() => void) | null,
        onsuccess: null as (() => void) | null,
        onerror: null as (() => void) | null,
      };
      later(() => {
        switch (control.open) {
          case 'never':
            return;
          case 'blocked':
            opening.onblocked?.();
            return;
          case 'error':
            opening.error = new Error('quota');
            opening.onerror?.();
            return;
          case 'ok': {
            const isOlder = (versions.get(name) ?? 0) < version;
            const stores = databases.get(name) ?? new Map<string, Map<string, unknown>>();
            databases.set(name, stores);
            versions.set(name, Math.max(version, versions.get(name) ?? 0));
            opening.result = database(stores);
            if (isOlder) {
              control.upgrades += 1;
              opening.onupgradeneeded?.();
            }
            opening.onsuccess?.();
          }
        }
      });
      return opening;
    },
  };
  /** Puts a database of an earlier version in place, as an earlier page left it. */
  const seed = (name: string, version: number, stores: Record<string, unknown[]>): void => {
    const made = new Map<string, Map<string, unknown>>();
    for (const [store, values] of Object.entries(stores)) {
      made.set(store, new Map(values.map((value) => [(value as { key: string }).key, value])));
    }
    databases.set(name, made);
    versions.set(name, version);
  };
  return { factory, control, seed };
}

function recentFile(key: string, usedAt: number): RecentFile {
  return { key, name: `${key}.ns.svg`, usedAt, source: { kind: 'copy', text: '' } };
}

function backupOf(key: string): Backup {
  return { key, name: `${key}.ns.svg`, snapshot: `{"${key}":1}`, savedAt: 1 };
}

async function openWith(fake: ReturnType<typeof fakeIndexedDb>, errors: string[] = []) {
  vi.stubGlobal('indexedDB', fake.factory);
  return openBrowserDb((detail) => errors.push(detail));
}

/** Whether `db` keeps what is written to it. */
async function keepsWrites(db: BrowserDb): Promise<boolean> {
  await db.putBackup(backupOf('probe'));
  return (await db.backup('probe')) !== undefined;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('browser database in IndexedDB', () => {
  it('T-0777 · R-WEB-03: keeps backups across page loads', async () => {
    const fake = fakeIndexedDb();
    const first = await openWith(fake);
    await first.putBackup(backupOf('a'));
    await first.putBackup(backupOf('b'));
    await first.deleteBackup('a');
    const second = await openWith(fake);
    expect(await second.backups()).toEqual([backupOf('b')]);
    expect(await second.backup('b')).toEqual(backupOf('b'));
    expect(await second.backup('a')).toBeUndefined();
    // The stores are made once, when the database is new.
    expect(fake.control.upgrades).toBe(1);
  });

  it('T-0778 · R-EXP-04: lists recent files newest first, one entry per file', async () => {
    const db = await openWith(fakeIndexedDb());
    await db.touchRecent(recentFile('a', 1));
    await db.touchRecent(recentFile('b', 2));
    await db.touchRecent(recentFile('a', 3));
    expect((await db.recentFiles()).map((entry) => entry.key)).toEqual(['a', 'b']);
    await db.forgetRecent('a');
    expect((await db.recentFiles()).map((entry) => entry.key)).toEqual(['b']);
  });

  it('T-0779 · R-EXP-04: a file that falls off the recent files loses its backup too', async () => {
    const db = await openWith(fakeIndexedDb());
    for (let index = 0; index < recentFilesLimit; index += 1) {
      await db.touchRecent(recentFile(`f${String(index)}`, index));
    }
    await db.putBackup(backupOf('f0'));
    await db.putBackup(backupOf('f1'));
    await db.touchRecent(recentFile('new', 100));
    const keys = (await db.recentFiles()).map((entry) => entry.key);
    expect(keys).toHaveLength(recentFilesLimit);
    expect(keys).not.toContain('f0');
    expect((await db.backups()).map((backup) => backup.key)).toEqual(['f1']);
  });

  it('T-0780: a failed read is reported and reads as empty', async () => {
    const fake = fakeIndexedDb();
    const errors: string[] = [];
    const db = await openWith(fake, errors);
    await db.putBackup(backupOf('a'));
    fake.control.failure = 'requests';
    expect(await db.recentFiles()).toEqual([]);
    expect(await db.backups()).toEqual([]);
    expect(await db.backup('a')).toBeUndefined();
    expect(errors).toEqual([
      'IndexedDB read recent failed: Error: read failed',
      'IndexedDB read backups failed: Error: read failed',
      'IndexedDB read backup failed: Error: read failed',
    ]);
  });

  it('T-0781: a failed write is reported, not thrown', async () => {
    const fake = fakeIndexedDb();
    const errors: string[] = [];
    const db = await openWith(fake, errors);
    fake.control.failure = 'transactions';
    await db.putBackup(backupOf('a'));
    await db.deleteBackup('a');
    await db.touchRecent(recentFile('a', 1));
    await db.forgetRecent('a');
    expect(errors).toEqual([
      'IndexedDB write backup failed: Error: write failed',
      'IndexedDB delete backup failed: Error: write failed',
      'IndexedDB write recent failed: Error: write failed',
      'IndexedDB forget recent failed: Error: write failed',
    ]);
    fake.control.failure = 'none';
    expect(await db.backups()).toEqual([]);
  });
});

function browserDocument(key: string, savedAt: number): BrowserDocument {
  return { key, name: key.toUpperCase(), text: `<svg>${key}</svg>`, savedAt, size: 12 };
}

describe('browser database: documents in this browser (R-WEB-09)', () => {
  it('T-0963: 06-web 1.3: version 2 adds the documents and keeps the backups and recent files of version 1', async () => {
    const fake = fakeIndexedDb();
    fake.seed('ariadne-nsd-web', 1, {
      recent: [recentFile('a', 1)],
      backups: [backupOf('a')],
    });
    const db = await openWith(fake);
    expect(fake.control.upgrades).toBe(1);
    expect(await db.recentFiles()).toEqual([recentFile('a', 1)]);
    expect(await db.backups()).toEqual([backupOf('a')]);
    expect(await db.documents()).toEqual([]);
    expect(await db.putDocument(browserDocument('d', 5))).toBe('ok');
    const again = await openWith(fake);
    expect(fake.control.upgrades).toBe(1);
    expect(await again.document('d')).toEqual(browserDocument('d', 5));
  });

  it('T-0964 · UX BS3: keeps documents across page loads, newest first, and deletes them', async () => {
    const fake = fakeIndexedDb();
    const db = await openWith(fake);
    await db.putDocument(browserDocument('old', 1));
    await db.putDocument(browserDocument('new', 9));
    const second = await openWith(fake);
    expect((await second.documents()).map((item) => item.key)).toEqual(['new', 'old']);
    await second.deleteDocument('old');
    expect(await second.document('old')).toBeUndefined();
    expect((await second.documents()).map((item) => item.key)).toEqual(['new']);
  });

  it('T-0965 · R-WEB-09: a full storage is told apart from other failures', async () => {
    const fake = fakeIndexedDb();
    const errors: string[] = [];
    const db = await openWith(fake, errors);
    fake.control.failure = 'quota';
    expect(await db.putDocument(browserDocument('a', 1))).toBe('full');
    fake.control.failure = 'transactions';
    expect(await db.putDocument(browserDocument('a', 1))).toBe('failed');
    await db.deleteDocument('a');
    fake.control.failure = 'requests';
    expect(await db.documents()).toEqual([]);
    expect(await db.document('a')).toBeUndefined();
    expect(errors).toHaveLength(5);
    expect(errors[0]).toContain('IndexedDB write document failed: QuotaExceededError');
  });

  it('T-0966 · R-WEB-09: memory keeps documents for this page', async () => {
    const db = memoryDb();
    expect(await db.putDocument(browserDocument('a', 1))).toBe('ok');
    await db.putDocument(browserDocument('b', 2));
    expect((await db.documents()).map((item) => item.key)).toEqual(['b', 'a']);
    expect(await db.document('a')).toEqual(browserDocument('a', 1));
    await db.deleteDocument('a');
    expect(await db.document('a')).toBeUndefined();
  });
});

describe('browser database fallback to memory', () => {
  it('T-0782: 06-web 2: uses memory when IndexedDB is missing', async () => {
    const errors: string[] = [];
    vi.stubGlobal('indexedDB', undefined);
    const db = await openBrowserDb((detail) => errors.push(detail));
    expect(errors[0]).toContain('IndexedDB is not available, using memory');
    expect(await keepsWrites(db)).toBe(true);
  });

  it('T-0783: 06-web 2: uses memory when another tab blocks the database', async () => {
    const fake = fakeIndexedDb();
    fake.control.open = 'blocked';
    const errors: string[] = [];
    await openWith(fake, errors);
    expect(errors).toEqual([
      'IndexedDB is not available, using memory: Error: indexedDB.open is blocked by another tab',
    ]);
  });

  it('T-0784: 06-web 2: uses memory when opening fails', async () => {
    const fake = fakeIndexedDb();
    fake.control.open = 'error';
    const errors: string[] = [];
    await openWith(fake, errors);
    expect(errors).toEqual(['IndexedDB is not available, using memory: Error: quota']);
  });

  it('T-0785: 06-web 2: goes on with memory when opening does not answer in 3 s', async () => {
    vi.useFakeTimers();
    const fake = fakeIndexedDb();
    fake.control.open = 'never';
    const errors: string[] = [];
    let isOpen = false;
    const opening = openWith(fake, errors).then((db) => {
      isOpen = true;
      return db;
    });
    await vi.advanceTimersByTimeAsync(2999);
    expect(isOpen).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    const db = await opening;
    expect(errors).toEqual([
      'IndexedDB is not available, using memory: Error: indexedDB.open did not answer in 3000 ms',
    ]);
    vi.useRealTimers();
    expect(await keepsWrites(db)).toBe(true);
  });
});

describe('browser database in memory', () => {
  it('T-0786 · R-EXP-04: keeps recent files and drops the backups of files that fall off', async () => {
    const db = memoryDb();
    for (let index = 0; index < recentFilesLimit; index += 1) {
      await db.touchRecent(recentFile(`f${String(index)}`, index));
    }
    await db.putBackup(backupOf('f0'));
    await db.touchRecent(recentFile('new', 100));
    expect(await db.backup('f0')).toBeUndefined();
    await db.forgetRecent('new');
    expect((await db.recentFiles()).map((entry) => entry.key)).not.toContain('new');
  });
});
