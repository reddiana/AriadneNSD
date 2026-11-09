// The numbers, the copied report and the plan of the check mode (`?perf`, AT-05).
import { catalogProblems } from '@ariadne-nsd/core';
import { describe, expect, it } from 'vitest';

import { isPerfMode } from './is-perf-mode';
import { largeDocumentFile } from './large-document';
import { perfCatalogEntries } from './perf-messages';
import type { PerfReport } from './perf-report';
import {
  deviceInfo,
  formatLocalTime,
  isReportPass,
  percentile,
  perfCommandIds,
  reportMarkdown,
  summarize,
} from './perf-report';
import { defaultPerfPlan, perfPlaces, perfPlanFrom } from './perf-run';

const device = deviceInfo(
  { userAgent: 'Test|Browser/1.0', hardwareConcurrency: 4, deviceMemory: 8 },
  { width: 1366, height: 768 },
  1.5,
);

function report(p95s: ReadonlyArray<number>): PerfReport {
  return {
    version: '0.2.0',
    date: new Date(2026, 10, 10, 9, 5),
    device,
    blocks: 500,
    samples: 30,
    warmup: 6,
    rows: perfCommandIds.map((command, index) => ({
      command,
      summary: summarize([1, 2, p95s[index] ?? 3]),
    })),
  };
}

describe('the check mode numbers (AT-05)', () => {
  it('T-1152 · QA-07: the percentile is the nearest rank', () => {
    const sorted = Array.from({ length: 20 }, (_, index) => index + 1);
    expect(percentile(sorted, 0.95)).toBe(19);
    expect(percentile(sorted, 0.5)).toBe(10);
    expect(percentile(sorted, 1)).toBe(20);
    expect(percentile([7], 0.95)).toBe(7);
    expect(() => percentile([], 0.5)).toThrow();
  });

  it('T-1153 · QA-07: a summary has the median, p95 and max, and passes at p95 ≤ 100 ms', () => {
    const times = [...Array.from({ length: 28 }, () => 30), 99.9, 250];
    expect(summarize(times)).toEqual({ count: 30, median: 30, p95: 99.9, max: 250, isPass: true });
    expect(summarize([10, 20, 30, 40]).median).toBe(25);
    expect(summarize([5, 1, 3]).median).toBe(3);
    expect(summarize([100]).isPass).toBe(true);
    expect(summarize([100.1]).isPass).toBe(false);
    expect(() => summarize([])).toThrow();
  });

  it('T-1154: the device information leaves out what the browser does not tell', () => {
    expect(device).toEqual({
      userAgent: 'Test|Browser/1.0',
      cores: 4,
      memoryGb: 8,
      screenWidth: 1366,
      screenHeight: 768,
      pixelRatio: 1.5,
    });
    const firefox = deviceInfo(
      { userAgent: 'Firefox', hardwareConcurrency: 0 },
      { width: 390, height: 844 },
      3,
    );
    expect(firefox.cores).toBeNull();
    expect(firefox.memoryGb).toBeNull();
  });

  it('T-1155 · AT-05: the copied results are a Markdown list and table', () => {
    const passed = report([]);
    expect(isReportPass(passed)).toBe(true);
    expect(formatLocalTime(passed.date)).toBe('2026-11-10 09:05');
    expect(reportMarkdown(passed, 'en')).toBe(
      [
        '## Check mode: edit response time (AT-05)',
        '',
        '- Verdict: Pass. Every command’s p95 is 100 ms or less.',
        '- App version: 0.2.0',
        '- Date: 2026-11-10 09:05',
        '- Document: 500 blocks; 30 times per command (6 warm-up runs left out)',
        '- Browser: Test|Browser/1.0',
        '- Device: CPU cores: 4 · memory: 8 GB · screen: 1366 × 768 @1.5x',
        '',
        '| Command | Keys | Median (ms) | p95 (ms) | Max (ms) | Verdict |',
        '| --- | --- | --- | --- | --- | --- |',
        '| Insert a process block | `o` | 2.0 | 3.0 | 3.0 | Pass |',
        '| Delete a block | `x` | 2.0 | 3.0 | 3.0 | Pass |',
        '| Undo | `u` | 2.0 | 3.0 | 3.0 | Pass |',
        '| Redo | `U` | 2.0 | 3.0 | 3.0 | Pass |',
        '| Wrap in If | `s i` | 2.0 | 3.0 | 3.0 | Pass |',
        '| Move down | `Alt+j` | 2.0 | 3.0 | 3.0 | Pass |',
        '| Paste a block | `p` | 2.0 | 3.0 | 3.0 | Pass |',
        '| Accept an edited text | `Enter` | 2.0 | 3.0 | 3.0 | Pass |',
        '',
      ].join('\n'),
    );
  });

  it('T-1156 · AT-05: one slow command fails the whole check, in both screen languages', () => {
    const failed = report([3, 3, 3, 3, 120.25]);
    expect(isReportPass(failed)).toBe(false);
    const english = reportMarkdown(failed, 'en');
    expect(english).toContain('- Verdict: Fail. 1 of 8 commands have a p95 over 100 ms.');
    expect(english).toContain('| Wrap in If | `s i` | 2.0 | 120.3 | 120.3 | Fail |');
    const korean = reportMarkdown(failed, 'ko');
    expect(korean).toContain('- 판정: 불합격. 명령 8가지 중 1가지의 p95가 100ms를 넘습니다.');
    expect(korean).toContain('| 조건 블록으로 감싸기 | `s i` | 2.0 | 120.3 | 120.3 | 불합격 |');
    expect(korean).toContain('- 기기: CPU 코어: 4 · 메모리: 8 GB · 화면: 1366 × 768 @1.5x');
  });

  it('T-1157 · QA-13 · R-NFR-04: the check mode catalog has every key in every language, same placeholders', () => {
    expect(catalogProblems(perfCatalogEntries())).toEqual([]);
  });
});

