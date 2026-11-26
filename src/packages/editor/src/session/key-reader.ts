// The key reader of the diagram area (03-editor 4): key sequences, the key hint, the range
// selection keys, Esc, and the keys that answer a question in the status bar.
import type { Question } from '../contracts';
import type { EditorMessage } from '../i18n/messages';
import { message } from '../i18n/messages';
import type { KeyBinding } from '../input/keys';
import { readKey } from '../input/keys';
import type { EditorState } from '../state/editor-state';
import type { Selection } from '../state/selection';

/** A timer the key hint uses; tests pass a fake one. */
export type Timers = {
  set(callback: () => void, milliseconds: number): unknown;
  clear(handle: unknown): void;
};

/** The key hint shows this long after the first key of a sequence (UX K1). */
export const keyHintDelay = 400;

/** What the key reader reads from and calls on the session. */
export type KeyReaderHost = {
  readonly state: EditorState;
  /** Read at the time of the key: the editor sets it after the registry is made. */
  readonly runCommand: (id: string, args?: unknown) => void;
  select(selection: Selection | null): void;
  setMode(mode: 'normal' | 'visual'): void;
  notify(value: EditorMessage): void;
  clearNotice(): void;
};

/** What the key reader needs from outside (part of the session's options). */
export type KeyReaderOptions = {
  readonly timers: Timers;
  readonly isKeyHintEnabled: () => boolean;
  readonly keyBindings: ReadonlyArray<KeyBinding>;
};

/** The key part of the session. The session owns the state; this writes it back. */
export class KeyReader {
  private isEscArmed = false;
  private hintTimer: unknown = null;
  private isHintShownValue = false;

  constructor(
    private readonly session: KeyReaderHost,
    private readonly setState: (state: EditorState) => void,
    private readonly question: () => Question | null,
    private readonly options: KeyReaderOptions,
  ) {}

  private get current(): EditorState {
    return this.session.state;
  }

  /** Whether the key hint of the waiting first key is shown (after `keyHintDelay`). */
  get isHintShown(): boolean {
    return this.isHintShownValue;
  }

  /** Calls the listeners again without a change (the hint appeared). */
  private touch(): void {
    this.setState(this.current);
  }

  /**
   * Reads one key of the diagram area (not of the inline editor or an input box). Returns
   * whether the key was used, so the caller can stop the browser's own action.
   */
  handleKey(stroke: string): boolean {
    if (this.current.editing !== null) {
      return false;
    }
    if (this.question() !== null && this.answerQuestion(stroke)) {
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
        this.session.clearNotice();
        this.session.runCommand(outcome.binding.command, outcome.binding.args);
        return true;
      case 'cancelled':
        this.clearPending();
        this.session.notify(
          outcome.isEscape
            ? 'notice.keyCancelled'
            : message('notice.unknownKey', { keys: outcome.keys }),
        );
        return true;
      case 'unbound': {
        // A lone character is a Vim key the table lacks: say so. Other keys go to the browser.
        const isCharacter = outcome.keys.length === 1;
        if (isCharacter) {
          this.session.notify(message('notice.unknownKey', { keys: outcome.keys }));
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
      this.session.setMode('normal');
      return null;
    }
    if (outcome.kind === 'command' && !outcome.binding.command.startsWith('select.extend')) {
      this.session.setMode('normal');
    }
    return this.follow(outcome);
  }

  private leaveVisual(): void {
    const selection = this.current.selection;
    this.setState({
      ...this.current,
      mode: 'normal',
      selection:
        selection?.kind === 'blocks' || selection?.kind === 'peek'
          ? { ...selection, anchor: selection.focus }
          : selection,
    });
  }

  private escape(): void {
    if (this.current.pendingKeys !== null) {
      this.clearPending();
      this.session.notify('notice.keyCancelled');
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
      this.session.select(null);
      this.session.notify('notice.selectionCleared');
    } else {
      this.isEscArmed = true;
      this.session.notify('notice.escAgain');
    }
  }

  private answerQuestion(stroke: string): boolean {
    const question = this.question();
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
    this.isHintShownValue = false;
    this.setState({ ...this.current, pendingKeys: first });
    if (this.options.isKeyHintEnabled()) {
      this.hintTimer = this.options.timers.set(() => {
        this.hintTimer = null;
        if (this.current.pendingKeys === first) {
          this.isHintShownValue = true;
          this.touch();
        }
      }, keyHintDelay);
    }
  }

  /** Drops a waiting first key. */
  clearPending(): void {
    this.clearHintTimer();
    this.isHintShownValue = false;
    if (this.current.pendingKeys !== null) {
      this.setState({ ...this.current, pendingKeys: null });
    }
  }

  /** Stops the hint timer. */
  clearHintTimer(): void {
    if (this.hintTimer !== null) {
      this.options.timers.clear(this.hintTimer);
      this.hintTimer = null;
    }
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
    case 'z':
      return 'keyHint.z';
    default:
      return null;
  }
}
