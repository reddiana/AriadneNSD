// The fold commands (interaction rules "접기 · 펼치기", R-EDIT-13, R-EDIT-14, R-EDIT-15,
// R-EDIT-16): fold and unfold, open call blocks in place, make and remove fold regions, and show
// or hide the name bands. Folding and opening change the view state only, so they are not undo
// steps (UX Q9); making and removing a region changes the content.
import type { Content, Id, Path, Seq, View } from '@ariadne-nsd/core';
import {
  foldRange,
  headName,
  makeFold,
  makeSiteFold,
  placeSiteFolds,
  removeFold,
} from '@ariadne-nsd/core';

import type { CommandSpec } from '../contracts';
import type { EditorMessage } from '../i18n/messages';
import { message } from '../i18n/messages';
import type { DocIndex } from '../model/doc-index';
import { childSeqs, indexDoc, isControl } from '../model/doc-index';
import type { After, EditorSession } from '../session/session';
import type { EditorState } from '../state/editor-state';
import type { Selection } from '../state/selection';
import {
  foldBlocks,
  foldPath,
  peekBlocks,
  selectBlock,
  selectFold,
  selectRange,
  selectedBlocks,
  targetOf,
} from '../state/selection';
import type { Applies } from './spec';
import { always, spec } from './spec';

/**
 * One thing that folds: a branch or loop body (its owner), a fold region, or a call block opened
 * in place (its call path, outermost first).
 */
type FoldItem =
  | { readonly kind: 'seq'; readonly owner: Id }
  | { readonly kind: 'fold'; readonly fold: Id }
  | { readonly kind: 'call'; readonly path: Path };

/**
 * What one fold command acts on: one thing, or the branches of a control block together. The
 * selection after folding is what is drawn in its place (`null`: keep the selection).
 */
type FoldTarget = {
  readonly items: ReadonlyArray<FoldItem>;
  readonly afterClose: Selection | null;
};

/** What the fold commands need. */
export type FoldDeps = { readonly session: EditorSession };

/**
 * Whether a branch or loop body can fold (UX Q20): one that shows more than a single simple
 * block. A body of one process or call block stays open; one control block alone folds.
 */
export function isFoldableSeq(seq: Seq): boolean {
  const [only] = seq.blocks;
  return seq.blocks.length > 1 || (only !== undefined && isControl(only));
}

/** Whether a call block can be opened in place: it calls a Method of this document (R-EDIT-15). */
export function isOpenable(index: DocIndex, block: Id): boolean {
  const call = index.blocks.get(block)?.block;
  return (
    call?.kind === 'call' &&
    call.target.kind === 'local' &&
    index.diagrams.get(call.target.diagram)?.head?.kind === 'method'
  );
}

/** The fold region that is exactly the whole sequence, if there is one. */
function wholeRegion(seq: Seq): Id | null {
  const last = seq.blocks.length - 1;
  const whole = seq.folds.find((fold) => {
    const range = foldRange(seq, fold);
    return range !== null && range[0] === 0 && range[1] === last;
  });
  return whole?.id ?? null;
}

/**
 * A control block folds its inside (R-EDIT-13): every branch of an If or Case that can fold, or
 * a loop's body. A branch that is all one fold region folds that region instead.
 */
function controlTarget(index: DocIndex, block: Id): FoldTarget | null {
  const place = index.blocks.get(block);
  if (place === undefined) {
    return null;
  }
  const items: FoldItem[] = [];
  for (const child of childSeqs(place.block)) {
    const region = wholeRegion(child.seq);
    if (region !== null) {
      items.push({ kind: 'fold', fold: region });
    } else if (isFoldableSeq(child.seq)) {
      items.push({ kind: 'seq', owner: child.owner });
    }
  }
  return items.length === 0 ? null : { items, afterClose: null };
}

