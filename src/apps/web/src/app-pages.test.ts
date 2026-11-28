// The Help menu's user guide and gallery open in the screen language (06-web 5, DR-0020).
import { describe, expect, it } from 'vitest';

import { galleryUrl, manualUrl } from './app';

describe('pages in the screen language', () => {
  it('T-1564 · R-NFR-04: the user guide and the gallery open in English, Korean or German', () => {
    expect([manualUrl('en'), manualUrl('ko'), manualUrl('de')]).toEqual([
      'manual/',
      'manual/ko/',
      'manual/de/',
    ]);
    expect([galleryUrl('en'), galleryUrl('ko'), galleryUrl('de')]).toEqual([
      'gallery/',
      'gallery/ko/',
      'gallery/de/',
    ]);
  });
});
