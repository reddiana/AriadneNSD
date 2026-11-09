// The web app's entry: builds the shell and the editor and puts them on the page (06-web).

import type { ExamplesHost } from '@ariadne-nsd/editor';
import { createEditor, examples, rememberedHeadStyle } from '@ariadne-nsd/editor';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './app';
import { hasFileSystemAccess } from './files/file-system-access';
import { thumbnailUrl } from './examples/thumbnail-urls';
import { browserCopyText } from './files/share-command';
import { browserDeflate, isShareLink } from './files/share-link';
import { createSaveFonts } from './fonts/save-font';
import { isPerfMode } from './perf/is-perf-mode';
import { createPrinter } from './print/print-view';
import { loadBlockFont } from './fonts/screen-font';
import { localeSettingKey, screenLocale, watchAppearance } from './shell/appearance';
import { createListeners } from './shell/listeners';
import { watchFileDrops, watchPageExit } from './shell/page-events';
import { browserClock } from './shell/timers';
import { createWebShell } from './shell/web-shell';
import { openBrowserDb } from './storage/browser-db';
import { browserLocalStorage, createSettingsStore } from './storage/settings-store';
import './web.css';

/** Log lines for the problem report (R-REP-01, after the MVP). Kept in memory for now. */
const logLines: string[] = [];
function log(detail: string): void {
  logLines.push(`${new Date().toISOString()} ${detail}`);
  if (logLines.length > 200) {
    logLines.shift();
  }
}

function describe(value: unknown): string {
  if (value instanceof Error) {
    return value.stack ?? value.message;
  }
  try {
    return JSON.stringify(value);
  } catch {
    // Not serializable (a cycle): the type name is all there is to say.
    return Object.prototype.toString.call(value);
  }
}

/** Where the start has got to, for the boot screen in index.html (it shows it on a failure). */
function bootStep(step: string): void {
  document.documentElement.dataset.bootStep = step;
}

bootStep('settings');
const root = document.getElementById('root');
if (root === null) {
  throw new Error('Missing #root element in index.html');
}

// The check mode of AT-05 (`?perf`, 06-web 9) is a page of its own, fetched only when asked for.
// It takes the place of the app: the rest of this module never runs, so there is no web shell
// (local backup, auto save, recent files) and nothing is written.
if (isPerfMode(window.location.search)) {
  bootStep('perf');
  const { startPerfMode } = await import('./perf/perf-page');
  await startPerfMode(root);
  await new Promise<never>(() => undefined);
}

const settings = createSettingsStore(browserLocalStorage(), log, window);
let locale = screenLocale(settings.get(localeSettingKey), navigator.language);
document.documentElement.lang = locale;
bootStep('database');
const db = await openBrowserDb(log);
bootStep('editor');

// The wasm and the TTF for saving (2 MB, about 1 MB compressed) are fetched at the first edit, not
// at start, and before the first save: a save dialog must open soon after the click that asks.
const saveFonts = createSaveFonts();
// File › Print… and the browser's own Print (R-EXP-03). It reads the editor made below, and
// only when printing, after the start.
const printer = createPrinter(window, () => editor.rendering(), navigator.language, log);

const shell = createWebShell({
  db,
  settings,
  locale,
  canWriteInPlace: hasFileSystemAccess(),
  channel: 'BroadcastChannel' in window ? new BroadcastChannel('ariadne-nsd-documents') : null,
  tabId: crypto.randomUUID(),
  wait: (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds)),
  clock: browserClock,
  newKey: () => crypto.randomUUID(),
  now: () => Date.now(),
  setTitle: (title) => {
    document.title = title;
  },
  log,
  share: {
    page: window.location,
    deflate: browserDeflate(),
    copyText: browserCopyText(navigator.clipboard),
  },
  ...('storage' in navigator && 'persist' in navigator.storage
    ? { persistStorage: () => navigator.storage.persist() }
    : {}),
  fontFile: async () => (await saveFonts()).ttf,
  languageTag: navigator.language,
  print: printer.print,
});

