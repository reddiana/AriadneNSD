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
// - 페이지를 옮기는 SPA(Quartz v4.5.2 spa.inline.ts)가 Quartz가 만들지 않은 페이지로 가는 링크까지
//   가로채는 곳. 첫 화면(`/`, 앱)과 사용법(`/manual/`), 옛 앱 주소(`/app/`)를 받아 본문만 갈아 끼우면
//   앱의 스크립트가 돌지 않아 "불러오는 중"에서 멈추고 왼쪽 목록이 겹친다(2026-11-02, 메인테이너).
//   그런 주소는 브라우저가 페이지를 새로 불러오게 둔다 → DR-0021
// - 왼쪽 위 사이트 이름(Quartz v4.5.2 PageTitle.tsx)이 사이트의 맨 위(`/`, 앱)로 가는 곳.
//   문서 사이트의 첫 화면인 소개(`/about`)로 가게 한다(2026-11-03, 메인테이너: "Home으로 가게 해주세요")
// - 왼쪽 목록(Quartz v4.5.2 explorer.inline.ts)의 맨 위에 앱(`/`)으로 가는 "앱 열기"를 넣는다.
//   앱은 Quartz의 페이지가 아니라서 목록에 저절로 생기지 않는다(2026-11-03, 메인테이너)
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
  {
    file: "quartz/components/scripts/spa.inline.ts",
    from: "  if (!isLocalUrl(href)) return\n",
    to:
      "  if (!isLocalUrl(href)) return\n" +
      "  // AriadneNSD: the app (/) and the user guide are not Quartz pages: load them for real\n" +
      "  if (/^\\/(app\\/|manual\\/|$)/.test(new URL(href).pathname)) return\n",
  },
  {
    file: "quartz/components/PageTitle.tsx",
    from: "<a href={baseDir}>{title}</a>",
    to: '<a href={baseDir + "/about"}>{title}</a>',
  },
  {
    file: "quartz/components/scripts/explorer.inline.ts",
    from: "    const fragment = document.createDocumentFragment()\n",
    to:
      "    const fragment = document.createDocumentFragment()\n" +
      "    // AriadneNSD: the app (/) is not a Quartz page, so add its link by hand\n" +
      "    {\n" +
      '      const tpl = document.getElementById("template-file") as HTMLTemplateElement\n' +
      '      const li = (tpl.content.cloneNode(true) as DocumentFragment).querySelector("li") as HTMLLIElement\n' +
      '      const a = li.querySelector("a") as HTMLAnchorElement\n' +
      '      a.href = "/"\n' +
      '      a.textContent = "앱 열기"\n' +
      "      fragment.appendChild(li)\n" +
      "    }\n",
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
