// 펴낼 문서를 Quartz의 content 폴더로 옮긴다.
// 쓰는 법: node site/prepare-content.mjs <저장소 폴더> <Quartz의 content 폴더>
//
// - docs/와 atelier/를 그대로 복사한다 (→ DR-0013).
// - 펴내지 않는 곳(journal/, tech-notes/, 저장소 맨 위의 파일)으로 가는 위키링크는
//   GitHub의 파일 주소로 바꾼다. 그대로 두면 사이트에서 끊긴 링크가 된다.
// - 사이트의 첫 화면(index.md)을 site/index.md에서, 그 화면의 로고를 journal/assets/에서 가져온다.
import fs from "node:fs"
import path from "node:path"

const [repoArg, contentArg] = process.argv.slice(2)
if (!repoArg || !contentArg) {
  console.error("쓰는 법: node site/prepare-content.mjs <저장소 폴더> <content 폴더>")
  process.exit(1)
}
const repo = path.resolve(repoArg)
const content = path.resolve(contentArg)
const PUBLISHED = ["docs", "atelier"]
const GITHUB = "https://github.com/reddiana/AriadneNSD/blob/main/"

// 저장소의 모든 파일: 이름(확장자 .md는 뺀 것과 붙은 것 모두) → 저장소 안의 경로
function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith(".")) continue
    if (e.name === "node_modules" || e.name === "site") continue
    const p = path.join(dir, e.name)
    if (e.isDirectory()) walk(p, out)
    else out.push(path.relative(repo, p).split(path.sep).join("/"))
  }
  return out
}
const byName = new Map()
for (const rel of walk(repo)) {
  const base = rel.split("/").at(-1)
  const keys = [base, base.replace(/\.md$/, ""), rel, rel.replace(/\.md$/, "")]
  for (const k of keys) {
    if (!byName.has(k)) byName.set(k, [])
    if (!byName.get(k).includes(rel)) byName.get(k).push(rel)
  }
}
const isPublished = (rel) => PUBLISHED.some((d) => rel.startsWith(d + "/"))

let rewritten = 0
// 한 줄 안에서 인라인 코드(`…`)는 건드리지 않고 위키링크만 바꾼다
function rewriteLine(line) {
  return line
    .split(/(`+[^`]*`+)/)
    .map((part, i) => {
      if (i % 2 === 1) return part
      return part.replace(/(!?)\[\[([^\]\n]+?)\]\]/g, (whole, bang, inner) => {
        // 표 안에서는 별칭 구분자가 \| 이다
        const m = inner.match(/^([^#|\\]*)(#[^|\\]*)?(?:\\?\|(.*))?$/)
        if (!m) return whole
        const target = m[1].trim()
        if (!target) return whole
        const hits = byName.get(target)
        if (!hits) return whole
        // 이름이 겹치면 Obsidian처럼 저장소 맨 위에 가까운 파일을 고른다 (예: [[README]] → README.md)
        const rel = [...hits].sort((x, y) => x.split("/").length - y.split("/").length)[0]
        if (isPublished(rel)) return whole
        const label = (m[3] ?? target).trim()
        rewritten++
        const url = GITHUB + rel.split("/").map(encodeURIComponent).join("/")
        return bang ? `![${label}](${url}?raw=true)` : `[${label}](${url})`
      })
      // [[이름]](설명)처럼 바로 뒤에 괄호가 오면 마크다운이 [이름]을 링크 글자, (설명)을 주소로 읽는다.
      // 괄호를 글자 참조로 바꿔 막는다
      .replace(/\]\]\(/g, "]]&#40;")
    })
    .join("")
}

function rewrite(text) {
  let fence = null
  return text
    .split("\n")
    .map((line) => {
      const f = line.match(/^\s*(```+|~~~+)/)
      if (f) {
        if (!fence) fence = f[1]
        else if (line.trim().startsWith(fence)) fence = null
        return line
      }
      return fence ? line : rewriteLine(line)
    })
    .join("\n")
}

function copyDir(src, dst) {
  fs.mkdirSync(dst, { recursive: true })
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, e.name)
    const d = path.join(dst, e.name)
    if (e.isDirectory()) copyDir(s, d)
    else if (e.name.endsWith(".md")) fs.writeFileSync(d, rewrite(fs.readFileSync(s, "utf8")))
    else fs.copyFileSync(s, d)
  }
}

fs.rmSync(content, { recursive: true, force: true })
fs.mkdirSync(content, { recursive: true })
for (const d of PUBLISHED) copyDir(path.join(repo, d), path.join(content, d))
fs.copyFileSync(path.join(repo, "site", "index.md"), path.join(content, "index.md"))
// 첫 화면의 로고와 문자 로고 (README와 같은 파일 → DR-0006)
fs.mkdirSync(path.join(content, "brand"), { recursive: true })
for (const [from, to] of [
  ["journal/assets/2026-10-10-logo-aegean-lady-rounded.svg", "logo.svg"],
  ["journal/assets/2026-10-11-wordmark-n1-warm-grey.svg", "wordmark.svg"],
]) fs.copyFileSync(path.join(repo, from), path.join(content, "brand", to))
console.log(`content 준비: ${PUBLISHED.join(", ")} 복사, 펴내지 않는 곳으로 가는 링크 ${rewritten}개를 GitHub 주소로 바꿈`)
