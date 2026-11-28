import type { IdGenerator } from '../model/id';
import { headName } from '../model/head';
import type {
  Arm,
  Block,
  Branch,
  CallTarget,
  Content,
  Diagram,
  FoldMark,
  Head,
  Id,
  Seq,
} from '../model/types';
import { done, fail, failWith, idsFor, isReason, resolveTarget } from './common';
import { insertDiagramAt } from './diagram';
import { deleteBlocks } from './delete';
import { keepingOut, putBlocks } from './insert';
import { foldRange, sliceSeq } from './seq-edit';
import { indexContent } from './tree';
import type { Clip, FailResult, OkResult, Result, Side, Target, WithIds } from './types';

/** Arguments of `copy` and `cut`. */
export type CopyArgs = WithIds & {
  readonly target: Target;
};

/** The result of `copy`. */
export type CopyResult = { readonly ok: true; readonly clip: Clip } | FailResult;

/** The result of `cut`: the result of deleting, with what was cut. */
export type CutResult = (OkResult & { readonly clip: Clip }) | FailResult;

/**
 * Copies the target blocks, whole subtrees (R-EDIT-10). Fold regions inside the range come
 * along. Copying does not change the content, so it is not a command; the editor puts the clip
 * on the clipboard (03-editor 3.3).
 */
export function copy(content: Content, args: CopyArgs): CopyResult {
  if (args.target.kind === 'diagramEnd') {
    return fail('wrongKind');
  }
  const range = resolveTarget(indexContent(content), args.target);
  if (isReason(range)) {
    return failWith(range);
  }
  return { ok: true, clip: sliceSeq(range.seq, range.lo, range.hi, true) };
}

/** Copies the target blocks and deletes them (R-EDIT-10). See `copy` and `deleteBlocks`. */
export function cut(content: Content, args: CopyArgs): CutResult {
  const copied = copy(content, args);
  if (!copied.ok) {
    return copied;
  }
  const deleted = deleteBlocks(content, args);
  return deleted.ok ? { ...deleted, clip: copied.clip } : deleted;
}

/** Arguments of `paste`. */
export type PasteArgs = WithIds & {
  readonly target: Target;
  readonly side: Side;
  readonly clip: Clip;
  /**
   * The names of the Methods the copied call blocks called, by Method id, as the clip remembers
   * them (03-editor 3.3). With them a call block calls the Method of that name here, or loses
   * its target keeping the name; without them it calls the Method with the same id.
   */
  readonly names?: ReadonlyMap<Id, string>;
  /** The blocks go outside the fold regions starting or ending there (see `InsertBlockArgs`). */
  readonly outsideFolds?: boolean;
};

/**
 * Pastes copied blocks after (or before) the target, or in place of an empty block
 * (R-EDIT-10, interaction rules "붙여넣기"). Every pasted node gets a new id, and fold regions in
 * the clip are mapped to the new ids (01-model 1.7). A call block whose Method is not in this
 * document loses its target, keeping the name it showed (`names`). Touched: the pasted blocks.
 */
export function paste(content: Content, args: PasteArgs): Result {
  if (args.clip.blocks.length === 0) {
    return fail('emptyClip');
  }
  const index = indexContent(content);
  const range = resolveTarget(index, args.target);
  if (isReason(range)) {
    return failWith(range);
  }
  const methods = methodsOf(content, args.names);
  const fresh = renewSeq(args.clip, idsFor(content, args), methods);
  const side = args.target.kind === 'diagramEnd' ? 'after' : args.side;
  const next = putBlocks(content, keepingOut(range, args.outsideFolds), side, fresh);
  return done(
    next,
    fresh.blocks.map((block) => block.id),
  );
}

/** Arguments of `pasteDiagram`. */
export type PasteDiagramArgs = WithIds & {
  /** The copied diagram: its header and body. */
  readonly diagram: Diagram;
  /** The diagram holding the selection, or `null` when nothing is selected. */
  readonly after: Id | null;
  /** As in `PasteArgs`. */
  readonly names?: ReadonlyMap<Id, string>;
};

/**
 * Pastes a copied diagram as a new one (R-EDIT-10, UX HC1), placed by `insertDiagramAt` after
 * the diagram holding the selection (UX NP1). A name another header already has gets a number after it (`sort 2`). Calls of the copied diagram to
 * itself call the new one; its other calls are linked as `paste` links them.
 * Touched: the new diagram.
 */
export function pasteDiagram(content: Content, args: PasteDiagramArgs): Result {
  const source = args.diagram;
  if (source.head === null) {
    return fail('noHead', source.id);
  }
  const ids = idsFor(content, args);
  const id = ids.next('diagram');
  const others = methodsOf(content, args.names);
  const methods: Methods = (called) =>
    called === source.id ? { kind: 'local', diagram: id } : others(called);
  const head = freeHead(content, source.head);
  const diagram: Diagram = { id, head, body: renewSeq(source.body, ids, methods) };
  return done(insertDiagramAt(content, diagram, args.after), [id]);
}

