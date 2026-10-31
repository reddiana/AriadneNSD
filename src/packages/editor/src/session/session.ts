// The editing session: the state, undo, notices, the inline editor's text flow and the key
// reader, without the DOM. The DOM view and the commands drive it; tests drive it in Node.
import type {
  Content,
  Doc,
  IdGenerator,
  KeptSettings,
  Locale,
  Note,
  OkResult,
  Reason,
  Rendering,
  Result,
} from '@ariadne-nsd/core';
import {
  addDefaultBranch,
  checkInvariants,
  createIdGenerator,
  drawingMessage,
  editText,
  renderDoc,
} from '@ariadne-nsd/core';

import type { ClipboardData } from '../clipboard/clip-format';
import type { ChromeState, Notice, Question } from '../contracts';
import type { EditorMessage, Message, MessageKey } from '../i18n/messages';
import { message } from '../i18n/messages';
import type { KeyBinding } from '../input/keys';
import { readKey } from '../input/keys';
import type { DocIndex } from '../model/doc-index';
import { indexDoc, isEmptyBlock } from '../model/doc-index';
import type { Caret, EditField, EditorState } from '../state/editor-state';
import { clampZoom, stepHistory, withContent, withSelection } from '../state/editor-state';
import type { Selection } from '../state/selection';
import { selectBlock, selectedBlocks, validSelection } from '../state/selection';

/** The system clipboard, or the editor's own when the browser blocks it (03-editor 3.3). */
export type ClipboardPort = {
  /** Writes both forms. Returns where they went. */
  write(data: ClipboardData): Promise<'system' | 'memory'>;
  read(): Promise<ClipboardData>;
};

/** A timer the key hint uses; tests pass a fake one. */
export type Timers = {
  set(callback: () => void, milliseconds: number): unknown;
  clear(handle: unknown): void;
};

/** What the session needs from outside. */
export type SessionOptions = {
  /** The language of the drawing's fixed words and of the screen (R-NFR-04). */
  readonly locale: () => Locale;
  readonly clipboard: ClipboardPort;
  readonly timers: Timers;
  /** Whether the key hint is shown after 0.4 s (setting `editor.keyHint`). */
  readonly isKeyHintEnabled: () => boolean;
  /** Unexpected errors and invariant violations (coding guide 5), for the problem report. */
  readonly log: (text: string, detail?: unknown) => void;
  readonly keyBindings: ReadonlyArray<KeyBinding>;
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
  /** Open the inline editor on this field (after inserting or wrapping). */
  readonly edit?: { readonly field: EditField; readonly caret: Caret | 'clear' };
};

/** The key hint shows this long after the first key of a sequence (UX K1). */
export const keyHintDelay = 400;

/** The editing session. One per open document view. */
export class EditorSession {
  private current: EditorState;
  private rendered: Rendering;
  private indexed: DocIndex;
  private saved: Doc | null;
  private keptSettings: KeptSettings;
  private readonly listeners = new Set<(state: EditorState) => void>();
  private noticeValue: Notice | null = null;
  private questionValue: Question | null = null;
  private nextId = 1;
  private isEscArmed = false;
  private hintTimer: unknown = null;
  private isHintShown = false;
  /** Runs a command by id (the registry). Set by the editor after the registry is made. */
  runCommand: (id: string, args?: unknown) => void = () => undefined;

