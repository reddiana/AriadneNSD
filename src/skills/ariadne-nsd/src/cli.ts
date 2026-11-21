// The command line of `nsd.mjs`, the skill's script (R-SKILL-01). It is written for a language
// model as much as for a person: every failure says what was wrong in the parser's own words and
// what to do next, and `--json` gives the same as JSON.
import type { ReadSource, SaveFonts } from './engine';
import {
  defaultBase,
  defaultName,
  makeLink,
  modelText,
  readSource,
  saveFile,
  summary,
} from './engine';

/** What the command line needs from the world. Tests pass a fake one. */
export type Io = {
  readonly readFile: (path: string) => Promise<string>;
  readonly readStdin: () => Promise<string>;
  readonly writeFile: (path: string, text: string) => Promise<void>;
  readonly out: (text: string) => void;
  readonly err: (text: string) => void;
  readonly fonts: () => Promise<SaveFonts>;
};

export const usage = `nsd.mjs — AriadneNSD's engine for the ariadne-nsd skill (no network needed)

Usage: node nsd.mjs <command> [input] [options]

input is a file path, "-" for stdin (the default), or a share link
(https://ariadnensd.com/#ns1.… or just ns1.…). A file may hold model JSON, an
envelope {"name": "x.ns.svg", "model": {…}}, or a saved .ns.svg / .ns file.

Commands:
  check [input]            Validate with the app's own parser. Prints the size and
                           the next free ids (d, b, r, f) for adding blocks.
  link [input]             Print the share link the app makes (File › Copy Share Link).
  save [input] [-o file]   Write the saved file (.ns.svg) the app writes (File › Save).
                           Without -o: the envelope's or --name's name, else the
                           first Method's name + .ns.svg.
  read [input]             Print the model JSON (as the app writes it).
                           --envelope prints {"name", "model"} instead.

Options:
  -o, --out <file>   Where save writes.
  --name <name>      The document name in the link (default: the envelope's, the
                     file's, or the first Method's name + .ns.svg).
  --base <url>       The page links open (default ${defaultBase}).
  --json             Print the result as one JSON object (errors too).
  -h, --help         This text.

Exit codes: 0 ok, 1 the input is not a valid document (fix it and run again), 2 usage.`;

type Options = {
  readonly command: string;
  readonly input: string;
  readonly out: string | null;
  readonly name: string | null;
  readonly base: string;
  readonly isJson: boolean;
  readonly isEnvelope: boolean;
};

class UsageError extends Error {}

function parseArgs(args: ReadonlyArray<string>): Options | 'help' {
  const positional: string[] = [];
  let out: string | null = null;
  let name: string | null = null;
  let base = defaultBase;
  let isJson = false;
  let isEnvelope = false;
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index] ?? '';
    const value = (): string => {
      const next = args[index + 1];
      if (next === undefined) {
        throw new UsageError(`${arg} needs a value`);
      }
      index += 1;
      return next;
    };
    switch (arg) {
      case '-h':
      case '--help':
        return 'help';
      case '-o':
      case '--out':
        out = value();
        break;
      case '--name':
        name = value();
        break;
      case '--base':
        base = value();
        break;
      case '--json':
        isJson = true;
        break;
      case '--envelope':
        isEnvelope = true;
        break;
      default:
        if (arg.startsWith('--')) {
          throw new UsageError(`unknown option ${arg}`);
        }
        positional.push(arg);
    }
  }
  const [command, input = '-', ...rest] = positional;
  if (command === undefined || command === 'help') {
    return 'help';
  }
  if (rest.length > 0) {
    throw new UsageError(`one input only, got also: ${rest.join(' ')}`);
  }
  return { command, input, out, name, base, isJson, isEnvelope };
}

