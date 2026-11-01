// The editor's surrounding UI as one component for the shells (ADR-0010: React only around the
// diagram). It lays out menu bar, toolbar, canvas, status bar (06-web 7) and opens the palette,
// the key hint and the modals. All data comes from the engine's handle (ADR-0033).

import type { Locale } from '@ariadne-nsd/core';
import type { ReactElement } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { exampleCommandPrefix, uiCommandIds } from './command-ids';
import type { MessageFormatter } from './command-view';
import { defaultFormatter } from './command-view';
import { CommandPalette } from './command-palette';
import { examples as exampleList } from '../examples/examples';
import { ContextMenu } from './context-menu';
import type {
  Appearance,
  CommandSpec,
  ContextMenuRequest,
  EditorHandle,
  MenuPlace,
  SettingsStore,
} from './engine-api';
import type { ExamplesMode } from './examples-modal';
import { ExamplesModal } from './examples-modal';
import { KeyHint } from './key-hint';
import { MenuBar } from './menu-bar';
import { PickerMenu } from './picker-menu';
import type { UiMessageKey } from './messages';
import { uiMessage } from './messages';
import {
  AboutModal,
  DialogModal,
  DocumentSettingsModal,
  PreferencesModal,
  ShortcutsModal,
  WhatsNewModal,
} from './modals';
import { StatusBar } from './status-bar';
import { chromeCss } from './styles';
import { BottomBar, Toolbar } from './toolbar';
import type { Chrome } from './use-engine';
import { ChromeContext, textOf, useChromeState } from './use-engine';

/** How many recently run commands the palette puts first. */
const recentLimit = 8;

export type EditorAppProps = {
  /** The engine, from `createEditor`. */
  readonly handle: EditorHandle;
  /** The element the engine draws in (the `host` given to `createEditor`). It is moved into the canvas slot. */
  readonly canvas: HTMLElement;
  /** The screen language of the UI (preferences "화면 언어"). */
  readonly locale: Locale;
  /** The host's brightness and UI font (03-editor 6). */
  readonly appearance: Appearance;
  /** The user settings, for File › Preferences…. */
  readonly settings: SettingsStore;
  /** Turns engine messages (command titles, reasons, notices) into text. Default: see `defaultFormatter`. */
  readonly formatMessage?: MessageFormatter;
  /** Where Help › User Guide opens in a new tab (06-web 7: the site's `/manual/`). */
  readonly manualUrl?: string;
  /**
   * The examples (R-EDIT-25): how the shell opens one as a new document, and whether to welcome
   * a first-time visitor with the examples modal. Without it there are no examples.
   */
  readonly examples?: ExamplesHost;
};

/** What the shell does for the examples (05-screen-layout "예제", UX EX2 · EX3). */
export type ExamplesHost = {
  /** Opens the example with this id as a new document. */
  readonly open: (id: string) => void;
  /** Show the welcome once, now. */
  readonly isFirstVisit: boolean;
  /** The welcome was answered or closed: do not show it again. */
  readonly onWelcomed: () => void;
};

type Popup =
  'palette' | 'shortcuts' | 'preferences' | 'documentSettings' | 'about' | 'whatsNew' | 'examples';

type UiCommand = {
  readonly id: string;
  readonly title: UiMessageKey;
  readonly keys: ReadonlyArray<string>;
  readonly menu: MenuPlace;
  readonly open: Popup | 'manual';
};

