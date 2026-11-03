// Model JSON serialization: docs/05-spec/01-file-format.md, section 3.
import type { Locale } from '../i18n/messages';
import { contentIds } from '../model/id';
import type {
  Arm,
  Block,
  Branch,
  Call,
  CallTarget,
  Content,
  Diagram,
  Doc,
  FoldMark,
  Id,
  Path,
  Seq,
  SiteFold,
  View,
} from '../model/types';

/** The value of the `format` field. */
export const formatName = 'ariadne-nsd';

/** The file format version this code writes (01-file-format 5). */
export const currentFormatVersion = 1;

/**
 * Setting values read from a file that this version does not know, kept so that saving writes
 * them back unchanged (01-file-format 3.3). The model shows the default instead.
 */
export type KeptSettings = {
  /** The `textKind` as written in the file, when this version does not know it. The model has `plain`. */
  readonly textKind?: string;
  /**
   * The `locale` as written in the file, when this version does not know it, and the locale the
   * model draws in instead (the opener's screen language). Written back while that is unchanged.
   */
  readonly locale?: { readonly written: string; readonly drawnIn: Locale };
};

/** A document read from a file, with the setting values the model could not hold. */
export type LoadedDoc = {
  readonly doc: Doc;
  readonly kept: KeptSettings;
};

/**
 * Serializes a document to model JSON (01-file-format 3.1): 2-space indent, LF, keys in the order
 * of the table in 3.3, omitted fields left out. The same document always gives the same text.
 * The view lists only ids that exist, in document order, so the order of folding does not matter.
 */
export function serializeModelJson(doc: Doc, kept: KeptSettings = {}): string {
  return JSON.stringify(modelJson(doc, kept), null, 2);
}

/** The model JSON as a plain value, with keys in the order of 01-file-format 3.3. */
function modelJson(doc: Doc, kept: KeptSettings): unknown {
  const { settings } = doc.content;
  // An unknown textKind is shown as plain; while the model still has plain, write the kept value.
  const textKind =
    settings.textKind === 'plain' && kept.textKind !== undefined
      ? kept.textKind
      : settings.textKind;
  const locale = kept.locale?.drawnIn === settings.locale ? kept.locale.written : settings.locale;
  return {
    format: formatName,
    version: currentFormatVersion,
    settings: { textKind, theme: settings.theme, headStyle: settings.headStyle, locale },
    diagrams: doc.content.diagrams.map(diagramJson),
    view: viewJson(doc.content, doc.view),
  };
}

function diagramJson(diagram: Diagram): unknown {
  return {
    id: diagram.id,
    ...(diagram.head === null
      ? {}
      : { head: { kind: diagram.head.kind, text: diagram.head.text } }),
    ...seqJson(diagram.body),
  };
}

/** A sequence has no object of its own: its blocks go to `body` and its folds to `folds`. */
function seqJson(seq: Seq): { body: unknown; folds?: unknown } {
  return {
    body: seq.blocks.map(blockJson),
    ...(seq.folds.length === 0 ? {} : { folds: seq.folds.map(foldJson) }),
  };
}

function foldJson(fold: FoldMark): unknown {
  return {
    id: fold.id,
    first: fold.first,
    last: fold.last,
    ...(fold.name === undefined ? {} : { name: fold.name }),
  };
}

function siteFoldJson(fold: SiteFold): unknown {
  return {
    id: fold.id,
    via: [...fold.via],
    first: fold.first,
    last: fold.last,
    ...(fold.name === undefined ? {} : { name: fold.name }),
  };
}

function branchJson(branch: Branch): unknown {
  return {
    id: branch.id,
    ...(branch.label === undefined ? {} : { label: branch.label }),
    ...seqJson(branch.body),
  };
}

function armJson(arm: Arm): unknown {
  return { id: arm.id, label: arm.label, ...seqJson(arm.body) };
}

function blockJson(block: Block): unknown {
  switch (block.kind) {
    case 'process':
      return { id: block.id, kind: block.kind, text: block.text };
    case 'if':
      return {
        id: block.id,
        kind: block.kind,
        text: block.text,
        yes: branchJson(block.yes),
        no: branchJson(block.no),
      };
    case 'case':
      return {
        id: block.id,
        kind: block.kind,
        text: block.text,
        arms: block.arms.map(armJson),
        ...(block.otherwise === null ? {} : { otherwise: branchJson(block.otherwise) }),
      };
    case 'while':
    case 'doWhile':
    case 'for':
      return { id: block.id, kind: block.kind, text: block.text, ...seqJson(block.body) };
    case 'call':
      return callJson(block);
  }
}

function callJson(call: Call): unknown {
  return {
    id: call.id,
    kind: call.kind,
    target: targetJson(call.target),
    args: call.args,
    result: call.result,
    ...(call.siteFolds.length === 0 ? {} : { siteFolds: call.siteFolds.map(siteFoldJson) }),
  };
}

