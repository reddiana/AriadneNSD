// What is folded inside opened call blocks (01-model 2, ADR-0046). Every path of call blocks keeps
// its own folding, written into `View.folded` behind the path:
//   `b4/`     the call site `b4` has its own folding and its own fold regions, both taken from
//             the Method when first opened (ADR-0047)
//   `b4/r3`   branch or loop block `r3` of the called Method is folded at `b4`
// The fold regions of a call site are content: when it is first opened, the Method's regions are
// copied into `Call.siteFolds`, and from then on the Method's regions are not drawn there.
// Older versions read these entries as ids that do not exist, which the view state allows.
import { mapCalls } from '../commands/tree';
import type { IdGenerator } from './id';
import { contentIds, createIdGenerator } from './id';
import type {
  Block,
  Call,
  Content,
  Diagram,
  Doc,
  FoldMark,
  Id,
  Path,
  Seq,
  SiteFold,
  View,
} from './types';

/**
 * Inside an opened call block every drawn id is written behind the path of the call blocks it
 * was opened through: `b4/b17` is block `b17` of the Method that call block `b4` calls, and
 * `b4/b9/b17` the same block seen through `b9`, a call opened inside `b4` (03-editor 2).
 */
export const pathSeparator = '/';

/** What stands in front of the ids shown inside the opened call path `path`: `b4/b9/`. */
export function sitePrefix(path: Path): string {
  return path.join(pathSeparator) + pathSeparator;
}

/**
 * Whether `id` of a Method is folded where it is shown behind `prefix`. A call site without its
 * own folding yet (a file saved before ADR-0046, read but not settled) shows the Method's.
 */
export function isFoldedAt(folded: ReadonlySet<Id>, prefix: string, id: Id): boolean {
  return hasOwnSite(folded, prefix) ? folded.has(prefix + id) : folded.has(id);
}

/**
 * Whether the call site shown behind `prefix` has its own folding and fold regions (`b4/`): the
 * Method's regions were copied there and are no longer drawn at it (ADR-0047). A site without it
 * (not opened yet, or a file saved before) draws the Method's regions.
 */
export function hasOwnSite(folded: ReadonlySet<Id>, prefix: string): boolean {
  return prefix !== '' && folded.has(prefix);
}

/** The fold regions marked on a sequence and on every sequence inside it, in document order. */
export function regionsIn(seq: Seq): FoldMark[] {
  const found: FoldMark[] = [];
  const visit = (inner: Seq): void => {
    for (const block of inner.blocks) {
      for (const child of innerSeqs(block)) {
        visit(child);
      }
    }
    found.push(...inner.folds);
  };
  visit(seq);
  return found;
}

/** The branches and loop blocks of a sequence that can fold, fold regions left out. */
function controlFoldableIds(seq: Seq): Id[] {
  const regions = new Set(regionsIn(seq).map((fold) => fold.id));
  return [...seqFoldableIds(seq, false)].filter((id) => !regions.has(id));
}

/** The sequences directly inside a block, left to right. */
export function innerSeqs(block: Block): ReadonlyArray<Seq> {
  switch (block.kind) {
    case 'process':
    case 'exit':
    case 'call':
      return [];
    case 'if':
      return [block.yes.body, block.no.body];
    case 'parallel':
      return block.branches.map((branch) => branch.body);
    case 'case':
      return [
        ...block.arms.map((arm) => arm.body),
        ...(block.otherwise === null ? [] : [block.otherwise.body]),
      ];
    case 'while':
    case 'doWhile':
    case 'for':
    case 'endless':
      return [block.body];
  }
}

/**
 * Lists the ids that can be folded on a sequence, in document order: branches of If, Case and
 * parallel blocks,
 * loop blocks and fold regions, and with `withSiteFolds` the site fold regions of call blocks.
 */
