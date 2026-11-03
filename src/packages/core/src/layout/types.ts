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
 * Set on what is drawn inside an opened call block (R-EDIT-15): its text is grey and it cannot
 * be edited (visual design 3.3 `peek.text`). Left out elsewhere.
 */
export type Peeked = { readonly isPeeked?: true };

/** The words of a call block in three parts: the result and its symbol, the name, the arguments. */
export type CallWords = {
  /** Text before the bold name (result and result symbol). */
  readonly before: string;
  readonly name: string;
  readonly after: string;
};

/**
 * One drawn thing, in paint order (outer before inner, frames after what they frame). The scene
 * builder turns these into display list elements; it does not measure text or look at the model.
 * Inside an opened call block the ids are screen ids (`b4/b17`, `shown.ts`).
 */
export type LayoutNode =
  | (Peeked & {
      readonly kind: 'process';
      readonly id: Id;
      readonly box: Box;
      readonly text: PlacedText;
      /** The only, empty block of an If or Case branch: drawn with `∅` (UX E1, R-LAY-09). */
      readonly isEmptyBranch: boolean;
    })
  | (Peeked &
      CallWords & {
        readonly kind: 'call';
        readonly id: Id;
        readonly box: Box;
        /** The target is lost: the double bars are dashed. */
        readonly isLost: boolean;
      })
  | (Peeked & {
      readonly kind: 'loop';
      readonly id: Id;
      readonly loop: 'while' | 'doWhile' | 'for';
      readonly box: Box;
      /** The header: on top for While and For, at the bottom for Do-While (02-layout 1.4). */
      readonly head: Box;
      readonly text: PlacedText;
    })
  | (Peeked & {
      readonly kind: 'if';
      readonly id: Id;
      readonly box: Box;
      readonly head: Box;
      readonly text: PlacedText;
      /** The x of the diagonals' vertex: the border between the true and false branches. */
      readonly splitX: number;
      readonly yes: BranchLabel;
      readonly no: BranchLabel;
    })
  | (Peeked & {
      readonly kind: 'case';
      readonly id: Id;
      readonly box: Box;
      readonly head: Box;
      readonly text: PlacedText;
      /** The arms in order, then the default column (always last). */
      readonly columns: ReadonlyArray<CaseColumn>;
    })
  | (Peeked & {
      /**
       * A folded branch or loop body: one row "⋯ n blocks" in its place (R-EDIT-13). `id` is the
       * branch's id, or the loop block's for its body.
       */
      readonly kind: 'foldedSeq';
      readonly id: Id;
      readonly box: Box;
      /** The words after the dots, in the drawing language. */
      readonly text: string;
    })
  | (Peeked & {
      /** A folded fold region: one cell with its name (R-EDIT-14). `id` is the region's. */
      readonly kind: 'foldCell';
      readonly id: Id;
      readonly box: Box;
      readonly name: PlacedText;
      /** Without a name of its own the default name is drawn slanted (visual design 4.2). */
      readonly isNamed: boolean;
    })
  | {
      /**
       * An unfolded fold region with name bands on: a thick border and the name band on top
       * (interaction rules "접기 · 펼치기"). Painted after the blocks inside it.
       */
      readonly kind: 'foldFrame';
      readonly id: Id;
      readonly box: Box;
      readonly band: Box;
      readonly name: PlacedText;
      readonly isNamed: boolean;
    }
  | (Peeked &
      CallWords & {
        /**
         * An opened call block (R-EDIT-15): a thin dashed border and a band with the call's
         * text; the called Method's blocks are drawn inside. Painted after them.
         */
        readonly kind: 'peek';
        readonly id: Id;
        readonly box: Box;
        readonly band: Box;
      })
  | {
      /**
       * The header of a diagram (02-layout 1.5): an Event hat or Method arch (`shape`), or a
       * label, a bold name and a rule (`title`). `id` is the diagram's id.
       */
      readonly kind: 'diagramHead';
      readonly id: Id;
      readonly headKind: 'event' | 'method';
      readonly style: 'shape' | 'title';
      readonly box: Box;
      readonly text: PlacedText;
    }
  | (Peeked & {
      /** The empty default cell drawn for a Case without a default branch (UX CD1). */
      readonly kind: 'missingDefault';
      readonly caseId: Id;
      readonly box: Box;
    });

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
  | { readonly kind: 'missingDefault'; readonly blockId: Id; readonly box: Box }
  /** The header of a diagram (Event or Method). */
  | { readonly kind: 'diagramHead'; readonly diagramId: Id; readonly box: Box }
  /** The row of a folded branch or loop body. `owner` is the branch's or the loop block's id. */
  | { readonly kind: 'foldedSeq'; readonly owner: Id; readonly box: Box }
  /** A fold region's name band (unfolded) or its cell (folded). */
  | { readonly kind: 'fold'; readonly foldId: Id; readonly isFolded: boolean; readonly box: Box }
  /** The band of an opened call block. */
  | { readonly kind: 'peekBand'; readonly blockId: Id; readonly box: Box }
  /**
   * The fold triangle (`▸` `▾`) in front of a name band, a folded cell or an opened call's band.
   * Drawn on the editing layer only, so it is not saved (UX Q2); the room is in the layout.
   */
  | {
      readonly kind: 'toggle';
      readonly what: 'fold' | 'peek';
      /** The fold region's or the call block's id. */
      readonly target: Id;
      /** Whether it is open now: `▾` (open) or `▸` (folded). */
      readonly isOpen: boolean;
      readonly box: Box;
    };

/** Where one diagram is. */
export type DiagramLayout = {
  readonly id: Id;
  /** The whole diagram: header and body. */
  readonly box: Box;
  /** The header, or `null` for a diagram without one. */
  readonly head: Box | null;
  readonly body: Box;
};

/** The result of `layout`. Pure data: the same document gives the same result (R-FMT-03). */
export type LayoutResult = {
  /** The whole picture including the paper margin (`space.paper`). */
  readonly width: number;
  readonly height: number;
  readonly diagrams: ReadonlyArray<DiagramLayout>;
  /**
   * Bounding boxes by id: blocks, branches (the branch's sequence below the header), diagrams,
   * fold regions. A block hidden in a folded branch or region gets the box of what is drawn in
   * its place, so selecting it outlines that (02-layout 1.1).
   */
  readonly boxes: ReadonlyMap<Id, Box>;
  readonly regions: ReadonlyArray<HitRegion>;
  /** What to draw, in paint order. */
  readonly nodes: ReadonlyArray<LayoutNode>;
};
