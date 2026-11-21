// The script's command line (R-SKILL-01): each command reads any input, prints what a model or a
// person acts on, and fails with the parser's detail and a next step, exit code 1 for a bad
// document and 2 for a bad command line.
import { openSvgFile } from '@ariadne-nsd/core';
import { describe, expect, it } from 'vitest';

import type { Io } from './cli';
import { run } from './cli';
import { maxModel, nodeFonts } from './test-support';

type Ran = {
  readonly code: number;
  readonly out: string;
  readonly err: string;
  readonly files: Map<string, string>;
};

/** Runs a command line against files in memory and the text on stdin. */
async function runWith(
  args: ReadonlyArray<string>,
  files: Readonly<Record<string, string>> = {},
  stdin = '',
): Promise<Ran> {
  const written = new Map(Object.entries(files));
  let out = '';
  let err = '';
  const io: Io = {
    readFile: async (path) => {
      const text = written.get(path);
      if (text === undefined) {
        throw new Error(`ENOENT: ${path}`);
      }
      return Promise.resolve(text);
    },
    readStdin: async () => Promise.resolve(stdin),
    writeFile: async (path, text) => {
      written.set(path, text);
      return Promise.resolve();
    },
    out: (text) => {
      out += text;
    },
    err: (text) => {
      err += text;
    },
    fonts: nodeFonts,
  };
  const code = await run(args, io);
  return { code, out, err, files: written };
}

describe('the commands', () => {
  it('T-1464 · R-SKILL-01: check prints the size and the next free ids, as text or JSON', async () => {
    expect(await runWith(['check', 'max.json'], { 'max.json': maxModel })).toMatchObject({
      code: 0,
      out: 'OK: 1 diagram(s), 6 block(s). Next free ids: d2 b7 r3 f1\n',
    });
    const json = await runWith(['check', '--json'], {}, maxModel);
    expect(JSON.parse(json.out)).toMatchObject({ ok: true, name: 'max.ns.svg', blocks: 6 });
  });

  it('T-1465 · R-SKILL-01: save writes the file named by -o, --name or the first Method, and link and read take it back', async () => {
    const saved = await runWith(['save', 'max.json'], { 'max.json': maxModel });
    expect(saved.code).toBe(0);
    expect(saved.out).toMatch(/^Saved max\.ns\.svg \(\d+ bytes\)\n$/);
    const file = saved.files.get('max.ns.svg') ?? '';
    expect(openSvgFile(file)).toMatchObject({ ok: true });
    const named = await runWith(['save', '--name', '최댓값.ns.svg'], {}, maxModel);
    expect([...named.files.keys()]).toEqual(['최댓값.ns.svg']);
    const out = await runWith(['save', '-', '-o', 'docs/m.ns.svg'], {}, maxModel);
    expect([...out.files.keys()]).toEqual(['docs/m.ns.svg']);

    const link = await runWith(['link', 'max.ns.svg'], { 'max.ns.svg': file });
    expect(link.out).toMatch(/^https:\/\/ariadnensd\.com\/#ns1\.d\.[\w-]+\n$/);
    const read = await runWith(['read', link.out.trim()]);
    expect(JSON.parse(read.out)).toEqual(JSON.parse(maxModel));
    const envelope = await runWith(['read', link.out.trim(), '--envelope']);
    expect(JSON.parse(envelope.out)).toEqual({
      name: 'max.ns.svg',
      model: JSON.parse(maxModel) as unknown,
    });
  });

  it('T-1466 · R-SKILL-01: link --json gives the url and its length', async () => {
    const link = await runWith(['link', '--json', '--name', 'a.ns.svg'], {}, maxModel);
    const result = JSON.parse(link.out) as { url: string; length: number; name: string };
    expect(result.name).toBe('a.ns.svg');
    expect(result.length).toBe(result.url.length);
  });
});

describe('failures', () => {
  it('T-1467 · R-SKILL-01: a bad model fails with exit code 1, the parser’s detail and what to do next', async () => {
    const broken = maxModel.replace('"text":"return m"', '"text":"return m","extra":1');
    const text = await runWith(['check'], {}, broken);
    expect(text.code).toBe(1);
    expect(text.out).toBe('');
    expect(text.err).toMatch(/^Error \(damaged\): .*unknown key "extra"\nThe model breaks a rule/);
    const json = await runWith(['link', '--json'], {}, broken);
    expect(json.code).toBe(1);
    expect(JSON.parse(json.out)).toMatchObject({ ok: false, reason: 'damaged' });
    const missing = await runWith(['read', 'nothing.json']);
    expect(missing).toMatchObject({
      code: 1,
      err: expect.stringContaining('cannot read nothing.json') as unknown,
    });
  });

  it('T-1468: a bad command line fails with exit code 2 and the usage; help prints it', async () => {
    for (const args of [['draw'], ['check', '--colour'], ['save', '-o'], ['read', 'a', 'b']]) {
      const ran = await runWith(args);
      expect(ran.code, args.join(' ')).toBe(2);
      expect(ran.err, args.join(' ')).toContain('Usage: node nsd.mjs');
    }
    for (const args of [[], ['--help'], ['help']]) {
      expect(await runWith(args)).toMatchObject({
        code: 0,
        out: expect.stringContaining('Commands:') as unknown,
      });
    }
  });
});
