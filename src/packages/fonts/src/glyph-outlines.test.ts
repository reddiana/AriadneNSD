// The glyph reader on a tiny hand-made TrueType font: the cmap format 4, short and long
// coordinates, repeated flags, a contour of only off-curve points and composite glyphs.
import { describe, expect, it } from 'vitest';

import { readGlyphOutlines } from './glyph-outlines';

/** Big-endian bytes from a list of [size, value]. */
function bytes(fields: ReadonlyArray<readonly [1 | 2 | 4, number]>): number[] {
  const out: number[] = [];
  for (const [size, value] of fields) {
    for (let shift = (size - 1) * 8; shift >= 0; shift -= 8) {
      out.push((value >>> shift) & 0xff);
    }
  }
  return out;
}

const u16 = (value: number): readonly [2, number] => [2, value & 0xffff];

/** glyph 1: a square of four off-curve points, the flag repeated three times. */
const allOffCurve = [
  ...bytes([u16(1), u16(0), u16(0), u16(100), u16(100), u16(3), u16(0)]),
  0x08,
  3,
  ...bytes([u16(0), u16(100), u16(0), u16(-100)]),
  ...bytes([u16(0), u16(0), u16(100), u16(0)]),
];

/** glyph 2: a triangle with short coordinates and one "same x". */
const shortTriangle = [
  ...bytes([u16(1), u16(0), u16(0), u16(50), u16(50), u16(2), u16(0)]),
  0x01 | 0x02 | 0x04 | 0x10 | 0x20,
  0x01 | 0x02 | 0x04 | 0x10 | 0x20,
  0x01 | 0x10 | 0x04,
  10,
  40,
  5,
  50,
  20,
];

/** glyph 3: glyph 2 moved by words and scaled, glyph 1 by bytes with x/y scales, glyph 2 by a 2x2. */
const composite = [
  ...bytes([u16(-1), u16(0), u16(0), u16(200), u16(200)]),
  ...bytes([u16(0x0001 | 0x0002 | 0x0008 | 0x0020), u16(2), u16(300), u16(-20), u16(0x8000)]),
  ...bytes([u16(0x0002 | 0x0040 | 0x0020), u16(1)]),
  7,
  0xf9,
  ...bytes([u16(0x4000), u16(0x2000)]),
  ...bytes([u16(0x0080), u16(2), u16(0)]),
  ...bytes([u16(0), u16(0x4000), u16(0x4000), u16(0)]),
];

function tinyFont(withFormat12 = false): Uint8Array {
  const pad = (data: number[]): number[] => [
    ...data,
    ...new Array<number>(data.length % 2).fill(0),
  ];
  const glyphs = [[], pad(allOffCurve), pad(shortTriangle), pad(composite)];
  const offsets = [0];
  for (const glyph of glyphs) {
    offsets.push((offsets.at(-1) ?? 0) + glyph.length);
  }
  const head = new Array<number>(54).fill(0);
  head.splice(18, 2, ...bytes([u16(1000)]));
  const maxp = bytes([[4, 0x00005000], u16(glyphs.length)]);
  const hhea = new Array<number>(36).fill(0);
  hhea.splice(34, 2, ...bytes([u16(2)]));
  const hmtx = bytes([u16(500), u16(0), u16(600), u16(0)]);
  const loca = bytes(offsets.map((offset) => u16(offset / 2)));
  // cmap format 4: A–C by delta (glyphs 1–3), D through the glyph id array (glyph 2), the end.
  const segments = [
    { start: 0x41, end: 0x43, delta: 1 - 0x41, rangeOffset: 0 },
    { start: 0x44, end: 0x44, delta: 0, rangeOffset: 4 },
    { start: 0xffff, end: 0xffff, delta: 1, rangeOffset: 0 },
  ];
  const segX2 = segments.length * 2;
  const subtable = bytes([
    u16(4),
    u16(16 + segments.length * 8 + 2),
    u16(0),
    u16(segX2),
    u16(0),
    u16(0),
    u16(0),
    ...segments.map((segment) => u16(segment.end)),
    u16(0),
    ...segments.map((segment) => u16(segment.start)),
    ...segments.map((segment) => u16(segment.delta)),
    ...segments.map((segment) => u16(segment.rangeOffset)),
    u16(2),
  ]);
  // cmap format 12 (when asked, after the format 4 one): A–C are glyphs 1–3, U+1F600 is glyph 2.
  const groups = [
    [0x41, 0x43, 1],
    [0x1f600, 0x1f600, 2],
  ];
  const format12 = bytes([
    u16(12),
    u16(0),
    [4, 16 + groups.length * 12],
    [4, 0],
    [4, groups.length],
    ...groups.flatMap((group) => group.map((value) => [4, value] as const)),
  ]);
  const cmap = withFormat12
    ? [
        ...bytes([
          u16(0),
          u16(2),
          u16(3),
          u16(1),
          [4, 20],
          u16(3),
          u16(10),
          [4, 20 + subtable.length],
        ]),
        ...subtable,
        ...format12,
      ]
    : [...bytes([u16(0), u16(1), u16(3), u16(1), [4, 12]]), ...subtable];
  const tables: [string, number[]][] = [
    ['cmap', cmap],
    ['glyf', glyphs.flat()],
    ['head', head],
    ['hhea', hhea],
    ['hmtx', hmtx],
    ['loca', loca],
    ['maxp', maxp],
  ];
  let offset = 12 + tables.length * 16;
  const directory: number[] = [];
  const data: number[] = [];
  for (const [tag, table] of tables) {
    directory.push(...tag.split('').map((character) => character.charCodeAt(0)));
    directory.push(
      ...bytes([
        [4, 0],
        [4, offset],
        [4, table.length],
      ]),
    );
    const padded = [...table, ...new Array<number>((4 - (table.length % 4)) % 4).fill(0)];
    data.push(...padded);
    offset += padded.length;
  }
  return Uint8Array.from([
    ...bytes([[4, 0x00010000], u16(tables.length), u16(0), u16(0), u16(0)]),
    ...directory,
    ...data,
  ]);
}

