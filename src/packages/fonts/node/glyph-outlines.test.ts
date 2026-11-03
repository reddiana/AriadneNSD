// The bundled font's glyph outlines, read for text as outlines and PDF (R-FMT-10, R-EXP-03).
import { beforeAll, describe, expect, it } from 'vitest';

import { advanceOf, blockFont, readGlyphOutlines } from '../src/index';
import type { GlyphOutlines } from '../src/index';
import { readFontFile } from './index';

let outlines: GlyphOutlines;

beforeAll(async () => {
  outlines = readGlyphOutlines(await readFontFile(blockFont.files.ttf));
});

describe('readGlyphOutlines', () => {
  it('reads the em size of the bundled font', () => {
    expect(outlines.unitsPerEm).toBe(1000);
  });

  it('gives each glyph the advance of the width table', () => {
    for (const character of 'Ai 가←∅') {
      const codePoint = character.codePointAt(0) ?? 0;
      expect(outlines.glyphOf(codePoint)?.advance).toBe(advanceOf(blockFont.advances, codePoint));
    }
  });

  it('draws closed contours inside the em box', () => {
    for (const character of 'Ag가힣←') {
      const glyph = outlines.glyphOf(character.codePointAt(0) ?? 0);
      expect(glyph?.commands[0]?.kind).toBe('move');
      expect(glyph?.commands.at(-1)?.kind).toBe('close');
      for (const command of glyph?.commands ?? []) {
        if (command.kind !== 'close') {
          expect(Math.abs(command.x)).toBeLessThan(1200);
          expect(command.y).toBeGreaterThan(-400);
          expect(command.y).toBeLessThan(1100);
        }
      }
    }
  });

  it('gives a space no outline and a character the font lacks no glyph', () => {
    expect(outlines.glyphOf(0x20)?.commands).toEqual([]);
    expect(outlines.glyphOf(0x4e00)).toBeNull();
    expect(outlines.notdef.advance).toBeGreaterThan(0);
  });

  it('reads the same commands from the same font', async () => {
    const again = readGlyphOutlines(await readFontFile(blockFont.files.ttf));
    for (const character of 'a가') {
      const codePoint = character.codePointAt(0) ?? 0;
      expect(again.glyphOf(codePoint)).toEqual(outlines.glyphOf(codePoint));
    }
  });

  it('fails on a font without glyph tables', () => {
    const header = new Uint8Array(12);
    expect(() => readGlyphOutlines(header)).toThrow(/no head table/);
  });
});
