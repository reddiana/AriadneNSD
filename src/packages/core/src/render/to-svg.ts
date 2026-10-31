// The SVG backend (ADR-0030): scene → SVG text. It makes no decisions about color or shape.
// The screen and the saved file use this same output (ADR-0018).
import type { Point, Scene, SceneElement, TextRun } from './scene';

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

/**
 * Writes a scene as SVG. Deterministic: the same scene gives the same text (R-FMT-03).
 * The whole drawing is shifted by half a pixel so 1px lines on whole coordinates fill one pixel
 * row (visual design 9.1).
 */
export function toSvg(scene: Scene): RenderedSvg {
  const lines: string[] = [
    `<g class="ans-render" transform="translate(.5 .5)" font-family="${escapeAttribute(scene.fontFamily)}" style="font-kerning:none">`,
  ];
  for (const element of scene.elements) {
    lines.push(elementToSvg(element));
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

function textToSvg(element: Extract<SceneElement, { kind: 'text' }>): string {
  const anchor = element.anchor === 'start' ? '' : ` text-anchor="${element.anchor}"`;
  const halo =
    element.halo === null
      ? ''
      : ` stroke="${element.halo.color}" stroke-width="${formatNumber(2 * element.halo.width)}"` +
        ' stroke-linejoin="round" paint-order="stroke"';
  return (
    `<text x="${formatNumber(element.x)}" y="${formatNumber(element.y)}"${anchor}` +
    ` font-size="${formatNumber(element.fontSize)}" fill="${element.fill}"${halo}` +
    ` xml:space="preserve">${element.runs.map(runToSvg).join('')}</text>`
  );
}

function runToSvg(run: TextRun): string {
  const text = escapeText(run.text);
  return run.weight === 400 ? text : `<tspan font-weight="${String(run.weight)}">${text}</tspan>`;
}

function pathData(points: ReadonlyArray<Point>): string {
  return points
    .map(([x, y], index) => `${index === 0 ? 'M' : 'L'}${formatNumber(x)} ${formatNumber(y)}`)
    .join(' ');
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
