import { createHash } from 'node:crypto';

import { beforeAll, describe, expect, it } from 'vitest';

import { blockFont, encodeWoff } from '../src/index';
import type { Subsetter } from '../src/index';
import { readSfnt } from '../src/sfnt';
import {
  decodeWoffTables,
  readCmapCodePoints,
  readName,
  readWoffDirectory,
  readWoffHeader,
} from './font-reader';
import { createNodeSubsetter, readFontFile } from './index';

const ASCII = Array.from({ length: 0x7f - 0x20 }, (_, index) => 0x20 + index);
/**
 * The 300 Hangul syllables used most in this repository's docs/ (2026-11-01), the same kind of
 * sample the 02-layout 2.2 table was measured with. Common syllables share jamo glyphs.
 */
const HANGUL_300 = codePointsOf(
  '다이는기의에로은그니서록을어블가지하스를트고면한자문일리인나보입모선으장파정사과만아저집라있드않편접상바도습름호분더구택수키텍테대시안없출와같것마위제두용음화영레들래명역림전줄내때성조열령적램할동요표헤본합른펴실소처버게항원우글크계배치러여작함결되쓰태오브든터쪽새색목설폭세해경메델행부꼴칙비거유포삽식커양셸코반형미무개웹붙데따번뷰칸뒤순뉴플르공단알린진받남복백벨확려중언힌종곳타읽주예운각직규감디꾸패체금류된띠페노토변값넣력빈했건까클연방참삭뀌누렌맨께높환준검둘웃점프링립최싸풀통필관앞업씁릭간취능끝범현산흐럼불측법므굵답초롭근큰톱속둔등겹엇팔컬놓펼둡움질떻탭묶응툴밖축임왼히져셋담향콘밋돌차온창별',
);
const SAMPLE = codePointsOf('i ← i + 1 피벗보다 작은 값');

function codePointsOf(text: string): number[] {
  return Array.from(text, (character) => character.codePointAt(0) ?? 0);
}

let subsetter: Subsetter;
let ttf: Uint8Array;

beforeAll(async () => {
  subsetter = await createNodeSubsetter();
  ttf = await readFontFile(blockFont.files.ttf);
});

