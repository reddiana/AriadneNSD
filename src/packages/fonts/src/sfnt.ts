/** One table of an sfnt (TrueType/OpenType) font: its four-letter tag and raw bytes. */
export type SfntTable = {
  readonly tag: string;
  readonly data: Uint8Array;
};

/** An sfnt font split into its tables. */
export type Sfnt = {
  /** The sfnt version: 0x00010000 for TrueType outlines. */
  readonly flavor: number;
  /** Sorted by tag (byte order), as the OpenType table directory requires. */
  readonly tables: ReadonlyArray<SfntTable>;
};

/** Reads the table directory of an uncompressed sfnt font. Throws on a malformed font (a bug upstream). */
export function readSfnt(bytes: Uint8Array): Sfnt {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const flavor = view.getUint32(0);
  const numTables = view.getUint16(4);
  const tables: SfntTable[] = [];
  for (let index = 0; index < numTables; index += 1) {
    const record = 12 + index * 16;
    const tag = tagToString(view.getUint32(record));
    const offset = view.getUint32(record + 8);
    const length = view.getUint32(record + 12);
    if (offset + length > bytes.byteLength) {
      throw new Error(`sfnt table ${tag} runs past the end of the font`);
    }
    tables.push({ tag, data: bytes.subarray(offset, offset + length) });
  }
  tables.sort((a, b) => compareTags(a.tag, b.tag));
  return { flavor, tables };
}

/**
 * The OpenType table checksum: the sum of the data as big-endian uint32 words,
 * with the last word zero-padded.
 */
export function tableChecksum(data: Uint8Array): number {
  let sum = 0;
  const fullWords = data.byteLength >>> 2;
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  for (let word = 0; word < fullWords; word += 1) {
    sum = (sum + view.getUint32(word * 4)) >>> 0;
  }
  const rest = data.byteLength & 3;
  if (rest > 0) {
    let last = 0;
    for (let index = 0; index < 4; index += 1) {
      last = (last << 8) | (index < rest ? (data[fullWords * 4 + index] ?? 0) : 0);
    }
    sum = (sum + (last >>> 0)) >>> 0;
  }
  return sum;
}

/** Converts a four-letter table tag to its uint32 value. */
export function tagToNumber(tag: string): number {
  let value = 0;
  for (let index = 0; index < 4; index += 1) {
    value = (value << 8) | (tag.charCodeAt(index) & 0xff);
  }
  return value >>> 0;
}

function tagToString(value: number): string {
  return String.fromCharCode(
    (value >>> 24) & 0xff,
    (value >>> 16) & 0xff,
    (value >>> 8) & 0xff,
    value & 0xff,
  );
}

function compareTags(a: string, b: string): number {
  return tagToNumber(a) - tagToNumber(b);
}

/** Rounds a byte length up to the next multiple of four (sfnt and WOFF table alignment). */
export function padded4(length: number): number {
  return (length + 3) & ~3;
}
