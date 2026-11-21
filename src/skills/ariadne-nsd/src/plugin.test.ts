// The skill ships two ways (docs/04-design/07-claude-skill.md): the zip on each GitHub Release for
// claude.ai, and this repository as a Claude Code plugin marketplace. The marketplace
// (.claude-plugin/marketplace.json at the repository's top) points at the plugin folder, and the
// plugin keeps the skill where Claude Code looks for it, so both ship the same SKILL.md.
import { existsSync, readFileSync } from 'node:fs';
import { inflateRawSync } from 'node:zlib';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { skillEntries, zip } from '../scripts/zip-skill.mjs';

const pkg = fileURLToPath(new URL('../', import.meta.url));
const repository = resolve(pkg, '../../..');
const json = (path: string): Record<string, unknown> =>
  JSON.parse(readFileSync(path, 'utf8')) as Record<string, unknown>;

/** A plugin or marketplace name: kebab-case, as Claude Code's validator advises. */
const kebab = /^[a-z0-9]+(-[a-z0-9]+)*$/;

type Entry = { readonly name?: unknown; readonly source?: unknown; readonly version?: unknown };

describe('the plugin marketplace', () => {
  it('T-1474 · R-SKILL-01: the marketplace lists the plugin, the plugin holds the skill’s SKILL.md, and its version is the package’s', () => {
    const marketplace = json(join(repository, '.claude-plugin/marketplace.json'));
    expect(marketplace.name).toMatch(kebab);
    expect(marketplace).toMatchObject({ owner: { name: expect.any(String) as unknown } });
    const plugins = marketplace.plugins as ReadonlyArray<Entry>;
    expect(plugins.map((entry) => entry.name)).toEqual(['ariadne-nsd']);
    const [entry] = plugins;
    // A relative source starts with ./ and is read from the repository's top.
    expect(entry?.source).toBe('./src/skills/ariadne-nsd/plugin');
    // The version lives in plugin.json only: Claude Code takes plugin.json's over the entry's.
    expect(entry).not.toHaveProperty('version');
    const plugin = resolve(repository, String(entry?.source));
    expect(plugin).toBe(resolve(pkg, 'plugin'));

    const manifest = json(join(plugin, '.claude-plugin/plugin.json'));
    expect(manifest.name).toBe('ariadne-nsd');
    expect(manifest.description).toEqual(expect.any(String));
    expect(manifest.version).toBe(json(join(pkg, 'package.json')).version);

    // Claude Code finds a plugin's skills at skills/<name>/SKILL.md; the zip is made of this folder.
    const skill = readFileSync(join(plugin, 'skills/ariadne-nsd/SKILL.md'), 'utf8');
    expect(/^---\r?\nname: (.+)$/m.exec(skill)?.[1]).toBe('ariadne-nsd');
    expect(existsSync(join(plugin, 'skills/ariadne-nsd/scripts/nsd.mjs'))).toBe(true);
  });
});

/** The names and contents of a zip's entries (read from its central directory). */
function unzip(archive: Buffer): Map<string, Buffer> {
  const end = archive.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  const count = archive.readUInt16LE(end + 10);
  const files = new Map<string, Buffer>();
  let at = archive.readUInt32LE(end + 16);
  for (let i = 0; i < count; i++) {
    const packedSize = archive.readUInt32LE(at + 20);
    const nameLength = archive.readUInt16LE(at + 28);
    const extraLength = archive.readUInt16LE(at + 30);
    const commentLength = archive.readUInt16LE(at + 32);
    const local = archive.readUInt32LE(at + 42);
    const name = archive.toString('utf8', at + 46, at + 46 + nameLength);
    const dataAt = local + 30 + archive.readUInt16LE(local + 26) + archive.readUInt16LE(local + 28);
    files.set(name, inflateRawSync(archive.subarray(dataAt, dataAt + packedSize)));
    at += 46 + nameLength + extraLength + commentLength;
  }
  return files;
}

describe('the license files in the skill folder', () => {
  // The OFL requires its license text to travel with the bundled font (nsd.mjs embeds D2Coding).
  const skill = join(pkg, 'plugin/skills/ariadne-nsd');
  const sources = {
    'OFL.txt': join(repository, 'src/packages/fonts/assets/OFL.txt'),
    LICENSE: join(repository, 'LICENSE'),
    NOTICE: join(repository, 'NOTICE'),
  };

  it('T-1475 · R-SKILL-01: OFL.txt, LICENSE and NOTICE are byte-identical copies of their sources, and the zip contains them', () => {
    const inZip = unzip(zip(skillEntries(skill)));
    for (const [name, source] of Object.entries(sources)) {
      const original = readFileSync(source);
      expect(readFileSync(join(skill, name)).equals(original), `${name} is a copy`).toBe(true);
      expect(inZip.get(`ariadne-nsd/${name}`)?.equals(original), `${name} is in the zip`).toBe(
        true,
      );
    }
  });
});
