// 사이트의 탭 아이콘(site/icon.png)을 로고의 작은 판에서 만든다.
// 쓰는 법: node site/make-icon.mjs <Quartz 폴더>   (Quartz에 든 sharp를 빌려 쓴다)
//
// - 탭의 아이콘은 16~32px로 보이므로, 머리 · 얼굴 · 눈만 남긴 작은 판을 쓴다(→ DR-0006: 16~24px은 작은 판).
// - 모서리는 큰 판(…-lady-rounded.svg)과 같은 비율(84 / 382)로 둥글린다.
// - 96px로 그린다. 고해상도 화면에서도 흐려지지 않고, Quartz가 이것을 48px로 줄여 favicon.ico도 만든다.
// 빌드 때마다 돌리지 않는다. 로고가 바뀌면 다시 돌려 site/icon.png를 커밋한다.
import fs from "node:fs"
import path from "node:path"
import { createRequire } from "node:module"

const [quartzArg] = process.argv.slice(2)
if (!quartzArg) {
  console.error("쓰는 법: node site/make-icon.mjs <Quartz 폴더>")
  process.exit(1)
}
const require = createRequire(path.join(path.resolve(quartzArg), "package.json"))
const sharp = require("sharp")

const repo = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..")
const tiny = fs.readFileSync(path.join(repo, "journal/assets/2026-10-10-logo-aegean-lady-tiny.svg"), "utf8")

// 작은 판의 viewBox 안쪽을 둥근 사각형으로 자른다
const vb = tiny.match(/viewBox="([^"]+)"/)[1].split(/\s+/).map(Number)
const [x, y, w, h] = vb
const r = (w * 84) / 382
const rounded = tiny
  .replace(/<svg([^>]*)>/, `<svg$1><clipPath id="round"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}"/></clipPath><g clip-path="url(#round)">`)
  .replace(/<\/svg>\s*$/, "</g></svg>")

const out = path.join(repo, "site/icon.png")
await sharp(Buffer.from(rounded), { density: 300 }).resize(96, 96).png().toFile(out)
console.log("만듦:", out)