// Group 90 puts these after the engine's own groups of the same menu (03-editor 5.1).
const uiCommands: ReadonlyArray<UiCommand> = [
  {
    id: uiCommandIds.preferences,
    title: 'cmd.preferences',
    keys: ['Ctrl+,'],
    menu: { menu: 'file', group: 90, order: 0 },
    open: 'preferences',
  },
  {
    id: uiCommandIds.commandPalette,
    title: 'cmd.commandPalette',
    keys: ['Ctrl+Shift+P', 'F1'],
    menu: { menu: 'edit', group: 90, order: 0 },
    open: 'palette',
  },
  {
    id: uiCommandIds.documentSettings,
    title: 'cmd.documentSettings',
    keys: [],
    menu: { menu: 'diagram', group: 90, order: 0 },
    open: 'documentSettings',
  },
  {
    id: uiCommandIds.manual,
    title: 'cmd.manual',
    keys: [],
    menu: { menu: 'help', group: 0, order: 0 },
    open: 'manual',
  },
  {
    id: uiCommandIds.shortcuts,
    title: 'cmd.shortcuts',
    keys: ['?'],
    menu: { menu: 'help', group: 0, order: 1 },
    open: 'shortcuts',
  },
  {
    id: uiCommandIds.whatsNew,
    title: 'cmd.whatsNew',
    keys: [],
    menu: { menu: 'help', group: 1, order: 0 },
    open: 'whatsNew',
  },
  {
    id: uiCommandIds.about,
    title: 'cmd.about',
    keys: [],
    menu: { menu: 'help', group: 1, order: 1 },
    open: 'about',
  },
];

/** Puts the engine's element into the canvas slot, and takes it out again on unmount. */
function useMountedCanvas(canvas: HTMLElement) {
  const slotRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const slot = slotRef.current;
    if (!slot) return;
    slot.appendChild(canvas);
    return () => {
      if (canvas.parentNode === slot) slot.removeChild(canvas);
    };
  }, [canvas]);
  return slotRef;
}

/**
 * The whole editor screen: menu bar, toolbar, the engine's canvas, status bar, and the popups.
 * Shells render this once per document view.
 */
