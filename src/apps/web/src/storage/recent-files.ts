// The recent files list (06-web 1.1, R-EXP-04). Pure list rules; storage is in `browser-db.ts`.

/** How many files the list remembers. */
export const recentFilesLimit = 10;

/**
 * Where a recent file is. Chromium remembers the file handle; Firefox and Safari cannot, so they
 * remember a copy of the last text in this browser ("browser copy"). A document kept in this
 * browser (R-WEB-09) is read from the documents store by its key.
 */
export type RecentSource =
  | { readonly kind: 'handle'; readonly handle: FileSystemFileHandle }
  | { readonly kind: 'copy'; readonly text: string }
  | { readonly kind: 'browser' };

/** One entry of the list. `key` is the document's key, the same as its local backup (06-web 2). */
export type RecentFile = {
  readonly key: string;
  readonly name: string;
  /** When it was last opened or saved, in milliseconds since 1970. */
  readonly usedAt: number;
  readonly source: RecentSource;
};

/**
 * Puts `entry` at the top: the newest first, one entry per key, at most `recentFilesLimit`.
 * Returns the new list and the entries that fell off (their backups can be removed).
 */
export function touchRecent(
  list: ReadonlyArray<RecentFile>,
  entry: RecentFile,
): { readonly list: ReadonlyArray<RecentFile>; readonly dropped: ReadonlyArray<RecentFile> } {
  const others = list.filter((item) => item.key !== entry.key);
  const sorted = [entry, ...others].sort((a, b) => b.usedAt - a.usedAt);
  return { list: sorted.slice(0, recentFilesLimit), dropped: sorted.slice(recentFilesLimit) };
}

/** Removes the entry with `key`, for example a file that was moved or deleted. */
export function forgetRecent(
  list: ReadonlyArray<RecentFile>,
  key: string,
): ReadonlyArray<RecentFile> {
  return list.filter((item) => item.key !== key);
}

/** Sorts entries read from storage: the newest first, at most `recentFilesLimit`. */
export function orderRecent(list: ReadonlyArray<RecentFile>): ReadonlyArray<RecentFile> {
  return [...list].sort((a, b) => b.usedAt - a.usedAt).slice(0, recentFilesLimit);
}
