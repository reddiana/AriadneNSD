// The numbers and the report of the check mode (`?perf`, 06-web 9): the summary of each
// command's times and the Markdown the maintainer pastes back (AT-05, QA-07). Pure functions.

import type { Locale } from '@ariadne-nsd/core';

import type { PerfMessageKey } from './perf-messages';
import { perfMessage } from './perf-messages';

/** QA-07: an edit shows within 100 ms at p95. */
export const responseLimitMs = 100;

/** The commands the check mode measures, in the order it runs them. */
export const perfCommandIds = [
  'insert',
  'delete',
  'undo',
  'redo',
  'wrap',
  'move',
  'paste',
  'text',
] as const;

/** One of the measured commands. */
export type PerfCommandId = (typeof perfCommandIds)[number];

/** The keys of each measured command, as the key table writes them (03-keymap). */
export const perfCommandKeys: Readonly<Record<PerfCommandId, string>> = {
  insert: 'o',
  delete: 'x',
  undo: 'u',
  redo: 'U',
  wrap: 's i',
  move: 'Alt+j',
  paste: 'p',
  text: 'Enter',
};

/** The times of one command, summarized. */
export type Summary = {
  readonly count: number;
  readonly median: number;
  readonly p95: number;
  readonly max: number;
  /** QA-07: p95 at most the limit. */
  readonly isPass: boolean;
};

/**
 * The `fraction` percentile of sorted numbers by the nearest rank: the smallest value with at
 * least that share of the values at or below it.
 */
export function percentile(sorted: ReadonlyArray<number>, fraction: number): number {
  const rank = Math.max(1, Math.ceil(fraction * sorted.length));
  return valueAt(sorted, Math.min(rank, sorted.length) - 1);
}

function valueAt(values: ReadonlyArray<number>, index: number): number {
  const value = values[index];
  if (value === undefined) {
    throw new Error(`no value at ${String(index)} of ${String(values.length)}`);
  }
  return value;
}

/** Summarizes the times (ms) of one command. The median of an even count is the mean of two. */
export function summarize(samples: ReadonlyArray<number>, limit = responseLimitMs): Summary {
  if (samples.length === 0) {
    throw new Error('summary of no samples');
  }
  const sorted = [...samples].sort((a, b) => a - b);
  const half = Math.floor(sorted.length / 2);
  const median =
    sorted.length % 2 === 1
      ? valueAt(sorted, half)
      : (valueAt(sorted, half - 1) + valueAt(sorted, half)) / 2;
  const p95 = percentile(sorted, 0.95);
  return {
    count: sorted.length,
    median,
    p95,
    max: percentile(sorted, 1),
    isPass: p95 <= limit,
  };
}

/** What the report says about the device: from `navigator` and `screen`. */
export type DeviceInfo = {
  readonly userAgent: string;
  /** `navigator.hardwareConcurrency`. */
  readonly cores: number | null;
  /** `navigator.deviceMemory` (Chromium only, rounded by the browser), GB. */
  readonly memoryGb: number | null;
  readonly screenWidth: number;
  readonly screenHeight: number;
  readonly pixelRatio: number;
};

/** Reads the device information the browser gives. */
export function deviceInfo(
  browser: Pick<Navigator, 'userAgent' | 'hardwareConcurrency'> & {
    readonly deviceMemory?: number;
  },
  display: { readonly width: number; readonly height: number },
  pixelRatio: number,
): DeviceInfo {
  const cores = browser.hardwareConcurrency;
  return {
    userAgent: browser.userAgent,
    cores: Number.isFinite(cores) && cores > 0 ? cores : null,
    memoryGb: browser.deviceMemory ?? null,
    screenWidth: display.width,
    screenHeight: display.height,
    pixelRatio,
  };
}

/** One measured command in the report. */
export type PerfRow = { readonly command: PerfCommandId; readonly summary: Summary };

/** Everything the result table and the copied Markdown show. */
export type PerfReport = {
  readonly version: string;
  /** When the measuring ended. */
  readonly date: Date;
  readonly device: DeviceInfo;
  readonly blocks: number;
  /** Measured runs per command, and the warm-up runs left out. */
  readonly samples: number;
  readonly warmup: number;
  readonly rows: ReadonlyArray<PerfRow>;
};

