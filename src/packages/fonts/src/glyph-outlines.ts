// The glyph outlines of a TrueType font (R-FMT-10, R-EXP-03): text saved as paths and text in
// PDF use the bundled font's own outlines, so every viewer shows the same glyphs as the editor.
// A small reader of the tables it needs (cmap, head, hhea, hmtx, maxp, loca, glyf). Pure and
// deterministic: the same font gives the same numbers.
import { readSfnt } from './sfnt';

/**
 * One step of a glyph outline, in font units with y up (the TrueType coordinate system).
 * Every contour starts with `move` and ends with `close`.
 */
export type GlyphCommand =
  | { readonly kind: 'move'; readonly x: number; readonly y: number }
  | { readonly kind: 'line'; readonly x: number; readonly y: number }
  | {
      readonly kind: 'quad';
      readonly cx: number;
      readonly cy: number;
      readonly x: number;
      readonly y: number;
    }
  | { readonly kind: 'close' };

/** A glyph: its advance width and outline, in font units. A space has no commands. */
export type Glyph = {
  readonly advance: number;
  readonly commands: ReadonlyArray<GlyphCommand>;
};

/** The outlines of one font, read on demand and kept. */
export type GlyphOutlines = {
  readonly unitsPerEm: number;
  /** The glyph of a code point, or `null` if the font has none (the drawing falls back). */
  readonly glyphOf: (codePoint: number) => Glyph | null;
  /** The `.notdef` glyph (glyph 0): what a missing character looks like. */
  readonly notdef: Glyph;
};

/** Reads the outlines of a TrueType (`glyf`) font. Throws if a table it needs is missing. */
export function readGlyphOutlines(ttf: Uint8Array): GlyphOutlines {
  const { tables } = readSfnt(ttf);
  const table = (tag: string): DataView => {
    const found = tables.find((candidate) => candidate.tag === tag);
    if (found === undefined) {
      throw new Error(`The font has no ${tag} table`);
    }
    return new DataView(found.data.buffer, found.data.byteOffset, found.data.byteLength);
  };
  const head = table('head');
  const unitsPerEm = head.getUint16(18);
  const isLongLoca = head.getInt16(50) === 1;
  const numGlyphs = table('maxp').getUint16(4);
  const numberOfHMetrics = table('hhea').getUint16(34);
  const hmtx = table('hmtx');
  const loca = table('loca');
  const glyf = table('glyf');
  const cmap = readCmap(table('cmap'));

  const advanceOf = (glyphId: number): number =>
    hmtx.getUint16(Math.min(glyphId, numberOfHMetrics - 1) * 4);
  const rangeOf = (glyphId: number): readonly [number, number] =>
    isLongLoca
      ? [loca.getUint32(glyphId * 4), loca.getUint32(glyphId * 4 + 4)]
      : [loca.getUint16(glyphId * 2) * 2, loca.getUint16(glyphId * 2 + 2) * 2];

  const points = (glyphId: number, depth: number): ReadonlyArray<Contour> => {
    if (glyphId >= numGlyphs || depth > 8) {
      return [];
    }
    const [start, end] = rangeOf(glyphId);
    if (end <= start) {
      return [];
    }
    const view = new DataView(glyf.buffer, glyf.byteOffset + start, end - start);
    const contourCount = view.getInt16(0);
    return contourCount >= 0
      ? simpleContours(view, contourCount)
      : compositeContours(view, (child) => points(child, depth + 1));
  };

  const cache = new Map<number, Glyph>();
  const glyphById = (glyphId: number): Glyph => {
    let glyph = cache.get(glyphId);
    if (glyph === undefined) {
      glyph = { advance: advanceOf(glyphId), commands: points(glyphId, 0).flatMap(contourPath) };
      cache.set(glyphId, glyph);
    }
    return glyph;
  };

  return {
    unitsPerEm,
    glyphOf: (codePoint) => {
      const glyphId = cmap(codePoint);
      return glyphId === 0 ? null : glyphById(glyphId);
    },
    notdef: glyphById(0),
  };
}

type OutlinePoint = { readonly x: number; readonly y: number; readonly isOnCurve: boolean };
type Contour = ReadonlyArray<OutlinePoint>;

// Simple glyph flags (OpenType glyf).
const ON_CURVE = 0x01;
const X_SHORT = 0x02;
const Y_SHORT = 0x04;
const REPEAT = 0x08;
const X_SAME_OR_POSITIVE = 0x10;
const Y_SAME_OR_POSITIVE = 0x20;

