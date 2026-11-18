// Builds M60 (접기 영역과 같은 모양의 펴 보인 호출 블록) from the template and the pictures the app's
// renderer drew. The pictures come from 2026-11-18-call-peek-frame-figs.test.ts (see its header).
// Output: 2026-11-18-call-peek-frame-study.html.   Run: node journal/assets/2026-11-18-call-peek-frame-build.mjs
import { readFileSync, writeFileSync } from 'node:fs';

const here = new URL('./', import.meta.url);
const figs = JSON.parse(readFileSync(new URL('2026-11-18-call-peek-frame-figs.json', here), 'utf8'));
let html = readFileSync(new URL('2026-11-18-call-peek-frame-template.html', here), 'utf8');

const font = `@font-face { font-family: '${figs.fontFamily}'; src: url(data:font/woff;base64,${figs.fontWoff}) format('woff'); }`;
delete figs.fontFamily;
delete figs.fontWoff;
html = html.replace('{{FONT}}', font);
for (const [key, svg] of Object.entries(figs)) html = html.replaceAll(`{{${key}}}`, svg);
if (html.includes('{{')) throw new Error(`a picture is missing: ${html.match(/\{\{\w+\}\}/)[0]}`);
writeFileSync(new URL('2026-11-18-call-peek-frame-study.html', here), html);
