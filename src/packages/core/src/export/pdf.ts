// PDF export (R-EXP-03): the scene written as a vector PDF, one page per print page. Text is drawn
// with the bundled font's glyph outlines, the same shapes as text as outlines (R-FMT-10), so the
// PDF needs no embedded font. Deterministic: no dates, the same input gives the same bytes.
import type { Glyph, GlyphCommand, GlyphOutlines } from '@ariadne-nsd/fonts';
import { zlibCompress } from '@ariadne-nsd/fonts';

import { placeGlyphs, syntheticBoldWidth } from '../render/outline-text';
import type { PlacedGlyph, TextElement } from '../render/outline-text';
import type { PathSegment, Point, Scene, SceneElement } from '../render/scene';
import type { Pagination } from './paginate';

/** What the PDF says about itself. */
export type PdfInfo = {
  /** The document's name, for the PDF viewer's title bar. */
  readonly title: string;
  /**
   * Compress the streams (the default). Off writes a PDF of plain text, which a test can read
   * and a golden file can show line by line.
   */
  readonly isCompressed?: boolean;
};

/** The page number's size and color (visual design: the smallest print text, muted). */
const pageNumberSize = 9;
const pageNumberColor = '#5a6476';

/**
 * Writes a PDF of `scene` cut into `pagination`'s pages. Pages are numbered "n / N" in the
 * bottom margin when there is more than one.
 */
export function writePdf(
  scene: Scene,
  pagination: Pagination,
  outlines: GlyphOutlines,
  info: PdfInfo,
): Uint8Array<ArrayBuffer> {
  const forms = new GlyphForms(outlines);
  const total = pagination.pages.length;
  const contents = pagination.pages.map((page) => {
    const out: string[] = [];
    const { margin, pageHeight, pointsPerPixel: scale } = pagination;
    out.push('q');
    // From here on: drawing px, y down, the page's part of the drawing at the top left.
    out.push(`1 0 0 -1 ${num(margin)} ${num(pageHeight - margin)} cm`);
    out.push(`${num(scale)} 0 0 ${num(scale)} 0 0 cm`);
    out.push(`1 0 0 1 ${num(-page.x)} ${num(-page.y)} cm`);
    // One px more on the right and bottom: the line on a cut is drawn on both pages.
    const area = `${num(page.x)} ${num(page.y)} ${num(page.width + 1)} ${num(page.height + 1)} re`;
    out.push(`${area} W n`, color(scene.paper, 'rg'), `${area} f`);
    // The same half-pixel shift as the SVG (visual design 9.1).
    out.push('1 0 0 1 0.5 0.5 cm');
    for (const element of scene.elements) {
      if (overlaps(bounds(element, forms), page)) {
        out.push(...elementOps(element, forms));
      }
    }
    out.push('Q');
    if (total > 1) {
      out.push(...pageNumberOps(`${String(page.number)} / ${String(total)}`, pagination, forms));
    }
    return out.filter((line) => line !== '').join('\n');
  });
  return assemble(contents, forms, pagination, info);
}

type Bounds = {
  readonly x0: number;
  readonly y0: number;
  readonly x1: number;
  readonly y1: number;
};

/** Roughly where an element draws, to leave out what another page shows. */
function bounds(element: SceneElement, forms: GlyphForms): Bounds {
  const of = (points: ReadonlyArray<Point>, pad: number): Bounds => ({
    x0: Math.min(...points.map(([x]) => x)) - pad,
    y0: Math.min(...points.map(([, y]) => y)) - pad,
    x1: Math.max(...points.map(([x]) => x)) + pad,
    y1: Math.max(...points.map(([, y]) => y)) + pad,
  });
  switch (element.kind) {
    case 'rect':
      return of(
        [
          [element.x, element.y],
          [element.x + element.width, element.y + element.height],
        ],
        element.strokeWidth,
      );
    case 'polyline':
      return of(element.points, element.strokeWidth);
    case 'path':
      return of(
        element.segments.flatMap((segment) =>
          segment.kind === 'curve' ? [segment.c1, segment.c2, segment.to] : [segment.to],
        ),
        element.strokeWidth,
      );
    case 'circle':
      return of(
        [
          [element.cx - element.r, element.cy - element.r],
          [element.cx + element.r, element.cy + element.r],
        ],
        element.strokeWidth,
      );
    case 'text': {
      const glyphs = placeGlyphs(element, forms.outlines, forms.missing) ?? [];
      const last = glyphs.at(-1);
      const x0 = glyphs[0]?.x ?? element.x;
      const x1 = last === undefined ? element.x : last.x + last.glyph.advance * last.scale;
      return {
        x0: x0 - element.fontSize,
        y0: element.y - 2 * element.fontSize,
        x1: x1 + element.fontSize,
        y1: element.y + element.fontSize,
      };
    }
  }
}

