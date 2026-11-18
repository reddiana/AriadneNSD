// Moves the notation legend of the two C&C diagrams from the right of the drawing to below it, so
// the published page can show the drawing larger (maintainer, 2026-11-18). Only the `lg-*` cells
// change; the maintainer's hand-edited components and connectors keep their bytes.
//
// Usage: node journal/assets/2026-11-18-cc-legend-bottom.mjs
// The positions are absolute, so running it twice gives the same result.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const drawio = 'C:/Program Files/draw.io/draw.io.exe';
const assets = join(dirname(fileURLToPath(import.meta.url)), '../../docs/03-architecture/assets');

const headerHeight = 40;
const rowHeight = 44;
const padding = 14;
const swatchToText = 90;

const diagrams = [
  {
    file: 'cc-view-web-overview.drawio.svg',
    box: { x: 40, y: 600, width: 1040 },
    rows: [
      ['pas', 'store', 'port'],
      ['state', 'pure', 'ext'],
      ['call', 'async', 'notify'],
      ['proc'],
    ],
  },
  {
    file: 'cc-view-web.drawio.svg',
    box: { x: 40, y: 890, width: 1540 },
    rows: [
      ['pas', 'act', 'store', 'port'],
      ['state', 'pure', 'ext'],
      ['call', 'async', 'notify', 'msg'],
      ['proc', 'mod'],
    ],
  },
];

/** The cells drawn for one legend item, besides its text `lg-t-<item>`. */
const swatchCells = {
  pas: ['lg-pas'],
  act: ['lg-act'],
  state: ['lg-state'],
  pure: ['lg-pure'],
  ext: ['lg-ext'],
  store: ['lg-store'],
  port: ['lg-po', 'lg-pi'],
  call: ['lg-call-e'],
  async: ['lg-async-e'],
  notify: ['lg-notify-e'],
  msg: ['lg-msg-e'],
  proc: ['lg-proc'],
  mod: ['lg-mod'],
};

const unescapeAttribute = (text) =>
  text
    .replaceAll('&#10;', '\n')
    .replaceAll('&quot;', '"')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&amp;', '&');

const escapeAttribute = (text) =>
  text
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('\n', '&#10;');

/** Replaces every `light-dark(a, b)` with `a`; the colours may hold parentheses of their own. */
function lightOnly(svg) {
  const opening = 'light-dark(';
  let result = '';
  let position = 0;
  for (;;) {
    const start = svg.indexOf(opening, position);
    if (start < 0) return result + svg.slice(position);
    result += svg.slice(position, start);
    let depth = 1;
    let comma = -1;
    let index = start + opening.length;
    for (; depth > 0; index += 1) {
      const character = svg[index];
      if (character === '(') depth += 1;
      else if (character === ')') depth -= 1;
      else if (character === ',' && depth === 1 && comma < 0) comma = index;
    }
    result += svg.slice(start + opening.length, comma).trim();
    position = index;
  }
}

function cellPattern(id) {
  return new RegExp(`<mxCell\\b[^>]*\\bid="${id}"[^>]*>[\\s\\S]*?</mxCell>`);
}

function readCell(model, id) {
  const match = cellPattern(id).exec(model);
  if (match === null) throw new Error(`no cell ${id}`);
  return match[0];
}

function numberAttribute(tag, name) {
  const match = new RegExp(`\\b${name}="(-?[\\d.]+)"`).exec(tag);
  return match === null ? 0 : Number(match[1]);
}

