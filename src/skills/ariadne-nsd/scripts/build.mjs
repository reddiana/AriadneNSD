// Builds the skill's script (vite.config.ts), then zips the skill folder for claude.ai's upload
// (Settings › Capabilities › Skills): dist/ariadne-nsd.zip, with the folder ariadne-nsd/ at its root.
// The skill folder is plugin/skills/ariadne-nsd/, the place a Claude Code plugin keeps its skill,
// so the zip and the plugin marketplace (.claude-plugin/ at the repository's top) ship the same files.
// CI runs this for each GitHub Release and attaches the zip (.github/workflows/release.yml).
import { mkdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { build } from 'vite';

import { skillEntries, zip } from './zip-skill.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
await build({ configFile: join(root, 'vite.config.ts') });

const skill = join(root, 'plugin/skills/ariadne-nsd');
const script = join(skill, 'scripts/nsd.mjs');
console.log(
  `plugin/skills/ariadne-nsd/scripts/nsd.mjs: ${(statSync(script).size / 1024).toFixed(0)} KiB`,
);

const entries = skillEntries(skill);
mkdirSync(join(root, 'dist'), { recursive: true });
const zipPath = join(root, 'dist/ariadne-nsd.zip');
writeFileSync(zipPath, zip(entries));
console.log(`dist/ariadne-nsd.zip: ${(statSync(zipPath).size / 1024).toFixed(0)} KiB`);