/** The target folding a whole branch or loop body: it is then selected as its row. */
function seqTarget(index: DocIndex, owner: Id): FoldTarget | null {
  const seq = index.seqs.get(owner)?.seq;
  const first = seq?.blocks[0];
  const last = seq?.blocks.at(-1);
  if (first === undefined || last === undefined) {
    return null;
  }
  return {
    items: [{ kind: 'seq', owner }],
    afterClose: selectRange(index, first.id, last.id),
  };
}

function foldTarget(fold: Id, path: Path): FoldTarget {
  return { items: [{ kind: 'fold', fold }], afterClose: selectFold(fold, path) };
}

/** Opening or closing the call block `path.at(-1)` seen through the rest of the path. */
function callTarget(index: DocIndex, path: Path): FoldTarget {
  const outer = path.slice(0, -1);
  const call = path.at(-1) ?? '';
  return {
    items: [{ kind: 'call', path }],
    afterClose:
      outer.length === 0
        ? selectBlock(index, call)
        : { kind: 'peek', path: outer, anchor: call, focus: call },
  };
}

/**
 * What holds the blocks `lo..hi` of the sequence `owner`, nearest first: the fold regions marked
 * there around them (smallest first), the sequence itself when it is a branch or loop body that
 * can fold, then the same around the block holding it, and so on out (UX Q20).
 */
function outward(index: DocIndex, start: Id, from: number, to: number): FoldTarget[] {
  const targets: FoldTarget[] = [];
  let owner: Id = start;
  let lo = from;
  let hi = to;
  for (;;) {
    const place = index.seqs.get(owner);
    if (place === undefined) {
      break;
    }
    const seq = place.seq;
    for (const fold of around(seq, seq.folds, lo, hi)) {
      targets.push(foldTarget(fold, []));
    }
    if (place.holder === null) {
      break;
    }
    if (wholeRegion(seq) === null && isFoldableSeq(seq)) {
      const target = seqTarget(index, owner);
      if (target !== null) {
        targets.push(target);
      }
    }
    const holder = index.blocks.get(place.holder);
    if (holder === undefined) {
      break;
    }
    owner = holder.owner;
    lo = holder.index;
    hi = holder.index;
  }
  return targets;
}

/** The regions of `folds` on `seq` that hold `lo..hi`, smallest first. */
function around(
  seq: Seq,
  folds: ReadonlyArray<{ readonly id: Id; readonly first: Id; readonly last: Id }>,
  lo: number,
  hi: number,
): ReadonlyArray<Id> {
  return folds
    .map((fold) => ({ fold, range: foldRange({ blocks: seq.blocks, folds: [] }, fold) }))
    .flatMap(({ fold, range }) =>
      range !== null && range[0] <= lo && hi <= range[1]
        ? [{ id: fold.id, size: range[1] - range[0] }]
        : [],
    )
    .sort((a, b) => a.size - b.size)
    .map((item) => item.id);
}

/**
 * The fold regions of the call site `path` that hold the blocks `lo..hi` of the called Method's
 * sequence `owner`, nearest first, walking out to the Method's body (R-EDIT-16). The Method's own
 * regions and branches are the Method's and are left alone here.
 */
function siteOutward(
  index: DocIndex,
  path: Path,
  start: Id,
  from: number,
  to: number,
): ReadonlyArray<Id> {
  const [outermost] = path;
  const call = outermost === undefined ? undefined : index.blocks.get(outermost)?.block;
  const inner = index.blocks.get(path.at(-1) ?? '')?.block;
  if (call?.kind !== 'call' || inner?.kind !== 'call' || inner.target.kind !== 'local') {
    return [];
  }
  const method = index.diagrams.get(inner.target.diagram);
  if (method === undefined) {
    return [];
  }
  const via = path.slice(1);
  const placed = placeSiteFolds(
    method.body,
    call.siteFolds.filter((fold) => fold.via.join(' ') === via.join(' ')),
  );
  const found: Id[] = [];
  let owner: Id = start;
  let lo = from;
  let hi = to;
  for (;;) {
    const place = index.seqs.get(owner);
    if (place === undefined) {
      break;
    }
    const ranges = placed.get(place.seq) ?? [];
    found.push(
      ...ranges
        .filter((range) => range.lo <= lo && hi <= range.hi)
        .sort((a, b) => a.hi - a.lo - (b.hi - b.lo))
        .map((range) => range.fold.id),
    );
    const holder = place.holder === null ? undefined : index.blocks.get(place.holder);
    if (holder === undefined) {
      break;
    }
    owner = holder.owner;
    lo = holder.index;
    hi = holder.index;
  }
  return found;
}

