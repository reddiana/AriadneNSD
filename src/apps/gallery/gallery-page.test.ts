// The gallery page's own script (M70, M88: pages/gallery.js) on the built page: which diagram it
// shows, inline or as the <img> fallback, when answers come late or fail, and when the display
// scale changes. Runs the built English page in happy-dom with fetch and the scale under control.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { Window } from 'happy-dom';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';

const here = new URL('./', import.meta.url);
let pageHtml = '';
let pageScript = '';

beforeAll(() => {
  execFileSync(process.execPath, [fileURLToPath(new URL('build.mjs', here))], {
    cwd: fileURLToPath(here),
  });
  const html = readFileSync(new URL('dist/index.html', here), 'utf8');
  const script = /<script>\s*(const galleryText[\s\S]*?)<\/script>/.exec(html)?.[1];
  if (script === undefined) throw new Error('the built page has no gallery script');
  pageScript = script;
  pageHtml = html.replace(/<script>[\s\S]*?<\/script>/g, '');
});

/** A diagram file whose lines the page snaps: one crisp-edged rect of width 1. */
const diagram = (id: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" data-test="${id}"><rect shape-rendering="crispEdges" stroke-width="1" /></svg>`;

type Answer = { resolve: (body: string) => void; reject: () => void };

let window: Window | null = null;

afterEach(async () => {
  await window?.happyDOM.close();
  window = null;
});

/** Opens the built page at `hash` with fetch answered by hand and the given display scale. */
function openPage(hash: string, scale: number) {
  const page = new Window({ url: `https://gallery.test/gallery/${hash}` });
  window = page;
  page.document.write(pageHtml);
  const fetched: string[] = [];
  const answers = new Map<string, Answer[]>();
  const queries: { media: string; onChange: () => void }[] = [];
  let devicePixelRatio = scale;
  Object.defineProperty(page, 'devicePixelRatio', { get: () => devicePixelRatio });
  Object.defineProperty(page, 'matchMedia', {
    value: (media: string) => ({
      addEventListener: (_type: string, onChange: () => void) => {
        queries.push({ media, onChange });
      },
    }),
  });
  const fetch = (file: string) => {
    fetched.push(file);
    return new Promise((resolve, reject) => {
      const list = answers.get(file) ?? [];
      list.push({
        resolve: (body) => {
          resolve({ ok: true, status: 200, text: () => Promise.resolve(body) });
        },
        reject: () => {
          reject(new Error('offline'));
        },
      });
      answers.set(file, list);
    });
  };
  // The built page runs this as a classic script with these browser globals.
  // eslint-disable-next-line @typescript-eslint/no-implied-eval -- runs the page's own script
  const run = new Function(
    'window',
    'document',
    'history',
    'location',
    'DOMParser',
    'fetch',
    pageScript,
  ) as (...globals: unknown[]) => void;
  run(page, page.document, page.history, page.location, page.DOMParser, fetch);

  const document = page.document;
  const link = (id: string) => {
    const found = document.querySelector(`.list a[data-id="${id}"]`);
    if (found === null) throw new Error(`no entry ${id}`);
    return found as unknown as { click: () => void; dataset: Record<string, string> };
  };
  return {
    document,
    fetched,
    queries,
    link,
    file: (id: string) => link(id).dataset.file ?? '',
    /** Answers the latest fetch of `id`'s file. */
    answer: (id: string, outcome: 'ok' | 'fail') => {
      const pending = answers.get(link(id).dataset.file ?? '')?.at(-1);
      if (pending === undefined) throw new Error(`nothing fetched for ${id}`);
      if (outcome === 'ok') pending.resolve(diagram(id));
      else pending.reject();
    },
    setScale: (value: number) => {
      devicePixelRatio = value;
    },
    /** The diagram shown inline (its data-test id), or null. */
    inline: () => document.querySelector('#pic > svg')?.getAttribute('data-test') ?? null,
    img: () => document.getElementById('diagram') as unknown as { hidden: boolean; src: string },
    rectWidth: () =>
      (document.querySelector('#pic > svg rect') as unknown as { style: { strokeWidth: string } })
        .style.strokeWidth,
  };
}

/** Lets fetch answers and their .then callbacks run. */
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('gallery page script', () => {
  it('T-1634: shows the entry of the address hash inline, snapped to the display scale, and reads each file once', async () => {
    const page = openPage('#kmp', 1.5);
    expect(page.fetched).toEqual([page.file('kmp')]);
    page.answer('kmp', 'ok');
    await settle();
    expect(page.inline()).toBe('kmp');
    expect(page.img().hidden).toBe(true);
    expect(page.rectWidth()).toBe(`${String(2 / 1.5)}px`);
    expect(page.document.querySelector('#pic > svg')?.getAttribute('role')).toBe('img');

    page.link('gcd').click();
    page.answer('gcd', 'ok');
    await settle();
    expect(page.inline()).toBe('gcd');
    page.link('kmp').click();
    await settle();
    expect(page.inline()).toBe('kmp');
    expect(page.fetched.filter((file) => file === page.file('kmp'))).toHaveLength(1);
  });

  it('T-1635: a late answer for an entry no longer selected does not replace the selected one', async () => {
    const page = openPage('#kmp', 1);
    page.link('gcd').click();
    page.answer('gcd', 'ok');
    await settle();
    page.answer('kmp', 'ok');
    await settle();
    expect(page.inline()).toBe('gcd');
    expect(page.document.getElementById('name')?.textContent).toBe(
      page.document.querySelector('.list a[data-id="gcd"]')?.textContent,
    );
  });

  it('T-1636: a file that cannot be read shows as the <img>, and is asked for again next time', async () => {
    const page = openPage('#kmp', 1);
    page.answer('kmp', 'fail');
    await settle();
    expect(page.inline()).toBeNull();
    expect(page.img().hidden).toBe(false);
    expect(page.img().src).toContain(page.file('kmp'));

    page.link('gcd').click();
    page.answer('gcd', 'ok');
    await settle();
    expect(page.inline()).toBe('gcd');
    expect(page.img().hidden).toBe(true);

    page.link('kmp').click();
    expect(page.fetched.filter((file) => file === page.file('kmp'))).toHaveLength(2);
    page.answer('kmp', 'ok');
    await settle();
    expect(page.inline()).toBe('kmp');
  });

  it('T-1637: when the display scale changes, snaps the shown diagram again and watches the new scale', async () => {
    const page = openPage('#kmp', 1.5);
    page.answer('kmp', 'ok');
    await settle();
    expect(page.queries.map((query) => query.media)).toEqual(['(resolution: 1.5dppx)']);
    page.setScale(1.25);
    page.queries[0]?.onChange();
    expect(page.rectWidth()).toBe(`${String(1 / 1.25)}px`);
    expect(page.queries.map((query) => query.media)).toEqual([
      '(resolution: 1.5dppx)',
      '(resolution: 1.25dppx)',
    ]);
  });
});
