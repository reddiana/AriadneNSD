---
title: Today I Learned (TIL)
tags:
  - til
updated: 2026-10-25
---

# Today I Learned (TIL)

TIL은 Today I Learned("오늘 배운 것")의 줄임말로, 개발자가 배운 것을 짧게 모아 두는 곳을 부르는 관례입니다. 여기는 메인테이너가 AriadneNSD를 만들며 **Claude에게 묻고 배운 것**을 모은 곳입니다. AriadneNSD만의 기술을 설명하는 곳이 아닙니다. 그것은 [[docs/README|설계 문서]]에 있습니다.

메인테이너는 백엔드 개발자이고 프론트엔드는 처음입니다. 그래서 프론트엔드 개념을 백엔드 경험에 빗대어 설명합니다.

이 폴더의 이름은 2026-10-25까지 `tech-notes/`(기술 노트)였습니다. 제품 고유의 기술처럼 읽혀서 바꿨습니다. 세션 기록과 타임라인에 적힌 `tech-notes/`는 그때의 기록이고, 지금의 `til/`입니다.

- 질문에 답하면서 설명한 기술은 주제마다 노트 하나로 남깁니다. (파일 이름: 영어 kebab-case, 예: `virtual-dom.md`)
- 노트에는 "한 줄 요약 → 백엔드로 비유하면 → AriadneNSD에서 어디에 쓰나 → 더 읽을거리" 순서로 씁니다.

## 노트 목록

주제별로 묶었습니다. 새 노트는 맞는 주제 아래에 한 줄 더하고, 맞는 주제가 없으면 주제를 새로 만듭니다. 파일은 모두 `til/` 바로 아래에 있습니다.

### 브라우저

- [[browser-focus-and-double-click]] — 브라우저의 포커스 표시(캔버스의 파란 선)와 더블클릭이 안 먹던 이유 (2026-10-10)
- [[keyboard-keys-and-ime]] — 키보드 입력 읽기: 글자(`key`)와 자리(`code`), 한글 입력기와 조합, 두 번 누르는 키, 브라우저가 가져가는 키 (2026-10-13)
- [[browser-storage-and-api-keys]] — 브라우저 저장소와 API 키: 서버 없는 페이지에서 AI를 부르는 법, 저장소를 읽을 수 있는 것은 누구인가, CORS (2026-10-14)
- [[theme-aware-images]] — 테마에 따라 그림 바꾸기와 그 한계: `prefers-color-scheme`은 운영체제를 본다, GitHub의 스크립트, 브라우저 콘솔로 페이지 상태 읽기 (2026-10-11)
- [[viewport-meta]] — 휴대폰이 페이지를 980px로 그리는 까닭: `viewport` 메타 태그 한 줄이 없으면 좁은 화면 CSS가 듣지 않는다 (2026-11-01)

### 그림과 글자

- [[pixel-aligned-lines]] — 선을 픽셀에 맞추기: 선은 좌표의 양쪽으로 반씩 퍼진다, 굵기가 다른 선이 어긋나는 까닭, 그림 전체를 반 픽셀 옮기기 (2026-10-13)
- [[text-width-and-bundled-fonts]] — 글자의 폭과 번들 글꼴: 폭은 글꼴 파일에 적혀 있다, 기기마다 달라지는 까닭 셋, 번들과 셈하기, 그림에 글꼴 조각 넣기, wasm (2026-10-13)
- [[visual-design-basics]] — 시각 디자인 명세의 기초: UX 문서에 시각 디자인이 들어가는가, 디자인 토큰 세 단계, WCAG 대비율, 색각 이상과 흑백, 포커스 표시, claude.ai 페이지(아티팩트) (2026-10-17)
- [[logo-and-icon-assets]] — 로고와 아이콘 파일 만들기: 벡터, 사진 옮기기, 크기별 판, 윤곽선 글자, 라이선스 (2026-10-10)
- [[model-layout-render-theme]] — 모양을 바꾸는 일의 크기: 모델 · 레이아웃 · 그리기 · 테마의 네 단계, 테마로 바꿀 수 있는 것과 없는 것 (2026-10-11)

### 설계와 기술 선택

- [[spike-prototype-mvp]] — 스파이크, 프로토타입, MVP의 차이 (2026-10-10)
- [[ui-framework-choice]] — UI 프레임워크 고르기: 프레임워크가 하는 일(손으로 · 컴파일러 · 다시 부르기), 잰 크기, 개발자 층, React를 읽을 때 알아 둘 것, 그 프로그램의 메뉴에 올리기, lexer와 parser, 실행 취소의 두 층 (2026-10-18)
- [[wasm-and-shell]] — wasm과 셸: JVM 바이트코드에 견준 WebAssembly, 우리가 HarfBuzz를 wasm으로 쓰는 곳, 셸은 배포 대상마다의 바깥 프로그램(저장소 어댑터에 견줌) (2026-10-17)
- [[monorepo-and-tools]] — 모노레포와 개발 도구: `apps/`와 `packages/`의 뜻, Maven 멀티 모듈에 빗댐, 빌드 · 시험 · 코드 검사 도구를 Java 도구에 빗댄 표 (2026-10-25)
- [[benchmark-numbers]] — 속도를 잰 숫자 읽기: 중앙값과 느린 5%(p95), 워밍업, 누를 때마다 숫자가 다른 까닭 (2026-10-25)

### 배포 대상

- [[obsidian-plugin-internals]] — Obsidian 플러그인이 파일 열기와 메뉴에 끼어드는 법 (2026-10-10)
- [[obsidian-links-and-anchors]] — Obsidian 링크의 앵커: 제목과 블록 ID, 블록 ID는 숨고 표의 한 줄에는 달 수 없다, 사이트에서는 줄마다 id (2026-10-26)
- [[drive-app-basics]] — Google Drive 앱의 기초 (2026-10-09, 시퀀스 다이어그램·client secret 추가 2026-10-10)
- [[build-output-and-releases]] — 앱은 어디로 내보내나: 빌드 결과를 커밋하지 않는 까닭, GitHub Releases, Obsidian이 저장소 맨 위의 `manifest.json`을 읽는 까닭 (2026-10-25)

### git과 GitHub

- [[git-line-endings]] — git과 줄 끝 문자 (LF / CRLF) (2026-10-10. 2026-10-22에 "내용은 같은데 modified"를 더함)
- [[git-history-rewrite]] — git 기록에서 파일 지우기: 지워도 남는 까닭, 기록 고쳐 쓰기, 강제 push, 바뀌는 해시 (2026-10-11)
- [[github-pages-site]] — GitHub Pages로 문서 사이트 펴내기: 저장소 하나에 사이트 하나, 정적 사이트 생성기 Quartz, GitHub Actions, 첫 화면은 README로, custom.scss, 주소가 저절로 링크가 될 때 (2026-10-18, 링크 공유 그림(og:image)과 페이스북의 캐시 2026-10-25)

### 오픈소스 운영

- [[open-source-licenses]] — 오픈소스 라이선스 고르기: MIT · Apache-2.0 · GPL, `NOTICE` 파일, 글에는 CC BY, 라이선스와 상표의 차이 (2026-10-11)
- [[names-and-registries]] — 이름을 잡아 두는 곳들: npm, 도메인, GitHub Pages와 그 비용 (2026-10-10)
- [[feedback-and-funding-channels]] — 사용자 의견 받기(Issues·Discussions·양식)와 후원·광고 채널 (2026-10-10)
