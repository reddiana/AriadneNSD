// The zip of the skill folder for claude.ai (used by build.mjs, and by the test of the zip's contents).
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { crc32, deflateRawSync } from 'node:zlib';

export function files(dir) {
  return readdirSync(dir, { withFileTypes: true })
    .sort((a, b) => a.name.localeCompare(b.name))
    .flatMap((entry) =>
      entry.isDirectory() ? files(join(dir, entry.name)) : [join(dir, entry.name)],
    );
}

/** A zip (deflate) of the skill folder under the folder name `ariadne-nsd/`, with fixed times. */
export function zip(entries) {
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

/** The entries of the zip: every file of the skill folder, under the folder name `ariadne-nsd/`. */
export function skillEntries(skill) {
  return files(skill).map((path) => ({
    name: `ariadne-nsd/${relative(skill, path).split(sep).join('/')}`,
    data: readFileSync(path),
  }));
}