/** Whether every command passes. */
export function isReportPass(report: PerfReport): boolean {
  return report.rows.every((row) => row.summary.isPass);
}

/** A time in ms with one decimal. */
export function formatMs(value: number): string {
  return value.toFixed(1);
}

/** The local date and time, `2026-11-10 14:03`. */
export function formatLocalTime(date: Date): string {
  const pad = (value: number): string => String(value).padStart(2, '0');
  return `${String(date.getFullYear())}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** The verdict line at the top of the results. */
export function verdictText(report: PerfReport, locale: Locale): string {
  const failed = report.rows.filter((row) => !row.summary.isPass).length;
  return failed === 0
    ? perfMessage(locale, 'perf.verdict.pass', { limit: responseLimitMs })
    : perfMessage(locale, 'perf.verdict.fail', {
        count: failed,
        total: report.rows.length,
        limit: responseLimitMs,
      });
}

/** The "Device" line: cores, memory and screen. */
export function deviceText(device: DeviceInfo, locale: Locale): string {
  const unknown = perfMessage(locale, 'perf.report.unknown');
  return perfMessage(locale, 'perf.report.deviceValue', {
    cores: device.cores ?? unknown,
    memory: device.memoryGb === null ? unknown : `${String(device.memoryGb)} GB`,
    screen: `${String(device.screenWidth)} × ${String(device.screenHeight)} @${String(device.pixelRatio)}x`,
  });
}

/** The "Document" line: blocks and runs. */
export function documentText(report: PerfReport, locale: Locale): string {
  return perfMessage(locale, 'perf.report.documentValue', {
    blocks: report.blocks,
    samples: report.samples,
    warmup: report.warmup,
  });
}

/** The name of a measured command in the screen language. */
export function commandTitle(command: PerfCommandId, locale: Locale): string {
  return perfMessage(locale, `perf.command.${command}` satisfies PerfMessageKey);
}

/** The cells of one row of the result table: command, keys, median, p95, max, verdict. */
export function rowCells(row: PerfRow, locale: Locale): ReadonlyArray<string> {
  const { summary } = row;
  return [
    commandTitle(row.command, locale),
    perfCommandKeys[row.command],
    formatMs(summary.median),
    formatMs(summary.p95),
    formatMs(summary.max),
    perfMessage(locale, summary.isPass ? 'perf.pass' : 'perf.fail'),
  ];
}

/** The column titles of the result table. */
export function columnTitles(locale: Locale): ReadonlyArray<string> {
  return (['command', 'keys', 'median', 'p95', 'max', 'verdict'] as const).map((column) =>
    perfMessage(locale, `perf.column.${column}`),
  );
}

/** The results as Markdown: a title, the facts as a list, and the table ("Copy Results"). */
export function reportMarkdown(report: PerfReport, locale: Locale): string {
  const say = (key: PerfMessageKey): string => perfMessage(locale, key);
  const line = (cells: ReadonlyArray<string>): string =>
    `| ${cells.map((cell) => cell.replaceAll('|', '\\|')).join(' | ')} |`;
  const titles = columnTitles(locale);
  return [
    `## ${say('perf.title')}`,
    '',
    `- ${say('perf.report.verdict')}: ${verdictText(report, locale)}`,
    `- ${say('perf.report.version')}: ${report.version}`,
    `- ${say('perf.report.date')}: ${formatLocalTime(report.date)}`,
    `- ${say('perf.report.document')}: ${documentText(report, locale)}`,
    `- ${say('perf.report.browser')}: ${report.device.userAgent}`,
    `- ${say('perf.report.device')}: ${deviceText(report.device, locale)}`,
    '',
    line(titles),
    line(titles.map(() => '---')),
    ...report.rows.map((row) =>
      line(rowCells(row, locale).map((cell, index) => (index === 1 ? `\`${cell}\`` : cell))),
    ),
    '',
  ].join('\n');
}
