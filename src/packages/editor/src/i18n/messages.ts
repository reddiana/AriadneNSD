// The editor's message catalog: every screen string of the editor engine, in English, Korean and German
// (coding guide 8, R-NFR-04). The drawing's fixed words ("true", "false") are in core's catalog.
//
// Key rules (the UI and the shells use the same rules for their keys):
// - `area.name`, lower camelCase segments joined by dots: `notice.escAgain`.
// - A command's title is `command.<command id>`: `command.edit.cut`, `command.block.insert.if`.
// - A refusal is `reason.<code>`: core's `ReasonCode`s and the editor's own (`reason.readOnly`).
// - Status bar messages are `notice.*`, questions `question.*` with buttons `choice.*`, what is
//   selected `selection.*`, the mode `mode.*`, settings `setting.<id>`, the key hint groups
//   `keyHint.<first key>`, the drag label `drag.*`, the list of Methods to call `picker.*`, the
//   names of the call block's fields `field.*`.
// - Placeholders are `{name}`; the values come in `params`.
// - The UI keeps its own strings (menus, dialogs) in `ui/messages.ts`. A key lives in one
//   catalog only; the UI formats a key with its catalog first, then with `formatMessage`.
import type { CatalogEntry, Locale } from '@ariadne-nsd/core';
import { lazyCatalog } from '@ariadne-nsd/core';

