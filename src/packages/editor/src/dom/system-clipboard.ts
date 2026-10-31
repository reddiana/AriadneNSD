// The system clipboard through the async Clipboard API, with the editor's own clipboard when
// the browser blocks it (03-editor 3.3). Then copying works within this tab only.
import type { ClipboardData } from '../clipboard/clip-format';
import { clipMimeType } from '../clipboard/clip-format';
import type { ClipboardPort } from '../session/session';

/** Logs why the system clipboard could not be used. */
export type ClipboardLog = (text: string, detail?: unknown) => void;

/** Makes the clipboard of a browser window. */
export function createSystemClipboard(log: ClipboardLog): ClipboardPort {
  let memory: ClipboardData | null = null;
  // A paste right after a copy (`yyp`) waits for the copy to reach the clipboard.
  let writing: Promise<unknown> = Promise.resolve();
  // `navigator.clipboard` is missing outside secure contexts, whatever the DOM types say.
  const clipboard = (): Clipboard | null =>
    typeof navigator === 'undefined' || !('clipboard' in navigator) ? null : navigator.clipboard;

  const supportsCustom = (): boolean =>
    typeof ClipboardItem !== 'undefined' &&
    'supports' in ClipboardItem &&
    ClipboardItem.supports(clipMimeType);

  const writeNow = async (data: ClipboardData): Promise<'system' | 'memory'> => {
    const system = clipboard();
    if (system === null) {
      return 'memory';
    }
    try {
      if (typeof ClipboardItem !== 'undefined') {
        const items: Record<string, Blob> = {
          'text/plain': new Blob([data.text ?? ''], { type: 'text/plain' }),
        };
        if (data.json !== null && supportsCustom()) {
          items[clipMimeType] = new Blob([data.json], { type: clipMimeType });
        }
        await system.write([new ClipboardItem(items)]);
      } else {
        await system.writeText(data.text ?? '');
      }
      return 'system';
    } catch (error) {
      log('The system clipboard refused a write; kept in memory', error);
      return 'memory';
    }
  };

  return {
    write: (data) => {
      memory = data;
      const written = writeNow(data);
      writing = written;
      return written;
    },
    read: async () => {
      await writing;
      const system = clipboard();
      const kept = memory;
      if (system === null) {
        return kept ?? { text: null, json: null };
      }
      try {
        let text: string | null = null;
        let json: string | null = null;
        if (typeof system.read === 'function') {
          for (const item of await system.read()) {
            if (json === null && item.types.includes(clipMimeType)) {
              json = await (await item.getType(clipMimeType)).text();
            }
            if (text === null && item.types.includes('text/plain')) {
              text = await (await item.getType('text/plain')).text();
            }
          }
        } else {
          text = await system.readText();
        }
        // Copied in this tab by a browser without custom formats: the model is still here.
        if (json === null && kept !== null && kept.text === text) {
          json = kept.json;
        }
        return { text, json };
      } catch (error) {
        log('The system clipboard refused a read; using memory', error);
        return kept ?? { text: null, json: null };
      }
    },
  };
}
