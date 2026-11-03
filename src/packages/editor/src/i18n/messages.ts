// The editor's message catalog: every screen string of the editor engine, in English and Korean
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
import { catalogEntriesOf } from '@ariadne-nsd/core';

const english = {
  // File (shell commands use these titles too).
  'command.file.new': 'New',
  'command.file.open': 'Open…',
  'command.file.recent': 'Recent Files',
  'command.file.save': 'Save',
  'command.file.download': 'Download',
  'command.file.saveAs': 'Save As…',
  'command.file.export.png': 'Export as PNG…',
  // Edit
  'command.edit.undo': 'Undo',
  'command.edit.redo': 'Redo',
  'command.edit.cut': 'Cut',
  'command.edit.copy': 'Copy',
  'command.edit.paste': 'Paste',
  'command.edit.pasteBefore': 'Paste Before',
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
  'command.block.insert.process': 'Insert Process',
  'command.block.insert.if': 'Insert If',
  'command.block.insert.case': 'Insert Case',
  'command.block.insert.while': 'Insert While',
  'command.block.insert.for': 'Insert For',
  'command.block.insert.doWhile': 'Insert Do-While',
  'command.block.insertBefore.process': 'Insert Process Before',
  'command.block.insertBefore.if': 'Insert If Before',
  'command.block.insertBefore.case': 'Insert Case Before',
  'command.block.insertBefore.while': 'Insert While Before',
  'command.block.insertBefore.for': 'Insert For Before',
  'command.block.insertBefore.doWhile': 'Insert Do-While Before',
  'command.block.insert.call': 'Insert Call…',
  'command.block.insertBefore.call': 'Insert Call Before…',
  'command.call.setTarget': 'Change Called Method…',
  'command.diagram.event': 'Event Header',
  'command.diagram.event.add': 'Add Event Header',
  'command.diagram.event.change': 'Change to Event',
  'command.diagram.method': 'Method Header',
  'command.diagram.method.add': 'Add Method Header',
  'command.diagram.method.change': 'Change to Method',
  'command.diagram.method.extract': 'Extract into New Method',
  'command.diagram.removeHead': 'Remove Header',
  'command.diagram.newEvent': 'New Event Diagram',
  'command.diagram.newMethod': 'New Method Diagram',
  'command.diagram.delete': 'Delete Diagram',
  'command.block.wrap.if': 'Wrap in If',
  'command.block.wrap.case': 'Wrap in Case',
  'command.block.wrap.while': 'Wrap in While',
  'command.block.wrap.for': 'Wrap in For',
  'command.block.wrap.doWhile': 'Wrap in Do-While',
  'command.block.unwrap': 'Unwrap',
  'command.branch.insert': 'Insert Branch',
  'command.branch.insertBefore': 'Insert Branch Before',
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
  'reason.defaultBranchFixed': 'The default branch always stays last.',
  'reason.lastArm': 'This is the only branch left. To remove the Case, delete or unwrap it.',
  'reason.ifBranchesFixed':
    'An If has exactly two branches. To remove the If, delete or unwrap it.',
  'reason.askConvertIfToCase': 'An If cannot have more branches.',
  'reason.cannotWrapWithProcess': 'A Process block cannot hold other blocks.',
  'reason.noControlBlock': 'No control block holds the selection.',
  'reason.emptyLabel': 'A Case branch label cannot be empty. The label was put back.',
  'reason.defaultLabelFixed': 'The label of the default branch cannot be changed.',
  'reason.notConvertible': 'Only a Case with one branch and a default can become an If.',
  'reason.emptyClip': 'There is nothing to paste.',
  'reason.intoItself': 'Blocks cannot be dropped inside themselves.',
  'reason.noHead': 'This diagram has no header. Add an Event or Method header first.',
  'reason.emptyHeadName': 'A header name cannot be empty. The name was put back.',
  'reason.duplicateHeadName': 'Another header already has this name. Write another name.',
  'reason.methodHasCallers': 'Call blocks call this Method, so it cannot become an Event.',
  'reason.lastDiagram': 'This is the only diagram, so it cannot be deleted.',
  'reason.lostTarget':
    'This call block lost the Method it called. Choose the Method to call first.',
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
  'reason.notOnHead': 'This does not work on a header. Select a block.',
  'reason.cannotPasteOnHead': 'You cannot paste on a header.',
  'reason.cannotWrapHead': 'A header cannot be wrapped.',
  'reason.extractNotYet': 'Extracting blocks into a new Method is not supported yet.',
  'reason.eventNotExtracted':
    'An Event cannot be called, so blocks are not extracted into one. Select the header to change its kind.',

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
  'notice.defaultStaysLast': 'The default branch stays last, so the branch went before it.',
  'notice.unwrapped': 'Unwrapped the {kind} block.',
  'notice.saved': 'Saved as {name}.',
  'notice.saveDenied': 'Could not save: permission was denied.',
  'notice.saveFailed': 'Could not save. The document is still here; try again.',
  'notice.openNoModel': 'This file has no AriadneNSD model, so it cannot be edited.',
  'notice.openPrototype': 'This file was made by the prototype and cannot be opened.',
  'notice.openDamaged': 'This file is damaged and cannot be edited. The file was not changed.',
  'notice.openNewerVersion':
    'This file was made by a newer version of AriadneNSD. Update the app to edit it.',
  'notice.internalError': 'Something went wrong; the document was left as it was.',
  'notice.clipboardLocal':
    'The system clipboard is not available, so the blocks were kept in this tab only.',
  'notice.diagramDeleted': 'Deleted the diagram. Undo brings it back.',

  // Questions in the status bar (UX MD3).
  'question.convertIfToCase': 'An If cannot have more branches. Convert it to a Case?',
  'question.convertCaseToIf': 'One branch is left. Convert the Case to an If?',
  'choice.convertToCase': 'Convert to Case',
  'choice.keepIf': 'Keep the If',
  'choice.convertToIf': 'Convert to If',
  'choice.keepCase': 'Keep the Case',
  'choice.ok': 'OK',
  'choice.cancel': 'Cancel',

  // What is selected.
  'selection.process': 'Process block',
  'selection.empty': 'Empty block',
  'selection.if': 'If block',
  'selection.case': 'Case block',
  'selection.while': 'While block',
  'selection.for': 'For block',
  'selection.doWhile': 'Do-While block',
  'selection.call': 'Call block',
  'selection.blocks': '{count} blocks',
  'selection.branchLabel': 'Branch label "{label}"',
  'selection.missingDefault': 'Empty default branch',
  'selection.eventHead': 'Event header "{name}"',
  'selection.methodHead': 'Method header "{name}"',

  // The list of Methods to call (interaction rules "호출 블록").
  'picker.callTarget': 'Method to call',
  'picker.newMethod': 'New Method, and call it',

  // The two fields of a call block, shown in the empty inline editor.
  'field.callArgs': 'Arguments',
  'field.callResult': 'Result',

  // Modes in the status bar (visual design 7.1).
  'mode.editing': '-- EDIT --',
  'mode.visual': '-- RANGE --',

  // Key hint group titles: the first key of a two-key sequence (03-keymap, UX K1).
  'keyHint.a': 'Insert after',
  'keyHint.A': 'Insert before',
  'keyHint.s': 'Wrap',
  'keyHint.c': 'Edit',
  'keyHint.d': 'Cut · unwrap',
  'keyHint.y': 'Copy',
  'keyHint.g': 'Go',
  'keyHint.[': 'Previous',
  'keyHint.]': 'Next',

  // The label next to the cursor when a drop would wrap (interaction rules 7).
  'drag.wrap.if': 'Wrap in If',
  'drag.wrap.case': 'Wrap in Case',
  'drag.wrap.while': 'Wrap in While',
  'drag.wrap.for': 'Wrap in For',
  'drag.wrap.doWhile': 'Wrap in Do-While',

  // User settings (03-editor 6, UX W5).
  'setting.uiLocale': 'Screen language',
  'setting.uiLocale.en': 'English',
  'setting.uiLocale.ko': '한국어',
  'setting.keyHint': 'Show the key hint',
  'setting.focusOutline': 'Keep the canvas focus outline',
  'setting.autoSave': 'Save automatically',
  'setting.headStyle': 'Header shape',
  'setting.headStyle.title': 'Like a title',
  'setting.headStyle.shape': 'Hat · arch',
} as const;