function simpleContours(view: DataView, contourCount: number): ReadonlyArray<Contour> {
  const ends: number[] = [];
  for (let index = 0; index < contourCount; index += 1) {
    ends.push(view.getUint16(10 + index * 2));
  }
  const pointCount = (ends.at(-1) ?? -1) + 1;
  let at = 10 + contourCount * 2;
  at += 2 + view.getUint16(at);
  const flags: number[] = [];
  while (flags.length < pointCount) {
    const flag = view.getUint8(at);
    at += 1;
    flags.push(flag);
    if ((flag & REPEAT) !== 0) {
      const repeat = view.getUint8(at);
      at += 1;
      for (let index = 0; index < repeat; index += 1) {
        flags.push(flag);
      }
    }
  }
  const readAxis = (short: number, same: number): number[] => {
    const values: number[] = [];
    let value = 0;
    for (const flag of flags.slice(0, pointCount)) {
      if ((flag & short) !== 0) {
        const delta = view.getUint8(at);
        at += 1;
        value += (flag & same) !== 0 ? delta : -delta;
      } else if ((flag & same) === 0) {
        value += view.getInt16(at);
        at += 2;
      }
      values.push(value);
    }
    return values;
  };
  const xs = readAxis(X_SHORT, X_SAME_OR_POSITIVE);
  const ys = readAxis(Y_SHORT, Y_SAME_OR_POSITIVE);
  const contours: Contour[] = [];
  let first = 0;
  for (const last of ends) {
    const contour: OutlinePoint[] = [];
    for (let index = first; index <= last; index += 1) {
      contour.push({
        x: xs[index] ?? 0,
        y: ys[index] ?? 0,
        isOnCurve: ((flags[index] ?? 0) & ON_CURVE) !== 0,
      });
    }
    contours.push(contour);
    first = last + 1;
  }
  return contours;
}

// Composite glyph flags (OpenType glyf).
const ARGS_ARE_WORDS = 0x0001;
const ARGS_ARE_XY = 0x0002;
const HAS_SCALE = 0x0008;
const MORE_COMPONENTS = 0x0020;
const HAS_XY_SCALE = 0x0040;
const HAS_TWO_BY_TWO = 0x0080;

function compositeContours(
  view: DataView,
  child: (glyphId: number) => ReadonlyArray<Contour>,
): ReadonlyArray<Contour> {
  const contours: Contour[] = [];
  let at = 10;
  for (;;) {
    const flags = view.getUint16(at);
    const glyphId = view.getUint16(at + 2);
    at += 4;
    let dx: number;
    let dy: number;
    if ((flags & ARGS_ARE_WORDS) !== 0) {
      dx = view.getInt16(at);
      dy = view.getInt16(at + 2);
      at += 4;
    } else {
      dx = view.getInt8(at);
      dy = view.getInt8(at + 1);
      at += 2;
    }
    let [a, b, c, d] = [1, 0, 0, 1];
    const f2dot14 = (offset: number): number => view.getInt16(offset) / 16384;
    if ((flags & HAS_SCALE) !== 0) {
      a = d = f2dot14(at);
      at += 2;
    } else if ((flags & HAS_XY_SCALE) !== 0) {
      a = f2dot14(at);
      d = f2dot14(at + 2);
      at += 4;
    } else if ((flags & HAS_TWO_BY_TWO) !== 0) {
      [a, b, c, d] = [f2dot14(at), f2dot14(at + 2), f2dot14(at + 4), f2dot14(at + 6)];
      at += 8;
    }
    // Point-matching anchors (args are point numbers) are not used by the bundled font.
    const [offsetX, offsetY] = (flags & ARGS_ARE_XY) !== 0 ? [dx, dy] : [0, 0];
    for (const contour of child(glyphId)) {
      contours.push(
        contour.map((point) => ({
          x: a * point.x + c * point.y + offsetX,
          y: b * point.x + d * point.y + offsetY,
          isOnCurve: point.isOnCurve,
        })),
      );
    }
    if ((flags & MORE_COMPONENTS) === 0) {
      return contours;
    }
  }
}