function overlaps(box: Bounds, page: Pagination['pages'][number]): boolean {
  return (
    box.x1 >= page.x - 1 &&
    box.x0 <= page.x + page.width + 1 &&
    box.y1 >= page.y - 1 &&
    box.y0 <= page.y + page.height + 1
  );
}

function elementOps(element: SceneElement, forms: GlyphForms): ReadonlyArray<string> {
  switch (element.kind) {
    case 'rect':
      return paint(
        `${num(element.x)} ${num(element.y)} ${num(element.width)} ${num(element.height)} re`,
        element.fill,
        element.stroke,
        element.strokeWidth,
      );
    case 'polyline': {
      const [first, ...rest] = element.points;
      if (first === undefined) {
        return [];
      }
      return [
        'q',
        element.dash === null ? '' : `[${num(element.dash[0])} ${num(element.dash[1])}] 0 d`,
        element.isRoundCap ? '1 J' : '',
        ...paint(
          [`${point(first)} m`, ...rest.map((at) => `${point(at)} l`)].join(' '),
          'none',
          element.stroke,
          element.strokeWidth,
        ),
        'Q',
      ];
    }
    case 'path':
      return paint(
        `${element.segments.map(segmentOp).join(' ')} h`,
        element.fill,
        element.stroke,
        element.strokeWidth,
      );
    case 'circle':
      return paint(
        circlePath(element.cx, element.cy, element.r),
        'none',
        element.stroke,
        element.strokeWidth,
      );
    case 'text':
      return textOps(element, forms);
  }
}

/** Fills and strokes a path, skipping a paint that is `none`. */
function paint(path: string, fill: string, stroke: string, width: number): ReadonlyArray<string> {
  const isFilled = parseColor(fill) !== null;
  const isStroked = parseColor(stroke) !== null && width > 0;
  if (!isFilled && !isStroked) {
    return [];
  }
  const operator = isFilled && isStroked ? 'B' : isFilled ? 'f' : 'S';
  return [
    isFilled ? color(fill, 'rg') : '',
    isStroked ? `${color(stroke, 'RG')} ${num(width)} w` : '',
    `${path} ${operator}`,
  ];
}

function segmentOp(segment: PathSegment): string {
  switch (segment.kind) {
    case 'move':
      return `${point(segment.to)} m`;
    case 'line':
      return `${point(segment.to)} l`;
    case 'curve':
      return `${point(segment.c1)} ${point(segment.c2)} ${point(segment.to)} c`;
  }
}

/** A circle as four cubic curves. */
function circlePath(cx: number, cy: number, r: number): string {
  const k = 0.5522847498 * r;
  return [
    `${num(cx + r)} ${num(cy)} m`,
    `${num(cx + r)} ${num(cy + k)} ${num(cx + k)} ${num(cy + r)} ${num(cx)} ${num(cy + r)} c`,
    `${num(cx - k)} ${num(cy + r)} ${num(cx - r)} ${num(cy + k)} ${num(cx - r)} ${num(cy)} c`,
    `${num(cx - r)} ${num(cy - k)} ${num(cx - k)} ${num(cy - r)} ${num(cx)} ${num(cy - r)} c`,
    `${num(cx + k)} ${num(cy - r)} ${num(cx + r)} ${num(cy - k)} ${num(cx + r)} ${num(cy)} c`,
    'h',
  ].join(' ');
}

