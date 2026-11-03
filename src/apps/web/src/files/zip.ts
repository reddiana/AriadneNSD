// The zip of "Export All to Files" and "Import from Files…" (R-WEB-09, UX BS4), with fflate.
// fflate is one module that the fonts' WOFF (ADR-0039) already loads at the first visit, so the
// zip code comes with it (about 3 KB gzip, QA-09). It is imported here when used, so the zip code
// stays out of the first visit once the WOFF code is loaded later too.

/** One file in a zip: its name and its text. */
export type ZipEntry = { readonly name: string; readonly text: string };

/** Packs texts into a zip. Its bytes are not part of a saved file, so the level is free to pick. */
export async function zipTexts(entries: ReadonlyArray<ZipEntry>): Promise<Uint8Array> {
  const { strToU8, zipSync } = await import('fflate');
  const files: Record<string, Uint8Array> = {};
  for (const entry of entries) {
    files[entry.name] = strToU8(entry.text);
  }
  return zipSync(files, { level: 6 });
}

/** Unpacks the files whose names `accept` takes. Folders in the zip are left out of the names. */
export async function unzipTexts(
  bytes: Uint8Array,
  accept: (name: string) => boolean,
): Promise<ReadonlyArray<ZipEntry>> {
  const { strFromU8, unzipSync } = await import('fflate');
  const files = unzipSync(bytes, {
    filter: (file) => !file.name.endsWith('/') && accept(baseOf(file.name)),
  });
  return Object.entries(files).map(([name, data]) => ({
    name: baseOf(name),
    text: strFromU8(data),
  }));
}

/** Whether the bytes start like a zip file (`PK\x03\x04`). */
export function isZip(bytes: Uint8Array): boolean {
  return bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04;
}

function baseOf(path: string): string {
  return path.slice(path.lastIndexOf('/') + 1);
}
