// The File System Access API of Chromium browsers (06-web 1). TypeScript's DOM library has the
// handles but not the pickers or permissions, so the parts we call are typed here.

import { openableExtensions } from './file-name';

type PickerType = {
  readonly description: string;
  readonly accept: Readonly<Record<string, ReadonlyArray<string>>>;
};

type PermissionMode = { readonly mode: 'read' | 'readwrite' };

type PickerWindow = {
  showOpenFilePicker(options: {
    readonly types: ReadonlyArray<PickerType>;
    readonly excludeAcceptAllOption?: boolean;
    readonly multiple?: boolean;
    readonly id?: string;
  }): Promise<FileSystemFileHandle[]>;
  showSaveFilePicker(options: {
    readonly types: ReadonlyArray<PickerType>;
    readonly suggestedName?: string;
    readonly id?: string;
  }): Promise<FileSystemFileHandle>;
};

type PermissionHandle = {
  queryPermission(mode: PermissionMode): Promise<PermissionState>;
  requestPermission(mode: PermissionMode): Promise<PermissionState>;
};

/**
 * Whether this browser can write to the original file (Chrome, Edge and other Chromium browsers).
 * Chosen once at start (06-web 1).
 */
export function hasFileSystemAccess(target: object = window): boolean {
  return 'showOpenFilePicker' in target && 'showSaveFilePicker' in target;
}

const documentType: PickerType = {
  description: 'AriadneNSD',
  // `.ns` has no registered media type; `image/svg+xml` lets the picker accept both.
  accept: { 'image/svg+xml': [...openableExtensions] },
};

const pngType: PickerType = { description: 'PNG', accept: { 'image/png': ['.png'] } };

/** The picker id: the browser remembers the last folder per id. */
const pickerId = 'ariadne-nsd';

/** What a picker returns: the handle, or `null` when the user closed it. */
export type Picked = FileSystemFileHandle | null;

/** Shows the open dialog filtered to `.ns.svg` and `.ns` (R-WEB-02). */
export async function pickFileToOpen(): Promise<Picked> {
  try {
    const [handle] = await (window as unknown as PickerWindow).showOpenFilePicker({
      types: [documentType],
      multiple: false,
      id: pickerId,
    });
    return handle ?? null;
  } catch (error) {
    return cancelledOrThrow(error);
  }
}

/** Shows the save dialog for a document. */
export async function pickDocumentToSave(suggestedName: string): Promise<Picked> {
  return pickToSave(suggestedName, documentType);
}

/** Shows the save dialog for an exported PNG. */
export async function pickPngToSave(suggestedName: string): Promise<Picked> {
  return pickToSave(suggestedName, pngType);
}

async function pickToSave(suggestedName: string, type: PickerType): Promise<Picked> {
  try {
    return await (window as unknown as PickerWindow).showSaveFilePicker({
      types: [type],
      suggestedName,
      id: pickerId,
    });
  } catch (error) {
    return cancelledOrThrow(error);
  }
}

/** The user closing a picker is an `AbortError`; that is not a failure (coding guide 5). */
function cancelledOrThrow(error: unknown): null {
  if (error instanceof DOMException && error.name === 'AbortError') {
    return null;
  }
  throw error;
}

/**
 * Asks for permission on a handle. `prompt: false` only checks (an auto save has no user
 * gesture, so the browser would refuse to ask) (06-web 2).
 */
export async function ensurePermission(
  handle: FileSystemHandle,
  mode: 'read' | 'readwrite',
  prompt: boolean,
): Promise<boolean> {
  const withPermission = handle as unknown as Partial<PermissionHandle>;
  if (withPermission.queryPermission === undefined) {
    // Browsers without the permission methods grant access for the page's lifetime.
    return true;
  }
  if ((await withPermission.queryPermission({ mode })) === 'granted') {
    return true;
  }
  if (!prompt || withPermission.requestPermission === undefined) {
    return false;
  }
  return (await withPermission.requestPermission({ mode })) === 'granted';
}

/** Writes text or bytes to a file handle, replacing what was there. */
export async function writeToHandle(
  handle: FileSystemFileHandle,
  data: string | Blob,
): Promise<void> {
  const writable = await handle.createWritable();
  try {
    await writable.write(data);
  } finally {
    await writable.close();
  }
}

/**
 * Reads the handle of a dropped file (06-web 1). Must be called during the `drop` event, before
 * any `await`: the data transfer is emptied when the event ends.
 */
export function droppedHandle(item: DataTransferItem): Promise<FileSystemHandle | null> | null {
  const withHandle = item as unknown as {
    getAsFileSystemHandle?: () => Promise<FileSystemHandle | null>;
  };
  return withHandle.getAsFileSystemHandle?.() ?? null;
}

/** Whether a handle is a file (not a folder). */
export function isFileHandle(handle: FileSystemHandle): handle is FileSystemFileHandle {
  return handle.kind === 'file';
}