/**
 * Everything a fold command could act on for the selection, nearest first (UX Q20): what is
 * selected when it folds or opens, otherwise what holds it. A folded row or cell that is selected
 * comes first, so folding it again unfolds it. Inside an opened call block that is a region of
 * this call site, else the opened call block holding it (UX 4.1).
 */
export function foldTargets(
  index: DocIndex,
  view: View,
  selection: Selection | null,
): FoldTarget[] {
  if (selection === null) {
    return [];
  }
  const folded = new Set(view.folded);
  switch (selection.kind) {
    case 'head':
      return [];
    case 'peek':
      return peekTargets(index, selection);
    case 'fold': {
      const path = foldPath(selection);
      const self = foldTarget(selection.fold, path);
      if (path.length > 0) {
        return [self, callTarget(index, path)];
      }
      const owner = index.folds.get(selection.fold);
      const seq = owner === undefined ? undefined : index.seqs.get(owner)?.seq;
      const mark = seq?.folds.find((fold) => fold.id === selection.fold);
      const range = seq === undefined || mark === undefined ? null : foldRange(seq, mark);
      if (owner === undefined || range === null) {
        return [self];
      }
      return unique([self, ...outward(index, owner, range[0], range[1])]);
    }
    case 'branchLabel': {
      const place = index.branches.get(selection.branch);
      if (place === undefined) {
        return [];
      }
      const seq = place.branch.body;
      const region = wholeRegion(seq);
      const own =
        region !== null
          ? foldTarget(region, [])
          : isFoldableSeq(seq)
            ? seqTarget(index, selection.branch)
            : null;
      const outer = index.blocks.get(place.block.id);
      const rest = outer === undefined ? [] : outward(index, outer.owner, outer.index, outer.index);
      return unique([...(own === null ? [] : [own]), ...rest]);
    }
    case 'missingDefault':
      return foldTargets(index, view, selectBlock(index, selection.block));
    case 'blocks': {
      const ids = selectedBlocks(index, selection);
      const [first] = ids;
      const last = ids.at(-1);
      const a = first === undefined ? undefined : index.blocks.get(first);
      const b = last === undefined ? undefined : index.blocks.get(last);
      if (a === undefined || b === undefined || first === undefined) {
        return [];
      }
      const seq = index.seqs.get(a.owner)?.seq;
      const targets: FoldTarget[] = [];
      const isWhole = seq !== undefined && a.index === 0 && b.index === seq.blocks.length - 1;
      if (isWhole && folded.has(a.owner)) {
        // The row of a folded branch is selected: folding it again unfolds it.
        const row = seqTarget(index, a.owner);
        if (row !== null) {
          targets.push(row);
        }
      }
      if (ids.length === 1) {
        // A call block opens in place; a control block folds its inside.
        const inside = isOpenable(index, first)
          ? callTarget(index, [first])
          : controlTarget(index, first);
        if (inside !== null) {
          targets.push(inside);
        }
      }
      targets.push(...outward(index, a.owner, a.index, b.index));
      return unique(targets);
    }
  }
}