/** The share link this page was opened with (R-WEB-05): the URL's `#…`, or none. */
function shareFragment(): string | undefined {
  const fragment = window.location.hash.slice(1);
  return isShareLink(fragment) ? fragment : undefined;
}
const sharedAtStart = shareFragment();

const appearanceChanged = createListeners<Parameters<typeof watchAppearance>[0]>();
const appearance = watchAppearance(appearanceChanged.emit);
const dragging = createListeners<(isDragging: boolean) => void>();

const blockFontLoading = loadBlockFont();
const canvas = document.createElement('div');
canvas.className = 'ans-web-canvas';
const editor = createEditor({
  host: canvas,
  settings,
  appearance: appearance.current,
  doc: shell.initialDocument(),
  fonts: saveFonts,
  locale,
  log: (text, detail) => {
    log(detail === undefined ? text : `${text}: ${describe(detail)}`);
  },
});

// The examples (R-EDIT-25): open as a new document named after the example; the welcome shows
// once per browser (UX EX2).
const welcomedKey = 'examples.welcomed';
const examplesHost: ExamplesHost = {
  open: (id) => {
    const example = examples.find((item) => item.id === id);
    if (example === undefined) {
      return;
    }
    // In the header shape the user chose last (UX HS1), drawn in the screen language (ADR-0041).
    void shell.openDocument(
      example.build({ headStyle: rememberedHeadStyle(settings), locale }),
      `${example.name[locale]}.ns.svg`,
    );
  },
  // A share link shows its diagram: the welcome waits for a visit without one.
  isFirstVisit: settings.get(welcomedKey) !== true && sharedAtStart === undefined,
  onWelcomed: () => {
    settings.set(welcomedKey, true);
  },
  thumbnailUrl,
};

bootStep('render');
const reactRoot = createRoot(root);
function render(): void {
  reactRoot.render(
    <StrictMode>
      <App
        handle={editor}
        canvas={canvas}
        locale={locale}
        settings={settings}
        appearance={appearance.current}
        onAppearance={appearanceChanged.add}
        onDragState={dragging.add}
        examples={examplesHost}
        view={{
          isViewing: sharedAtStart !== undefined,
          onViewMode: shell.onViewMode,
          onEdit: shell.startEditing,
        }}
        places={shell.places}
      />
    </StrictMode>,
  );
}
render();

// Preferences › screen language (R-NFR-04): the menus follow at once.
settings.onChange((key) => {
  if (key !== localeSettingKey) {
    return;
  }
  locale = screenLocale(settings.get(localeSettingKey), navigator.language);
  document.documentElement.lang = locale;
  shell.setLocale(locale);
  render();
});

// Leaving view mode (Edit, or another document) takes the link out of the address bar, so a
// reload restores the local backup of the edits instead of the link (UX SH4).
shell.onViewMode((isViewing) => {
  if (!isViewing && shareFragment() !== undefined) {
    history.replaceState(history.state, '', window.location.pathname + window.location.search);
  }
});
// A share link pasted into the address bar of this tab changes only the fragment.
window.addEventListener('hashchange', () => {
  const fragment = shareFragment();
  if (fragment !== undefined) {
    void shell.openShareLink(fragment);
  }
});

bootStep('start');
await shell.start(editor, sharedAtStart);
// The keys go to the diagram from the start, so a keyboard-only user can begin (R-NFR-05).
// On the first visit the examples modal has them instead, so Esc closes it (UX EX2).
if (!examplesHost.isFirstVisit) {
  editor.focus();
}
watchFileDrops(shell, dragging.emit);
watchPageExit(shell);
bootStep('font');
await blockFontLoading;
bootStep('ready');
document.documentElement.dataset.ready = 'true';
let isPreloading = false;
editor.onStatus((status) => {
  if (status.dirty && !isPreloading) {
    isPreloading = true;
    saveFonts().catch((error: unknown) => {
      log(`Preloading the save font failed (tried again on save): ${String(error)}`);
    });
  }
});
