---
title: 모노레포와 개발 도구
tags:
  - til
updated: 2026-10-25
---

# 모노레포와 개발 도구

(← [[til/README|TIL]])

메인테이너가 물었다: "패키지 다이어그램에서 `apps/web` 등은 알겠는데 `packages/core` 등은 모르겠어요. `packages/`가 뭔가요?" (inbox, 2026-10-25). 같은 날 시안 M40에서 빌드 · 시험 도구를 Java에 빗대어 골랐다.

## 한 줄 요약

모노레포는 여러 프로그램과 라이브러리를 저장소 하나에 둔 것이다. JavaScript 쪽에서는 관례로 **내놓는 프로그램을 `apps/`**, **그것들이 함께 쓰는 라이브러리를 `packages/`**에 둔다.

## 백엔드로 비유하면

| JavaScript 모노레포 | Java (Maven · Gradle) |
| --- | --- |
| 저장소 하나에 패키지 여럿, `pnpm-workspace.yaml` | 멀티 모듈 프로젝트, 부모 `pom.xml` · `settings.gradle` |
| `packages/core` (`@ariadne-nsd/core`) | 공통 라이브러리 모듈(`common`, `domain` jar) |
| `apps/web` | 실행 모듈(Spring Boot 실행 jar, war) |
| `package.json`의 `dependencies`에 `@ariadne-nsd/core` | `<dependency>`로 다른 모듈을 가져옴 |
| pnpm | Maven · Gradle의 의존성 관리 |

빌드 · 시험 도구(→ [[0038-build-and-test-tools|ADR-0038]]):

| 할 일 | AriadneNSD | Java라면 |
| --- | --- | --- |
| 빌드 · 묶기 | Vite(웹), esbuild(Obsidian) | Gradle 빌드, jar · war 묶기 |
| 단위 시험 · 벤치마크 | Vitest | JUnit, JMH |
| 속성 기반 시험 | fast-check | jqwik |
| 브라우저 시험 | Playwright | Selenium |
| 의존 방향 검사 | dependency-cruiser | ArchUnit |
| 실수 검사 · 모양 맞추기 | ESLint + Prettier | Checkstyle · SpotBugs, Spotless |
| 시험 파일의 자리 | 소스 옆 `measure.test.ts` | `src/test/java` (따로) |

마지막 줄만 관례가 다르다. TypeScript 쪽은 시험 파일을 소스 바로 옆에 두는 일이 흔하고, AriadneNSD도 그렇게 했다.

## AriadneNSD에서는

- 코드는 모두 `src/` 아래에 있고 `src/`가 워크스페이스의 뿌리다. 화살표는 `apps/web → packages/editor → packages/core → packages/fonts`(쓰는 쪽 → 쓰이는 쪽) → [[03-architecture#3. 구성 요소]]
- `core`에는 화면(DOM)이 없어서 Node에서 바로 시험한다 → [[07-testing]]

## 더 읽을거리

- [pnpm: Workspace](https://pnpm.io/workspaces)
- [Vitest](https://vitest.dev/), [Vite](https://vite.dev/)
