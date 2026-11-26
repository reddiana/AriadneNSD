// Even straight lines on the screen at any scale (visual design 9.1, 9.2). The document layer is
// the saved SVG, scaled by the zoom (a CSS transform) and by the device pixel ratio (browser zoom,
// display scaling). Its rectangles are drawn with `shape-rendering="crispEdges"`, so the browser
// rounds each edge of a stroke to a whole device pixel. A 1px stroke at 110% is 1.1 device pixels:
// rounded, it covers one pixel or two, depending on where it lands, and some lines of the same
// diagram look twice as thick as the others. A stroke width of a whole number of device pixels
// rounds to the same width wherever it lands.
//
// The straight lines that are paths (a Case arm's line, the bars of a call block) are anti-aliased
// in the file. At 100% they fill one pixel row (9.1); at another scale they fall between pixels
// and blur over two. On the screen, a path of only horizontal and vertical lines is drawn crisp
// like the rectangles. Diagonals and curves stay anti-aliased. Only the screen changes: the saved
// file stays as it is.

/**
 * The width, in drawing units, that covers a whole number of device pixels at `scale` (device
 * pixels per drawing unit): `width × scale` rounded, at least one pixel so a line never vanishes.
 */
export function crispStrokeWidth(width: number, scale: number): number {
  return Math.max(1, Math.round(width * scale)) / scale;
}

const number = String.raw`-?\d+(?:\.\d+)?`;
const straightPath = new RegExp(String.raw`^M${number} ${number}(?: L${number} ${number})+$`);

/** Whether a path's data is a line through points with only horizontal and vertical steps. */
export function isAxisAlignedPath(data: string): boolean {
  if (!straightPath.test(data)) {
    return false;
  }
  const values = data.match(new RegExp(number, 'g'))?.map(Number) ?? [];
  for (let index = 2; index < values.length; index += 2) {
    const isVertical = values[index] === values[index - 2];
    const isHorizontal = values[index + 1] === values[index - 1];
    if (!isVertical && !isHorizontal) {
      return false;
    }
  }
  return true;
}

/**
 * Gives every crisp-edged shape under `root`, and every unfilled path of horizontal and vertical
 * lines, a stroke width of whole device pixels at `scale`. A width that needs no change clears the
 * earlier one, so the drawing can be snapped again at another scale.
 */
export function snapCrispStrokes(root: ParentNode, scale: number): void {
  snapCrispElements(root.querySelectorAll<SVGElement>(crispSelector), scale);
}

const crispSelector = '[shape-rendering="crispEdges"], path[fill="none"]';

/**
 * `snapCrispStrokes` for some elements only: the ones the document layer has just added or
 * changed (the others keep their snapped width while the scale stays).
 */
export function snapCrispElements(elements: Iterable<Element>, scale: number): void {
  if (!(Number.isFinite(scale) && scale > 0)) {
    return;
  }
  for (const element of elements) {
    if (element instanceof SVGElement) {
      snapCrispStroke(element, scale);
    }
  }
}

/**
 * Snaps one shape. It writes only what differs, so an element that only moved keeps its style as
 * it is; a shape that is no longer a crisp line loses the width it had.
 */
function snapCrispStroke(shape: SVGElement, scale: number): void {
  const isCrisp = shape.getAttribute('shape-rendering') === 'crispEdges';
  const width = Number(shape.getAttribute('stroke-width'));
  const isSnapped =
    width > 0 &&
    (isCrisp ||
      (shape.localName === 'path' &&
        shape.getAttribute('fill') === 'none' &&
        isAxisAlignedPath(shape.getAttribute('d') ?? '')));
  if (!isSnapped) {
    shape.removeAttribute('style');
    return;
  }
  const style = shape.style;
  if (!isCrisp && style.getPropertyValue('shape-rendering') === '') {
    style.shapeRendering = 'crispEdges';
  }
  const snapped = crispStrokeWidth(width, scale);
  const value = snapped === width ? '' : `${String(snapped)}px`;
  if (style.strokeWidth !== value) {
    style.strokeWidth = value;
  }
  if (shape.getAttribute('style') === '') {
    shape.removeAttribute('style');
  }
}
