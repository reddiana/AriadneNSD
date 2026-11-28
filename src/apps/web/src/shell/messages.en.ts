// The English table of the web shell's catalog (messages.ts): always in the first download, the fallback
// while another language is fetched, and the source of the key type (core `lazyCatalog`).

export const english = {
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
