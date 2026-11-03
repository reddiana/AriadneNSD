// Reading model JSON: docs/05-spec/01-file-format.md, sections 1, 3 and 5.
// The input comes from outside (a file), so it is `unknown` until checked (coding guide 5).
import type { Locale } from '../i18n/messages';
import { locales } from '../i18n/messages';
import { checkInvariants } from '../model/invariants';
import type {
  Arm,
  Block,
  Branch,
  CallTarget,
  Content,
  Diagram,
  FoldMark,
  Head,
  Id,
  Path,
  Seq,
  Settings,
  SiteFold,
  View,
} from '../model/types';
import { migrations } from './migrations';
import type { KeptSettings, LoadedDoc } from './model-json';
import { currentFormatVersion, formatName } from './model-json';

/**
 * Why a file cannot be edited (01-file-format 1 and 5). The original file must not be overwritten.
 * - `noModel`: no model element in the file (or not an SVG at all).
 * - `prototype`: a file written by the prototype (`version: 0`, ADR-0035). Shown like `noModel`.
 * - `damaged`: the XML or JSON is broken, or the model does not follow the format or invariants.
 * - `newerVersion`: written by a newer version of the app. The user should update the app.
 */
export type OpenFailureReason = 'noModel' | 'prototype' | 'damaged' | 'newerVersion';

/** The result of reading a file: the document, or why it cannot be edited. */
export type OpenResult =
  | { readonly ok: true; readonly value: LoadedDoc }
  | {
      readonly ok: false;
      readonly reason: OpenFailureReason;
      /** What exactly was wrong, in English, for logs and problem reports. Not for the screen. */
      readonly detail: string;
    };

/** Checks a read content and returns what is wrong, or `null`. */
export type ContentCheck = (content: Content) => string | null;

/** The check used when opening files: the model invariants 1–7 (01-model 3). No repair. */
export const invariantCheck: ContentCheck = (content) => {
  const violations = checkInvariants(content);
  return violations.length === 0
    ? null
    : violations.map((v) => `${String(v.invariant)}: ${v.message}`).join('; ');
};

/** Fails with a reason and a detail. */
export function openFailure(reason: OpenFailureReason, detail: string): OpenResult {
  return { ok: false, reason, detail };
}

/** How to read a model. */
export type ReadOptions = {
  /** Runs on the result; by default the model invariants (01-model 3). */
  readonly check?: ContentCheck;
  /**
   * The drawing language for a file without `settings.locale` (or with one this version does not
   * know): the opener's screen language (ADR-0041). Default English.
   */
  readonly locale?: Locale;
};

/** Parses model JSON text and checks it. See `parseModel`. */
export function parseModelJson(text: string, options: ReadOptions = {}): OpenResult {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch (error) {
    return openFailure('damaged', `model JSON does not parse: ${String(error)}`);
  }
  return parseModel(value, options);
}

/**
 * Checks a parsed model JSON value and turns it into a document (01-file-format 5).
 * Older versions are migrated one step at a time; newer versions are refused. Unknown keys are
 * refused too, so that opening and saving never drops something silently (QA-04).
 * `options.check` runs on the result; by default the model invariants (01-model 3). Tests of the
 * format alone may pass another.
 */
export function parseModel(value: unknown, options: ReadOptions = {}): OpenResult {
  const check = options.check ?? invariantCheck;
  if (!isRecord(value) || value.format !== formatName) {
    return openFailure('damaged', `"format" is not "${formatName}"`);
  }
  const { version } = value;
  if (!Number.isInteger(version) || typeof version !== 'number' || version < 0) {
    return openFailure('damaged', '"version" is not a whole number');
  }
  if (version === 0) {
    return openFailure('prototype', 'version 0 is the prototype format (ADR-0035)');
  }
  if (version > currentFormatVersion) {
    return openFailure(
      'newerVersion',
      `version ${String(version)} is newer than ${String(currentFormatVersion)}`,
    );
  }
  let migrated: unknown = value;
  for (let from = version; from < currentFormatVersion; from += 1) {
    const migrate = migrations.get(from);
    if (migrate === undefined) {
      return openFailure('damaged', `no migration from version ${String(from)}`);
    }
    migrated = migrate(migrated);
  }
  const reader: Reader = { problem: null, locale: options.locale ?? 'en' };
  const loaded = readDocument(reader, migrated);
  if (loaded === null) {
    return openFailure('damaged', reader.problem ?? 'unknown problem');
  }
  const problem = check(loaded.doc.content);
  if (problem !== null) {
    return openFailure('damaged', `invariant: ${problem}`);
  }
  return { ok: true, value: loaded };
}