/** Text: the halo stroked under the glyphs (UX BH1), then the glyphs; bold as synthetic bold. */
function textOps(element: TextElement, forms: GlyphForms): ReadonlyArray<string> {
  const glyphs = placeGlyphs(element, forms.outlines, forms.missing) ?? [];
  const boldWidth = syntheticBoldWidth(element.fontSize);
  const out: string[] = [];
  const draw = (
    glyph: PlacedGlyph,
    mode: 'fill' | 'stroke' | 'both',
    strokeWidth: number,
  ): string => {
    const name = forms.use(glyph.glyph, mode);
    if (name === null) {
      return '';
    }
    // Glyphs are y up; the page is y down here. Line widths are in glyph units inside the form.
    const width = mode === 'fill' ? '' : `${num(strokeWidth / glyph.scale)} w `;
    return `q ${num(glyph.scale)} 0 0 ${num(-glyph.scale)} ${num(glyph.x)} ${num(glyph.y)} cm ${width}/${name} Do Q`;
  };
  if (element.halo !== null) {
    const { halo } = element;
    out.push(`q ${color(halo.color, 'RG')} 1 j`);
    for (const glyph of glyphs) {
      out.push(draw(glyph, 'stroke', 2 * halo.width + (glyph.weight === 400 ? 0 : boldWidth)));
    }
    out.push('Q');
  }
  out.push(`q ${color(element.fill, 'rg')} ${color(element.fill, 'RG')} 1 j`);
  for (const glyph of glyphs) {
    out.push(glyph.weight === 400 ? draw(glyph, 'fill', 0) : draw(glyph, 'both', boldWidth));
  }
  out.push('Q');
  return out;
}

function pageNumberOps(
  text: string,
  pagination: Pagination,
  forms: GlyphForms,
): ReadonlyArray<string> {
  const { outlines } = forms;
  const scale = pageNumberSize / outlines.unitsPerEm;
  const glyphs = Array.from(
    text,
    (character) => outlines.glyphOf(character.codePointAt(0) ?? 0) ?? forms.missing,
  );
  const width = glyphs.reduce((sum, glyph) => sum + glyph.advance, 0) * scale;
  // PDF space (y up): centered, in the middle of the bottom margin.
  let x = (pagination.pageWidth - width) / 2;
  const y = pagination.margin / 2 - pageNumberSize / 3;
  const out = [`q ${color(pageNumberColor, 'rg')}`];
  for (const glyph of glyphs) {
    const name = forms.use(glyph, 'fill');
    if (name !== null) {
      out.push(`q ${num(scale)} 0 0 ${num(scale)} ${num(x)} ${num(y)} cm /${name} Do Q`);
    }
    x += glyph.advance * scale;
  }
  out.push('Q');
  return out;
}

/**
 * Each glyph is written once, as a form XObject, and drawn where it is used. One form per glyph
 * and paint mode: filled, stroked (the halo), or both (synthetic bold).
 */
class GlyphForms {
  readonly outlines: GlyphOutlines;
  /** A character the font lacks: a hollow box of the full width (02-layout 2.1). */
  readonly missing: Glyph;
  readonly forms: { readonly name: string; readonly body: string }[] = [];
  private readonly names = new Map<Glyph, Map<string, string>>();

  constructor(outlines: GlyphOutlines) {
    this.outlines = outlines;
    this.missing = missingGlyph(outlines.unitsPerEm);
  }

  /** The form's resource name, or `null` for a glyph with no outline (a space). */
  use(glyph: Glyph, mode: 'fill' | 'stroke' | 'both'): string | null {
    if (glyph.commands.length === 0) {
      return null;
    }
    let byMode = this.names.get(glyph);
    if (byMode === undefined) {
      byMode = new Map();
      this.names.set(glyph, byMode);
    }
    let name = byMode.get(mode);
    if (name === undefined) {
      name = `G${String(this.forms.length + 1)}`;
      const operator = mode === 'fill' ? 'f' : mode === 'stroke' ? 'S' : 'B';
      this.forms.push({ name, body: `${glyphPath(glyph.commands)} ${operator}` });
      byMode.set(mode, name);
    }
    return name;
  }
}