export function* seqFoldableIds(seq: Seq, withSiteFolds: boolean): Generator<Id> {
  for (const block of seq.blocks) {
    yield* blockFoldableIds(block, withSiteFolds);
  }
  for (const fold of seq.folds) {
    yield fold.id;
  }
}

function* blockFoldableIds(block: Block, withSiteFolds: boolean): Generator<Id> {
  switch (block.kind) {
    case 'process':
    case 'exit':
      return;
    case 'parallel':
      for (const branch of block.branches) {
        yield branch.id;
        yield* seqFoldableIds(branch.body, withSiteFolds);
      }
      return;
    case 'if':
      yield block.yes.id;
      yield* seqFoldableIds(block.yes.body, withSiteFolds);
      yield block.no.id;
      yield* seqFoldableIds(block.no.body, withSiteFolds);
      return;
    case 'case':
      for (const arm of block.arms) {
        yield arm.id;
        yield* seqFoldableIds(arm.body, withSiteFolds);
      }
      if (block.otherwise !== null) {
        yield block.otherwise.id;
        yield* seqFoldableIds(block.otherwise.body, withSiteFolds);
      }
      return;
    case 'while':
    case 'doWhile':
    case 'for':
    case 'endless':
      yield block.id;
      yield* seqFoldableIds(block.body, withSiteFolds);
      return;
    case 'call':
      if (withSiteFolds) {
        for (const fold of block.siteFolds) {
          yield fold.id;
        }
      }
      return;
  }
}

type CallPlace = { readonly call: Call; readonly diagram: Id };

function* callsIn(seq: Seq): Generator<Call> {
  for (const block of seq.blocks) {
    if (block.kind === 'call') {
      yield block;
    }
    for (const inner of innerSeqs(block)) {
      yield* callsIn(inner);
    }
  }
}

function callPlaces(content: Content): ReadonlyMap<Id, CallPlace> {
  const places = new Map<Id, CallPlace>();
  for (const diagram of content.diagrams) {
    for (const call of callsIn(diagram.body)) {
      places.set(call.id, { call, diagram: diagram.id });
    }
  }
  return places;
}

/**
 * A path exists when every id is a call block, and each inner one is in the Method that the call
 * block before it calls (a local target). Paths through other documents are not designed yet
 * (01-model, open questions), so they do not exist.
 */
function pathExists(places: ReadonlyMap<Id, CallPlace>, path: Path): boolean {
  return (
    path.length > 0 &&
    path.every((id, at) => {
      const here = places.get(id);
      if (here === undefined) {
        return false;
      }
      const outer = at === 0 ? undefined : places.get(path[at - 1] ?? '');
      return (
        outer === undefined ||
        (outer.call.target.kind === 'local' && outer.call.target.diagram === here.diagram)
      );
    })
  );
}

/** The Method shown inside the opened call path `path`, or `null` when nothing can be shown. */
function methodAt(
  content: Content,
  places: ReadonlyMap<Id, CallPlace>,
  path: Path,
): Diagram | null {
  const target = places.get(path.at(-1) ?? '')?.call.target;
  if (target?.kind !== 'local' || !pathExists(places, path)) {
    return null;
  }
  const method = content.diagrams.find((diagram) => diagram.id === target.diagram);
  return method?.head?.kind === 'method' ? method : null;
}

/** Keeps the paths that still exist, without duplicates, in document order. */
export function existingPaths(content: Content, paths: ReadonlyArray<Path>): Id[][] {
  return sortedPaths(content, callPlaces(content), paths);
}