/** Moves every mxGeometry and mxPoint of a cell by (dx, dy). */
function shiftCell(model, id, dx, dy) {
  const moved = readCell(model, id).replace(/<(mxGeometry|mxPoint)\b[^>]*>/g, (tag) => {
    if (/\brelative="1"/.test(tag) && !/\bx="/.test(tag)) return tag;
    const x = numberAttribute(tag, 'x') + dx;
    const y = numberAttribute(tag, 'y') + dy;
    return tag.replace(/\bx="[^"]*"/, `x="${x}"`).replace(/\by="[^"]*"/, `y="${y}"`);
  });
  return model.replace(cellPattern(id), () => moved);
}

function setGeometry(model, id, geometry) {
  const moved = readCell(model, id).replace(/<mxGeometry\b[^>]*>/, (tag) => {
    let next = tag;
    for (const [name, value] of Object.entries(geometry)) {
      next = next.replace(new RegExp(`\\b${name}="[^"]*"`), `${name}="${value}"`);
    }
    return next;
  });
  return model.replace(cellPattern(id), () => moved);
}

function geometryOf(model, id) {
  const tag = /<mxGeometry\b[^>]*>/.exec(readCell(model, id))?.[0] ?? '';
  return { x: numberAttribute(tag, 'x'), y: numberAttribute(tag, 'y') };
}

/**
 * Separates shape from color in the legend: the passive and active swatches turn white (they show
 * the shape only), and a blue swatch says what blue means. Does nothing the second time.
 */
function separateShapeFromColor(source) {
  if (source.includes('id="lg-state"')) return source;
  let model = source;
  const stateSwatch = readCell(model, 'lg-pas').replace('id="lg-pas"', 'id="lg-state"');
  const stateText = readCell(model, 'lg-t-pure')
    .replace('id="lg-t-pure"', 'id="lg-t-state"')
    .replace(/\bvalue="[^"]*"/, 'value="상태를 가진 우리 코드&#xa;(editor · 웹 셸)"');
  for (const id of ['lg-pas', 'lg-act']) {
    // The overview has no active component.
    if (!model.includes(`id="${id}"`)) continue;
    const white = readCell(model, id)
      .replace(/fillColor=[^;"]*/, 'fillColor=#ffffff')
      .replace(/strokeColor=[^;"]*/, 'strokeColor=#1d2330');
    model = model.replace(cellPattern(id), () => white);
  }
  const pure = readCell(model, 'lg-t-pure');
  return model.replace(cellPattern('lg-t-pure'), () => `${pure}${stateSwatch}${stateText}`);
}

function moveLegend(source, { box, rows }) {
  let model = separateShapeFromColor(source);
  // The blue swatch stands beside its text as the passive swatch stands beside its own.
  const swatch = geometryOf(model, 'lg-pas');
  const swatchText = geometryOf(model, 'lg-t-pas');
  const stateText = geometryOf(model, 'lg-t-state');
  model = setGeometry(model, 'lg-state', {
    x: stateText.x + swatch.x - swatchText.x,
    y: stateText.y + swatch.y - swatchText.y,
  });
  const columns = Math.max(...rows.map((row) => row.length));
  const columnWidth = Math.floor((box.width - 2 * padding) / columns);
  model = setGeometry(model, 'lg-box', {
    x: box.x,
    y: box.y,
    width: box.width,
    height: headerHeight + rows.length * rowHeight,
  });
  // The note has no swatch: it shares the title's line, from the second column.
  model = setGeometry(model, 'lg-note', {
    x: box.x + padding + columnWidth,
    y: box.y + 5,
  });
  rows.forEach((row, rowIndex) => {
    row.forEach((item, columnIndex) => {
      const textId = `lg-t-${item}`;
      const from = geometryOf(model, textId);
      const dx = box.x + padding + columnIndex * columnWidth + swatchToText - from.x;
      const dy = box.y + headerHeight + rowIndex * rowHeight - from.y;
      for (const id of [textId, ...swatchCells[item]]) model = shiftCell(model, id, dx, dy);
    });
  });
  return model;
}

const workDir = mkdtempSync(join(tmpdir(), 'cc-legend-'));
try {
  for (const diagram of diagrams) {
    const path = join(assets, diagram.file);
    const before = readFileSync(path, 'utf8');
    const content = /\scontent="([^"]*)"/.exec(before)?.[1];
    if (content === undefined) throw new Error(`no embedded model in ${diagram.file}`);
    const model = moveLegend(unescapeAttribute(content), diagram);

    const input = join(workDir, diagram.file.replace('.svg', ''));
    const output = join(workDir, diagram.file);
    writeFileSync(input, model);
    execFileSync(drawio, ['--export', '--format', 'svg', '--output', output, input], {
      stdio: 'inherit',
    });

    // The exported drawing, with the model kept readable and without the DOCTYPE line that
    // Artifact pages refuse (session 2026-11-17-01). The drawing stays on white paper in a dark
    // theme too, as the files were before.
    const exported = lightOnly(readFileSync(output, 'utf8'))
      .replace(/<!DOCTYPE[^>]*>\s*/, '')
      .replace(/\scontent="[^"]*"/, '')
      .replace(/color-scheme:\s*light dark;/, 'color-scheme: light;');
    const withModel = exported.replace(
      /<svg\b[^>]*>/,
      (tag) => `${tag.slice(0, -1)} content="${escapeAttribute(model)}">`,
    );
    writeFileSync(path, withModel.endsWith('\n') ? withModel : `${withModel}\n`);
  }
} finally {
  rmSync(workDir, { recursive: true, force: true });
}
