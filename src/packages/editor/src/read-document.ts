// Reading what to open (03-editor 6): an `OpenedDocument` becomes a document, or a reason why not.
import type { Doc, KeptSettings, Locale, Settings } from '@ariadne-nsd/core';
import { checkDrawing, createDoc, openSvgFile, parseModelJson } from '@ariadne-nsd/core';

import type { OpenedDocument } from './contracts';
import type { EditorMessage } from './i18n/messages';
import { indexDoc } from './model/doc-index';
import type { Selection } from './state/selection';
import { selectBlock } from './state/selection';

/** A document read from an `OpenedDocument`, or why it cannot be edited. */
export type ReadDocument =
  | {
      readonly ok: true;
      readonly doc: Doc;
      readonly kept: KeptSettings;
      readonly isDirty: boolean;
      readonly selection: Selection | null;
      /**
       * The file's drawing was changed by another tool (R-FMT-09): its fingerprint does not match.
       * Only for a file's text; a backup, an example or a new document has no drawing to check.
       */
      readonly isDrawingEdited: boolean;
    }
  | { readonly ok: false; readonly message: EditorMessage; readonly detail: string };

/** What a new document starts with, and the drawing language of a file without one. */
export type NewDocumentDefaults = {
  /** The header shape chosen last (UX HS1). */
  readonly headStyle: Settings['headStyle'];
  /** The screen language of the one who opens or creates the document (ADR-0041). */
  readonly locale: Locale;
};

/**
 * Reads what to open: the local backup first (dirty), then a ready-made document (an example,
 * clean, nothing selected), a new document for `text: null` (its empty block selected, UX OP1)
 * with the header shape and drawing language of `defaults` (UX HS1, ADR-0041), otherwise the
 * file (nothing selected). A file without a drawing language opens in `defaults.locale`.
 */
export function readDocument(
  opened: OpenedDocument,
  defaults: NewDocumentDefaults = { headStyle: 'title', locale: 'en' },
): ReadDocument {
  const { locale } = defaults;
  if (opened.restored !== undefined) {
    const result = parseModelJson(opened.restored, { locale });
    return result.ok
      ? { ok: true, ...result.value, isDirty: true, selection: null, isDrawingEdited: false }
      : { ok: false, message: openMessage(result.reason), detail: result.detail };
  }
  if (opened.doc !== undefined) {
    return {
      ok: true,
      doc: opened.doc,
      kept: {},
      isDirty: false,
      selection: null,
      isDrawingEdited: false,
    };
  }
  if (opened.text === null) {
    const doc = createDoc(defaults);
    const first = doc.content.diagrams[0]?.body.blocks[0];
    return {
      ok: true,
      doc,
      kept: {},
      isDirty: false,
      selection: first === undefined ? null : selectBlock(indexDoc(doc.content), first.id),
      isDrawingEdited: false,
    };
  }
  const result = openSvgFile(opened.text, { locale });
  return result.ok
    ? {
        ok: true,
        ...result.value,
        isDirty: false,
        selection: null,
        isDrawingEdited: checkDrawing(opened.text) === 'edited',
      }
    : { ok: false, message: openMessage(result.reason), detail: result.detail };
}

function openMessage(reason: 'noModel' | 'prototype' | 'damaged' | 'newerVersion'): EditorMessage {
  switch (reason) {
    case 'noModel':
      return 'notice.openNoModel';
    case 'prototype':
      return 'notice.openPrototype';
    case 'damaged':
      return 'notice.openDamaged';
    case 'newerVersion':
      return 'notice.openNewerVersion';
  }
}
