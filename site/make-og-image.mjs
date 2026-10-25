// 링크를 공유할 때 보이는 대표 그림(site/og-image.png, 1200×630)을 로고와 문자 로고로 만든다.
// 쓰는 법: node site/make-og-image.mjs <Quartz 폴더>   (Quartz에 든 sharp를 빌려 쓴다)
//
// - Quartz는 모든 페이지의 og:image로 static/og-image.png를 쓴다. 그대로 두면 Quartz의 그림이 나온다.
//   빌드(build.sh, pages.yml)가 이 파일을 그 자리에 복사한다.
// - 문자 로고는 윤곽선(path)이라 글꼴이 필요 없다. 그 밖의 글자는 넣지 않는다(빌드하는 곳마다 글꼴이 달라서).
// - 빌드 때마다 돌리지 않는다. 로고가 바뀌면 다시 돌려 site/og-image.png를 커밋한다.
import fs from "node:fs"
import path from "node:path"
import { createRequire } from "node:module"

const quartzArg = process.argv[2]
if (!quartzArg) {
  console.error("쓰는 법: node site/make-og-image.mjs <Quartz 폴더>")
  process.exit(1)
}
const require = createRequire(path.join(path.resolve(quartzArg), "package.json"))
const sharp = require("sharp")

const repo = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..")
const read = (f) => fs.readFileSync(path.join(repo, "journal/assets", f), "utf8")
const inner = (svg) => svg.replace(/^[\s\S]*?<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "").replace(/<title>[\s\S]*?<\/title>/, "")

const W = 1200, H = 630
const BG = "#F7F1EA" // 로고의 바탕 크림색
const logo = read("2026-10-10-logo-aegean-lady-rounded.svg") // viewBox 0 0 382 382
const word = read("2026-10-10-wordmark-light.svg") // viewBox -30 -738 6201 790

// 로고: 왼쪽, 높이 330. 문자 로고: 오른쪽, 폭 600. 둘을 세로 가운데에 맞춘다
const L = 330, lx = 110, ly = (H - L) / 2
const ww = 600, wscale = ww / 6201, wh = 790 * wscale
const wx = lx + L + 60, wy = (H - wh) / 2

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<rect width="${W}" height="${H}" fill="${BG}"/>
<svg x="${lx}" y="${ly}" width="${L}" height="${L}" viewBox="0 0 382 382">${inner(logo)}</svg>
<svg x="${wx}" y="${wy}" width="${ww}" height="${wh}" viewBox="-30 -738 6201 790">${inner(word)}</svg>
</svg>`

const out = path.join(repo, "site/og-image.png")
await sharp(Buffer.from(svg)).png().toFile(out)
console.log("만듦:", out)
