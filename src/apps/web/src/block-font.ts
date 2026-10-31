import { blockFont } from '@ariadne-nsd/fonts';
import woff2Url from '@ariadne-nsd/fonts/assets/ariadne-nsd-block-regular.woff2?url';

/**
 * Registers the bundled block font for the screen. Vite copies the woff2 into the build and
 * gives its URL, so the font works under any base path (02-layout 2.2).
 */
export async function loadBlockFont(): Promise<void> {
  const face = new FontFace(blockFont.familyName, `url(${woff2Url}) format('woff2')`, {
    weight: String(blockFont.weight),
  });
  document.fonts.add(await face.load());
}
