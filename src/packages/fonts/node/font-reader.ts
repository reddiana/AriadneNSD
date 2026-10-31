// Test helpers: just enough WOFF and sfnt reading to check what the subsetter wrote.
import { unzlibSync } from 'fflate';

import { tableChecksum } from '../src/sfnt';

export type WoffHeader = {
  readonly signature: string;
  readonly flavor: number;
  readonly length: number;
  readonly numTables: number;
  readonly reserved: number;
  readonly totalSfntSize: number;
  readonly metaOffset: number;
  readonly metaLength: number;
  readonly privOffset: number;
  readonly privLength: number;
};

export type WoffEntry = {
  readonly tag: string;
  readonly offset: number;
  readonly compLength: number;
  readonly origLength: number;
  readonly origChecksum: number;
};

export function readWoffHeader(woff: Uint8Array): WoffHeader {
  const view = viewOf(woff);
  return {
    signature: tagAt(view, 0),
    flavor: view.getUint32(4),
    length: view.getUint32(8),
    numTables: view.getUint16(12),
    reserved: view.getUint16(14),
    totalSfntSize: view.getUint32(16),
    metaOffset: view.getUint32(24),
    metaLength: view.getUint32(28),
    privOffset: view.getUint32(36),
    privLength: view.getUint32(40),
  };
}

export function readWoffDirectory(woff: Uint8Array): ReadonlyArray<WoffEntry> {
  const view = viewOf(woff);
  const entries: WoffEntry[] = [];
  for (let index = 0; index < view.getUint16(12); index += 1) {
    const record = 44 + index * 20;
    entries.push({
      tag: tagAt(view, record),
      offset: view.getUint32(record + 4),
      compLength: view.getUint32(record + 8),
      origLength: view.getUint32(record + 12),
      origChecksum: view.getUint32(record + 16),
    });
  }
  return entries;
}

/** Decodes every table of a WOFF file, checking lengths and checksums on the way. */
export function decodeWoffTables(woff: Uint8Array): ReadonlyMap<string, Uint8Array> {
  const tables = new Map<string, Uint8Array>();
  for (const entry of readWoffDirectory(woff)) {
    const stored = woff.subarray(entry.offset, entry.offset + entry.compLength);
    const data = entry.compLength < entry.origLength ? unzlibSync(stored) : stored;
    if (data.byteLength !== entry.origLength) {
      throw new Error(
        `${entry.tag}: decoded ${String(data.byteLength)} bytes, expected ${String(entry.origLength)}`,
      );
    }
    const forChecksum = entry.tag === 'head' ? zeroAdjustment(data) : data;
    if (tableChecksum(forChecksum) !== entry.origChecksum) {
      throw new Error(`${entry.tag}: checksum mismatch`);
    }
    tables.set(entry.tag, data);
  }
  return tables;
}

/** Code points mapped by the Windows Unicode cmap subtable (format 4 or 12). */
export function readCmapCodePoints(cmap: Uint8Array): ReadonlySet<number> {
  const view = viewOf(cmap);
  const codePoints = new Set<number>();
  const count = view.getUint16(2);
  for (let index = 0; index < count; index += 1) {
    const record = 4 + index * 8;
    const platform = view.getUint16(record);
    const encoding = view.getUint16(record + 2);
    if (platform !== 3 || (encoding !== 1 && encoding !== 10)) {
      continue;
    }
    const offset = view.getUint32(record + 4);
    const format = view.getUint16(offset);
    if (format === 4) {
      readFormat4(view, offset, codePoints);
    } else if (format === 12) {
      readFormat12(view, offset, codePoints);
    }
  }
  return codePoints;
}

/** The Windows English (US) name record with this id, or undefined. */
export function readName(name: Uint8Array, nameId: number): string | undefined {
  const view = viewOf(name);
  const count = view.getUint16(2);
  const storage = view.getUint16(4);
  for (let index = 0; index < count; index += 1) {
    const record = 6 + index * 12;
    if (
      view.getUint16(record) === 3 &&
      view.getUint16(record + 4) === 0x409 &&
      view.getUint16(record + 6) === nameId
    ) {
      const length = view.getUint16(record + 8);
      const start = storage + view.getUint16(record + 10);
      let text = '';
      for (let at = start; at < start + length; at += 2) {
        text += String.fromCharCode(view.getUint16(at));
      }
      return text;
    }
  }
  return undefined;
}

function readFormat4(view: DataView, offset: number, out: Set<number>): void {
  const segments = view.getUint16(offset + 6) / 2;
  const endCodes = offset + 14;
  const startCodes = endCodes + segments * 2 + 2;
  const deltas = startCodes + segments * 2;
  const rangeOffsets = deltas + segments * 2;
  for (let segment = 0; segment < segments; segment += 1) {
    const end = view.getUint16(endCodes + segment * 2);
    const start = view.getUint16(startCodes + segment * 2);
    const delta = view.getUint16(deltas + segment * 2);
    const rangeOffsetAt = rangeOffsets + segment * 2;
    const rangeOffset = view.getUint16(rangeOffsetAt);
    for (let code = start; code <= end && code !== 0xffff; code += 1) {
      let glyph: number;
      if (rangeOffset === 0) {
        glyph = (code + delta) & 0xffff;
      } else {
        const raw = view.getUint16(rangeOffsetAt + rangeOffset + (code - start) * 2);
        glyph = raw === 0 ? 0 : (raw + delta) & 0xffff;
      }
      if (glyph !== 0) {
        out.add(code);
      }
    }
  }
}

function readFormat12(view: DataView, offset: number, out: Set<number>): void {
  const groups = view.getUint32(offset + 12);
  for (let group = 0; group < groups; group += 1) {
    const record = offset + 16 + group * 12;
    const last = view.getUint32(record + 4);
    for (let code = view.getUint32(record); code <= last; code += 1) {
      out.add(code);
    }
  }
}

function zeroAdjustment(head: Uint8Array): Uint8Array {
  const copy = head.slice();
  new DataView(copy.buffer).setUint32(8, 0);
  return copy;
}

function viewOf(bytes: Uint8Array): DataView {
  return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
}

function tagAt(view: DataView, offset: number): string {
  return String.fromCharCode(
    view.getUint8(offset),
    view.getUint8(offset + 1),
    view.getUint8(offset + 2),
    view.getUint8(offset + 3),
  );
}
