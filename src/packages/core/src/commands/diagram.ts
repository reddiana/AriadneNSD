// Commands on diagrams, headers and document settings (01-model 4.1 "다이어그램", "문서 설정").
import { headName, headParams } from '../model/head';
import type { IdGenerator } from '../model/id';
import type { Call, Content, Diagram, Head, Id, Settings } from '../model/types';
import { done, fail, failWith, idsFor, unchanged } from './common';
import { emptySeq } from './seq-edit';
import { mapCalls } from './tree';
import type { Reason, Result, WithIds } from './types';

/** The kind of a header. */
export type HeadKind = Head['kind'];

/** Arguments of `editHead`. */
export type EditHeadArgs = {
  readonly diagram: Id;
  /** The whole header text. For a Method, the name and then the parameters in parentheses. */
  readonly text: string;
};

/**
 * Sets the text of a diagram's header (R-BLK-10, R-BLK-11). Call blocks refer to a Method by id,
 * so they follow the new name on their own (ADR-0022).
 * - The name (01-model 1.2) cannot be empty (`emptyHeadName`) or equal another header's name,
 *   Events and Methods together (`duplicateHeadName`). A document opened with clashing names
 *   keeps them; only a new clash is refused.
 * - A Method that loses its parentheses receives nothing, so the arguments of the call blocks
 *   calling it are cleared (interaction rules "호출 블록"). A Method with parentheses fills the
 *   empty arguments of its call blocks with the text inside them.
 * - A diagram without a header is refused (`noHead`); give it one with `setHead`.
 * The same text as before leaves the content as it is.
 * Touched: the diagram, then the call blocks whose arguments changed.
 */
export function editHead(content: Content, args: EditHeadArgs): Result {
  const diagram = content.diagrams.find((d) => d.id === args.diagram);
  if (diagram === undefined) {
    return fail('notFound', args.diagram);
  }
  if (diagram.head === null) {
    return fail('noHead', args.diagram);
  }
  if (diagram.head.text === args.text) {
    return unchanged(content, [diagram.id]);
  }
  const head: Head = { kind: diagram.head.kind, text: args.text };
  const clash = checkHeadName(content, head, diagram.id);
  if (clash !== null) {
    return failWith(clash);
  }
  const touched: Id[] = [diagram.id];
  let next = replaceDiagram(content, diagram.id, { ...diagram, head });
  if (head.kind === 'method') {
    next = fitCallArgs(next, diagram.id, headParams(diagram.head), headParams(head), touched);
  }
  return done(next, touched);
}

/** Arguments of `setHead`. */
export type SetHeadArgs = {
  readonly diagram: Id;
  /** The new kind of header, or `null` to remove the header. */
  readonly kind: HeadKind | null;
};

/**
 * Gives a diagram a header, changes the kind of its header, or removes it (R-BLK-10, R-BLK-11,
 * interaction rules "새 Method로 빼기와 새 다이어그램").
 * - A new header gets the default name ("Event 1", "Method 2" …, the smallest number no header
 *   uses yet).
 * - Changing the kind keeps the text. A Method that call blocks call cannot become an Event
 *   (`methodHasCallers`). The text read as the other kind must still give a valid name
 *   (`emptyHeadName`, `duplicateHeadName`).
 * - Removing a Method's header turns the call blocks calling it into lost ones that keep the name
 *   they showed (01-model 1.5). A diagram left with neither header nor content disappears
 *   unless it is the only one (invariant 7).
 * The same kind as before leaves the content as it is.
 * Touched: the diagram, then the call blocks that lost their target.
 */
export function setHead(content: Content, args: SetHeadArgs): Result {
  const diagram = content.diagrams.find((d) => d.id === args.diagram);
  if (diagram === undefined) {
    return fail('notFound', args.diagram);
  }
  const old = diagram.head;
  if ((old?.kind ?? null) === args.kind) {
    return unchanged(content, [diagram.id]);
  }
  if (args.kind === null) {
    // Only reached with a header, since the kinds differ.
    const touched: Id[] = [diagram.id];
    let next = replaceDiagram(content, diagram.id, { ...diagram, head: null });
    if (old?.kind === 'method') {
      next = loseCalls(next, diagram.id, headName(old), touched);
    }
    return done(next, touched);
  }
  if (old === null) {
    const head: Head = { kind: args.kind, text: defaultHeadName(content, args.kind) };
    return done(replaceDiagram(content, diagram.id, { ...diagram, head }), [diagram.id]);
  }
  if (old.kind === 'method' && callersOf(content, diagram.id).length > 0) {
    return fail('methodHasCallers', diagram.id);
  }
  const head: Head = { kind: args.kind, text: old.text };
  const clash = checkHeadName(content, head, diagram.id);
  if (clash !== null) {
    return failWith(clash);
  }
  return done(replaceDiagram(content, diagram.id, { ...diagram, head }), [diagram.id]);
}

