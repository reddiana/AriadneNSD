import type { Locale } from '@ariadne-nsd/core';

// The examples' pictures made ahead of time (scripts/example-thumbnails.ts). Vite copies each
// into the build and gives its URL; the modal shows them as images.
const urls = import.meta.glob<string>('./thumbnails/*.svg', {
  query: '?url',
  import: 'default',
  eager: true,
});

/** The URL of an example's picture in a screen language, or `undefined` if there is none. */
export function thumbnailUrl(id: string, locale: Locale): string | undefined {
  return urls[`./thumbnails/${id}.${locale}.svg`];
}
