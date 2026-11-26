// The editing session: the state, undo, notices and questions, without the DOM. The inline
// editor's text flow (`text-editing.ts`) and the key reader (`key-reader.ts`) are its parts.
// The DOM view and the commands drive it; tests drive it in Node.
import type {
  Block,
  Content,
  Doc,
  Id,
  IdGenerator,
  KeptSettings,
  Note,
  OkResult,
  PhaseTimer,
  Reason,
  Rendering,
  Result,
  View,
} from '@ariadne-nsd/core';
import {
  checkInvariants,
  createIdGenerator,
  defaultFoldName,
  drawingMessage,
  forgetRetargeted,
  headName,
  pathSeparator,
  renderDoc,
  settleSiteFolds,
  siteFoldOf,
  untimed,
} from '@ariadne-nsd/core';

import type { ClipboardData } from '../clipboard/clip-format';
import type { ChromeState, Notice, Question } from '../contracts';
import type { EditorMessage, Message, MessageKey } from '../i18n/messages';
import { message } from '../i18n/messages';
import type { KeyBinding } from '../input/keys';
import type { DocIndex } from '../model/doc-index';
import { indexDoc, isEmptyBlock } from '../model/doc-index';
import type { ShownIndex } from '../model/shown-index';
import { shownIndexOf } from '../model/shown-index';
import type { CallPart, Caret, EditField, EditorState, Extracted } from '../state/editor-state';
import {
  clampZoom,
  isSameFolding,
  pushUndo,
  stepHistory,
  withContent,
  withSelection,
} from '../state/editor-state';
import type { Selection } from '../state/selection';
import { peekBlocks, selectedBlocks, validSelection } from '../state/selection';
import { callName, callParts } from './call-names';
import type { Timers } from './key-reader';
import { KeyReader, keyHintTitle } from './key-reader';
import { TextEditing } from './text-editing';

export type { Timers } from './key-reader';
export { keyHintDelay, keyHintTitle } from './key-reader';

/** The system clipboard, or the editor's own when the browser blocks it (03-editor 3.3). */
export type ClipboardPort = {
  /** Writes both forms. Returns where they went. */
  write(data: ClipboardData): Promise<'system' | 'memory'>;
  read(): Promise<ClipboardData>;
};

/** What the session needs from outside. */
export type SessionOptions = {
  readonly clipboard: ClipboardPort;
  readonly timers: Timers;
  /** Whether the key hint is shown after 0.4 s (setting `editor.keyHint`). */
  readonly isKeyHintEnabled: () => boolean;
  /** Unexpected errors and invariant violations (coding guide 5), for the problem report. */
  readonly log: (text: string, detail?: unknown) => void;
  readonly keyBindings: ReadonlyArray<KeyBinding>;
  /**
   * Times the parts of an edit for the check mode (QA-07's segments, 06-web 9). Default: untimed.
   */
  readonly time?: PhaseTimer;
};

/** How a document is put into the session. */
export type LoadOptions = {
  readonly kept: KeptSettings;
  readonly selection: Selection | null;
  readonly isDirty: boolean;
  readonly readOnly: boolean;
};

/** What to do after a command changed the content. */
export type After = {
  readonly selection: Selection | null;
  /** The view state to show the new content with (not an undo step); the same view if left out. */
  readonly view?: View;
  /** Open the inline editor on this field (after inserting or wrapping). */
  readonly edit?: {
    readonly field: EditField;
    readonly caret: Caret | 'clear';
    /** The field names the Method an extract just made (UX XM2). */
    readonly extracted?: Extracted;
    /** What is typed joins the undo step that opened the field (a new fold region's name). */
    readonly joinsLast?: true;
  };
};

/**
 * The document with every drawn call site holding its own folding and fold regions (ADR-0046,
 * ADR-0047). Copying the Method's regions changes the content.
 */
function settled(doc: Doc): Doc {
  return settleSiteFolds(doc);
}

