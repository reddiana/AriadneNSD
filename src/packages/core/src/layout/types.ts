// The result of layout (02-layout 1.1): where every diagram and block is, and where to click.
import type { Id } from '../model/types';

/** An axis-aligned rectangle in drawing coordinates (whole px, origin at the paper's top left). */
export type Box = {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
};

/** Text placed by layout: the lines and the measured width of the longest one. */
export type PlacedText = {
  readonly lines: ReadonlyArray<string>;
  readonly width: number;
};

/** A branch label of an If or Case, placed in the label row of the header. */
export type BranchLabel = {
  readonly text: string;
  /** The column of the branch below the header. */
  readonly column: Box;
};

/** A column of a Case: one branch under the header. */
export type CaseColumn = {
  /** The branch id; `null` for the drawn default cell of a Case without one (UX CD1). */
  readonly branchId: Id | null;
  readonly isDefault: boolean;
  readonly label: BranchLabel;
};

/**
 * One drawn thing, in paint order (outer before inner). The scene builder turns these into
 * display list elements; it does not measure text or look at the model.
 */
export type LayoutNode =
  | {
      readonly kind: 'process';
      readonly id: Id;
      readonly box: Box;
      readonly text: PlacedText;
      /** The only, empty block of an If or Case branch: drawn with `∅` (UX E1, R-LAY-09). */
      readonly isEmptyBranch: boolean;
    }
  | {
      readonly kind: 'call';
      readonly id: Id;
      readonly box: Box;
      /** Text before the bold name (result and result symbol), the name, and the arguments. */
      readonly before: string;
      readonly name: string;
      readonly after: string;
      /** The target is lost: the double bars are dashed. */
      readonly isLost: boolean;
    }
  | {
      readonly kind: 'loop';
      readonly id: Id;
      readonly loop: 'while' | 'doWhile' | 'for';
      readonly box: Box;
      /** The header: on top for While and For, at the bottom for Do-While (02-layout 1.4). */
      readonly head: Box;
      readonly text: PlacedText;
    }
  | {
      readonly kind: 'if';
      readonly id: Id;
      readonly box: Box;
      readonly head: Box;
      readonly text: PlacedText;
      /** The x of the diagonals' vertex: the border between the true and false branches. */
      readonly splitX: number;
      readonly yes: BranchLabel;
      readonly no: BranchLabel;
    }
  | {
      readonly kind: 'case';
      readonly id: Id;
      readonly box: Box;
      readonly head: Box;
      readonly text: PlacedText;
      /** The arms in order, then the default column (always last). */
      readonly columns: ReadonlyArray<CaseColumn>;
    }
  | {
      /** The empty default cell drawn for a Case without a default branch (UX CD1). */
      readonly kind: 'missingDefault';
      readonly caseId: Id;
      readonly box: Box;
    };

/**
 * A click region: the place that selects something, separate from its bounding box
 * (02-layout 1.1). Regions are listed outer before inner; a later region that contains the point
 * is on top (03-editor 3.1: the innermost wins).
 */
export type HitRegion =
  /** A process or call block: the whole box. */
  | { readonly kind: 'block'; readonly blockId: Id; readonly box: Box }
  /** The header of a control block (If, Case, loop). */
  | { readonly kind: 'head'; readonly blockId: Id; readonly box: Box }
  /**
   * The label row of one branch of an If or Case. `branchId` is `null` for the drawn default of
   * a Case without one; `index` counts the columns from the left.
   */
  | {
      readonly kind: 'branchLabel';
      readonly blockId: Id;
      readonly branchId: Id | null;
      readonly index: number;
      readonly box: Box;
    }
  /** The empty default cell of a Case without a default branch (UX CD1). */
  | { readonly kind: 'missingDefault'; readonly blockId: Id; readonly box: Box };

/** Where one diagram is. */
export type DiagramLayout = {
  readonly id: Id;
  /** The whole diagram: header and body. */
  readonly box: Box;
  /** The header. Always `null` in the MVP layout (headers come after the MVP). */
  readonly head: Box | null;
  readonly body: Box;
};

/** The result of `layout`. Pure data: the same document gives the same result (R-FMT-03). */
export type LayoutResult = {
  /** The whole picture including the paper margin (`space.paper`). */
  readonly width: number;
  readonly height: number;
  readonly diagrams: ReadonlyArray<DiagramLayout>;
  /** Bounding boxes by id: blocks, branches (the branch's sequence below the header), diagrams. */
  readonly boxes: ReadonlyMap<Id, Box>;
  readonly regions: ReadonlyArray<HitRegion>;
  /** What to draw, in paint order. */
  readonly nodes: ReadonlyArray<LayoutNode>;
};
