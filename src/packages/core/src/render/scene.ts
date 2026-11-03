// The scene: a display list of shapes, each tagged with the block it belongs to (ADR-0030).
// All decisions about color and shape are made while building it; backends only translate it.
import type { Id } from '../model/types';

/** A point `[x, y]` in drawing coordinates. */
export type Point = readonly [x: number, y: number];

/**
 * One step of a path: move to a point, a line to a point, or a cubic Bézier curve through two
 * control points to a point. A path is always closed after its last segment.
 */
export type PathSegment =
  | { readonly kind: 'move'; readonly to: Point }
  | { readonly kind: 'line'; readonly to: Point }
  | { readonly kind: 'curve'; readonly c1: Point; readonly c2: Point; readonly to: Point };

/** A run of text with one weight and color, inside a text element. */
export type TextRun = {
  readonly text: string;
  /** 400 regular or 600 bold (visual design 4.2). */
  readonly weight: 400 | 600;
  /** The run's own color: a syntax color (R-LAY-07). Without it, the text element's color. */
  readonly fill?: string;
  /** Slanted: a default fold region name, the words of a folded row (visual design 4.2). */
  readonly isItalic?: true;
};

/** One element of the display list. `blockId` is the block it belongs to. */
export type SceneElement =
  | {
      /** An axis-aligned rectangle, drawn with crisp edges (visual design 9.1). */
      readonly kind: 'rect';
      readonly blockId: Id;
      readonly x: number;
      readonly y: number;
      readonly width: number;
      readonly height: number;
      readonly fill: string;
      readonly stroke: string;
      readonly strokeWidth: number;
    }
  | {
      /** An open line through points, not filled. Diagonals stay anti-aliased (9.1). */
      readonly kind: 'polyline';
      readonly blockId: Id;
      readonly points: ReadonlyArray<Point>;
      readonly stroke: string;
      readonly strokeWidth: number;
      /** Dash and gap lengths, or `null` for a solid line. */
      readonly dash: readonly [number, number] | null;
      /** Round line ends, for the small `∅` symbol; flat (butt) ends otherwise. */
      readonly isRoundCap: boolean;
    }
  | {
      /** A filled, closed outline of lines and cubic curves: the Event hat and Method arch. */
      readonly kind: 'path';
      readonly blockId: Id;
      readonly segments: ReadonlyArray<PathSegment>;
      readonly fill: string;
      readonly stroke: string;
      readonly strokeWidth: number;
    }
  | {
      /** A circle outline: part of the `∅` symbol, drawn as a shape (visual design 2). */
      readonly kind: 'circle';
      readonly blockId: Id;
      readonly cx: number;
      readonly cy: number;
      readonly r: number;
      readonly stroke: string;
      readonly strokeWidth: number;
    }
  | {
      /** One line of text. `y` is the baseline. Whitespace is kept as written. */
      readonly kind: 'text';
      readonly blockId: Id;
      readonly x: number;
      readonly y: number;
      readonly anchor: 'start' | 'middle' | 'end';
      readonly fontSize: number;
      readonly fill: string;
      readonly runs: ReadonlyArray<TextRun>;
      /** A background-colored outline behind the text (UX BH1), or `null`. */
      readonly halo: { readonly color: string; readonly width: number } | null;
    };

/** A scene: what to draw and how big the picture is. */
export type Scene = {
  readonly width: number;
  readonly height: number;
  /** The paper color of the theme. The picture is never transparent (visual design 2). */
  readonly paper: string;
  /** The CSS font family list of all text: the bundled font, then fallbacks (R-FMT-07). */
  readonly fontFamily: string;
  /** In paint order. */
  readonly elements: ReadonlyArray<SceneElement>;
};
