// The "Copy Share Link" command (R-WEB-05, 06-web 3): puts the whole document in a link and
// copies it. Long links are copied with a warning, links too long for browsers are not made, and
// where the clipboard refuses, the link is shown in the editor's modal to copy by hand (UX SH2).

import type { EditorHandle } from '../editor-contract';
import type { ShellMessageKey } from '../shell/messages';
import type { Deflate } from './share-link';
import {
  longShareLinkLength,
  maxShareLinkLength,
  shareLinkUrl,
  writeShareLink,
} from './share-link';

/** Copies a text that is still being made. Rejects when the clipboard refuses. */
export type CopyText = (text: Promise<string>) => Promise<void>;

/** What the command needs from the page. */
export type ShareHost = {
  /** This page's address: the link opens the same app. */
  readonly page: { readonly origin: string; readonly pathname: string };
  readonly deflate: Deflate | null;
  readonly copyText: CopyText;
  readonly notify: (text: string, level: 'info' | 'warn') => void;
  readonly text: (key: ShellMessageKey, values?: Readonly<Record<string, string>>) => string;
  readonly log: (detail: string) => void;
};

type Made =
  | { readonly kind: 'ok'; readonly url: string }
  | { readonly kind: 'tooLong'; readonly length: number }
  | { readonly kind: 'failed' };

/**
 * The browser's clipboard. Where `ClipboardItem` is, the text goes in as a promise, so the copy
 * starts within the click (Safari allows a copy only then) while the link is still compressing.
 */
export function browserCopyText(clipboard: Clipboard | undefined): CopyText {
  return async (text) => {
    if (clipboard === undefined) {
      throw new Error('No clipboard');
    }
    if (typeof ClipboardItem === 'undefined') {
      await clipboard.writeText(await text);
      return;
    }
    const blob = (async () => new Blob([await text], { type: 'text/plain' }))();
    await clipboard.write([new ClipboardItem({ 'text/plain': blob })]);
  };
}

/** Makes the share link of the open document and copies it, then tells the user. */
export async function copyShareLink(
  editor: EditorHandle,
  documentName: string,
  host: ShareHost,
): Promise<void> {
  const made = makeLink(editor, documentName, host);
  // Started before any await: the clipboard is asked within the click.
  const copied = succeeds(host.copyText(urlOf(made)));
  const result = await made;
  const isCopied = await copied;
  switch (result.kind) {
    case 'failed':
      host.notify(host.text('notice.shareFailed'), 'warn');
      return;
    case 'tooLong':
      host.notify(host.text('notice.shareTooLong', { size: kilobytes(result.length) }), 'warn');
      return;
    case 'ok':
      break;
  }
  if (!isCopied) {
    // The clipboard refused (no permission, the page lost focus): the user copies it.
    await editor.prompt(host.text('share.copyManually'), result.url);
    return;
  }
  if (result.url.length > longShareLinkLength) {
    host.notify(host.text('notice.shareLong', { size: kilobytes(result.url.length) }), 'warn');
    return;
  }
  host.notify(host.text('notice.shareCopied'), 'info');
}

async function makeLink(
  editor: EditorHandle,
  documentName: string,
  host: ShareHost,
): Promise<Made> {
  try {
    const fragment = await writeShareLink(editor.snapshot(), documentName, host.deflate);
    const url = shareLinkUrl(host.page, fragment);
    return url.length > maxShareLinkLength
      ? { kind: 'tooLong', length: url.length }
      : { kind: 'ok', url };
  } catch (error) {
    host.log(`Making the share link failed: ${String(error)}`);
    return { kind: 'failed' };
  }
}

/** The link to copy; rejects (nothing is copied) when there is none. */
async function urlOf(made: Promise<Made>): Promise<string> {
  const result = await made;
  if (result.kind !== 'ok') {
    throw new Error(`No share link: ${result.kind}`);
  }
  return result.url;
}

async function succeeds(promise: Promise<void>): Promise<boolean> {
  try {
    await promise;
    return true;
  } catch {
    // The reason is the clipboard's (or "no link", told separately): the caller says what to do.
    return false;
  }
}

/** A length in KB for the notices: `12.3`. */
function kilobytes(length: number): string {
  return (length / 1024).toFixed(1);
}