function sortedPaths(
  content: Content,
  places: ReadonlyMap<Id, CallPlace>,
  paths: ReadonlyArray<Path>,
): Id[][] {
  const order = new Map<Id, number>();
  let index = 0;
  for (const id of contentIds(content)) {
    order.set(id, index);
    index += 1;
  }
  const unique = new Map<string, Id[]>();
  for (const path of paths) {
    if (pathExists(places, path)) {
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

/** Whether the path is drawn: it and every path around it are opened. */
function isShownPath(path: Path, opened: ReadonlySet<string>): boolean {
  return path.every((_, at) => opened.has(path.slice(0, at + 1).join(pathSeparator)));
}

function openedKeys(view: View): ReadonlySet<string> {
  return new Set(view.opened.map((path) => path.join(pathSeparator)));
}

/**
 * Gives every call site that is drawn and has no folding of its own the Method's folding and fold
 * regions as they are now: the first opening, or a file saved before ADR-0047 (ADR-0046, ADR-0047).
 * The regions are copied into the outermost call block's `siteFolds` with new ids, folded where the
 * Method's are folded; a region the site already has with the same range is not copied again.
 * Returns the same document if there is nothing to take, the same content if no region was copied.
 */
export function settleSiteFolds(doc: Doc): Doc {
  const { content, view } = doc;
  if (view.opened.length === 0) {
    return doc;
  }
  const folded = new Set(view.folded);
  const opened = openedKeys(view);
  const waiting = view.opened.filter(
    (path) => !folded.has(sitePrefix(path)) && isShownPath(path, opened),
  );
  if (waiting.length === 0) {
    return doc;
  }
  const places = callPlaces(content);
  const added = new Set<Id>();
  const copies = new Map<Id, SiteFold[]>();
  let ids: IdGenerator | null = null;
  for (const path of waiting) {
    const method = methodAt(content, places, path);
    const outermost = places.get(path[0] ?? '')?.call;
    if (method === null || outermost === undefined) {
      continue;
    }
    const prefix = sitePrefix(path);
    added.add(prefix);
    for (const id of controlFoldableIds(method.body)) {
      if (folded.has(id)) {
        added.add(prefix + id);
      }
    }
    const via = path.slice(1);
    const here = [...outermost.siteFolds, ...(copies.get(outermost.id) ?? [])].filter((fold) =>
      sameIds(fold.via, via),
    );
    for (const region of regionsIn(method.body)) {
      if (here.some((fold) => fold.first === region.first && fold.last === region.last)) {
        continue;
      }
      ids ??= createIdGenerator(content, [
        ...view.folded.flatMap((entry) => entry.split(pathSeparator)),
        ...view.opened.flat(),
      ]);
      const copy: SiteFold = {
        id: ids.next('fold'),
        via,
        first: region.first,
        last: region.last,
        ...(region.name === undefined ? {} : { name: region.name }),
      };
      here.push(copy);
      copies.set(outermost.id, [...(copies.get(outermost.id) ?? []), copy]);
      if (folded.has(region.id)) {
        added.add(copy.id);
      }
    }
  }
  if (added.size === 0) {
    return doc;
  }
  const next =
    copies.size === 0
      ? content
      : mapCalls(content, (call) => {
          const more = copies.get(call.id);
          return more === undefined ? call : { ...call, siteFolds: [...call.siteFolds, ...more] };
        });
  return { content: next, view: { ...view, folded: [...view.folded, ...added] } };
}

function sameIds(a: ReadonlyArray<Id>, b: ReadonlyArray<Id>): boolean {
  return a.length === b.length && a.every((id, index) => id === b[index]);
}

/** The Method a target opens, `null` for a target that opens none. */
function openedMethod(call: Call): Id | null {
  return call.target.kind === 'local' ? call.target.diagram : null;
}

/**
 * Forgets the folding of call sites whose call block now calls something else: what they kept
 * named blocks of the old Method, and the new one is opened for the first time. A call left with
 * a name only (its Method deleted, ADR-0049) opens nothing, so undoing the deletion brings the
 * folding back. `isStep` is an undo or redo: a Method coming back there is the old one again.
 */
export function forgetRetargeted(
  before: Content,
  after: Content,
  view: View,
  isStep: boolean,
): View {
  if (before === after || !view.folded.some((entry) => entry.includes(pathSeparator))) {
    return view;
  }
  const old = callPlaces(before);
  const changed = new Set<Id>();
  for (const { call } of callPlaces(after).values()) {
    const was = old.get(call.id)?.call;
    if (
      was !== undefined &&
      openedMethod(was) !== openedMethod(call) &&
      call.target.kind !== 'named' &&
      !(isStep && was.target.kind === 'named')
    ) {
      changed.add(call.id);
    }
  }
  if (changed.size === 0) {
    return view;
  }
  const folded = view.folded.filter((entry) => {
    const path = entry.split(pathSeparator).slice(0, -1);
    return !path.some((id) => changed.has(id));
  });
  return { ...view, folded };
}

/**
 * The folded list after call block `call` was replaced by copies of its Method's blocks (UX CB8):
 * the copies fold as they were shown at this call, and call sites opened inside it go with the
 * copies of those calls. `content` is from before the replacement, `renamed` maps ids to copies.
 */
export function foldedAfterInline(
  content: Content,
  view: View,
  call: Id,
  renamed: ReadonlyMap<Id, Id>,
): ReadonlyArray<Id> {
  const target = callPlaces(content).get(call)?.call.target;
  const method =
    target?.kind === 'local'
      ? content.diagrams.find((diagram) => diagram.id === target.diagram)
      : undefined;
  const own = new Set(method === undefined ? [] : seqFoldableIds(method.body, false));
  const folded = new Set(view.folded);
  const prefix = sitePrefix([call]);
  const shownHere = [...own].filter((id) => isFoldedAt(folded, prefix, id));
  const others = view.folded.filter((id) => !own.has(id) && !id.includes(pathSeparator));
  const copies = [...shownHere, ...others].flatMap((id) => {
    const copy = renamed.get(id);
    return copy === undefined ? [] : [copy];
  });
  const deeper = view.folded.flatMap((entry) => {
    if (!entry.startsWith(prefix)) {
      return [];
    }
    const [inner, ...rest] = entry.slice(prefix.length).split(pathSeparator);
    const copy = inner === undefined ? undefined : renamed.get(inner);
    return copy === undefined || rest.length === 0 ? [] : [[copy, ...rest].join(pathSeparator)];
  });
  return [...view.folded, ...copies, ...deeper];
}

/**
 * The entries of the call sites' folding a file keeps, in document order (01-file-format 3.1).
 * A site says nothing when opening the file would give it the same folding again: its Method has no
 * fold regions to copy (ADR-0047), and it is drawn and folded like the Method, or it is closed with
 * nothing folded here and in the Method. Sites that
 * no longer exist and ids no longer in the Method are not written.
 */
export function siteFoldedEntries(doc: Doc): ReadonlyArray<Id> {
  const { content, view } = doc;
  const marked = view.folded
    .filter((entry) => entry.endsWith(pathSeparator))
    .map((entry) => entry.slice(0, -pathSeparator.length).split(pathSeparator));
  if (marked.length === 0) {
    return [];
  }
  const places = callPlaces(content);
  const opened = openedKeys(view);
  const folded = new Set(view.folded);
  return sortedPaths(content, places, marked).flatMap((path) => {
    const method = methodAt(content, places, path);
    if (method === null) {
      return [];
    }
    const prefix = sitePrefix(path);
    const ids = controlFoldableIds(method.body);
    const here = ids.filter((id) => folded.has(prefix + id));
    const there = ids.filter((id) => folded.has(id));
    const isSame = here.length === there.length && here.every((id, at) => id === there[at]);
    // A Method with fold regions would give them again at the next opening (ADR-0047).
    const isKept =
      regionsIn(method.body).length > 0 ||
      (isShownPath(path, opened) ? !isSame : here.length > 0 || there.length > 0);
    return isKept ? [prefix, ...here.map((id) => prefix + id)] : [];
  });
}
