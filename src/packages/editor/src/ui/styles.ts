// The UI's style sheet. It lives in a string that `EditorApp` puts in a <style> element, so the
// same component works in every shell (Vite, the Obsidian plugin, tests) without a CSS loader.
// Colours are the screen colour tokens of 04-visual-design 3.4; the scheme follows the host's
// appearance (`data-scheme`), not the OS, because Obsidian has its own light/dark switch.

export const chromeCss = `
.ans-app {
  --ui-bg: #eef1f6; --ui-dots: #d3d9e4; --ui-panel: #ffffff; --ui-text: #1c2230;
  --ui-muted: #5a6476; --ui-line: #d4dbe6; --ui-accent: #2c55c9; --ui-accent-soft: #e4eafb;
  --ui-warn: #b35a10; --ui-shadow: rgba(20, 30, 60, 0.18); --ui-backdrop: rgba(20, 26, 34, 0.32);
  position: relative; display: flex; flex-direction: column; height: 100%; min-height: 0;
  background: var(--ui-bg); color: var(--ui-text);
  font-family: var(--ans-ui-font, system-ui, sans-serif); font-size: 13px; line-height: 18px;
}
.ans-app[data-scheme='dark'] {
  --ui-bg: #12151b; --ui-dots: #262c37; --ui-panel: #1a1e26; --ui-text: #e5e8ee;
  --ui-muted: #9aa3b3; --ui-line: #2b313c; --ui-accent: #8ba7ff; --ui-accent-soft: #232c45;
  --ui-warn: #f0a560; --ui-shadow: rgba(0, 0, 0, 0.5); --ui-backdrop: rgba(0, 0, 0, 0.5);
}
.ans-app *, .ans-app *::before, .ans-app *::after { box-sizing: border-box; }
.ans-app button { font: inherit; color: inherit; }
.ans-app kbd { font-family: inherit; font-size: 12px; color: var(--ui-muted); }
.ans-app :focus-visible { outline: 2px solid var(--ui-accent); outline-offset: -2px; }

.ans-menubar {
  display: flex; align-items: center; gap: 2px; height: 30px; padding: 0 8px;
  background: var(--ui-panel); border-bottom: 1px solid var(--ui-line); flex: none;
}
.ans-brand { font-weight: 600; margin-right: 10px; white-space: nowrap; }
.ans-menus { display: flex; gap: 2px; }
.ans-menu-root { position: relative; }
.ans-menu-button {
  background: none; border: 0; border-radius: 4px; padding: 3px 8px; cursor: default;
}
.ans-menu-button:hover, .ans-menu-button[aria-expanded='true'] {
  background: var(--ui-accent-soft); color: var(--ui-accent);
}
.ans-hamburger { display: none; }
.ans-file-name {
  margin-left: auto; color: var(--ui-muted); white-space: nowrap; overflow: hidden;
  text-overflow: ellipsis; min-width: 0;
}
.ans-file-name .ans-dirty { color: var(--ui-text); margin-left: 4px; }
.ans-file-name .ans-read-only { margin-left: 8px; font-size: 12px; }

.ans-dropdown {
  position: absolute; top: 100%; left: 0; z-index: 20; min-width: 220px; padding: 4px;
  background: var(--ui-panel); border: 1px solid var(--ui-line); border-radius: 6px;
  box-shadow: 0 6px 18px var(--ui-shadow); list-style: none; margin: 2px 0 0;
}
.ans-dropdown .ans-dropdown { top: -5px; left: 100%; margin: 0 0 0 2px; }
.ans-dropdown li { position: relative; }
.ans-dropdown hr { border: 0; border-top: 1px solid var(--ui-line); margin: 4px 2px; }
.ans-item {
  display: flex; align-items: center; gap: 16px; width: 100%; padding: 4px 8px;
  background: none; border: 0; border-radius: 4px; text-align: left; cursor: default;
}
.ans-item:hover, .ans-item:focus-visible, .ans-item[aria-expanded='true'] {
  background: var(--ui-accent-soft); outline: none;
}
.ans-item[aria-disabled='true'] { color: var(--ui-muted); }
.ans-item .ans-check { width: 12px; flex: none; }
.ans-item .ans-title { flex: 1; white-space: nowrap; }
.ans-item kbd, .ans-item .ans-more { margin-left: auto; white-space: nowrap; }

.ans-toolbar {
  display: flex; align-items: center; gap: 2px; min-height: 36px; padding: 3px 8px;
  background: var(--ui-panel); border-bottom: 1px solid var(--ui-line); flex: none;
  overflow-x: auto;
}
.ans-sep { width: 1px; height: 20px; margin: 0 6px; background: var(--ui-line); flex: none; }
.ans-tool {
  display: inline-flex; align-items: center; justify-content: center; gap: 3px;
  min-width: 28px; height: 28px; padding: 0 5px; background: none; border: 1px solid transparent;
  border-radius: 4px; color: var(--ui-text); flex: none; cursor: default; touch-action: none;
}
.ans-tool:hover { background: var(--ui-accent-soft); }
.ans-tool[aria-disabled='true'] { color: var(--ui-muted); }
.ans-tool[aria-disabled='true'] .ans-block-icon, .ans-tool[aria-disabled='true'] .ans-icon { opacity: 0.45; }
.ans-tool-label { font-size: 12px; }
.ans-tool-root { position: relative; }

.ans-canvas { position: relative; flex: 1; min-height: 0; overflow: hidden; }
.ans-canvas > * { width: 100%; height: 100%; }

.ans-statusbar {
  display: flex; align-items: center; gap: 12px; height: 26px; padding: 0 10px; flex: none;
  background: var(--ui-panel); border-top: 1px solid var(--ui-line); white-space: nowrap;
  overflow: hidden;
}
.ans-selection { color: var(--ui-muted); }
.ans-notice { overflow: hidden; text-overflow: ellipsis; }
.ans-notice[data-level='warn'] { color: var(--ui-warn); }
.ans-question { display: flex; align-items: center; gap: 6px; }
.ans-question button {
  padding: 1px 8px; border: 1px solid var(--ui-line); border-radius: 4px; background: var(--ui-bg);
}
.ans-question button[data-default='true'] { border-color: var(--ui-accent); color: var(--ui-accent); }
.ans-mode { margin-left: auto; color: var(--ui-accent); }
.ans-mode + .ans-mode { margin-left: 0; }

.ans-bottombar { display: none; }

.ans-keyhint {
  position: absolute; left: 12px; right: 12px; bottom: 34px; z-index: 15;
  display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 2px 18px;
  padding: 8px 12px; background: var(--ui-panel); border: 1px solid var(--ui-line);
  border-left: 3px solid var(--ui-warn); border-radius: 4px; box-shadow: 0 4px 14px var(--ui-shadow);
}
.ans-keyhint-title { grid-column: 1 / -1; color: var(--ui-muted); font-size: 12px; }
.ans-keyhint-row { display: flex; gap: 10px; }
.ans-keyhint-row kbd { min-width: 18px; color: var(--ui-accent); font-weight: 600; }

.ans-backdrop {
  position: fixed; inset: 0; z-index: 30; background: var(--ui-backdrop);
  display: flex; justify-content: center; align-items: flex-start; padding: 64px 16px 16px;
}
.ans-backdrop[data-kind='palette'] { background: transparent; padding-top: 72px; }
.ans-modal {
  width: min(640px, 100%); max-height: calc(100vh - 96px); display: flex; flex-direction: column;
  background: var(--ui-panel); color: var(--ui-text); border: 1px solid var(--ui-line);
  border-radius: 8px; box-shadow: 0 12px 32px var(--ui-shadow);
}
.ans-modal:focus-visible { outline: none; }
.ans-modal header {
  display: flex; align-items: center; padding: 10px 14px; border-bottom: 1px solid var(--ui-line);
}
.ans-modal h2 { margin: 0; font-size: 13px; font-weight: 600; flex: 1; }
.ans-modal .ans-close { background: none; border: 0; border-radius: 4px; padding: 2px 8px; }
.ans-modal .ans-close:hover { background: var(--ui-accent-soft); }
.ans-modal-body { padding: 12px 14px; overflow: auto; display: grid; gap: 10px; }
.ans-note { color: var(--ui-muted); margin: 0; }
.ans-field { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.ans-field select {
  font: inherit; color: inherit; background: var(--ui-bg); border: 1px solid var(--ui-line);
  border-radius: 4px; padding: 2px 6px;
}
.ans-keytable { width: 100%; border-collapse: collapse; }
.ans-keytable th, .ans-keytable td {
  text-align: left; padding: 3px 8px 3px 0; border-bottom: 1px solid var(--ui-line); vertical-align: top;
}
.ans-keytable th { color: var(--ui-muted); font-weight: 400; font-size: 12px; }
.ans-keytable kbd { color: var(--ui-text); }
.ans-keytable .ans-group th { padding-top: 10px; color: var(--ui-text); font-weight: 600; }

.ans-palette { width: min(560px, 100%); }
.ans-palette input {
  width: 100%; font: inherit; color: inherit; background: var(--ui-bg);
  border: 0; border-bottom: 1px solid var(--ui-line); border-radius: 8px 8px 0 0; padding: 10px 14px;
}
.ans-palette input:focus-visible { outline: none; }
.ans-palette ul { list-style: none; margin: 0; padding: 4px; max-height: 360px; overflow: auto; }
.ans-palette li {
  display: flex; gap: 12px; align-items: center; padding: 5px 10px; border-radius: 4px; cursor: default;
}
.ans-palette li[aria-selected='true'] { background: var(--ui-accent-soft); }
.ans-palette li[aria-disabled='true'] .ans-title { color: var(--ui-muted); }
.ans-palette .ans-title { flex: 1; }
.ans-palette .ans-reason { color: var(--ui-muted); font-size: 12px; }
.ans-palette kbd { margin-left: 6px; }
.ans-palette .ans-empty { color: var(--ui-muted); padding: 10px 14px; }

/* Narrow screens (06-web 7, UX MB1): the menus fold into one button, undo · redo · wrap ·
   help move to a bar at the bottom, the block icons stay. */
@media (max-width: 860px) {
  .ans-menus { display: none; }
  .ans-hamburger { display: block; }
  .ans-brand { display: none; }
  .ans-toolbar { flex-wrap: wrap; }
  .ans-toolbar .ans-wide-only { display: none; }
  .ans-bottombar {
    display: flex; justify-content: space-around; align-items: center; height: 40px; flex: none;
    background: var(--ui-panel); border-top: 1px solid var(--ui-line);
  }
  .ans-bottombar .ans-dropdown { top: auto; bottom: 100%; margin: 0 0 2px; }
  .ans-keyhint { bottom: 72px; }
}
`;
