// The web shell's screen strings (R-NFR-04). English is the default; Korean and German are supported.
// Only what the shell alone shows lives here (coding guide 8): file messages, local backup,
// tabs. The keys follow the editor catalog's rules (`area.name`, `{name}` placeholders). Command
// titles are the editor catalog's (`command.file.new` …): the shell passes those keys as they are.

import type { CatalogEntry, Locale } from '@ariadne-nsd/core';
import { lazyCatalog } from '@ariadne-nsd/core';

/** A screen language: the same set as the editor's and the drawing's (core `Locale`). */
export type ShellLocale = Locale;

const english = {
  'file.recent.empty': 'No recent files',
  'file.recent.browserCopy': 'browser copy',
  'file.recent.browser': 'Browser',
  'file.recent.missing': 'The file was moved or deleted.',
  'file.untitled': 'Untitled',
  'notice.downloadInstead':
    'This browser cannot write to the original file, so saving downloads a copy to your Downloads folder.',
  'notice.askName': 'File name to download:',
  'notice.restore': 'There are unsaved changes from last time in “{name}”. Restore them?',
  'notice.notSavedToFile':
    'The changes to “{name}” were not saved to the file. They are kept in this browser.',
  'notice.otherTab': 'Another tab is editing this file. This tab is view only.',
  'notice.otherTabClosed': 'The other tab closed. You can edit this file now.',
  'notice.autosaveStopped':
    'Auto save stopped: no permission to write the file. Press Ctrl+S to save and allow it again.',
  'notice.exported': 'Exported “{name}”.',
  'notice.exportFailed': 'Could not export the PNG.',
  'notice.exportSvgFailed': 'Could not export the SVG.',
  'notice.exportPdfFailed': 'Could not export the PDF.',
  'notice.printFailed': 'Could not prepare the pages to print.',
  'notice.readFailed': 'Could not read “{name}”.',
  'notice.dropOne': 'Drop one file at a time.',
  'open.noModel': '“{name}” has no AriadneNSD model in it, so it cannot be edited.',
  'open.prototype':
    '“{name}” was made by the AriadneNSD prototype. Its format cannot be opened by this version.',
  'open.damaged': '“{name}” is damaged and cannot be edited. The file was not changed.',
  'open.newerVersion':
    '“{name}” was saved by a newer version of AriadneNSD. Reload the page and open it again.',
  'notice.saveNewFirst':
    '“{name}” is a new document that has never been saved. Once another document opens, it cannot be brought back. Save it first?',
  'choice.restore': 'Restore',
  'choice.discard': 'Discard',
  'choice.save': 'Save',
  'choice.discardAndOpen': 'Discard and Open',
  'drop.hint': 'Drop a .ns.svg or .ns file to open it',
  'command.share': 'Copy Share Link',
  'notice.shareCopied': 'Copied the share link. Anyone with the link can view this diagram.',
  'notice.shareLong':
    'Copied the share link, but it is long ({size} KB): some apps cut long links. Sharing the file is safer.',
  'notice.shareTooLong':
    'This diagram is too large for a link ({size} KB). Share the file instead (File › Save).',
  'notice.shareFailed': 'Could not make the share link.',
  'share.copyManually': 'The clipboard is not available. Copy this share link:',
  'link.newerVersion':
    'This share link was made by a newer version of AriadneNSD. Reload the page to open it.',
  'link.tooLarge': 'This share link is too large to open.',
  'link.unsupported':
    'This browser cannot open compressed share links. Open the link in a recent Chrome, Edge, Firefox or Safari.',
  'link.damaged': 'This share link is damaged (perhaps cut off) and cannot be opened.',
  'link.failed':
    '{message}\nReason: {detail}\nIf an AI made this link, copy the reason and paste it to that AI: it can fix the link.',
  'link.copyReasonManually': 'The clipboard is not available. Copy this reason:',
  'notice.reasonCopied': 'Copied the reason. Paste it to the AI that made the link.',
  'choice.copyReason': 'Copy Reason',
  'choice.close': 'Close',
  'command.openPasted': 'Open from Pasted JSON…',
  'paste.title': 'Open from Pasted JSON',
  'paste.prompt': 'Paste the model JSON or the share link an AI gave you.',
  'choice.open': 'Open',
  'paste.notDocument': 'This text is not an AriadneNSD document (model JSON or share link).',
  'paste.newerVersion':
    'This document was made by a newer version of AriadneNSD. Reload the page to open it.',
  'paste.damaged': 'This model JSON is damaged and cannot be opened.',
  'notice.pasteReasonCopied': 'Copied the reason. Paste it to the AI that wrote the text.',
  'paste.failed':
    '{message}\nReason: {detail}\nIf an AI wrote this text, copy the reason and paste it to that AI: it can fix the JSON.',
  'notice.browserFull':
    'The browser’s storage is full, so it could not be saved. Save it to a file instead.',
  'notice.replace': '“{name}” already exists in this browser. Replace it?',
  'notice.deleteBrowser': 'Delete “{name}” from this browser? This cannot be undone.',
  'notice.renamePrompt': 'New name:',
  'notice.nameTaken': '“{name}” already exists in this browser.',
  'notice.browserMissing': '“{name}” is no longer in this browser.',
  'notice.savedInBrowser': 'Saved “{name}” in this browser.',
  'notice.deletedOpen':
    '“{name}” was deleted from this browser. The diagram on the screen is now a new document that is not saved.',
  'notice.exportedAll': 'Exported {count} documents to “{name}”.',
  'notice.exportDocumentFailed': 'Could not export “{name}”.',
  'notice.imported': 'Imported {count} documents into this browser.',
  'notice.importSkipped': 'Not imported, as they cannot be edited: {names}',
  'choice.replace': 'Replace',
  'choice.delete': 'Delete',
  'choice.saveInBrowser': 'Save in Browser',
} as const;

/** The key of a shell screen string. */
export type ShellMessageKey = keyof typeof english;

const catalogs = lazyCatalog<ShellMessageKey>(english, {
  ko: () => import('./messages.ko').then((module) => module.korean),
  de: () => import('./messages.de').then((module) => module.german),
});

/** Returns a shell string in `locale`, with `{name}`-style placeholders filled from `values`. */
export function shellMessage(
  locale: ShellLocale,
  key: ShellMessageKey,
  values: Readonly<Record<string, string>> = {},
): string {
  const text = catalogs.table(locale)[key];
  return text.replaceAll(/\{(\w+)\}/g, (match, name: string) => values[name] ?? match);
}

/** Every key of the shell catalog with its text in every screen language, for checks (QA-13). */
export function shellCatalogEntries(): ReadonlyArray<CatalogEntry> {
  return catalogs.entries();
}
