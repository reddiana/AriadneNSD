// The modals over the editor: the shortcut list (`?`), preferences (Ctrl+,), document settings,
// About and What's New (06-web 7, UX W4 · W5). Esc or the backdrop closes them.

import type { KeyboardEvent, ReactElement, ReactNode } from 'react';
import { useEffect, useReducer, useRef } from 'react';

import { editorVersion } from '../version';
import type { CommandView } from './command-view';
import type { SettingSpec, SettingsStore } from './engine-api';
import { displayKey, splitKeys } from './keys';
import { menuOrder } from './menu-model';
import type { Chrome } from './use-engine';
import { useChrome, useCommands } from './use-engine';

/** A modal window with a title bar and a close button. */
export function Modal({
  title,
  onClose,
  children,
}: {
  readonly title: string;
  readonly onClose: () => void;
  readonly children: ReactNode;
}): ReactElement {
  const { text } = useChrome();
  const dialogRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    dialogRef.current?.focus();
  }, []);

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>): void {
    if (event.key !== 'Escape') return;
    event.preventDefault();
    event.stopPropagation();
    onClose();
  }

  return (
    <div
      className="ans-modal"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      tabIndex={-1}
      ref={dialogRef}
      onKeyDown={onKeyDown}
    >
      <header>
        <h2>{title}</h2>
        <button
          type="button"
          className="ans-close"
          onClick={onClose}
          aria-label={text('modal.close')}
        >
          ✕
        </button>
      </header>
      <div className="ans-modal-body">{children}</div>
    </div>
  );
}

function keyCell(keys: ReadonlyArray<string>): ReactNode {
  return keys.map((key, index) => (
    <span key={key}>
      {index > 0 && ', '}
      <kbd>{displayKey(key)}</kbd>
    </span>
  ));
}

/** Groups commands that have keys by their menu, in menu-bar order; others come last. */
function shortcutGroups(
  commands: ReadonlyArray<CommandView>,
): ReadonlyArray<{ readonly menu: string | null; readonly commands: ReadonlyArray<CommandView> }> {
  const withKeys = commands.filter((command) => command.keys.length > 0);
  const groups: { menu: string | null; commands: CommandView[] }[] = menuOrder.map((menu) => ({
    menu,
    commands: withKeys.filter((command) => command.menu?.menu === menu),
  }));
  groups.push({ menu: null, commands: withKeys.filter((command) => command.menu === null) });
  return groups.filter((group) => group.commands.length > 0);
}

/** The key table modal (`?`): every command with its Vim and standard keys (03-keymap). */
export function ShortcutsModal({ onClose }: { readonly onClose: () => void }): ReactElement {
  const { text } = useChrome();
  const commands = useCommands();
  return (
    <Modal title={text('shortcuts.title')} onClose={onClose}>
      <table className="ans-keytable">
        <thead>
          <tr>
            <th>{text('shortcuts.command')}</th>
            <th>{text('shortcuts.vimKey')}</th>
            <th>{text('shortcuts.standardKey')}</th>
          </tr>
        </thead>
        {shortcutGroups(commands).map((group) => (
          <tbody key={group.menu ?? 'other'}>
            {group.menu !== null && (
              <tr className="ans-group">
                <th colSpan={3}>{text(`menu.${group.menu as (typeof menuOrder)[number]}`)}</th>
              </tr>
            )}
            {group.commands.map((command) => {
              const { vim, standard } = splitKeys(command.keys);
              return (
                <tr key={command.id}>
                  <td>{command.title}</td>
                  <td>{keyCell(vim)}</td>
                  <td>{keyCell(standard)}</td>
                </tr>
              );
            })}
          </tbody>
        ))}
      </table>
    </Modal>
  );
}

/** Reads and writes the values of one scope of settings. */
type SettingValues = {
  get(spec: SettingSpec): unknown;
  set(spec: SettingSpec, value: string | number | boolean): void;
  /** Calls the listener when any value may have changed elsewhere. */
  subscribe(listener: () => void): () => void;
};

