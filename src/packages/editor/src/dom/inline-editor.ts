// The inline editor (03-editor 3.4): the text area over a field of the diagram while its text is
// edited, kept in step with the session's `editing`, and its keys.
import type { Box, Locale } from '@ariadne-nsd/core';

import { formatMessage } from '../i18n/messages';
import { strokeOf } from '../input/keys';
import type { EditorSession } from '../session/session';
import type { Editing, EditField } from '../state/editor-state';
import { fieldBox } from './overlay';

/**
 * The keys that still run their command while the inline editor is open: they do not type
 * anything, so the text is accepted first (like a click elsewhere) and the command runs.
 */
const editingKeys: ReadonlyMap<string, string> = new Map([
  ['Ctrl+S', 'file.save'],
  ['Ctrl+Shift+S', 'file.saveAs'],
  ['Ctrl+Shift+P', 'edit.commandPalette'],
  ['F1', 'edit.commandPalette'],
]);

/** What the inline editor needs from the canvas view. */
export type InlineEditorHost = {
  readonly session: EditorSession;
  readonly locale: () => Locale;
  readonly run: (id: string, args?: unknown) => void;
  /** Gives the focus back to the diagram (or to the inline editor while it is open). */
  readonly focus: () => void;
  readonly scrollIntoView: (box: Box) => void;
};

/** The inline editor of one canvas view. */
export class InlineEditor {
  readonly element: HTMLTextAreaElement;
  private shownEditing: Editing | null = null;

  constructor(
    document: Document,
    private readonly host: InlineEditorHost,
  ) {
    this.element = document.createElement('textarea');
    this.element.className = 'ans-inline-editor';
    this.element.spellcheck = false;
    this.element.style.display = 'none';
  }

  /** The `editing` the text area shows now, or `null` while it is hidden. */
  get shown(): Editing | null {
    return this.shownEditing;
  }

  /** The text in the text area now. */
  text(): string {
    return this.element.value;
  }

  focus(): void {
    this.element.focus({ preventScroll: true });
  }

  /** Shows, moves or hides the text area for the session's `editing`. */
  sync(editing: Editing | null): void {
    if (editing === this.shownEditing) {
      return;
    }
    this.shownEditing = editing;
    const editor = this.element;
    if (editing === null) {
      const hadFocus = editor.ownerDocument.activeElement === editor;
      editor.style.display = 'none';
      if (hadFocus) {
        this.host.focus();
      }
      return;
    }
    const state = this.host.session.state;
    const box = fieldBox(state.layout, editing.field) ?? { x: 0, y: 0, width: 120, height: 32 };
    const style = editor.style;
    style.left = `${String(box.x)}px`;
    style.top = `${String(box.y)}px`;
    style.width = `${String(Math.max(box.width, 60))}px`;
    style.height = `${String(box.height)}px`;
    style.textAlign = this.isCentered(editing.field) ? 'center' : 'left';
    style.display = 'block';
    // A refused header name is drawn as an input that cannot be accepted (visual design 7.1).
    editor.classList.toggle('ans-is-rejected', editing.isRejected === true);
    editor.placeholder = this.placeholderOf(editing.field);
    editor.value = editing.text;
    editor.dataset.minHeight = String(box.height);
    editor.focus({ preventScroll: true });
    switch (editing.caret) {
      case 'selectAll':
        editor.select();
        break;
      case 'start':
        editor.setSelectionRange(0, 0);
        break;
      case 'end':
        editor.setSelectionRange(editing.text.length, editing.text.length);
        break;
    }
    this.fit();
    this.host.scrollIntoView(box);
  }

  /** A call block's field says which one it is while empty: "Arguments", "Result". */
  private placeholderOf(field: EditField): string {
    if (field.kind !== 'call') {
      return '';
    }
    const key =
      field.part === 'args'
        ? 'field.callArgs'
        : field.part === 'name'
          ? 'field.callName'
          : 'field.callResult';
    return formatMessage(this.host.locale(), key);
  }

  /** If and Case conditions are drawn centered; other text starts at the left. */
  private isCentered(field: EditField): boolean {
    if (field.kind !== 'block') {
      return false;
    }
    const kind = this.host.session.index().blocks.get(field.block)?.block.kind;
    return kind === 'if' || kind === 'case';
  }

  private fit(): void {
    const editor = this.element;
    const minHeight = Number(editor.dataset.minHeight ?? '0');
    editor.style.height = `${String(minHeight)}px`;
    editor.style.height = `${String(Math.max(minHeight, editor.scrollHeight))}px`;
  }

  /** Accepts the typed text; from a key, the focus goes back to the diagram first. */
  commit(isFromKey: boolean): void {
    const session = this.host.session;
    if (session.state.editing === null) {
      return;
    }
    const text = this.element.value;
    if (isFromKey) {
      this.host.focus();
    }
    session.commitEditing(text);
  }

  /** Listens to the text area's keys, input, blur and presses. */
  listen(signal: AbortSignal): void {
    const editor = this.element;
    const session = this.host.session;
    editor.addEventListener(
      'keydown',
      (event) => {
        event.stopPropagation();
        // An Enter that ends an IME composition (Korean input) does not accept (03-editor 3.4).
        const isComposing = event.isComposing;
        // Enter and Esc both accept what was typed (DR-0009); Shift+Enter is a new line.
        if (event.key === 'Enter' && !event.shiftKey && !isComposing) {
          event.preventDefault();
          this.commit(true);
        } else if (event.key === 'Escape' && !isComposing) {
          event.preventDefault();
          if (session.state.editing?.isRejected === true) {
            // Only in a field opened again for a clashing name, Esc puts the old name back
            // (interaction rules "Event 헤더", UX Q3).
            this.host.focus();
            session.cancelEditing();
          } else {
            this.commit(true);
          }
        } else if (event.key === 'Tab') {
          event.preventDefault();
          // Tab goes to the other field of a call block (03-keymap).
          if (!isComposing) {
            session.switchCallPart(editor.value);
          }
        } else {
          // Save, the palette and help keys still work while typing: accept the text, then run.
          const stroke = strokeOf(event);
          const id = stroke === null || isComposing ? undefined : editingKeys.get(stroke);
          if (id !== undefined) {
            event.preventDefault();
            this.commit(true);
            this.host.run(id);
          }
        }
      },
      { signal },
    );
    editor.addEventListener(
      'input',
      () => {
        this.fit();
      },
      { signal },
    );
    editor.addEventListener(
      'blur',
      () => {
        this.commit(false);
      },
      { signal },
    );
    editor.addEventListener(
      'pointerdown',
      (event) => {
        event.stopPropagation();
      },
      { signal },
    );
  }
}