/** Turns TrueType points into path commands: two off-curve points imply an on-curve midpoint. */
function contourPath(contour: Contour): ReadonlyArray<GlyphCommand> {
  const count = contour.length;
  const firstOn = contour.findIndex((point) => point.isOnCurve);
  if (count === 0) {
    return [];
  }
  const at = (index: number): OutlinePoint =>
    contour[((index % count) + count) % count] ?? { x: 0, y: 0, isOnCurve: true };
  const mid = (p: OutlinePoint, q: OutlinePoint): OutlinePoint => ({
    x: (p.x + q.x) / 2,
    y: (p.y + q.y) / 2,
    isOnCurve: true,
  });
  // Start on an on-curve point, or on the midpoint of the first two when all are off-curve.
  const start = firstOn === -1 ? mid(at(0), at(1)) : at(firstOn);
  const from = firstOn === -1 ? 1 : firstOn + 1;
  const commands: GlyphCommand[] = [{ kind: 'move', x: start.x, y: start.y }];
  let control: OutlinePoint | null = null;
  // The points after the start, round to the start itself (or, all off-curve, to point 0).
  for (let step = 0; step < count; step += 1) {
    const point = at(from + step);
    if (point.isOnCurve) {
      commands.push(
        control === null
          ? { kind: 'line', x: point.x, y: point.y }
          : { kind: 'quad', cx: control.x, cy: control.y, x: point.x, y: point.y },
      );
      control = null;
    } else {
      if (control !== null) {
        const implied = mid(control, point);
        commands.push({ kind: 'quad', cx: control.x, cy: control.y, x: implied.x, y: implied.y });
      }
      control = point;
    }
  }
  if (control !== null) {
    commands.push({ kind: 'quad', cx: control.x, cy: control.y, x: start.x, y: start.y });
  }
  commands.push({ kind: 'close' });
  return commands;
}

/** Reads a Unicode cmap subtable (format 12, or 4 for the BMP) into a lookup function. */
function readCmap(view: DataView): (codePoint: number) => number {
  const count = view.getUint16(2);
  let best: { readonly offset: number; readonly format: number } | null = null;
  for (let index = 0; index < count; index += 1) {
    const platform = view.getUint16(4 + index * 8);
    const encoding = view.getUint16(6 + index * 8);
    const offset = view.getUint32(8 + index * 8);
    const format = view.getUint16(offset);
    const isUnicode = platform === 0 || (platform === 3 && (encoding === 1 || encoding === 10));
    if (isUnicode && (format === 12 || (format === 4 && best === null))) {
      best = { offset, format };
    }
  }
  if (best === null) {
    throw new Error('The font has no Unicode cmap (format 4 or 12)');
  }
  return best.format === 12 ? cmapFormat12(view, best.offset) : cmapFormat4(view, best.offset);
}

function cmapFormat12(view: DataView, offset: number): (codePoint: number) => number {
  const groups = view.getUint32(offset + 12);
  return (codePoint) => {
    let low = 0;
    let high = groups - 1;
    while (low <= high) {
      const middle = (low + high) >>> 1;
      const at = offset + 16 + middle * 12;
      const start = view.getUint32(at);
      const end = view.getUint32(at + 4);
      if (codePoint < start) {
        high = middle - 1;
      } else if (codePoint > end) {
        low = middle + 1;
      } else {
        return view.getUint32(at + 8) + codePoint - start;
      }
    }
    return 0;
  };
}

function cmapFormat4(view: DataView, offset: number): (codePoint: number) => number {
  const segments = view.getUint16(offset + 6) / 2;
  const ends = offset + 14;
  const starts = ends + segments * 2 + 2;
  const deltas = starts + segments * 2;
  const rangeOffsets = deltas + segments * 2;
  return (codePoint) => {
    if (codePoint > 0xffff) {
      return 0;
    }
    for (let segment = 0; segment < segments; segment += 1) {
      if (codePoint > view.getUint16(ends + segment * 2)) {
        continue;
      }
      const start = view.getUint16(starts + segment * 2);
      if (codePoint < start) {
        return 0;
      }
      const delta = view.getInt16(deltas + segment * 2);
      const rangeAt = rangeOffsets + segment * 2;
      const rangeOffset = view.getUint16(rangeAt);
      if (rangeOffset === 0) {
        return (codePoint + delta) & 0xffff;
      }
      const glyphId = view.getUint16(rangeAt + rangeOffset + (codePoint - start) * 2);
      return glyphId === 0 ? 0 : (glyphId + delta) & 0xffff;
    }
    return 0;
  };
}