/** Arguments of `newDiagram`. */
export type NewDiagramArgs = WithIds & {
  readonly kind: HeadKind;
};

/**
 * Adds a new diagram with a header of the given kind and the default name, holding one empty
 * block (R-EDIT-18, R-EDIT-19). It goes at the end of its kind: after the last Method, or after
 * the last Event or diagram without a header (interaction rules 5). The editor then opens the
 * header name for editing. Touched: the new diagram.
 */
export function newDiagram(content: Content, args: NewDiagramArgs): Result {
  const made = addDiagram(content, args.kind, null, idsFor(content, args));
  return done(made.content, [made.diagram]);
}

/** Arguments of `deleteDiagram`. */
export type DeleteDiagramArgs = {
  readonly diagram: Id;
};

/**
 * Deletes a diagram with everything in it (R-EDIT-18). The call blocks elsewhere that called it
 * lose their target and keep the name they showed (01-model 1.5). The only diagram cannot be
 * deleted (`lastDiagram`, invariant 1). Touched: the call blocks that lost their target.
 */
export function deleteDiagram(content: Content, args: DeleteDiagramArgs): Result {
  const diagram = content.diagrams.find((d) => d.id === args.diagram);
  if (diagram === undefined) {
    return fail('notFound', args.diagram);
  }
  if (content.diagrams.length === 1) {
    return fail('lastDiagram', diagram.id);
  }
  const touched: Id[] = [];
  let next: Content = {
    ...content,
    diagrams: content.diagrams.filter((d) => d.id !== diagram.id),
  };
  if (diagram.head?.kind === 'method') {
    next = loseCalls(next, diagram.id, headName(diagram.head), touched);
  }
  return done(next, touched);
}

/** Arguments of `moveDiagram`. */
export type MoveDiagramArgs = {
  readonly diagram: Id;
  readonly direction: 'up' | 'down';
};

/**
 * Swaps a diagram with the previous (or next) diagram of its kind: Methods among Methods, Events
 * and diagrams without a header among themselves (interaction rules 5). The layout places them by
 * this order. At the end of its kind it is refused (`atTop`, `atBottom`). Touched: the diagram.
 */
export function moveDiagram(content: Content, args: MoveDiagramArgs): Result {
  const at = content.diagrams.findIndex((d) => d.id === args.diagram);
  const diagram = content.diagrams[at];
  if (diagram === undefined) {
    return fail('notFound', args.diagram);
  }
  const side = isMethod(diagram);
  const step = args.direction === 'up' ? -1 : 1;
  let other = at + step;
  while (other >= 0 && other < content.diagrams.length) {
    const candidate = content.diagrams[other];
    if (candidate !== undefined && isMethod(candidate) === side) {
      break;
    }
    other += step;
  }
  const swapWith = content.diagrams[other];
  if (swapWith === undefined) {
    return fail(args.direction === 'up' ? 'atTop' : 'atBottom', diagram.id);
  }
  const diagrams = content.diagrams.slice();
  diagrams[at] = swapWith;
  diagrams[other] = diagram;
  return done({ ...content, diagrams }, [diagram.id]);
}

/** Arguments of `setSettings`: the settings to change. Those left out stay. */
export type SetSettingsArgs = { readonly [K in keyof Settings]?: Settings[K] };

/**
 * Changes document settings, such as the header shape (R-LAY-10, interaction rules "헤더 모양").
 * Settings are part of the content, so this is undoable. The same values as before leave the
 * content as it is. Touched: nothing.
 */
export function setSettings(content: Content, args: SetSettingsArgs): Result {
  const settings: Settings = { ...content.settings, ...args };
  const same = (Object.keys(settings) as (keyof Settings)[]).every(
    (key) => settings[key] === content.settings[key],
  );
  return same ? unchanged(content, []) : done({ ...content, settings }, []);
}

// Helpers shared with the call block commands.

/**
 * Adds a diagram with a header of the given kind at the end of its kind (interaction rules 5).
 * `text` is the header text; `null` gives the default name. The caller checks a given text.
 */
