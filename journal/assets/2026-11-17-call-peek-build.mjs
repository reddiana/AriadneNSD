// Builds M59 (펴 보인 호출 블록 시안) from the template and the pictures the app's renderer drew.
// The pictures come from 2026-11-17-call-peek-figs.test.ts (see its header for how to run it),
// which writes -figs.json: one SVG per picture and the block font subset as WOFF.
// Output: 2026-11-17-call-peek-study.html.   Run: node journal/assets/2026-11-17-call-peek-build.mjs
import { readFileSync, writeFileSync } from 'node:fs';

const here = new URL('./', import.meta.url);
const figs = JSON.parse(readFileSync(new URL('2026-11-17-call-peek-figs.json', here), 'utf8'));
let html = readFileSync(new URL('2026-11-17-call-peek-template.html', here), 'utf8');

const font = `@font-face { font-family: '${figs.fontFamily}'; src: url(data:font/woff;base64,${figs.fontWoff}) format('woff'); }`;
delete figs.fontFamily;
delete figs.fontWoff;
html = html.replace('{{FONT}}', font);

// Each picture holds main() and the Method beside it. The option cards show main() only (the
// opened call is there); the pictures of "now" keep both diagrams.
const mainWidth = 372;
for (const [key, svg] of Object.entries(figs)) {
  const crop = !key.startsWith('now');
  const out = crop
    ? svg.replace(/viewBox="0 0 (\d+) (\d+)" width="(\d+)"/, (_m, _w, h) => `viewBox="0 0 ${mainWidth} ${h}" width="${mainWidth}"`)
    : svg;
  html = html.replaceAll(`{{${key}}}`, out);
}
if (html.includes('{{')) throw new Error(`a picture is missing: ${html.match(/\{\{\w+\}\}/)[0]}`);
writeFileSync(new URL('2026-11-17-call-peek-study.html', here), html);
