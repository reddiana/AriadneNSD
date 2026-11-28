// Commands on call blocks (01-model 1.5, 4.1 "호출", interaction rules "호출 블록").
import { headName, headParams } from '../model/head';
import type { Call, Content, Diagram, Id } from '../model/types';
import { done, fail, failWith, idsFor, isReason, resolveTarget, unchanged } from './common';
import { addDiagram, calls, checkHeadName, filledArgs } from './diagram';
import { keepingOut, putBlocks } from './insert';
import { indexContent, mapCalls, replaceBlock } from './tree';
import type { FailResult, Result, Side, Target, WithIds } from './types';

/** Arguments of `editCall`. A field left out stays as it is. */
export type EditCallArgs = {
  readonly block: Id;
  /** The arguments. Line breaks become spaces (one line). */
  readonly args?: string;
  /** What receives the return value. Line breaks become spaces (one line). */
  readonly result?: string;
  /** The written name of a call by name (R-BLK-08). One line, without surrounding spaces. */
  readonly name?: string;
};

/**
 * Sets the arguments and the result of a call block (R-BLK-07). Both are one line, so line
 * breaks become spaces. Calling a Method that receives something, empty arguments are refilled
 * with the text inside its parentheses (interaction rules "텍스트 편집"). A call by a written
 * name, a call whose Method went away included (ADR-0049), also takes a new `name`
 * (R-BLK-08); it cannot become empty once written (`emptyCallName`, UX Q4), and a name is only
 * written on such a call (`wrongKind`). The same text as before leaves the content as it is.
 * Touched: the call block.
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
  let newArgs = args.args === undefined ? call.args : oneLine(args.args);
  if (args.args !== undefined && call.target.kind === 'local') {
    newArgs = filledArgs(newArgs, paramsOf(index.diagrams.get(call.target.diagram)));
  }
  const newResult = args.result === undefined ? call.result : oneLine(args.result);
  let target = call.target;
  if (args.name !== undefined) {
    if (target.kind !== 'named') {
      return fail('wrongKind', args.block);
    }
    const name = oneLine(args.name).trim();
    if (name === '' && target.name !== '') {
      return fail('emptyCallName', args.block);
    }
    target = name === target.name ? target : { kind: 'named', name };
  }
  if (newArgs === call.args && newResult === call.result && target === call.target) {
    return unchanged(content, [call.id]);
  }
  const next = replaceBlock(content, entry, () => ({
    ...call,
    target,
    args: newArgs,
    result: newResult,
  }));
  return done(next, [call.id]);
}

/** Arguments of `insertNamedCall`. */
export type InsertNamedCallArgs = WithIds & {
  readonly target: Target;
  readonly side: Side;
  /** The name to call, as written. Usually empty: the editor opens the name field at once. */
  readonly name: string;
  /** The call block goes outside the fold regions starting or ending there (see `InsertBlockArgs`). */
  readonly outsideFolds?: boolean;
};

/**
 * Inserts a call block that calls something by a written name: a library function, or a
 * subroutine not drawn yet (R-BLK-08). It looks like any call block (UX CB1). Placed like
 * `insertBlock`. Touched: the new call block.
 */
export function insertNamedCall(content: Content, args: InsertNamedCallArgs): Result {
  const range = resolveTarget(indexContent(content), args.target);
  if (isReason(range)) {
    return failWith(range);
  }
  const ids = idsFor(content, args);
  const block: Call = {
    id: ids.next('block'),
    kind: 'call',
    target: { kind: 'named', name: oneLine(args.name).trim() },
    args: '',
    result: '',
    siteFolds: [],
  };
  const side = args.target.kind === 'diagramEnd' ? 'after' : args.side;
  const next = putBlocks(content, keepingOut(range, args.outsideFolds), side, {
    blocks: [block],
    folds: [],
  });
  return done(next, [block.id]);
}

/** Arguments of `nameCallTarget`. */
export type NameCallTargetArgs = {
  readonly block: Id;
  /** The name to call. */
  readonly name: string;
};

/**
 * Makes a call block call a written name instead of what it called (R-BLK-08, "호출할 Method
 * 바꾸기" → "이름을 적어 호출하기"). The arguments and the result stay; the fold regions of an
 * opened call site go, since there is nothing to open. Touched: the call block.
 */
