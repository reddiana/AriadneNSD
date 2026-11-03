// Documents kept in this browser (R-WEB-09, 06-web 1.3). Pure rules; storage is in `browser-db.ts`.

/**
 * One document in this browser. `text` is the same `.ns.svg` text a file save writes (R-FMT-03),
 * so an exported document opens as a file. `key` is the document key (06-web 1).
 */
export type BrowserDocument = {
  readonly key: string;
  /** The name the user gave it, without an extension ("Merge Sort"). */
  readonly name: string;
  readonly text: string;
  /** When it was last saved, in milliseconds since 1970. */
  readonly savedAt: number;
  /** The size of `text` in bytes (UTF-8). */
  readonly size: number;
};

/** The documents, the one saved last first (UX BS3). */
export function newestFirst(
  documents: ReadonlyArray<BrowserDocument>,
): ReadonlyArray<BrowserDocument> {
  return [...documents].sort((a, b) => b.savedAt - a.savedAt);
}

/** Names are the same when they differ only in case or in spaces around them. */
export function isSameName(a: string, b: string): boolean {
  return a.trim().toLocaleLowerCase() === b.trim().toLocaleLowerCase();
}

/** The document with this name, if there is one. */
export function findByName(
  documents: ReadonlyArray<BrowserDocument>,
  name: string,
): BrowserDocument | undefined {
  return documents.find((document) => isSameName(document.name, name));
}

/** `name`, or `name (2)`, `name (3)` … when the name is taken. */
export function uniqueName(name: string, taken: ReadonlyArray<string>): string {
  const isTaken = (candidate: string): boolean =>
    taken.some((other) => isSameName(other, candidate));
  if (!isTaken(name)) {
    return name;
  }
  for (let number = 2; ; number += 1) {
    const candidate = `${name} (${String(number)})`;
    if (!isTaken(candidate)) {
      return candidate;
    }
  }
}

/** The size of a text in bytes, as UTF-8. */
export function byteSize(text: string): number {
  return new TextEncoder().encode(text).length;
}
