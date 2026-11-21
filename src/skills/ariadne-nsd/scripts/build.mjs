// Builds the skill's script (vite.config.ts), then zips the skill folder for claude.ai's upload
// (Settings › Capabilities › Skills): dist/ariadne-nsd.zip, with the folder ariadne-nsd/ at its root.
// The skill folder is plugin/skills/ariadne-nsd/, the place a Claude Code plugin keeps its skill,
// so the zip and the plugin marketplace (.claude-plugin/ at the repository's top) ship the same files.
// CI runs this for each GitHub Release and attaches the zip (.github/workflows/release.yml).
import { readdirSync, readFileSync, mkdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { crc32, deflateRawSync } from 'node:zlib';

import { build } from 'vite';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
await build({ configFile: join(root, 'vite.config.ts') });

const skill = join(root, 'plugin/skills/ariadne-nsd');
const script = join(skill, 'scripts/nsd.mjs');
console.log(
  `plugin/skills/ariadne-nsd/scripts/nsd.mjs: ${(statSync(script).size / 1024).toFixed(0)} KiB`,
);

function files(dir) {
  return readdirSync(dir, { withFileTypes: true })
    .sort((a, b) => a.name.localeCompare(b.name))
    .flatMap((entry) =>
      entry.isDirectory() ? files(join(dir, entry.name)) : [join(dir, entry.name)],
    );
}

/** A zip (deflate) of the skill folder under the folder name `ariadne-nsd/`, with fixed times. */
function zip(entries) {
  const local = [];
  const central = [];
  let offset = 0;
  for (const { name, data } of entries) {
    const packedData = deflateRawSync(data, { level: 9 });
    const nameBytes = Buffer.from(name, 'utf8');
    const header = Buffer.alloc(30);
    header.writeUInt32LE(0x04034b50, 0);
    header.writeUInt16LE(20, 4);
    header.writeUInt16LE(0x0800, 6); // UTF-8 names
    header.writeUInt16LE(8, 8); // deflate
    header.writeUInt16LE(0, 10); // 00:00
    header.writeUInt16LE(((2026 - 1980) << 9) | (1 << 5) | 1, 12); // 2026-01-01
    header.writeUInt32LE(crc32(data), 14);
    header.writeUInt32LE(packedData.length, 18);
    header.writeUInt32LE(data.length, 22);
    header.writeUInt16LE(nameBytes.length, 26);
    const entry = Buffer.alloc(46);
    entry.writeUInt32LE(0x02014b50, 0);
    entry.writeUInt16LE(20, 4);
    header.copy(entry, 6, 4, 30);
    entry.writeUInt32LE(offset, 42);
    local.push(header, nameBytes, packedData);
    central.push(entry, nameBytes);
    offset += header.length + nameBytes.length + packedData.length;
  }
  const centralSize = central.reduce((sum, part) => sum + part.length, 0);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(centralSize, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...local, ...central, end]);
}

const entries = files(skill).map((path) => ({
  name: `ariadne-nsd/${relative(skill, path).split(sep).join('/')}`,
  data: readFileSync(path),
}));
mkdirSync(join(root, 'dist'), { recursive: true });
const zipPath = join(root, 'dist/ariadne-nsd.zip');
writeFileSync(zipPath, zip(entries));
console.log(`dist/ariadne-nsd.zip: ${(statSync(zipPath).size / 1024).toFixed(0)} KiB`);
