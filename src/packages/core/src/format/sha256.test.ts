// SHA-256 and UTF-8 for the drawing's fingerprint (R-FMT-09).
import { describe, expect, it } from 'vitest';

import { sha256Hex, utf8Bytes } from './sha256';

describe('sha256Hex', () => {
  it('gives the standard digests of the FIPS 180-4 examples', () => {
    expect(sha256Hex('')).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
    expect(sha256Hex('abc')).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    );
    expect(sha256Hex('abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq')).toBe(
      '248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1',
    );
  });

  it('digests a text longer than one block and with non-ASCII characters', () => {
    expect(sha256Hex('a'.repeat(1000))).toBe(
      '41edece42d63e8d9bf515a9ba6932e1c20cbc9f5a5d134645adb5db1b9737ea3',
    );
    expect(sha256Hex('합계 ← 0')).toBe(
      'f4b6ba7bee1594d8b1b3d1cf22c92793d9ec6941660b4aee8ed5b73a1ef27cba',
    );
  });
});

describe('utf8Bytes', () => {
  it('encodes one to four bytes per character, and a lone surrogate as U+FFFD', () => {
    expect([...utf8Bytes('a')]).toEqual([0x61]);
    expect([...utf8Bytes('é')]).toEqual([0xc3, 0xa9]);
    expect([...utf8Bytes('가')]).toEqual([0xea, 0xb0, 0x80]);
    expect([...utf8Bytes('😀')]).toEqual([0xf0, 0x9f, 0x98, 0x80]);
    expect([...utf8Bytes('\ud800')]).toEqual([0xef, 0xbf, 0xbd]);
  });
});
