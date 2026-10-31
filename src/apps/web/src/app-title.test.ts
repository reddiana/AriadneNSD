import { describe, expect, it } from 'vitest';

import { appTitle } from './app-title';

describe('web shell', () => {
  it('DR-0005: uses the product name AriadneNSD', () => {
    expect(appTitle).toBe('AriadneNSD');
  });
});
