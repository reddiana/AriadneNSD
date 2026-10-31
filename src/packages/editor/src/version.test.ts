import { describe, expect, it } from 'vitest';

import { editorVersion } from './version';

describe('editor package', () => {
  it('exposes a semantic version', () => {
    expect(editorVersion).toMatch(/^\d+\.\d+\.\d+$/);
  });
});
