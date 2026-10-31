// The page-wide events of the shell: dropping a file to open it (06-web 1) and leaving the page
// with unsaved changes (06-web 7).

import type { WebShell } from './web-shell';

/** Whether a drag carries files (not a block dragged inside the diagram). */
export function isFileDrag(transfer: DataTransfer | null): transfer is DataTransfer {
  return transfer?.types.includes('Files') === true;
}

/**
 * Listens for file drops on the whole page. `onDragging` is told when a file is over the page,
 * to show the drop hint. Returns a function that stops listening.
 */
export function watchFileDrops(
  shell: Pick<WebShell, 'openDropped'>,
  onDragging: (isDragging: boolean) => void,
): () => void {
  let depth = 0;
  const enter = (event: DragEvent): void => {
    if (isFileDrag(event.dataTransfer)) {
      depth += 1;
      onDragging(true);
    }
  };
  const leave = (event: DragEvent): void => {
    if (isFileDrag(event.dataTransfer)) {
      depth = Math.max(0, depth - 1);
      if (depth === 0) {
        onDragging(false);
      }
    }
  };
  const over = (event: DragEvent): void => {
    if (isFileDrag(event.dataTransfer)) {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'copy';
    }
  };
  const drop = (event: DragEvent): void => {
    if (!isFileDrag(event.dataTransfer)) {
      return;
    }
    event.preventDefault();
    depth = 0;
    onDragging(false);
    shell.openDropped(event.dataTransfer);
  };
  window.addEventListener('dragenter', enter);
  window.addEventListener('dragleave', leave);
  window.addEventListener('dragover', over);
  window.addEventListener('drop', drop);
  return () => {
    window.removeEventListener('dragenter', enter);
    window.removeEventListener('dragleave', leave);
    window.removeEventListener('dragover', over);
    window.removeEventListener('drop', drop);
  };
}

/**
 * Before the page goes: writes the pending backup, and asks the browser's "Leave site?" when the
 * document is not saved (06-web 7). The backup keeps the edits either way.
 */
export function watchPageExit(shell: Pick<WebShell, 'suspend' | 'isDirty' | 'dispose'>): void {
  window.addEventListener('beforeunload', (event) => {
    shell.suspend();
    if (shell.isDirty()) {
      event.preventDefault();
    }
  });
  window.addEventListener('pagehide', (event) => {
    shell.suspend();
    if (!event.persisted) {
      shell.dispose();
    }
  });
}
