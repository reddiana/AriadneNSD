// Sketch M72 (atelier/sketchbook.md): every app example as its NS chart next to a flowchart of
// the same diagrams, for comparing the two notations. The NS pictures are the saved .ns.svg as
// the web app makes it; the flowcharts come from a structured layout over the block tree below
// (ISO 5807 symbols, like the hand-drawn M71). Not part of the app. Run again, then commit:
//   pnpm --filter @ariadne-nsd/editor example-flowcharts
import { writeFile } from 'node:fs/promises';

import { assembleSvgFile, callText, renderDoc } from '@ariadne-nsd/core';
import type { Block, CallTextContext, Diagram, Doc, Seq } from '@ariadne-nsd/core';
import { blockFont } from '@ariadne-nsd/fonts';
import { createNodeSubsetter, readFontFile } from '@ariadne-nsd/fonts/node';
import { it } from 'vitest';

import { examples } from '../src/examples/examples';

const page = new URL(
  '../../../../journal/assets/2026-11-22-example-flowcharts.html',
  import.meta.url,
);

// ---- Text measure: monospace 13px, wide characters (Hangul, CJK, arrows) count about double.

const lineHeight = 18;

function isWide(ch: string): boolean {
  const c = ch.codePointAt(0) ?? 0;
  return c >= 0x1100;
}

function width(text: string, narrow = 7.8, wide = 13.5): number {
  let w = 0;
  for (const ch of text) w += isWide(ch) ? wide : narrow;
  return w;
}

/** The width of a label in the sans font at 12px. */
function labelWidth(text: string): number {
  return width(text, 7, 12.5);
}

function linesOf(text: string): string[] {
  return text.split('\n');
}

function textWidth(lines: ReadonlyArray<string>): number {
  return Math.max(...lines.map((l) => width(l)));
}