export function nameCallTarget(content: Content, args: NameCallTargetArgs): Result {
  const entry = indexContent(content).blocks.get(args.block);
  if (entry === undefined) {
    return fail('notFound', args.block);
  }
  const call = entry.block;
  if (call.kind !== 'call') {
    return fail('wrongKind', args.block);
  }
  const name = oneLine(args.name).trim();
  if (call.target.kind === 'named' && call.target.name === name) {
    return unchanged(content, [call.id]);
  }
  const next = replaceBlock(content, entry, () => ({
    ...call,
    target: { kind: 'named', name },
    siteFolds: [],
  }));
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
 * 바꾸기"), whatever it called before, a written name included. The arguments and the result
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
  /** The call block goes outside the fold regions starting or ending there (see `InsertBlockArgs`). */
  readonly outsideFolds?: boolean;
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
  const next = putBlocks(content, keepingOut(range, args.outsideFolds), side, {
    blocks: [block],
    folds: [],
  });
  return done(next, [block.id]);
}

/** Arguments of `newMethodAndCall`. */
export type NewMethodAndCallArgs = WithIds & {
  readonly target: Target;
  readonly side: Side;
  /** The header text of the new Method. Left out, it gets the default name ("Method 1" …). */
  readonly text?: string;
  /** The call block goes outside the fold regions starting or ending there (see `InsertBlockArgs`). */
  readonly outsideFolds?: boolean;
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
  const next = putBlocks(made.content, keepingOut(range, args.outsideFolds), side, {
    blocks: [block],
    folds: [],
  });
  return done(next, [made.diagram, block.id]);
}

/** Arguments of `makeMethod`. */
export type MakeMethodArgs = WithIds & {
  /** A call block calling by a written name. */
  readonly block: Id;
};

/**
 * Makes the Method a call by a written name calls, in one undo step (R-EDIT-26, "Method
 * 만들기"). The new Method's header is `name(args)` with the call block's arguments, or `name`
 * when it has none, and its body one empty block; it goes after the last Method, like
 * `newDiagram`. Every call block of the document calling the same name then calls it, with the
 * arguments refilled like `setCallTarget`. When a Method of that name is already there (a file
 * written by hand), the call blocks call it and nothing is made. Refused: not a call by name
 * (`wrongKind`), an empty name (`emptyHeadName`), an Event of that name (`duplicateHeadName`).
 * Touched: the Method, then the call blocks that now call it.
 */
export function makeMethod(content: Content, args: MakeMethodArgs): Result {
  const entry = indexContent(content).blocks.get(args.block);
  if (entry === undefined) {
    return fail('notFound', args.block);
  }
  const call = entry.block;
  if (call.kind !== 'call' || call.target.kind !== 'named') {
    return fail('wrongKind', args.block);
  }
  const name = call.target.name.trim();
  const text = call.args.trim() === '' ? name : `${name}(${call.args})`;
  const head = { kind: 'method', text } as const;
  const existing = content.diagrams.find(
    (d) => d.head?.kind === 'method' && headName(d.head) === headName(head),
  );
  let next = content;
  let method: Diagram;
  if (existing === undefined) {
    const clash = checkHeadName(content, head, null);
    if (clash !== null) {
      return failWith({ ...clash, node: call.id });
    }
    const made = addDiagram(content, 'method', text, idsFor(content, args));
    next = made.content;
    const found = next.diagrams.find((d) => d.id === made.diagram);
    if (found === undefined) {
      throw new Error(`makeMethod: the new Method ${made.diagram} is missing`);
    }
    method = found;
  } else {
    method = existing;
  }
  const params = paramsOf(method);
  const linked: Id[] = [];
  next = mapCalls(next, (other) => {
    if (other.target.kind !== 'named' || other.target.name.trim() !== name) {
      return other;
    }
    linked.push(other.id);
    return {
      ...other,
      target: { kind: 'local', diagram: method.id },
      args: filledArgs(other.args, params),
      siteFolds: [],
    };
  });
  return done(next, [method.id, ...linked]);
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
