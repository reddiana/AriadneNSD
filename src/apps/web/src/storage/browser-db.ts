// The shell's IndexedDB database (06-web 1.1, 2): recent files and local backups.
// One database, two object stores. Both are keyed by the document key.

import type { RecentFile } from './recent-files';
import { forgetRecent, orderRecent, touchRecent } from './recent-files';

const databaseName = 'ariadne-nsd-web';
const databaseVersion = 1;
const recentStore = 'recent';
const backupStore = 'backups';

/**
 * A local backup of one document (R-WEB-03): the model JSON from `snapshot()` of edits that are
 * not yet in the original file. Removed when the document is saved.
 */
export type Backup = {
  readonly key: string;
  readonly name: string;
  /** The editor's `snapshot()`: model JSON. */
  readonly snapshot: string;
  readonly savedAt: number;
  /** Chromium: the original file, so a restored document can still be saved in place. */
  readonly handle?: FileSystemFileHandle;
};

/** The shell's storage in this browser. Every method resolves; failures are reported, not thrown. */
export type BrowserDb = {
  readonly recentFiles: () => Promise<ReadonlyArray<RecentFile>>;
  /** Adds or moves a file to the top of the list. Backups of files that fall off are removed. */
  readonly touchRecent: (entry: RecentFile) => Promise<void>;
  readonly forgetRecent: (key: string) => Promise<void>;
  readonly backups: () => Promise<ReadonlyArray<Backup>>;
  readonly backup: (key: string) => Promise<Backup | undefined>;
  readonly putBackup: (backup: Backup) => Promise<void>;
  readonly deleteBackup: (key: string) => Promise<void>;
};

/**
 * Opens the database. When IndexedDB is not available (a private window in some browsers),
 * returns a database that keeps everything in memory for this page only.
 */
export async function openBrowserDb(onError: (detail: string) => void): Promise<BrowserDb> {
  let database: IDBDatabase;
  try {
    database = await openDatabase();
  } catch (error) {
    onError(`IndexedDB is not available, using memory: ${String(error)}`);
    return memoryDb();
  }
  const guard = async <T>(what: string, fallback: T, work: () => Promise<T>): Promise<T> => {
    try {
      return await work();
    } catch (error) {
      onError(`IndexedDB ${what} failed: ${String(error)}`);
      return fallback;
    }
  };
  const all = <T>(store: string): Promise<T[]> =>
    request<T[]>(database.transaction(store).objectStore(store).getAll());
  const put = (store: string, value: unknown): Promise<void> =>
    commit(database, store, (objects) => objects.put(value));
  const remove = (store: string, key: string): Promise<void> =>
    commit(database, store, (objects) => objects.delete(key));

  const readRecent = async (): Promise<ReadonlyArray<RecentFile>> =>
    orderRecent(await all<RecentFile>(recentStore));

  return {
    recentFiles: () => guard('read recent', [], readRecent),
    touchRecent: (entry) =>
      guard('write recent', undefined, async () => {
        const { dropped } = touchRecent(await readRecent(), entry);
        await put(recentStore, entry);
        for (const old of dropped) {
          await remove(recentStore, old.key);
          await remove(backupStore, old.key);
        }
      }),
    forgetRecent: (key) => guard('forget recent', undefined, () => remove(recentStore, key)),
    backups: () => guard('read backups', [], () => all<Backup>(backupStore)),
    backup: (key) =>
      guard('read backup', undefined, () =>
        request<Backup | undefined>(
          database.transaction(backupStore).objectStore(backupStore).get(key),
        ),
      ),
    putBackup: (backup) => guard('write backup', undefined, () => put(backupStore, backup)),
    deleteBackup: (key) => guard('delete backup', undefined, () => remove(backupStore, key)),
  };
}

/** A database in memory, for when IndexedDB cannot be opened. */
export function memoryDb(): BrowserDb {
  let recent: ReadonlyArray<RecentFile> = [];
  const backups = new Map<string, Backup>();
  return {
    recentFiles: () => Promise.resolve(recent),
    touchRecent: (entry) => {
      const result = touchRecent(recent, entry);
      recent = result.list;
      for (const old of result.dropped) {
        backups.delete(old.key);
      }
      return Promise.resolve();
    },
    forgetRecent: (key) => {
      recent = forgetRecent(recent, key);
      return Promise.resolve();
    },
    backups: () => Promise.resolve([...backups.values()]),
    backup: (key) => Promise.resolve(backups.get(key)),
    putBackup: (backup) => {
      backups.set(backup.key, backup);
      return Promise.resolve();
    },
    deleteBackup: (key) => {
      backups.delete(key);
      return Promise.resolve();
    },
  };
}

/**
 * How long opening may take before the page goes on with memory. The page is drawn only after the
 * database opens, so an open that never answers (blocked by another tab, or a browser that hangs)
 * must not keep the screen empty (inbox 2026-11-01: the MVP did not appear on an Android phone).
 */
const openTimeoutMs = 3000;

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`indexedDB.open did not answer in ${String(openTimeoutMs)} ms`));
    }, openTimeoutMs);
    const opening = indexedDB.open(databaseName, databaseVersion);
    opening.onblocked = () => {
      clearTimeout(timer);
      reject(new Error('indexedDB.open is blocked by another tab'));
    };
    opening.onupgradeneeded = () => {
      const database = opening.result;
      for (const store of [recentStore, backupStore]) {
        if (!database.objectStoreNames.contains(store)) {
          database.createObjectStore(store, { keyPath: 'key' });
        }
      }
    };
    opening.onsuccess = () => {
      clearTimeout(timer);
      resolve(opening.result);
    };
    opening.onerror = () => {
      clearTimeout(timer);
      reject(opening.error ?? new Error('indexedDB.open failed'));
    };
  });
}

function request<T>(pending: IDBRequest): Promise<T> {
  return new Promise((resolve, reject) => {
    pending.onsuccess = () => {
      resolve(pending.result as T);
    };
    pending.onerror = () => {
      reject(pending.error ?? new Error('IndexedDB request failed'));
    };
  });
}

function commit(
  database: IDBDatabase,
  store: string,
  change: (objects: IDBObjectStore) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(store, 'readwrite');
    change(transaction.objectStore(store));
    transaction.oncomplete = () => {
      resolve();
    };
    transaction.onerror = () => {
      reject(transaction.error ?? new Error('IndexedDB transaction failed'));
    };
    transaction.onabort = () => {
      reject(transaction.error ?? new Error('IndexedDB transaction aborted'));
    };
  });
}
