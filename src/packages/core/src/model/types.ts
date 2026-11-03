// Model types from docs/04-design/01-model.md, sections 1 and 2.
// All values are immutable (ADR-0029): commands build new objects and share unchanged subtrees.
import type { Locale } from '../i18n/messages';

/**
 * A stable id, unique within a document: a kind prefix and an integer (01-model 1.7).
 * Diagram `d1`, block `b17`, branch `r3`, fold `f2`.
 */
export type Id = string;

// 1.1 Document

/** A document: the content (undoable) and the view state (not undoable). */
export type Doc = {
  readonly content: Content;
  readonly view: View;
};

/** The undoable part of a document. Undo stores snapshots of this. */
export type Content = {
  readonly settings: Settings;
  /** Ordered. At least one (invariant 1). */
  readonly diagrams: ReadonlyArray<Diagram>;
};

/** Document settings. */
export type Settings = {
  /** The language of block text (R-LAY-06): how block text is highlighted (ADR-0032). */
  readonly textKind: TextKind;
  /** The color set of the drawing (visual design 8): `default`, `dark`, `high-contrast`, `print`. */
  readonly theme: ThemeId;
  /** Header shape: the hat or arch shape, or like a title (R-LAY-10). */
  readonly headStyle: 'shape' | 'title';
  /**
   * The language of the fixed words drawn in the picture ("true" / "false", "(no name)"), the
   * same on screen, in the saved file and in PNG (ADR-0041). Menus follow the screen language.
   */
  readonly locale: Locale;
  /**
   * Text as outlines (R-FMT-10): the saved file draws text with the bundled font's glyph
   * outlines (paths) instead of the subset font, so every viewer shows the same glyphs. The
   * model keeps the text. Absent means off.
   */
  readonly textOutlines?: boolean;
};

/**
 * The language of block text (01-model 1.1). `plain` is not highlighted. All languages draw with
 * the same block font (ADR-0042), so changing the language never changes the layout.
 */
export type TextKind = 'plain' | 'c' | 'cpp' | 'java' | 'javascript' | 'python' | 'bash';

/**
 * A theme name (01-file-format 3.3). The file keeps the name only, not the colors; an unknown
 * name is drawn with the default theme and kept as it is (ADR-0044).
 */
export type ThemeId = string;

// 1.2 Diagram and header

/** One diagram: an optional header and a body. */
export type Diagram = {
  readonly id: Id;
  /** `null` means no header: the diagram has no kind and cannot be called. */
  readonly head: Head | null;
  readonly body: Seq;
};

/** The header of a diagram. */
export type Head = {
  readonly kind: 'event' | 'method';
  /**
   * Event: the whole text is the name.
   * Method: the name is before the first '(' and the parameters are inside (ADR-0022).
   */
  readonly text: string;
};

// 1.3 Sequence

/** An ordered sequence of blocks: a diagram body, a branch body, or a loop body. */
export type Seq = {
  /** Never empty (invariant 2). */
  readonly blocks: ReadonlyArray<Block>;
  /** Fold regions marked on this sequence (ADR-0017). */
  readonly folds: ReadonlyArray<FoldMark>;
};

/**
 * A fold region: a marker on a sequence, not a container (ADR-0017).
 * The range is given by block ids, so inserting or deleting blocks rarely touches it.
 */
export type FoldMark = {
  readonly id: Id;
  /** The first block of the range. */
  readonly first: Id;
  /** The last block of the range. May be the same as `first`. */
  readonly last: Id;
  /** Without a name, the editor shows a default name ("<first block text> and n more"). */
  readonly name?: string;
};

// 1.4 Blocks

/** A block. Discriminated by `kind`. */
export type Block = Process | If | Case | While | DoWhile | For | Call;

/** The kind of a block. */
export type BlockKind = Block['kind'];

/** A process block. An empty block is a process block with empty text. */
export type Process = {
  readonly id: Id;
  readonly kind: 'process';
  readonly text: string;
};

