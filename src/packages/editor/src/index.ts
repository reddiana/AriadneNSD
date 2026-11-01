// The public API of @ariadne-nsd/editor.

export { editorVersion } from './version';
export * from './ui';

// The editor engine (03-editor): making an editor and the contracts with the shell (6).
export type { EditorOptions, ReadDocument } from './create-editor';
export {
  createEditor,
  documentSettingIds,
  readDocument,
  rememberedHeadStyle,
  settingIds,
  settingSpecs,
} from './create-editor';
export type {
  Appearance,
  ChromeState,
  CommandContext,
  CommandRegistry,
  CommandSpec,
  DocStatus,
  DocumentStore,
  EditorHandle,
  MenuId,
  MenuPlace,
  Notice,
  OpenedDocument,
  Picker,
  PickerItem,
  Question,
  SaveFonts,
  SettingSpec,
  SettingsSchema,
  SettingsStore,
  SubmenuId,
  ToolbarBlockKind,
  ToolbarPlace,
  WriteResult,
} from './contracts';

// State and selection (03-editor 2).
export type { Caret, EditField, Editing, EditorState } from './state/editor-state';
export { clampZoom, zoomRange } from './state/editor-state';
export type { SeqRef, Selection, SelectionKind } from './state/selection';

// Messages (coding guide 8). The UI and the shells format the editor's messages with these.
export type { EditorMessage, Message, MessageKey, MessageParams } from './i18n/messages';
export { formatMessage, isMessageKey, message } from './i18n/messages';

// The key table (03-keymap) and the clipboard formats (03-editor 3.3).
export type { KeyBinding } from './input/keys';
export { keyBindings, keysOf, strokeOf } from './input/keys';
export type { ClipboardData } from './clipboard/clip-format';
export { clipMimeType } from './clipboard/clip-format';
export type { ClipboardPort } from './session/session';

// The examples a user can open as a new document (R-EDIT-25).
export type { ExampleInfo, ExampleText } from './examples/examples';
export { examples } from './examples/examples';