export function addDiagram(
  content: Content,
  kind: HeadKind,
  text: string | null,
  ids: IdGenerator,
): { readonly content: Content; readonly diagram: Id } {
  const diagram: Diagram = {
    id: ids.next('diagram'),
    head: { kind, text: text ?? defaultHeadName(content, kind) },
    body: emptySeq(ids),
  };
  const isSameSide = (d: Diagram): boolean => isMethod(d) === (kind === 'method');
  let at = -1;
  content.diagrams.forEach((d, index) => {
    if (isSameSide(d)) {
      at = index + 1;
    }
  });
  if (at < 0) {
    // Methods are drawn on the right, Events on the left (interaction rules 5).
    at = kind === 'method' ? content.diagrams.length : 0;
  }
  const diagrams = [...content.diagrams.slice(0, at), diagram, ...content.diagrams.slice(at)];
  return { content: { ...content, diagrams }, diagram: diagram.id };
}

/**
 * Why a header cannot have this name, or `null` when it can: the name is empty, or another
 * header (not `self`) already has it. Names compare without surrounding spaces, case sensitive.
 */
export function checkHeadName(content: Content, head: Head, self: Id | null): Reason | null {
  const name = headName(head);
  const node = self ?? undefined;
  if (name === '') {
    return node === undefined ? { code: 'emptyHeadName' } : { code: 'emptyHeadName', node };
  }
  const clashes = content.diagrams.some(
    (d) => d.id !== self && d.head !== null && headName(d.head) === name,
  );
  if (clashes) {
    return node === undefined ? { code: 'duplicateHeadName' } : { code: 'duplicateHeadName', node };
  }
  return null;
}

/**
 * The default name of a new header: "Event n" or "Method n" with the smallest n no header uses
 * (interaction rules "Event 헤더"). The same in every locale, since it is document text.
 */
export function defaultHeadName(content: Content, kind: HeadKind): string {
  const used = new Set(
    content.diagrams.flatMap((d) => (d.head === null ? [] : [headName(d.head)])),
  );
  const base = kind === 'event' ? 'Event' : 'Method';
  let n = 1;
  while (used.has(`${base} ${String(n)}`)) {
    n += 1;
  }
  return `${base} ${String(n)}`;
}

/** Whether a call block calls this diagram of the same document. */
export function calls(call: Call, diagram: Id): boolean {
  return call.target.kind === 'local' && call.target.diagram === diagram;
}

/** The ids of the call blocks calling this diagram, in document order. */
function callersOf(content: Content, diagram: Id): ReadonlyArray<Id> {
  const found: Id[] = [];
  mapCalls(content, (call) => {
    if (calls(call, diagram)) {
      found.push(call.id);
    }
    return call;
  });
  return found;
}

/** Turns the call blocks calling `diagram` into lost ones showing `lastName` (01-model 1.5). */
function loseCalls(content: Content, diagram: Id, lastName: string, touched: Id[]): Content {
  return mapCalls(content, (call) => {
    if (!calls(call, diagram)) {
      return call;
    }
    touched.push(call.id);
    return { ...call, target: { kind: 'lost', lastName } };
  });
}

/**
 * Fits the arguments of the call blocks calling `diagram` to a header edit (interaction rules
 * "호출 블록"): when the parentheses go, nothing is passed any more and the arguments are cleared;
 * while there are parentheses, empty arguments take the text inside them.
 */
function fitCallArgs(
  content: Content,
  diagram: Id,
  before: string | null,
  after: string | null,
  touched: Id[],
): Content {
  if (before === null && after === null) {
    return content;
  }
  return mapCalls(content, (call) => {
    if (!calls(call, diagram)) {
      return call;
    }
    const args = after === null ? '' : filledArgs(call.args, after);
    if (args === call.args) {
      return call;
    }
    touched.push(call.id);
    return { ...call, args };
  });
}

/**
 * The arguments of a call block to a Method receiving `params` (`null`: no parentheses). A Method
 * that receives something cannot be called with empty arguments; the text inside its parentheses
 * fills them (interaction rules "호출 블록"). Other arguments stay as written.
 */
export function filledArgs(args: string, params: string | null): string {
  return params !== null && args.trim() === '' ? params : args;
}

function replaceDiagram(content: Content, id: Id, diagram: Diagram): Content {
  return { ...content, diagrams: content.diagrams.map((d) => (d.id === id ? diagram : d)) };
}

/** Whether a diagram is drawn with the Methods; the others are drawn with the Events. */
function isMethod(diagram: Diagram): boolean {
  return diagram.head?.kind === 'method';
}