/** An If block with a true branch and a false branch. */
export type If = {
  readonly id: Id;
  readonly kind: 'if';
  /** The condition. */
  readonly text: string;
  readonly yes: Branch;
  readonly no: Branch;
};

/**
 * A Case block. The model allows a Case without a default branch and a Case with only a default
 * branch (code import, R-IDE-03); editing commands keep narrower preconditions (UX MD3).
 */
export type Case = {
  readonly id: Id;
  readonly kind: 'case';
  /** The value to compare. */
  readonly text: string;
  /** The non-default branches, in order. */
  readonly arms: ReadonlyArray<Arm>;
  /** The default branch. When present it is always last. */
  readonly otherwise: Branch | null;
};

/**
 * A branch of an If, or the default branch of a Case.
 * Without a label, the editor shows its own text ("true" / "false", "default").
 */
export type Branch = {
  readonly id: Id;
  readonly label?: string;
  readonly body: Seq;
};

/** A non-default branch of a Case. */
export type Arm = {
  readonly id: Id;
  /** For example `1` or `'a'..'z'`. */
  readonly label: string;
  readonly body: Seq;
};

/** A While loop. */
export type While = {
  readonly id: Id;
  readonly kind: 'while';
  readonly text: string;
  readonly body: Seq;
};

/** A Do-While loop. Repeat-Until has the same shape and differs only in the text. */
export type DoWhile = {
  readonly id: Id;
  readonly kind: 'doWhile';
  readonly text: string;
  readonly body: Seq;
};

/** A For loop. */
export type For = {
  readonly id: Id;
  readonly kind: 'for';
  readonly text: string;
  readonly body: Seq;
};

// 1.5 Call block

/** A call block. */
export type Call = {
  readonly id: Id;
  readonly kind: 'call';
  readonly target: CallTarget;
  /** The arguments. One line. */
  readonly args: string;
  /** What receives the return value. One line. When empty, the result symbol is not shown. */
  readonly result: string;
  /** Fold regions that exist only at this call site while it is opened inline (1.6). */
  readonly siteFolds: ReadonlyArray<SiteFold>;
};

/** What a call block calls (01-model 1.5). */
export type CallTarget =
  /** A Method in the same document, by id only (ADR-0022). Always exists (invariant 6). */
  | { readonly kind: 'local'; readonly diagram: Id }
  /** Called by a written name. */
  | { readonly kind: 'named'; readonly name: string }
  /** A Method in another document. `lastName` caches the last name seen. */
  | {
      readonly kind: 'external';
      readonly file: string;
      readonly diagram: Id;
      readonly lastName: string;
    }
  /** The target was lost (diagram deleted or header removed). Keeps the last shown name. */
  | { readonly kind: 'lost'; readonly lastName: string; readonly file?: string };

// 1.6 Fold regions at an opened call site

/** A fold region inside a call block opened inline. Belongs to the outermost call block. */
export type SiteFold = {
  readonly id: Id;
  /** Ids of the inner call blocks opened inside this one. `[]` for directly inside. */
  readonly via: ReadonlyArray<Id>;
  /** A block id of the called Method. May dangle; layout then shrinks the range. */
  readonly first: Id;
  readonly last: Id;
  readonly name?: string;
};

// 2. View state

/**
 * The view state. Not undoable. It refers to content ids weakly: dangling ids are not errors,
 * layout ignores them, and serialization writes only existing ids (01-model 2).
 */
export type View = {
  /** Folded things: fold regions (FoldMark, SiteFold), branches (If, Case), loop blocks (body). */
  readonly folded: ReadonlyArray<Id>;
  /** Call blocks opened inline. A nested one is written as a path. */
  readonly opened: ReadonlyArray<Path>;
  /** Whether name bands are shown. */
  readonly bands: boolean;
  readonly resultSymbol: '←' | '=';
};

/** [outer call block id, call block id opened inside it, …]. */
export type Path = ReadonlyArray<Id>;