/** The keys of the editor's messages. */
export type MessageKey = keyof typeof english;

const korean: Readonly<Record<MessageKey, string>> = {
  'command.file.new': '새로',
  'command.file.open': '열기…',
  'command.file.recent': '최근 파일',
  'command.file.save': '저장',
  'command.file.download': '내려받기',
  'command.file.saveAs': '다른 이름으로 저장…',
  'command.file.export.png': 'PNG로 내보내기…',
  'command.edit.undo': '실행 취소',
  'command.edit.redo': '다시 하기',
  'command.edit.cut': '잘라내기',
  'command.edit.copy': '복사',
  'command.edit.paste': '붙여넣기',
  'command.edit.pasteBefore': '앞에 붙여넣기',
  'command.edit.delete': '삭제',
  'command.edit.text': '텍스트 편집',
  'command.edit.textStart': '텍스트 편집 (맨 앞부터)',
  'command.edit.textClear': '텍스트를 비우고 새로 적기',
  'command.edit.branchLabel': '분기 라벨 편집',
  'command.edit.move.up': '위로 이동',
  'command.edit.move.down': '아래로 이동',
  'command.edit.move.left': '왼쪽으로 이동',
  'command.edit.move.right': '오른쪽으로 이동',
  'command.block.insert.process': '처리 삽입',
  'command.block.insert.if': 'If 삽입',
  'command.block.insert.case': 'Case 삽입',
  'command.block.insert.while': 'While 삽입',
  'command.block.insert.for': 'For 삽입',
  'command.block.insert.doWhile': 'Do-While 삽입',
  'command.block.insertBefore.process': '앞에 처리 삽입',
  'command.block.insertBefore.if': '앞에 If 삽입',
  'command.block.insertBefore.case': '앞에 Case 삽입',
  'command.block.insertBefore.while': '앞에 While 삽입',
  'command.block.insertBefore.for': '앞에 For 삽입',
  'command.block.insertBefore.doWhile': '앞에 Do-While 삽입',
  'command.block.insert.call': '호출 삽입…',
  'command.block.insertBefore.call': '앞에 호출 삽입…',
  'command.call.setTarget': '호출할 Method 바꾸기…',
  'command.diagram.event': 'Event 헤더',
  'command.diagram.event.add': 'Event 헤더 달기',
  'command.diagram.event.change': 'Event로 바꾸기',
  'command.diagram.method': 'Method 헤더',
  'command.diagram.method.add': 'Method 헤더 달기',
  'command.diagram.method.change': 'Method로 바꾸기',
  'command.diagram.method.extract': '새 Method로 빼기',
  'command.diagram.removeHead': '헤더 제거',
  'command.diagram.newEvent': '새 Event 다이어그램',
  'command.diagram.newMethod': '새 Method 다이어그램',
  'command.diagram.delete': '다이어그램 삭제',
  'command.block.wrap.if': 'If로 감싸기',
  'command.block.wrap.case': 'Case로 감싸기',
  'command.block.wrap.while': 'While로 감싸기',
  'command.block.wrap.for': 'For로 감싸기',
  'command.block.wrap.doWhile': 'Do-While로 감싸기',
  'command.block.unwrap': '풀기',
  'command.branch.insert': '분기 삽입',
  'command.branch.insertBefore': '앞에 분기 삽입',
  'command.branch.delete': '분기 삭제',
  'command.branch.convertIfToCase': 'If를 Case로 바꾸기',
  'command.branch.convertCaseToIf': 'Case를 If로 바꾸기',
  'command.select.left': '왼쪽 선택',
  'command.select.down': '아래 선택',
  'command.select.up': '위 선택',
  'command.select.right': '오른쪽 선택',
  'command.select.extendUp': '선택 영역을 위로 넓히기',
  'command.select.extendDown': '선택 영역을 아래로 넓히기',
  'command.select.unitUp': '위 블록을 한 덩어리로 선택',
  'command.select.unitDown': '아래 블록을 한 덩어리로 선택',
  'command.select.branchLeft': '왼쪽 분기 선택',
  'command.select.branchRight': '오른쪽 분기 선택',
  'command.select.first': '첫 블록 선택',
  'command.select.last': '마지막 블록 선택',
  'command.select.previousDiagram': '앞 다이어그램',
  'command.select.nextDiagram': '뒤 다이어그램',
  'command.select.visual': '영역 선택',
  'command.select.clear': '선택한 것 풀기',
  'command.view.zoom.in': '확대',
  'command.view.zoom.out': '축소',
  'command.view.zoom.reset': '100%',
  'reason.notFound': '이미 없습니다.',
  'reason.wrongKind': '선택한 것에는 적용되지 않습니다.',
  'reason.notContiguous': '같은 부모 아래 붙어 있는 블록을 선택하세요.',
  'reason.unsupported': '아직 지원하지 않습니다.',
  'reason.alreadyEmpty': '이미 빈 블록입니다.',
  'reason.atTop': '다이어그램의 맨 위입니다.',
  'reason.atBottom': '다이어그램의 맨 아래입니다.',
  'reason.atLeftmost': '맨 왼쪽 분기입니다.',
  'reason.atRightmost': '맨 오른쪽 분기입니다.',
  'reason.notInBranch': 'If · Case 안에서만 분기를 이동합니다. 블록은 위 · 아래로 이동합니다.',
  'reason.defaultBranchFixed': 'default 분기는 늘 맨 끝에 있습니다.',
  'reason.lastArm': '분기가 하나뿐이라 삭제할 수 없습니다. Case를 없애려면 삭제하거나 푸세요.',
  'reason.ifBranchesFixed': 'If의 분기는 둘입니다. If를 없애려면 삭제하거나 푸세요.',
  'reason.askConvertIfToCase': 'If에는 분기를 더할 수 없습니다.',
  'reason.cannotWrapWithProcess': '처리 블록은 다른 블록을 담을 수 없습니다.',
  'reason.noControlBlock': '선택한 것을 담은 제어 블록이 없습니다.',
  'reason.emptyLabel': 'Case의 분기 라벨은 비울 수 없어 처음 라벨로 되돌렸습니다.',
  'reason.defaultLabelFixed': 'default 분기의 라벨은 바꿀 수 없습니다.',
  'reason.notConvertible': '분기 하나와 default만 있는 Case만 If로 바꿀 수 있습니다.',
  'reason.emptyClip': '붙여넣을 것이 없습니다.',
  'reason.intoItself': '블록을 자기 안에 놓을 수 없습니다.',
  'reason.noHead': '헤더가 없는 다이어그램입니다. 먼저 Event나 Method 헤더를 다세요.',
  'reason.emptyHeadName': '헤더의 이름은 비울 수 없어 원래 이름으로 되돌렸습니다.',
  'reason.duplicateHeadName': '같은 이름의 헤더가 이미 있습니다. 다른 이름을 적으세요.',
  'reason.methodHasCallers': '이 Method를 호출하는 호출 블록이 있어 Event로 바꿀 수 없습니다.',
  'reason.lastDiagram': '하나뿐인 다이어그램이라 삭제할 수 없습니다.',
  'reason.lostTarget':
    '호출하던 Method를 잃은 호출 블록이라 편집할 수 없습니다. 먼저 호출할 Method를 선택하세요.',
  'reason.readOnly': '보기만 하는 중: 이 문서는 여기서 바꿀 수 없습니다.',
  'reason.nothingSelected': '먼저 블록을 선택하세요.',
  'reason.selectOneBlock': '블록 하나를 선택하세요.',
  'reason.selectBranchLabel': '먼저 분기 라벨을 선택하세요.',
  'reason.selectInBranch': 'If · Case의 분기 안의 블록을 선택하세요.',
  'reason.notOnBranchLabel': '분기 라벨에서는 분기 삽입 · 삭제 · 이동만 됩니다.',
  'reason.undecidedOnBranchLabel': '분기 라벨에서는 아직 되지 않습니다.',
  'reason.noDefaultToDelete': '삭제할 default 분기가 없습니다.',
  'reason.nothingToCopy': '빈 칸에는 복사할 블록이 없습니다.',
  'reason.nothingToCut': '빈 칸에는 잘라낼 블록이 없습니다.',
  'reason.nothingToUndo': '실행 취소할 것이 없습니다.',
  'reason.nothingToRedo': '다시 할 것이 없습니다.',
  'reason.zoomLimit': '더 바꿀 수 없는 배율입니다.',
  'reason.notIf': 'If 블록을 선택하세요.',
  'reason.editing': '먼저 텍스트 편집을 끝내세요.',
  'reason.branchMovesSideways': '분기는 왼쪽 · 오른쪽으로만 이동합니다.',
  'reason.selectHead': '먼저 헤더를 선택하세요.',
  'reason.selectCall': '호출 블록을 선택하세요.',
  'reason.notOnHead': '헤더에서는 되지 않습니다. 블록을 선택하세요.',
  'reason.cannotPasteOnHead': '헤더에는 붙여넣을 수 없습니다.',
  'reason.cannotWrapHead': '헤더는 감쌀 수 없습니다.',
  'reason.extractNotYet': '새 Method로 빼기는 아직 지원하지 않습니다.',
  'reason.eventNotExtracted':
    'Event는 호출할 수 없어 블록을 Event로 빼지 않습니다. 종류를 바꾸려면 헤더를 선택하세요.',
  'notice.escAgain': '한 번 더 Esc를 누르면 선택한 것을 풉니다.',
  'notice.selectionCleared':
    '선택한 것을 풀었습니다. 이동 키를 누르면 마지막에 선택했던 블록부터 다시 선택합니다.',
  'notice.keyCancelled': '그만뒀습니다.',
  'notice.unknownKey': '{keys}: 없는 키입니다.',
  'notice.noDiagramThere': '그쪽에는 다이어그램이 없습니다.',
  'notice.leftmostBranch': '맨 왼쪽 분기입니다.',
  'notice.rightmostBranch': '맨 오른쪽 분기입니다.',
  'notice.sameParentOnly': '같은 부모 안에서만 영역을 넓힐 수 있습니다.',
  'notice.visual':
    '영역 선택: j k로 넓히고 y 복사 · d 잘라내기 · x 삭제 · s 감싸기. v나 Esc로 끝냅니다.',
  'notice.copied': '블록 {count}개를 복사했습니다.',
  'notice.cut': '블록 {count}개를 잘라냈습니다.',
  'notice.checkCondition':
    '참 · 거짓 분기의 블록을 맞바꿨습니다. 조건은 그대로라 뜻이 바뀌었습니다. 조건을 수정하세요.',
  'notice.defaultStaysLast': 'default 분기는 늘 맨 끝이라 그 앞에 삽입했습니다.',
  'notice.unwrapped': '{kind} 블록을 풀었습니다.',
  'notice.saved': '{name}(으)로 저장했습니다.',
  'notice.saveDenied': '저장하지 못했습니다: 권한이 없습니다.',
  'notice.saveFailed': '저장하지 못했습니다. 문서는 그대로 있으니 다시 해 보세요.',
  'notice.openNoModel': '이 파일에는 AriadneNSD 모델이 없어 편집할 수 없습니다.',
  'notice.openPrototype': '프로토타입이 만든 파일이라 열 수 없습니다.',
  'notice.openDamaged': '파일이 깨져 편집할 수 없습니다. 파일은 바꾸지 않았습니다.',
  'notice.openNewerVersion':
    '더 새 버전의 AriadneNSD가 만든 파일입니다. 편집하려면 앱을 업데이트하세요.',
  'notice.internalError': '문제가 생겨 문서를 그대로 두었습니다.',
  'notice.clipboardLocal': '시스템 클립보드를 쓸 수 없어 이 탭 안에만 복사했습니다.',
  'notice.diagramDeleted': '다이어그램을 삭제했습니다. 실행 취소로 되돌릴 수 있습니다.',
  'question.convertIfToCase': 'If에는 분기를 더할 수 없습니다. Case로 바꿀까요?',
  'question.convertCaseToIf': '분기가 하나만 남았습니다. If로 바꿀까요?',
  'choice.convertToCase': 'Case로 바꾸기',
  'choice.keepIf': 'If 그대로 두기',
  'choice.convertToIf': 'If로 바꾸기',
  'choice.keepCase': 'Case 그대로 두기',
  'choice.ok': '확인',
  'choice.cancel': '취소',
  'selection.process': '처리 블록',
  'selection.empty': '빈 블록',
  'selection.if': 'If 블록',
  'selection.case': 'Case 블록',
  'selection.while': 'While 블록',
  'selection.for': 'For 블록',
  'selection.doWhile': 'Do-While 블록',
  'selection.call': '호출 블록',
  'selection.blocks': '블록 {count}개',
  'selection.branchLabel': '분기 라벨 "{label}"',
  'selection.missingDefault': '빈 default 분기',
  'selection.eventHead': 'Event 헤더 "{name}"',
  'selection.methodHead': 'Method 헤더 "{name}"',
  'picker.callTarget': '호출할 Method',
  'picker.newMethod': '새 Method를 만들고 호출',
  'field.callArgs': '인자',
  'field.callResult': '결과',
  'mode.editing': '-- 편집 --',
  'mode.visual': '-- 영역 --',
  'keyHint.a': '뒤에 삽입',
  'keyHint.A': '앞에 삽입',
  'keyHint.s': '감싸기',
  'keyHint.c': '편집',
  'keyHint.d': '잘라내기 · 풀기',
  'keyHint.y': '복사',
  'keyHint.g': '가기',
  'keyHint.[': '앞으로',
  'keyHint.]': '뒤로',
  'drag.wrap.if': 'If로 감싸기',
  'drag.wrap.case': 'Case로 감싸기',
  'drag.wrap.while': 'While로 감싸기',
  'drag.wrap.for': 'For로 감싸기',
  'drag.wrap.doWhile': 'Do-While로 감싸기',
  'setting.uiLocale': '화면 언어',
  'setting.uiLocale.en': 'English',
  'setting.uiLocale.ko': '한국어',
  'setting.keyHint': '키 힌트 보이기',
  'setting.focusOutline': '캔버스 포커스 테두리 늘 보이기',
  'setting.autoSave': '자동 저장',
  'setting.headStyle': '헤더 모양',
  'setting.headStyle.title': '제목처럼',
  'setting.headStyle.shape': '모자 · 아치',
};

const catalogs: Readonly<Record<Locale, Readonly<Record<MessageKey, string>>>> = {
  en: english,
  ko: korean,
};

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
  return catalogs[locale][key].replace(/\{(\w+)\}/g, (whole, name: string) =>
    name in params ? String(params[name]) : whole,
  );
}

/** Every key with its text in every screen language, for checks (QA-13). */
export function catalogEntries(): ReadonlyArray<CatalogEntry> {
  return catalogEntriesOf(catalogs);
}
