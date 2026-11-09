import { readFileSync } from 'node:fs';

import { locales } from '@ariadne-nsd/core';
import { describe, expect, it } from 'vitest';

import { uiMessage } from './ui/messages';
import { editorVersion } from './version';

const packageVersion = (path: string): string =>
  (JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8')) as { version: string }).version;

describe('app version', () => {
  it('T-0331: is a semantic version', () => {
    expect(editorVersion).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('T-0332: matches the version of every package', () => {
    for (const path of [
      '../package.json',
      '../../core/package.json',
      '../../fonts/package.json',
      '../../../apps/web/package.json',
      '../../../apps/manual/package.json',
    ]) {
      expect(packageVersion(path), path).toBe(editorVersion);
    }
  });

  it('T-1161: names this version first in “What’s New in This Version”, in every language', () => {
    // A new version must come with its own notes: the old text no longer names the version.
    for (const locale of locales) {
      expect(uiMessage(locale, 'whatsNew.body').startsWith(editorVersion), locale).toBe(true);
    }
  });
});
