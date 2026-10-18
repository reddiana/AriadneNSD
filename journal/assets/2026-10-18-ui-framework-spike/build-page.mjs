// 시안 M22 페이지를 만든다: 네 가지 코드와 잰 크기(sizes.json)를 page-template.html에 넣는다.
// 쓰는 법: node measure.mjs <폴더> 다음에 node build-page.mjs
import { readFileSync, writeFileSync } from 'node:fs';
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const src = (f) => esc(readFileSync(f, 'utf8').trimEnd());
const sizes = JSON.parse(readFileSync('sizes.json', 'utf8'));
const kb = (n) => (n / 1024).toFixed(1) + ' KB';
const OBS = 2 * 1024 * 1024;
const max = Math.max(...sizes.map((s) => s.min));
const rows = sizes.map((s) => `<tr><td>${esc(s.name)}</td><td class="n">${kb(s.min)}</td><td class="n">${kb(s.gz)}</td><td class="n">+${(s.min / OBS * 100).toFixed(1)}%</td><td><div class="bar" style="width:${Math.max(1, s.min / max * 100).toFixed(1)}%"></div></td></tr>`).join('\n');
let html = readFileSync('page-template.html', 'utf8')
  .replace('{{vanilla}}', src('vanilla.js'))
  .replace('{{svelte}}', src('Toolbar.svelte'))
  .replace('{{react}}', src('react.jsx'))
  .replace('{{preact}}', src('preact.jsx'))
  .replace('{{rows}}', rows);
sizes.forEach((s, i) => { html = html.replace(`{{min${i}}}`, kb(s.min)).replace(`{{gz${i}}}`, kb(s.gz)); });
if (/\{\{\w+\}\}/.test(html)) throw new Error('채우지 못한 자리: ' + html.match(/\{\{\w+\}\}/)[0]);
writeFileSync('../2026-10-18-ui-framework-study.html', html);
console.log('만듦: journal/assets/2026-10-18-ui-framework-study.html');
