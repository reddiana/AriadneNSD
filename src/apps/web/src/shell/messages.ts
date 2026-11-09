// The web shell's screen strings (R-NFR-04). English is the default; Korean is supported.
// Only what the shell alone shows lives here (coding guide 8): file messages, local backup,
// tabs. The keys follow the editor catalog's rules (`area.name`, `{name}` placeholders). Command
// titles are the editor catalog's (`command.file.new` …): the shell passes those keys as they are.

import type { CatalogEntry, Locale } from '@ariadne-nsd/core';
import { catalogEntriesOf } from '@ariadne-nsd/core';

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

const korean: Record<ShellMessageKey, string> = {
  'file.recent.empty': '최근 파일 없음',
  'file.recent.browserCopy': '브라우저 사본',
  'file.recent.browser': '브라우저',
  'file.recent.missing': '파일이 이동되었거나 삭제되었습니다.',
  'file.untitled': '제목 없음',
  'notice.downloadInstead':
    '이 브라우저는 원래 파일에 쓸 수 없어 내려받습니다(브라우저의 내려받기 폴더).',
  'notice.askName': '내려받을 파일 이름:',
  'notice.restore': '“{name}”에 저장하지 않은 지난번 내용이 있습니다. 복원할까요?',
  'notice.notSavedToFile':
    '“{name}”의 고친 내용은 파일에 저장되지 않았습니다. 이 브라우저에 보관되어 있습니다.',
  'notice.otherTab': '다른 탭에서 이 파일을 편집하고 있습니다. 이 탭은 보기만 합니다.',
  'notice.otherTabClosed': '다른 탭이 닫혔습니다. 이제 이 파일을 편집할 수 있습니다.',
  'notice.autosaveStopped':
    '자동 저장을 멈췄습니다: 파일에 쓸 권한이 없습니다. Ctrl+S로 저장하면 다시 묻습니다.',
  'notice.exported': '“{name}”(으)로 내보냈습니다.',
  'notice.exportFailed': 'PNG로 내보내지 못했습니다.',
  'notice.exportSvgFailed': 'SVG로 내보내지 못했습니다.',
  'notice.exportPdfFailed': 'PDF로 내보내지 못했습니다.',
  'notice.printFailed': '인쇄할 페이지를 만들지 못했습니다.',
  'notice.readFailed': '“{name}”을(를) 읽지 못했습니다.',
  'notice.dropOne': '파일은 하나씩 놓아 주세요.',
  'open.noModel': '“{name}”에는 AriadneNSD 모델이 없어 편집할 수 없습니다.',
  'open.prototype':
    '“{name}”은(는) AriadneNSD 프로토타입이 만든 파일입니다. 이 버전은 그 형식을 열 수 없습니다.',
  'open.damaged': '“{name}”이(가) 손상되어 편집할 수 없습니다. 파일은 바꾸지 않았습니다.',
  'open.newerVersion':
    '“{name}”은(는) 더 새 버전의 AriadneNSD가 저장한 파일입니다. 페이지를 새로 고친 뒤 다시 여세요.',
  'notice.saveNewFirst':
    '“{name}”은(는) 한 번도 저장하지 않은 새 문서입니다. 다른 문서를 열면 다시 꺼낼 수 없습니다. 먼저 저장할까요?',
  'choice.restore': '복원',
  'choice.discard': '버리기',
  'choice.save': '저장',
  'choice.discardAndOpen': '버리고 열기',
  'drop.hint': '.ns.svg · .ns 파일을 놓으면 엽니다',
  'command.share': '공유 링크 복사',
  'notice.shareCopied':
    '공유 링크를 복사했습니다. 링크가 있으면 누구나 이 다이어그램을 볼 수 있습니다.',
  'notice.shareLong':
    '공유 링크를 복사했지만 깁니다({size} KB). 긴 링크를 자르는 앱이 있어 파일로 공유하는 것을 추천합니다.',
  'notice.shareTooLong':
    '이 다이어그램은 링크에 담기에 너무 큽니다({size} KB). 파일로 공유해 주세요(파일 › 저장).',
  'notice.shareFailed': '공유 링크를 만들지 못했습니다.',
  'share.copyManually': '클립보드를 쓸 수 없습니다. 이 공유 링크를 복사하세요:',
  'link.newerVersion':
    '이 공유 링크는 더 새 버전의 AriadneNSD가 만든 것입니다. 페이지를 새로 고친 뒤 여세요.',
  'link.tooLarge': '이 공유 링크는 너무 커서 열 수 없습니다.',
  'link.unsupported':
    '이 브라우저는 압축한 공유 링크를 열 수 없습니다. 최신 Chrome · Edge · Firefox · Safari에서 여세요.',
  'link.damaged': '이 공유 링크는 손상되어(잘렸을 수 있습니다) 열 수 없습니다.',
  'link.failed':
    '{message}\n오류 내용: {detail}\n이 링크를 AI가 만들었다면 오류 내용을 복사해 그 AI에게 붙여 주세요. 고친 링크를 다시 받을 수 있습니다.',
  'link.copyReasonManually': '클립보드를 쓸 수 없습니다. 이 오류 내용을 복사하세요:',
  'notice.reasonCopied': '오류 내용을 복사했습니다. 링크를 만든 AI에게 붙여 주세요.',
  'choice.copyReason': '오류 내용 복사',
  'choice.close': '닫기',
  'notice.browserFull': '브라우저의 저장 공간이 모자라 저장하지 못했습니다. 파일로 저장해 주세요.',
  'notice.replace': '“{name}”이(가) 이 브라우저에 이미 있습니다. 바꿀까요?',
  'notice.deleteBrowser': '“{name}”을(를) 이 브라우저에서 삭제할까요? 되돌릴 수 없습니다.',
  'notice.renamePrompt': '새 이름:',
  'notice.nameTaken': '“{name}”이(가) 이 브라우저에 이미 있습니다.',
  'notice.browserMissing': '“{name}”이(가) 이 브라우저에 더 이상 없습니다.',
  'notice.savedInBrowser': '“{name}”을(를) 이 브라우저에 저장했습니다.',
  'notice.deletedOpen':
    '“{name}”을(를) 이 브라우저에서 삭제했습니다. 화면의 다이어그램은 이제 저장하지 않은 새 문서입니다.',
  'notice.exportedAll': '문서 {count}개를 “{name}”(으)로 내보냈습니다.',
  'notice.exportDocumentFailed': '“{name}”을(를) 내보내지 못했습니다.',
  'notice.imported': '문서 {count}개를 이 브라우저로 가져왔습니다.',
  'notice.importSkipped': '편집할 수 없어 가져오지 않은 파일: {names}',
  'choice.replace': '바꾸기',
  'choice.delete': '삭제',
  'choice.saveInBrowser': '브라우저에 저장',
};

const catalogs: Record<ShellLocale, Record<ShellMessageKey, string>> = { en: english, ko: korean };

/** Picks the screen language from a BCP 47 tag such as `navigator.language`: Korean or English. */
export function localeFromLanguageTag(tag: string | undefined): ShellLocale {
  return tag?.toLowerCase().startsWith('ko') === true ? 'ko' : 'en';
}

/** Returns a shell string in `locale`, with `{name}`-style placeholders filled from `values`. */
export function shellMessage(
  locale: ShellLocale,
  key: ShellMessageKey,
  values: Readonly<Record<string, string>> = {},
): string {
  return catalogs[locale][key].replaceAll(
    /\{(\w+)\}/g,
    (match, name: string) => values[name] ?? match,
  );
}

/** Every key of the shell catalog with its text in every screen language, for checks (QA-13). */
export function shellCatalogEntries(): ReadonlyArray<CatalogEntry> {
  return catalogEntriesOf(catalogs);
}
