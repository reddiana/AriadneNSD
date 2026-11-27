// The inline editor's text flow (03-editor 3.4): which text a field opens with, moving between
// the fields of a call block, and the one text edit that closing the editor runs.
import type {
  Block,
  Content,
  Id,
  IdGenerator,
  OkResult,
  PhaseTimer,
  Reason,
  Result,
} from '@ariadne-nsd/core';
import { addDefaultBranch, editCall, editHead, editText, headName } from '@ariadne-nsd/core';

import type { EditorMessage } from '../i18n/messages';
import { message } from '../i18n/messages';
import type { DocIndex } from '../model/doc-index';
import { indexDoc } from '../model/doc-index';
import type {
  CallPart,
  Caret,
  EditField,
  Editing,
  EditorState,
  Extracted,
} from '../state/editor-state';
import type { Selection } from '../state/selection';
import { foldPath, selectBlock } from '../state/selection';

/** What comes next after a text edit; the session's `After` (kept apart to avoid a cycle). */
type AfterEdit = { readonly selection: Selection | null };

/** What the text flow reads from and calls on the session. */
export type TextEditingHost = {
  readonly state: EditorState;
  readonly time: PhaseTimer;
  index(): DocIndex;
  labelText(branch: string): string;
  foldName(fold: Id): string;
  callParts(block: Block): ReadonlyArray<CallPart>;
  ids(): IdGenerator;
  commit(result: Result, after: (ok: OkResult) => AfterEdit): boolean;
  apply(changed: Content, after: AfterEdit, isAmend?: boolean): boolean;
  refuse(reason: Reason): void;
  select(selection: Selection | null): void;
  notify(value: EditorMessage): void;
  clearPending(): void;
};

/** The inline editor's part of the session. The session owns the state; this writes it back. */
export class TextEditing {
  constructor(
    private readonly session: TextEditingHost,
    private readonly setState: (state: EditorState) => void,
  ) {}

  private get current(): EditorState {
    return this.session.state;
  }

  /**
   * The field the text edit commands open on a block: its text, or for a call block its first
   * field (the arguments, or the result when the Method receives nothing).
   */
  blockField(id: Id): EditField {
    const block = this.session.index().blocks.get(id)?.block;
    if (block?.kind !== 'call') {
      return { kind: 'block', block: id };
    }
    return { kind: 'call', block: id, part: this.session.callParts(block)[0] ?? 'result' };
  }

