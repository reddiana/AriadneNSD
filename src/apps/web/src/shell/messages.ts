// The web shell's screen strings (R-NFR-04). English is the default; Korean is supported.
// Only what the shell alone shows lives here (coding guide 8): file messages, local backup,
// tabs. The keys follow the editor catalog's rules (`area.name`, `{name}` placeholders). Command
// titles are the editor catalog's (`command.file.new` …): the shell passes those keys as they are.

import type { Locale } from '@ariadne-nsd/core';

/** A screen language: the same set as the editor's and the drawing's (core `Locale`). */
export type ShellLocale = Locale;

const english = {
  'file.recent.empty': 'No recent files',
  'file.recent.browserCopy': 'browser copy',
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
  'notice.readFailed': 'Could not read “{name}”.',
  'notice.dropOne': 'Drop one file at a time.',
  'open.noModel': '“{name}” has no AriadneNSD model in it, so it cannot be edited.',
  'open.prototype':
    '“{name}” was made by the AriadneNSD prototype. Its format cannot be opened by this version.',
  'open.damaged': '“{name}” is damaged and cannot be edited. The file was not changed.',
  'open.newerVersion':
    '“{name}” was saved by a newer version of AriadneNSD. Reload the page and open it again.',
  'choice.restore': 'Restore',
  'choice.discard': 'Discard',
  'drop.hint': 'Drop a .ns.svg or .ns file to open it',
} as const;

/** The key of a shell screen string. */
export type ShellMessageKey = keyof typeof english;

const korean: Record<ShellMessageKey, string> = {
  'file.recent.empty': '최근 파일 없음',
  'file.recent.browserCopy': '브라우저 사본',
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
  'notice.readFailed': '“{name}”을(를) 읽지 못했습니다.',
  'notice.dropOne': '파일은 하나씩 놓아 주세요.',
  'open.noModel': '“{name}”에는 AriadneNSD 모델이 없어 편집할 수 없습니다.',
  'open.prototype':
    '“{name}”은(는) AriadneNSD 프로토타입이 만든 파일입니다. 이 버전은 그 형식을 열 수 없습니다.',
  'open.damaged': '“{name}”이(가) 손상되어 편집할 수 없습니다. 파일은 바꾸지 않았습니다.',
  'open.newerVersion':
    '“{name}”은(는) 더 새 버전의 AriadneNSD가 저장한 파일입니다. 페이지를 새로 고친 뒤 다시 여세요.',
  'choice.restore': '복원',
  'choice.discard': '버리기',
  'drop.hint': '.ns.svg · .ns 파일을 놓으면 엽니다',
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
