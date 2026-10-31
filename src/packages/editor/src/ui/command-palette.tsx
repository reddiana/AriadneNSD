// The command palette (R-EDIT-24, 02-interaction-rules "커맨드 팔레트", UX W6): type part of a
// command's name, pick with ↑ ↓, run with Enter, close with Esc. Every row shows all its keys,
// Vim keys included. Recently run commands come first.

import type { KeyboardEvent, ReactElement } from 'react';
import { useId, useState } from 'react';

import { uiCommandIds } from './command-ids';
import type { CommandView } from './command-view';
import { displayKey } from './keys';
import { useChrome, useCommands } from './use-engine';

/**
 * The palette's rows for a query: commands whose title contains the query (ignoring case and
 * spaces at the ends), recent ones first in the order they were run, the rest by title.
 */
export function paletteRows(
  commands: ReadonlyArray<CommandView>,
  query: string,
  recent: ReadonlyArray<string>,
): ReadonlyArray<CommandView> {
  const needle = query.trim().toLocaleLowerCase();
  const rank = (id: string): number => {
    const index = recent.indexOf(id);
    return index === -1 ? recent.length : index;
  };
  return commands
    .filter((command) => command.id !== uiCommandIds.commandPalette)
    .filter((command) => command.title.toLocaleLowerCase().includes(needle))
    .sort((a, b) => rank(a.id) - rank(b.id) || a.title.localeCompare(b.title));
}

/** The palette window, at the top centre of the editor (06-web 7). */
export function CommandPalette({
  recent,
  onClose,
}: {
  readonly recent: ReadonlyArray<string>;
  readonly onClose: () => void;
}): ReactElement {
  const { run, text } = useChrome();
  const commands = useCommands();
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const listId = useId();
  const rows = paletteRows(commands, query, recent);
  const activeIndex = Math.min(active, Math.max(rows.length - 1, 0));

  function choose(command: CommandView | undefined): void {
    if (!command) return;
    onClose();
    run(command.id);
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>): void {
    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowUp': {
        if (rows.length === 0) break;
        const step = event.key === 'ArrowDown' ? 1 : -1;
        setActive((activeIndex + step + rows.length) % rows.length);
        break;
      }
      case 'Enter':
        if (event.nativeEvent.isComposing) return; // IME composition (03-editor 3.4)
        choose(rows[activeIndex]);
        break;
      case 'Escape':
        onClose();
        break;
      default:
        return;
    }
    event.preventDefault();
    event.stopPropagation();
  }

  const activeRow = rows[activeIndex];
  return (
    <div className="ans-modal ans-palette" role="dialog" aria-label={text('palette.label')}>
      <input
        autoFocus
        type="text"
        role="combobox"
        aria-expanded="true"
        aria-controls={listId}
        aria-activedescendant={activeRow ? `${listId}-${activeRow.id}` : undefined}
        aria-label={text('palette.label')}
        placeholder={text('palette.placeholder')}
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setActive(0);
        }}
        onKeyDown={onKeyDown}
      />
      {rows.length === 0 ? (
        <p className="ans-empty">{text('palette.empty')}</p>
      ) : (
        <ul id={listId} role="listbox" aria-label={text('palette.label')}>
          {rows.map((command, index) => (
            <li
              key={command.id}
              id={`${listId}-${command.id}`}
              role="option"
              aria-selected={index === activeIndex}
              aria-disabled={!command.isEnabled}
              title={command.reason ?? undefined}
              onMouseMove={() => {
                setActive(index);
              }}
              onClick={() => {
                choose(command);
              }}
            >
              <span className="ans-title">{command.title}</span>
              {command.reason !== null && <span className="ans-reason">{command.reason}</span>}
              <span>
                {command.keys.map((key) => (
                  <kbd key={key}>{displayKey(key)}</kbd>
                ))}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
