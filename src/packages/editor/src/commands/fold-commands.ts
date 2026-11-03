// The fold commands (interaction rules "접기 · 펼치기", R-EDIT-13, R-EDIT-14): fold and unfold,
// make and remove fold regions, and show or hide the name bands. Folding changes the view state
// only, so it is not an undo step (UX Q9); making and removing a region changes the content.
import type { Id, Path, Seq, View } from '@ariadne-nsd/core';
import { foldRange, makeFold, removeFold } from '@ariadne-nsd/core';

import type { CommandSpec } from '../contracts';
import { message } from '../i18n/messages';
import type { DocIndex } from '../model/doc-index';
import { childSeqs, indexDoc, isControl } from '../model/doc-index';
import type { EditorSession } from '../session/session';
import type { EditorState } from '../state/editor-state';
import type { Selection } from '../state/selection';
import {
  foldBlocks,
  foldPath,
  selectBlock,
  selectFold,
  selectRange,
  selectedBlocks,
  targetOf,
} from '../state/selection';
import type { Applies } from './spec';
import { always, spec } from './spec';

/** One thing that folds: a branch or loop body (its owner), or a fold region. */
type FoldItem =
  { readonly kind: 'seq'; readonly owner: Id } | { readonly kind: 'fold'; readonly fold: Id };

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
    const around = seq.folds
      .map((fold) => ({ fold, range: foldRange(seq, fold) }))
      .flatMap(({ fold, range }) =>
        range !== null && range[0] <= lo && hi <= range[1]
          ? [{ fold, size: range[1] - range[0] }]
          : [],
      )
      .sort((a, b) => a.size - b.size);
    for (const { fold } of around) {
      targets.push(foldTarget(fold.id, []));
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

/**
 * Everything a fold command could act on for the selection, nearest first (UX Q20): what is
 * selected when it folds, otherwise what holds it. A folded row or cell that is selected comes
 * first, so folding it again unfolds it.
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
    case 'peek':
      return [];
    case 'fold': {
      const path = foldPath(selection);
      const owner = index.folds.get(selection.fold);
      const seq = owner === undefined ? undefined : index.seqs.get(owner)?.seq;
      const mark = seq?.folds.find((fold) => fold.id === selection.fold);
      const range = seq === undefined || mark === undefined ? null : foldRange(seq, mark);
      const self = foldTarget(selection.fold, path);
      if (owner === undefined || range === null || path.length > 0) {
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
      if (a === undefined || b === undefined) {
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
      if (ids.length === 1 && first !== undefined) {
        const inside = controlTarget(index, first);
        if (inside !== null) {
          targets.push(inside);
        }
      }
      targets.push(...outward(index, a.owner, a.index, b.index));
      return unique(targets);
    }
  }
}

function unique(targets: ReadonlyArray<FoldTarget>): FoldTarget[] {
  const seen = new Set<string>();
  return targets.filter((target) => {
    const key = target.items
      .map((item) => (item.kind === 'seq' ? item.owner : item.fold))
      .join(' ');
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function isClosed(view: View, item: FoldItem): boolean {
  return view.folded.includes(item.kind === 'seq' ? item.owner : item.fold);
}

/** The view with the items of a target folded (`close`) or unfolded. */
function withItems(view: View, items: ReadonlyArray<FoldItem>, close: boolean): View {
  const ids = items.map((item) => (item.kind === 'seq' ? item.owner : item.fold));
  const folded = close
    ? [...view.folded, ...ids.filter((id) => !view.folded.includes(id))]
    : view.folded.filter((id) => !ids.includes(id));
  return { ...view, folded };
}

/**
 * The fold region a "remove" acts on (interaction rules "접기 · 펼치기" 풀기): the selected region,
 * or the smallest region holding the selection.
 */
export function regionToRemove(index: DocIndex, selection: Selection | null): Id | null {
  if (selection === null) {
    return null;
  }
  if (selection.kind === 'fold') {
    return selection.fold;
  }
  if (selection.kind !== 'blocks' && selection.kind !== 'branchLabel') {
    return null;
  }
  const targets = foldTargets(
    index,
    { folded: [], opened: [], bands: true, resultSymbol: '←' },
    selection,
  );
  for (const target of targets) {
    const [item] = target.items;
    if (target.items.length === 1 && item?.kind === 'fold') {
      return item.fold;
    }
  }
  return null;
}

/** Makes the fold commands. */
export function foldCommands(deps: FoldDeps): ReadonlyArray<CommandSpec> {
  const { session } = deps;
  const index = (): DocIndex => session.index();

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

  /** Folds (`close`) or unfolds a target and says so. */
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
    session.notify(close ? 'notice.folded' : 'notice.unfolded');
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
    context: ['blocks', 'branchLabel', 'fold', 'missingDefault'],
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

  const makeSpec = spec('fold.make', {
    edits: true,
    when: (state) => {
      const selection = state.selection;
      if (selection === null) {
        return 'reason.nothingSelected';
      }
      switch (selection.kind) {
        case 'blocks':
          return true;
        case 'fold':
          return 'reason.foldExists';
        case 'peek':
        case 'head':
        case 'branchLabel':
        case 'missingDefault':
          return 'reason.selectBlocksToFold';
      }
    },
    run: (state) => {
      const target = targetOf(state.selection);
      if (target === null) {
        return;
      }
      // Made, folded at once, and its name asked in the folded cell (interaction rules 4).
      const result = makeFold(session.state.doc.content, { target, ids: session.ids() });
      const isApplied = session.commit(result, (ok) => {
        const [made] = ok.touched;
        if (made === undefined) {
          return { selection: state.selection };
        }
        const view = state.doc.view;
        return {
          selection: selectFold(made, []),
          view: { ...view, folded: [...view.folded, made] },
          edit: { field: { kind: 'fold', fold: made }, caret: 'selectAll', joinsLast: true },
        };
      });
      if (isApplied) {
        session.notify('notice.foldMade');
      }
    },
    menu: { menu: 'view', group: 2, order: 1 },
    context: ['blocks'],
  });

  const removeSpec = spec('fold.remove', {
    edits: true,
    when: (state) => {
      if (state.selection === null) {
        return 'reason.nothingSelected';
      }
      if (state.selection.kind === 'head') {
        return 'reason.notOnHead';
      }
      return regionToRemove(index(), state.selection) === null ? 'reason.noFoldRegion' : true;
    },
    run: (state) => {
      const fold = regionToRemove(index(), state.selection);
      if (fold === null) {
        return;
      }
      const name = session.foldName(fold);
      const wasSelected = state.selection?.kind === 'fold';
      const isApplied = session.commit(removeFold(session.state.doc.content, { fold }), (ok) => {
        const [first, last] = ok.touched;
        if (!wasSelected || first === undefined || last === undefined) {
          return { selection: state.selection };
        }
        return { selection: selectRange(indexDoc(ok.content), first, last) };
      });
      if (isApplied) {
        session.notify(message('notice.foldRemoved', { name }));
      }
    },
    menu: { menu: 'view', group: 2, order: 2 },
    context: ['blocks', 'fold'],
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
