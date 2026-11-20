// Recognizing an AriadneNSD document in pasted text (R-WEB-11, UX JP1): the model JSON, the
// envelope of a share link, or a share link of this site. Another AI writes the model JSON almost
// always right; the link it makes by hand, or the chat app that shows it, is what breaks. So a
// user who pastes the JSON from the AI's code block still gets the diagram.
//
// The test is narrow on purpose: the whole text must be one of these, recognized by the format
// name `"format": "ariadne-nsd"` or by this site's address, so text a person wrote never matches
// by chance. Everything else pastes as before (a process block per line).

import { bracketHint } from './share-link';

/** The address of the site (06-web 5). Links another AI makes start with it (`/llms.txt`). */
export const siteAddress = 'https://ariadnensd.com/';

/** The format name in the model JSON (01-file-format 3). */
const formatName = 'ariadne-nsd';

/** What the share link part of a link starts with (`#ns1.`, ADR-0043). */
const linkMark = '#ns1.';

/** The search pages a chat app wrapped a link in (Gemini, 2026-11-10): `?q=<the link>`. */
const searchPages = ['https://www.google.com/search?', 'https://google.com/search?'];

/** A pasted document: still to be checked by the file format's parser, like a share link. */
export type PastedDocument =
  /** The model JSON alone (no name: the document is untitled). */
  | { readonly kind: 'model'; readonly model: unknown }
  /** The envelope inside a share link: `{"name": …, "model": {…}}`. */
  | { readonly kind: 'envelope'; readonly name: string; readonly model: unknown }
  /** A share link of this site: its fragment, without `#`. */
  | { readonly kind: 'link'; readonly fragment: string };

/** Why a text is not a pasted document, in English for the problem report and the AI (UX LG6). */
export type ReadPasted =
  | { readonly ok: true; readonly pasted: PastedDocument }
  | { readonly ok: false; readonly detail: string };

/** This page's address (`window.location`), whose own share links are recognized too. */
export type PageAddress = { readonly origin: string; readonly pathname: string };

/**
 * The document in a pasted text, or `null` when the text is something else (UX JP1). Spaces and
 * a code fence (```json … ```) around it are taken off first.
 */
export function recognizePastedDocument(text: string, page?: PageAddress): PastedDocument | null {
  const read = readPastedDocument(text, page);
  return read.ok ? read.pasted : null;
}

/**
 * Like `recognizePastedDocument`, with the reason when the text is not a document: File › Open
 * from Pasted JSON… tells it to the user (UX JP3), who can give it to the AI that wrote the text.
 */
export function readPastedDocument(text: string, page?: PageAddress): ReadPasted {
  const body = unfenced(text.trim());
  if (body.startsWith('{')) {
    return readJson(body);
  }
  const fragment = linkFragment(body, page);
  if (fragment !== null) {
    return { ok: true, pasted: { kind: 'link', fragment } };
  }
  return { ok: false, detail: 'the text is neither the model JSON nor a share link' };
}

/** The inside of a code fence around the whole text, or the text as it is. */
function unfenced(text: string): string {
  const fenced = /^```[^\n`]*\n([\s\S]*?)\n?```$/.exec(text);
  return fenced?.[1] === undefined ? text : fenced[1].trim();
}

function readJson(text: string): ReadPasted {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch (error) {
    return { ok: false, detail: `the JSON does not read: ${String(error)}${bracketHint(text)}` };
  }
  if (isModel(value)) {
    return { ok: true, pasted: { kind: 'model', model: value } };
  }
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    const keys = Object.keys(value).sort().join(',');
    if (
      keys === 'model,name' &&
      'name' in value &&
      'model' in value &&
      typeof value.name === 'string' &&
      isModel(value.model)
    ) {
      return { ok: true, pasted: { kind: 'envelope', name: value.name, model: value.model } };
    }
  }
  return { ok: false, detail: `the JSON has no "format": "${formatName}"` };
}

/** Whether a value is a JSON object that says it is an AriadneNSD model. */
function isModel(value: unknown): boolean {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    'format' in value &&
    value.format === formatName
  );
}

/**
 * The fragment of a share link of this site (or of this page) that is the whole text, or `null`.
 * A link a chat app wrapped in a search page is taken out of it and checked again.
 */
function linkFragment(text: string, page: PageAddress | undefined): string | null {
  if (/\s/.test(text)) {
    return null;
  }
  const pages = [siteAddress, ...(page === undefined ? [] : [`${page.origin}${page.pathname}`])];
  for (const address of pages) {
    if (text.startsWith(`${address}${linkMark}`)) {
      return text.slice(address.length + 1);
    }
  }
  const search = searchPages.find((prefix) => text.startsWith(prefix));
  if (search === undefined) {
    return null;
  }
  const query = new URLSearchParams(text.slice(search.length)).get('q');
  return query === null ? null : linkFragment(query.trim(), page);
}
