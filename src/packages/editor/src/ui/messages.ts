// The UI's own screen strings: menu names, dialog titles, the palette's placeholder
// (coding guide 8, R-NFR-04). Command names come from the registry, not from here.
// The areas here (`menu.*`, `palette.*`, `hint.*` …) are the UI's only; the engine's catalog
// (../i18n/messages.ts) has the others, so the keys of the two never clash.

import type { CatalogEntry, Locale } from '@ariadne-nsd/core';
import { lazyCatalog } from '@ariadne-nsd/core';

const en = {
  'menu.file': 'File',
  'menu.edit': 'Edit',
  'menu.diagram': 'Diagram',
  'menu.view': 'View',
  'menu.help': 'Help',
  'menu.all': 'Menu',
  'submenu.recent': 'Recent Files',
  'submenu.export': 'Export',
  'submenu.insert': 'Insert Below',
  'submenu.insertBefore': 'Insert Above',
  'submenu.wrap': 'Wrap',
  'toolbar.label': 'Toolbar',
  'toolbar.wrap': 'Wrap',
  'toolbar.zoom': 'Zoom',
  'toolbar.zoomReset': 'Zoom to 100%',
  'toolbar.blockTip':
    '{name}: insert below ({after}) · Shift+click: above ({before}) · Ctrl+click: wrap ({wrap}) · drag onto the diagram',
  'toolbar.processTip':
    '{name}: insert below ({after}) · Shift+click: above ({before}) · drag onto the diagram',
  'block.process': 'Process',
  'block.if': 'If',
  'block.case': 'Case',
  'block.while': 'While',
  'block.for': 'For',
  'block.doWhile': 'Do-While',
  'block.endless': 'Endless Loop',
  'block.exit': 'Exit',
  'block.parallel': 'Parallel',
  'status.label': 'Status',
  'status.nothingSelected': 'Nothing selected',
  'status.readOnly': 'View only',
  'status.readOnly.otherTab': 'View only · editing in another tab',
  'status.readOnly.otherTab.hint': 'Close that tab to edit here.',
  'status.unsaved': 'Not saved',
  'palette.label': 'Command palette',
  'palette.placeholder': 'Type a command name',
  'palette.empty': 'No matching command',
  'hint.label': 'Next key',
  'shortcuts.title': 'Keyboard Shortcuts',
  'shortcuts.command': 'Command',
  'shortcuts.vimKey': 'Vim key',
  'shortcuts.standardKey': 'Standard key',
  'preferences.title': 'Preferences',
  'preferences.empty': 'No settings yet',
  'documentSettings.title': 'Document Settings',
  'documentSettings.note': 'Saved in the file. Others who open it see the same.',
  'preferences.note': 'Only for you, kept in this browser.',
  'about.title': 'About AriadneNSD',
  'about.body': 'A Nassi-Shneiderman diagram editor.',
  'about.version': 'Version {version}',
  'about.preview': 'Before version 1.0, files you save may not open in later versions.',
  'about.docs': 'Documentation',
  'about.docsUrl': 'https://ariadnensd.com/about',
  'about.repository': 'GitHub repository',
  'whatsNew.title': "What's New in This Version",
  'whatsNew.body':
    '0.5.0 makes everyday editing quicker.\n' +
    '- Zoom out, 100% and zoom in are buttons on the toolbar; click the number for 100%, or use the wheel over them\n' +
    '- Drop blocks at the very start or end of a diagram, on the band under the header or under the diagram\n' +
    '- Menu items you cannot use now are fainter and say why when you point at them\n' +
    '- Editing a large diagram is faster: only the blocks that change are redrawn\n' +
    '- Lines are no longer thicker at zoom levels like 110%\n' +
    '- Help › Algorithm gallery opens 22 algorithms drawn as NS diagrams\n' +
    '- The Claude skill installs in claude.ai from the plugin marketplace too',
  'modal.close': 'Close',
  'contextMenu.label': 'Context menu',
  'dialog.label': 'Question',
  'notice.close': 'Close the message',
  'value.on': 'On',
  'value.off': 'Off',
  'cmd.commandPalette': 'Command Palette…',
  'cmd.preferences': 'Preferences…',
  'cmd.documentSettings': 'Document Settings…',
  'cmd.shortcuts': 'Keyboard Shortcuts',
  'cmd.manual': 'User Guide',
  'cmd.gallery': 'Algorithm gallery',
  'cmd.askAi': 'Ask an AI to Draw',
  'cmd.whatsNew': "What's New in This Version",
  'cmd.about': 'About AriadneNSD',
  'cmd.examples': 'Examples…',
  'toolbar.examples': 'Examples',
  'examples.welcomeTitle': 'Welcome to AriadneNSD',
  'examples.welcomeLead':
    'Open an example to start. What you change becomes your document, and you can open the examples again from Help › Examples….',
  'examples.welcomeFoot':
    'You can open the examples again from "Examples" in the toolbar or Help › Examples….',
  'examples.welcomePreview':
    'AriadneNSD is before version 1.0. Files you save now may not open in later versions.',
  'examples.menuTitle': 'Open an Example',
  'examples.menuLead':
    'An example opens as a new document. This document closes; a document opened from a file can be restored by opening that file again.',
  'examples.blankWelcome': 'Start with a blank document',
  'examples.blankWelcomeWhat': 'Will not ask again',
  'examples.blank': 'Blank document',
  'examples.blankWhat': 'New document',
  'examples.openFile': 'Open File…',
  'view.label': 'View mode',
  'view.edit': 'Edit',
  'view.editTip': 'Edit this diagram. Your copy stays in this browser until you save it.',
  'place.browser': 'Browser',
  'place.browserTip': 'Kept in this browser, not in a file',
  'places.openTitle': 'Open',
  'places.saveTitle': 'Save As',
  'places.sides': 'Where',
  'places.computer': 'Files on This Computer',
  'places.browser': 'This Browser',
  'places.computerOpenLead': 'Open a .ns.svg or .ns file on this computer.',
  'places.chooseFile': 'Choose a File…',
  'places.computerSaveLead': 'Save as a .ns.svg file on this computer.',
  'places.computerDownloadLead':
    'This browser cannot write to files on this computer, so it downloads a .ns.svg file to your Downloads folder.',
  'places.chooseWhere': 'Choose Where to Save…',
  'places.download': 'Download…',
  'places.name': 'Name',
  'places.list': 'Documents in this browser',
  'places.modified': 'Modified',
  'places.size': 'Size',
  'places.empty': 'No documents in this browser yet.',
  'places.yesterday': 'Yesterday',
  'places.saveWarning':
    'Kept only in this browser. Clearing the browser’s site data deletes it too.',
  'places.listWarning':
    'Kept only in this browser. Clearing the browser’s site data deletes them too, so export them to files now and then.',
  'places.open': 'Open',
  'places.save': 'Save',
  'places.cancel': 'Cancel',
  'places.rename': 'Rename…',
  'places.export': 'Export to File',
  'places.delete': 'Delete',
  'places.exportAll': 'Export All to Files (.zip)',
  'places.import': 'Import from Files…',
} as const;

/** The keys of the UI's screen strings. */
export type UiMessageKey = keyof typeof en;

const catalog = lazyCatalog<UiMessageKey>(en, {
  ko: () => import('./messages.ko').then((module) => module.ko),
  de: () => import('./messages.de').then((module) => module.de),
});

/** Returns a UI string, with `{name}` placeholders filled from `params`. */
export function uiMessage(
  locale: Locale,
  key: UiMessageKey,
  params: Readonly<Record<string, string | number>> = {},
): string {
  const text = catalog.table(locale)[key];
  return text.replace(/\{(\w+)\}/g, (whole, name: string) =>
    name in params ? String(params[name]) : whole,
  );
}

/** Whether a string is a key of the UI catalog (used for the UI's own command titles). */
export function isUiMessageKey(text: string): text is UiMessageKey {
  return Object.hasOwn(en, text);
}

/** Every key of the UI catalog with its text in every screen language, for checks (QA-13). */
export function uiCatalogEntries(): ReadonlyArray<CatalogEntry> {
  return catalog.entries();
}