function peekTargets(
  index: DocIndex,
  selection: Extract<Selection, { kind: 'peek' }>,
): FoldTarget[] {
  const ids = peekBlocks(index, selection);
  const [first] = ids;
  const a = first === undefined ? undefined : index.blocks.get(first);
  const b = index.blocks.get(ids.at(-1) ?? '');
  if (a === undefined || b === undefined || first === undefined) {
    return [];
  }
  const targets: FoldTarget[] = [];
  if (ids.length === 1 && isOpenable(index, first)) {
    targets.push(callTarget(index, [...selection.path, first]));
  }
  for (const fold of siteOutward(index, selection.path, a.owner, a.index, b.index)) {
    targets.push(foldTarget(fold, selection.path));
  }
  targets.push(callTarget(index, selection.path));
  return targets;
}

function itemKey(item: FoldItem): string {
  switch (item.kind) {
    case 'seq':
      return item.owner;
    case 'fold':
      return item.fold;
    case 'call':
      return item.path.join('/');
  }
}

function unique(targets: ReadonlyArray<FoldTarget>): FoldTarget[] {
  const seen = new Set<string>();
  return targets.filter((target) => {
    const key = target.items.map(itemKey).join(' ');
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function samePath(a: Path, b: Path): boolean {
  return a.length === b.length && a.every((id, at) => id === b[at]);
}

function isClosed(view: View, item: FoldItem): boolean {
  switch (item.kind) {
    case 'seq':
      return view.folded.includes(item.owner);
    case 'fold':
      return view.folded.includes(item.fold);
    case 'call':
      return !view.opened.some((path) => samePath(path, item.path));
  }
}

/** The view with the items of a target folded or closed (`close`), or unfolded or opened. */
function withItems(view: View, items: ReadonlyArray<FoldItem>, close: boolean): View {
  const ids = items.flatMap((item) => (item.kind === 'call' ? [] : [itemKey(item)]));
  const paths = items.flatMap((item) => (item.kind === 'call' ? [item.path] : []));
  const folded = close
    ? [...view.folded, ...ids.filter((id) => !view.folded.includes(id))]
    : view.folded.filter((id) => !ids.includes(id));
  const kept = view.opened.filter((path) => !paths.some((other) => samePath(path, other)));
  const opened = close ? kept : [...kept, ...paths];
  return { ...view, folded, opened };
}

/**
 * How many times the Method a newly opened call calls is now shown along its path: the diagram
 * itself counts once if it is that Method, and every call of it on the path once (UX Q14).
 */
function depthOf(
  index: DocIndex,
  path: Path,
): { readonly count: number; readonly method: Id } | null {
  const last = index.blocks.get(path.at(-1) ?? '')?.block;
  if (last?.kind !== 'call' || last.target.kind !== 'local') {
    return null;
  }
  const method = last.target.diagram;
  const home = index.blocks.get(path[0] ?? '')?.diagram;
  let count = home === method ? 1 : 0;
  for (const id of path) {
    const call = index.blocks.get(id)?.block;
    if (call?.kind === 'call' && call.target.kind === 'local' && call.target.diagram === method) {
      count += 1;
    }
  }
  return { count, method };
}

/** The region a "remove" acts on, or why there is none. */
type ToRemove = { readonly fold: Id } | { readonly reason: EditorMessage };

/**
 * The fold region a "remove" acts on (interaction rules "접기 · 펼치기" 풀기): the selected region,
 * or the smallest region holding the selection. Inside an opened call block only regions of that
 * call site can go; the Method's own are removed in the Method (R-EDIT-16).
 */
export function regionToRemove(index: DocIndex, selection: Selection | null): ToRemove {
  if (selection === null) {
    return { reason: 'reason.nothingSelected' };
  }
  if (selection.kind === 'fold') {
    if (foldPath(selection).length > 0 && !index.siteFolds.has(selection.fold)) {
      return { reason: 'reason.methodFoldHere' };
    }
    return { fold: selection.fold };
  }
  if (selection.kind === 'head') {
    return { reason: 'reason.notOnHead' };
  }
  if (selection.kind === 'missingDefault') {
    return { reason: 'reason.noFoldRegion' };
  }
  const targets = foldTargets(
    index,
    { folded: [], opened: [], bands: true, resultSymbol: '←' },
    selection,
  );
  for (const target of targets) {
    const [item] = target.items;
    if (target.items.length === 1 && item?.kind === 'fold') {
      return { fold: item.fold };
    }
  }
  return { reason: 'reason.noFoldRegion' };
}

/** Makes the fold commands. */
export function foldCommands(deps: FoldDeps): ReadonlyArray<CommandSpec> {
  const { session } = deps;
  const index = (): DocIndex => session.index();
  const content = (): Content => session.state.doc.content;

  const whenFolding = (state: EditorState): Applies => {
    const selection = state.selection;
    if (selection === null) {
      return 'reason.nothingSelected';
    }
    if (selection.kind === 'head') {
      return 'reason.notOnHead';
    }
    return foldTargets(index(), state.doc.view, selection).length > 0
      ? true
      : 'reason.nothingToFold';
  };

  /** Folds or closes (`close`), or unfolds or opens, a target and says so. */
  const fold = (state: EditorState, target: FoldTarget, close: boolean): void => {
    const view = withItems(state.doc.view, target.items, close);
    let selection = state.selection;
    if (close && target.afterClose !== null) {
      selection = target.afterClose;
    } else if (!close && selection?.kind === 'fold' && !view.bands) {
      // Without name bands an unfolded region is not drawn: its blocks stay selected.
      const blocks = foldBlocks(index(), selection.fold);
      const [first] = blocks;
      const last = blocks.at(-1);
      selection =
        first === undefined || last === undefined ? null : selectRange(index(), first, last);
    }
    session.setView(view, selection);
    const [only] = target.items;
    if (only?.kind === 'call' && target.items.length === 1) {
      notifyCall(only.path, close);
      return;
    }
    session.notify(close ? 'notice.folded' : 'notice.unfolded');
  };

  /** Opening the same Method a third time along the path tells so, after opening (UX Q14). */
  const notifyCall = (path: Path, close: boolean): void => {
    if (close) {
      session.notify('notice.closed');
      return;
    }
    const depth = depthOf(index(), path);
    const head = depth === null ? null : (index().diagrams.get(depth.method)?.head ?? null);
    if (depth !== null && head !== null && depth.count >= 3) {
      session.notify(
        message('notice.openedAgain', { name: headName(head), count: depth.count }),
        'warn',
      );
      return;
    }
    session.notify('notice.opened');
  };

  const toggleSpec = spec('view.fold.toggle', {
    edits: false,
    when: whenFolding,
    run: (state) => {
      const [target] = foldTargets(index(), state.doc.view, state.selection);
      if (target !== undefined) {
        const isFolded = target.items.some((item) => isClosed(state.doc.view, item));
        fold(state, target, !isFolded);
      }
    },
    menu: { menu: 'view', group: 1, order: 1 },
    context: ['blocks', 'branchLabel', 'fold', 'missingDefault', 'peek'],
  });

  const openSpec = spec('view.fold.open', {
    edits: false,
    when: (state) => {
      const applies = whenFolding(state);
      if (applies !== true) {
        return applies;
      }
      return foldTargets(index(), state.doc.view, state.selection).some((target) =>
        target.items.some((item) => isClosed(state.doc.view, item)),
      )
        ? true
        : 'reason.nothingToUnfold';
    },
    run: (state) => {
      const target = foldTargets(index(), state.doc.view, state.selection).find((t) =>
        t.items.some((item) => isClosed(state.doc.view, item)),
      );
      if (target !== undefined) {
        fold(state, target, false);
      }
    },
  });

  const closeSpec = spec('view.fold.close', {
    edits: false,
    when: (state) => {
      const applies = whenFolding(state);
      if (applies !== true) {
        return applies;
      }
      return foldTargets(index(), state.doc.view, state.selection).some((target) =>
        target.items.some((item) => !isClosed(state.doc.view, item)),
      )
        ? true
        : 'reason.nothingToFold';
    },
    run: (state) => {
      const target = foldTargets(index(), state.doc.view, state.selection).find((t) =>
        t.items.some((item) => !isClosed(state.doc.view, item)),
      );
      if (target !== undefined) {
        fold(state, target, true);
      }
    },
  });

  /** After making a region: select it, fold it and open its name (interaction rules 4). */
  const afterMade = (state: EditorState, made: Id | undefined, path: Path): After => {
    if (made === undefined) {
      return { selection: state.selection };
    }
    const view = state.doc.view;
    return {
      selection: selectFold(made, path),
      view: { ...view, folded: [...view.folded, made] },
      edit: {
        field: { kind: 'fold', fold: made, ...(path.length === 0 ? {} : { path }) },
        caret: 'selectAll',
        joinsLast: true,
      },
    };
  };

  const makeSpec = spec('fold.make', {
    edits: true,
    // A region of an opened call site is made on its blocks (R-EDIT-16).
    onPeek: true,
    when: (state) => {
      const selection = state.selection;
      if (selection === null) {
        return 'reason.nothingSelected';
      }
      switch (selection.kind) {
        case 'blocks':
        case 'peek':
          return true;
        case 'fold':
          return 'reason.foldExists';
        case 'head':
        case 'branchLabel':
        case 'missingDefault':
          return 'reason.selectBlocksToFold';
      }
    },
    run: (state) => {
      const selection = state.selection;
      if (selection?.kind === 'peek') {
        const [call] = selection.path;
        if (call === undefined) {
          return;
        }
        const result = makeSiteFold(content(), {
          call,
          via: selection.path.slice(1),
          first: selection.anchor,
          last: selection.focus,
          ids: session.ids(),
        });
        if (session.commit(result, (ok) => afterMade(state, ok.touched[0], selection.path))) {
          session.notify('notice.siteFoldMade');
        }
        return;
      }
      const target = targetOf(selection);
      if (target === null) {
        return;
      }
      const result = makeFold(content(), { target, ids: session.ids() });
      if (session.commit(result, (ok) => afterMade(state, ok.touched[0], []))) {
        session.notify('notice.foldMade');
      }
    },
    menu: { menu: 'view', group: 2, order: 1 },
    context: ['blocks', 'peek'],
  });

  const removeSpec = spec('fold.remove', {
    edits: true,
    onPeek: true,
    when: (state) => {
      const found = regionToRemove(index(), state.selection);
      return 'fold' in found ? true : found.reason;
    },
    run: (state) => {
      const found = regionToRemove(index(), state.selection);
      if (!('fold' in found)) {
        return;
      }
      const fold = found.fold;
      const name = session.foldName(fold);
      const selection = state.selection;
      const isSelected = selection?.kind === 'fold';
      const path = selection === null ? [] : selection.kind === 'fold' ? foldPath(selection) : [];
      const isApplied = session.commit(removeFold(content(), { fold }), (ok) => {
        const [first, last] = ok.touched;
        if (!isSelected || first === undefined || last === undefined) {
          return { selection };
        }
        return {
          selection:
            path.length === 0
              ? selectRange(indexDoc(ok.content), first, last)
              : { kind: 'peek', path, anchor: first, focus: last },
        };
      });
      if (isApplied) {
        session.notify(message('notice.foldRemoved', { name }));
      }
    },
    menu: { menu: 'view', group: 2, order: 2 },
    context: ['blocks', 'fold', 'peek'],
  });

  const bandsSpec = spec('view.bands', {
    edits: false,
    when: always,
    run: (state) => {
      const view = state.doc.view;
      session.setView({ ...view, bands: !view.bands });
    },
    checked: (state) => state.doc.view.bands,
    menu: { menu: 'view', group: 3, order: 1 },
  });

  return [toggleSpec, openSpec, closeSpec, makeSpec, removeSpec, bandsSpec];
}
