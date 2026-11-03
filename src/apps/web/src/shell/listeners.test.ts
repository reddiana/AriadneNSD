// The listener sets the page wires its parts with (appearance changes, the file drag state).
import { describe, expect, it } from 'vitest';

import { createListeners } from './listeners';

describe('listener sets', () => {
  it('T-0807: calls every listener with the arguments, in the order they were added', () => {
    const listeners = createListeners<(value: number, text: string) => void>();
    const heard: string[] = [];
    listeners.add((value, text) => heard.push(`a ${String(value)} ${text}`));
    listeners.add((value, text) => heard.push(`b ${String(value)} ${text}`));

    listeners.emit(1, 'x');

    expect(heard).toEqual(['a 1 x', 'b 1 x']);
  });

  it('T-0808: stops calling a listener once it is removed, and keeps the others', () => {
    const listeners = createListeners<(value: number) => void>();
    const heard: string[] = [];
    const removeA = listeners.add((value) => heard.push(`a ${String(value)}`));
    listeners.add((value) => heard.push(`b ${String(value)}`));

    removeA();
    listeners.emit(2);
    removeA();
    listeners.emit(3);

    expect(heard).toEqual(['b 2', 'b 3']);
  });

  it('T-0809: does nothing when there is no listener', () => {
    const listeners = createListeners<() => void>();
    expect(() => {
      listeners.emit();
    }).not.toThrow();
  });
});