/** The editing session. One per open document view. */
export class EditorSession {
  private current: EditorState;
  private rendered: Rendering;
  private indexed: DocIndex;
  private shownCache: ShownIndex | null = null;
  private saved: Doc | null;
  private keptSettings: KeptSettings;
  private readonly listeners = new Set<(state: EditorState) => void>();
  private noticeValue: Notice | null = null;
  private questionValue: Question | null = null;
  private nextId = 1;
  private readonly text: TextEditing;
  private readonly keys: KeyReader;
  /** Runs a command by id (the registry). Set by the editor after the registry is made. */
  runCommand: (id: string, args?: unknown) => void = () => undefined;
  /** Times the parts of an edit (the check mode); the view times its drawing with it too. */
  readonly time: PhaseTimer;

  constructor(
    opened: Doc,
    private readonly options: SessionOptions,
    load: LoadOptions,
  ) {
    const doc = settled(opened);
    this.time = options.time ?? untimed;
    const write = (state: EditorState): void => {
      this.setState(state);
    };
    this.text = new TextEditing(this, write);
    this.keys = new KeyReader(this, write, () => this.questionValue, options);
    this.rendered = this.render(doc);
    this.indexed = indexDoc(doc.content);
    this.saved = load.isDirty ? null : doc;
    this.keptSettings = load.kept;
    this.current = {
      doc,
      undo: [],
      redo: [],
      selection: validSelection(this.indexed, load.selection, this.shownOf(doc)),
      lastSelected: null,
      editing: null,
      dirty: load.isDirty,
      readOnly: load.readOnly,
      zoom: 1,
      layout: this.rendered.layout,
      revision: 0,
      mode: 'normal',
      pendingKeys: null,
    };
  }

  /** The current state. */
  get state(): EditorState {
    return this.current;
  }

  /** The last rendering of the document (layout, scene, SVG, code points). */
  get rendering(): Rendering {
    return this.rendered;
  }

  /** Settings from the opened file that the model cannot hold (01-file-format 3.3). */
  get kept(): KeptSettings {
    return this.keptSettings;
  }

  /** The lookup tables of the current content. */
  index(): DocIndex {
    if (this.indexed.content !== this.current.doc.content) {
      this.indexed = indexDoc(this.current.doc.content);
    }
    return this.indexed;
  }

  /**
   * What the diagram shows now, as a tree of screen ids: folded things count as one, opened call
   * blocks hold their Method's blocks (03-editor 2.2).
   */
  shown(): ShownIndex {
    return this.shownOf(this.current.doc);
  }

  private shownOf(doc: Doc): ShownIndex {
    if (this.shownCache?.doc !== doc) {
      this.shownCache = shownIndexOf(doc);
    }
    return this.shownCache;
  }