const english = {
  // File (shell commands use these titles too).
  'command.file.new': 'New',
  'command.file.open': 'Open…',
  'command.file.recent': 'Recent Files',
  'command.file.save': 'Save',
  'command.file.download': 'Download',
  'command.file.saveAs': 'Save As…',
  'command.file.export.png': 'Export as PNG…',
  'command.file.export.svg': 'Export as SVG (Drawing Only)…',
  'command.file.export.pdf': 'Export as PDF…',
  'command.file.print': 'Print…',
  // Edit
  'command.edit.undo': 'Undo',
  'command.edit.redo': 'Redo',
  'command.edit.cut': 'Cut',
  'command.edit.copy': 'Copy',
  'command.edit.paste': 'Paste Below',
  'command.edit.pasteBefore': 'Paste Above',
  'command.edit.delete': 'Delete',
  'command.edit.text': 'Edit Text',
  'command.edit.textStart': 'Edit Text from the Start',
  'command.edit.textClear': 'Clear and Edit Text',
  'command.edit.branchLabel': 'Edit Branch Label',
  'command.edit.move.up': 'Move Up',
  'command.edit.move.down': 'Move Down',
  'command.edit.move.left': 'Move Left',
  'command.edit.move.right': 'Move Right',
  // Diagram
  'command.block.insert.process': 'Insert Process Below',
  'command.block.insert.if': 'Insert If Below',
  'command.block.insert.case': 'Insert Case Below',
  'command.block.insert.while': 'Insert While Below',
  'command.block.insert.for': 'Insert For Below',
  'command.block.insert.doWhile': 'Insert Do-While Below',
  'command.block.insert.endless': 'Insert Endless Loop Below',
  'command.block.insert.exit': 'Insert Exit Below',
  'command.block.insert.parallel': 'Insert Parallel Below',
  'command.block.insertBefore.process': 'Insert Process Above',
  'command.block.insertBefore.if': 'Insert If Above',
  'command.block.insertBefore.case': 'Insert Case Above',
  'command.block.insertBefore.while': 'Insert While Above',
  'command.block.insertBefore.for': 'Insert For Above',
  'command.block.insertBefore.doWhile': 'Insert Do-While Above',
  'command.block.insertBefore.endless': 'Insert Endless Loop Above',
  'command.block.insertBefore.exit': 'Insert Exit Above',
  'command.block.insertBefore.parallel': 'Insert Parallel Above',
  'command.block.insert.call': 'Insert Call Below…',
  'command.block.insertBefore.call': 'Insert Call Above…',
  'command.call.setTarget': 'Change Called Method…',
  'command.diagram.event': 'Event Header',
  'command.diagram.event.add': 'Add Event Header',
  'command.diagram.event.change': 'Change to Event',
  'command.diagram.method': 'Method Header',
  'command.diagram.method.add': 'Add Method Header',
  'command.diagram.method.change': 'Change to Method',
  'command.diagram.extractMethod': 'Extract into New Method',
  'command.diagram.removeHead': 'Remove Header',
  'command.diagram.newEvent': 'New Event Diagram',
  'command.diagram.newMethod': 'New Method Diagram',
  'command.diagram.delete': 'Delete Diagram',
  'command.block.wrap.if': 'Wrap in If',
  'command.block.wrap.case': 'Wrap in Case',
  'command.block.wrap.while': 'Wrap in While',
  'command.block.wrap.for': 'Wrap in For',
  'command.block.wrap.doWhile': 'Wrap in Do-While',
  'command.block.wrap.endless': 'Wrap in Endless Loop',
  'command.block.wrap.parallel': 'Wrap in Parallel',
  'command.block.unwrap': 'Unwrap',
  'command.branch.insert': 'Insert Branch Right',
  'command.branch.insertBefore': 'Insert Branch Left',
  'command.branch.delete': 'Delete Branch',
  'command.branch.convertIfToCase': 'Convert If to Case',
  'command.branch.convertCaseToIf': 'Convert Case to If',
  // Selection
  'command.select.left': 'Select Left',
  'command.select.down': 'Select Down',
  'command.select.up': 'Select Up',
  'command.select.right': 'Select Right',
  'command.select.extendUp': 'Extend Selection Up',
  'command.select.extendDown': 'Extend Selection Down',
  'command.select.unitUp': 'Select the Block Above as a Whole',
  'command.select.unitDown': 'Select the Block Below as a Whole',
  'command.select.branchLeft': 'Select the Branch to the Left',
  'command.select.branchRight': 'Select the Branch to the Right',
  'command.select.first': 'Select the First Block',
  'command.select.last': 'Select the Last Block',
  'command.select.previousDiagram': 'Previous Diagram',
  'command.select.nextDiagram': 'Next Diagram',
  'command.select.visual': 'Select a Range',
  'command.select.clear': 'Clear Selection',
  // View
  'command.view.zoom.in': 'Zoom In',
  'command.view.zoom.out': 'Zoom Out',
  'command.view.zoom.reset': 'Zoom to 100%',
  'command.view.fold.toggle': 'Fold · Unfold',
  'command.view.fold.open': 'Unfold',
  'command.view.fold.close': 'Fold',
  'command.view.bands': 'Show Fold Regions',
  'command.fold.make': 'Make Fold Region',
  'command.fold.remove': 'Remove Fold Region',
  'command.call.goTo': 'Go to Called Method',
  'command.call.makeMethod': 'Make Method',
  'command.diagram.inlineMethod': 'Inline Method and Delete',

  // Refusals: core's reason codes.
  'reason.notFound': 'It is no longer there.',
  'reason.wrongKind': 'This does not apply to what is selected.',
  'reason.notContiguous': 'Select blocks next to each other under one parent.',
  'reason.unsupported': 'This is not supported yet.',
  'reason.alreadyEmpty': 'The block is already empty.',
  'reason.atTop': 'This is the top of the diagram.',
  'reason.atBottom': 'This is the bottom of the diagram.',
  'reason.atLeftmost': 'This is the leftmost branch.',
  'reason.atRightmost': 'This is the rightmost branch.',
  'reason.notInBranch': 'Branches move only inside an If or a Case. Move blocks up or down.',
  'reason.defaultBranchFixed': 'The default branch always stays rightmost.',
  'reason.lastArm': 'This is the only branch left. To remove the Case, delete or unwrap it.',
  'reason.lastParallelBranches':
    'Only two branches are left. To remove the parallel block, delete or unwrap it.',
  'reason.endlessHasNoText': 'An endless loop has no text.',
  'reason.parallelBranchHasNoLabel':
    'A parallel branch has no label. Select the parallel block to edit its text.',
  'reason.ifBranchesFixed':
    'An If has exactly two branches. To remove the If, delete or unwrap it.',
  'reason.askConvertIfToCase': 'An If cannot have more branches.',
  'reason.cannotWrapWithProcess': 'A Process block cannot hold other blocks.',
  'reason.noControlBlock': 'No control block holds the selection.',
  'reason.emptyLabel':
    'A Case branch label cannot be empty. The label from before the edit was restored.',
  'reason.defaultLabelFixed': 'The label of the default branch cannot be changed.',
  'reason.notConvertible': 'Only a Case with one branch and a default can become an If.',
  'reason.emptyClip': 'There is nothing to paste.',
  'reason.intoItself': 'Blocks cannot be dropped inside themselves.',
  'reason.noHead': 'This diagram has no header. Add an Event or Method header first.',
  'reason.emptyHeadName': 'A header name cannot be empty. The name was put back.',
  'reason.duplicateHeadName': 'Another header already has this name. Write another name.',
  'reason.methodHasCallers': 'Call blocks call this Method, so it cannot become an Event.',
  'reason.lastDiagram': 'This is the only diagram, so it cannot be deleted.',
  // Refusals: the editor's own.
  'reason.readOnly': 'View only: this document cannot be changed here.',
  'reason.nothingSelected': 'Select a block first.',
  'reason.selectOneBlock': 'Select one block.',
  'reason.selectBranchLabel': 'Select a branch label first.',
  'reason.selectInBranch': 'Select a block inside a branch of an If or a Case.',
  'reason.notOnBranchLabel':
    'On a branch label, only inserting and deleting branches and moving them work.',
  'reason.undecidedOnBranchLabel': 'This does not work on a branch label yet.',
  'reason.noDefaultToDelete': 'There is no default branch to delete.',
  'reason.nothingToCopy': 'There is no block to copy in an empty cell.',
  'reason.nothingToCut': 'There is no block to cut in an empty cell.',
  'reason.nothingToUndo': 'Nothing to undo.',
  'reason.nothingToRedo': 'Nothing to redo.',
  'reason.zoomLimit': 'The zoom is at its limit.',
  'reason.notIf': 'Select an If block.',
  'reason.editing': 'Finish editing the text first.',
  'reason.branchMovesSideways': 'Branches move left or right.',
  'reason.selectHead': 'Select a header first.',
  'reason.selectCall': 'Select a call block.',
  'reason.callHasMethod': 'This call block already calls a Method.',
  'reason.selectCallOrMethod': 'Select a call block or a Method header.',
  'reason.recursiveMethod':
    'This Method calls itself, so it cannot be inlined at its calls and deleted.',
  'reason.noCallers': 'Nothing calls this Method, so there is nowhere to inline it.',
  'reason.notOnHead': 'This does not work on a header. Select a block.',
  'reason.cannotPasteOnHead': 'You cannot paste on a header.',
  'reason.cannotWrapHead': 'A header cannot be wrapped.',
  'reason.selectBlocksToExtract': 'Select the blocks to extract.',
  'reason.hasHead': 'This diagram already has a header. Select the header to change its kind.',
  'reason.eventNotExtracted':
    'An Event cannot be called, so blocks are not extracted into one. Select the header to change its kind.',
  'reason.foldExists': 'A fold region with this range is already there.',
  'reason.foldsCross':
    'This would cross the end of another fold region. Select inside it, or all of it.',
  'reason.notCallable':
    'This call block calls nothing in this document, so it cannot be opened or replaced.',
  'reason.emptyCallName': 'A call needs a name. The name was put back.',
  'reason.nothingToFold': 'Nothing here can be folded.',
  'reason.nothingToUnfold': 'Nothing here is folded.',
  'reason.noFoldRegion': 'No fold region holds the selection.',
  'reason.selectBlocksToFold': 'Select the blocks to make a fold region of.',
  'reason.peekReadOnly':
    'Blocks shown in an opened call block cannot be edited. Go to the Method (gd) to edit them.',
  'reason.methodFoldHere':
    'This fold region belongs to the Method. Remove or rename it in the Method.',

  // Status bar notices.
  'notice.escAgain': 'Press Esc again to clear the selection.',
  'notice.selectionCleared': 'Selection cleared. A move key selects the last selected block again.',
  'notice.keyCancelled': 'Cancelled.',
  'notice.unknownKey': '{keys}: no such key.',
  'notice.noDiagramThere': 'There is no diagram that way.',
  'notice.leftmostBranch': 'This is the leftmost branch.',
  'notice.rightmostBranch': 'This is the rightmost branch.',
  'notice.sameParentOnly': 'A range stays under one parent.',
  'notice.visual': 'Selecting a range: j k extend, y copy, d cut, x delete, s wrap. v or Esc ends.',
  'notice.copied': 'Copied {count} block(s).',
  'notice.cut': 'Cut {count} block(s).',
  'notice.checkCondition':
    'The true and false branches were swapped but the condition was not. Fix the condition.',
  'notice.defaultStaysLast':
    'The default branch always stays rightmost, so the new branch went to its left.',
  'notice.convertedIfToCase':
    'Converted the If to a Case and inserted a branch. Undo turns it back.',
  'notice.unwrapped': 'Unwrapped the {kind} block.',
  'notice.unwrappedEndless': 'Unwrapped the endless loop.',
  'notice.unwrappedParallel': 'Unwrapped the parallel block.',
  'notice.saved': 'Saved as {name}.',
  'notice.saveDenied': 'Could not save: permission was denied.',
  'notice.saveFailed': 'Could not save. The document is still here; try again.',
  'notice.openNoModel': 'This file has no AriadneNSD model, so it cannot be edited.',
  'notice.drawingEdited':
    'The drawing in “{name}” was changed by another tool and may not match the model. The editor shows the model. Saving draws the picture again from the model, so the changes made only to the drawing are lost.',
  'notice.openPrototype': 'This file was made by the prototype and cannot be opened.',
  'notice.openDamaged': 'This file is damaged and cannot be edited. The file was not changed.',
  'notice.openNewerVersion':
    'This file was made by a newer version of AriadneNSD. Update the app to edit it.',
  'notice.internalError': 'Something went wrong; the document was left as it was.',
  'notice.clipboardLocal':
    'The system clipboard is not available, so the blocks were kept in this tab only.',
  'notice.diagramDeleted': 'Deleted the diagram. Undo brings it back.',
  'notice.extracted': 'Extracted {count} block(s) into a new Method. Type its name.',
  'notice.extractedFoldsRemoved':
    'Extracted {count} block(s) into a new Method. Type its name. Fold regions crossing the selection were removed.',
  'notice.extractedNamed': 'Extracted {count} block(s) into the new Method {name}.',
  'notice.folded': 'Folded.',
  'notice.unfolded': 'Unfolded.',
  'notice.foldMade': 'Made a fold region. Type its name, or press Enter for the default name.',
  'notice.siteFoldMade':
    'Made a fold region at this call only; the Method is unchanged. Type its name.',
  'notice.foldRemoved': 'Removed the fold region "{name}". The blocks stay.',
  'notice.opened': 'Opened the call block: only the view changed, not the content.',
  'notice.openedAgain':
    'Opened {name} for the {count}th time. A Method that calls itself opens without end.',
  'notice.closed': 'Closed the call block.',
  'notice.inlined': 'Replaced the call block with the blocks of {name}.',
  'notice.methodInlined': 'Inlined {name} at every call site ({count}) and deleted it.',

  // Buttons of the modals.
  'choice.ok': 'OK',
  'choice.cancel': 'Cancel',
  // The modal for a pasted document (UX JP2).
  'question.pastedDocument':
    'The pasted text is an AriadneNSD document. Open it as a new document?',
  'choice.openAsNew': 'Open as New Document',
  'choice.pasteAsText': 'Paste as Text',

  // What is selected.
  'selection.process': 'Process block',
  'selection.empty': 'Empty block',
  'selection.if': 'If block',
  'selection.case': 'Case block',
  'selection.while': 'While block',
  'selection.for': 'For block',
  'selection.doWhile': 'Do-While block',
  'selection.endless': 'Endless loop',
  'selection.exit': 'Exit block',
  'selection.parallel': 'Parallel block',
  'selection.parallelBranch': 'Branch {number} of the parallel block',
  'selection.call': 'Call block',
  'selection.blocks': '{count} blocks',
  'selection.branchLabel': 'Branch label "{label}"',
  'selection.missingDefault': 'Empty default branch',
  'selection.eventHead': 'Event header "{name}"',
  'selection.methodHead': 'Method header "{name}"',
  'selection.fold': 'Fold region "{name}"',
  'selection.peek': '{count} shown block(s), view only',

  // The list of Methods to call (interaction rules "호출 블록").
  'picker.callTarget': 'Method to call',
  'picker.newMethod': 'New Method, and call it',
  'picker.methodKey': 'Method',
  'picker.namedCall': 'Call by a written name',

  // The two fields of a call block, shown in the empty inline editor.
  'field.callArgs': 'Arguments',
  'field.callResult': 'Result',
  'field.callName': 'Name',

  // Modes in the status bar (visual design 7.1).
  'mode.editing': '-- EDIT --',
  'mode.visual': '-- RANGE --',

  // Key hint group titles: the first key of a two-key sequence (03-keymap, UX K1).
  'keyHint.a': 'Insert below',
  'keyHint.A': 'Insert above',
  'keyHint.s': 'Wrap',
  'keyHint.c': 'Edit',
  'keyHint.d': 'Cut · unwrap',
  'keyHint.y': 'Copy',
  'keyHint.g': 'Go',
  'keyHint.[': 'Previous',
  'keyHint.]': 'Next',
  'keyHint.z': 'Fold',

  // The label next to the cursor when a drop would wrap (interaction rules 7).
  'drag.wrap.if': 'Wrap in If',
  'drag.wrap.case': 'Wrap in Case',
  'drag.wrap.while': 'Wrap in While',
  'drag.wrap.for': 'Wrap in For',
  'drag.wrap.doWhile': 'Wrap in Do-While',
  'drag.wrap.endless': 'Wrap in Endless Loop',
  'drag.wrap.parallel': 'Wrap in Parallel',

  // User settings (03-editor 6, UX W5).
  'setting.uiLocale': 'Screen language',
  'setting.uiLocale.en': 'English',
  'setting.uiLocale.ko': '한국어',
  'setting.uiLocale.de': 'Deutsch',
  'setting.keyHint': 'Show the key hint',
  'setting.focusOutline': 'Keep the canvas focus outline',
  'setting.autoSave': 'Save automatically',
  // Document settings: the language of block text (R-LAY-06), then of the drawn words (ADR-0041).
  'setting.textKind': 'Block text language',
  'setting.textKind.hint': 'Syntax highlighting',
  'setting.textKind.plain': 'Plain text',
  'setting.textKind.c': 'C',
  'setting.textKind.cpp': 'C++',
  'setting.textKind.java': 'Java',
  'setting.textKind.javascript': 'JavaScript · TypeScript',
  'setting.textKind.python': 'Python',
  'setting.textKind.bash': 'Bash',
  'setting.documentLocale': 'Language of drawn labels',
  'setting.documentLocale.hint': 'true · false, ⋯ n blocks',
  'setting.headStyle': 'Header shape',
  'setting.headStyle.title': 'Like a title',
  'setting.headStyle.shape': 'Hat · arch',
  'setting.textOutlines': 'Save text as outlines',
  'setting.textOutlines.hint': 'Every viewer shows the same glyphs. The file is larger.',
  'setting.resultSymbol': 'Result symbol',
  'setting.resultSymbol.hint': 'Between the result and the call in a call block',
  'setting.theme': 'Theme',
  'setting.theme.hint': 'The colors of the drawing, saved with it',
  'setting.theme.default': 'Light',
  'setting.theme.dark': 'Dark',
  'setting.theme.high-contrast': 'High contrast',
  'setting.theme.print': 'Black and white print',
} as const;

