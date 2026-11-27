// The settings the editor knows: their ids, specs and the checked change of a document setting.
import type { Locale, Settings } from '@ariadne-nsd/core';
import {
  isKnownTheme,
  isLocale,
  isTextKind,
  locales,
  resultSymbols,
  textKinds,
  themeIds,
} from '@ariadne-nsd/core';

import type { SettingSpec, SettingsStore } from './contracts';

/**
 * The setting ids the editor reads (03-editor 6, UX W5). `headStyle` is the header shape the
 * user chose last (UX HS1): the editor writes it when a document's header shape is changed, and
 * a new document starts with it. It is remembered, not shown in the preferences.
 */
export const settingIds = {
  locale: 'ui.locale',
  keyHint: 'editor.keyHint',
  focusOutline: 'editor.focusOutline',
  autoSave: 'file.autoSave',
  headStyle: 'editor.headStyle',
} as const;

/**
 * The document setting ids (scope `document`): the model's `settings` (UX W5), and the result
 * symbol, which is saved in the file as view state (`view.resultSymbol`).
 */
export const documentSettingIds = {
  headStyle: 'document.headStyle',
  locale: 'document.locale',
  textKind: 'document.textKind',
  theme: 'document.theme',
  textOutlines: 'document.textOutlines',
  resultSymbol: 'document.resultSymbol',
} as const;

/** The settings the editor knows. `file.autoSave` is used by the web shell. */
export const settingSpecs: ReadonlyArray<SettingSpec> = [
  {
    id: settingIds.locale,
    title: 'setting.uiLocale',
    values: locales,
    valueTitles: locales.map((locale) => `setting.uiLocale.${locale}` as const),
    defaultValue: 'en',
    scope: 'user',
  },
  {
    id: settingIds.keyHint,
    title: 'setting.keyHint',
    values: [true, false],
    defaultValue: true,
    scope: 'user',
  },
  {
    id: settingIds.focusOutline,
    title: 'setting.focusOutline',
    values: [false, true],
    defaultValue: false,
    scope: 'user',
  },
  {
    id: settingIds.autoSave,
    title: 'setting.autoSave',
    values: [true, false],
    defaultValue: true,
    scope: 'user',
  },
  {
    // The language of block text: how it is highlighted (R-LAY-06, R-LAY-07).
    id: documentSettingIds.textKind,
    title: 'setting.textKind',
    hint: 'setting.textKind.hint',
    values: textKinds,
    valueTitles: textKinds.map((kind) => `setting.textKind.${kind}` as const),
    defaultValue: 'plain',
    scope: 'document',
  },
  {
    // Right after the block text's language: the language of the drawn words (ADR-0041).
    id: documentSettingIds.locale,
    title: 'setting.documentLocale',
    hint: 'setting.documentLocale.hint',
    values: locales,
    valueTitles: locales.map((locale) => `setting.uiLocale.${locale}` as const),
    defaultValue: 'en',
    scope: 'document',
  },
  {
    id: documentSettingIds.headStyle,
    title: 'setting.headStyle',
    values: ['title', 'shape'],
    valueTitles: ['setting.headStyle.title', 'setting.headStyle.shape'],
    defaultValue: 'title',
    scope: 'document',
  },
  {
    // R-FMT-10: a document setting, since it changes the file and goes with it (ADR-0018).
    id: documentSettingIds.textOutlines,
    title: 'setting.textOutlines',
    hint: 'setting.textOutlines.hint',
    values: [false, true],
    defaultValue: false,
    scope: 'document',
  },
  {
    // View state saved in the file: changing it is not an undo step (interaction rules "실행 취소").
    id: documentSettingIds.resultSymbol,
    title: 'setting.resultSymbol',
    hint: 'setting.resultSymbol.hint',
    values: resultSymbols,
    defaultValue: '←',
    scope: 'document',
  },
  {
    // The drawing's colors (R-LAY-08, R-NFR-07, visual design 8): saved, so undoable (UX TM3).
    id: documentSettingIds.theme,
    title: 'setting.theme',
    hint: 'setting.theme.hint',
    values: themeIds,
    valueTitles: themeIds.map((id) => `setting.theme.${id}` as const),
    defaultValue: 'default',
    scope: 'document',
  },
];

/**
 * The settings with the screen language's default set to `inUse`, the language shown while the
 * user has not chosen one (the browser's, core `screenLocale`). `settingSpecs` says English, the
 * language when nothing else is known.
 */
export function specsWithScreenLocale(inUse: Locale): ReadonlyArray<SettingSpec> {
  return settingSpecs.map((spec) =>
    spec.id === settingIds.locale ? { ...spec, defaultValue: inUse } : spec,
  );
}

/** The header shape a new document starts with: the one chosen last, or "title" (UX HS1). */
export function rememberedHeadStyle(settings: SettingsStore): Settings['headStyle'] {
  return settings.get<string>(settingIds.headStyle) === 'shape' ? 'shape' : 'title';
}

/** The settings with one document setting changed, or `null` if the value is not allowed. */
export function changedSettings(settings: Settings, id: string, value: unknown): Settings | null {
  switch (id) {
    case documentSettingIds.headStyle:
      return value === 'shape' || value === 'title' ? { ...settings, headStyle: value } : null;
    case documentSettingIds.locale:
      return isLocale(value) ? { ...settings, locale: value } : null;
    case documentSettingIds.theme:
      return typeof value === 'string' && isKnownTheme(value)
        ? { ...settings, theme: value }
        : null;
    case documentSettingIds.textKind:
      return isTextKind(value) ? { ...settings, textKind: value } : null;
    case documentSettingIds.textOutlines: {
      if (typeof value !== 'boolean') {
        return null;
      }
      // Absent is off; the file leaves the key out when off (01-file-format 3.3).
      return value === (settings.textOutlines === true)
        ? settings
        : { ...settings, textOutlines: value };
    }
    default:
      return null;
  }
}