  /** Calls `listener` after every state change. Returns the function that stops it. */
  subscribe(listener: (state: EditorState) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private setState(state: EditorState): void {
    this.current = state;
    this.time('notify', () => {
      for (const listener of [...this.listeners]) {
        listener(state);
      }
    });
  }

  /** Lays out and draws a document (timed in the check mode). */
  private render(doc: Doc): Rendering {
    return renderDoc(doc, this.time);
  }

  /** Calls the listeners again without a change (the notice or the question changed). */
  private touch(): void {
    this.setState(this.current);
  }

  /** Puts another document in. Undo, redo and the selection start empty (03-editor 6). */
  load(opened: Doc, load: LoadOptions): void {
    const doc = settled(opened);
    this.closeQuestion();
    this.noticeValue = null;
    this.keptSettings = load.kept;
    this.saved = load.isDirty ? null : doc;
    this.rendered = this.render(doc);
    this.indexed = indexDoc(doc.content);
    this.clearPending();
    this.setState({
      ...this.current,
      doc,
      undo: [],
      redo: [],
      selection: validSelection(this.indexed, load.selection, this.shownOf(doc)),
      lastSelected: null,
      editing: null,
      dirty: load.isDirty,
      readOnly: load.readOnly,
      layout: this.rendered.layout,
      revision: this.current.revision + 1,
      mode: 'normal',
    });
  }

  /** The document was saved as it is now. */
  markSaved(doc: Doc): void {
    this.saved = doc;
    this.setState({ ...this.current, dirty: !this.isSaved(this.current.doc) });
  }

  private isSaved(doc: Doc): boolean {
    return (
      this.saved !== null && this.saved.content === doc.content && this.saved.view === doc.view
    );
  }

  private readonly isDirty = (doc: Doc): boolean => !this.isSaved(doc);

  /** Draws the document again, for example after a user setting of the screen changed. */
  rerender(): void {
    this.rendered = this.render(this.current.doc);
    this.setState({ ...this.current, layout: this.rendered.layout });
  }

  // Notices and questions (the status bar).

  /** Shows a message of the editor's catalog in the status bar. */
  notify(value: EditorMessage, level: Notice['level'] = 'info'): void {
    this.notifyMessage(value, level);
  }

  /** Shows any message in the status bar, also one from a shell's or the UI's catalog. */
  notifyMessage(value: Message, level: Notice['level'] = 'info'): void {
    this.noticeValue = { id: this.nextId++, message: value, level };
    this.touch();
  }

  /** Removes the notice, if any. */
  clearNotice(): void {
    if (this.noticeValue !== null) {
      this.noticeValue = null;
      this.touch();
    }
  }

  /**
   * Asks a question with buttons in the status bar (UX MD3). The first choice is the default
   * (Enter). Choosing or dismissing closes it.
   */
  ask(
    text: EditorMessage,
    choices: ReadonlyArray<{ readonly title: EditorMessage; readonly choose: () => void }>,
  ): void {
    const id = this.nextId++;
    const close = (): void => {
      if (this.questionValue?.id === id) {
        this.questionValue = null;
        this.touch();
      }
    };
    this.questionValue = {
      id,
      message: text,
      choices: choices.map((choice, i) => ({
        title: choice.title,
        ...(i === 0 ? { isDefault: true } : {}),
        choose: () => {
          close();
          choice.choose();
        },
      })),
      dismiss: close,
    };
    this.noticeValue = null;
    this.touch();
  }

  private closeQuestion(): void {
    this.questionValue = null;
  }

  /** The status bar's content. Dialogs and pickers are the editor's (`createEditor`). */
  chrome(): Omit<ChromeState, 'dialog' | 'picker'> {
    const { editing, mode, pendingKeys, zoom } = this.current;
    return {
      selection: this.describeSelection(),
      notice: this.noticeValue,
      question: this.questionValue,
      pendingKeys,
      mode: editing !== null ? 'editing' : mode,
      isKeyHintShown: this.keys.isHintShown,
      keyHintTitle: pendingKeys === null ? null : keyHintTitle(pendingKeys),
      zoom,
    };
  }

  private describeSelection(): EditorMessage | null {
    const index = this.index();
    const selection = this.current.selection;
    if (selection === null) {
      return null;
    }
    switch (selection.kind) {
      case 'blocks': {
        const ids = selectedBlocks(index, selection);
        const [only] = ids;
        if (ids.length !== 1 || only === undefined) {
          return message('selection.blocks', { count: ids.length });
        }
        const block = index.blocks.get(only)?.block;
        if (block === undefined) {
          return null;
        }
        return isEmptyBlock(block) ? 'selection.empty' : `selection.${block.kind}`;
      }
      case 'branchLabel':
        return message('selection.branchLabel', { label: this.labelText(selection.branch) });
      case 'missingDefault':
        return 'selection.missingDefault';
      case 'head': {
        const head = index.diagrams.get(selection.diagram)?.head ?? null;
        if (head === null) {
          return null;
        }
        const key = head.kind === 'event' ? 'selection.eventHead' : 'selection.methodHead';
        return message(key, { name: headName(head) });
      }
      case 'fold':
        return message('selection.fold', { name: this.foldName(selection.fold) });
      case 'peek':
        return message('selection.peek', { count: peekBlocks(index, selection).length });
    }
  }

  /** A fold region's name as drawn: its own name, or the default name (R-EDIT-23). */
  foldName(fold: Id): string {
    const index = this.index();
    const content = this.current.doc.content;
    const words = {
      locale: content.settings.locale,
      resultSymbol: this.current.doc.view.resultSymbol,
      diagrams: index.diagrams,
    };
    const owner = index.folds.get(fold);
    if (owner !== undefined) {
      const seq = index.seqs.get(owner)?.seq;
      const mark = seq?.folds.find((item) => item.id === fold);
      if (seq === undefined || mark === undefined) {
        return '';
      }
      if (mark.name !== undefined && mark.name !== '') {
        return mark.name;
      }
      const first = seq.blocks.findIndex((block) => block.id === mark.first);
      const last = seq.blocks.findIndex((block) => block.id === mark.last);
      return defaultFoldName(words, seq.blocks.slice(first, last + 1));
    }
    const site = siteFoldOf(content, fold);
    if (site === null) {
      return '';
    }
    if (site.fold.name !== undefined && site.fold.name !== '') {
      return site.fold.name;
    }
    const first = index.blocks.get(site.fold.first) ?? index.blocks.get(site.fold.last);
    if (first === undefined) {
      return '';
    }
    const seq = index.seqs.get(first.owner)?.seq;
    const lastPlace = index.blocks.get(site.fold.last);
    const hi = lastPlace?.owner === first.owner ? lastPlace.index : first.index;
    return defaultFoldName(
      words,
      seq?.blocks.slice(Math.min(first.index, hi), Math.max(first.index, hi) + 1) ?? [],
    );
  }

  /** A branch label as drawn: the user's label, or the fixed word. */
  labelText(branch: string): string {
    const place = this.index().branches.get(branch);
    if (place === undefined) {
      return '';
    }
    const label = place.branch.label;
    if (label !== undefined && label !== '') {
      return label;
    }
    // The fixed words are in the document's drawing language (ADR-0041).
    const locale = this.current.doc.content.settings.locale;
    if (place.isDefault) {
      return drawingMessage(locale, 'case.default');
    }
    return drawingMessage(locale, place.column === 0 ? 'if.yes' : 'if.no');
  }

  // Selection and view.

  /** Changes the selection. */
  select(selection: Selection | null): void {
    this.setState(
      withSelection(this.current, validSelection(this.index(), selection, this.shown())),
    );
  }

  /**
   * Changes the view state: what is folded, opened and banded (01-model 2). A change of what is
   * folded or opened is one undo step (ADR-0048); the name bands and the result symbol are not.
   * Either way the document is changed (unsaved). While it is view only (03-editor 6.4) nothing
   * is a step and the document stays as saved. The selection becomes `selection` (when given),
   * dropped if it is no longer shown.
   */
  setView(view: View, selection?: Selection | null): void {
    const doc = settled({ content: this.current.doc.content, view });
    this.rendered = this.render(doc);
    const next = selection === undefined ? this.current.selection : selection;
    const isCopied = doc.content !== this.current.doc.content;
    const state = withSelection(
      this.current,
      validSelection(isCopied ? indexDoc(doc.content) : this.index(), next, this.shownOf(doc)),
    );
    // Folding, unfolding, opening and closing is one undo step (ADR-0048). Opening a call block
    // for the first time copies the Method's fold regions there: the same step (ADR-0047).
    const isStep =
      !this.current.readOnly && (isCopied || !isSameFolding(this.current.doc.view, doc.view));
    this.setState({
      ...state,
      doc,
      undo: isStep ? pushUndo(this.current) : state.undo,
      redo: isStep ? [] : state.redo,
      dirty: this.current.readOnly ? this.current.dirty : this.isDirty(doc),
      layout: this.rendered.layout,
      revision: this.current.revision + 1,
    });
  }

  /** Starts or ends selecting a range with `v`. */
  setMode(mode: 'normal' | 'visual'): void {
    this.setState({ ...this.current, mode });
  }

  /** Sets the zoom, rounded to a 10% step inside 40% ~ 300% (03-editor 1.1). */
  setZoom(zoom: number): void {
    const next = clampZoom(zoom);
    if (next !== this.current.zoom) {
      this.setState({ ...this.current, zoom: next });
    }
  }

  /** Turns view-only on or off (03-editor 6.4). */
  setReadOnly(readOnly: boolean): void {
    if (readOnly !== this.current.readOnly) {
      this.setState({ ...this.current, readOnly, editing: readOnly ? null : this.current.editing });
    }
  }

  // Content changes.

  /**
   * A new id generator. Ids still named by the view state are avoided, so a folded id is never
   * given to a new node (01-model 1.7).
   */
  ids(): IdGenerator {
    const { content, view } = this.current.doc;
    const named = view.folded.flatMap((entry) => entry.split(pathSeparator));
    return createIdGenerator(content, [...named, ...view.opened.flat()]);
  }

  /**
   * Applies a command's result: a refusal goes to the status bar (or asks, for
   * `askConvertIfToCase`); a success replaces the content in one undo step and sets what comes
   * next. Returns whether the content was taken.
   */
  commit(result: Result, after: (ok: OkResult) => After): boolean {
    if (!result.ok) {
      this.refuse(result.reason);
      return false;
    }
    const isApplied = this.apply(result.content, after(result));
    if (isApplied && result.note !== undefined) {
      this.handleNote(result.note);
    }
    return isApplied;
  }

  /**
   * Replaces the content (one undo step), unless it breaks an invariant: that is a bug, so the
   * document is left as it was and the problem is logged (coding guide 5).
   */
  apply(changed: Content, after: After, isAmend = false): boolean {
    // A call site the change shows for the first time takes the Method's regions in the same step.
    const { content, view } = settleSiteFolds({
      content: changed,
      view: forgetRetargeted(
        this.current.doc.content,
        changed,
        after.view ?? this.current.doc.view,
        false,
      ),
    });
    if (content !== this.current.doc.content) {
      const violations = this.time('check', () => checkInvariants(content));
      if (violations.length > 0) {
        this.options.log('A command broke the model invariants', violations);
        this.notify('notice.internalError', 'warn');
        return false;
      }
    }
    const doc: Doc =
      content === this.current.doc.content && view === this.current.doc.view
        ? this.current.doc
        : { content, view };
    if (doc !== this.current.doc) {
      this.rendered = this.render(doc);
    }
    const index = indexDoc(content);
    const selection = validSelection(index, after.selection, this.shownOf(doc));
    this.setState(
      withContent(
        this.current,
        content,
        selection,
        this.rendered.layout,
        this.isDirty,
        isAmend,
        view,
      ),
    );
    if (after.edit !== undefined) {
      this.startEditing(
        after.edit.field,
        after.edit.caret,
        after.edit.extracted,
        after.edit.joinsLast === true,
      );
    }
    return true;
  }

  /** Tells why a command did not run, or asks when the reason is a question. */
  refuse(reason: Reason): void {
    if (reason.code === 'askConvertIfToCase' && reason.node !== undefined) {
      const block = reason.node;
      this.ask('question.convertIfToCase', [
        {
          title: 'choice.convertToCase',
          choose: () => {
            this.runCommand('branch.convertIfToCase', { block });
          },
        },
        { title: 'choice.keepIf', choose: () => undefined },
      ]);
      return;
    }
    const key: MessageKey = `reason.${reason.code}`;
    this.notify(key, 'warn');
  }

  private handleNote(note: Note): void {
    switch (note.kind) {
      case 'offerConvertCaseToIf': {
        const block = note.node;
        this.ask('question.convertCaseToIf', [
          {
            title: 'choice.convertToIf',
            choose: () => {
              this.runCommand('branch.convertCaseToIf', { block });
            },
          },
          { title: 'choice.keepCase', choose: () => undefined },
        ]);
        return;
      }
      case 'checkCondition':
        this.notify('notice.checkCondition', 'warn');
        return;
    }
  }

  /** Undo or redo one step. The selection stays if what it names is still there (UX Q19). */
  history(direction: 'undo' | 'redo'): boolean {
    const before = this.current.doc.content;
    const stepped = stepHistory(
      this.current,
      direction,
      (doc) => {
        this.rendered = this.render(doc);
        return this.rendered.layout;
      },
      this.isDirty,
    );
    if (stepped === null) {
      this.notify(direction === 'undo' ? 'reason.nothingToUndo' : 'reason.nothingToRedo');
      return false;
    }
    const state = this.withStepView(stepped.state, before);
    const index = indexDoc(state.doc.content);
    this.setState({
      ...state,
      selection: validSelection(index, state.selection, this.shownOf(state.doc)),
    });
    return true;
  }

  /**
   * The view after an undo or redo: call sites that now call something else start over. Regions
   * they take from their Method join the step undone or redone (ADR-0047).
   */
  private withStepView(state: EditorState, before: Content): EditorState {
    const { content, view } = state.doc;
    const doc = settleSiteFolds({
      content,
      view: forgetRetargeted(before, content, view, true),
    });
    if (doc.content === content && doc.view === view) {
      return state;
    }
    this.rendered = this.render(doc);
    return { ...state, doc, dirty: this.isDirty(doc), layout: this.rendered.layout };
  }

  // The inline editor (03-editor 3.4), in `text-editing.ts`.

  /**
   * The fields of a call block, in `Tab` order (interaction rules "호출 블록"): the arguments,
   * then the result. A call to a Method that receives nothing has the result only; a call by a
   * written name has its name last (R-BLK-08, UX CB6).
   */
  callParts(block: Block): ReadonlyArray<CallPart> {
    return callParts(this.index(), block);
  }

  /** The name a call block shows now, without the "no name" word (empty then). */
  callName(block: Block): string {
    return callName(this.index(), block);
  }

  /**
   * The field the text edit commands open on a block: its text, or for a call block its first
   * field (the arguments, or the result when the Method receives nothing).
   */
  blockField(id: Id): EditField {
    return this.text.blockField(id);
  }

  /** The text a field opens with, or why it cannot be edited. */
  fieldText(field: EditField): { readonly text: string } | { readonly reason: EditorMessage } {
    return this.text.fieldText(field);
  }

  /** Opens the inline editor on a field. Returns `true`, or why it did not open. */
  startEditing(
    field: EditField,
    caret: Caret | 'clear',
    extracted?: Extracted,
    joinsLast = false,
  ): true | EditorMessage {
    return this.text.startEditing(field, caret, extracted, joinsLast);
  }

  /**
   * `Tab` in a call block: keeps what was typed and moves to the other field (interaction rules
   * "호출 블록"). Returns `false` when there is no other field (a Method receiving nothing).
   */
  switchCallPart(text: string): boolean {
    return this.text.switchCallPart(text);
  }

  /**
   * Closes the inline editor and runs one text edit (01-model 4.4, UX MD2). The same text as
   * when it opened runs nothing, so it leaves no undo step.
   */
  commitEditing(text: string): void {
    this.text.commitEditing(text);
  }

  /** Closes the inline editor without running anything. */
  cancelEditing(): void {
    this.text.cancelEditing();
  }

  // Keys (03-editor 4), in `key-reader.ts`.

  /**
   * Reads one key of the diagram area (not of the inline editor or an input box). Returns
   * whether the key was used, so the caller can stop the browser's own action.
   */
  handleKey(stroke: string): boolean {
    return this.keys.handleKey(stroke);
  }

  /** Drops a waiting first key. */
  clearPending(): void {
    this.keys.clearPending();
  }

  /** Stops the timers. */
  dispose(): void {
    this.keys.clearHintTimer();
    this.listeners.clear();
  }
}