describe('readGlyphOutlines on a hand-made font', () => {
  const outlines = readGlyphOutlines(tinyFont());

  it('T-1061: maps code points through cmap format 4, by delta and through the glyph id array', () => {
    expect(outlines.unitsPerEm).toBe(1000);
    expect(outlines.glyphOf(0x41)?.advance).toBe(600);
    expect(outlines.glyphOf(0x44)).toEqual(outlines.glyphOf(0x42));
    expect(outlines.glyphOf(0x40)).toBeNull();
    expect(outlines.glyphOf(0x1f600)).toBeNull();
    // Past the last long metric, glyphs take its advance.
    expect(outlines.glyphOf(0x43)?.advance).toBe(600);
    expect(outlines.notdef).toEqual({ advance: 500, commands: [] });
  });

  it('T-1062: starts a contour of only off-curve points at the middle of the first two', () => {
    expect(outlines.glyphOf(0x41)?.commands).toEqual([
      { kind: 'move', x: 50, y: 0 },
      { kind: 'quad', cx: 100, cy: 0, x: 100, y: 50 },
      { kind: 'quad', cx: 100, cy: 100, x: 50, y: 100 },
      { kind: 'quad', cx: 0, cy: 100, x: 0, y: 50 },
      { kind: 'quad', cx: 0, cy: 0, x: 50, y: 0 },
      { kind: 'close' },
    ]);
  });

  it('T-1063: reads short coordinates and a repeated x as lines', () => {
    expect(outlines.glyphOf(0x42)?.commands).toEqual([
      { kind: 'move', x: 10, y: 5 },
      { kind: 'line', x: 50, y: 55 },
      { kind: 'line', x: 50, y: 35 },
      { kind: 'line', x: 10, y: 5 },
      { kind: 'close' },
    ]);
  });

  it('T-1064: puts composite glyphs together with their offsets and transforms', () => {
    const commands = outlines.glyphOf(0x43)?.commands ?? [];
    expect(commands.filter((command) => command.kind === 'move')).toEqual([
      // Glyph 2 scaled by -2 (F2Dot14 0x8000) and moved by (300, -20).
      { kind: 'move', x: 280, y: -30 },
      // Glyph 1 scaled by (1, 0.5) and moved by (7, -7).
      { kind: 'move', x: 57, y: -7 },
      // Glyph 2 with x and y swapped by the 2x2, not moved (point-matching args).
      { kind: 'move', x: 5, y: 10 },
    ]);
  });

  it('T-1065: prefers a cmap format 12 subtable, which reaches past the BMP', () => {
    const wide = readGlyphOutlines(tinyFont(true));
    expect(wide.glyphOf(0x1f600)).toEqual(outlines.glyphOf(0x42));
    expect(wide.glyphOf(0x43)).toEqual(outlines.glyphOf(0x43));
    expect(wide.glyphOf(0x44)).toBeNull();
    expect(wide.glyphOf(0x20)).toBeNull();
  });
});
