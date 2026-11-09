// The guide for AI assistants (R-WEB-10, 06-web 3.1) is written as a template: the lists of values
// it names (block kinds, text kinds, themes …) are not typed by hand but filled in from core's lists
// when the site is built, so the guide cannot drift from the format. The build (vite.config.ts)
// fills guide/llms.txt into /llms.txt and the short guide in index.html; the tests fill the same
// templates and open every example in them (doc-examples.test.ts).
//
//   {{textKinds}}      `plain`, `c`, `cpp`, …
//   {{themes|or}}      `default`, `dark`, `high-contrast` or `print`
//   {{blockKinds|plain}}  process, if, case, … (no code marks, for HTML)
import {
  blockKinds,
  headKinds,
  headStyles,
  locales,
  resultSymbols,
  textKinds,
  themeIds,
} from '@ariadne-nsd/core';

/** The lists a guide template may name. */
export const guideValues: Readonly<Record<string, ReadonlyArray<string>>> = {
  blockKinds,
  headKinds,
  headStyles,
  locales,
  resultSymbols,
  textKinds,
  themes: themeIds,
};

/** Fills the `{{name}}` and `{{name|style}}` places of a template. Throws on an unknown one. */
export function fillGuide(template: string): string {
  const filled = template.replace(
    /\{\{(\w+)(?:\|(\w+))?\}\}/g,
    (place, name: string, style: string | undefined) => {
      const values = guideValues[name];
      if (values === undefined) {
        throw new Error(`The guide names an unknown list: ${place}`);
      }
      switch (style) {
        case undefined:
          return values.map((value) => `\`${value}\``).join(', ');
        case 'or':
          return orList(values.map((value) => `\`${value}\``));
        case 'plain':
          return values.join(', ');
        default:
          throw new Error(`The guide asks for an unknown style: ${place}`);
      }
    },
  );
  const left = filled.indexOf('{{');
  if (left >= 0) {
    throw new Error(`The guide has a place it cannot fill: ${filled.slice(left, left + 40)}`);
  }
  return filled;
}

function orList(items: ReadonlyArray<string>): string {
  return items.length < 2
    ? items.join('')
    : `${items.slice(0, -1).join(', ')} or ${items.at(-1) ?? ''}`;
}
