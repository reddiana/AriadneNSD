// Opening and saving in Firefox and Safari, which cannot write to the original file (06-web 1):
// `<input type="file">` to open, a download to save.

import { openableExtensions } from './file-name';

/**
 * Shows the browser's file chooser and resolves with the chosen file, or `null` when the user
 * closed it. Browsers that do not fire `cancel` leave the promise pending, which is harmless.
 */
export function chooseFileWithInput(): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = [...openableExtensions, 'image/svg+xml'].join(',');
    input.style.display = 'none';
    const finish = (file: File | null): void => {
      input.remove();
      resolve(file);
    };
    input.addEventListener('change', () => {
      finish(input.files?.[0] ?? null);
    });
    input.addEventListener('cancel', () => {
      finish(null);
    });
    document.body.append(input);
    input.click();
  });
}

/** Saves `data` as a download named `name` (the browser's Downloads folder). */
export function download(name: string, data: string | Blob, type: string): void {
  const blob = typeof data === 'string' ? new Blob([data], { type }) : data;
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.style.display = 'none';
  document.body.append(link);
  link.click();
  link.remove();
  // Revoke later: some browsers start the download after the click handler returns.
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 60_000);
}

/** The media type of saved documents. */
export const documentMediaType = 'image/svg+xml';
