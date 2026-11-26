import { describe, expect, it } from 'vitest';

import { commandViewSource } from './command-view';
import type { CommandContext, CommandRegistry, CommandSpec } from './engine-api';

/** A registry over one flag, counting how often `when` and the formatter run. */
function fixture() {
  let isOn = false;
  let whenCalls = 0;
  let formatCalls = 0;
  const listeners = new Set<() => void>();
  const spec = (id: string, depends: boolean): CommandSpec => ({
    id,
    title: `title.${id}`,
    keys: [],
    edits: false,
    when: () => {
      whenCalls += 1;
      return !depends || isOn ? true : 'reason.off';
    },
    run: () => undefined,
  });
  const specs = [spec('a', true), spec('b', false)];
  const registry: CommandRegistry = {
    list: () => specs,
    run: () => undefined,
    register: () => () => undefined,
    onChange: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    context: () => ({}) as CommandContext,
  };
  const source = commandViewSource(registry, (message) => {
    formatCalls += 1;
    return typeof message === 'string' ? message.toUpperCase() : message.key;
  });
  return {
    source,
    turn: (value: boolean) => {
      isOn = value;
      for (const listener of [...listeners]) listener();
    },
    whenCalls: () => whenCalls,
    formatCalls: () => formatCalls,
  };
}

describe('commandViewSource', () => {
  it('T-1522 · QA-07: evaluates the commands once per registry change for all its readers', () => {
    const { source, turn, whenCalls } = fixture();
    const reads: boolean[] = [];
    for (let reader = 0; reader < 3; reader += 1) {
      source.subscribe(() => {
        reads.push(source.read().find((view) => view.id === 'a')?.isEnabled ?? false);
      });
    }
    source.read();
    const before = whenCalls();
    turn(true);
    expect(reads).toEqual([true, true, true]);
    expect(whenCalls() - before).toBe(2);
    source.read(true);
    expect(whenCalls() - before).toBe(4);
  });

  it('T-1523 · QA-07: keeps the views that did not change, and the whole list when none did', () => {
    const { source, turn } = fixture();
    source.subscribe(() => undefined);
    const first = source.read();
    turn(false);
    expect(source.read()).toBe(first);
    turn(true);
    const second = source.read();
    expect(second).not.toBe(first);
    expect(second.find((view) => view.id === 'b')).toBe(first.find((view) => view.id === 'b'));
    expect(second.find((view) => view.id === 'a')).toMatchObject({ isEnabled: true, reason: null });
    turn(false);
    expect(source.read().find((view) => view.id === 'a')).toMatchObject({
      isEnabled: false,
      reason: 'REASON.OFF',
    });
  });

  it('T-1524 · QA-07: formats a plain message key once, not on every change', () => {
    const { source, turn, formatCalls } = fixture();
    source.subscribe(() => undefined);
    expect(source.read().map((view) => view.title)).toEqual(['TITLE.A', 'TITLE.B']);
    const before = formatCalls();
    turn(true);
    turn(false);
    source.read();
    expect(formatCalls()).toBe(before);
  });
});
