import { QuartzConfig } from "./quartz/cfg"
import * as Plugin from "./quartz/plugins"

// AriadneNSD 설계 문서 사이트의 Quartz 설정 (→ DR-0013)
// Quartz v4.5.2의 기본 설정에서 바꾼 곳에만 주석을 단다.
// 설명: https://quartz.jzhao.xyz/configuration
const config: QuartzConfig = {
  configuration: {
    pageTitle: "AriadneNSD",
    pageTitleSuffix: "",
    enableSPA: true,
    enablePopovers: true,
    analytics: null, // 방문 통계를 모으지 않는다
    locale: "ko-KR",
    baseUrl: "reddiana.github.io/AriadneNSD",
    ignorePatterns: [".obsidian"],
    defaultDateType: "modified",
    theme: {
      fontOrigin: "googleFonts",
      cdnCaching: true,
      typography: {
        // 한글이 있는 글꼴
        header: "Noto Sans KR",
        body: "Noto Sans KR",
        code: "IBM Plex Mono",
      },
      colors: {
        lightMode: {
          light: "#faf8f8",
          lightgray: "#e5e5e5",
          gray: "#b8b8b8",
          darkgray: "#4e4e4e",
          dark: "#2b2b2b",
          secondary: "#284b63",
          tertiary: "#84a59d",
          highlight: "rgba(143, 159, 169, 0.15)",
          textHighlight: "#fff23688",
        },
        darkMode: {
          light: "#161618",
          lightgray: "#393639",
          gray: "#646464",
          darkgray: "#d4d4d4",
          dark: "#ebebec",
          secondary: "#7b97aa",
          tertiary: "#84a59d",
          highlight: "rgba(143, 159, 169, 0.15)",
          textHighlight: "#b3aa0288",
        },
      },
    },
  },
  plugins: {
    transformers: [
      Plugin.FrontMatter(),
      Plugin.CreatedModifiedDate({
        // content는 빌드 때 복사한 것이라 git 기록이 없다. 속성의 date · updated를 쓴다
        priority: ["frontmatter", "filesystem"],
      }),
      Plugin.SyntaxHighlighting({
        theme: {
          light: "github-light",
          dark: "github-dark",
        },
        keepBackground: false,
      }),
      // 본문의 #P0 같은 태그도 태그 페이지로 가는 링크가 된다(메인테이너가 inbox에서 요청, 2026-10-25).
      // 두 겹 아래 폴더에서 링크가 틀리는 Quartz v4.5.2의 버그는 patch-quartz.mjs가 고친다.
      // "#P0은"처럼 조사가 붙으면 그것까지 태그가 되므로, 글 속의 우선순위는 `P0`처럼 코드로 쓴다(CLAUDE.md)
      Plugin.ObsidianFlavoredMarkdown({ enableInHtmlEmbed: false, parseTags: true }),
      Plugin.GitHubFlavoredMarkdown(),
      Plugin.TableOfContents(),
      Plugin.CrawlLinks({ markdownLinkResolution: "shortest" }),
      Plugin.Description(),
      Plugin.Latex({ renderEngine: "katex" }),
    ],
    filters: [Plugin.RemoveDrafts()],
    emitters: [
      Plugin.AliasRedirects(),
      Plugin.ComponentResources(),
      Plugin.ContentPage(),
      // 폴더 페이지의 목록: 폴더 먼저, 그다음 파일 이름(번호)순. 세션 기록만 최근 것이 위
      // (기본은 고친 날짜가 최근인 것부터. 메인테이너가 inbox에서 요청, 2026-10-25)
      Plugin.FolderPage({
        sort: (a, b) => {
          const slug = (f: typeof a) => f.slug ?? ""
          const isFolder = (f: typeof a) => slug(f).endsWith("/index")
          const name = (f: typeof a) => slug(f).replace(/\/index$/, "").split("/").pop() ?? ""
          if (isFolder(a) !== isFolder(b)) return isFolder(a) ? -1 : 1
          const order = name(a).localeCompare(name(b), undefined, { numeric: true, sensitivity: "base" })
          return !isFolder(a) && slug(a).startsWith("atelier/sessions/") ? -order : order
        },
      }),
      Plugin.TagPage(),
      Plugin.ContentIndex({
        enableSiteMap: true,
        enableRSS: true,
      }),
      Plugin.Assets(),
      Plugin.Static(),
      Plugin.Favicon(),
      Plugin.NotFoundPage(),
      // 페이지마다의 링크 미리보기 그림(CustomOgImages)은 만들지 않는다 (빌드가 느리고 한글 글꼴을 따로 받아야 함).
      // 모든 페이지가 대표 그림 하나(site/og-image.png, make-og-image.mjs로 만듦)를 쓴다
    ],
  },
}

export default config
