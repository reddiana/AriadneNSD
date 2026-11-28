// Runs in the browser (the gallery page): build.mjs puts it before gallery.js, in the same script.
// Even straight lines at any display scale (M88), the editor's rule (visual design 9.1, 9.2;
// packages/editor/src/dom/crisp-lines.ts) for the gallery's plain script. At a scale such as 150%
// a 1px stroke is 1.5 device pixels: the browser rounds a crisp-edged one to one pixel or two,
// depending on where it lands, and blurs a path over two, so lines of the same kind look thick,
// thin or blurred. A stroke of a whole number of device pixels looks the same wherever it lands.
// Keep the two in step (T-1630 checks this copy against the same cases).

/** The width that covers a whole number of device pixels at `scale`, at least one. */
function crispStrokeWidth(width, scale) {
  return Math.max(1, Math.round(width * scale)) / scale;
}

const crispNumber = String.raw`-?\d+(?:\.\d+)?`;
const crispStraightPath = new RegExp(
  String.raw`^M${crispNumber} ${crispNumber}(?: L${crispNumber} ${crispNumber})+$`,
);

/** Whether a path's data is a line through points with only horizontal and vertical steps. */
function isAxisAlignedPath(data) {
  if (!crispStraightPath.test(data)) return false;
  const values = data.match(new RegExp(crispNumber, 'g')).map(Number);
  for (let index = 2; index < values.length; index += 2) {
    const isVertical = values[index] === values[index - 2];
    const isHorizontal = values[index + 1] === values[index - 1];
    if (!isVertical && !isHorizontal) return false;
  }
  return true;
}

/**
 * Gives every crisp-edged shape under `root`, and every unfilled path of horizontal and vertical
 * lines (drawn crisp too), a stroke of whole device pixels at `scale`. Diagonals and curves stay
 * anti-aliased. Only the page changes, not the file.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- gallery.js calls it
function snapCrispStrokes(root, scale) {
  if (!(Number.isFinite(scale) && scale > 0)) return;
  for (const shape of root.querySelectorAll('[shape-rendering="crispEdges"], path[fill="none"]')) {
    snapCrispStroke(shape, scale);
  }
}

function snapCrispStroke(shape, scale) {
  const isCrisp = shape.getAttribute('shape-rendering') === 'crispEdges';
  const width = Number(shape.getAttribute('stroke-width'));
  const isSnapped =
    width > 0 &&
    (isCrisp ||
      (shape.localName === 'path' &&
        shape.getAttribute('fill') === 'none' &&
        isAxisAlignedPath(shape.getAttribute('d') ?? '')));
  if (!isSnapped) return;
  if (!isCrisp) shape.style.shapeRendering = 'crispEdges';
  const snapped = crispStrokeWidth(width, scale);
  shape.style.strokeWidth = snapped === width ? '' : `${String(snapped)}px`;
}