  /** The text a field opens with, or why it cannot be edited. */
  fieldText(field: EditField): { readonly text: string } | { readonly reason: EditorMessage } {
    const index = this.session.index();
    switch (field.kind) {
      case 'block': {
        const block = index.blocks.get(field.block)?.block;
        if (block === undefined) {
          return { reason: 'reason.notFound' };
        }
        if (block.kind === 'endless') {
          // An endless loop has no text (UX EL1).
          return { reason: 'reason.endlessHasNoText' };
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
        if (place.block.kind === 'parallel') {
          // A parallel block's branches have no label; its text is edited on the block (M84 B1).
          return { reason: 'reason.parallelBranchHasNoLabel' };
        }
        return { text: this.session.labelText(field.branch) };
      }
      case 'missingDefault':
        return index.blocks.has(field.block) ? { text: '' } : { reason: 'reason.notFound' };
      case 'head': {
        const diagram = index.diagrams.get(field.diagram);
        if (diagram === undefined) {
          return { reason: 'reason.notFound' };
        }
        return diagram.head === null ? { reason: 'reason.noHead' } : { text: diagram.head.text };
      }
      case 'call': {
        const block = index.blocks.get(field.block)?.block;
        if (block === undefined) {
          return { reason: 'reason.notFound' };
        }
        if (block.kind !== 'call') {
          return { reason: 'reason.wrongKind' };
        }
        if (field.part === 'name') {
          return block.target.kind === 'named'
            ? { text: block.target.name }
            : { reason: 'reason.wrongKind' };
        }
        return { text: field.part === 'args' ? block.args : block.result };
      }
      case 'fold': {
        const isSite = index.siteFolds.has(field.fold);
        if (!index.folds.has(field.fold) && !isSite) {
          return { reason: 'reason.notFound' };
        }
        // A region of the Method seen in an opened call is the Method's (R-EDIT-16).
        if (foldPath(field).length > 0 && !isSite) {
          return { reason: 'reason.methodFoldHere' };
        }
        return { text: this.session.foldName(field.fold) };
      }
    }
  }

  /** Opens the inline editor on a field. Returns `true`, or why it did not open. */
  startEditing(
    field: EditField,
    caret: Caret | 'clear',
    extracted?: Extracted,
    joinsLast = false,
  ): true | EditorMessage {
    if (this.current.readOnly) {
      return 'reason.readOnly';
    }
    const found = this.fieldText(field);
    if ('reason' in found) {
      return found.reason;
    }
    this.session.clearPending();
    const call =
      field.kind === 'call' ? this.session.index().blocks.get(field.block)?.block : undefined;
    this.setState({
      ...this.current,
      mode: 'normal',
      editing: {
        field,
        initial: found.text,
        text: caret === 'clear' ? '' : found.text,
        caret: caret === 'clear' ? 'end' : caret,
        ...(call?.kind === 'call' ? { call: callFields(call) } : {}),
        ...(extracted === undefined ? {} : { extracted }),
        ...(joinsLast ? { joinsLast: true } : {}),
      },
    });
    return true;
  }

  /**
   * `Tab` in a call block: keeps what was typed and moves to the other field (interaction rules
   * "호출 블록"). Returns `false` when there is no other field (a Method receiving nothing).
   */
  switchCallPart(text: string): boolean {
    const editing = this.current.editing;
    if (editing?.field.kind !== 'call' || editing.call === undefined) {
      return false;
    }
    const field = editing.field;
    const block = this.session.index().blocks.get(field.block)?.block;
    const parts = block === undefined ? [] : this.session.callParts(block);
    const other = parts[(parts.indexOf(field.part) + 1) % parts.length];
    if (other === undefined || other === field.part) {
      return false;
    }
    const call = withPart(editing.call, field.part, text);
    const next = partOf(call, other);
    this.setState({
      ...this.current,
      editing: { field: { ...field, part: other }, initial: next, text: next, caret: 'end', call },
    });
    return true;
  }

  /**
   * Closes the inline editor and runs one text edit (01-model 4.4, UX MD2). The same text as
   * when it opened runs nothing, so it leaves no undo step.
   */
  commitEditing(text: string): void {
    this.session.time('command', () => {
      this.commitText(text);
    });
  }

  private commitText(text: string): void {
    const editing = this.current.editing;
    if (editing === null) {
      return;
    }
    this.setState({ ...this.current, editing: null });
    if (this.current.readOnly) {
      return;
    }
    const field = editing.field;
    if (field.kind === 'head' && editing.extracted !== undefined) {
      this.nameExtracted(editing, field.diagram, editing.extracted, text);
      return;
    }
    const session = this.session;
    const keep = (): AfterEdit => ({ selection: this.current.selection });
    if (field.kind === 'call') {
      // All fields in one command: one undo step. The same texts change nothing (UX MD2).
      const call = withPart(editing.call ?? { args: '', result: '' }, field.part, text);
      session.commit(editCall(this.current.doc.content, { block: field.block, ...call }), keep);
      return;
    }
    if (text === editing.initial) {
      return;
    }
    switch (field.kind) {
      case 'block':
        session.commit(editText(this.current.doc.content, { node: field.block, text }), keep);
        return;
      case 'branchLabel':
        session.commit(editText(this.current.doc.content, { node: field.branch, text }), keep);
        return;
      case 'fold': {
        // An empty name brings the default name back (UX Q4); the region keeps no name.
        const result = editText(this.current.doc.content, { node: field.fold, text });
        if (editing.joinsLast === true && result.ok) {
          session.apply(result.content, keep(), true);
          return;
        }
        session.commit(result, keep);
        return;
      }
      case 'missingDefault': {
        // Typing into the empty default cell makes the default branch: one undo step (UX CD1).
        const content = this.current.doc.content;
        const made = addDefaultBranch(content, { block: field.block, ids: session.ids() });
        if (!made.ok) {
          session.refuse(made.reason);
          return;
        }
        const [, empty] = made.touched;
        if (empty === undefined) {
          return;
        }
        const written = editText(made.content, { node: empty, text });
        session.commit(written, (ok) => ({ selection: selectBlock(indexDoc(ok.content), empty) }));
        return;
      }
      case 'head': {
        const result = editHead(this.current.doc.content, { diagram: field.diagram, text });
        if (!result.ok && result.reason.code === 'duplicateHeadName') {
          // A clashing name is not taken: the field opens again with it (interaction rules
          // "Event 헤더"). An empty name puts the old one back, so the refusal alone does that.
          session.refuse(result.reason);
          this.setState({
            ...this.current,
            editing: { field, initial: editing.initial, text, caret: 'end', isRejected: true },
          });
          return;
        }
        session.commit(result, keep);
        return;
      }
    }
  }

  /**
   * The name typed for the Method an extract just made (UX XM2): it joins the extract's undo
   * step, and the call block left in place is selected again. The default name stays when the
   * text did not change; a clashing name opens the field again like any header name.
   */
  private nameExtracted(editing: Editing, diagram: Id, extracted: Extracted, text: string): void {
    const content = this.current.doc.content;
    const back = (now: Content): AfterEdit => ({
      selection: selectBlock(indexDoc(now), extracted.call),
    });
    if (text !== editing.initial) {
      const result = editHead(content, { diagram, text });
      if (!result.ok) {
        this.session.refuse(result.reason);
        if (result.reason.code === 'duplicateHeadName') {
          this.setState({
            ...this.current,
            editing: { ...editing, text, caret: 'end', isRejected: true },
          });
          return;
        }
        // An empty name keeps the default name; the refusal says so.
        this.session.select(back(content).selection);
        return;
      }
      if (!this.session.apply(result.content, back(result.content), true)) {
        return;
      }
    } else {
      this.session.select(back(content).selection);
    }
    this.notifyExtracted(diagram, extracted);
  }

  /** "Extracted n blocks into the new Method name." */
  private notifyExtracted(diagram: Id, extracted: Extracted): void {
    const head = this.session.index().diagrams.get(diagram)?.head ?? null;
    const name = head === null ? '' : headName(head);
    this.session.notify(message('notice.extractedNamed', { count: extracted.count, name }));
  }

  /** Closes the inline editor without running anything. */
  cancelEditing(): void {
    const editing = this.current.editing;
    if (editing === null) {
      return;
    }
    this.setState({ ...this.current, editing: null });
    if (editing.field.kind === 'head' && editing.extracted !== undefined) {
      // Esc on a refused name keeps the name the Method has, and goes back (UX XM2).
      this.session.select(selectBlock(this.session.index(), editing.extracted.call));
      this.notifyExtracted(editing.field.diagram, editing.extracted);
    }
  }
}

/** What the fields of a call block hold when the inline editor opens. */
function callFields(call: Extract<Block, { kind: 'call' }>): {
  readonly args: string;
  readonly result: string;
  readonly name?: string;
} {
  return call.target.kind === 'named'
    ? { args: call.args, result: call.result, name: call.target.name }
    : { args: call.args, result: call.result };
}

type CallTexts = { readonly args: string; readonly result: string; readonly name?: string };

/** The fields with one of them set to `text`. */
function withPart(call: CallTexts, part: CallPart, text: string): CallTexts {
  switch (part) {
    case 'args':
      return { ...call, args: text };
    case 'result':
      return { ...call, result: text };
    case 'name':
      return { ...call, name: text };
  }
}

/** One field of the fields. */
function partOf(call: CallTexts, part: CallPart): string {
  switch (part) {
    case 'args':
      return call.args;
    case 'result':
      return call.result;
    case 'name':
      return call.name ?? '';
  }
}
