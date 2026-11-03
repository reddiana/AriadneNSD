// The share link (R-WEB-05, ADR-0043): the whole document, compressed, in the URL's fragment.
// The fragment never reaches the server, so a static site can open it (R-WEB-01).
//
//   https://ariadnensd.com/#ns1.d.<base64url>
//
// `ns1` is the link format's version, `d` the packing (deflate-raw; `j` is the same JSON without
// compression, for a browser without CompressionStream), and the rest the packed bytes in
// base64url. The bytes are UTF-8 JSON: `{ "name": "…", "model": { …model JSON… } }`.
// The link is input from anyone: its length is checked before it is unpacked, the unpacked size
// is capped while it streams (a small link must not unpack to gigabytes), and the model goes
// through the same validating parser as a file (`parseModel` in the shell).

/** What a share link fragment starts with: the format name and its version. */
export const shareLinkPrefix = 'ns1.';

/** Links longer than this are copied with a warning: some apps cut long links (UX SH2). */
export const longShareLinkLength = 8 * 1024;

/** Links longer than this are not made or opened: browsers and apps do not carry them. */
export const maxShareLinkLength = 1024 * 1024;

/** The most bytes a link may unpack to (the zip bomb guard). Far above any real document. */
export const maxUnpackedBytes = 16 * 1024 * 1024;

/** How the JSON is packed: deflate-raw, or as it is. */
export type Packing = 'd' | 'j';

/** Compresses and decompresses with deflate-raw. `null`: this browser has no streams for it. */
export type Deflate = {
  readonly compress: (bytes: Uint8Array) => Promise<Uint8Array>;
  /** Stops with `null` as soon as the output would be larger than `limit` bytes. */
  readonly decompress: (bytes: Uint8Array, limit: number) => Promise<Uint8Array | null>;
};

/** Why a fragment could not be read as a share link. */
export type ShareLinkFailure =
  /** Not a share link of any version: the page opens as usual. */
  | 'notShareLink'
  /** A share link of a newer format: reload (a newer page) and open it again. */
  | 'newerVersion'
  /** Longer than `maxShareLinkLength`, or unpacks to more than `maxUnpackedBytes`. */
  | 'tooLarge'
  /** Packed with deflate-raw, and this browser cannot unpack it. */
  | 'unsupported'
  /** Cut off or changed: the bytes or the JSON do not read. */
  | 'damaged';

/** A share link's content: the document's name and its model (still to be validated). */
export type SharedContent = { readonly name: string; readonly model: unknown };

export type ReadShareLink =
  | ({ readonly ok: true } & SharedContent)
  | { readonly ok: false; readonly reason: ShareLinkFailure; readonly detail: string };

/** Deflate-raw with the browser's CompressionStream, or `null` where there is none. */
export function browserDeflate(): Deflate | null {
  if (typeof CompressionStream === 'undefined' || typeof DecompressionStream === 'undefined') {
    return null;
  }
  return {
    compress: async (bytes) => {
      const stream = new Blob([bytes as Uint8Array<ArrayBuffer>])
        .stream()
        .pipeThrough(new CompressionStream('deflate-raw'));
      return new Uint8Array(await new Response(stream).arrayBuffer());
    },
    decompress: async (bytes, limit) => {
      const stream = new Blob([bytes as Uint8Array<ArrayBuffer>])
        .stream()
        .pipeThrough(new DecompressionStream('deflate-raw'));
      return readAtMost(stream, limit);
    },
  };
}

/** Reads a byte stream to its end, or stops and returns `null` once it passes `limit` bytes. */
async function readAtMost(
  stream: ReadableStream<Uint8Array>,
  limit: number,
): Promise<Uint8Array | null> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    total += value.length;
    if (total > limit) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  return bytes;
}

/**
 * Makes the fragment (without `#`) of a share link for a document: its model JSON (the editor's
 * snapshot) and its name. Packed with deflate-raw when the browser can, otherwise as it is.
 */