export function EditorApp({
  handle,
  canvas,
  locale,
  appearance,
  settings,
  formatMessage,
  manualUrl = 'manual/',
  examples,
}: EditorAppProps): ReactElement {
  const [popup, setPopup] = useState<Popup | null>(
    examples?.isFirstVisit === true ? 'examples' : null,
  );
  const [examplesMode, setExamplesMode] = useState<ExamplesMode>(
    examples?.isFirstVisit === true ? 'welcome' : 'menu',
  );
  const [recent, setRecent] = useState<ReadonlyArray<string>>([]);
  const [contextMenu, setContextMenu] = useState<
    (ContextMenuRequest & { readonly key: number }) | null
  >(null);
  const slotRef = useMountedCanvas(canvas);
  const { dialog, picker } = useChromeState(handle);

  useEffect(
    () =>
      handle.onContextMenu((request) => {
        setContextMenu((previous) => ({ ...request, key: (previous?.key ?? 0) + 1 }));
      }),
    [handle],
  );
  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
    handle.focus();
  }, [handle]);

  const openPopup = useCallback((next: Popup) => {
    setPopup(next);
  }, []);

  const closePopup = useCallback(() => {
    setPopup(null);
    // Give the keys back to the diagram, so `j` `k` work again.
    handle.focus();
  }, [handle]);

  /** Closes the examples modal; a closed welcome is not shown again (UX EX2). */
  const closeExamples = useCallback(() => {
    if (examplesMode === 'welcome') {
      examples?.onWelcomed();
      setExamplesMode('menu');
    }
    closePopup();
  }, [closePopup, examples, examplesMode]);

  // Help › Examples… and one command per example (palette, toolbar "예제 ▾"), R-EDIT-25.
  useEffect(() => {
    if (examples === undefined) return;
    const specs: CommandSpec[] = [
      {
        id: uiCommandIds.examples,
        title: () => uiMessage(locale, 'cmd.examples'),
        keys: [],
        menu: { menu: 'help', group: 0, order: 2 },
        edits: false,
        when: () => true,
        run: () => {
          setExamplesMode('menu');
          setPopup('examples');
        },
      },
      ...exampleList.map((example): CommandSpec => ({
        id: `${exampleCommandPrefix}${example.id}`,
        title: () => example.name[locale],
        keys: [],
        edits: false,
        when: () => true,
        run: () => {
          examples.open(example.id);
        },
      })),
    ];
    const unregister = specs.map((spec) => handle.commands.register(spec));
    return () => {
      for (const remove of unregister) remove();
    };
  }, [handle, locale, examples]);

  // The UI's own commands join the registry so that menus, palette and keys see them (ADR-0033).
  useEffect(() => {
    const unregister = uiCommands.map((command) => {
      const spec: CommandSpec = {
        id: command.id,
        // Finished text in the screen language: formatMessage shows it as it is.
        title: () => uiMessage(locale, command.title),
        keys: command.keys,
        menu: command.menu,
        edits: false,
        when: () => true,
        run: () => {
          if (command.open === 'manual') window.open(manualUrl, '_blank', 'noopener');
          else openPopup(command.open);
        },
      };
      return handle.commands.register(spec);
    });
    return () => {
      for (const remove of unregister) remove();
    };
  }, [handle, locale, manualUrl, openPopup]);

  const chrome = useMemo<Chrome>(
    () => ({
      handle,
      locale,
      format: formatMessage ?? defaultFormatter(locale),
      text: textOf(locale),
      run: (id) => {
        setRecent((previous) =>
          [id, ...previous.filter((other) => other !== id)].slice(0, recentLimit),
        );
        // The keys go back to the diagram, so `j` `k` work after a click on the toolbar or a
        // menu. A popup or the inline editor the command opens takes the focus after this.
        handle.focus();
        handle.commands.run(id);
      },
    }),
    [handle, locale, formatMessage],
  );

  function popupContent(): ReactElement | null {
    switch (popup) {
      case null:
        return null;
      case 'palette':
        return <CommandPalette recent={recent} onClose={closePopup} />;
      case 'shortcuts':
        return <ShortcutsModal onClose={closePopup} />;
      case 'preferences':
        return <PreferencesModal settings={settings} onClose={closePopup} />;
      case 'documentSettings':
        return <DocumentSettingsModal onClose={closePopup} />;
      case 'about':
        return <AboutModal onClose={closePopup} />;
      case 'whatsNew':
        return <WhatsNewModal onClose={closePopup} />;
      case 'examples':
        return (
          <ExamplesModal
            mode={examplesMode}
            examples={exampleList}
            onClose={closeExamples}
            onExample={(id) => {
              closeExamples();
              examples?.open(id);
            }}
            onBlank={() => {
              closeExamples();
              handle.commands.run('file.new');
            }}
            onOpenFile={() => {
              closeExamples();
              handle.commands.run('file.open');
            }}
          />
        );
    }
  }

  const content = popupContent();
  return (
    <ChromeContext.Provider value={chrome}>
      <div
        className="ans-app"
        data-scheme={appearance.scheme}
        lang={locale}
        style={{ ['--ans-ui-font' as string]: appearance.uiFont }}
      >
        <style>{chromeCss}</style>
        <MenuBar />
        <Toolbar />
        <div className="ans-canvas-slot" ref={slotRef} />
        <KeyHint />
        <StatusBar />
        <BottomBar />
        {contextMenu && (
          <ContextMenu key={contextMenu.key} request={contextMenu} onClose={closeContextMenu} />
        )}
        {picker && <PickerMenu key={picker.id} picker={picker} />}
        {dialog && (
          <div className="ans-backdrop" data-kind="dialog">
            <DialogModal key={dialog.id} dialog={dialog} />
          </div>
        )}
        {!dialog && content && (
          <div
            className="ans-backdrop"
            data-kind={popup}
            onPointerDown={(event) => {
              if (event.target === event.currentTarget) closePopup();
            }}
          >
            {content}
          </div>
        )}
      </div>
    </ChromeContext.Provider>
  );
}
