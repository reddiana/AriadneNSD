// Finding the model element in a saved SVG (01-file-format 1 and 2) without a DOM parser:
// core runs without DOM and Node built-ins. This is a small, strict XML scanner that knows only
// what the file format needs. It does not resolve DTD entities or check every XML rule.

/** The SVG namespace of the root element. */
export const svgNamespace = 'http://www.w3.org/2000/svg';

/** The namespace of the model element (ADR-0035). A name, not an address. */
export const modelNamespace = 'https://github.com/reddiana/AriadneNSD';

/** The model element found in a file: its `version` attribute and its text, CDATA joined. */
export type ModelElement = {
  readonly version: string | null;
  readonly text: string;
  /** The `drawing-sha256` attribute: the fingerprint of the drawing part (R-FMT-09), if any. */
  readonly drawingSha256: string | null;
  /** Where the `<metadata>` element around it starts (`<`) and ends (after `>`) in the text. */
  readonly metadata: { readonly start: number; readonly end: number };
};

/** What the scan found. */
export type ModelElementResult =
  | { readonly ok: true; readonly element: ModelElement }
  | {
      readonly ok: false;
      readonly reason: 'noModel' | 'prototype' | 'damaged';
      readonly detail: string;
    };

type Frame = {
  readonly name: string;
  /** Prefix → namespace URI in scope. The default namespace has the prefix `''`. */
  readonly namespaces: ReadonlyMap<string, string>;
  readonly isMetadata: boolean;
  readonly isModel: boolean;
  /** Where the start tag begins. */
  readonly start: number;
};

const namePattern = /[A-Za-z_][\w.:-]*/y;
const attributePattern = /\s+([^\s=/>]+)\s*=\s*("[^"]*"|'[^']*')/y;
const tagEndPattern = /\s*(\/?)>/y;
const endTagPattern = /<\/([A-Za-z_][\w.:-]*)\s*>/y;

/**
 * Finds the model element (`ans:document`) inside `<metadata>` and returns its text.
 * Text and CDATA sections inside it are joined into one text, as an XML parser does (3.2).
 * A prototype file (`<metadata id="ariadne-nsd-model">`, ADR-0035) is told apart from a file
 * with no model, though both cannot be edited.
 */
export function findModelElement(svg: string): ModelElementResult {
  const stack: Frame[] = [];
  const found: ModelElement[] = [];
  let modelVersion: string | null = null;
  let modelSha256: string | null = null;
  let metadataStart = -1;
  let modelText: string[] | null = null;
  let isRootSeen = false;
  let isPrototypeSeen = false;
  // Text that is not XML before any root element is just not our file, rather than damaged.
  const damaged = (detail: string): ModelElementResult =>
    isRootSeen
      ? { ok: false, reason: 'damaged', detail }
      : { ok: false, reason: 'noModel', detail: `not an SVG file: ${detail}` };
  // A byte order mark (U+FEFF) may come before the XML.
  let at = svg.charCodeAt(0) === 0xfeff ? 1 : 0;

  // The metadata range is completed when the `<metadata>` element ends.
  const modelElement = (text: string, end: number): ModelElement => ({
    version: modelVersion,
    text,
    drawingSha256: modelSha256,
    metadata: { start: metadataStart, end },
  });

  const addText = (raw: string): string | null => {
    if (modelText !== null) {
      const decoded = decodeText(raw);
      if (decoded === null) {
        return 'the model element has a broken character reference';
      }
      modelText.push(decoded);
    } else if (stack.length === 0 && raw.trim() !== '') {
      return 'text outside the root element';
    }
    return null;
  };

  while (at < svg.length) {
    const open = svg.indexOf('<', at);
    const problem = addText(svg.slice(at, open === -1 ? svg.length : open));
    if (problem !== null) {
      return damaged(problem);
    }
    if (open === -1) {
      break;
    }
    if (svg.startsWith('<!--', open)) {
      const close = svg.indexOf('-->', open + 4);
      if (close === -1) {
        return damaged('a comment is not closed');
      }
      at = close + 3;
    } else if (svg.startsWith('<![CDATA[', open)) {
      const close = svg.indexOf(']]>', open + 9);
      if (close === -1) {
        return damaged('a CDATA section is not closed');
      }
      if (stack.length === 0) {
        return damaged('CDATA outside the root element');
      }
      modelText?.push(svg.slice(open + 9, close));
      at = close + 3;
    } else if (svg.startsWith('<?', open)) {
      const close = svg.indexOf('?>', open + 2);
      if (close === -1) {
        return damaged('a processing instruction is not closed');
      }
      at = close + 2;
    } else if (svg.startsWith('<!', open)) {
      const close = declarationEnd(svg, open + 2);
      if (close === -1) {
        return damaged('a declaration is not closed');
      }
      at = close + 1;
    } else if (svg.startsWith('</', open)) {
      endTagPattern.lastIndex = open;
      const match = endTagPattern.exec(svg);
      const top = stack.pop();
      if (match === null || top === undefined || match[1] !== top.name) {
        return damaged(`an end tag does not match at ${String(open)}`);
      }
      at = endTagPattern.lastIndex;
      if (top.isModel && modelText !== null) {
        found.push(modelElement(modelText.join(''), at));
        modelText = null;
      }
      if (top.isMetadata && top.start === metadataStart) {
        const last = found.at(-1);
        if (last !== undefined) {
          found[found.length - 1] = { ...last, metadata: { start: metadataStart, end: at } };
        }
      }
    } else {
      const tag = readStartTag(svg, open);
      if (tag === null) {
        return damaged(`a start tag is broken at ${String(open)}`);
      }
      at = tag.end;
      if (modelText !== null) {
        return damaged('the model element has a child element');
      }
      if (stack.length === 0) {
        if (isRootSeen) {
          return damaged('more than one root element');
        }
        isRootSeen = true;
      }
      const parent = stack.at(-1);
      const namespaces = new Map(parent?.namespaces ?? []);
      for (const [key, value] of tag.attributes) {
        if (key === 'xmlns') {
          namespaces.set('', value);
        } else if (key.startsWith('xmlns:')) {
          namespaces.set(key.slice(6), value);
        }
      }
      const { prefix, local } = splitName(tag.name);
      const namespace = namespaces.get(prefix);
      if (parent === undefined && (local !== 'svg' || namespace !== svgNamespace)) {
        return { ok: false, reason: 'noModel', detail: 'the root element is not an SVG <svg>' };
      }
      const isMetadata = local === 'metadata' && namespace === svgNamespace;
      if (isMetadata && tag.attributes.get('id') === 'ariadne-nsd-model') {
        isPrototypeSeen = true;
      }
      const isModel =
        local === 'document' && namespace === modelNamespace && parent?.isMetadata === true;
      if (isModel) {
        modelVersion = tag.attributes.get('version') ?? null;
        modelSha256 = tag.attributes.get('drawing-sha256') ?? null;
        metadataStart = parent.start;
        modelText = [];
      }
      if (tag.isEmpty) {
        if (isModel) {
          found.push(modelElement('', tag.end));
          modelText = null;
        }
      } else {
        stack.push({ name: tag.name, namespaces, isMetadata, isModel, start: open });
      }
    }
  }
  if (!isRootSeen) {
    return { ok: false, reason: 'noModel', detail: 'no root element' };
  }
  if (stack.length > 0) {
    return damaged('elements are not closed');
  }
  const [element, ...others] = found;
  if (element === undefined) {
    return isPrototypeSeen
      ? { ok: false, reason: 'prototype', detail: 'a prototype file (ADR-0035)' }
      : { ok: false, reason: 'noModel', detail: 'no model element in <metadata>' };
  }
  if (others.length > 0) {
    return damaged('more than one model element');
  }
  return { ok: true, element };
}

