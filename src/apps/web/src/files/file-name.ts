// Rules for file names in the web shell (06-web 1, 7).

/** The extensions the shell opens (R-WEB-02). `.ns.svg` first: it is what new files are saved as. */
export const openableExtensions = ['.ns.svg', '.ns'] as const;

/** The extension of a new file. An SVG viewer can show it; we open it as a model (ADR-0014). */
export const savedExtension = '.ns.svg';

/** Whether a file name has one of the extensions the shell opens. Case does not matter. */
export function isOpenableName(name: string): boolean {
  const lower = name.toLowerCase();
  return openableExtensions.some((extension) => lower.endsWith(extension));
}

/** The name without `.ns.svg`, `.ns` or `.svg` (the part the user typed). */
export function baseName(name: string): string {
  const lower = name.toLowerCase();
  for (const extension of ['.ns.svg', '.ns', '.svg']) {
    if (lower.endsWith(extension) && name.length > extension.length) {
      return name.slice(0, name.length - extension.length);
    }
  }
  return name;
}

/**
 * The name to save a document under: keeps `.ns.svg` or `.ns` if the name has one, otherwise
 * adds `.ns.svg`. A plain `.svg` becomes `.ns.svg`, so the file opens again as a model.
 * Characters that file systems refuse are replaced with `_`; an empty name becomes `fallback`.
 */
export function documentFileName(name: string, fallback: string): string {
  const cleaned = cleanFileName(name);
  if (cleaned === '') {
    return `${cleanFileName(fallback)}${savedExtension}`;
  }
  return isOpenableName(cleaned) ? cleaned : `${baseName(cleaned)}${savedExtension}`;
}

/** The name of the exported PNG: `예제.ns.svg` → `예제.png`. */
export function pngFileName(documentName: string): string {
  return exportFileName(documentName, 'png');
}

/**
 * The name of an exported file: the document's name with the export's extension
 * (`예제.ns.svg` → `예제.png`, `예제.svg`, `예제.pdf`). The pure SVG is `.svg`, not `.ns.svg`: it
 * has no model and does not open as a document (R-EXP-02).
 */
export function exportFileName(documentName: string, kind: 'png' | 'svg' | 'pdf'): string {
  return `${baseName(documentName)}.${kind}`;
}

/** The browser tab title: `● 예제.ns.svg – AriadneNSD` when unsaved (06-web 7, UX W3). */
export function windowTitle(documentName: string, isDirty: boolean, appName: string): string {
  return `${isDirty ? '● ' : ''}${documentName} – ${appName}`;
}

// Windows refuses these; other systems refuse a subset of them.
function cleanFileName(name: string): string {
  return (
    name
      .trim()
      // eslint-disable-next-line no-control-regex -- control characters are not allowed in file names.
      .replaceAll(/[\u0000-\u001f<>:"/\\|?*]/g, '_')
      .replace(/[. ]+$/, '')
  );
}
