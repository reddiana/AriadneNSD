// 플러그인 아이콘(plugin/.claude-plugin/icon.png)을 로고의 큰 판(모서리를 둥글린 것)에서 만든다.
// 쓰는 법: node src/skills/ariadne-nsd/scripts/make-icon.mjs <sharp가 든 폴더>   (예: site/.quartz)
//
// - 고른 곳: 시안 M78의 I1(메인테이너, 2026-11-27). 앱 정보 창의 로고와 같은 그림이다.
// - Anthropic Directory는 512 ~ 2048px의 정사각형 PNG만 받는다(SVG 불가). 1024px로 그린다.
// - 아이콘은 처음 제출할 때 한 번만 정해진다. 빌드 때마다 돌리지 않는다.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const [sharpHome] = process.argv.slice(2);
if (!sharpHome) {
  console.error('쓰는 법: node src/skills/ariadne-nsd/scripts/make-icon.mjs <sharp가 든 폴더>');
  process.exit(1);
}
const sharp = createRequire(path.join(path.resolve(sharpHome), 'package.json'))('sharp');
const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const svg = fs.readFileSync(path.join(repo, 'journal/assets/2026-10-10-logo-aegean-lady-rounded.svg'));
const out = path.join(repo, 'src/skills/ariadne-nsd/plugin/.claude-plugin/icon.png');
await sharp(svg, { density: 300 }).resize(1024, 1024).png({ compressionLevel: 9 }).toFile(out);
console.log('만듦:', out);
