// The surrounding UI of the editor (ADR-0010). Shells render `EditorApp` around the engine.
// The engine-side types the UI reads (engine-api.ts) are not exported: the engine's own are.

export type { EditorAppProps, ExamplesHost } from './editor-app';
export { EditorApp } from './editor-app';
export { uiCommandIds } from './command-ids';
