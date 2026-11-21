// The skill ships two ways (docs/04-design/07-claude-skill.md): the zip on each GitHub Release for
// claude.ai, and this repository as a Claude Code plugin marketplace. The marketplace
// (.claude-plugin/marketplace.json at the repository's top) points at the plugin folder, and the
// plugin keeps the skill where Claude Code looks for it, so both ship the same SKILL.md.
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

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