function missingGlyph(unitsPerEm: number): Glyph {
  const box = (
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    isClockwise: boolean,
  ): GlyphCommand[] => {
    const corners: [number, number][] = isClockwise
      ? [
          [x0, y0],
          [x0, y1],
          [x1, y1],
          [x1, y0],
        ]
      : [
          [x0, y0],
          [x1, y0],
          [x1, y1],
          [x0, y1],
        ];
    const [[sx, sy], ...rest] = corners as [[number, number], ...[number, number][]];
    return [
      { kind: 'move', x: sx, y: sy },
      ...rest.map(([x, y]) => ({ kind: 'line' as const, x, y })),
      { kind: 'close' },
    ];
  };
  const u = unitsPerEm / 1000;
  return {
    advance: unitsPerEm,
    commands: [
      ...box(100 * u, -100 * u, 900 * u, 800 * u, false),
      ...box(160 * u, -40 * u, 840 * u, 740 * u, true),
    ],
  };
}

/** A glyph outline in PDF path operators; quadratic curves become cubic ones. */
function glyphPath(commands: ReadonlyArray<GlyphCommand>): string {
  const parts: string[] = [];
  let [x0, y0] = [0, 0];
  for (const command of commands) {
    switch (command.kind) {
      case 'move':
        parts.push(`${num(command.x)} ${num(command.y)} m`);
        [x0, y0] = [command.x, command.y];
        break;
      case 'line':
        parts.push(`${num(command.x)} ${num(command.y)} l`);
        [x0, y0] = [command.x, command.y];
        break;
      case 'quad': {
        const c1x = x0 + ((command.cx - x0) * 2) / 3;
        const c1y = y0 + ((command.cy - y0) * 2) / 3;
        const c2x = command.x + ((command.cx - command.x) * 2) / 3;
        const c2y = command.y + ((command.cy - command.y) * 2) / 3;
        parts.push(
          `${num(c1x)} ${num(c1y)} ${num(c2x)} ${num(c2y)} ${num(command.x)} ${num(command.y)} c`,
        );
        [x0, y0] = [command.x, command.y];
        break;
      }
      case 'close':
        parts.push('h');
        break;
    }
  }
  return parts.join(' ');
}

