// 펴낼 문서를 Quartz의 content 폴더로 옮긴다.
// 쓰는 법: node site/prepare-content.mjs <저장소 폴더> <Quartz의 content 폴더>
//
// - docs/, atelier/, tech-notes/를 그대로 복사한다 (→ DR-0013. tech-notes/는 2026-10-25에 더함).
// - 펴내지 않는 곳(journal/, 저장소 맨 위의 파일)으로 가는 위키링크는
//   GitHub의 파일 주소로 바꾼다. 그대로 두면 사이트에서 끊긴 링크가 된다.
// - 폴더의 README.md는 그 폴더의 첫 페이지(index.md)로 옮긴다. 그래야 사이트의 목록에서
//   다른 문서 사이에 섞이지 않고 폴더 자리에 선다. 그리로 가는 위키링크도 함께 바꾼다.
// - 본문이 `# 제목`으로 시작하지 않는 문서에는 제목을 넣는다. 사이트는 본문의 제목만 보여 준다(quartz.layout.ts).
// - 사이트의 첫 화면(index.md)은 저장소 맨 위의 README.md로 만든다(README가 원본). GitHub에서만 맞는 곳
//   (<!-- site:skip --> … <!-- /site:skip -->)은 빼고, 저장소 경로 링크와 그림 경로를 사이트에 맞게 바꾼다.
import fs from "node:fs"
import path from "node:path"

const [repoArg, contentArg] = process.argv.slice(2)
if (!repoArg || !contentArg) {
  console.error("쓰는 법: node site/prepare-content.mjs <저장소 폴더> <content 폴더>")
  process.exit(1)
}
const repo = path.resolve(repoArg)
const content = path.resolve(contentArg)
const PUBLISHED = ["docs", "atelier", "tech-notes"]
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
        if (isPublished(rel)) {
          // 폴더의 README는 사이트에서 그 폴더의 첫 페이지(index)다
          if (!rel.endsWith("/README.md")) return whole
          const dir = rel.replace(/\/README\.md$/, "")
          return `${bang}[[${dir}/index${m[2] ?? ""}${m[3] !== undefined ? (inner.includes("\\|") ? "\\|" : "|") + m[3] : ""}]]`
        }
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
    else if (e.name === "README.md") fs.writeFileSync(path.join(dst, "index.md"), addHeading(rewrite(fs.readFileSync(s, "utf8")), e.name))
    else if (e.name.endsWith(".md")) fs.writeFileSync(d, addHeading(rewrite(fs.readFileSync(s, "utf8")), e.name))
    else fs.copyFileSync(s, d)
  }
}

// 본문의 첫 줄(속성, 빈 줄, 주석 다음)이 `# 제목`이 아니면 속성의 title이나 파일 이름으로 제목을 넣는다
function addHeading(text, fileName) {
  const fm = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/)
  const head = fm ? fm[0] : ""
  const body = text.slice(head.length)
  const first = body.split("\n").find((l) => l.trim() && !/^\s*(%%|<!--)/.test(l))
  if (first && /^# /.test(first)) return text
  const t = fm?.[1].match(/^title:\s*"?(.*?)"?\s*$/m)?.[1] || fileName.replace(/\.md$/, "")
  return `${head}\n# ${t}\n${body}`
}

fs.rmSync(content, { recursive: true, force: true })
fs.mkdirSync(content, { recursive: true })
for (const d of PUBLISHED) copyDir(path.join(repo, d), path.join(content, d))
buildHome()

// README.md → index.md
function buildHome() {
  let md = fs.readFileSync(path.join(repo, "README.md"), "utf8")
  md = md.replace(/<!-- site:skip -->[\s\S]*?<!-- \/site:skip -->\n?/g, "")
  // 그림: journal/assets/의 파일을 content/brand/로 옮기고 그 자리를 가리킨다
  fs.mkdirSync(path.join(content, "brand"), { recursive: true })
  md = md.replace(/src="(journal\/assets\/[^"]+)"/g, (_, rel) => {
    const name = rel.split("/").at(-1)
    fs.copyFileSync(path.join(repo, rel), path.join(content, "brand", name))
    return `src="./brand/${name}"`
  })
  // 링크: 펴내는 문서는 사이트 주소로, 나머지 저장소 파일은 GitHub 주소로
  md = md.replace(/\]\(([^)\s]+)\)/g, (whole, href) => {
    if (/^(https?:|mailto:|#)/.test(href)) return whole
    const [p, hash = ""] = href.split("#")
    const clean = p.replace(/^\.\//, "")
    if (isPublished(clean) && clean.endsWith(".md")) {
      const page = clean.replace(/\/README\.md$/, "/").replace(/\.md$/, "")
      return `](./${page}${hash ? "#" + hash : ""})`
    }
    const kind = clean.endsWith("/") ? "tree" : "blob"
    return `](${GITHUB.replace("/blob/", `/${kind}/`)}${clean}${hash ? "#" + hash : ""})`
  })
  fs.writeFileSync(path.join(content, "index.md"), `---\ntitle: AriadneNSD\n---\n\n${md}`)
}

console.log(`content 준비: ${PUBLISHED.join(", ")} 복사, 펴내지 않는 곳으로 가는 링크 ${rewritten}개를 GitHub 주소로 바꿈`)
