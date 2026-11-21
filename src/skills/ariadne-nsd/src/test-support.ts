// What the skill's tests share: an example model and the fonts read from the fonts package.
import { blockFont } from '@ariadne-nsd/fonts';
import { createNodeSubsetter, readFontFile } from '@ariadne-nsd/fonts/node';

import type { SaveFonts } from './engine';

/** The guide's example (/llms.txt): one Method with a For, an If and an empty branch. */
export const maxModel =
  '{"format":"ariadne-nsd","version":1,"settings":{"textKind":"plain","theme":"default","headStyle":"title","locale":"en"},"diagrams":[{"id":"d1","head":{"kind":"method","text":"max(a, n)"},"body":[{"id":"b1","kind":"process","text":"m = a[0]"},{"id":"b2","kind":"for","text":"for i = 1 to n - 1","body":[{"id":"b3","kind":"if","text":"a[i] > m","yes":{"id":"r1","body":[{"id":"b4","kind":"process","text":"m = a[i]"}]},"no":{"id":"r2","body":[{"id":"b5","kind":"process","text":""}]}}]},{"id":"b6","kind":"process","text":"return m"}]}],"view":{"folded":[],"opened":[],"bands":true,"resultSymbol":"←"}}';

/** The block font and the subsetter, read as the bundle unpacks them, from the fonts package. */
export async function nodeFonts(): Promise<SaveFonts> {
  return { ttf: await readFontFile(blockFont.files.ttf), subsetter: await createNodeSubsetter() };
}
