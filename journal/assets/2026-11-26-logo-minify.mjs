// Shrinks the logo SVG: path data to relative commands at a given precision, compact numbers.
// usage: node journal/assets/2026-11-26-logo-minify.mjs in.svg out.svg digits
// Made for the About modal's logo (src/packages/editor/src/ui/about-logo.ts, digits 0).
import { readFileSync, writeFileSync } from 'node:fs';

const [input, output, digitsArg] = process.argv.slice(2);
const digits = Number(digitsArg ?? 1);
const scale = 10 ** digits;
const round = (v) => Math.round(v * scale) / scale;
const fmt = (v) => {
  let s = String(round(v));
  if (s.startsWith('0.')) s = s.slice(1);
  else if (s.startsWith('-0.')) s = '-' + s.slice(2);
  return s;
};
function join(nums) {
  let out = '';
  for (const n of nums) {
    const s = fmt(n);
    if (out === '' || s.startsWith('-') || (s.startsWith('.') && /\.\d*$/.test(out))) out += s;
    else out += ' ' + s;
  }
  return out;
}
function minify(d) {
  const tokens = d.match(/[MLQZmlqz]|-?\d*\.?\d+(?:e-?\d+)?/g);
  let i = 0;
  let cmd = '';
  let cx = 0, cy = 0, sx = 0, sy = 0;
  let out = '';
  let last = '';
  const arity = { M: 2, L: 2, Q: 4 };
  while (i < tokens.length) {
    if (/[A-Za-z]/.test(tokens[i])) cmd = tokens[i++];
    if (cmd !== cmd.toUpperCase()) throw new Error('relative input not handled');
    if (cmd === 'Z') {
      out += 'z';
      last = 'z';
      cx = sx; cy = sy;
      continue;
    }
    const n = arity[cmd];
    const abs = tokens.slice(i, i + n).map((t) => round(Number(t)));
    i += n;
    const rel = abs.map((v, k) => v - (k % 2 === 0 ? cx : cy));
    let letter = cmd.toLowerCase();
    if (cmd === 'M' && out === '') letter = 'M';
    const nums = letter === 'M' ? abs : rel;
    const body = join(nums);
    const implicit = letter === last && letter !== 'M' && letter !== 'z';
    out += implicit ? (body.startsWith('-') ? body : ' ' + body) : letter + body;
    last = letter === 'm' || letter === 'M' ? 'l' : letter; // after m, pairs are implicit l
    if (letter === 'm' || letter === 'M') last = 'm-done';
    cx = abs[n - 2]; cy = abs[n - 1];
    if (cmd === 'M') { sx = cx; sy = cy; }
    if (cmd === 'M') cmd = 'L';
  }
  return out;
}
let svg = readFileSync(input, 'utf8');
svg = svg.replace(/ d="([^"]+)"/g, (_, d) => ` d="${minify(d)}"`).replace(/\n/g, '');
writeFileSync(output, svg);
