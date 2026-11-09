// The check mode (`?perf`, 06-web 9): a page of its own in place of the app, for measuring AT-05
// on a device without a development setup. It shows the real editor (the same UI and drawing as
// the app) with a panel over it: what is measured, "Start Measuring", the progress and the
// results. `main.tsx` fetches this module only for `?perf`, so a first visit downloads none of it.
//
// Nothing here writes: no web shell (local backup, auto save, recent files, documents in this
// browser), settings read from localStorage but kept in memory, a clipboard in memory, and a
// store that refuses to save. The measured document is thrown away at the end.

import type { Locale } from '@ariadne-nsd/core';
import type { Appearance, EditorHandle } from '@ariadne-nsd/editor';
import { createEditor, EditorApp, editorVersion } from '@ariadne-nsd/editor';
import type { ReactElement } from 'react';
import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';

import { loadBlockFont } from '../fonts/screen-font';
import { localeSettingKey, screenLocale, watchAppearance } from '../shell/appearance';
import { browserLocalStorage, createSettingsStore } from '../storage/settings-store';
import { perfMessage } from './perf-messages';
import { memoryClipboard, noSaveFonts, perfDocumentStore, readOnlyStorage } from './perf-ports';
import type { PerfReport } from './perf-report';
import {
  columnTitles,
  deviceInfo,
  deviceText,
  documentText,
  formatLocalTime,
  isReportPass,
  perfCommandIds,
  reportMarkdown,
  responseLimitMs,
  rowCells,
  summarize,
  verdictText,
} from './perf-report';
import type { PerfPlan, PerfProgress } from './perf-run';
import { measureEdits, perfPlaces, perfPlanFrom } from './perf-run';

/** The panel's own layout; colours and parts are the editor UI's (`.ans-modal`, `.ans-keytable`). */
const perfCss = `
.ans-app.ans-perf {
  position: fixed; right: 16px; bottom: 16px; z-index: 40; height: auto;
  width: min(600px, calc(100vw - 32px)); background: transparent;
}
.ans-perf .ans-modal { width: 100%; max-height: calc(100vh - 32px); }
.ans-perf .ans-modal-body p { margin: 0; }
.ans-perf header a { color: var(--ui-accent); white-space: nowrap; }
.ans-perf progress { width: 100%; }
.ans-perf-verdict { font-weight: 600; }
.ans-perf-verdict[data-pass='false'], .ans-perf td[data-pass='false'] { color: var(--ui-warn); }
.ans-perf-table td:nth-child(n + 3), .ans-perf-table th:nth-child(n + 3) { text-align: right; }
.ans-perf-facts { margin: 0; padding-left: 18px; color: var(--ui-muted); overflow-wrap: anywhere; }
.ans-perf textarea { width: 100%; min-height: 120px; font: 12px monospace; }
`;

type Phase =
  | { readonly kind: 'idle' }
  | { readonly kind: 'running'; readonly progress: PerfProgress | null }
  | { readonly kind: 'done'; readonly report: PerfReport }
  | { readonly kind: 'failed'; readonly reason: string };

type PanelProps = {
  readonly locale: Locale;
  readonly scheme: Appearance['scheme'];
  readonly plan: PerfPlan;
  readonly measure: (onProgress: (progress: PerfProgress) => void) => Promise<PerfReport>;
  readonly copyText: (text: string) => Promise<void>;
};

function PerfPanel(props: PanelProps): ReactElement {
  const { locale, plan } = props;
  const [phase, setPhase] = useState<Phase>({ kind: 'idle' });
  const [copied, setCopied] = useState<'no' | 'yes' | 'manual'>('no');
  const say = (key: Parameters<typeof perfMessage>[1], values = {}): string =>
    perfMessage(locale, key, values);
  const start = async (): Promise<void> => {
    setCopied('no');
    setPhase({ kind: 'running', progress: null });
    try {
      const report = await props.measure((progress) => {
        setPhase({ kind: 'running', progress });
      });
      setPhase({ kind: 'done', report });
    } catch (error) {
      setPhase({ kind: 'failed', reason: error instanceof Error ? error.message : String(error) });
    }
  };
  const copy = async (report: PerfReport): Promise<void> => {
    try {
      await props.copyText(reportMarkdown(report, locale));
      setCopied('yes');
    } catch {
      // No clipboard (an old browser, or no permission): the text is shown to copy by hand.
      setCopied('manual');
    }
  };
  return (
    <div className="ans-app ans-perf" data-scheme={props.scheme}>
      <section className="ans-modal" aria-labelledby="ans-perf-title">
        <header>
          <h2 id="ans-perf-title">{say('perf.title')}</h2>
          <a href="./">{say('perf.back')}</a>
        </header>
        <div className="ans-modal-body">
          <p>
            {say('perf.intro', {
              blocks: plan.blocks,
              commands: perfCommandIds.length,
              rounds: plan.rounds,
            })}
          </p>
          <p>{say('perf.criterion', { limit: responseLimitMs })}</p>
          <p className="ans-note">{say('perf.advice')}</p>
          <p className="ans-note">{say('perf.safe')}</p>
          <div className="ans-dialog-buttons">
            <button
              type="button"
              data-default="true"
              disabled={phase.kind === 'running'}
              onClick={() => void start()}
            >
              {say(phase.kind === 'idle' ? 'perf.start' : 'perf.again')}
            </button>
          </div>
          {phase.kind === 'running' ? (
            <Progress locale={locale} progress={phase.progress} plan={plan} />
          ) : null}
          {phase.kind === 'failed' ? (
            <p role="alert">{say('perf.failed', { reason: phase.reason })}</p>
          ) : null}
          {phase.kind === 'done' ? (
            <Results
              locale={locale}
              report={phase.report}
              copied={copied}
              onCopy={() => void copy(phase.report)}
            />
          ) : null}
        </div>
      </section>
    </div>
  );
}