/** The keys of the editor's messages. */
export type MessageKey = keyof typeof english;

const catalogs = lazyCatalog<MessageKey>(english, {
  ko: () => import('./messages.ko').then((module) => module.korean),
  de: () => import('./messages.de').then((module) => module.german),
});

/** Placeholder values of a message. */
export type MessageParams = Readonly<Record<string, string | number>>;

/**
 * A screen string as the editor's interfaces pass it: a catalog key, or a key with placeholder
 * values. Shells and the UI may pass keys of their own catalogs; `formatMessage` leaves a key it
 * does not know as it is, so the caller can look it up in its own catalog.
 */
export type Message = string | { readonly key: string; readonly params?: MessageParams };

/** A message of this catalog. The editor's own code uses this, so its keys are checked. */
export type EditorMessage =
  MessageKey | { readonly key: MessageKey; readonly params?: MessageParams };

/** Makes a message with placeholder values. */
export function message(key: MessageKey, params?: MessageParams): EditorMessage {
  return params === undefined ? key : { key, params };
}

/** Whether a string is a key of the editor's catalog. */
export function isMessageKey(text: string): text is MessageKey {
  return Object.hasOwn(english, text);
}

/**
 * Turns a message into text in the screen language, filling `{name}` placeholders. A string that
 * is not a key of this catalog is returned as it is, so callers can chain their own catalog.
 */
export function formatMessage(locale: Locale, value: Message): string {
  const key = typeof value === 'string' ? value : value.key;
  const params = typeof value === 'string' ? {} : (value.params ?? {});
  if (!isMessageKey(key)) {
    return key;
  }
  const text = catalogs.table(locale)[key];
  return text.replace(/\{(\w+)\}/g, (whole, name: string) =>
    name in params ? String(params[name]) : whole,
  );
}

/** Every key with its text in every screen language, for checks (QA-13). */
export function catalogEntries(): ReadonlyArray<CatalogEntry> {
  return catalogs.entries();
}
