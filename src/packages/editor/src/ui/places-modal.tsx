// The open · save modal (R-WEB-09, UX BS1 · BS3 · BS4): File › Open… and Save As… first ask
// where, "Files on This Computer" or "This Browser". The computer side hands over to the
// operating system's dialog; the browser side lists the documents kept in this browser.
// The shell does the work (`PlacesHost`); this modal only shows and asks.

import type { Locale } from '@ariadne-nsd/core';
import type { KeyboardEvent, ReactElement } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { Modal } from './modals';
import { useChrome } from './use-engine';

/** The two sides of the modal. */
export type PlaceSide = 'computer' | 'browser';

/** A document kept in this browser, as the list shows it. */
export type BrowserDocumentInfo = {
  readonly key: string;
  readonly name: string;
  /** When it was last saved, in milliseconds since 1970. */
  readonly savedAt: number;
  /** The size of its text in bytes. */
  readonly size: number;
};

/** What the shell asks the modal for. A new request (new `id`) starts the modal afresh. */
export type PlacesRequest = {
  readonly id: number;
  readonly mode: 'open' | 'save';
  /** The side it opens on: the one last used in this browser (UX BS1). */
  readonly side: PlaceSide;
  /** Saving: what the name field starts with. */
  readonly name: string;
  /** The key of the document open now (shown in bold), or `null`. */
  readonly currentKey: string | null;
  /** Saving on the computer side downloads (Firefox, Safari) rather than picking a file. */
  readonly isDownload: boolean;
};

/** The user's answer. `null`: closed (Esc, ✕, the backdrop, Cancel). */
export type PlacesAnswer =
  | { readonly kind: 'computer' }
  | { readonly kind: 'open'; readonly key: string }
  | { readonly kind: 'save'; readonly name: string }
  | null;

/** What the shell does for the modal. The list actions resolve when they are done. */
export type PlacesHost = {
  readonly request: () => PlacesRequest | null;
  readonly onRequest: (listener: () => void) => () => void;
  readonly answer: (answer: PlacesAnswer) => void;
  /** The documents in this browser, newest first. */
  readonly documents: () => Promise<ReadonlyArray<BrowserDocumentInfo>>;
  readonly rename: (key: string) => Promise<void>;
  readonly exportDocument: (key: string) => Promise<void>;
  /** Asks first, then deletes. */
  readonly remove: (key: string) => Promise<void>;
  readonly exportAll: () => Promise<void>;
  readonly importFiles: () => Promise<void>;
};

const dayMs = 24 * 60 * 60 * 1000;

/**
 * "Modified" in the list: the time for today, "Yesterday", the month and day this year, and the
 * whole date before that.
 */
export function formatSavedAt(
  savedAt: number,
  now: number,
  locale: Locale,
  yesterday: string,
): string {
  const at = new Date(savedAt);
  const today = new Date(now);
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  if (savedAt >= startOfToday) {
    return at.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', hour12: false });
  }
  if (savedAt >= startOfToday - dayMs) {
    return yesterday;
  }
  if (at.getFullYear() === today.getFullYear()) {
    return at.toLocaleDateString(locale, { month: 'short', day: 'numeric' });
  }
  return at.toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' });
}

