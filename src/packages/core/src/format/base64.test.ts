import { describe, expect, it } from 'vitest';

import { encodeBase64 } from './base64';

// ASCII only: TextEncoder is not in the core libraries.
const bytes = (text: string): Uint8Array =>
  Uint8Array.from(text, (character) => character.charCodeAt(0));

describe('base64', () => {
  it('encodes the RFC 4648 test vectors', () => {
    expect(encodeBase64(bytes(''))).toBe('');
    expect(encodeBase64(bytes('f'))).toBe('Zg==');
    expect(encodeBase64(bytes('fo'))).toBe('Zm8=');
    expect(encodeBase64(bytes('foo'))).toBe('Zm9v');
    expect(encodeBase64(bytes('foob'))).toBe('Zm9vYg==');
    expect(encodeBase64(bytes('fooba'))).toBe('Zm9vYmE=');
    expect(encodeBase64(bytes('foobar'))).toBe('Zm9vYmFy');
  });

  it('uses + and / for the high values', () => {
    expect(encodeBase64(new Uint8Array([0xfb, 0xff, 0xbf]))).toBe('+/+/');
    expect(encodeBase64(new Uint8Array([0, 0, 0, 255]))).toBe('AAAA/w==');
  });
});
