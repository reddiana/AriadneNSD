// The zip of "Export All to Files" and "Import from Files…" (R-WEB-09, UX BS4).

import { zipSync } from 'fflate';
import { describe, expect, it } from 'vitest';

import { isZip, unzipTexts, zipTexts } from './zip';

describe('zip of browser documents', () => {
  it('T-0958 · UX BS4: packs texts and unpacks the same texts', async () => {
    const entries = [
      { name: 'Merge Sort.ns.svg', text: '<svg>병합</svg>' },
      { name: 'b.ns.svg', text: '<svg/>' },
    ];
    const bytes = await zipTexts(entries);
    expect(isZip(bytes)).toBe(true);
    expect(await unzipTexts(bytes, () => true)).toEqual(entries);
  });

  it('T-0959 · UX BS4: unpacks only the files it accepts, without their folders', async () => {
    const bytes = zipSync({
      'docs/': new Uint8Array(),
      'docs/a.ns.svg': new TextEncoder().encode('A'),
      'notes.txt': new TextEncoder().encode('N'),
    });
    expect(await unzipTexts(bytes, (name) => name.endsWith('.ns.svg'))).toEqual([
      { name: 'a.ns.svg', text: 'A' },
    ]);
  });

  it('T-0960: tells a zip from other bytes', () => {
    expect(isZip(new TextEncoder().encode('<svg/>'))).toBe(false);
  });
});
