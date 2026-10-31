import { zlibSync } from 'fflate';

import { padded4, readSfnt, tableChecksum, tagToNumber } from './sfnt';
import type { SfntTable } from './sfnt';

/**
 * The zlib settings. Changing them (or the fflate version) changes saved files,
 * so both are fixed (ADR-0039, coding guide 12).
 */
const ZLIB_OPTIONS = { level: 9, mem: 8 } as const;

const WOFF_HEADER_SIZE = 44;
const WOFF_DIRECTORY_ENTRY_SIZE = 20;
const SFNT_HEADER_SIZE = 12;
const SFNT_DIRECTORY_ENTRY_SIZE = 16;
/** Offset of `checkSumAdjustment` in the `head` table. */
const HEAD_CHECKSUM_ADJUSTMENT = 8;

/**
 * Wraps an sfnt (TTF) font in WOFF 1.0 (ADR-0039).
 * Each table is zlib-compressed unless that would not make it smaller, as the WOFF spec requires.
 * There is no metadata or private block. The same input always gives the same bytes (R-FMT-03).
 */
export function encodeWoff(sfnt: Uint8Array): Uint8Array {
  const { flavor, tables: sourceTables } = readSfnt(sfnt);
  const tables = withChecksumAdjustment(flavor, sourceTables);

  const entries = tables.map((table) => {
    const compressed = zlibSync(table.data, ZLIB_OPTIONS);
    const stored = compressed.byteLength < table.data.byteLength ? compressed : table.data;
    return { table, stored, checksum: checksumForDirectory(table) };
  });

  const dataStart = WOFF_HEADER_SIZE + WOFF_DIRECTORY_ENTRY_SIZE * entries.length;
  const totalLength = entries.reduce(
    (sum, entry) => sum + padded4(entry.stored.byteLength),
    dataStart,
  );
  const totalSfntSize =
    SFNT_HEADER_SIZE +
    SFNT_DIRECTORY_ENTRY_SIZE * tables.length +
    tables.reduce((sum, table) => sum + padded4(table.data.byteLength), 0);

  const out = new Uint8Array(totalLength);
  const view = new DataView(out.buffer);
  view.setUint32(0, tagToNumber('wOFF'));
  view.setUint32(4, flavor);
  view.setUint32(8, totalLength);
  view.setUint16(12, entries.length);
  view.setUint16(14, 0); // reserved
  view.setUint32(16, totalSfntSize);
  view.setUint16(20, 1); // majorVersion of this WOFF file
  view.setUint16(22, 0); // minorVersion
  // metaOffset, metaLength, metaOrigLength, privOffset, privLength stay 0.

  let offset = dataStart;
  entries.forEach((entry, index) => {
    const record = WOFF_HEADER_SIZE + index * WOFF_DIRECTORY_ENTRY_SIZE;
    view.setUint32(record, tagToNumber(entry.table.tag));
    view.setUint32(record + 4, offset);
    view.setUint32(record + 8, entry.stored.byteLength);
    view.setUint32(record + 12, entry.table.data.byteLength);
    view.setUint32(record + 16, entry.checksum);
    out.set(entry.stored, offset);
    offset += padded4(entry.stored.byteLength);
  });
  return out;
}

/**
 * Sets `head.checkSumAdjustment` for the sfnt a WOFF reader rebuilds (tables in tag order),
 * so the decoded font has a valid whole-font checksum whatever the subsetter wrote.
 */
function withChecksumAdjustment(
  flavor: number,
  tables: ReadonlyArray<SfntTable>,
): ReadonlyArray<SfntTable> {
  const header = sfntHeader(flavor, tables);
  let sum = tableChecksum(header);
  for (const table of tables) {
    sum = (sum + checksumForDirectory(table)) >>> 0;
  }
  const adjustment = (0xb1b0afba - sum) >>> 0;
  return tables.map((table) => {
    if (table.tag !== 'head') {
      return table;
    }
    const data = table.data.slice();
    new DataView(data.buffer).setUint32(HEAD_CHECKSUM_ADJUSTMENT, adjustment);
    return { tag: table.tag, data };
  });
}

/** The table checksum as the directory stores it: for `head`, with `checkSumAdjustment` taken as 0. */
function checksumForDirectory(table: SfntTable): number {
  if (table.tag !== 'head') {
    return tableChecksum(table.data);
  }
  const data = table.data.slice();
  new DataView(data.buffer).setUint32(HEAD_CHECKSUM_ADJUSTMENT, 0);
  return tableChecksum(data);
}

/** The offset table and table directory of the rebuilt sfnt. */
function sfntHeader(flavor: number, tables: ReadonlyArray<SfntTable>): Uint8Array {
  const count = tables.length;
  const header = new Uint8Array(SFNT_HEADER_SIZE + SFNT_DIRECTORY_ENTRY_SIZE * count);
  const view = new DataView(header.buffer);
  const entrySelector = count > 0 ? Math.floor(Math.log2(count)) : 0;
  const searchRange = 2 ** entrySelector * 16;
  view.setUint32(0, flavor);
  view.setUint16(4, count);
  view.setUint16(6, searchRange);
  view.setUint16(8, entrySelector);
  view.setUint16(10, count * 16 - searchRange);
  let offset = header.byteLength;
  tables.forEach((table, index) => {
    const record = SFNT_HEADER_SIZE + index * SFNT_DIRECTORY_ENTRY_SIZE;
    view.setUint32(record, tagToNumber(table.tag));
    view.setUint32(record + 4, checksumForDirectory(table));
    view.setUint32(record + 8, offset);
    view.setUint32(record + 12, table.data.byteLength);
    offset += padded4(table.data.byteLength);
  });
  return header;
}