export async function writeShareLink(
  modelJson: string,
  name: string,
  deflate: Deflate | null,
): Promise<string> {
  // Without the snapshot's indentation: shorter, and the same model.
  const json = JSON.stringify({ name, model: JSON.parse(modelJson) as unknown });
  const bytes = new TextEncoder().encode(json);
  if (deflate === null) {
    return `${shareLinkPrefix}j.${toBase64Url(bytes)}`;
  }
  return `${shareLinkPrefix}d.${toBase64Url(await deflate.compress(bytes))}`;
}

/** Whether a fragment (without `#`) is meant as a share link of some version: `ns` + a number. */
export function isShareLink(fragment: string): boolean {
  return /^ns\d+\./.test(fragment);
}

/**
 * Reads a share link's fragment (without `#`). Checks the length first, unpacks with the size
 * cap, then reads the JSON envelope. The model inside is not checked here: the caller passes it
 * to the file format's parser, as for a file.
 */
export async function readShareLink(
  fragment: string,
  deflate: Deflate | null,
): Promise<ReadShareLink> {
  if (!isShareLink(fragment)) {
    return failure('notShareLink', 'the fragment is not a share link');
  }
  if (!fragment.startsWith(shareLinkPrefix)) {
    return failure(
      'newerVersion',
      `unknown link version ${fragment.slice(0, fragment.indexOf('.'))}`,
    );
  }
  if (fragment.length > maxShareLinkLength) {
    return failure('tooLarge', `the link is ${String(fragment.length)} characters long`);
  }
  const rest = fragment.slice(shareLinkPrefix.length);
  const packing = rest.slice(0, 2);
  if (packing !== 'd.' && packing !== 'j.') {
    return failure('damaged', `unknown packing "${rest.slice(0, 1)}"`);
  }
  const packed = fromBase64Url(rest.slice(2));
  if (packed === null) {
    return failure('damaged', 'the link is not base64url');
  }
  let bytes: Uint8Array | null = packed;
  if (packing === 'd.') {
    if (deflate === null) {
      return failure('unsupported', 'this browser has no DecompressionStream');
    }
    try {
      bytes = await deflate.decompress(packed, maxUnpackedBytes);
    } catch (error) {
      return failure('damaged', `the link does not unpack: ${String(error)}`);
    }
  }
  if (bytes === null) {
    return failure('tooLarge', `the link unpacks to more than ${String(maxUnpackedBytes)} bytes`);
  }
  return readEnvelope(bytes);
}

function readEnvelope(bytes: Uint8Array): ReadShareLink {
  let value: unknown;
  try {
    value = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
  } catch (error) {
    return failure('damaged', `the link's JSON does not read: ${String(error)}`);
  }
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return failure('damaged', 'the link does not hold an object');
  }
  const keys = Object.keys(value).sort().join(',');
  if (keys !== 'model,name' || !('name' in value) || !('model' in value)) {
    return failure('damaged', `the link holds the keys ${keys}`);
  }
  const { name, model } = value;
  if (typeof name !== 'string') {
    return failure('damaged', 'the name is not a string');
  }
  return { ok: true, name, model };
}

function failure(reason: ShareLinkFailure, detail: string): ReadShareLink {
  return { ok: false, reason, detail };
}

/** The share link: this page's address (without query) with the fragment. */
export function shareLinkUrl(
  page: { readonly origin: string; readonly pathname: string },
  fragment: string,
): string {
  return `${page.origin}${page.pathname}#${fragment}`;
}

/** Bytes as base64url without padding (RFC 4648 5): the URL-safe letters only. */
export function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  // In pieces: `String.fromCharCode(...bytes)` overflows the call stack for large arrays.
  for (let start = 0; start < bytes.length; start += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(start, start + 0x8000));
  }
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}

/** base64url (with or without padding) back to bytes, or `null` if it has other characters. */
export function fromBase64Url(text: string): Uint8Array | null {
  if (!/^[A-Za-z0-9_-]*={0,2}$/.test(text) || text.replace(/=+$/, '').length % 4 === 1) {
    return null;
  }
  const binary = atob(text.replace(/=+$/, '').replaceAll('-', '+').replaceAll('_', '/'));
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}