// The reader functions return `null` on the first problem and note it in the reader.

type Reader = {
  problem: string | null;
  /** The drawing language when the file has none (ReadOptions.locale). */
  readonly locale: Locale;
};

type Fields = Readonly<Record<string, unknown>>;

function fail(reader: Reader, at: string, message: string): null {
  reader.problem ??= `${at}: ${message}`;
  return null;
}

function isRecord(value: unknown): value is Fields {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Reads an object with exactly these keys allowed. */
function readObject(
  reader: Reader,
  at: string,
  value: unknown,
  allowed: ReadonlyArray<string>,
): Fields | null {
  if (!isRecord(value)) {
    return fail(reader, at, 'is not an object');
  }
  for (const key of Object.keys(value)) {
    if (!allowed.includes(key)) {
      return fail(reader, at, `unknown key "${key}"`);
    }
  }
  return value;
}

function readString(reader: Reader, at: string, value: unknown): string | null {
  return typeof value === 'string' ? value : fail(reader, at, 'is not a string');
}

function readOptionalString(
  reader: Reader,
  at: string,
  fields: Fields,
  key: string,
): { readonly ok: boolean; readonly value?: string } {
  if (!(key in fields)) {
    return { ok: true };
  }
  const value = readString(reader, `${at}.${key}`, fields[key]);
  return value === null ? { ok: false } : { ok: true, value };
}

/** Reads an id with the prefix of its kind (01-file-format 3.3): `d`, `b`, `r` or `f`. */
function readId(reader: Reader, at: string, value: unknown, prefix: string): Id | null {
  if (typeof value !== 'string' || !new RegExp(`^${prefix}[1-9]\\d*$`).test(value)) {
    return fail(reader, at, `is not an id like "${prefix}1"`);
  }
  return value;
}

/** Reads a reference to a block id. References may dangle, so only the form is checked. */
function readBlockRef(reader: Reader, at: string, value: unknown): Id | null {
  return readId(reader, at, value, 'b');
}

function readArray<T>(
  reader: Reader,
  at: string,
  value: unknown,
  readItem: (item: unknown, itemAt: string) => T | null,
): T[] | null {
  if (!Array.isArray(value)) {
    return fail(reader, at, 'is not an array');
  }
  const items: T[] = [];
  for (const [index, item] of (value as unknown[]).entries()) {
    const read = readItem(item, `${at}[${String(index)}]`);
    if (read === null) {
      return null;
    }
    items.push(read);
  }
  return items;
}

/** Reads an array that may be left out when empty (01-file-format 3.3). */
function readOptionalArray<T>(
  reader: Reader,
  at: string,
  fields: Fields,
  key: string,
  readItem: (item: unknown, itemAt: string) => T | null,
): T[] | null {
  return key in fields ? readArray(reader, `${at}.${key}`, fields[key], readItem) : [];
}

function readDocument(reader: Reader, value: unknown): LoadedDoc | null {
  const fields = readObject(reader, 'document', value, [
    'format',
    'version',
    'settings',
    'diagrams',
    'view',
  ]);
  if (fields === null) {
    return null;
  }
  const settings = readSettings(reader, fields.settings);
  const diagrams = readArray(reader, 'diagrams', fields.diagrams, (item, at) =>
    readDiagram(reader, at, item),
  );
  const view = readView(reader, fields.view);
  if (settings === null || diagrams === null || view === null) {
    return null;
  }
  return { doc: { content: { settings: settings.settings, diagrams }, view }, kept: settings.kept };
}

function readSettings(
  reader: Reader,
  value: unknown,
): { readonly settings: Settings; readonly kept: KeptSettings } | null {
  const fields = readObject(reader, 'settings', value, [
    'textKind',
    'theme',
    'headStyle',
    'locale',
  ]);
  if (fields === null) {
    return null;
  }
  const textKind = readString(reader, 'settings.textKind', fields.textKind);
  // An unknown theme is drawn with the default theme by the renderer and kept as it is (3.3).
  const theme = readString(reader, 'settings.theme', fields.theme);
  const { headStyle } = fields;
  if (headStyle !== 'shape' && headStyle !== 'title') {
    return fail(reader, 'settings.headStyle', 'is not "shape" or "title"');
  }
  // A file without a locale (written before ADR-0041) is drawn in the opener's language.
  const written =
    'locale' in fields ? readString(reader, 'settings.locale', fields.locale) : reader.locale;
  if (textKind === null || theme === null || written === null) {
    return null;
  }
  // An unknown locale (a newer app's language) is drawn in the opener's and written back (3.3).
  const locale = knownLocale(written) ?? reader.locale;
  // v1 uses only plain. Another value is shown as plain and written back as it was (3.3).
  return {
    settings: { textKind: 'plain', theme, headStyle, locale },
    kept: {
      ...(textKind === 'plain' ? {} : { textKind }),
      ...(locale === written ? {} : { locale: { written, drawnIn: locale } }),
    },
  };
}

function knownLocale(value: string): Locale | null {
  return locales.find((locale) => locale === value) ?? null;
}

function readDiagram(reader: Reader, at: string, value: unknown): Diagram | null {
  const fields = readObject(reader, at, value, ['id', 'head', 'body', 'folds']);
  if (fields === null) {
    return null;
  }
  const id = readId(reader, `${at}.id`, fields.id, 'd');
  // A diagram without a header leaves `head` out (3.3).
  const hasHead = 'head' in fields;
  const head = hasHead ? readHead(reader, `${at}.head`, fields.head) : null;
  const body = readSeq(reader, at, fields);
  if (id === null || (hasHead && head === null) || body === null) {
    return null;
  }
  return { id, head, body };
}

function readHead(reader: Reader, at: string, value: unknown): Head | null {
  const fields = readObject(reader, at, value, ['kind', 'text']);
  if (fields === null) {
    return null;
  }
  const { kind } = fields;
  if (kind !== 'event' && kind !== 'method') {
    return fail(reader, `${at}.kind`, 'is not "event" or "method"');
  }
  const text = readString(reader, `${at}.text`, fields.text);
  return text === null ? null : { kind, text };
}

/** Reads the sequence spread over its owner: `body` (blocks) and `folds` (01-file-format 3.3). */
function readSeq(reader: Reader, at: string, fields: Fields): Seq | null {
  const blocks = readArray(reader, `${at}.body`, fields.body, (item, itemAt) =>
    readBlock(reader, itemAt, item),
  );
  const folds = readOptionalArray(reader, at, fields, 'folds', (item, itemAt) =>
    readFold(reader, itemAt, item),
  );
  if (blocks === null || folds === null) {
    return null;
  }
  return { blocks, folds };
}

function readFold(reader: Reader, at: string, value: unknown): FoldMark | null {
  const fields = readObject(reader, at, value, ['id', 'first', 'last', 'name']);
  if (fields === null) {
    return null;
  }
  const id = readId(reader, `${at}.id`, fields.id, 'f');
  const first = readBlockRef(reader, `${at}.first`, fields.first);
  const last = readBlockRef(reader, `${at}.last`, fields.last);
  const name = readOptionalString(reader, at, fields, 'name');
  if (id === null || first === null || last === null || !name.ok) {
    return null;
  }
  return { id, first, last, ...(name.value === undefined ? {} : { name: name.value }) };
}

function readSiteFold(reader: Reader, at: string, value: unknown): SiteFold | null {
  const fields = readObject(reader, at, value, ['id', 'via', 'first', 'last', 'name']);
  if (fields === null) {
    return null;
  }
  const id = readId(reader, `${at}.id`, fields.id, 'f');
  const via = readArray(reader, `${at}.via`, fields.via, (item, itemAt) =>
    readBlockRef(reader, itemAt, item),
  );
  const first = readBlockRef(reader, `${at}.first`, fields.first);
  const last = readBlockRef(reader, `${at}.last`, fields.last);
  const name = readOptionalString(reader, at, fields, 'name');
  if (id === null || via === null || first === null || last === null || !name.ok) {
    return null;
  }
  return { id, via, first, last, ...(name.value === undefined ? {} : { name: name.value }) };
}

function readBranch(reader: Reader, at: string, value: unknown): Branch | null {
  const fields = readObject(reader, at, value, ['id', 'label', 'body', 'folds']);
  if (fields === null) {
    return null;
  }
  const id = readId(reader, `${at}.id`, fields.id, 'r');
  const label = readOptionalString(reader, at, fields, 'label');
  const body = readSeq(reader, at, fields);
  if (id === null || !label.ok || body === null) {
    return null;
  }
  return { id, ...(label.value === undefined ? {} : { label: label.value }), body };
}

function readArm(reader: Reader, at: string, value: unknown): Arm | null {
  const fields = readObject(reader, at, value, ['id', 'label', 'body', 'folds']);
  if (fields === null) {
    return null;
  }
  const id = readId(reader, `${at}.id`, fields.id, 'r');
  const label = readString(reader, `${at}.label`, fields.label);
  const body = readSeq(reader, at, fields);
  if (id === null || label === null || body === null) {
    return null;
  }
  return { id, label, body };
}

function readBlock(reader: Reader, at: string, value: unknown): Block | null {
  if (!isRecord(value)) {
    return fail(reader, at, 'is not an object');
  }
  switch (value.kind) {
    case 'process': {
      const fields = readObject(reader, at, value, ['id', 'kind', 'text']);
      const id = readId(reader, `${at}.id`, value.id, 'b');
      const text = readString(reader, `${at}.text`, value.text);
      if (fields === null || id === null || text === null) {
        return null;
      }
      return { id, kind: 'process', text };
    }
    case 'if': {
      const fields = readObject(reader, at, value, ['id', 'kind', 'text', 'yes', 'no']);
      const id = readId(reader, `${at}.id`, value.id, 'b');
      const text = readString(reader, `${at}.text`, value.text);
      const yes = readBranch(reader, `${at}.yes`, value.yes);
      const no = readBranch(reader, `${at}.no`, value.no);
      if (fields === null || id === null || text === null || yes === null || no === null) {
        return null;
      }
      return { id, kind: 'if', text, yes, no };
    }
    case 'case': {
      const fields = readObject(reader, at, value, ['id', 'kind', 'text', 'arms', 'otherwise']);
      const id = readId(reader, `${at}.id`, value.id, 'b');
      const text = readString(reader, `${at}.text`, value.text);
      const arms = readArray(reader, `${at}.arms`, value.arms, (item, itemAt) =>
        readArm(reader, itemAt, item),
      );
      // A Case without a default branch leaves `otherwise` out (3.3).
      const hasOtherwise = 'otherwise' in value;
      const otherwise = hasOtherwise
        ? readBranch(reader, `${at}.otherwise`, value.otherwise)
        : null;
      if (
        fields === null ||
        id === null ||
        text === null ||
        arms === null ||
        (hasOtherwise && otherwise === null)
      ) {
        return null;
      }
      return { id, kind: 'case', text, arms, otherwise };
    }
    case 'while':
    case 'doWhile':
    case 'for': {
      const { kind } = value;
      const fields = readObject(reader, at, value, ['id', 'kind', 'text', 'body', 'folds']);
      const id = readId(reader, `${at}.id`, value.id, 'b');
      const text = readString(reader, `${at}.text`, value.text);
      const body = readSeq(reader, at, value);
      if (fields === null || id === null || text === null || body === null) {
        return null;
      }
      return { id, kind, text, body };
    }
    case 'call': {
      const fields = readObject(reader, at, value, [
        'id',
        'kind',
        'target',
        'args',
        'result',
        'siteFolds',
      ]);
      const id = readId(reader, `${at}.id`, value.id, 'b');
      const target = readTarget(reader, `${at}.target`, value.target);
      const args = readString(reader, `${at}.args`, value.args);
      const result = readString(reader, `${at}.result`, value.result);
      const siteFolds = readOptionalArray(reader, at, value, 'siteFolds', (item, itemAt) =>
        readSiteFold(reader, itemAt, item),
      );
      if (
        fields === null ||
        id === null ||
        target === null ||
        args === null ||
        result === null ||
        siteFolds === null
      ) {
        return null;
      }
      return { id, kind: 'call', target, args, result, siteFolds };
    }
    default:
      return fail(reader, `${at}.kind`, 'is not a known block kind');
  }
}

function readTarget(reader: Reader, at: string, value: unknown): CallTarget | null {
  if (!isRecord(value)) {
    return fail(reader, at, 'is not an object');
  }
  switch (value.kind) {
    case 'local': {
      const fields = readObject(reader, at, value, ['kind', 'diagram']);
      const diagram = readId(reader, `${at}.diagram`, value.diagram, 'd');
      return fields === null || diagram === null ? null : { kind: 'local', diagram };
    }
    case 'named': {
      const fields = readObject(reader, at, value, ['kind', 'name']);
      const name = readString(reader, `${at}.name`, value.name);
      return fields === null || name === null ? null : { kind: 'named', name };
    }
    case 'external': {
      const fields = readObject(reader, at, value, ['kind', 'file', 'diagram', 'lastName']);
      const file = readString(reader, `${at}.file`, value.file);
      const diagram = readId(reader, `${at}.diagram`, value.diagram, 'd');
      const lastName = readString(reader, `${at}.lastName`, value.lastName);
      if (fields === null || file === null || diagram === null || lastName === null) {
        return null;
      }
      return { kind: 'external', file, diagram, lastName };
    }
    case 'lost': {
      const fields = readObject(reader, at, value, ['kind', 'lastName', 'file']);
      const lastName = readString(reader, `${at}.lastName`, value.lastName);
      const file = readOptionalString(reader, at, value, 'file');
      if (fields === null || lastName === null || !file.ok) {
        return null;
      }
      return { kind: 'lost', lastName, ...(file.value === undefined ? {} : { file: file.value }) };
    }
    default:
      return fail(reader, `${at}.kind`, 'is not a known call target kind');
  }
}

/** Reads the view state. Ids may dangle (weak references, 01-model 2); only the form is checked. */
function readView(reader: Reader, value: unknown): View | null {
  const fields = readObject(reader, 'view', value, ['folded', 'opened', 'bands', 'resultSymbol']);
  if (fields === null) {
    return null;
  }
  const folded = readArray(reader, 'view.folded', fields.folded, (item, at) =>
    readString(reader, at, item),
  );
  const opened = readArray(reader, 'view.opened', fields.opened, (item, at) =>
    readArray(reader, at, item, (id, idAt) => readBlockRef(reader, idAt, id)),
  );
  const { bands, resultSymbol } = fields;
  if (typeof bands !== 'boolean') {
    return fail(reader, 'view.bands', 'is not true or false');
  }
  if (resultSymbol !== '←' && resultSymbol !== '=') {
    return fail(reader, 'view.resultSymbol', 'is not "←" or "="');
  }
  if (folded === null || opened === null) {
    return null;
  }
  const paths: Path[] = opened;
  return { folded, opened: paths, bands, resultSymbol };
}
