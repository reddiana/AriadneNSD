// PNG export (R-EXP-01): the saved SVG — the same drawing, with its subset font inside — drawn as
// an image onto a canvas at `scale` times its size.

/** The default scale: crisp on high-density screens and in documents. */
export const defaultPngScale = 2;

/** The largest canvas side browsers draw reliably (Safari's limit is the lowest). */
const maxCanvasSide = 16_384;

/** Reads `width` and `height` of the root `<svg>` element, in px. `null` if missing. */
export function svgSize(svg: string): { readonly width: number; readonly height: number } | null {
  const root = /<svg\b[^>]*>/.exec(svg)?.[0];
  if (root === undefined) {
    return null;
  }
  const width = Number(/\swidth="([\d.]+)"/.exec(root)?.[1]);
  const height = Number(/\sheight="([\d.]+)"/.exec(root)?.[1]);
  return Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0
    ? { width, height }
    : null;
}

/**
 * The canvas size for `size` at `scale`, in whole pixels. The scale is lowered when the canvas
 * would be larger than browsers can draw.
 */
export function pngSize(
  size: { readonly width: number; readonly height: number },
  scale: number,
): { readonly width: number; readonly height: number; readonly scale: number } {
  const fitting = Math.min(scale, maxCanvasSide / size.width, maxCanvasSide / size.height);
  return {
    width: Math.max(1, Math.round(size.width * fitting)),
    height: Math.max(1, Math.round(size.height * fitting)),
    scale: fitting,
  };
}

/**
 * Draws the saved SVG text to a PNG. The SVG is self-contained (paper color, data-URI font →
 * ADR-0026), so the image looks the same as the file in any SVG viewer.
 */
export async function svgToPng(svg: string, scale: number = defaultPngScale): Promise<Blob> {
  const size = svgSize(svg);
  if (size === null) {
    throw new Error('The saved SVG has no width and height');
  }
  const target = pngSize(size, scale);
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
  try {
    const image = new Image();
    image.src = url;
    // decode() waits for the image, including the @font-face data URI inside it.
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = target.width;
    canvas.height = target.height;
    const context = canvas.getContext('2d');
    if (context === null) {
      throw new Error('No 2D canvas context');
    }
    context.drawImage(image, 0, 0, target.width, target.height);
    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob === null) {
          reject(new Error('canvas.toBlob gave no PNG'));
        } else {
          resolve(blob);
        }
      }, 'image/png');
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}
