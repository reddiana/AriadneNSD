---
title: "ADR-0036: 코드는 src/ 아래의 pnpm 모노레포로 두고, core는 패키지 하나, Obsidian의 manifest.json 사본은 저장소 맨 위에 둔다"
tags:
  - adr
status: 승인
date: 2026-10-25
supersedes:
superseded-by:
---

# ADR-0036: 코드는 src/ 아래의 pnpm 모노레포로 두고, core는 패키지 하나, Obsidian의 manifest.json 사본은 저장소 맨 위에 둔다

## 배경

MVP 개발을 앞두고 코드를 저장소의 어디에 어떤 모양으로 둘지 정해야 한다(메인테이너, inbox 2026-10-25: "MVP 직전입니다. src/ 구조를 어떻게 할 것인지 결정해야합니다. 배포 대상이 다양한 것을 고려합시다."). 큰 틀은 이미 있다. 공통 패키지(`fonts` · `core` · `editor`)와 배포 대상마다의 셸(`apps/*`)을 한 저장소에 두는 모노레포다([[0002-three-targets-shared-core|ADR-0002]], [[03-architecture#3.1 패키지 의존]]). 남은 것은 셋이다.

1. 저장소의 맨 위에는 이미 글의 폴더(`docs/` · `atelier/` · `journal/` · `til/` · `site/`)가 있다. 코드 폴더를 그 옆에 둘지, 한 폴더 아래로 모을지.
2. `core`의 여섯 모듈(모델, 편집 명령, 텍스트, 레이아웃, 렌더러, 파일 형식)을 패키지 하나로 둘지, 모듈마다 패키지로 나눌지.
3. Obsidian 커뮤니티 플러그인 목록은 등록한 저장소 **맨 위의 `manifest.json`**을 읽어 플러그인의 이름과 판을 안다. 플러그인 파일(`main.js` · `manifest.json` · `styles.css`)은 GitHub Release에서 받아 간다. 모노레포에서 이 파일을 어떻게 둘지.

배포 대상 일곱(→ [[01-requirements#2. 배포 대상]])이 모두 이 배치에 들어가야 한다.

견준 안과 폴더 그림은 시안 M32에 있다: https://claude.ai/artifact/1DvKn8bNcYKUkwvQv5bnhM (저장소의 사본 `journal/assets/2026-10-25-code-layout-study.html`).

## 결정 기준

- 배포 대상 일곱이 각자의 자리를 갖고, 나중의 대상(Confluence, IDE 플러그인, Claude skill)을 더해도 배치가 흔들리지 않는다
- 설계와 코드를 한 커밋으로 함께 바꿀 수 있다("`docs/`는 개발된 애플리케이션과 동치", CLAUDE.md)
- 글과 코드가 저장소에서 한눈에 갈린다
- `core`의 의존 방향(아키텍처 3.3)을 기계가 지킨다
- 관리할 설정과 판 번호가 적다

## 검토한 대안

### 1. 코드 폴더의 자리

- **맨 위에 `apps/`와 `packages/`**: TypeScript 모노레포의 흔한 모양이고 ADR-0002의 이름과 경로가 그대로 맞는다. 맨 위의 폴더가 아홉으로 늘어 글과 코드가 섞여 보인다.
- **모두 `src/` 아래** (고름): 맨 위에서 "글은 여기, 코드는 `src/`"가 갈린다. Maven · Gradle의 `src/`와 닮아 백엔드 개발자에게 익숙하다. 경로가 한 겹 깊어지고(`src/packages/core/src/…`), 패키지 명령은 `src/`에서 실행한다.
- **코드는 다른 저장소**: 두 저장소가 깔끔하다. 설계와 코드를 함께 바꾸는 변경이 커밋 둘로 갈라지고, 펴낸 사이트의 `/app/`에 앱을 올리려면 저장소를 건너 빌드해야 한다.

### 2. `core`를 나누는 정도

- **패키지 하나, 안을 폴더로** (고름): 빌드 · 판 번호 · 설정이 하나다. 폴더 사이의 의존 방향은 검사 도구로 지킨다.
- **모듈마다 패키지**: 의존 방향을 패키지 의존이 강제한다. `package.json` · 빌드 설정 · 판 번호가 여섯 벌이 되고, 아직 써 보지 않은 경계를 굳힌다.

### 3. Obsidian의 `manifest.json`

- **맨 위에 사본** (고름): 저장소 하나, 이슈 하나. 맨 위에 파일 둘(`manifest.json`, `versions.json`)이 더 생긴다.
- **플러그인만 다른 저장소로 내보냄**: 맨 위가 깔끔하다. 저장소가 둘이 되고, CI가 다른 저장소에 쓸 권한을 가져야 한다.

## 결정

세 물음 모두 메인테이너가 시안 M32에서 골랐다(S1 2번, S2 1번, S3 1번).

**코드는 모두 `src/` 아래에 둔다.** `src/`가 pnpm 워크스페이스의 뿌리다. 아키텍처 문서의 패키지 이름(`packages/core`, `apps/web` …)은 `src/`에서 본 경로다.

```text
AriadneNSD/
├─ src/                      코드 (pnpm 워크스페이스의 뿌리)
│  ├─ package.json
│  ├─ pnpm-workspace.yaml    packages: apps/*, packages/*
│  ├─ tsconfig.base.json
│  ├─ packages/
│  │  ├─ fonts/              @ariadne-nsd/fonts
│  │  ├─ core/               @ariadne-nsd/core
│  │  └─ editor/             @ariadne-nsd/editor
│  └─ apps/
│     ├─ web/                웹 (Google Drive 연동도 여기)
│     ├─ obsidian/           Obsidian 플러그인 (manifest.json의 원본)
│     └─ desktop/            데스크톱
├─ manifest.json             Obsidian이 읽는 사본
├─ versions.json             플러그인 판 → 최소 Obsidian 판
├─ docs/ atelier/ journal/ til/
├─ site/                     문서 사이트 빌드
└─ .github/workflows/
```

| 배포 대상 | 코드의 자리 | 내보내는 곳 |
| --- | --- | --- |
| 웹 | `src/apps/web` | 펴낸 사이트의 `/app/` ([[dr-0013-publish-docs-github-pages\|DR-0013]]). 문서 사이트와 한 워크플로에서 |
| Google Drive | `src/apps/web` 안 ([[0012-google-drive-integration\|ADR-0012]]) | 웹과 같음 |
| Obsidian 플러그인 | `src/apps/obsidian` | GitHub Release, 커뮤니티 플러그인 목록 |
| 데스크톱 | `src/apps/desktop` | GitHub Release |
| Confluence (나중에) | `src/apps/confluence` | Atlassian Marketplace |
| IDE 플러그인 (나중에) | `src/apps/vscode`, `src/apps/intellij` | 각 마켓플레이스 |
| Claude skill (나중에) | `src/skills/ariadne-nsd` (셸이 아님) | 저장소 |

나중의 대상은 만들 때 폴더를 만든다.

**`core`는 패키지 하나로 두고, 안을 모듈마다 폴더로 나눈다**(`src/model/` · `commands/` · `text/` · `layout/` · `render/` · `format/`). 밖에는 `index.ts`가 내놓는 것만 보인다. 아키텍처 3.3의 의존 방향은 import 검사 도구(예: dependency-cruiser)를 CI에 넣어 지킨다. 어기면 빌드가 실패한다. 따로 내놓을 필요가 생기면 그때 폴더 하나를 패키지로 떼어 낸다.

**Obsidian의 `manifest.json`은 원본을 `src/apps/obsidian/`에 두고, 사본을 저장소 맨 위에 둔다.** 판을 올리는 스크립트가 원본을 맨 위로 복사하고 `versions.json`을 갱신한다. CI는 둘이 다르면 실패한다.

빌드 결과(`dist/`)는 저장소에 넣지 않는다. GitHub Actions가 빌드해 위 표의 "내보내는 곳"으로 보낸다.

## 결과

- 좋아지는 점: 글과 코드가 맨 위에서 갈린다. 배포 대상이 늘어도 `src/apps/` 아래에 폴더 하나씩 더하면 된다. 설계와 코드를 한 커밋으로 바꾼다.
- 감수하는 점: 경로가 한 겹 깊다(`src/packages/core/src/layout/…`). 패키지 명령은 `src/`에서 실행하고, 워크플로에는 `working-directory: src`를 적는다. 맨 위에 Obsidian용 파일 둘이 있다(README에 까닭을 한 줄 적는다).
- 후속 작업:
	- 빌드 도구(웹 · 편집기는 Vite, Obsidian은 esbuild를 후보로)와 import 검사 도구는 테스트 전략의 "빌드 · 테스트 도구 ADR"에서 정한다 → [[backlog#MVP 전에 정할 것]]
	- 시험 코드의 자리(소스 옆 `*.test.ts` 또는 `test/`, 골든 SVG의 자리)는 테스트 전략에서 정한다
	- `src/apps/desktop`의 안쪽 모양은 [[0009-desktop-framework|ADR-0009]]를 따른다(Tauri면 `src-tauri/`가 생긴다)
	- 코드를 처음 넣을 때 CLAUDE.md와 `README.md`의 저장소 구성 표에 `src/`를 더한다
