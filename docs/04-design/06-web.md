---
title: 웹
tags:
  - design
status: 초안
updated: 2026-11-01
---

# 웹

웹 셸입니다. 셸은 `editor`를 감싸는 어댑터로, [[03-architecture#3.2 editor와 셸의 인터페이스|아키텍처 3.2]]의 필요 인터페이스를 구현하고 제공 인터페이스를 사용합니다. 웹에서의 구현은 [[0031-shell-interfaces|ADR-0031]] · [[0033-command-list-for-shells|ADR-0033]]에서 정했습니다. 백엔드 서버가 없는 정적 사이트입니다([[01-requirements#^r-web|R-WEB-01]]).

코드: `src/apps/web`, Google Drive 연동도 여기에 둡니다 (→ [[0036-code-layout|ADR-0036]])

| 인터페이스 | 방향 | 웹에서 |
| --- | --- | --- |
| `DocumentStore` | 필요 (셸이 구현) | 브라우저 파일 I/O (1장). 다른 문서는 사용자가 권한을 준 파일이나 폴더 안에서만 읽고, 그 밖이면 `null` |
| `SettingsStore` | 필요 (셸이 구현) | 그 브라우저의 저장소 |
| `CommandRegistry` | 제공 (셸이 사용) | 우리 도구 모음과 컨텍스트 메뉴 |
| `SettingsSchema` | 제공 (셸이 사용) | 우리 설정 창 |

## 관련 요구사항

- [[01-requirements#2.3 웹 (정적 페이지)]]
- [[01-requirements#^r-exp|R-EXP-04]]
- 공유 URL, 보기 전용, Google Drive, AI 대화창: [[01-requirements#^r-web|R-WEB-05]], [[01-requirements#^r-web|R-WEB-06]], [[01-requirements#2.4 Google Drive]], [[01-requirements#^r-web|R-WEB-07]]

## 1. 파일 열기·저장

> [!info] 미완성: 브라우저별 흐름 (`DocumentStore`의 구현체가 둘이 됨)
> - Chromium 계열: File System Access API(`FileSystemFileHandle`)로 원래 파일에 덮어쓰기
> - 그 밖의 브라우저: `<input type="file">`로 열기 → 편집 → 다운로드로 저장
> - 두 흐름의 화면 차이를 사용자에게 어떻게 보여 줄지

## 2. 임시 보관

> [!info] 미완성: 작성 중인 내용을 브라우저 저장소에 자동 임시 저장, 복구 안내 ([[01-requirements#^r-web|R-WEB-03]])

## 3. 공유 URL과 보기 전용

> [!info] 미완성: 문서를 압축 · 인코딩해 URL에 담아 공유하기 ([[01-requirements#^r-web|R-WEB-05]]), 읽기 전용 모드 ([[01-requirements#^r-web|R-WEB-06]])

## 4. Google Drive

> [!info] 미완성: 웹 셸 위에 얹는 Drive 연동 ([[0012-google-drive-integration|ADR-0012]]): 새로 만들기 · 연결 앱으로 열기 · 저장 · 미리보기 ([[01-requirements#^r-gd|R-GD-02]], [[01-requirements#^r-gd|R-GD-01]], [[01-requirements#^r-gd|R-GD-03]], [[01-requirements#^r-gd|R-GD-04]]). 확장자는 `.ns.svg` ([[0014-drive-file-extension|ADR-0014]])

## 5. 배포

웹 버전은 GitHub Pages의 `https://reddiana.github.io/AriadneNSD/app/`에 놓인다. 같은 사이트에 설계 문서(`/docs/`, `/atelier/`)와 사용자 매뉴얼(`/manual/`)이 함께 있고, 한 GitHub Actions 워크플로(`.github/workflows/pages.yml`)가 모두 빌드해 한 번에 배포한다. 그래서 앱 빌드의 base path를 `/AriadneNSD/app/`으로 두고, 빌드 산출물을 그 워크플로의 `_site/app/`에 넣는다. → [[dr-0013-publish-docs-github-pages|DR-0013]]

> [!info] 미완성: 빌드 산출물 구성(코드 스플리팅, 번들 글꼴과 서브세팅 wasm을 어디에 두는지, 캐시 전략)

## 6. PWA

> [!info] 미완성: 오프라인 사용(서비스 워커), 설치 ([[01-requirements#^r-web|R-WEB-04]])

## 7. 화면 배치

데스크톱 버전과 거의 같은 화면으로 한다. 본보기는 [Structorizer](https://structorizer.fisch.lu/)(메뉴 막대와 블록 모양 아이콘의 도구 모음)다. 정한 과정 → [[ux-decisions#W1. 웹 화면의 배치|W1]], 그림 → 시안 M44 https://claude.ai/artifact/VpocjhpW3vtPJ8UHvoyFgX (사본 `journal/assets/2026-11-01-web-screen-study.html`)

```
┌──────────────────────────────────────────────────────────────┐
│ AriadneNSD  파일 편집 다이어그램 보기 도움말   예제.ns.svg ● │  메뉴 막대
│ 새로 열기 저장 내보내기 │ ↶ ↷ │ ✂ ⧉ 📋 │ ▭ ▽ ⨷ ⊐ ⊐ ⊓ │ 감싸기 확대 │  도구 모음
├──────────────────────────────────────────────────────────────┤
│                                                              │
│                        다이어그램                            │  캔버스
│                                                              │
├──────────────────────────────────────────────────────────────┤
│ 고른 것 · 알림                                                │  상태 줄
└──────────────────────────────────────────────────────────────┘
```

- **메뉴 막대:** 파일 · 편집 · 다이어그램 · 보기 · 도움말. 메뉴에는 명령 이름 옆에 키를 적는다. 데스크톱 버전은 운영체제의 메뉴 막대에 같은 메뉴를 둔다.
- **도구 모음 한 줄:** 파일(새로 · 열기 · 저장 · 내보내기), 되돌리기 · 다시, 잘라내기 · 복사 · 붙이기, **블록 아이콘 여섯**(처리 · If · Case · While · For · Do-While), 감싸기 · 확대. 블록 아이콘은 블록의 모양과 색을 그대로 줄인 그림이다. 쓰는 법 → [[02-interaction-rules#블록 아이콘으로 넣기 · 감싸기]]
- 메뉴 · 도구 모음 · 오른쪽 클릭 메뉴는 모두 명령 목록 하나에서 나온다 → [[0033-command-list-for-shells|ADR-0033]]
- **캔버스**가 나머지를 모두 쓴다. 노트북 브라우저(1366 × 657)에서 다이어그램에 남는 칸은 1366 × 593(세로 90%)이다.
- **좁은 화면**(폭 860px 이하): 메뉴는 ☰ 하나로 접고, 블록 아이콘 줄은 남긴다. 되돌리기 · 다시 · 감싸기 · 도움말은 화면 아래 줄로 내린다 → [[ux-decisions#MB1. 좁은 화면|MB1]]

> [!info] 미완성: 메뉴마다 어느 명령이 들어가는지, 도구 모음 아이콘의 그림(블록 아이콘 말고), 아이콘에 마우스를 올렸을 때의 글.

## 미결정 사항

아래 물음의 견준 안은 시안 M44 https://claude.ai/artifact/VpocjhpW3vtPJ8UHvoyFgX (사본 `journal/assets/2026-11-01-web-screen-study.html`)에 있습니다.

> [!question] 미결정
> - **W3. 파일 이름과 저장 상태의 자리:** 캔버스 위 편집기 탭(VS Code · IntelliJ처럼, 저장 안 됐으면 `●`), 메뉴 막대 오른쪽(데스크톱의 창 제목 자리), 또는 아래 상태 줄. 최근 파일([[01-requirements#^r-exp|R-EXP-04]])은 파일 메뉴의 "최근 파일 ▸".
> - **W3-b. 임시 보관과 자동 저장:** 임시 보관([[01-requirements#^r-web|R-WEB-03]])은 늘 한다. 원래 파일에 자동 저장([[01-requirements#^r-exp|R-EXP-04]])을 기본으로 켤지 끌지. 원래 파일에 쓸 수 있는 것은 Chromium 계열뿐이다.
> - **W4. 도움말([[01-requirements#^r-edit|R-EDIT-21]])의 모양:** 새 탭으로 여는 한 페이지 사용법과 `?` 키의 단축키 겹창, 또는 오른쪽 접는 패널.
> - **W5. 설정의 자리:** 문서 설정(파일에 저장)과 환경 설정(이 브라우저)을 창 둘로 나눌지, 한 창의 탭 둘("사용자 · 이 문서", VS Code의 "User · Workspace"처럼)로 할지.
> - **W6. 명령 찾기 창:** VS Code의 Command Palette · IntelliJ의 Find Action처럼 명령 이름을 쳐서 찾는 창(`Ctrl`+`Shift`+`P`)을 둘지. 요구사항에 없어, 둔다면 요구사항을 더한다.