function targetJson(target: CallTarget): unknown {
  switch (target.kind) {
    case 'local':
      return { kind: target.kind, diagram: target.diagram };
    case 'named':
      return { kind: target.kind, name: target.name };
    case 'external':
      return {
        kind: target.kind,
        file: target.file,
        diagram: target.diagram,
        lastName: target.lastName,
      };
    case 'lost':
      return {
        kind: target.kind,
        lastName: target.lastName,
        ...(target.file === undefined ? {} : { file: target.file }),
      };
  }
}

// View state (01-model 2): weak references. Only existing ids are written, in document order.

function viewJson(content: Content, view: View): unknown {
  const folded = new Set(view.folded);
  return {
    folded: [...foldableIds(content)].filter((id) => folded.has(id)),
    opened: openedPaths(content, view.opened),
    bands: view.bands,
    resultSymbol: view.resultSymbol,
  };
}

/**
 * Lists the ids that can be folded, in document order: fold regions, site fold regions,
 * branches of If and Case, and loop blocks.
 */
function* foldableIds(content: Content): Generator<Id> {
  for (const diagram of content.diagrams) {
    yield* seqFoldableIds(diagram.body);
  }
}

function* seqFoldableIds(seq: Seq): Generator<Id> {
  for (const block of seq.blocks) {
    yield* blockFoldableIds(block);
  }
  for (const fold of seq.folds) {
    yield fold.id;
  }
}

function* blockFoldableIds(block: Block): Generator<Id> {
  switch (block.kind) {
    case 'process':
      return;
    case 'if':
      yield block.yes.id;
      yield* seqFoldableIds(block.yes.body);
      yield block.no.id;
      yield* seqFoldableIds(block.no.body);
      return;
    case 'case':
      for (const arm of block.arms) {
        yield arm.id;
        yield* seqFoldableIds(arm.body);
      }
      if (block.otherwise !== null) {
        yield block.otherwise.id;
        yield* seqFoldableIds(block.otherwise.body);
      }
      return;
    case 'while':
    case 'doWhile':
    case 'for':
      yield block.id;
      yield* seqFoldableIds(block.body);
      return;
    case 'call':
      for (const fold of block.siteFolds) {
        yield fold.id;
      }
      return;
  }
}

/**
 * Keeps the opened paths that still exist, without duplicates, in document order.
 * A path exists when every id is a call block, and each inner one is in the Method that the
 * call block before it calls (a local target). Paths through other documents are not designed
 * yet (01-model, open questions), so they are not kept.
 */
function openedPaths(content: Content, opened: ReadonlyArray<Path>): Id[][] {
  const calls = new Map<Id, { readonly call: Call; readonly diagram: Id }>();
  for (const diagram of content.diagrams) {
    for (const call of callsIn(diagram.body)) {
      calls.set(call.id, { call, diagram: diagram.id });
    }
  }
  const order = new Map<Id, number>();
  let index = 0;
  for (const id of contentIds(content)) {
    order.set(id, index);
    index += 1;
  }
  const exists = (path: Path): boolean =>
    path.length > 0 &&
    path.every((id, at) => {
      const here = calls.get(id);
      if (here === undefined) {
        return false;
      }
      const outer = at === 0 ? undefined : calls.get(path[at - 1] ?? '');
      return (
        outer === undefined ||
        (outer.call.target.kind === 'local' && outer.call.target.diagram === here.diagram)
      );
    });
  const unique = new Map<string, Id[]>();
  for (const path of opened) {
    if (exists(path)) {
      unique.set(path.join(' '), [...path]);
    }
  }
  return [...unique.values()].sort((left, right) => comparePaths(left, right, order));
}

function comparePaths(left: Path, right: Path, order: ReadonlyMap<Id, number>): number {
  const length = Math.min(left.length, right.length);
  for (let at = 0; at < length; at += 1) {
    const difference = (order.get(left[at] ?? '') ?? 0) - (order.get(right[at] ?? '') ?? 0);
    if (difference !== 0) {
      return difference;
    }
  }
  return left.length - right.length;
}

function* callsIn(seq: Seq): Generator<Call> {
  for (const block of seq.blocks) {
    switch (block.kind) {
      case 'process':
        break;
      case 'if':
        yield* callsIn(block.yes.body);
        yield* callsIn(block.no.body);
        break;
      case 'case':
        for (const arm of block.arms) {
          yield* callsIn(arm.body);
        }
        if (block.otherwise !== null) {
          yield* callsIn(block.otherwise.body);
        }
        break;
      case 'while':
      case 'doWhile':
      case 'for':
        yield* callsIn(block.body);
        break;
      case 'call':
        yield block;
        break;
    }
  }
}
