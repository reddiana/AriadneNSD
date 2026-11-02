// The editor area's own CSS: the canvas, the layers and the inline editor (03-editor 1).
// Colors are the screen tokens of visual design 3.4 (light and dark) and the edit tokens.
import { geometry } from '@ariadne-nsd/core';
import { blockFont } from '@ariadne-nsd/fonts';

import { editColors } from './overlay';

/** The space around the paper inside the canvas (px, unzoomed). */
export const canvasMargin = 24;

const styleId = 'ariadne-nsd-editor-style';

/** The CSS of the editor area. `screenFontUrl` adds the block font for the screen (WOFF2). */
export function editorCss(screenFontUrl: string | null): string {
  const padX = geometry['space.pad-x'];
  const padY = geometry['space.pad-y'];
  const fontFace =
    screenFontUrl === null
      ? ''
      : `@font-face { font-family: "${blockFont.familyName}"; src: url("${screenFontUrl}") format("woff2"); font-weight: ${String(blockFont.weight)}; font-display: block; }\n`;
  return `${fontFace}
.ans-canvas {
  --ans-ui-bg: #eef1f6; --ans-ui-dots: #d3d9e4; --ans-ui-accent: #2c55c9;
  --ans-ui-panel: #ffffff; --ans-ui-text: #1c2230; --ans-ui-line: #d4dbe6;
  position: relative; overflow: auto; outline: none; box-sizing: border-box;
  width: 100%; height: 100%;
  /* Dragging blocks must not select the drawn text (BUG-09). The inline editor still can. */
  user-select: none; -webkit-user-select: none;
  background-color: var(--ans-ui-bg);
  background-image: radial-gradient(var(--ans-ui-dots) 1px, transparent 1px);
  background-size: 18px 18px;
}
.ans-canvas[data-scheme="dark"] {
  --ans-ui-bg: #12151b; --ans-ui-dots: #262c37; --ans-ui-accent: #8ba7ff;
  --ans-ui-panel: #1a1e26; --ans-ui-text: #e5e8ee; --ans-ui-line: #2b313c;
}
.ans-canvas.ans-is-dragging, .ans-canvas.ans-is-dragging * { cursor: grabbing; }
.ans-canvas.ans-cannot-drop, .ans-canvas.ans-cannot-drop * { cursor: not-allowed; }
.ans-sizer { position: relative; }
.ans-stage { position: absolute; left: ${String(canvasMargin)}px; top: ${String(canvasMargin)}px; transform-origin: 0 0; }
.ans-document, .ans-overlay { position: absolute; left: 0; top: 0; }
/* "The document is paper" (04-visual-design principle 4): a shadow round the paper on screen. */
.ans-document {
  border-radius: 4px; overflow: hidden;
  box-shadow: 0 1px 3px rgba(20, 30, 60, 0.12), 0 6px 20px rgba(20, 30, 60, 0.06);
}
.ans-document svg { display: block; }
.ans-overlay { pointer-events: none; overflow: visible; }
.ans-inline-editor {
  position: absolute; box-sizing: border-box; margin: 0; z-index: 1;
  user-select: text; -webkit-user-select: text;
  border: 2px solid ${editColors['edit.field']}; border-radius: 0; outline: none;
  background: #ffffff; color: #151a22; resize: none; overflow: hidden; white-space: pre;
  font: 13px/18px "${blockFont.familyName}", D2Coding, Consolas, "Malgun Gothic", monospace;
  padding: ${String(padY - 2)}px ${String(padX - 2)}px;
}
.ans-inline-editor.ans-is-rejected { border-color: ${editColors['edit.error']}; }
.ans-inline-editor::placeholder { color: #5a6476; }
.ans-drag-label {
  position: fixed; z-index: 10; pointer-events: none; padding: 2px 6px; border-radius: 4px;
  background: var(--ans-ui-panel); color: var(--ans-ui-text); border: 1px solid var(--ans-ui-line);
  font-size: 12px; white-space: nowrap;
}
`;
}

/** Puts the editor's CSS into a document once. */
export function installStyles(document: Document, screenFontUrl: string | null): void {
  if (document.getElementById(styleId) !== null) {
    return;
  }
  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = editorCss(screenFontUrl);
  document.head.append(style);
}
