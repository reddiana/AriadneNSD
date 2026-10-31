// The UI's own screen strings: menu names, dialog titles, the palette's placeholder
// (coding guide 8, R-NFR-04). Command names come from the registry, not from here.
// The areas here (`menu.*`, `palette.*`, `hint.*` …) are the UI's only; the engine's catalog
// (../i18n/messages.ts) has the others, so the keys of the two never clash.

import type { Locale } from '@ariadne-nsd/core';

const en = {
  'menu.file': 'File',
  'menu.edit': 'Edit',
  'menu.diagram': 'Diagram',
  'menu.view': 'View',
  'menu.help': 'Help',
  'menu.all': 'Menu',
  'submenu.recent': 'Recent Files',
  'submenu.export': 'Export',
  'submenu.insert': 'Insert',
  'submenu.insertBefore': 'Insert Before',
  'submenu.wrap': 'Wrap',
  'toolbar.label': 'Toolbar',
  'toolbar.wrap': 'Wrap',
  'toolbar.zoom': 'Zoom',
  'toolbar.blockTip':
    '{name}: insert after ({after}) · Shift+click: before ({before}) · Ctrl+click: wrap ({wrap}) · drag onto the diagram',
  'toolbar.processTip':
    '{name}: insert after ({after}) · Shift+click: before ({before}) · drag onto the diagram',
  'block.process': 'Process',
  'block.if': 'If',
  'block.case': 'Case',
  'block.while': 'While',
  'block.for': 'For',
  'block.doWhile': 'Do-While',
  'status.label': 'Status',
  'status.nothingSelected': 'Nothing selected',
  'status.readOnly': 'View only',
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
  'whatsNew.title': "What's New in This Version",
  'whatsNew.body': 'This is the first version.',
  'modal.close': 'Close',
  'value.on': 'On',
  'value.off': 'Off',
  'cmd.commandPalette': 'Command Palette…',
  'cmd.preferences': 'Preferences…',
  'cmd.documentSettings': 'Document Settings…',
  'cmd.shortcuts': 'Keyboard Shortcuts',
  'cmd.manual': 'User Guide',
  'cmd.whatsNew': "What's New in This Version",
  'cmd.about': 'About AriadneNSD',
} as const;

/** The keys of the UI's screen strings. */
export type UiMessageKey = keyof typeof en;

const ko: Readonly<Record<UiMessageKey, string>> = {
  'menu.file': '파일',
  'menu.edit': '편집',
  'menu.diagram': '다이어그램',
  'menu.view': '보기',
  'menu.help': '도움말',
  'menu.all': '메뉴',
  'submenu.recent': '최근 파일',
  'submenu.export': '내보내기',
  'submenu.insert': '삽입',
  'submenu.insertBefore': '앞에 삽입',
  'submenu.wrap': '감싸기',
  'toolbar.label': '툴바',
  'toolbar.wrap': '감싸기',
  'toolbar.zoom': '확대',
  'toolbar.blockTip':
    '{name}: 뒤에 삽입 ({after}) · Shift+클릭: 앞에 ({before}) · Ctrl+클릭: 감싸기 ({wrap}) · 다이어그램에 드래그',
  'toolbar.processTip':
    '{name}: 뒤에 삽입 ({after}) · Shift+클릭: 앞에 ({before}) · 다이어그램에 드래그',
  'block.process': '처리',
  'block.if': 'If',
  'block.case': 'Case',
  'block.while': 'While',
  'block.for': 'For',
  'block.doWhile': 'Do-While',
  'status.label': '상태',
  'status.nothingSelected': '선택한 것 없음',
  'status.readOnly': '보기만 하는 중',
  'status.unsaved': '저장 안 됨',
  'palette.label': '커맨드 팔레트',
  'palette.placeholder': '명령 이름을 입력하세요',
  'palette.empty': '맞는 명령이 없습니다',
  'hint.label': '이어 누를 키',
  'shortcuts.title': '단축키 목록',
  'shortcuts.command': '명령',
  'shortcuts.vimKey': 'Vim 키',
  'shortcuts.standardKey': '표준 키',
  'preferences.title': '환경 설정',
  'preferences.empty': '아직 설정이 없습니다',
  'documentSettings.title': '문서 설정',
  'documentSettings.note': '파일에 저장됩니다. 파일을 받은 사람에게도 같게 보입니다.',
  'preferences.note': '나에게만, 이 브라우저에 남습니다.',
  'about.title': 'AriadneNSD에 대하여',
  'about.body': 'NS 차트(Nassi-Shneiderman Diagram) 편집기.',
  'about.version': '버전 {version}',
  'whatsNew.title': '이 버전에서 바뀐 것',
  'whatsNew.body': '첫 버전입니다.',
  'modal.close': '닫기',
  'value.on': '켬',
  'value.off': '끔',
  'cmd.commandPalette': '커맨드 팔레트…',
  'cmd.preferences': '환경 설정…',
  'cmd.documentSettings': '문서 설정…',
  'cmd.shortcuts': '단축키 목록',
  'cmd.manual': '사용법',
  'cmd.whatsNew': '이 버전에서 바뀐 것',
  'cmd.about': 'AriadneNSD에 대하여',
};

const catalog: Readonly<Record<Locale, Readonly<Record<UiMessageKey, string>>>> = { en, ko };

/** Returns a UI string, with `{name}` placeholders filled from `params`. */
export function uiMessage(
  locale: Locale,
  key: UiMessageKey,
  params: Readonly<Record<string, string | number>> = {},
): string {
  return catalog[locale][key].replace(/\{(\w+)\}/g, (whole, name: string) =>
    name in params ? String(params[name]) : whole,
  );
}

/** Whether a string is a key of the UI catalog (used for the UI's own command titles). */
export function isUiMessageKey(text: string): text is UiMessageKey {
  return Object.hasOwn(en, text);
}
