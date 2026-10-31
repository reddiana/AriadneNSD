// Base64 (RFC 4648, with padding) in plain TypeScript: core may not use DOM or Node built-ins.

const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/** Encodes bytes as base64 with `=` padding and no line breaks. */
export function encodeBase64(bytes: Uint8Array): string {
  const parts: string[] = [];
  const letter = (index: number): string => alphabet.charAt(index & 63);
  for (let at = 0; at < bytes.length; at += 3) {
    const first = bytes[at] ?? 0;
    const second = bytes[at + 1] ?? 0;
    const third = bytes[at + 2] ?? 0;
    const remaining = bytes.length - at;
    parts.push(
      letter(first >> 2),
      letter((first << 4) | (second >> 4)),
      remaining > 1 ? letter((second << 2) | (third >> 6)) : '=',
      remaining > 2 ? letter(third) : '=',
    );
  }
  return parts.join('');
}
