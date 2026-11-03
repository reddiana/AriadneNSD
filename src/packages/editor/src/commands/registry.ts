// The command list (03-editor 5, ADR-0033): one entry per command, shared by menus, the toolbar,
// the context menu, the command palette and the key table. Running happens in one place.
import type { CommandContext, CommandRegistry, CommandSpec } from '../contracts';
import type { KeyBinding } from '../input/keys';
import { keysOf } from '../input/keys';
import type { Message } from '../i18n/messages';

/** What the registry needs from the editor. */
export type RegistryOptions = {
  readonly context: () => CommandContext;
  readonly keyBindings: ReadonlyArray<KeyBinding>;
  /** Tells the user why a command did not apply (the status bar). */
  readonly refuse: (reason: Message) => void;
  /** Before any command: closes the inline editor, keeping its text (03-editor 3.4). */
  readonly beforeRun: (id: string) => void;
  /** An exception from a command: a bug. Logged; the document is left as it was. */
  readonly onError: (error: unknown, id: string) => void;
};

/** A registry with a way to say "applies now may have changed". */
export type EditorRegistry = CommandRegistry & {
  /** Calls the `onChange` listeners. */
  changed(): void;
  /** Whether a command with this id is registered. */
  has(id: string): boolean;
};

/**
 * Makes the command list. Commands that change the document are refused while it is view-only
 * (03-editor 6.4); `when` of the returned specs already says so, so menus grey them out.
 */
export function createRegistry(options: RegistryOptions): EditorRegistry {
  const specs = new Map<string, CommandSpec>();
  const listeners = new Set<() => void>();

  const guarded = (spec: CommandSpec): CommandSpec => {
    const keys = keysOf(options.keyBindings, spec.id);
    return {
      ...spec,
      keys: keys.length > 0 ? keys : spec.keys,
      when: (ctx) => (spec.edits && ctx.state.readOnly ? 'reason.readOnly' : spec.when(ctx)),
    };
  };

  const changed = (): void => {
    for (const listener of [...listeners]) {
      listener();
    }
  };

  // Registering and taking out come in runs (a whole menu's worth at start): tell the listeners
  // once, after the run, rather than once per command. Each telling re-reads every command.
  let changePending = false;
  const changedSoon = (): void => {
    if (changePending) return;
    changePending = true;
    queueMicrotask(() => {
      changePending = false;
      changed();
    });
  };

  return {
    list: () => [...specs.values()],
    has: (id) => specs.has(id),
    context: options.context,
    changed,
    register: (spec) => {
      const entry = guarded(spec);
      specs.set(spec.id, entry);
      changedSoon();
      return () => {
        if (specs.get(spec.id) === entry) {
          specs.delete(spec.id);
          changedSoon();
        }
      };
    },
    onChange: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    run: (id, args) => {
      const spec = specs.get(id);
      if (spec === undefined) {
        return;
      }
      options.beforeRun(id);
      const ctx = options.context();
      const applies = spec.when(ctx);
      if (applies !== true) {
        options.refuse(applies);
        return;
      }
      try {
        const running = spec.run(ctx, args);
        if (running instanceof Promise) {
          void (async () => {
            try {
              await running;
            } catch (error) {
              options.onError(error, id);
            }
          })();
        }
      } catch (error) {
        options.onError(error, id);
      }
    },
  };
}
