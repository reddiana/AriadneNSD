// 문서의 Mermaid 그림을 사이트와 같은 Mermaid 판으로 문법 검사한다.
// Obsidian의 Mermaid는 옛 판이라 너그러워서, Obsidian에서 그려지는 그림도 사이트에서는 깨질 수 있다.
//
// 쓰는 법: node site/check-mermaid.mjs <mermaid와 jsdom을 설치한 폴더> <검사할 폴더> [<폴더> …]
//   예: npm install mermaid@11.4.0 jsdom@25.0.1 를 한 폴더를 첫 인자로 준다 (Quartz v4.5.2가 쓰는 Mermaid는 11.4.0)
//   깨진 그림이 있으면 파일과 줄, 오류를 찍고 1로 끝난다.
import fs from "node:fs"
import path from "node:path"
import { createRequire } from "node:module"
import { pathToFileURL } from "node:url"

const [modsArg, ...dirs] = process.argv.slice(2)
if (!modsArg || dirs.length === 0) {
  console.error("쓰는 법: node site/check-mermaid.mjs <mermaid와 jsdom을 설치한 폴더> <검사할 폴더> …")
  process.exit(2)
}
const require = createRequire(path.join(path.resolve(modsArg), "package.json"))
const { JSDOM } = require("jsdom")
const dom = new JSDOM("<!doctype html><html><body></body></html>", { pretendToBeVisual: true })
for (const k of ["window", "document", "navigator", "Element", "HTMLElement", "SVGElement", "DOMParser", "MutationObserver"]) {
  if (!(k in globalThis)) Object.defineProperty(globalThis, k, { value: dom.window[k] ?? dom.window, configurable: true })
}
const mermaid = (await import(pathToFileURL(require.resolve("mermaid/dist/mermaid.core.mjs")).href)).default
mermaid.initialize({ startOnLoad: false })
const version = require("mermaid/package.json").version

const files = []
const walk = (d) => {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name)
    if (e.isDirectory()) walk(p)
    else if (e.name.endsWith(".md")) files.push(p)
  }
}
dirs.forEach(walk)

let total = 0, bad = 0
for (const f of files) {
  const lines = fs.readFileSync(f, "utf8").split("\n")
  for (let i = 0; i < lines.length; i++) {
    if (!/^\s*```mermaid\s*$/.test(lines[i])) continue
    const start = i + 1
    const body = []
    for (i++; i < lines.length && !/^\s*```\s*$/.test(lines[i]); i++) body.push(lines[i])
    total++
    try {
      await mermaid.parse(body.join("\n"))
    } catch (e) {
      bad++
      console.log(`${f}:${start}  ${String(e.message ?? e).split("\n")[0]}`)
    }
  }
}
console.log(`Mermaid ${version}: 그림 ${total}개, 깨진 그림 ${bad}개`)
process.exit(bad ? 1 : 0)