function esc(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function n(v: number): string {
  return String(Math.round(v * 10) / 10);
}

// ---- Output buckets: lines under shapes, texts on top. Counts for the line under each pair.

type Out = {
  lines: string[];
  loops: string[];
  shapes: string[];
  dots: string[];
  texts: string[];
  shapeCount: number;
  arrowCount: number;
};

type Pt = readonly [number, number];

function edge(out: Out, points: ReadonlyArray<Pt>, opts: { head: boolean; loop?: boolean }): void {
  const loop = opts.loop === true;
  const marker = opts.head ? ` marker-end="url(#${loop ? 'fc-ahl' : 'fc-ah'})"` : '';
  const pts = points.map(([x, y]) => `${n(x)},${n(y)}`).join(' ');
  (loop ? out.loops : out.lines).push(`<polyline points="${pts}"${marker}/>`);
  out.arrowCount += 1;
}

function dot(out: Out, x: number, y: number, loop: boolean): void {
  const fill = loop ? 'var(--loop)' : 'var(--line)';
  out.dots.push(`<circle cx="${n(x)}" cy="${n(y)}" r="3" style="fill:${fill};stroke:none"/>`);
}

function text(out: Out, cx: number, cy: number, lines: ReadonlyArray<string>): void {
  const top = cy - ((lines.length - 1) * lineHeight) / 2;
  lines.forEach((line, i) => {
    out.texts.push(`<text x="${n(cx)}" y="${n(top + i * lineHeight)}">${esc(line)}</text>`);
  });
}

function label(
  out: Out,
  x: number,
  y: number,
  words: string,
  kind: 'yes' | 'no' | 'arm',
  anchor: 'start' | 'middle',
): void {
  const cls = kind === 'arm' ? 'lbl' : `lbl ${kind}`;
  out.texts.push(
    `<text class="${cls}" x="${n(x)}" y="${n(y)}" text-anchor="${anchor}">${esc(words)}</text>`,
  );
}

// ---- Boxes: each block lays out as a box with its entry and exit on the vertical line `cx`.

type Box = {
  readonly w: number;
  readonly h: number;
  /** The x of the entry (top) and the exit (bottom), from the box's left. */
  readonly cx: number;
  /** Where the incoming arrow's head ends, from the box's top: the top of the first shape. */
  readonly arrowIn: number;
  /** False when control never leaves through the bottom (return, continue, break). */
  readonly exits: boolean;
  /** An empty block: a plain line, no shape. */
  readonly empty: boolean;
  readonly draw: (x: number, y: number, out: Out) => void;
};

type Loop = { cont?: string; brk?: string };

type Ctx = {
  readonly calls: CallTextContext;
  readonly loops: Loop[];
  letters: number;
};

const gap = 24;

function rectBox(lines: ReadonlyArray<string>, kind: 'process' | 'call' | 'terminal'): Box {
  const tw = textWidth(lines);
  const pad = kind === 'call' ? 44 : kind === 'terminal' ? 36 : 24;
  const w = Math.ceil(Math.max(kind === 'terminal' ? 70 : 80, tw + pad));
  const h = lines.length * lineHeight + 18;
  return {
    w,
    h,
    cx: w / 2,
    arrowIn: 0,
    exits: kind !== 'terminal',
    empty: false,
    draw: (x, y, out) => {
      const fill =
        kind === 'call' ? 'var(--call)' : kind === 'terminal' ? 'var(--term)' : 'var(--shape)';
      const rx = kind === 'terminal' ? ` rx="${n(Math.min(h / 2, 18))}"` : '';
      out.shapes.push(
        `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}"${rx} style="fill:${fill}"/>`,
      );
      if (kind === 'call') {
        out.shapes.push(
          `<line x1="${n(x + 10)}" y1="${n(y)}" x2="${n(x + 10)}" y2="${n(y + h)}"/>`,
          `<line x1="${n(x + w - 10)}" y1="${n(y)}" x2="${n(x + w - 10)}" y2="${n(y + h)}"/>`,
        );
      }
      out.shapeCount += 1;
      text(out, x + w / 2, y + h / 2, lines);
    },
  };
}

function terminal(words: string): Box {
  return rectBox(linesOf(words), 'terminal');
}

const connectorR = 11;

function connectorShape(out: Out, cx: number, cy: number, letter: string): void {
  out.shapes.push(
    `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(connectorR)}" style="fill:var(--shape);stroke:var(--loop)"/>`,
  );
  out.texts.push(`<text class="lbl con" x="${n(cx)}" y="${n(cy)}">${esc(letter)}</text>`);
  out.shapeCount += 1;
}

/** A continue or break: a connector circle; the same letter sits at the loop head or exit. */
function connectorBox(letter: string): Box {
  const d = connectorR * 2;
  return {
    w: d,
    h: d,
    cx: connectorR,
    arrowIn: 0,
    exits: false,
    empty: false,
    draw: (x, y, out) => {
      connectorShape(out, x + connectorR, y + connectorR, letter);
    },
  };
}

const emptyBox: Box = {
  w: 0,
  h: 0,
  cx: 0,
  arrowIn: 0,
  exits: true,
  empty: true,
  draw: () => undefined,
};

type Jump = 'return' | 'continue' | 'break';

function jumpOf(block: Block): Jump | null {
  if (block.kind !== 'process') return null;
  const m = /^(return|continue|break)\b/.exec(block.text.trim());
  return m === null ? null : (m[1] as Jump);
}

function isEmptySeq(seq: Seq): boolean {
  const only = seq.blocks[0];
  return seq.blocks.length === 1 && only?.kind === 'process' && only.text === '';
}

function singleJump(seq: Seq): Block | null {
  const only = seq.blocks[0];
  return seq.blocks.length === 1 && only !== undefined && jumpOf(only) !== null ? only : null;
}

function nextLetter(ctx: Ctx): string {
  const letter = String.fromCharCode(65 + ctx.letters);
  ctx.letters += 1;
  return letter;
}

function jumpBox(block: Block, ctx: Ctx): Box {
  const jump = jumpOf(block);
  const loop = ctx.loops[ctx.loops.length - 1];
  if (jump === 'continue' && loop !== undefined) {
    loop.cont ??= nextLetter(ctx);
    return connectorBox(loop.cont);
  }
  if (jump === 'break' && loop !== undefined) {
    loop.brk ??= nextLetter(ctx);
    return connectorBox(loop.brk);
  }
  return terminal(block.kind === 'process' ? block.text : '');
}

function seqBox(seq: Seq, ctx: Ctx): Box {
  if (isEmptySeq(seq)) return emptyBox;
  const kids: Box[] = [];
  for (const block of seq.blocks) {
    const box = blockBox(block, ctx);
    if (box.empty) continue;
    kids.push(box);
    if (!box.exits) break;
  }
  return stack(kids);
}

/** Boxes one under another on one vertical line, joined by arrows. */
function stack(kids: ReadonlyArray<Box>): Box {
  const first = kids[0];
  const last = kids[kids.length - 1];
  if (first === undefined || last === undefined) return emptyBox;
  const cx = Math.max(...kids.map((k) => k.cx));
  const right = Math.max(...kids.map((k) => k.w - k.cx));
  const h = kids.reduce((sum, k) => sum + k.h, 0) + gap * (kids.length - 1);
  return {
    w: cx + right,
    h,
    cx,
    arrowIn: first.arrowIn,
    exits: last.exits,
    empty: false,
    draw: (x, y, out) => {
      let top = y;
      kids.forEach((kid, i) => {
        if (i > 0) {
          edge(
            out,
            [
              [x + cx, top - gap],
              [x + cx, top + kid.arrowIn],
            ],
            { head: true },
          );
        }
        kid.draw(x + cx - kid.cx, top, out);
        top += kid.h + gap;
      });
    },
  };
}

type Diamond = { lines: string[]; a: number; b: number };

function diamond(words: string): Diamond {
  const lines = linesOf(words);
  const p = textWidth(lines) / 2;
  const q = (lines.length * lineHeight) / 2;
  return {
    lines,
    a: Math.ceil(Math.max(p / 0.65 + 8, 44)),
    b: Math.ceil(Math.max(q / 0.35, 26)),
  };
}

function drawDiamond(out: Out, d: Diamond, cx: number, top: number): void {
  const cy = top + d.b;
  const pts = [
    [cx, top],
    [cx + d.a, cy],
    [cx, top + 2 * d.b],
    [cx - d.a, cy],
  ]
    .map(([px = 0, py = 0]) => `${n(px)},${n(py)}`)
    .join(' ');
  out.shapes.push(`<polygon points="${pts}" style="fill:var(--decision)"/>`);
  out.shapeCount += 1;
  text(out, cx, cy, d.lines);
}

const yesWord = '참';
const noWord = '거짓';

function ifBox(block: Extract<Block, { kind: 'if' }>, ctx: Ctx): Box {
  const d = diamond(block.text);
  const yesLabel = block.yes.label ?? yesWord;
  const noLabel = block.no.label ?? noWord;
  const yesJump = singleJump(block.yes.body);
  const noJump = singleJump(block.no.body);
  // A: one branch is a single jump: the jump to the right of the diamond, the other straight down.
  if ((yesJump === null) !== (noJump === null)) {
    const jumpIsYes = yesJump !== null;
    const side = jumpBox(yesJump ?? noJump ?? block, ctx);
    const down = seqBox(jumpIsYes ? block.no.body : block.yes.body, ctx);
    const cx = Math.max(d.a, down.cx) + 4;
    const dTop = Math.max(0, side.h / 2 - d.b);
    const dCy = dTop + d.b;
    const dBottom = dTop + 2 * d.b;
    const sideLeft = cx + d.a + 44;
    const downTop = dBottom + gap;
    const h = down.empty ? dBottom + 10 : downTop + down.h;
    return {
      w: Math.max(cx + down.w - down.cx, sideLeft + side.w) + 4,
      h,
      cx,
      arrowIn: dTop,
      exits: down.exits,
      empty: false,
      draw: (x, y, out) => {
        drawDiamond(out, d, x + cx, y + dTop);
        edge(
          out,
          [
            [x + cx + d.a, y + dCy],
            [x + sideLeft, y + dCy],
          ],
          { head: true },
        );
        side.draw(x + sideLeft, y + dCy - side.h / 2, out);
        if (down.empty) {
          edge(
            out,
            [
              [x + cx, y + dBottom],
              [x + cx, y + h],
            ],
            { head: false },
          );
        } else {
          edge(
            out,
            [
              [x + cx, y + dBottom],
              [x + cx, y + downTop + down.arrowIn],
            ],
            { head: true },
          );
          down.draw(x + cx - down.cx, y + downTop, out);
        }
        const [sideWord, downWord] = jumpIsYes ? [yesLabel, noLabel] : [noLabel, yesLabel];
        label(out, x + cx + d.a + 22, y + dCy - 10, sideWord, jumpIsYes ? 'yes' : 'no', 'middle');
        label(out, x + cx + 8, y + dBottom + 10, downWord, jumpIsYes ? 'no' : 'yes', 'start');
      },
    };
  }
  const yes = seqBox(block.yes.body, ctx);
  const no = seqBox(block.no.body, ctx);
  // B: one branch empty: the other straight down, the empty one around it on the right.
  if (yes.empty !== no.empty) {
    const downIsYes = !yes.empty;
    const down = downIsYes ? yes : no;
    const cx = Math.max(d.a, down.cx) + 4;
    const dCy = d.b;
    const dBottom = 2 * d.b;
    const downTop = dBottom + gap;
    const mergeY = downTop + down.h + 16;
    const bypassX = cx + Math.max(d.a + 48, down.w - down.cx + 20);
    return {
      w: bypassX + 4,
      h: mergeY,
      cx,
      arrowIn: 0,
      exits: true,
      empty: false,
      draw: (x, y, out) => {
        drawDiamond(out, d, x + cx, y);
        edge(
          out,
          [
            [x + cx, y + dBottom],
            [x + cx, y + downTop + down.arrowIn],
          ],
          { head: true },
        );
        down.draw(x + cx - down.cx, y + downTop, out);
        edge(
          out,
          [
            [x + cx + d.a, y + dCy],
            [x + bypassX, y + dCy],
            [x + bypassX, y + mergeY],
            [x + cx, y + mergeY],
          ],
          { head: false },
        );
        if (down.exits) {
          edge(
            out,
            [
              [x + cx, y + downTop + down.h],
              [x + cx, y + mergeY],
            ],
            { head: false },
          );
          dot(out, x + cx, y + mergeY, false);
        }
        const [downWord, sideWord] = downIsYes ? [yesLabel, noLabel] : [noLabel, yesLabel];
        label(out, x + cx + 8, y + dBottom + 10, downWord, downIsYes ? 'yes' : 'no', 'start');
        label(out, x + cx + d.a + 22, y + dCy - 10, sideWord, downIsYes ? 'no' : 'yes', 'middle');
      },
    };
  }
  // C: two branches side by side, true on the left, merging below.
  const colGap = 30;
  const yesX = yes.cx;
  let noLeft = yes.w + colGap;
  const need = 2 * d.a + 2 * 44;
  if (noLeft + no.cx - yesX < need) noLeft = yesX + need - no.cx;
  const noX = noLeft + no.cx;
  const cx = (yesX + noX) / 2;
  const dCy = d.b;
  const colTop = 2 * d.b + gap;
  const mergeY = colTop + Math.max(yes.h, no.h) + 16;
  return {
    w: noLeft + no.w,
    h: mergeY,
    cx,
    arrowIn: 0,
    exits: yes.exits || no.exits,
    empty: false,
    draw: (x, y, out) => {
      drawDiamond(out, d, x + cx, y);
      const branch = (box: Box, bx: number, vx: number): void => {
        edge(
          out,
          [
            [x + vx, y + dCy],
            [x + bx, y + dCy],
            [x + bx, y + colTop + box.arrowIn],
          ],
          { head: !box.empty },
        );
        box.draw(x + bx - box.cx, y + colTop, out);
        if (box.exits) {
          edge(
            out,
            [
              [x + bx, y + colTop + box.h],
              [x + bx, y + mergeY],
              [x + cx, y + mergeY],
            ],
            { head: false },
          );
        }
      };
      branch(yes, yesX, cx - d.a);
      branch(no, noX, cx + d.a);
      if (yes.exits && no.exits) dot(out, x + cx, y + mergeY, false);
      label(out, x + cx - d.a - 22, y + dCy - 10, yesLabel, 'yes', 'middle');
      label(out, x + cx + d.a + 22, y + dCy - 10, noLabel, 'no', 'middle');
    },
  };
}

function caseBox(block: Extract<Block, { kind: 'case' }>, ctx: Ctx): Box {
  const d = diamond(block.text);
  const arms = block.arms.map((arm) => ({ word: arm.label, box: seqBox(arm.body, ctx) }));
  if (block.otherwise !== null) {
    arms.push({ word: block.otherwise.label ?? 'default', box: seqBox(block.otherwise.body, ctx) });
  }
  const colGap = 24;
  let left = 0;
  const cols = arms.map(({ word, box }) => {
    const ccx = Math.max(box.cx, 4);
    const right = Math.max(box.w - box.cx, labelWidth(word) + 14);
    const col = { word, box, x: left + ccx };
    left += ccx + right + colGap;
    return col;
  });
  const colsW = left - colGap;
  const firstX = cols[0]?.x ?? 0;
  const lastX = cols[cols.length - 1]?.x ?? 0;
  let cx = (firstX + lastX) / 2;
  let shift = 0;
  if (cx - d.a < 0) {
    shift = d.a - cx;
    cx = d.a;
  }
  const w = Math.max(colsW + shift, cx + d.a);
  const dBottom = 2 * d.b;
  const busY = dBottom + 14;
  const colTop = busY + 32;
  const mergeY = colTop + Math.max(...cols.map((c) => c.box.h)) + 16;
  const exiting = cols.filter((c) => c.box.exits).length;
  return {
    w,
    h: mergeY,
    cx,
    arrowIn: 0,
    exits: exiting > 0,
    empty: false,
    draw: (x, y, out) => {
      drawDiamond(out, d, x + cx, y);
      for (const col of cols) {
        const ex = x + shift + col.x;
        edge(
          out,
          [
            [x + cx, y + dBottom],
            [x + cx, y + busY],
            [ex, y + busY],
            [ex, y + colTop + col.box.arrowIn],
          ],
          { head: !col.box.empty },
        );
        col.box.draw(ex - col.box.cx, y + colTop, out);
        if (col.box.exits) {
          edge(
            out,
            [
              [ex, y + colTop + col.box.h],
              [ex, y + mergeY],
              [x + cx, y + mergeY],
            ],
            { head: false },
          );
        }
        label(out, ex + 6, y + busY + 15, col.word, 'arm', 'start');
      }
      if (exiting > 1) dot(out, x + cx, y + mergeY, false);
    },
  };
}

const loopX = 6;
const junctionY = 14;

function preTestBox(block: Extract<Block, { kind: 'while' | 'for' }>, ctx: Ctx): Box {
  const d = diamond(block.text);
  const loop: Loop = {};
  ctx.loops.push(loop);
  const body = seqBox(block.body, ctx);
  ctx.loops.pop();
  const cx = loopX + 30 + Math.max(d.a, body.cx);
  const dTop = junctionY + 16;
  const dCy = dTop + d.b;
  const dBottom = dTop + 2 * d.b;
  const bodyTop = dBottom + gap;
  const bodyBottom = bodyTop + body.h;
  const backY = bodyBottom + 16;
  const outY = backY + 18;
  const exitX = cx + Math.max(d.a + 48, body.w - body.cx + 20);
  return {
    w: exitX + 4,
    h: outY,
    cx,
    arrowIn: dTop,
    exits: true,
    empty: false,
    draw: (x, y, out) => {
      drawDiamond(out, d, x + cx, y + dTop);
      edge(
        out,
        [
          [x + cx, y + dBottom],
          [x + cx, y + bodyTop + body.arrowIn],
        ],
        { head: !body.empty },
      );
      body.draw(x + cx - body.cx, y + bodyTop, out);
      if (body.exits) {
        edge(
          out,
          [
            [x + cx, y + bodyBottom],
            [x + cx, y + backY],
            [x + loopX, y + backY],
            [x + loopX, y + junctionY],
            [x + cx, y + junctionY],
          ],
          { head: true, loop: true },
        );
      }
      dot(out, x + cx, y + junctionY, true);
      edge(
        out,
        [
          [x + cx + d.a, y + dCy],
          [x + exitX, y + dCy],
          [x + exitX, y + outY],
          [x + cx, y + outY],
        ],
        { head: false },
      );
      if (loop.cont !== undefined) {
        connectorShape(out, x + cx + 36, y + junctionY, loop.cont);
        edge(
          out,
          [
            [x + cx + 36 - connectorR, y + junctionY],
            [x + cx, y + junctionY],
          ],
          { head: false, loop: true },
        );
      }
      if (loop.brk !== undefined) {
        connectorShape(out, x + cx - 36, y + outY, loop.brk);
        edge(
          out,
          [
            [x + cx - 36 + connectorR, y + outY],
            [x + cx, y + outY],
          ],
          { head: true },
        );
      }
      label(out, x + cx + 8, y + dBottom + 10, yesWord, 'yes', 'start');
      label(out, x + cx + d.a + 22, y + dCy - 10, noWord, 'no', 'middle');
    },
  };
}

function postTestBox(block: Extract<Block, { kind: 'doWhile' }>, ctx: Ctx): Box {
  const d = diamond(block.text);
  const loop: Loop = {};
  ctx.loops.push(loop);
  const body = seqBox(block.body, ctx);
  ctx.loops.pop();
  const cx = loopX + 30 + Math.max(d.a, body.cx);
  const bodyTop = junctionY + 16;
  const dTop = bodyTop + body.h + gap;
  const dCy = dTop + d.b;
  const dBottom = dTop + 2 * d.b;
  return {
    w: cx + Math.max(d.a, body.w - body.cx, 50) + 4,
    h: dBottom,
    cx,
    arrowIn: bodyTop + body.arrowIn,
    exits: true,
    empty: false,
    draw: (x, y, out) => {
      body.draw(x + cx - body.cx, y + bodyTop, out);
      if (body.exits) {
        edge(
          out,
          [
            [x + cx, y + bodyTop + body.h],
            [x + cx, y + dTop],
          ],
          { head: true },
        );
      }
      drawDiamond(out, d, x + cx, y + dTop);
      edge(
        out,
        [
          [x + cx - d.a, y + dCy],
          [x + loopX, y + dCy],
          [x + loopX, y + junctionY],
          [x + cx, y + junctionY],
        ],
        { head: true, loop: true },
      );
      dot(out, x + cx, y + junctionY, true);
      if (loop.cont !== undefined) {
        connectorShape(out, x + cx + 36, y + junctionY, loop.cont);
        edge(
          out,
          [
            [x + cx + 36 - connectorR, y + junctionY],
            [x + cx, y + junctionY],
          ],
          { head: false, loop: true },
        );
      }
      label(out, x + cx - d.a - 18, y + dCy - 10, yesWord, 'yes', 'middle');
      label(out, x + cx + 8, y + dBottom + 10, noWord, 'no', 'start');
    },
  };
}

function blockBox(block: Block, ctx: Ctx): Box {
  switch (block.kind) {
    case 'process':
      if (block.text === '') return emptyBox;
      if (jumpOf(block) !== null) return jumpBox(block, ctx);
      return rectBox(linesOf(block.text), 'process');
    case 'call':
      return rectBox([callText(ctx.calls, block)], 'call');
    case 'if':
      return ifBox(block, ctx);
    case 'case':
      return caseBox(block, ctx);
    case 'while':
    case 'for':
      return preTestBox(block, ctx);
    case 'doWhile':
      return postTestBox(block, ctx);
  }
}

// ---- One flowchart per diagram.

type Chart = { svg: string; w: number; h: number; shapes: number; arrows: number };

function flowchart(diagram: Diagram, calls: CallTextContext): Chart {
  const ctx: Ctx = { calls, loops: [], letters: 0 };
  const body = seqBox(diagram.body, ctx);
  const kids = [terminal(diagram.head?.text ?? '시작')];
  if (!body.empty) kids.push(body);
  if (body.empty || body.exits) kids.push(terminal('끝'));
  const all = stack(kids);
  const out: Out = {
    lines: [],
    loops: [],
    shapes: [],
    dots: [],
    texts: [],
    shapeCount: 0,
    arrowCount: 0,
  };
  const pad = 16;
  all.draw(pad, pad, out);
  const w = Math.ceil(all.w + 2 * pad + 20);
  const h = Math.ceil(all.h + 2 * pad + 12);
  const aria = esc(`${diagram.head?.text ?? ''} 플로차트`);
  const svg = [
    `<svg width="${n(w)}" height="${n(h)}" viewBox="0 0 ${n(w)} ${n(h)}" role="img" aria-label="${aria}">`,
    '<g style="stroke:var(--line);stroke-width:1.4">',
    `<g style="fill:none">${out.lines.join('')}</g>`,
    `<g style="fill:none;stroke:var(--loop);stroke-width:1.8">${out.loops.join('')}</g>`,
    out.shapes.join(''),
    out.dots.join(''),
    `<g style="stroke:none" text-anchor="middle" dominant-baseline="central">${out.texts.join('')}</g>`,
    '</g></svg>',
  ].join('\n');
  return { svg, w, h, shapes: out.shapeCount, arrows: out.arrowCount };
}

function countBlocks(seq: Seq): number {
  let count = 0;
  for (const block of seq.blocks) {
    count += 1;
    switch (block.kind) {
      case 'if':
        count += countBlocks(block.yes.body) + countBlocks(block.no.body);
        break;
      case 'case':
        for (const arm of block.arms) count += countBlocks(arm.body);
        if (block.otherwise !== null) count += countBlocks(block.otherwise.body);
        break;
      case 'while':
      case 'doWhile':
      case 'for':
        count += countBlocks(block.body);
        break;
      case 'process':
      case 'call':
        break;
    }
  }
  return count;
}

// ---- The page.

const style = `<style>
/* 예제마다 두 칸: 왼쪽 NS 차트(앱이 저장하는 그림 그대로), 오른쪽 같은 순서의 플로차트. 좁으면 위아래 */
:root {
  --bg: #f6f7f9; --panel: #ffffff; --fg: #1d2330; --muted: #5d6677;
  --line: #2a3142; --shape: #ffffff; --decision: #fff6e0; --call: #eaf2ff;
  --term: #e9f6ee; --loop: #c2410c; --ok: #15803d; --no: #b91c1c; --accent: #2563eb;
  --mono: "D2Coding", Consolas, "Malgun Gothic", monospace;
  --sans: "Pretendard", "Malgun Gothic", "Apple SD Gothic Neo", system-ui, sans-serif;
}
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) {
  --bg: #12151b; --panel: #1a1e26; --fg: #e6e9ef; --muted: #9aa3b2;
  --line: #c9d0dc; --shape: #1f2430; --decision: #3a3120; --call: #1e2c44;
  --term: #1c3326; --loop: #fb923c; --ok: #4ade80; --no: #f87171; --accent: #60a5fa; color-scheme: dark } }
:root[data-theme="dark"] {
  --bg: #12151b; --panel: #1a1e26; --fg: #e6e9ef; --muted: #9aa3b2;
  --line: #c9d0dc; --shape: #1f2430; --decision: #3a3120; --call: #1e2c44;
  --term: #1c3326; --loop: #fb923c; --ok: #4ade80; --no: #f87171; --accent: #60a5fa; color-scheme: dark }
body { background: var(--bg); color: var(--fg); font-family: var(--sans); line-height: 1.6;
  padding-left: max(16px, env(safe-area-inset-left, 0px)); padding-right: max(16px, env(safe-area-inset-right, 0px));
  padding-block: 24px 48px; }
main { max-width: 1400px; margin: 0 auto; display: grid; gap: 20px; }
h1 { font-size: 1.5rem; margin: 0; text-wrap: balance; }
h2 { font-size: 1.2rem; margin: 0; }
h2 span { font-weight: 400; color: var(--muted); font-size: .95rem; margin-left: .5em; }
.lead { margin: 0; color: var(--muted); max-width: 80ch; }
.tabs { display: flex; flex-wrap: wrap; gap: 8px; }
.tabs button { font: inherit; font-size: .92rem; text-align: left; cursor: pointer; color: var(--fg);
  background: var(--panel); border: 1px solid color-mix(in srgb, var(--line) 22%, transparent);
  border-radius: 8px; padding: 6px 12px; line-height: 1.35; }
.tabs button small { display: block; color: var(--muted); font-size: .8rem; }
.tabs button[aria-selected="true"] { border-color: var(--accent); box-shadow: inset 0 0 0 1px var(--accent); }
section { display: grid; gap: 12px; }
.pair { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 20px; align-items: start; }
@media (max-width: 760px) { .pair { grid-template-columns: 1fr; } }
figure { margin: 0; background: var(--panel); border: 1px solid color-mix(in srgb, var(--line) 18%, transparent);
  border-radius: 8px; padding: 16px; min-width: 0; display: grid; gap: 10px; align-content: start; }
figcaption { font-weight: 600; }
figcaption span { font-weight: 400; color: var(--muted); font-size: .9rem; margin-left: .4em; }
.fc h3 { margin: 4px 0 0; font-size: .95rem; font-family: var(--mono); font-weight: 600; }
.scroll { overflow-x: auto; }
.ns { background: #fff; border-radius: 4px; padding: 8px; width: fit-content; }
.ns svg, .fc svg { display: block; max-width: none; }
.fc text { font-family: var(--mono); font-size: 13px; fill: var(--fg); }
.fc .lbl { font-family: var(--sans); font-size: 12px; font-weight: 600; }
.fc .yes { fill: var(--ok); } .fc .no { fill: var(--no); } .fc .con { fill: var(--loop); }
.counts { margin: 0; color: var(--muted); font-size: .92rem; }
code { font-family: var(--mono); font-size: .9em; }
</style>`;

const defs = `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
<marker id="fc-ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" style="fill:var(--line)"/></marker>
<marker id="fc-ahl" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" style="fill:var(--loop)"/></marker>
</defs></svg>`;

const script = `<script>
(() => {
  const buttons = [...document.querySelectorAll('.tabs button')];
  const show = (id) => {
    if (!document.getElementById('ex-' + id)) id = buttons[0].dataset.id;
    for (const b of buttons) {
      const on = b.dataset.id === id;
      b.setAttribute('aria-selected', String(on));
      document.getElementById('ex-' + b.dataset.id).hidden = !on;
    }
  };
  for (const b of buttons) b.addEventListener('click', () => { history.replaceState(null, '', '#' + b.dataset.id); show(b.dataset.id); });
  addEventListener('hashchange', () => show(location.hash.slice(1)));
  show(location.hash.slice(1));
})();
</script>`;

/** The saved .ns.svg made fit to sit in a page next to others: no model, its own font name. */
function inlineNs(file: string, id: string, family: string): string {
  return file
    .replace(/<\?xml[^>]*\?>\s*/, '')
    .replace(/<metadata>[\s\S]*?<\/metadata>/g, '')
    .split(family)
    .join(`${family}-${id}`)
    .replace(/\bid="([^"]+)"/g, `id="${id}-$1"`)
    .replace(/url\(#([^)]+)\)/g, `url(#${id}-$1)`)
    .replace(/href="#([^"]+)"/g, `href="#${id}-$1"`);
}

it('writes the M72 page', { timeout: 120_000 }, async () => {
  const subsetter = await createNodeSubsetter();
  const ttf = await readFontFile(blockFont.files.ttf);
  const tabs: string[] = [];
  const sections: string[] = [];
  for (const example of examples) {
    const doc: Doc = example.build({ headStyle: 'title', locale: 'ko' });
    const rendering = renderDoc(doc);
    const file = assembleSvgFile({
      doc,
      drawing: rendering.svg,
      fonts: [
        { family: blockFont.familyName, woff: subsetter.subsetToWoff(ttf, rendering.codePoints) },
      ],
    });
    const calls: CallTextContext = {
      locale: 'ko',
      resultSymbol: doc.view.resultSymbol,
      diagrams: new Map(doc.content.diagrams.map((d) => [d.id, d])),
    };
    const charts = doc.content.diagrams.map((d) => ({ diagram: d, chart: flowchart(d, calls) }));
    const blocks = doc.content.diagrams.reduce((sum, d) => sum + countBlocks(d.body), 0);
    const shapes = charts.reduce((sum, c) => sum + c.chart.shapes, 0);
    const arrows = charts.reduce((sum, c) => sum + c.chart.arrows, 0);
    const fcW = Math.max(...charts.map((c) => c.chart.w));
    const fcH = charts.reduce((sum, c) => sum + c.chart.h, 0);
    const nsW = Math.round(rendering.svg.width);
    const nsH = Math.round(rendering.svg.height);
    const diagramsWord = charts.length > 1 ? `, 그림 ${String(charts.length)}개` : '';
    tabs.push(
      `<button type="button" data-id="${example.id}">${esc(example.name.ko)}<small>${esc(example.what.ko)}</small></button>`,
    );
    const fcParts = charts
      .map(({ diagram, chart }) => {
        const title = charts.length > 1 ? `<h3>${esc(diagram.head?.text ?? '')}</h3>` : '';
        return `${title}<div class="scroll">${chart.svg}</div>`;
      })
      .join('\n');
    sections.push(`<section id="ex-${example.id}" hidden>
<h2>${esc(example.name.ko)}<span>${esc(example.what.ko)}</span></h2>
<div class="pair">
<figure><figcaption>NS 차트 <span>블록 ${String(blocks)}개${diagramsWord}</span></figcaption>
<div class="scroll"><div class="ns">${inlineNs(file, example.id, blockFont.familyName)}</div></div></figure>
<figure class="fc"><figcaption>플로차트 <span>도형 ${String(shapes)}개, 화살표 ${String(arrows)}개</span></figcaption>
${fcParts}</figure>
</div>
<p class="counts">NS 차트: 블록 ${String(blocks)}개, ${String(nsW)} × ${String(nsH)} · 플로차트: 도형 ${String(shapes)}개, 화살표 ${String(arrows)}개, ${String(fcW)} × ${String(fcH)}${charts.length > 1 ? ' (그림을 세로로 쌓은 크기)' : ''}</p>
</section>`);
  }
  const html = [
    '<title>M72 예제 NS · 플로차트</title>',
    '<meta name="claude:viewport-fit-sides" content="cover">',
    style,
    '',
    '<main>',
    '<h1>M72 예제: NS 차트와 플로차트</h1>',
    '<p class="lead">앱의 예제를 모두 두 방식으로 그렸습니다. 왼쪽은 앱이 저장하는 NS 차트 그림 그대로, 오른쪽은 같은 순서의 플로차트(ISO 5807 기호)입니다. 플로차트는 블록 트리에서 스크립트가 자동으로 배치했습니다. 반복의 되돌아가는 선은 주황색, <code>return</code>은 끝 도형, <code>continue</code>는 글자를 단 연결자 원(같은 글자의 원이 반복의 머리에 있음)으로 그렸습니다. 그림이 여럿인 예제(Event · Method)는 위아래로 쌓았습니다.</p>',
    `<nav class="tabs" aria-label="예제">${tabs.join('')}</nav>`,
    defs,
    ...sections,
    '</main>',
    script,
    '',
  ].join('\n');
  await writeFile(page, html);
});
