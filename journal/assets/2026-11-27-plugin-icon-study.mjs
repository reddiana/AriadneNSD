// M78 플러그인 아이콘 시안의 HTML을 만든다. 로고 SVG를 그대로 읽어 넣는다(좌표를 지어 그리지 않음).
// 쓰는 법: node journal/assets/2026-11-27-plugin-icon-study.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const big = readFileSync(path.join(here, '2026-10-10-logo-aegean-lady-rounded.svg'), 'utf8').trim();
const tiny = readFileSync(path.join(here, '2026-10-10-logo-aegean-lady-tiny.svg'), 'utf8').trim();
const tpl = readFileSync(path.join(here, '2026-11-27-plugin-icon-study.template.html'), 'utf8');

const out = tpl
  .replace('/*BIG*/""', JSON.stringify(big))
  .replace('/*TINY*/""', JSON.stringify(tiny));
writeFileSync(path.join(here, '2026-11-27-plugin-icon-study.html'), out);
console.log('made', out.length, 'bytes');
