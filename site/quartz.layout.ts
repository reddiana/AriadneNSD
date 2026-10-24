// AriadneNSD 설계 문서 사이트의 화면 구성 (Quartz v4.5.2의 기본에서 바꾼 곳):
// - 바닥글 링크
// - 문서 위의 제목(ArticleTitle)을 뺌. 본문이 `# 제목`으로 시작해서 두 번 나왔다.
//   본문에 제목이 없는 문서는 prepare-content.mjs가 넣는다. 첫 페이지(README)가 없는 폴더에서만 보인다.
// - 왼쪽 목록은 이름이 아니라 파일 이름(읽는 순서의 번호)순으로 둔다
// - 그래프에서 태그를 뺌
import { PageLayout, SharedLayout } from "./quartz/cfg"
import * as Component from "./quartz/components"

// 폴더 먼저, 그다음 파일. 둘 다 파일 이름(번호)순
const explorer = () =>
  Component.Explorer({
    sortFn: (a, b) => {
      if (a.isFolder !== b.isFolder) return a.isFolder ? -1 : 1
      // 맨 위에서는 문서(docs)가 작업 공간(atelier)보다 먼저
      const first = ["docs", "atelier"]
      const ra = first.indexOf(a.slugSegment)
      const rb = first.indexOf(b.slugSegment)
      if (ra !== rb && ra >= 0 && rb >= 0) return ra - rb
      return a.slugSegment.localeCompare(b.slugSegment, undefined, { numeric: true, sensitivity: "base" })
    },
  })

const graph = () =>
  Component.Graph({
    localGraph: { showTags: false },
    globalGraph: { showTags: false },
  })

// components shared across all pages
export const sharedPageComponents: SharedLayout = {
  head: Component.Head(),
  header: [],
  afterBody: [],
  footer: Component.Footer({
    links: {
      "GitHub 저장소": "https://github.com/reddiana/AriadneNSD",
    },
  }),
}

// components for pages that display a single page (e.g. a single note)
export const defaultContentPageLayout: PageLayout = {
  beforeBody: [
    Component.ConditionalRender({
      component: Component.Breadcrumbs(),
      condition: (page) => page.fileData.slug !== "index",
    }),
    Component.ContentMeta(),
    Component.TagList(),
  ],
  left: [
    Component.PageTitle(),
    Component.MobileOnly(Component.Spacer()),
    Component.Flex({
      components: [
        {
          Component: Component.Search(),
          grow: true,
        },
        { Component: Component.Darkmode() },
        { Component: Component.ReaderMode() },
      ],
    }),
    explorer(),
  ],
  right: [
    graph(),
    Component.DesktopOnly(Component.TableOfContents()),
    Component.Backlinks(),
  ],
}

// components for pages that display lists of pages  (e.g. tags or folders)
export const defaultListPageLayout: PageLayout = {
  beforeBody: [
    Component.Breadcrumbs(),
    Component.ConditionalRender({
      component: Component.ArticleTitle(),
      condition: (page) => !page.fileData.filePath,
    }),
    Component.ContentMeta(),
  ],
  left: [
    Component.PageTitle(),
    Component.MobileOnly(Component.Spacer()),
    Component.Flex({
      components: [
        {
          Component: Component.Search(),
          grow: true,
        },
        { Component: Component.Darkmode() },
      ],
    }),
    explorer(),
  ],
  right: [],
}
