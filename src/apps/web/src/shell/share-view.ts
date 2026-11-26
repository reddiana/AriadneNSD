// Share links and view mode (06-web 3, R-WEB-05, R-WEB-06): opening a document from the URL's
// `#…` read only, explaining a link that does not open (UX LG6), and "Edit" (UX SH4). Web only:
// a share link opens in the browser.

import type { Doc } from '@ariadne-nsd/core';
import { parseModel } from '@ariadne-nsd/core';

import { documentFileName } from '../files/file-name';
import type { ShareLinkFailure } from '../files/share-link';
import { readShareLink } from '../files/share-link';
import type { ShellMessageKey } from './messages';
import type { Opening } from './opening';
import type { Leave, NewStore, ShellContext } from './shell-context';
import { appName } from './shell-context';

/** A document read from a share link or a pasted text, with its file name. */
export type SharedDocument = { doc: Doc; name: string };

export type ShareViewDeps = Pick<Opening, 'switchTo' | 'mayLeave'> & {
  readonly newStore: NewStore;
};

export type ShareView = {
  readonly setViewing: (next: boolean) => void;
  /** Hears when view mode starts or ends. Returns the unsubscribe. */
  readonly onViewMode: (listener: (isViewing: boolean) => void) => () => void;
  /** Tells every listener whether view mode is on, changed or not. */
  readonly tellViewMode: () => void;
  /** The document in a share link, checked like a file; or `null` after saying why not. */
  readonly readShared: (fragment: string) => Promise<SharedDocument | null>;
  readonly explainLinkFailure: (
    message: ShellMessageKey,
    reason: string,
    detail: string,
    subject?: 'link' | 'paste',
  ) => Promise<void>;
  /** Opens a share link's document as a new document that was never saved, in view mode. */
  readonly openShared: (shared: SharedDocument, leave: Leave) => Promise<void>;
  readonly openShareLink: (fragment: string) => Promise<void>;
  /** "Edit" in view mode: the same document, now editable (UX SH4). */
  readonly startEditing: () => void;
};

export function createShareView(ctx: ShellContext, deps: ShareViewDeps): ShareView {
  const { options, state, text, notices } = ctx;
  const viewListeners = new Set<(isViewing: boolean) => void>();

  function setViewing(next: boolean): void {
    if (next === state.isViewing) {
      return;
    }
    state.isViewing = next;
    for (const listener of [...viewListeners]) {
      listener(next);
    }
  }

  function onViewMode(listener: (isViewing: boolean) => void): () => void {
    viewListeners.add(listener);
    return () => {
      viewListeners.delete(listener);
    };
  }

  function tellViewMode(): void {
    for (const listener of [...viewListeners]) {
      listener(state.isViewing);
    }
  }

  async function readShared(fragment: string): Promise<SharedDocument | null> {
    const read = await readShareLink(fragment, options.share.deflate);
    if (!read.ok) {
      if (read.reason !== 'notShareLink') {
        await explainLinkFailure(linkFailureMessage(read.reason), read.reason, read.detail);
      }
      return null;
    }
    // The same validating parser as for a file (QA-02): a link is input from anyone.
    const parsed = parseModel(read.model, { locale: state.locale });
    if (!parsed.ok) {
      await explainLinkFailure(
        parsed.reason === 'newerVersion' ? 'link.newerVersion' : 'link.damaged',
        parsed.reason,
        parsed.detail,
      );
      return null;
    }
    return { doc: parsed.value.doc, name: documentFileName(read.name, text('file.untitled')) };
  }

  /**
   * Says why a share link did not open, with the parser's detail (English), and offers to copy it
   * (UX LG6): a link another AI made can then be fixed by that AI. Resolves when the modal closes.
   */
  async function explainLinkFailure(
    message: ShellMessageKey,
    reason: string,
    detail: string,
    subject: 'link' | 'paste' = 'link',
  ): Promise<void> {
    const what = subject === 'link' ? 'the share link' : 'the pasted text';
    options.log(`Cannot open ${what}: ${reason}: ${detail}`);
    const { editor } = state;
    if (editor === null) {
      return;
    }
    const isCopying = await editor.confirm(
      text(subject === 'link' ? 'link.failed' : 'paste.failed', { message: text(message), detail }),
      {
        confirm: text('choice.copyReason'),
        cancel: text('choice.close'),
        title: appName,
      },
    );
    if (!isCopying) {
      return;
    }
    const guide = new URL('llms.txt', `${options.share.page.origin}${options.share.page.pathname}`);
    const reasonText = `AriadneNSD could not open ${what} (${reason}): ${detail}\nHow to make a link that opens: ${guide.href}`;
    try {
      await options.share.copyText(Promise.resolve(reasonText));
    } catch (error) {
      options.log(`Copying the reason failed: ${String(error)}`);
      await editor.prompt(text('link.copyReasonManually'), reasonText);
      return;
    }
    notices.show(
      text(subject === 'link' ? 'notice.reasonCopied' : 'notice.pasteReasonCopied'),
      'info',
    );
  }

  async function openShared(shared: SharedDocument, leave: Leave): Promise<void> {
    const next = deps.newStore(options.newKey(), shared.name, { kind: 'none' });
    await deps.switchTo(next, null, undefined, leave, shared.doc, true);
  }

  async function openShareLink(fragment: string): Promise<void> {
    const shared = await readShared(fragment);
    if (shared === null) {
      return;
    }
    const leave = await deps.mayLeave();
    if (leave === null) {
      return;
    }
    await openShared(shared, leave);
  }

  function startEditing(): void {
    const { editor } = state;
    if (!state.isViewing || editor === null) {
      return;
    }
    setViewing(false);
    // A share link's document has a key of its own, so no other tab holds it.
    state.isReadOnly = false;
    state.readOnlyReason = undefined;
    editor.setReadOnly(false);
  }

  return {
    setViewing,
    onViewMode,
    tellViewMode,
    readShared,
    explainLinkFailure,
    openShared,
    openShareLink,
    startEditing,
  };
}

function linkFailureMessage(reason: Exclude<ShareLinkFailure, 'notShareLink'>): ShellMessageKey {
  switch (reason) {
    case 'newerVersion':
      return 'link.newerVersion';
    case 'tooLarge':
      return 'link.tooLarge';
    case 'unsupported':
      return 'link.unsupported';
    case 'damaged':
      return 'link.damaged';
  }
}
