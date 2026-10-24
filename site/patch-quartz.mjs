// 받은 Quartz의 소스를 빌드 전에 고친다.
// 쓰는 법: node site/patch-quartz.mjs <Quartz 폴더>
//
// 고치는 것:
// - Mermaid 그림을 다시 그릴 때 원문을 innerHTML로 넣는 곳(Quartz v4.5.2 mermaid.inline.ts).
//   원문이 HTML로 읽혀 `<<interface>>` 같은 스테레오타입이 태그가 되고,
//   그림이 "Syntax error in text"로 깨진다. textContent로 넣으면 글자 그대로 들어간다.
// - 본문 태그(#P0)의 링크 주소(Quartz v4.5.2 ofm.ts). 태그 링크를 지금 문서 기준(`../../tags/P0`)으로
//   만들지만, 뒤의 CrawlLinks("shortest")는 주소를 사이트 맨 위 기준으로 보고 `../..`를 또 붙인다.
//   두 겹 아래 폴더(docs/01-requirements/)에서는 `../.././../tags/P0`가 되어 사이트 밖으로 나간다.
//   위키링크처럼 맨 위 기준(`tags/P0`)으로 만들면 CrawlLinks가 맞게 바꾼다.
//
// 고칠 글이 없으면(Quartz를 올려 소스가 달라졌으면) 멈춘다. 그때 이 패치가 아직 필요한지 다시 본다.
import fs from "node:fs"
import path from "node:path"

const quartz = process.argv[2]
if (!quartz) {
  console.error("쓰는 법: node site/patch-quartz.mjs <Quartz 폴더>")
  process.exit(1)
}

const patches = [
  {
    file: "quartz/components/scripts/mermaid.inline.ts",
    from: "node.innerHTML = oldText",
    to: "node.textContent = oldText",
  },
  {
    file: "quartz/plugins/transformers/ofm.ts",
    from: "url: base + `/tags/${tag}`,",
    to: "url: `tags/${tag}`,",
  },
]

for (const p of patches) {
  const f = path.join(quartz, p.file)
  const text = fs.readFileSync(f, "utf8")
  if (text.includes(p.to)) continue // 이미 고침 (로컬 빌드를 다시 할 때)
  if (!text.includes(p.from)) {
    console.error(`패치 실패: ${p.file}에 "${p.from}"이 없습니다. Quartz가 바뀌었는지 보세요.`)
    process.exit(1)
  }
  fs.writeFileSync(f, text.replace(p.from, p.to))
  console.log(`패치: ${p.file}`)
}
