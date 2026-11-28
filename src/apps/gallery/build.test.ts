// The algorithm gallery's build (M70): every language page list every entry of gallery.json, and
// every link and picture on them leads somewhere that exists.
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';

type Lang = 'en' | 'ko' | 'de';
type Entry = {
  id: string;
  category: string;
  name: Record<Lang, string>;
  files: Record<Lang, string>;
  links: Record<Lang, string>;
};

const here = new URL('./', import.meta.url);
const dist = new URL('dist/', here);
const entries = JSON.parse(
  readFileSync(new URL('generated/gallery.json', here), 'utf8'),
) as Entry[];
const pages: { lang: Lang; path: string }[] = [
  { lang: 'en', path: 'index.html' },
  { lang: 'ko', path: 'ko/index.html' },
  { lang: 'de', path: 'de/index.html' },
];
const html = {} as Record<Lang, string>;

const decode = (value: string) =>
  value
    .replaceAll('&quot;', '"')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&amp;', '&');
const attributes = (page: string, name: string) =>
  [...page.matchAll(new RegExp(String.raw`\s${name}="([^"]*)"`, 'g'))].map((m) =>
    decode(m[1] ?? ''),
  );

beforeAll(() => {
  execFileSync(process.execPath, [fileURLToPath(new URL('build.mjs', here))], {
    cwd: fileURLToPath(here),
  });
  for (const { lang, path } of pages) html[lang] = readFileSync(new URL(path, dist), 'utf8');
});

describe('gallery build', () => {
  it('T-1488: lists every gallery.json entry, under its name, on both language pages', () => {
    for (const { lang } of pages) {
      for (const entry of entries) {
        const anchor = new RegExp(
          String.raw`<a href="#${entry.id}" data-id="${entry.id}"[^>]*>([^<]*)</a>`,
        );
        expect(decode(anchor.exec(html[lang])?.[1] ?? ''), `${lang} ${entry.id}`).toBe(
          entry.name[lang],
        );
        expect(html[lang]).toContain(`data-link="${entry.links[lang]}"`);
        expect(entry.links[lang]).toMatch(/^https:\/\/ariadnensd\.com\/#ns1\./);
      }
    }
  });

  it('T-1489: every relative link and picture on the pages points to a built file', () => {
    for (const { lang, path } of pages) {
      const base = new URL(path, dist);
      const targets = [
        ...attributes(html[lang], 'src'),
        ...attributes(html[lang], 'href'),
        ...attributes(html[lang], 'data-file'),
      ].filter((target) => !/^(https?:|#)/.test(target));
      expect(targets.length).toBeGreaterThan(entries.length);
      for (const target of targets) {
        const url = new URL(target, base);
        // Links out of the gallery (the app, the user guide) are other parts of the site.
        if (!url.href.startsWith(dist.href)) continue;
        const file = url.pathname.endsWith('/') ? new URL('index.html', url) : url;
        expect(existsSync(file), `${lang}: ${target}`).toBe(true);
      }
      for (const entry of entries) {
        expect(html[lang]).toContain(
          `data-file="${lang === 'en' ? '' : '../'}files/${entry.files[lang]}"`,
        );
      }
    }
  });

  it('T-1490: the pages link to each other, to the app and to the user guide of their language', () => {
    expect(html.en).toMatch(/<a class="lang" href="ko\/" hreflang="ko"/);
    expect(html.ko).toMatch(/<a class="lang" href="..\/" hreflang="en"/);
    expect(attributes(html.en, 'href')).toEqual(expect.arrayContaining(['../', '../manual/']));
    expect(attributes(html.ko, 'href')).toEqual(
      expect.arrayContaining(['../../', '../../manual/ko/']),
    );
    expect(html.en).toContain(
      '<meta property="og:image" content="https://ariadnensd.com/gallery/og-image.png" />',
    );
  });

  it('T-1563 · R-NFR-04: the German page links to the other two, to the German user guide, and they link to it', () => {
    expect(html.de).toMatch(/<a class="lang" href="..\/" hreflang="en"/);
    expect(html.de).toMatch(/<a class="lang" href="..\/ko\/" hreflang="ko"/);
    expect(html.en).toMatch(/<a class="lang" href="de\/" hreflang="de"/);
    expect(html.ko).toMatch(/<a class="lang" href="..\/de\/" hreflang="de"/);
    expect(attributes(html.de, 'href')).toEqual(
      expect.arrayContaining(['../../', '../../manual/de/']),
    );
    expect(html.de).toContain('<html lang="de">');
    expect(html.de).toContain('<meta property="og:locale" content="de_DE" />');
  });
});