function Progress(props: {
  readonly locale: Locale;
  readonly progress: PerfProgress | null;
  readonly plan: PerfPlan;
}): ReactElement {
  const { locale, progress } = props;
  const text =
    progress?.command === null || progress === null
      ? perfMessage(locale, 'perf.preparing', { blocks: props.plan.blocks })
      : perfMessage(locale, 'perf.progress', {
          command: perfMessage(locale, `perf.command.${progress.command}`),
          done: progress.done,
          total: progress.total,
        });
  return (
    <>
      <progress max={progress?.total ?? 1} value={progress?.done ?? 0} />
      <p role="status">{text}</p>
    </>
  );
}

function Results(props: {
  readonly locale: Locale;
  readonly report: PerfReport;
  readonly copied: 'no' | 'yes' | 'manual';
  readonly onCopy: () => void;
}): ReactElement {
  const { locale, report } = props;
  const say = (key: Parameters<typeof perfMessage>[1]): string => perfMessage(locale, key);
  const isPass = isReportPass(report);
  const facts: ReadonlyArray<readonly [string, string]> = [
    [say('perf.report.version'), report.version],
    [say('perf.report.date'), formatLocalTime(report.date)],
    [say('perf.report.document'), documentText(report, locale)],
    [say('perf.report.browser'), report.device.userAgent],
    [say('perf.report.device'), deviceText(report.device, locale)],
  ];
  return (
    <>
      <p className="ans-perf-verdict" data-pass={String(isPass)} role="status">
        {verdictText(report, locale)}
      </p>
      <table className="ans-keytable ans-perf-table">
        <thead>
          <tr>
            {columnTitles(locale).map((title) => (
              <th key={title}>{title}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {report.rows.map((row) => (
            <tr key={row.command} data-command={row.command}>
              {rowCells(row, locale).map((cell, index) => (
                <td
                  key={index}
                  {...(index === 5 ? { 'data-pass': String(row.summary.isPass) } : {})}
                >
                  {index === 1 ? <kbd>{cell}</kbd> : cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <ul className="ans-perf-facts">
        {facts.map(([title, value]) => (
          <li key={title}>
            {title}
            {': '}
            {value}
          </li>
        ))}
      </ul>
      <div className="ans-dialog-buttons">
        <button type="button" onClick={props.onCopy}>
          {say('perf.copy')}
        </button>
      </div>
      {props.copied === 'yes' ? <p role="status">{say('perf.copied')}</p> : null}
      {props.copied === 'manual' ? (
        <>
          <p>{say('perf.copyManually')}</p>
          <textarea readOnly value={reportMarkdown(report, locale)} />
        </>
      ) : null}
    </>
  );
}

/** Measures with the plan and makes the report; the measured document is thrown away after. */
async function measureReport(
  handle: EditorHandle,
  host: HTMLElement,
  plan: PerfPlan,
  onProgress: (progress: PerfProgress) => void,
): Promise<PerfReport> {
  const store = perfDocumentStore('perf.ns.svg');
  try {
    const samples = await measureEdits({ handle, host, store }, plan, onProgress);
    const places = perfPlaces(plan.blocks).length;
    return {
      version: editorVersion,
      date: new Date(),
      device: deviceInfo(navigator, window.screen, window.devicePixelRatio),
      blocks: plan.blocks,
      samples: places * plan.rounds,
      warmup: places * plan.warmup,
      rows: perfCommandIds.map((command) => ({
        command,
        summary: summarize(samples.get(command) ?? []),
      })),
    };
  } finally {
    handle.open({ store, text: null });
  }
}

/** Starts the check mode in `root` (`?perf`): the editor with the panel over it. */
export async function startPerfMode(root: HTMLElement): Promise<void> {
  // The editor's unexpected errors, kept like the app's log (06-web 8) but never sent anywhere.
  const logLines: string[] = [];
  const log = (text: string): void => {
    logLines.push(text);
    if (logLines.length > 200) {
      logLines.shift();
    }
  };
  const settings = createSettingsStore(readOnlyStorage(browserLocalStorage()), log);
  const locale = screenLocale(settings.get(localeSettingKey), navigator.language);
  document.documentElement.lang = locale;
  document.title = perfMessage(locale, 'perf.title');
  const appearance = watchAppearance(() => undefined).current;
  const fontLoading = loadBlockFont();
  const canvas = document.createElement('div');
  canvas.className = 'ans-web-canvas';
  const editor = createEditor({
    host: canvas,
    settings,
    appearance,
    doc: { store: perfDocumentStore('perf.ns.svg'), text: null },
    fonts: noSaveFonts,
    locale,
    clipboard: memoryClipboard(),
    log: (text) => {
      log(text);
    },
  });
  const plan = perfPlanFrom(window.location.search);
  const style = document.createElement('style');
  style.textContent = perfCss;
  document.head.append(style);
  createRoot(root).render(
    <StrictMode>
      <EditorApp
        handle={editor}
        canvas={canvas}
        locale={locale}
        appearance={appearance}
        settings={settings}
      />
      <PerfPanel
        locale={locale}
        scheme={appearance.scheme}
        plan={plan}
        measure={(onProgress) => measureReport(editor, canvas, plan, onProgress)}
        copyText={(text) => navigator.clipboard.writeText(text)}
      />
    </StrictMode>,
  );
  await fontLoading;
  document.documentElement.dataset.ready = 'true';
}
