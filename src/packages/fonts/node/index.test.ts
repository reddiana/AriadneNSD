import { describe, expect, it } from 'vitest';

import { blockFont } from '../src/index';
import { readFontFile } from './index';

describe('readFontFile', () => {
  it('T-0500: ADR-0026: reads the subset TTF that per-document subsets start from', async () => {
    const bytes = await readFontFile(blockFont.files.ttf);
    // TrueType outlines start with the sfnt version 0x00010000.
    expect([...bytes.subarray(0, 4)]).toEqual([0, 1, 0, 0]);
  });

  it('T-0501: 02-layout 2.2: reads the woff2 for the editor screen', async () => {
    const bytes = await readFontFile(blockFont.files.woff2);
    expect(new TextDecoder().decode(bytes.subarray(0, 4))).toBe('wOF2');
  });
});
