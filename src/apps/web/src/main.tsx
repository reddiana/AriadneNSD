// The web app's entry: builds the shell and the editor and puts them on the page (06-web).

import type { ExamplesHost } from '@ariadne-nsd/editor';
import { createEditor, examples, rememberedHeadStyle } from '@ariadne-nsd/editor';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './app';
import { hasFileSystemAccess } from './files/file-system-access';
import { thumbnailUrl } from './examples/thumbnail-urls';
import { createSaveFonts } from './fonts/save-font';
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

const settings = createSettingsStore(browserLocalStorage(), log, window);
let locale = screenLocale(settings.get(localeSettingKey), navigator.language);
document.documentElement.lang = locale;
bootStep('database');
const db = await openBrowserDb(log);
bootStep('editor');

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
});

const appearanceChanged = createListeners<Parameters<typeof watchAppearance>[0]>();
const appearance = watchAppearance(appearanceChanged.emit);
const dragging = createListeners<(isDragging: boolean) => void>();

const blockFontLoading = loadBlockFont();
// The wasm and the TTF for saving (2 MB, about 1 MB compressed) are fetched at the first edit, not
// at start, and before the first save: a save dialog must open soon after the click that asks.
const saveFonts = createSaveFonts();
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
    // In the header shape the user chose last (UX HS1).
    void shell.openDocument(
      example.build(rememberedHeadStyle(settings)),
      `${example.name[locale]}.ns.svg`,
    );
  },
  isFirstVisit: settings.get(welcomedKey) !== true,
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

bootStep('start');
await shell.start(editor);
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