/** Writes the PDF file: catalog, pages, shared resources, glyph forms, page contents, xref. */
function assemble(
  contents: ReadonlyArray<string>,
  forms: GlyphForms,
  pagination: Pagination,
  info: PdfInfo,
): Uint8Array<ArrayBuffer> {
  // An object is its dictionary and, for a stream, its compressed bytes.
  const objects: { dictionary: string; stream?: Uint8Array }[] = [];
  const add = (dictionary: string, data?: string): number => {
    if (data === undefined) {
      objects.push({ dictionary });
    } else {
      const isCompressed = info.isCompressed ?? true;
      const stream = isCompressed ? zlibCompress(asciiBytes(data)) : asciiBytes(data);
      const length = `${isCompressed ? '/Filter /FlateDecode ' : ''}/Length ${String(stream.length)}`;
      objects.push({ dictionary: dictionary.replace(/ >>$/, ` ${length} >>`), stream });
    }
    return objects.length;
  };
  const catalog = add('');
  const pages = add('');
  const infoObject = add(
    `<< /Title ${utf16Hex(info.title)} /Producer ${utf16Hex('AriadneNSD')} >>`,
  );
  const formIds = forms.forms.map(({ body }) =>
    add('<< /Type /XObject /Subtype /Form /BBox [-2000 -2000 4000 4000] /Resources << >> >>', body),
  );
  const xObjects = forms.forms
    .map(({ name }, index) => `/${name} ${String(formIds[index] ?? 0)} 0 R`)
    .join(' ');
  const resources = add(`<< /XObject << ${xObjects} >> >>`);
  const mediaBox = `[0 0 ${num(pagination.pageWidth)} ${num(pagination.pageHeight)}]`;
  const pageIds = contents.map((content) => {
    const stream = add('<< >>', content);
    return add(
      `<< /Type /Page /Parent ${String(pages)} 0 R /MediaBox ${mediaBox} /Resources ${String(resources)} 0 R /Contents ${String(stream)} 0 R >>`,
    );
  });
  objects[catalog - 1] = { dictionary: `<< /Type /Catalog /Pages ${String(pages)} 0 R >>` };
  objects[pages - 1] = {
    dictionary: `<< /Type /Pages /Kids [${pageIds.map((id) => `${String(id)} 0 R`).join(' ')}] /Count ${String(pageIds.length)} >>`,
  };

  const chunks: Uint8Array[] = [];
  let length = 0;
  const write = (bytes: Uint8Array): void => {
    chunks.push(bytes);
    length += bytes.length;
  };
  // A comment of high bytes after the header marks the file as binary (PDF 7.5.2).
  // A plain text PDF has no binary data and goes without it.
  write(
    info.isCompressed === false
      ? asciiBytes('%PDF-1.4\n')
      : Uint8Array.from([...asciiBytes('%PDF-1.4\n%'), 0xe2, 0xe3, 0xcf, 0xd3, 0x0a]),
  );
  const offsets: number[] = [];
  objects.forEach(({ dictionary, stream }, index) => {
    offsets.push(length);
    write(asciiBytes(`${String(index + 1)} 0 obj\n${dictionary}\n`));
    if (stream !== undefined) {
      write(asciiBytes('stream\n'));
      write(stream);
      write(asciiBytes('\nendstream\n'));
    }
    write(asciiBytes('endobj\n'));
  });
  const xref = length;
  const table = offsets.map((offset) => `${String(offset).padStart(10, '0')} 00000 n \n`).join('');
  write(
    asciiBytes(
      `xref\n0 ${String(objects.length + 1)}\n0000000000 65535 f \n${table}` +
        `trailer\n<< /Size ${String(objects.length + 1)} /Root ${String(catalog)} 0 R /Info ${String(infoObject)} 0 R >>\n` +
        `startxref\n${String(xref)}\n%%EOF\n`,
    ),
  );
  const bytes = new Uint8Array(length);
  let at = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, at);
    at += chunk.length;
  }
  return bytes;
}

/** The bytes of an ASCII text (everything the writer makes is ASCII). */
function asciiBytes(text: string): Uint8Array {
  const bytes = new Uint8Array(text.length);
  for (let index = 0; index < text.length; index += 1) {
    bytes[index] = text.charCodeAt(index);
  }
  return bytes;
}

/** A PDF text string in UTF-16BE hex with a byte order mark: any language, ASCII bytes. */
function utf16Hex(text: string): string {
  let hex = 'FEFF';
  for (let index = 0; index < text.length; index += 1) {
    hex += text.charCodeAt(index).toString(16).toUpperCase().padStart(4, '0');
  }
  return `<${hex}>`;
}

function point([x, y]: Point): string {
  return `${num(x)} ${num(y)}`;
}

/** A PDF number: at most three decimals, no exponent, never `-0`. */
function num(value: number): string {
  const rounded = Math.round(value * 1000) / 1000;
  return Object.is(rounded, -0) ? '0' : String(rounded);
}

/** `#rgb` or `#rrggbb` as 0–1 channels; `null` for anything else (`none`). */
function parseColor(value: string): readonly [number, number, number] | null {
  const short = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/i.exec(value);
  const long = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(value);
  const parts = long?.slice(1) ?? short?.slice(1).map((digit) => digit + digit);
  if (parts === undefined) {
    return null;
  }
  const [r = 0, g = 0, b = 0] = parts.map((part) => parseInt(part, 16) / 255);
  return [r, g, b];
}

function color(value: string, operator: 'rg' | 'RG'): string {
  const rgb = parseColor(value);
  return rgb === null ? '' : `${rgb.map(num).join(' ')} ${operator}`;
}