/** "Size" in the list: whole KB (at least 1), or MB with one decimal from 1 MB. */
export function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${String(Math.max(1, Math.round(bytes / 1024)))} KB`;
}

/** The open · save modal for one request. Rendered by `EditorApp` while the host has a request. */
export function PlacesModal({
  host,
  request,
}: {
  readonly host: PlacesHost;
  readonly request: PlacesRequest;
}): ReactElement {
  const { locale, text } = useChrome();
  const [side, setSide] = useState<PlaceSide>(request.side);
  const [documents, setDocuments] = useState<ReadonlyArray<BrowserDocumentInfo> | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [name, setName] = useState(request.name);
  const [isBusy, setBusy] = useState(false);
  const tabRefs = useRef<Record<PlaceSide, HTMLButtonElement | null>>({
    computer: null,
    browser: null,
  });
  const listRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const computerRef = useRef<HTMLButtonElement>(null);
  const isSave = request.mode === 'save';

  const reload = useCallback(async (): Promise<void> => {
    const next = await host.documents();
    setDocuments(next);
    setSelected((previous) =>
      previous !== null && next.some((item) => item.key === previous)
        ? previous
        : isSave
          ? null
          : (next[0]?.key ?? null),
    );
  }, [host, isSave]);

  useEffect(() => {
    void reload();
  }, [reload]);

  /** Puts the keys where the side's work is: the button, the name field, or the list. */
  const focusSide = useCallback(
    (next: PlaceSide): void => {
      if (next === 'computer') {
        computerRef.current?.focus();
      } else if (isSave) {
        nameRef.current?.focus();
        nameRef.current?.select();
      } else {
        listRef.current?.focus();
      }
    },
    [isSave],
  );

  useEffect(() => {
    focusSide(request.side);
  }, [focusSide, request.side]);

  const close = (): void => {
    host.answer(null);
  };

  /** Runs a list action, then reads the list again and gives the keys back to it. */
  const act = async (work: () => Promise<void>): Promise<void> => {
    setBusy(true);
    try {
      await work();
      await reload();
    } finally {
      setBusy(false);
      listRef.current?.focus();
    }
  };

  const openSelected = (): void => {
    if (selected !== null) {
      host.answer({ kind: 'open', key: selected });
    }
  };
  const save = (): void => {
    host.answer({ kind: 'save', name });
  };

  function onTabKey(event: KeyboardEvent<HTMLButtonElement>): void {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    const next: PlaceSide = side === 'computer' ? 'browser' : 'computer';
    setSide(next);
    tabRefs.current[next]?.focus();
  }

  function onListKey(event: KeyboardEvent<HTMLDivElement>): void {
    const list = documents ?? [];
    const index = list.findIndex((item) => item.key === selected);
    switch (event.key) {
      // Like the other lists (UX K2): j k or the arrows, and past an end to the other end.
      case 'ArrowDown':
      case 'j':
      case 'ArrowUp':
      case 'k': {
        event.preventDefault();
        if (list.length === 0) return;
        const isDown = event.key === 'ArrowDown' || event.key === 'j';
        const from = index < 0 ? (isDown ? -1 : 0) : index;
        const next = list[(from + (isDown ? 1 : -1) + list.length) % list.length];
        if (next !== undefined) choose(next);
        return;
      }
      case 'Enter':
        event.preventDefault();
        if (isSave) save();
        else openSelected();
        return;
      case 'Delete':
        if (selected !== null) {
          event.preventDefault();
          const key = selected;
          void act(() => host.remove(key));
        }
        return;
    }
  }

  /** Selects a row; when saving, its name goes to the name field (to replace it). */
  function choose(item: BrowserDocumentInfo): void {
    setSelected(item.key);
    if (isSave) setName(item.name);
  }

  function tab(which: PlaceSide, label: string): ReactElement {
    return (
      <button
        type="button"
        role="tab"
        id={`ans-places-tab-${which}`}
        aria-selected={side === which}
        aria-controls={`ans-places-panel-${which}`}
        tabIndex={side === which ? 0 : -1}
        ref={(element) => {
          tabRefs.current[which] = element;
        }}
        onClick={() => {
          setSide(which);
        }}
        onKeyDown={onTabKey}
      >
        {label}
      </button>
    );
  }

  function computerPanel(): ReactElement {
    const lead = isSave
      ? request.isDownload
        ? 'places.computerDownloadLead'
        : 'places.computerSaveLead'
      : 'places.computerOpenLead';
    const button = isSave
      ? request.isDownload
        ? 'places.download'
        : 'places.chooseWhere'
      : 'places.chooseFile';
    return (
      <div
        className="ans-places-panel"
        role="tabpanel"
        id="ans-places-panel-computer"
        aria-labelledby="ans-places-tab-computer"
      >
        <p className="ans-note">{text(lead)}</p>
        <div className="ans-dialog-buttons">
          <button type="button" onClick={close}>
            {text('places.cancel')}
          </button>
          <button
            type="button"
            ref={computerRef}
            data-default="true"
            onClick={() => {
              host.answer({ kind: 'computer' });
            }}
          >
            {text(button)}
          </button>
        </div>
      </div>
    );
  }

  function table(): ReactElement {
    const list = documents ?? [];
    if (documents !== null && list.length === 0) {
      return (
        <div className="ans-places-list ans-places-empty" ref={listRef} tabIndex={-1}>
          {text('places.empty')}
        </div>
      );
    }
    const now = Date.now();
    return (
      <div
        className="ans-places-list"
        ref={listRef}
        tabIndex={0}
        role="grid"
        aria-label={text('places.list')}
        aria-activedescendant={selected === null ? undefined : `ans-places-row-${selected}`}
        onKeyDown={onListKey}
      >
        <table>
          <thead>
            <tr>
              <th>{text('places.name')}</th>
              <th>{text('places.modified')}</th>
              <th className="ans-places-size">{text('places.size')}</th>
            </tr>
          </thead>
          <tbody>
            {list.map((item) => (
              <tr
                key={item.key}
                id={`ans-places-row-${item.key}`}
                aria-selected={item.key === selected}
                data-current={item.key === request.currentKey ? 'true' : undefined}
                onClick={() => {
                  choose(item);
                }}
                onDoubleClick={() => {
                  if (isSave) host.answer({ kind: 'save', name: item.name });
                  else host.answer({ kind: 'open', key: item.key });
                }}
              >
                <td>{item.name}</td>
                <td>{formatSavedAt(item.savedAt, now, locale, text('places.yesterday'))}</td>
                <td className="ans-places-size">{formatSize(item.size)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  function browserPanel(): ReactElement {
    const hasSelection = selected !== null && !isBusy;
    return (
      <div
        className="ans-places-panel"
        role="tabpanel"
        id="ans-places-panel-browser"
        aria-labelledby="ans-places-tab-browser"
      >
        {isSave && (
          <form
            className="ans-places-name"
            onSubmit={(event) => {
              event.preventDefault();
              save();
            }}
          >
            <label htmlFor="ans-places-name">{text('places.name')}</label>
            <input
              id="ans-places-name"
              ref={nameRef}
              type="text"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
              }}
            />
          </form>
        )}
        {table()}
        <p className="ans-places-warning" role="note">
          <span aria-hidden="true">⚠</span>
          {text(isSave ? 'places.saveWarning' : 'places.listWarning')}
        </p>
        {isSave ? (
          <div className="ans-dialog-buttons">
            <button type="button" onClick={close}>
              {text('places.cancel')}
            </button>
            <button type="button" data-default="true" disabled={isBusy} onClick={save}>
              {text('places.save')}
            </button>
          </div>
        ) : (
          <>
            <div className="ans-dialog-buttons">
              <span className="ans-places-actions">
                <button
                  type="button"
                  disabled={!hasSelection}
                  onClick={() => {
                    if (selected !== null) void act(() => host.rename(selected));
                  }}
                >
                  {text('places.rename')}
                </button>
                <button
                  type="button"
                  disabled={!hasSelection}
                  onClick={() => {
                    if (selected !== null) void act(() => host.exportDocument(selected));
                  }}
                >
                  {text('places.export')}
                </button>
                <button
                  type="button"
                  className="ans-places-delete"
                  disabled={!hasSelection}
                  onClick={() => {
                    if (selected !== null) void act(() => host.remove(selected));
                  }}
                >
                  {text('places.delete')}
                </button>
              </span>
              <button
                type="button"
                data-default="true"
                disabled={!hasSelection}
                onClick={openSelected}
              >
                {text('places.open')}
              </button>
            </div>
            <div className="ans-dialog-buttons ans-places-backup">
              <button
                type="button"
                disabled={isBusy || (documents ?? []).length === 0}
                onClick={() => {
                  void act(() => host.exportAll());
                }}
              >
                {text('places.exportAll')}
              </button>
              <button
                type="button"
                disabled={isBusy}
                onClick={() => {
                  void act(() => host.importFiles());
                }}
              >
                {text('places.import')}
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <Modal title={text(isSave ? 'places.saveTitle' : 'places.openTitle')} onClose={close}>
      <div className="ans-places-sides" role="tablist" aria-label={text('places.sides')}>
        {tab('computer', text('places.computer'))}
        {tab('browser', text('places.browser'))}
      </div>
      {side === 'computer' ? computerPanel() : browserPanel()}
    </Modal>
  );
}
