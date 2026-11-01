import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { editorVersion } from './version';

const packageVersion = (path: string): string =>
  (JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8')) as { version: string }).version;

describe('app version', () => {
  it('is a semantic version', () => {
    expect(editorVersion).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('matches the version of every package', () => {
    for (const path of [
      '../package.json',
      '../../core/package.json',
      '../../fonts/package.json',
      '../../../apps/web/package.json',
    ]) {
      expect(packageVersion(path), path).toBe(editorVersion);
    }
  });
});