/** What to do about each kind of failure: the next step for whoever reads the message. */
const hints: Readonly<Record<string, string>> = {
  damaged:
    'The model breaks a rule of the format. Fix what the detail names (it gives the path, e.g. diagrams[0].body[2]) and run check again.',
  notModel:
    'The input is not JSON. Fix the JSON (the detail says where, and how the brackets are off) and run check again.',
  noModel:
    'This SVG holds no AriadneNSD model: it is a picture (for example File › Export › SVG), not a saved document.',
  prototype: 'This file was written by the prototype (format version 0) and cannot be opened.',
  newerVersion: 'This was written by a newer AriadneNSD; this script cannot read it.',
  link: 'The share link does not read: it may be cut off or changed. Ask for the whole link, or for the saved file.',
};

/** Runs one command line. Returns the exit code. */
export async function run(args: ReadonlyArray<string>, io: Io): Promise<number> {
  let options: Options | 'help';
  try {
    options = parseArgs(args);
  } catch (error) {
    if (error instanceof UsageError) {
      io.err(`Usage error: ${error.message}\n\n${usage}\n`);
      return 2;
    }
    throw error;
  }
  if (options === 'help') {
    io.out(`${usage}\n`);
    return 0;
  }
  const { command } = options;
  if (!['check', 'link', 'save', 'read'].includes(command)) {
    io.err(`Usage error: unknown command "${command}"\n\n${usage}\n`);
    return 2;
  }
  const isLink = /^(https?:\/\/[^\s]*#)?ns\d+\./.test(options.input);
  const fileName = options.input === '-' || isLink ? null : options.input;
  let text: string;
  try {
    text =
      fileName === null
        ? isLink
          ? options.input
          : await io.readStdin()
        : await io.readFile(fileName);
  } catch (error) {
    return fail(io, options, 'input', `cannot read ${options.input}: ${String(error)}`);
  }
  const source: ReadSource = await readSource(text, fileName);
  if (!source.ok) {
    return fail(io, options, source.reason, source.detail);
  }
  const { loaded } = source;
  const name = options.name ?? source.name ?? defaultName(loaded.doc.content);
  switch (command) {
    case 'check': {
      const facts = summary(loaded.doc.content);
      if (options.isJson) {
        io.out(`${JSON.stringify({ ok: true, name, ...facts })}\n`);
      } else {
        const next = Object.values(facts.nextIds).join(' ');
        io.out(
          `OK: ${String(facts.diagrams)} diagram(s), ${String(facts.blocks)} block(s). Next free ids: ${next}\n`,
        );
      }
      return 0;
    }
    case 'link': {
      const made = await makeLink(loaded, name, options.base);
      if (!made.ok) {
        return fail(
          io,
          options,
          'tooLong',
          `the link would be ${String(made.length)} characters, longer than the app opens. Give the user the saved file instead (save).`,
        );
      }
      if (options.isJson) {
        io.out(`${JSON.stringify({ ok: true, name, url: made.url, length: made.url.length })}\n`);
      } else {
        io.out(`${made.url}\n`);
        if (made.isLong) {
          io.err(
            `Note: the link is ${String(made.url.length)} characters long; some apps cut long links. Give the saved file too.\n`,
          );
        }
      }
      return 0;
    }
    case 'save': {
      const path = options.out ?? name;
      const text = saveFile(loaded, await io.fonts());
      await io.writeFile(path, text);
      const bytes = new TextEncoder().encode(text).length;
      if (options.isJson) {
        io.out(`${JSON.stringify({ ok: true, path, bytes })}\n`);
      } else {
        io.out(`Saved ${path} (${String(bytes)} bytes)\n`);
      }
      return 0;
    }
    default: {
      const model = modelText(loaded);
      if (options.isEnvelope || options.isJson) {
        const envelope = { name, model: JSON.parse(model) as unknown };
        io.out(`${JSON.stringify(envelope, null, options.isJson ? undefined : 2)}\n`);
      } else {
        io.out(`${model}\n`);
      }
      return 0;
    }
  }
}

function fail(io: Io, options: Options, reason: string, detail: string): number {
  const hint = hints[reason] ?? '';
  if (options.isJson) {
    io.out(`${JSON.stringify({ ok: false, reason, detail, hint })}\n`);
  } else {
    io.err(`Error (${reason}): ${detail}\n${hint === '' ? '' : `${hint}\n`}`);
  }
  return 1;
}
