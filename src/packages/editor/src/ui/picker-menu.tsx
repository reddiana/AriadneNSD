// A list the engine asks the user to choose from, such as the Method a call block calls
// (interaction rules "호출 블록"). It looks like the context menu: `j` `k` and the arrow keys
// move and wrap round, Enter chooses, a digit chooses that item, Esc closes (03-keymap, UX K2).

import type { KeyboardEvent, ReactElement } from 'react';
import { Fragment, useEffect, useLayoutEffect, useRef, useState } from 'react';

import type { Picker } from './engine-api';
import { useChrome } from './use-engine';

/** The list at the point the engine gives. Closing it any way answers `null`. */
export function PickerMenu({ picker }: { readonly picker: Picker }): ReactElement {
  const { format } = useChrome();
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [place, setPlace] = useState({ left: picker.x, top: picker.y });

  // Keep the whole list in the window, like the context menu.
  useLayoutEffect(() => {
    const list = listRef.current;
    const view = list?.ownerDocument.defaultView;
    if (!list || !view) return;
    const { width, height } = list.getBoundingClientRect();
    const margin = 4;
    setPlace({
      left: Math.max(margin, Math.min(picker.x, view.innerWidth - width - margin)),
      top: Math.max(margin, Math.min(picker.y, view.innerHeight - height - margin)),
    });
  }, [picker.x, picker.y]);

  useEffect(() => {
    buttons()[picker.active]?.focus();
    function onPointerDown(event: PointerEvent): void {
      if (
        rootRef.current &&
        event.target instanceof Node &&
        !rootRef.current.contains(event.target)
      )
        picker.choose(null);
    }
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [picker]);

  function buttons(): HTMLElement[] {
    const list = listRef.current;
    return list ? [...list.querySelectorAll<HTMLElement>('[role="menuitem"]')] : [];
  }

  function onKeyDown(event: KeyboardEvent<HTMLUListElement>): void {
    const all = buttons();
    const current = all.indexOf(document.activeElement as HTMLElement);
    const arrows: Readonly<Record<string, number>> = { ArrowDown: 1, j: 1, ArrowUp: -1, k: -1 };
    const step = arrows[event.key];
    if (step !== undefined) {
      all[(current + step + all.length) % all.length]?.focus();
    } else if (event.key === 'Escape') {
      picker.choose(null);
    } else if (/^[1-9]$/.test(event.key) && Number(event.key) <= picker.items.length) {
      picker.choose(Number(event.key) - 1);
    } else {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
  }

  const title = format(picker.title);
  return (
    <div className="ans-context-menu ans-picker" ref={rootRef} style={place}>
      <ul
        className="ans-dropdown"
        role="menu"
        aria-label={title}
        ref={listRef}
        onKeyDown={onKeyDown}
      >
        <li className="ans-picker-title" role="presentation">
          {title}
        </li>
        {picker.items.map((item, index) => {
          const text =
            item.isLiteral && typeof item.title === 'string' ? item.title : format(item.title);
          const previous = picker.items[index - 1];
          return (
            <Fragment key={`${String(index)}-${text}`}>
              {previous?.isLiteral === true && !item.isLiteral && (
                <li role="separator" className="ans-separator">
                  <hr />
                </li>
              )}
              <li>
                <button
                  type="button"
                  className="ans-item"
                  role="menuitem"
                  onClick={() => {
                    picker.choose(index);
                  }}
                >
                  <span className="ans-check" aria-hidden="true" />
                  <span className="ans-title">{text}</span>
                  {index < 9 && <kbd>{index + 1}</kbd>}
                </button>
              </li>
            </Fragment>
          );
        })}
      </ul>
    </div>
  );
}