describe('subsetToWoff', () => {
  it('T-0502 · R-FMT-03: the same code points give the same bytes, in any order and with duplicates', () => {
    const first = subsetter.subsetToWoff(ttf, SAMPLE);
    const second = subsetter.subsetToWoff(ttf, SAMPLE);
    const shuffled = subsetter.subsetToWoff(ttf, [...SAMPLE].reverse().concat(SAMPLE));
    expect(second).toEqual(first);
    expect(shuffled).toEqual(first);
  });

  it('T-0503: ADR-0039: writes a WOFF 1.0 header with no metadata or private block', () => {
    const woff = subsetter.subsetToWoff(ttf, SAMPLE);
    const header = readWoffHeader(woff);
    expect(header.signature).toBe('wOFF');
    expect(header.flavor).toBe(0x00010000);
    expect(header.length).toBe(woff.byteLength);
    expect(header.reserved).toBe(0);
    expect([header.metaOffset, header.metaLength, header.privOffset, header.privLength]).toEqual([
      0, 0, 0, 0,
    ]);
  });

  it('T-0504: ADR-0039: the table directory is sorted, aligned and decodes to the subset TTF', () => {
    const woff = subsetter.subsetToWoff(ttf, SAMPLE);
    const header = readWoffHeader(woff);
    const entries = readWoffDirectory(woff);
    expect(entries).toHaveLength(header.numTables);
    expect(entries.map((entry) => entry.tag)).toEqual(entries.map((entry) => entry.tag).sort());
    let expectedOffset = 44 + 20 * entries.length;
    for (const entry of entries) {
      expect(entry.offset).toBe(expectedOffset);
      expect(entry.compLength).toBeLessThanOrEqual(entry.origLength);
      expectedOffset += (entry.compLength + 3) & ~3;
    }
    expect(expectedOffset).toBe(woff.byteLength);

    const tables = decodeWoffTables(woff);
    const sfnt = readSfnt(subsetter.subsetTtf(ttf, SAMPLE));
    for (const table of sfnt.tables) {
      if (table.tag !== 'head') {
        expect(tables.get(table.tag)).toEqual(table.data);
      }
    }
    const sfntSize =
      12 +
      16 * entries.length +
      entries.reduce((sum, entry) => sum + ((entry.origLength + 3) & ~3), 0);
    expect(header.totalSfntSize).toBe(sfntSize);
  });

  it('T-0505: ADR-0026: the subset maps exactly the requested characters the font has', () => {
    const tables = decodeWoffTables(
      subsetter.subsetToWoff(ttf, [...SAMPLE, 0x6f22 /* 漢: not in the font */]),
    );
    const cmap = tables.get('cmap');
    expect(cmap).toBeDefined();
    expect([...readCmapCodePoints(cmap ?? new Uint8Array())].sort((a, b) => a - b)).toEqual(
      [...new Set(SAMPLE)].sort((a, b) => a - b),
    );
  });

  it('T-0506: 02-layout 2.2: no hinting and no layout tables, so nothing kerns or ligates', () => {
    const tags = readWoffDirectory(subsetter.subsetToWoff(ttf, SAMPLE)).map((entry) => entry.tag);
    for (const tag of ['GSUB', 'GPOS', 'GDEF', 'kern', 'fpgm', 'prep', 'cvt ', 'hdmx']) {
      expect(tags).not.toContain(tag);
    }
    expect(tags).toEqual(
      expect.arrayContaining(['cmap', 'glyf', 'head', 'hhea', 'hmtx', 'loca', 'maxp', 'name']),
    );
  });

  it('T-0507: ADR-0034: keeps the family name "AriadneNSD Mono" (D2Coding is an OFL Reserved Font Name)', () => {
    const name =
      decodeWoffTables(subsetter.subsetToWoff(ttf, SAMPLE)).get('name') ?? new Uint8Array();
    expect(readName(name, 1)).toBe(blockFont.familyName);
    expect(readName(name, 6)).toBe('AriadneNSDMono-Regular');
    expect(readName(name, 13)).toContain('SIL Open Font License');
  });

  it('T-0508: 02-layout 2.2: Hangul 300 + ASCII is about 29 KB as WOFF', () => {
    const woff = subsetter.subsetToWoff(ttf, [...ASCII, ...HANGUL_300]);
    const ttfSize = subsetter.subsetTtf(ttf, [...ASCII, ...HANGUL_300]).byteLength;
    // Measured on 2026-11-01: TTF 49.9 KB, WOFF 28.8 KB.
    expect(woff.byteLength).toBeGreaterThan(26 * 1024);
    expect(woff.byteLength).toBeLessThan(32 * 1024);
    expect(woff.byteLength).toBeLessThan(ttfSize * 0.7);
  });

  it('T-0509: 02-layout 2.2: ASCII only is about 7 KB as WOFF', () => {
    const woff = subsetter.subsetToWoff(ttf, ASCII);
    expect(woff.byteLength).toBeGreaterThan(4 * 1024);
    expect(woff.byteLength).toBeLessThan(10 * 1024);
  });
});

describe('pinned output', () => {
  // Fails when harfbuzzjs, fflate or the zlib settings change the bytes of saved files.
  // That may be fine, but it must be a deliberate change (ADR-0039): update the hash then.
  it('T-0510: ADR-0039: the sample subset has the recorded SHA-256', () => {
    const woff = subsetter.subsetToWoff(ttf, SAMPLE);
    expect(createHash('sha256').update(woff).digest('hex')).toBe(
      'c2ae21c9ac44a2afbba7587fb2d8e96871fc16a1f9a2af591e6e2fdb0f3f6c26',
    );
  });

  it('T-0511: ADR-0039: encodeWoff of a subset TTF matches subsetToWoff', () => {
    expect(encodeWoff(subsetter.subsetTtf(ttf, SAMPLE))).toEqual(
      subsetter.subsetToWoff(ttf, SAMPLE),
    );
  });
});
