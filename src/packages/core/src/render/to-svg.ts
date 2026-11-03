// The SVG backend (ADR-0030): scene → SVG text. It makes no decisions about color or shape.
// The screen and the saved file use this same output (ADR-0018).
import type { GlyphOutlines } from '@ariadne-nsd/fonts';

import type { PlacedGlyph, TextElement } from './outline-text';
import { glyphPathData, placeGlyphs, syntheticBoldWidth } from './outline-text';
import type { PathSegment, Point, Scene, SceneElement, TextRun } from './scene';

/** The drawing part of an SVG: the `<g class="ans-render">` element and the picture's size. */
export type RenderedSvg = {
  readonly width: number;
  readonly height: number;
  /** `0 0 width height`. */
  readonly viewBox: string;
  /** The paper color, for the paper rectangle that the file assembler puts behind the drawing. */
  readonly paper: string;
  /** The `<g class="ans-render">…</g>` element (01-file-format 2). */
  readonly content: string;
};

/** How to write the SVG. */
export type SvgOptions = {
  /**
   * Text as outlines (R-FMT-10): each text element whose characters are all in these outlines is
   * written as paths. Text with a character the font lacks stays text (a fallback font draws it).
   */
  readonly outlines?: GlyphOutlines;
};

/**
 * Writes a scene as SVG. Deterministic: the same scene gives the same text (R-FMT-03).
 * The whole drawing is shifted by half a pixel so 1px lines on whole coordinates fill one pixel
 * row (visual design 9.1).
 */
export function toSvg(scene: Scene, options: SvgOptions = {}): RenderedSvg {
  const lines: string[] = [
    `<g class="ans-render" transform="translate(.5 .5)" font-family="${escapeAttribute(scene.fontFamily)}" style="font-kerning:none">`,
  ];
  for (const element of scene.elements) {
    const glyphs =
      element.kind === 'text' && options.outlines !== undefined
        ? placeGlyphs(element, options.outlines)
        : null;
    lines.push(
      element.kind === 'text' && glyphs !== null
        ? outlinedTextToSvg(element, glyphs)
        : elementToSvg(element),
    );
  }
  lines.push('</g>');
  return {
    width: scene.width,
    height: scene.height,
    viewBox: `0 0 ${formatNumber(scene.width)} ${formatNumber(scene.height)}`,
    paper: scene.paper,
    content: lines.join('\n'),
  };
}

function elementToSvg(element: SceneElement): string {
  switch (element.kind) {
    case 'rect':
      return (
        `<rect x="${formatNumber(element.x)}" y="${formatNumber(element.y)}"` +
        ` width="${formatNumber(element.width)}" height="${formatNumber(element.height)}"` +
        ` fill="${element.fill}" stroke="${element.stroke}"` +
        ` stroke-width="${formatNumber(element.strokeWidth)}" shape-rendering="crispEdges"/>`
      );
    case 'polyline':
      return (
        `<path d="${pathData(element.points)}" fill="none" stroke="${element.stroke}"` +
        ` stroke-width="${formatNumber(element.strokeWidth)}"` +
        (element.dash === null
          ? ''
          : ` stroke-dasharray="${formatNumber(element.dash[0])} ${formatNumber(element.dash[1])}"`) +
        (element.isRoundCap ? ' stroke-linecap="round"' : '') +
        '/>'
      );
    case 'path':
      return (
        `<path d="${segmentData(element.segments)}" fill="${element.fill}"` +
        ` stroke="${element.stroke}" stroke-width="${formatNumber(element.strokeWidth)}"/>`
      );
    case 'circle':
      return (
        `<circle cx="${formatNumber(element.cx)}" cy="${formatNumber(element.cy)}"` +
        ` r="${formatNumber(element.r)}" fill="none" stroke="${element.stroke}"` +
        ` stroke-width="${formatNumber(element.strokeWidth)}"/>`
      );
    case 'text':
      return textToSvg(element);
  }
}

