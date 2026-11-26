// Documents pasted as text (R-WEB-11, UX JP1 · JP2 · JP3): a share link or the model JSON pasted
// into the editor, or into File › Open from Pasted JSON…, opens as a new document. Web only:
// it reads share links of this site.

import { parseModel } from '@ariadne-nsd/core';

import { documentFileName } from '../files/file-name';
import { readPastedDocument, recognizePastedDocument } from '../files/pasted-document';
import type { Opening } from './opening';
import type { NewStore, ShellContext } from './shell-context';
import type { ShareView, SharedDocument } from './share-view';

export type PasteOpenDeps = Pick<ShareView, 'readShared' | 'explainLinkFailure'> &
  Pick<Opening, 'switchTo' | 'mayLeave'> & {
    readonly newStore: NewStore;
  };

export type PasteOpen = {
  readonly isPastedDocument: (pasted: string) => boolean;
  readonly openPasted: (pasted: string) => Promise<void>;
  /** File › Open from Pasted JSON… (UX JP3). */
  readonly openFromPastedText: () => Promise<void>;
};

export function createPasteOpen(ctx: ShellContext, deps: PasteOpenDeps): PasteOpen {
  const { options, state, text } = ctx;

  function isPastedDocument(pasted: string): boolean {
    return recognizePastedDocument(pasted, options.share.page) !== null;
  }

  /**
   * The document in a pasted text, checked like a file; or `null` after saying why not (UX LG6).
   * A share link opens as a link; the model JSON alone is untitled.
   */
  async function readPasted(pasted: string): Promise<SharedDocument | null> {
    const read = readPastedDocument(pasted, options.share.page);
    if (!read.ok) {
      await deps.explainLinkFailure('paste.notDocument', 'notDocument', read.detail, 'paste');
      return null;
    }
    if (read.pasted.kind === 'link') {
      return deps.readShared(read.pasted.fragment);
    }
    // The same validating parser as for a file (QA-02): pasted text is input from anyone.
    const parsed = parseModel(read.pasted.model, { locale: state.locale });
    if (!parsed.ok) {
      await deps.explainLinkFailure(
        parsed.reason === 'newerVersion' ? 'paste.newerVersion' : 'paste.damaged',
        parsed.reason,
        parsed.detail,
        'paste',
      );
      return null;
    }
    const name = read.pasted.kind === 'envelope' ? read.pasted.name : '';
    return { doc: parsed.value.doc, name: documentFileName(name, text('file.untitled')) };
  }

  /**
   * Opens a pasted document as a new document that was never saved, editable (not view mode).
   * An edited new document is asked about first, as for a share link (UX US1). Not undoable: it
   * is opening, not an edit.
   */
  async function openPasted(pasted: string): Promise<void> {
    const read = await readPasted(pasted);
    if (read === null) {
      return;
    }
    const leave = await deps.mayLeave();
    if (leave === null) {
      return;
    }
    await deps.switchTo(
      deps.newStore(options.newKey(), read.name, { kind: 'none' }),
      null,
      undefined,
      leave,
      read.doc,
    );
  }

  /** File › Open from Pasted JSON… (UX JP3): a box to paste into, then the same as a paste. */
  async function openFromPastedText(): Promise<void> {
    const { editor } = state;
    if (editor === null) {
      return;
    }
    const pasted = await editor.prompt(text('paste.prompt'), '', {
      title: text('paste.title'),
      confirm: text('choice.open'),
      isMultiline: true,
    });
    if (pasted === null || pasted.trim() === '') {
      return;
    }
    await openPasted(pasted);
  }

  return { isPastedDocument, openPasted, openFromPastedText };
}