/** The header with a name no other header has: the same text, or its name followed by a number. */
function freeHead(content: Content, head: Head): Head {
  const used = new Set(
    content.diagrams.flatMap((d) => (d.head === null ? [] : [headName(d.head)])),
  );
  const name = headName(head);
  if (!used.has(name)) {
    return head;
  }
  let n = 2;
  while (used.has(`${name} ${String(n)}`)) {
    n += 1;
  }
  // A Method keeps what it receives: the text from its first parenthesis.
  const open = head.kind === 'method' ? head.text.indexOf('(') : -1;
  const rest = open < 0 ? '' : head.text.slice(open);
  return { kind: head.kind, text: `${name} ${String(n)}${rest}` };
}

/**
 * Where pasted call blocks go: copied Method id → the target here. With the clip's names, a
 * call goes to the Method of the same name in this document (whatever its id), or calls by that
 * name (ADR-0049); without names, to the Method with the same id.
 */
type Methods = (id: Id) => CallTarget;

function methodsOf(content: Content, names: ReadonlyMap<Id, string> | undefined): Methods {
  const methods = content.diagrams.filter((diagram) => diagram.head?.kind === 'method');
  const byName = new Map(
    methods.flatMap((diagram) =>
      diagram.head === null ? [] : [[headName(diagram.head), diagram.id]],
    ),
  );
  const ids = new Set(methods.map((diagram) => diagram.id));
  return (id) => {
    const name = names?.get(id);
    if (name === undefined) {
      return ids.has(id) ? { kind: 'local', diagram: id } : { kind: 'named', name: '' };
    }
    const found = byName.get(name);
    return found === undefined ? { kind: 'named', name } : { kind: 'local', diagram: found };
  };
}

/** A deep copy of a sequence with new ids. Broken or crossing fold regions are left out. */
function renewSeq(seq: Seq, ids: IdGenerator, methods: Methods): Seq {
  const renamed = new Map<Id, Id>();
  const blocks = seq.blocks.map((block) => {
    const copied = renewBlock(block, ids, methods);
    renamed.set(block.id, copied.id);
    return copied;
  });
  const folds: FoldMark[] = [];
  for (const fold of laminar(seq)) {
    const first = renamed.get(fold.first);
    const last = renamed.get(fold.last);
    if (first === undefined || last === undefined) {
      continue;
    }
    folds.push({ ...fold, id: ids.next('fold'), first, last });
  }
  return { blocks, folds };
}

/** The fold regions of a sequence that are valid and nest, keeping the earlier on a clash. */
function laminar(seq: Seq): ReadonlyArray<FoldMark> {
  const kept: { fold: FoldMark; a: number; b: number }[] = [];
  for (const fold of seq.folds) {
    const range = foldRange(seq, fold);
    if (range === null) {
      continue;
    }
    const [a, b] = range;
    const clashes = kept.some(
      (other) =>
        (other.a === a && other.b === b) ||
        (other.a < a && a <= other.b && other.b < b) ||
        (a < other.a && other.a <= b && b < other.b),
    );
    if (!clashes) {
      kept.push({ fold, a, b });
    }
  }
  return kept.map((entry) => entry.fold);
}

function renewBlock(block: Block, ids: IdGenerator, methods: Methods): Block {
  const id = ids.next('block');
  const branch = (old: Branch): Branch => ({
    ...old,
    id: ids.next('branch'),
    body: renewSeq(old.body, ids, methods),
  });
  const arm = (old: Arm): Arm => ({
    ...old,
    id: ids.next('branch'),
    body: renewSeq(old.body, ids, methods),
  });
  switch (block.kind) {
    case 'process':
    case 'exit':
      return { ...block, id };
    case 'if':
      return { ...block, id, yes: branch(block.yes), no: branch(block.no) };
    case 'parallel':
      return { ...block, id, branches: block.branches.map(branch) };
    case 'case':
      return {
        ...block,
        id,
        arms: block.arms.map(arm),
        otherwise: block.otherwise === null ? null : branch(block.otherwise),
      };
    case 'while':
    case 'doWhile':
    case 'for':
    case 'endless':
      return { ...block, id, body: renewSeq(block.body, ids, methods) };
    case 'call':
      return {
        ...block,
        id,
        target: keepTarget(block.target, methods),
        siteFolds: block.siteFolds.map((fold) => ({ ...fold, id: ids.next('fold') })),
      };
  }
}

/** A local target must name a Method of this document (invariant 6); otherwise it is named. */
function keepTarget(target: CallTarget, methods: Methods): CallTarget {
  return target.kind === 'local' ? methods(target.diagram) : target;
}
