// The command line's world in Node: files, stdin, stdout and stderr.
import { readFile, writeFile } from 'node:fs/promises';

import type { Io } from './cli';
import type { SaveFonts } from './engine';

/** Node's files and streams, with the fonts from `loadFonts` (loaded once, when save needs them). */
export function nodeIo(loadFonts: () => Promise<SaveFonts>): Io {
  let fonts: Promise<SaveFonts> | null = null;
  return {
    readFile: async (path) => readFile(path, 'utf8'),
    readStdin: async () => {
      const chunks: Buffer[] = [];
      for await (const chunk of process.stdin) {
        chunks.push(chunk as Buffer);
      }
      return Buffer.concat(chunks).toString('utf8');
    },
    writeFile: async (path, text) => writeFile(path, text, 'utf8'),
    out: (text) => process.stdout.write(text),
    err: (text) => process.stderr.write(text),
    fonts: async () => (fonts ??= loadFonts()),
  };
}
