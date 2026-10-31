// The part of the engine API that the surrounding UI reads (03-editor 5 and 6, ../contracts.ts).
// The UI takes only the members it uses, so tests can give it a small fake engine and the
// compiler still checks every name against the engine's own types.

import type { EditorHandle as FullEditorHandle } from '../contracts';

export type {
  Appearance,
  ChromeState,
  CommandContext,
  CommandRegistry,
  CommandSpec,
  DocStatus,
  MenuId,
  MenuPlace,
  Notice,
  Question,
  SettingSpec,
  SettingsSchema,
  SettingsStore,
  SubmenuId,
  ToolbarBlockKind,
  ToolbarPlace,
} from '../contracts';
export type { Message } from '../i18n/messages';

/** The members of the engine's handle that the UI uses. */
export type EditorHandle = Pick<
  FullEditorHandle,
  | 'commands'
  | 'settingsSchema'
  | 'status'
  | 'onStatus'
  | 'chromeState'
  | 'onChromeState'
  | 'documentSetting'
  | 'setDocumentSetting'
  | 'startBlockDrag'
  | 'focus'
>;
