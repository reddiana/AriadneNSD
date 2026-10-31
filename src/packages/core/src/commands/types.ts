// Shared types of the editing commands (01-model 4).
import type { IdGenerator } from '../model/id';
import type { Content, Id, Seq } from '../model/types';

/**
 * An editing command: a pure function from the content to a new content (01-model 4).
 * One command is one undo step.
 */
export type Command<A> = (content: Content, args: A) => Result;

/** The result of a command. */
export type Result = OkResult | FailResult;

/**
 * The command made a new content. When nothing had to change (for example "insert a process
 * block" on an empty block), `content` is the very same object that was passed in; the editor
 * then pushes nothing on the undo stack.
 */
export type OkResult = {
  readonly ok: true;
  readonly content: Content;
  /** Ids of the nodes made or changed. The editor picks the next selection from them. */
  readonly touched: ReadonlyArray<Id>;
  /** Something the editor should tell the user or ask about after the command. */
  readonly note?: Note;
};

/** A precondition did not hold. Nothing changed; the editor tells the user why. */
export type FailResult = {
  readonly ok: false;
  readonly reason: Reason;
};

/** Why a command did not run. `node` is the node the reason is about, when there is one. */
export type Reason = {
  readonly code: ReasonCode;
  readonly node?: Id;
};

/**
 * The reasons a command can refuse. The editor maps each code to a message in its catalog.
 * - `askConvertIfToCase`: a branch was inserted on an If. The editor asks whether to convert
 *   the If to a Case and, if so, runs `convertIfToCase` (UX MD3).
 */
export type ReasonCode =
  | 'notFound'
  | 'wrongKind'
  | 'notContiguous'
  | 'unsupported'
  | 'alreadyEmpty'
  | 'atTop'
  | 'atBottom'
  | 'atLeftmost'
  | 'atRightmost'
  | 'notInBranch'
  | 'defaultBranchFixed'
  | 'lastArm'
  | 'ifBranchesFixed'
  | 'askConvertIfToCase'
  | 'cannotWrapWithProcess'
  | 'noControlBlock'
  | 'emptyLabel'
  | 'defaultLabelFixed'
  | 'notConvertible'
  | 'emptyClip';

/**
 * A note returned with a successful command.
 * - `offerConvertCaseToIf`: a Case is left with one non-default branch; ask whether to convert
 *   it to an If (UX MD3). On yes the editor runs `convertCaseToIf` as its own undo step.
 * - `checkCondition`: the branches of an If were swapped but the condition was not negated;
 *   tell the user to fix the condition (interaction rules "이동").
 */
export type Note = {
  readonly kind: 'offerConvertCaseToIf' | 'checkCondition';
  readonly node: Id;
};

/**
 * What a command applies to. The editor turns its selection into this.
 * - `blocks`: a contiguous range in one sequence (ADR-0008). `first` and `last` may come in
 *   either order and may be the same block.
 * - `fold`: a whole fold region (its name band or folded box). Acts on the blocks of the region,
 *   but blocks inserted next to it stay outside the region (UX MD1).
 * - `diagramEnd`: nothing is selected; insert at the end of this diagram (interaction rules
 *   "블록 아이콘으로 삽입 · 감싸기").
 */
export type Target =
  | { readonly kind: 'blocks'; readonly first: Id; readonly last: Id }
  | { readonly kind: 'fold'; readonly fold: Id }
  | { readonly kind: 'diagramEnd'; readonly diagram: Id };

/** Where to insert relative to the target. */
export type Side = 'after' | 'before';

/** The block kinds the MVP commands can make. Call blocks come later. */
export type NewBlockKind = 'process' | 'if' | 'case' | 'while' | 'doWhile' | 'for';

/** The control block kinds a selection can be wrapped in (R-EDIT-06). */
export type WrapKind = Exclude<NewBlockKind, 'process'>;

/** Arguments shared by commands that make new ids. */
export type WithIds = {
  /**
   * Issues the new ids. Pass one built with `createIdGenerator(content, idsInView)` so ids still
   * referred to by the view state are not reused. When left out, one is made from the content.
   */
  readonly ids?: IdGenerator;
};

/** Copied blocks: a sequence, with the fold regions that lay inside the copied range. */
export type Clip = Seq;