type StartTag = {
  readonly name: string;
  readonly attributes: ReadonlyMap<string, string>;
  readonly isEmpty: boolean;
  readonly end: number;
};

function readStartTag(svg: string, open: number): StartTag | null {
  namePattern.lastIndex = open + 1;
  const name = namePattern.exec(svg)?.[0];
  if (name === undefined) {
    return null;
  }
  let at = namePattern.lastIndex;
  const attributes = new Map<string, string>();
  for (;;) {
    attributePattern.lastIndex = at;
    const match = attributePattern.exec(svg);
    if (match === null) {
      break;
    }
    const [, key = '', quoted = ''] = match;
    const value = decodeText(quoted.slice(1, -1));
    if (value === null || attributes.has(key)) {
      return null;
    }
    attributes.set(key, value);
    at = attributePattern.lastIndex;
  }
  tagEndPattern.lastIndex = at;
  const end = tagEndPattern.exec(svg);
  if (end === null) {
    return null;
  }
  return { name, attributes, isEmpty: end[1] === '/', end: tagEndPattern.lastIndex };
}

function splitName(name: string): { readonly prefix: string; readonly local: string } {
  const colon = name.indexOf(':');
  return colon === -1
    ? { prefix: '', local: name }
    : { prefix: name.slice(0, colon), local: name.slice(colon + 1) };
}

/** Finds the `>` that ends a `<!…>` declaration, skipping a `[…]` internal subset. */
function declarationEnd(svg: string, from: number): number {
  let depth = 0;
  for (let at = from; at < svg.length; at += 1) {
    const character = svg[at];
    if (character === '[') {
      depth += 1;
    } else if (character === ']') {
      depth -= 1;
    } else if (character === '>' && depth <= 0) {
      return at;
    }
  }
  return -1;
}

const predefinedEntities: ReadonlyMap<string, string> = new Map([
  ['lt', '<'],
  ['gt', '>'],
  ['amp', '&'],
  ['quot', '"'],
  ['apos', "'"],
]);

/** Decodes the five predefined entities and character references, or `null` if one is broken. */
function decodeText(raw: string): string | null {
  if (!raw.includes('&')) {
    return raw;
  }
  const broken: string[] = [];
  const decoded = raw.replace(/&([^;&\s]*);?/g, (whole, name: string) => {
    if (!whole.endsWith(';')) {
      broken.push(whole);
      return whole;
    }
    const code = name.startsWith('#x')
      ? Number.parseInt(name.slice(2), 16)
      : name.startsWith('#')
        ? Number.parseInt(name.slice(1), 10)
        : Number.NaN;
    if (!Number.isNaN(code)) {
      if (code > 0x10ffff || !/^#(x[0-9a-fA-F]+|\d+)$/.test(name)) {
        broken.push(whole);
        return whole;
      }
      return String.fromCodePoint(code);
    }
    const entity = predefinedEntities.get(name);
    if (entity === undefined) {
      broken.push(whole);
      return whole;
    }
    return entity;
  });
  return broken.length > 0 ? null : decoded;
}
