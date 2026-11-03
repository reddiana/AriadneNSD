// The saved file: an SVG with the model inside (01-file-format 2). `.ns` and `.ns.svg` are the same.
import type { Doc } from '../model/types';
import { encodeBase64 } from './base64';
import { findModelElement, modelNamespace, svgNamespace } from './model-element';
import type { KeptSettings } from './model-json';
import { currentFormatVersion, serializeModelJson } from './model-json';
import type { OpenResult, ReadOptions } from './parse-model';
import { openFailure, parseModel } from './parse-model';

/**
 * The drawing made by the renderer from the model (the shape of `RenderedSvg` from `toSvg`).
 * Saved as it is shown, without the overlay layer (ADR-0018).
 */
export type Drawing = {
  readonly width: number;
  readonly height: number;
  readonly viewBox: string;
  /** The paper color of the theme (R-FMT-08). Never transparent. */
  readonly paper: string;
  /** The drawing elements: the whole `<g class="ans-render">…</g>` element. */
  readonly content: string;
};

/** A subset font to embed as an `@font-face` data URI (ADR-0026, ADR-0039). */
export type EmbeddedFont = {
  /** The `font-family` name the drawing uses, for example `AriadneNSD Mono`. */
  readonly family: string;
  /** The WOFF bytes. */
  readonly woff: Uint8Array;
};

/** Everything a saved file is made of. */
export type SvgFileParts = {
  readonly doc: Doc;
  /** Setting values from the opened file that the model could not hold (01-file-format 3.3). */
  readonly kept?: KeptSettings;
  readonly drawing: Drawing;
  /** In the order to write them. Usually one: the block font subset. */
  readonly fonts: ReadonlyArray<EmbeddedFont>;
};

/**
 * Assembles the saved SVG file (01-file-format 2): the model in `<metadata>`, the subset fonts in
 * `<style>`, the paper and the drawing. The same parts always give the same text (R-FMT-03).
 */
export function assembleSvgFile(parts: SvgFileParts): string {
  return assemble(parts.drawing, parts.fonts, [
    '  <metadata>',
    `    <ans:document xmlns:ans="${modelNamespace}" version="${String(currentFormatVersion)}"><![CDATA[`,
    escapeCdata(serializeModelJson(parts.doc, parts.kept)),
    '    ]]></ans:document>',
    '  </metadata>',
  ]);
}

/**
 * A picture of a drawing, without the model: the same SVG as a saved file but no `<metadata>`.
 * For images the app shows, such as the examples' thumbnails. It does not open as a document.
 */
export function assembleImageSvg(drawing: Drawing, fonts: ReadonlyArray<EmbeddedFont>): string {
  return assemble(drawing, fonts, []);
}

function assemble(
  drawing: Drawing,
  fonts: ReadonlyArray<EmbeddedFont>,
  metadata: ReadonlyArray<string>,
): string {
  if (!drawing.content.startsWith('<g class="ans-render"')) {
    throw new Error('The drawing must be one <g class="ans-render"> element (01-file-format 2)');
  }
  const lines = [
    `<svg xmlns="${svgNamespace}" version="1.1" width="${size(drawing.width)}" height="${size(drawing.height)}" viewBox="${escapeAttribute(drawing.viewBox)}">`,
    ...metadata,
    '  <style>',
    ...fonts.map(fontFace),
    '  </style>',
    `  <rect width="100%" height="100%" fill="${escapeAttribute(drawing.paper)}"/>`,
    `  ${drawing.content}`,
    '</svg>',
    '',
  ];
  return lines.join('\n');
}

/**
 * Opens a saved file (`.ns` or `.ns.svg`): finds the model element, checks that its `version`
 * attribute matches the JSON, migrates and checks the model (01-file-format 5).
 * The drawing is ignored (R-FMT-05) and never read back into a model (R-FMT-06).
 * `options` as for `parseModel`: the check, and the drawing language of a file without one.
 */
export function openSvgFile(text: string, options: ReadOptions = {}): OpenResult {
  const found = findModelElement(text);
  if (!found.ok) {
    return openFailure(found.reason, found.detail);
  }
  let value: unknown;
  try {
    value = JSON.parse(found.element.text);
  } catch (error) {
    return openFailure('damaged', `model JSON does not parse: ${String(error)}`);
  }
  const jsonVersion =
    typeof value === 'object' && value !== null && 'version' in value ? value.version : undefined;
  if (typeof jsonVersion !== 'number' || found.element.version !== String(jsonVersion)) {
    return openFailure('damaged', 'the version attribute and the JSON version differ');
  }
  return parseModel(value, options);
}

/**
 * Makes JSON text safe inside CDATA. `]]>` splits the section (01-file-format 3.2).
 * U+FFFE and U+FFFF are not allowed in XML; they can only be in JSON strings, so they are
 * written as JSON escapes, which read back as the same string.
 */
function escapeCdata(json: string): string {
  return json
    .replaceAll(']]>', ']]]]><![CDATA[>')
    .replaceAll('\uFFFE', '\\ufffe')
    .replaceAll('\uFFFF', '\\uffff');
}

function fontFace(font: EmbeddedFont): string {
  if (/["\\<>&]/.test(font.family)) {
    throw new Error(`A font family name cannot contain quotes or markup: ${font.family}`);
  }
  return `    @font-face { font-family: "${font.family}"; src: url(data:font/woff;base64,${encodeBase64(font.woff)}); }`;
}

function size(value: number): string {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`A drawing size must be a finite number of 0 or more: ${String(value)}`);
  }
  return String(value);
}

function escapeAttribute(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}
