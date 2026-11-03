// File fallback (06-web 1): opening with a file input and saving as a download, in Firefox and Safari.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { chooseFileWithInput, download } from './file-fallback';

/** An element of the fake page: keeps its attributes, listeners, clicks and whether it is in the page. */
type FakeElement = {
  tag: string;
  style: { display?: string };
  clicks: number;
  isInPage: boolean;
  listeners: Map<string, () => void>;
  [attribute: string]: unknown;
};

let elements: FakeElement[] = [];
let urls: { created: Blob[]; revoked: string[] };

beforeEach(() => {
  elements = [];
  urls = { created: [], revoked: [] };
  const element = (tag: string): FakeElement => {
    const made: FakeElement = {
      tag,
      style: {},
      clicks: 0,
      isInPage: false,
      listeners: new Map(),
      addEventListener(type: string, listener: () => void) {
        made.listeners.set(type, listener);
      },
      click() {
        made.clicks += 1;
      },
      remove() {
        made.isInPage = false;
      },
    };
    elements.push(made);
    return made;
  };
  vi.stubGlobal('document', {
    createElement: element,
    body: {
      append: (child: FakeElement) => {
        child.isInPage = true;
      },
    },
  });
  vi.stubGlobal('URL', {
    createObjectURL: (blob: Blob) => {
      urls.created.push(blob);
      return `blob:${String(urls.created.length)}`;
    },
    revokeObjectURL: (url: string) => urls.revoked.push(url),
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('download', () => {
  it('T-0750: 06-web 1: saves the text as a download with the name and media type', async () => {
    vi.useFakeTimers();
    download('a.ns.svg', '<svg/>', 'image/svg+xml');
    const [link] = elements;
    expect(link).toMatchObject({
      tag: 'a',
      href: 'blob:1',
      download: 'a.ns.svg',
      clicks: 1,
      isInPage: false,
    });
    expect(urls.created[0]?.type).toBe('image/svg+xml');
    expect(await urls.created[0]?.text()).toBe('<svg/>');
    // The address stays valid for a minute, for browsers that start the download late.
    vi.advanceTimersByTime(59_999);
    expect(urls.revoked).toEqual([]);
    vi.advanceTimersByTime(1);
    expect(urls.revoked).toEqual(['blob:1']);
  });

  it('T-0751 · R-EXP-01: downloads a blob as it is', () => {
    const png = new Blob(['png'], { type: 'image/png' });
    download('a.png', png, 'image/png');
    expect(urls.created).toEqual([png]);
  });
});

describe('file input', () => {
  it('T-0752 · R-WEB-02: offers .ns.svg and .ns files and gives the chosen one', async () => {
    const chosen = new File(['x'], 'a.ns.svg');
    const choosing = chooseFileWithInput();
    const [input] = elements;
    expect(input).toMatchObject({
      tag: 'input',
      type: 'file',
      accept: '.ns.svg,.ns,image/svg+xml',
      clicks: 1,
      isInPage: true,
    });
    if (input === undefined) {
      throw new Error('no input');
    }
    input.files = [chosen];
    input.listeners.get('change')?.();
    expect(await choosing).toBe(chosen);
    expect(input.isInPage).toBe(false);
  });

  it('T-0753: gives null when the chooser is closed', async () => {
    const choosing = chooseFileWithInput();
    const [input] = elements;
    input?.listeners.get('cancel')?.();
    expect(await choosing).toBeNull();
    expect(input?.isInPage).toBe(false);
  });

  it('T-0754: gives null when a change comes without a file', async () => {
    const choosing = chooseFileWithInput();
    elements[0]?.listeners.get('change')?.();
    expect(await choosing).toBeNull();
  });
});