  constructor(
    doc: Doc,
    private readonly options: SessionOptions,
    load: LoadOptions,
  ) {
    this.rendered = renderDoc(doc, { locale: options.locale() });
    this.indexed = indexDoc(doc.content);
    this.saved = load.isDirty ? null : doc;
    this.keptSettings = load.kept;
    this.current = {
      doc,
      undo: [],
      redo: [],
      selection: validSelection(this.indexed, load.selection),
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

  /** Calls `listener` after every state change. Returns the function that stops it. */
  subscribe(listener: (state: EditorState) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private setState(state: EditorState): void {
    this.current = state;
    for (const listener of [...this.listeners]) {
      listener(state);
    }
  }

  /** Calls the listeners again without a change (the notice or the question changed). */
  private touch(): void {
    this.setState(this.current);
  }

  /** Puts another document in. Undo, redo and the selection start empty (03-editor 6). */
  load(doc: Doc, load: LoadOptions): void {
    this.closeQuestion();
    this.noticeValue = null;
    this.keptSettings = load.kept;
    this.saved = load.isDirty ? null : doc;
    this.rendered = renderDoc(doc, { locale: this.options.locale() });
    this.indexed = indexDoc(doc.content);
    this.clearPending();
    this.setState({
      ...this.current,
      doc,
      undo: [],
      redo: [],
      selection: validSelection(this.indexed, load.selection),
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

  /** Draws the document again, for example after the screen language changed. */
  rerender(): void {
    this.rendered = renderDoc(this.current.doc, { locale: this.options.locale() });
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

  /** The status bar's content. Dialogs are the editor's (`createEditor`), not the session's. */
  chrome(): Omit<ChromeState, 'dialog'> {
    const { editing, mode, pendingKeys, zoom } = this.current;
    return {
      selection: this.describeSelection(),
      notice: this.noticeValue,
      question: this.questionValue,
      pendingKeys,
      mode: editing !== null ? 'editing' : mode,
      isKeyHintShown: this.isHintShown,
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
      case 'head':
      case 'fold':
        return null;
    }
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
    const locale = this.options.locale();
    if (place.isDefault) {
      return drawingMessage(locale, 'case.default');
    }
    return drawingMessage(locale, place.column === 0 ? 'if.yes' : 'if.no');
  }

  // Selection and view.

  /** Changes the selection. */
  select(selection: Selection | null): void {
    this.setState(withSelection(this.current, validSelection(this.index(), selection)));
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
    return createIdGenerator(content, [...view.folded, ...view.opened.flat()]);
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
  apply(content: Content, after: After): boolean {
    if (content !== this.current.doc.content) {
      const violations = checkInvariants(content);
      if (violations.length > 0) {
        this.options.log('A command broke the model invariants', violations);
        this.notify('notice.internalError', 'warn');
        return false;
      }
      const doc: Doc = { content, view: this.current.doc.view };
      this.rendered = renderDoc(doc, { locale: this.options.locale() });
    }
    const index = indexDoc(content);
    const selection = validSelection(index, after.selection);
    this.setState(
      withContent(this.current, content, selection, this.rendered.layout, this.isDirty),
    );
    if (after.edit !== undefined) {
      this.startEditing(after.edit.field, after.edit.caret);
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
    const stepped = stepHistory(
      this.current,
      direction,
      (doc) => {
        this.rendered = renderDoc(doc, { locale: this.options.locale() });
        return this.rendered.layout;
      },
      this.isDirty,
    );
    if (stepped === null) {
      this.notify(direction === 'undo' ? 'reason.nothingToUndo' : 'reason.nothingToRedo');
      return false;
    }
    const index = indexDoc(stepped.content);
    this.setState({
      ...stepped.state,
      selection: validSelection(index, stepped.state.selection),
    });
    return true;
  }

  // The inline editor (03-editor 3.4).

  /** The text a field opens with, or why it cannot be edited. */
  fieldText(field: EditField): { readonly text: string } | { readonly reason: EditorMessage } {
    const index = this.index();
    switch (field.kind) {
      case 'block': {
        const block = index.blocks.get(field.block)?.block;
        if (block === undefined) {
          return { reason: 'reason.notFound' };
        }
        return block.kind === 'call' ? { reason: 'reason.unsupported' } : { text: block.text };
      }
      case 'branchLabel': {
        const place = index.branches.get(field.branch);
        if (place === undefined) {
          return { reason: 'reason.notFound' };
        }
        if (place.isDefault) {
          return { reason: 'reason.defaultLabelFixed' };
        }
        return { text: this.labelText(field.branch) };
      }
      case 'missingDefault':
        return index.blocks.has(field.block) ? { text: '' } : { reason: 'reason.notFound' };
    }
  }

  /** Opens the inline editor on a field. Returns `true`, or why it did not open. */
  startEditing(field: EditField, caret: Caret | 'clear'): true | EditorMessage {
    if (this.current.readOnly) {
      return 'reason.readOnly';
    }
    const found = this.fieldText(field);
    if ('reason' in found) {
      return found.reason;
    }
    this.clearPending();
    this.setState({
      ...this.current,
      mode: 'normal',
      editing: {
        field,
        initial: found.text,
        text: caret === 'clear' ? '' : found.text,
        caret: caret === 'clear' ? 'end' : caret,
      },
    });
    return true;
  }

  /**
   * Closes the inline editor and runs one text edit (01-model 4.4, UX MD2). The same text as
   * when it opened runs nothing, so it leaves no undo step.
   */
  commitEditing(text: string): void {
    const editing = this.current.editing;
    if (editing === null) {
      return;
    }
    this.setState({ ...this.current, editing: null });
    if (text === editing.initial || this.current.readOnly) {
      return;
    }
    const field = editing.field;
    const keep = (): After => ({ selection: this.current.selection });
    switch (field.kind) {
      case 'block':
        this.commit(editText(this.current.doc.content, { node: field.block, text }), keep);
        return;
      case 'branchLabel':
        this.commit(editText(this.current.doc.content, { node: field.branch, text }), keep);
        return;
      case 'missingDefault': {
        // Typing into the empty default cell makes the default branch: one undo step (UX CD1).
        const content = this.current.doc.content;
        const made = addDefaultBranch(content, { block: field.block, ids: this.ids() });
        if (!made.ok) {
          this.refuse(made.reason);
          return;
        }
        const [, empty] = made.touched;
        if (empty === undefined) {
          return;
        }
        const written = editText(made.content, { node: empty, text });
        this.commit(written, (ok) => ({ selection: selectBlock(indexDoc(ok.content), empty) }));
        return;
      }
    }
  }

  /** Closes the inline editor without running anything. */
  cancelEditing(): void {
    if (this.current.editing !== null) {
      this.setState({ ...this.current, editing: null });
    }
  }

  // Keys (03-editor 4).

  /**
   * Reads one key of the diagram area (not of the inline editor or an input box). Returns
   * whether the key was used, so the caller can stop the browser's own action.
   */
  handleKey(stroke: string): boolean {
    if (this.current.editing !== null) {
      return false;
    }
    if (this.questionValue !== null && this.answerQuestion(stroke)) {
      return true;
    }
    if (stroke === 'Escape') {
      this.escape();
      return true;
    }
    this.isEscArmed = false;
    if (this.current.mode === 'visual') {
      const used = this.visualKey(stroke);
      if (used !== null) {
        return used;
      }
    }
    const selection = this.current.selection;
    const outcome = readKey(this.options.keyBindings, this.current.pendingKeys, stroke, {
      mode: 'normal',
      selection: selection === null ? null : selection.kind,
    });
    return this.follow(outcome);
  }

  private follow(outcome: ReturnType<typeof readKey>): boolean {
    switch (outcome.kind) {
      case 'pending':
        this.setPending(outcome.first);
        return true;
      case 'command':
        this.clearPending();
        this.clearNotice();
        this.runCommand(outcome.binding.command, outcome.binding.args);
        return true;
      case 'cancelled':
        this.clearPending();
        this.notify(
          outcome.isEscape
            ? 'notice.keyCancelled'
            : message('notice.unknownKey', { keys: outcome.keys }),
        );
        return true;
      case 'unbound': {
        // A lone character is a Vim key the table lacks: say so. Other keys go to the browser.
        const isCharacter = outcome.keys.length === 1;
        if (isCharacter) {
          this.notify(message('notice.unknownKey', { keys: outcome.keys }));
        }
        return isCharacter;
      }
    }
  }

  /** A key while selecting a range. `null`: not a range key, read it as a normal key. */
  private visualKey(stroke: string): boolean | null {
    if (this.current.pendingKeys === null && (stroke === 'v' || stroke === 'V')) {
      this.leaveVisual();
      return true;
    }
    const selection = this.current.selection;
    const outcome = readKey(this.options.keyBindings, this.current.pendingKeys, stroke, {
      mode: 'visual',
      selection: selection === null ? null : selection.kind,
    });
    if (outcome.kind === 'unbound') {
      this.setMode('normal');
      return null;
    }
    if (outcome.kind === 'command' && !outcome.binding.command.startsWith('select.extend')) {
      this.setMode('normal');
    }
    return this.follow(outcome);
  }

  private leaveVisual(): void {
    const selection = this.current.selection;
    this.setState({
      ...this.current,
      mode: 'normal',
      selection:
        selection?.kind === 'blocks' ? { ...selection, anchor: selection.focus } : selection,
    });
  }

  private escape(): void {
    if (this.current.pendingKeys !== null) {
      this.clearPending();
      this.notify('notice.keyCancelled');
      return;
    }
    if (this.current.mode === 'visual') {
      this.leaveVisual();
      return;
    }
    if (this.current.selection === null) {
      return;
    }
    // Esc twice in a row clears the selection; once only tells how (interaction rules 2).
    if (this.isEscArmed) {
      this.isEscArmed = false;
      this.select(null);
      this.notify('notice.selectionCleared');
    } else {
      this.isEscArmed = true;
      this.notify('notice.escAgain');
    }
  }

  private answerQuestion(stroke: string): boolean {
    const question = this.questionValue;
    if (question === null) {
      return false;
    }
    if (stroke === 'Enter') {
      question.choices.find((choice) => choice.isDefault === true)?.choose();
      return true;
    }
    if (stroke === 'Escape') {
      question.dismiss();
      return true;
    }
    const digit = /^[1-9]$/.test(stroke) ? Number(stroke) : null;
    const chosen = digit === null ? undefined : question.choices[digit - 1];
    if (chosen !== undefined) {
      chosen.choose();
      return true;
    }
    question.dismiss();
    return false;
  }

  private setPending(first: string): void {
    this.clearHintTimer();
    this.isHintShown = false;
    this.setState({ ...this.current, pendingKeys: first });
    if (this.options.isKeyHintEnabled()) {
      this.hintTimer = this.options.timers.set(() => {
        this.hintTimer = null;
        if (this.current.pendingKeys === first) {
          this.isHintShown = true;
          this.touch();
        }
      }, keyHintDelay);
    }
  }

  /** Drops a waiting first key. */
  clearPending(): void {
    this.clearHintTimer();
    this.isHintShown = false;
    if (this.current.pendingKeys !== null) {
      this.current = { ...this.current, pendingKeys: null };
      this.touch();
    }
  }

  private clearHintTimer(): void {
    if (this.hintTimer !== null) {
      this.options.timers.clear(this.hintTimer);
      this.hintTimer = null;
    }
  }

  /** Stops the timers. */
  dispose(): void {
    this.clearHintTimer();
    this.listeners.clear();
  }
}

/** The title of a key hint group: the first key of a sequence (03-keymap). */
export function keyHintTitle(first: string): EditorMessage | null {
  switch (first) {
    case 'a':
      return 'keyHint.a';
    case 'A':
      return 'keyHint.A';
    case 's':
      return 'keyHint.s';
    case 'c':
      return 'keyHint.c';
    case 'd':
      return 'keyHint.d';
    case 'y':
      return 'keyHint.y';
    case 'g':
      return 'keyHint.g';
    case '[':
      return 'keyHint.[';
    case ']':
      return 'keyHint.]';
    default:
      return null;
  }
}