describe('the check mode plan (AT-05)', () => {
  it('T-1158: ?perf opens the check mode, with or without other parameters', () => {
    expect(isPerfMode('?perf')).toBe(true);
    expect(isPerfMode('?perf=1&rounds=3')).toBe(true);
    expect(isPerfMode('?x=1&perf')).toBe(true);
    expect(isPerfMode('')).toBe(false);
    expect(isPerfMode('?performance')).toBe(false);
  });

  it('T-1159 · QA-07: 500 blocks and 30 timed runs per command; rounds= and blocks= are for the tests', () => {
    expect(perfPlanFrom('?perf')).toEqual(defaultPerfPlan);
    expect(defaultPerfPlan.blocks).toBe(500);
    expect(perfPlaces(500)).toEqual([2, 250, 499]);
    expect(perfPlaces(defaultPerfPlan.blocks).length * defaultPerfPlan.rounds).toBe(30);
    expect(perfPlanFrom('?perf&rounds=3')).toEqual({ ...defaultPerfPlan, rounds: 3 });
    expect(perfPlanFrom('?perf&blocks=12')).toEqual({ ...defaultPerfPlan, blocks: 12 });
    for (const bad of ['0', '101', '2.5', 'many']) {
      expect(perfPlanFrom(`?perf&rounds=${bad}`)).toEqual(defaultPerfPlan);
    }
    for (const bad of ['3', '2001', 'all']) {
      expect(perfPlanFrom(`?perf&blocks=${bad}`)).toEqual(defaultPerfPlan);
    }
  });

  it('T-1160 · QA-07: the large document has the asked number of process blocks', () => {
    const text = largeDocumentFile(3);
    const json = /<!\[CDATA\[(.*)\]\]>/.exec(text)?.[1] ?? '';
    const model = JSON.parse(json) as { diagrams: [{ body: ReadonlyArray<unknown> }] };
    expect(model.diagrams[0].body).toEqual([
      { id: 'b1', kind: 'process', text: 'step 1' },
      { id: 'b2', kind: 'process', text: 'step 2' },
      { id: 'b3', kind: 'process', text: 'step 3' },
    ]);
  });
});
