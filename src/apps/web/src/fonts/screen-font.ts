import { blockFont, screenSlices } from '@ariadne-nsd/fonts';
import { screenSliceUrl } from '@ariadne-nsd/fonts/browser';

/**
 * Registers the bundled block font for the screen, in slices (ADR-0040). The browser downloads
 * a slice only when a character of it is on screen; slice 0 (Latin, punctuation, symbols) is
 * loaded now. Until a slice arrives its characters show in a fallback font: the layout does not
 * change, since widths come from the advance table (02-layout 2.1).
 */
export async function loadBlockFont(): Promise<void> {
  const faces = screenSlices.map(
    (slice) =>
      new FontFace(blockFont.familyName, `url(${screenSliceUrl(slice.file)}) format('woff2')`, {
        weight: String(blockFont.weight),
        unicodeRange: slice.unicodeRange,
        display: 'swap',
      }),
  );
  // Slice 0 first, then all at once: until then the first drawing uses a fallback font, so it
  // neither waits for nor fetches a slice. Registered before the first drawing, the slices of the
  // welcome's Korean thumbnails were fetched during it (a first visit seemed 0.3 ~ 0.5 s slower).
  await faces[0]?.load();
  for (const face of faces) {
    document.fonts.add(face);
  }
}