function valueTitle(spec: SettingSpec, index: number, value: unknown, chrome: Chrome): string {
  const title = spec.valueTitles?.[index];
  if (title !== undefined) return chrome.format(title);
  if (typeof value === 'boolean') return chrome.text(value ? 'value.on' : 'value.off');
  return String(value);
}

function SettingField({
  spec,
  values,
}: {
  readonly spec: SettingSpec;
  readonly values: SettingValues;
}): ReactElement {
  const chrome = useChrome();
  const current = values.get(spec) ?? spec.defaultValue;
  const selected = Math.max(
    spec.values.findIndex((value) => value === current),
    0,
  );
  const id = `ans-setting-${spec.id}`;
  return (
    <div className="ans-field">
      <label htmlFor={id}>{chrome.format(spec.title)}</label>
      <select
        id={id}
        value={selected}
        onChange={(event) => {
          const value = spec.values[Number(event.target.value)];
          if (value !== undefined) values.set(spec, value);
        }}
      >
        {spec.values.map((value, index) => (
          <option key={String(value)} value={index}>
            {valueTitle(spec, index, value, chrome)}
          </option>
        ))}
      </select>
    </div>
  );
}

function SettingsForm({
  scope,
  values,
}: {
  readonly scope: SettingSpec['scope'];
  readonly values: SettingValues;
}): ReactElement {
  const { handle, text } = useChrome();
  const [, refresh] = useReducer((count: number) => count + 1, 0);
  useEffect(() => values.subscribe(refresh), [values]);
  const specs = handle.settingsSchema.list().filter((spec) => spec.scope === scope);
  if (specs.length === 0) return <p className="ans-note">{text('preferences.empty')}</p>;
  return (
    <>
      {specs.map((spec) => (
        <SettingField key={spec.id} spec={spec} values={values} />
      ))}
    </>
  );
}

/** File › Preferences… (Ctrl+,): the user's settings, kept by the shell (UX W5). */
export function PreferencesModal({
  settings,
  onClose,
}: {
  readonly settings: SettingsStore;
  readonly onClose: () => void;
}): ReactElement {
  const { text } = useChrome();
  const values = useRef<SettingValues>({
    get: (spec) => settings.get(spec.id),
    set: (spec, value) => {
      settings.set(spec.id, value);
    },
    subscribe: (listener) => settings.onChange(listener),
  }).current;
  return (
    <Modal title={text('preferences.title')} onClose={onClose}>
      <p className="ans-note">{text('preferences.note')}</p>
      <SettingsForm scope="user" values={values} />
    </Modal>
  );
}

/** Diagram › Document Settings…: the settings saved in the file (UX W5). */
export function DocumentSettingsModal({ onClose }: { readonly onClose: () => void }): ReactElement {
  const { handle, text } = useChrome();
  const values = useRef<SettingValues>({
    get: (spec) => handle.documentSetting(spec.id),
    set: (spec, value) => {
      handle.setDocumentSetting(spec.id, value);
    },
    subscribe: (listener) => handle.onStatus(listener),
  }).current;
  return (
    <Modal title={text('documentSettings.title')} onClose={onClose}>
      <p className="ans-note">{text('documentSettings.note')}</p>
      <SettingsForm scope="document" values={values} />
    </Modal>
  );
}

/** Help › About AriadneNSD. */
export function AboutModal({ onClose }: { readonly onClose: () => void }): ReactElement {
  const { text } = useChrome();
  return (
    <Modal title={text('about.title')} onClose={onClose}>
      <p>{text('about.body')}</p>
      <p className="ans-note">{text('about.version', { version: editorVersion })}</p>
    </Modal>
  );
}

/** Help › What's New in This Version. */
export function WhatsNewModal({ onClose }: { readonly onClose: () => void }): ReactElement {
  const { text } = useChrome();
  return (
    <Modal title={text('whatsNew.title')} onClose={onClose}>
      <p>{text('whatsNew.body')}</p>
    </Modal>
  );
}
