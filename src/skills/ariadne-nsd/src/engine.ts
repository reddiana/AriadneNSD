// What the skill's script does with a document (R-SKILL-01): read it from wherever it comes (model
// JSON, a share link's envelope, a share link, a saved file), check it with the app's parser, and
// write it as the app writes it: the share link of File › Copy Share Link and the saved file of
// File › Save. Every step is the app's own code (core, the fonts, the web shell's share link), so a
// file or link made here opens in the app unchanged.
import type { Content, LoadedDoc, OpenFailureReason } from '@ariadne-nsd/core';
import {
  assembleSvgFile,
  contentIds,
  createIdGenerator,
  headName,
  openSvgFile,
  parseModel,
  renderDoc,
  savedDrawing,
  serializeModelJson,
} from '@ariadne-nsd/core';
import type { Subsetter } from '@ariadne-nsd/fonts';
import { blockFont, readGlyphOutlines } from '@ariadne-nsd/fonts';
import {
  bracketHint,
  browserDeflate,
  isShareLink,
  longShareLinkLength,
  maxShareLinkLength,
  readShareLink,
  shareLinkUrl,
  writeShareLink,
} from '@ariadne-nsd/web/share-link';

/** The page the links open: the site's root, as in /llms.txt. */
export const defaultBase = 'https://ariadnensd.com/';

/** The font and the subsetter the saved file's font subset is made with (ADR-0026, ADR-0039). */
export type SaveFonts = { readonly ttf: Uint8Array; readonly subsetter: Subsetter };

/** What a source held: a document, and the name it came with (a link's or a file's), if any. */
export type Source = { readonly loaded: LoadedDoc; readonly name: string | null };

/** Why a source could not be read, in words a reader (a person or a model) can act on. */
export type SourceFailure = {
  /** The parser's reason (`damaged` …), or `notModel` for input that is no model at all. */
  readonly reason: OpenFailureReason | 'notModel' | 'link';
  readonly detail: string;
};

export type ReadSource =
  ({ readonly ok: true } & Source) | ({ readonly ok: false } & SourceFailure);

/**
 * Reads any input the skill is given: a share link (the whole URL or the part after `#`), a saved
 * file (`.ns.svg`, `.ns`), a share link's envelope `{"name", "model"}`, or model JSON.
 * `fileName` is the name of the file it was read from, if any: a saved file is named by it.
 */
export async function readSource(
  text: string,
  fileName: string | null = null,
): Promise<ReadSource> {
  const trimmed = (text.charCodeAt(0) === 0xfeff ? text.slice(1) : text).trim();
  const fragment = linkFragment(trimmed);
  if (fragment !== null) {
    const read = await readShareLink(fragment, browserDeflate());
    if (!read.ok) {
      return { ok: false, reason: 'link', detail: `${read.reason}: ${read.detail}` };
    }
    return opened(parseModel(read.model), read.name);
  }
  if (trimmed.startsWith('<')) {
    return opened(openSvgFile(trimmed), fileName === null ? null : savedName(fileName));
  }
  let value: unknown;
  try {
    value = JSON.parse(trimmed);
  } catch (error) {
    return {
      ok: false,
      reason: 'notModel',
      detail: `the JSON does not parse: ${String(error)}${bracketHint(trimmed)}`,
    };
  }
  if (isEnvelope(value)) {
    if (typeof value.name !== 'string') {
      return { ok: false, reason: 'notModel', detail: 'the envelope’s "name" is not a string' };
    }
    return opened(parseModel(value.model), value.name);
  }
  return opened(parseModel(value), null);
}

/** The part after `#` of a share link, or `null` when the text is no link. */
function linkFragment(text: string): string | null {
  if (/\s/.test(text)) {
    return null;
  }
  const hash = text.indexOf('#');
  const fragment = hash >= 0 ? text.slice(hash + 1) : text;
  return isShareLink(fragment) ? fragment : null;
}

function isEnvelope(value: unknown): value is { readonly name: unknown; readonly model: unknown } {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    Object.keys(value).sort().join(',') === 'model,name'
  );
}

function opened(result: ReturnType<typeof parseModel>, name: string | null): ReadSource {
  return result.ok
    ? { ok: true, loaded: result.value, name }
    : { ok: false, reason: result.reason, detail: result.detail };
}

/** A file path's last part: the name a saved file is known by. */
function savedName(path: string): string {
  return path.split(/[\\/]/).at(-1) ?? path;
}

/**
 * The document's file name when nothing names it: the first header's name (a Method's name
 * without its parameters), else `diagram`, with `.ns.svg`.
 */
export function defaultName(content: Content): string {
  const head = content.diagrams.find((diagram) => diagram.head !== null)?.head ?? null;
  const name =
    head === null
      ? ''
      : headName(head)
          .replace(/[\\/:*?"<>|]/g, '')
          .trim();
  return `${name === '' ? 'diagram' : name}.ns.svg`;
}

/** The model JSON as the app writes it (2-space indent, keys in the spec's order). */
export function modelText(loaded: LoadedDoc): string {
  return serializeModelJson(loaded.doc, loaded.kept);
}

/** How many diagrams and blocks a document has, and the next free id of each kind. */
export function summary(content: Content): {
  readonly diagrams: number;
  readonly blocks: number;
  readonly nextIds: Readonly<Record<'diagram' | 'block' | 'branch' | 'fold', string>>;
} {
  let blocks = 0;
  for (const id of contentIds(content)) {
    if (id.startsWith('b')) {
      blocks += 1;
    }
  }
  const ids = createIdGenerator(content);
  return {
    diagrams: content.diagrams.length,
    blocks,
    nextIds: {
      diagram: ids.next('diagram'),
      block: ids.next('block'),
      branch: ids.next('branch'),
      fold: ids.next('fold'),
    },
  };
}

export type MadeLink =
  | { readonly ok: true; readonly url: string; readonly isLong: boolean }
  | { readonly ok: false; readonly length: number };

/**
 * The share link of a document, made as File › Copy Share Link makes it (06-web 3): the app's
 * model JSON and the name in an envelope, deflate-raw, base64url, after `#ns1.d.`.
 * Links longer than the app opens are not made.
 */
export async function makeLink(
  loaded: LoadedDoc,
  name: string,
  base: string = defaultBase,
): Promise<MadeLink> {
  const fragment = await writeShareLink(modelText(loaded), name, browserDeflate());
  const page = new URL(base);
  const url = shareLinkUrl({ origin: page.origin, pathname: page.pathname }, fragment);
  if (fragment.length > maxShareLinkLength) {
    return { ok: false, length: url.length };
  }
  return { ok: true, url, isLong: url.length > longShareLinkLength };
}

/**
 * The saved file (`.ns.svg`) of a document, as File › Save writes it (03-editor 6): the drawing,
 * the model, and the block font's subset (or the text as outlines, R-FMT-10). The same steps as
 * the editor's `serializeDocument`; the same document always gives the same text (R-FMT-03).
 */
export function saveFile(loaded: LoadedDoc, fonts: SaveFonts): string {
  const { doc, kept } = loaded;
  const isOutlined = doc.content.settings.textOutlines === true;
  const drawn = savedDrawing(renderDoc(doc), isOutlined ? readGlyphOutlines(fonts.ttf) : null);
  return assembleSvgFile({
    doc,
    kept,
    drawing: drawn.svg,
    fonts:
      isOutlined && drawn.codePoints.length === 0
        ? []
        : [
            {
              family: blockFont.familyName,
              woff: fonts.subsetter.subsetToWoff(fonts.ttf, drawn.codePoints),
            },
          ],
  });
}