function textToSvg(element: TextElement): string {
  const anchor = element.anchor === 'start' ? '' : ` text-anchor="${element.anchor}"`;
  const halo =
    element.halo === null
      ? ''
      : ` stroke="${element.halo.color}" stroke-width="${formatNumber(2 * element.halo.width)}"` +
        ' stroke-linejoin="round" paint-order="stroke"';
  return (
    `<text x="${formatNumber(element.x)}" y="${formatNumber(element.y)}"${anchor}` +
    ` font-size="${formatNumber(element.fontSize)}" fill="${element.fill}"${halo}` +
    ` xml:space="preserve">${element.runs.map((run) => runToSvg(run, element.fill)).join('')}</text>`
  );
}

/**
 * A text element as paths (R-FMT-10): its halo first (UX BH1, like `paint-order="stroke"`), then
 * the glyphs. Bold glyphs get a stroke of the text color, as the browser's synthetic bold.
 */
function outlinedTextToSvg(element: TextElement, glyphs: ReadonlyArray<PlacedGlyph>): string {
  const boldWidth = syntheticBoldWidth(element.fontSize);
  const stroked = (d: string, color: string, width: number, fill: string): string =>
    `<path d="${d}" fill="${fill}" stroke="${color}" stroke-width="${formatNumber(width)}"` +
    ' stroke-linejoin="round"/>';
  const paths = (of: ReadonlyArray<PlacedGlyph>) => ({
    regular: glyphPathData(
      of.filter((glyph) => glyph.weight === 400),
      formatNumber,
    ),
    bold: glyphPathData(
      of.filter((glyph) => glyph.weight !== 400),
      formatNumber,
    ),
  });
  const parts: string[] = [];
  if (element.halo !== null) {
    const { regular, bold } = paths(glyphs);
    const haloWidth = 2 * element.halo.width;
    if (regular !== '') {
      parts.push(stroked(regular, element.halo.color, haloWidth, 'none'));
    }
    if (bold !== '') {
      parts.push(stroked(bold, element.halo.color, haloWidth + boldWidth, 'none'));
    }
  }
  // One path per color, in the order the colors first appear (syntax colors, 02-layout 3.1).
  const fills = [...new Set(glyphs.map((glyph) => glyph.fill))];
  for (const fill of fills) {
    const { regular, bold } = paths(glyphs.filter((glyph) => glyph.fill === fill));
    if (regular !== '') {
      parts.push(`<path d="${regular}" fill="${fill}"/>`);
    }
    if (bold !== '') {
      parts.push(stroked(bold, fill, boldWidth, fill));
    }
  }
  return parts.join('\n');
}

function runToSvg(run: TextRun, textFill: string): string {
  const text = escapeText(run.text);
  const weight = run.weight === 400 ? '' : ` font-weight="${String(run.weight)}"`;
  const fill = run.fill === undefined || run.fill === textFill ? '' : ` fill="${run.fill}"`;
  return weight === '' && fill === '' ? text : `<tspan${weight}${fill}>${text}</tspan>`;
}

function pathData(points: ReadonlyArray<Point>): string {
  return points
    .map(([x, y], index) => `${index === 0 ? 'M' : 'L'}${formatNumber(x)} ${formatNumber(y)}`)
    .join(' ');
}

function segmentData(segments: ReadonlyArray<PathSegment>): string {
  const point = ([x, y]: Point): string => `${formatNumber(x)} ${formatNumber(y)}`;
  const parts = segments.map((segment) => {
    switch (segment.kind) {
      case 'move':
        return `M${point(segment.to)}`;
      case 'line':
        return `L${point(segment.to)}`;
      case 'curve':
        return `C${point(segment.c1)} ${point(segment.c2)} ${point(segment.to)}`;
    }
  });
  return `${parts.join(' ')} Z`;
}

/**
 * Formats a coordinate: at most two decimals, no trailing zeros, never `-0`. Two decimals are
 * enough for half pixels and diagonal points, and keep the text stable (R-FMT-03).
 */
export function formatNumber(value: number): string {
  const rounded = Math.round(value * 100) / 100;
  return Object.is(rounded, -0) ? '0' : String(rounded);
}

// Characters XML 1.0 does not allow (C0 controls other than tab, line feed and carriage return).
// eslint-disable-next-line no-control-regex -- matching control characters is the point
const invalidXmlCharacters = /[\u0000-\u0008\u000b\u000c\u000e-\u001f￾￿]/g;

function escapeText(text: string): string {
  return text
    .replace(invalidXmlCharacters, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeAttribute(text: string): string {
  return escapeText(text).replace(/"/g, '&quot;');
}
