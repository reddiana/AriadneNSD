// Commands on call blocks (01-model 1.5, 4.1 "호출", interaction rules "호출 블록").
import { headParams } from '../model/head';
import type { Call, Content, Diagram, Id } from '../model/types';
import { done, fail, failWith, idsFor, isReason, resolveTarget, unchanged } from './common';
import { addDiagram, calls, checkHeadName, filledArgs } from './diagram';
import { putBlocks } from './insert';
import { indexContent, replaceBlock } from './tree';
import type { FailResult, Result, Side, Target, WithIds } from './types';

/** Arguments of `editCall`. A field left out stays as it is. */
export type EditCallArgs = {
  readonly block: Id;
  /** The arguments. Line breaks become spaces (one line). */
  readonly args?: string;
  /** What receives the return value. Line breaks become spaces (one line). */
  readonly result?: string;
};

/**
 * Sets the arguments and the result of a call block (R-BLK-07). Both are one line, so line
 * breaks become spaces. Calling a Method that receives something, empty arguments are refilled
 * with the text inside its parentheses (interaction rules "텍스트 편집"). A call block that lost
 * its target cannot be edited (`lostTarget`). The same text as before leaves the content as it
 * is. Touched: the call block.
 */
export function editCall(content: Content, args: EditCallArgs): Result {
  const index = indexContent(content);
  const entry = index.blocks.get(args.block);
  if (entry === undefined) {
    return fail('notFound', args.block);
  }
  const call = entry.block;
  if (call.kind !== 'call') {
    return fail('wrongKind', args.block);
  }
  if (call.target.kind === 'lost') {
    return fail('lostTarget', args.block);
  }
  let newArgs = args.args === undefined ? call.args : oneLine(args.args);
  if (args.args !== undefined && call.target.kind === 'local') {
    newArgs = filledArgs(newArgs, paramsOf(index.diagrams.get(call.target.diagram)));
  }
  const newResult = args.result === undefined ? call.result : oneLine(args.result);
  if (newArgs === call.args && newResult === call.result) {
    return unchanged(content, [call.id]);
  }
  const next = replaceBlock(content, entry, () => ({ ...call, args: newArgs, result: newResult }));
  return done(next, [call.id]);
}

/** Arguments of `setCallTarget`. */
export type SetCallTargetArgs = {
  readonly block: Id;
  /** A Method of this document. */
  readonly diagram: Id;
};

/**
 * Makes a call block call a Method of this document (R-BLK-07, 01-model 1.5 "호출할 것
 * 바꾸기"), whatever it called before, a lost target included. The arguments and the result
 * stay; empty arguments take the text inside the Method's parentheses. Fold regions of the old
 * opened call site go, since they named blocks of the old Method. Only a Method can be called:
 * an Event or a diagram without a header is refused (`wrongKind`). Calling the same Method again
 * leaves the content as it is. Touched: the call block.
 */
export function setCallTarget(content: Content, args: SetCallTargetArgs): Result {
  const index = indexContent(content);
  const entry = index.blocks.get(args.block);
  if (entry === undefined) {
    return fail('notFound', args.block);
  }
  const call = entry.block;
  if (call.kind !== 'call') {
    return fail('wrongKind', args.block);
  }
  const method = methodOf(index.diagrams, args.diagram);
  if ('ok' in method) {
    return method;
  }
  if (calls(call, method.id)) {
    return unchanged(content, [call.id]);
  }
  const next = replaceBlock(content, entry, () => ({
    ...call,
    target: { kind: 'local', diagram: method.id },
    args: filledArgs(call.args, paramsOf(method)),
    siteFolds: [],
  }));
  return done(next, [call.id]);
}

/** Arguments of `insertCall`. */
export type InsertCallArgs = WithIds & {
  readonly target: Target;
  readonly side: Side;
  /** The Method to call: a diagram of this document with a Method header. */
  readonly diagram: Id;
};

/**
 * Inserts a call block calling a Method of this document after (or before) the target, or in
 * place of an empty block, like `insertBlock` (R-BLK-07). Its arguments start as the text inside
 * the Method's parentheses (empty without them) and its result empty (interaction rules "호출
 * 블록"). Only a Method can be called (`wrongKind`). Touched: the new call block.
 */
export function insertCall(content: Content, args: InsertCallArgs): Result {
  const index = indexContent(content);
  const method = methodOf(index.diagrams, args.diagram);
  if ('ok' in method) {
    return method;
  }
  const range = resolveTarget(index, args.target);
  if (isReason(range)) {
    return failWith(range);
  }
  const ids = idsFor(content, args);
  const block = newCall(ids.next('block'), method.id, paramsOf(method));
  const side = args.target.kind === 'diagramEnd' ? 'after' : args.side;
  const next = putBlocks(content, range, side, { blocks: [block], folds: [] });
  return done(next, [block.id]);
}

/** Arguments of `newMethodAndCall`. */
export type NewMethodAndCallArgs = WithIds & {
  readonly target: Target;
  readonly side: Side;
  /** The header text of the new Method. Left out, it gets the default name ("Method 1" …). */
  readonly text?: string;
};

/**
 * Makes a new empty Method and inserts a call block calling it, in one undo step ("새 Method를
 * 만들고 호출" in the list of Methods, interaction rules "호출 블록"). The Method goes after the
 * last Method, like `newDiagram`; the call block goes where `insertCall` would put it. A given
 * name must be valid (`emptyHeadName`, `duplicateHeadName`). Touched: the new diagram, then the
 * new call block.
 */
export function newMethodAndCall(content: Content, args: NewMethodAndCallArgs): Result {
  const range = resolveTarget(indexContent(content), args.target);
  if (isReason(range)) {
    return failWith(range);
  }
  const text = args.text ?? null;
  if (text !== null) {
    const clash = checkHeadName(content, { kind: 'method', text }, null);
    if (clash !== null) {
      return failWith(clash);
    }
  }
  const ids = idsFor(content, args);
  const made = addDiagram(content, 'method', text, ids);
  const method = made.content.diagrams.find((d) => d.id === made.diagram);
  const block = newCall(ids.next('block'), made.diagram, paramsOf(method));
  // The new diagram does not hold the target's sequence, so the range still names it.
  const side = args.target.kind === 'diagramEnd' ? 'after' : args.side;
  const next = putBlocks(made.content, range, side, { blocks: [block], folds: [] });
  return done(next, [made.diagram, block.id]);
}

/** A new call block calling `diagram`, with the Method's parameters as its arguments. */
function newCall(id: Id, diagram: Id, params: string | null): Call {
  return {
    id,
    kind: 'call',
    target: { kind: 'local', diagram },
    args: params ?? '',
    result: '',
    siteFolds: [],
  };
}

/** The diagram if it is a Method, or why it cannot be called. */
function methodOf(diagrams: ReadonlyMap<Id, Diagram>, id: Id): Diagram | FailResult {
  const diagram = diagrams.get(id);
  if (diagram === undefined) {
    return fail('notFound', id);
  }
  return diagram.head?.kind === 'method' ? diagram : fail('wrongKind', id);
}

/** What a diagram receives, `null` when it is not a Method with parentheses. */
function paramsOf(diagram: Diagram | undefined): string | null {
  return diagram?.head === undefined || diagram.head === null ? null : headParams(diagram.head);
}

/** One line: line breaks become spaces. */
function oneLine(text: string): string {
  return text.replace(/\r\n|\r|\n/g, ' ');
}
