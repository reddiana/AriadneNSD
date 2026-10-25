---
title: "ADR-0038: 빌드는 Vite(웹) · esbuild(Obsidian), 시험은 Vitest · fast-check · Playwright, 코드 검사는 ESLint + Prettier로 하고, 시험 파일은 소스 옆에 둔다"
tags:
  - adr
status: 승인
date: 2026-10-25
supersedes:
superseded-by:
---

# ADR-0038: 빌드는 Vite(웹) · esbuild(Obsidian), 시험은 Vitest · fast-check · Playwright, 코드 검사는 ESLint + Prettier로 하고, 시험 파일은 소스 옆에 둔다

> [!info] 누가 무엇을 정했나
> 시험 파일의 자리(T1), 코드 검사 도구(T2), 빌드 도구(T3)는 메인테이너가 시안 M40에서 골랐다(2026-10-25: "T1: 1 / T2: 1 / T3: 1", 모두 Claude의 추천). 시험 도구(Vitest, fast-check, Playwright, dependency-cruiser)는 품질 속성 시나리오에서 Claude가 후보로 적었고(2026-10-22), 2026-10-25에 확인을 받았다.

## 배경

코드의 자리는 `src/` 아래의 pnpm 모노레포로 정했다([[0036-code-layout|ADR-0036]]). 그 후속 작업으로 "시험 코드의 자리는 테스트 전략에서 정한다"가 남았다. 품질 속성 시나리오([[03-quality-attribute-scenarios#3. 시험 전략]])는 시험의 종류와 도구 후보를 적었지만, 빌드 도구와 코드 검사 도구는 정하지 않았다. 개발을 시작하려면 이것들이 있어야 하고, 컨트리뷰터의 코딩 스타일도 도구가 지키게 하려 한다([[backlog#MVP 전에 정할 것]]).

## 결정 기준

- `core`의 시험은 DOM 없이 Node에서 돈다(QA-14). 같은 모델이면 같은 SVG를 바이트로 비교할 수 있다(QA-03 · 04)
- 컨트리뷰터가 이미 아는 도구, 자료가 많은 도구
- 배포 대상의 관례를 따른다(Obsidian은 공식 견본 플러그인)
- 메인테이너는 백엔드 개발자이고 프론트엔드는 처음이다. 도구가 적고 표준적일수록 좋다

## 검토한 대안

견준 안과 그림은 시안 M40에 있다: https://claude.ai/artifact/L3vJp6CtYa4qzkCisFkJew (저장소의 사본 `journal/assets/2026-10-25-test-tools-study.html`)

### 시험 파일의 자리 (T1)

- **소스 바로 옆 `*.test.ts`**(골라짐): TypeScript · Vitest의 흔한 관례. 파일을 옮기면 시험도 함께 움직인다. 폴더 안 파일 수가 늘어난다.
- **패키지마다 `test/`**: Maven의 `src/test`와 같아 익숙하다. 폴더 나무를 두 벌 맞춰야 한다.

### 코드 검사 (T2)

- **ESLint(typescript-eslint) + Prettier**(골라짐): 가장 널리 쓰이고 편집기 지원이 넓다. 규칙을 직접 만들 수 있다(QA-13: 화면 글자를 코드에 박지 않기). 도구와 설정이 둘이다.
- **Biome**: 하나로 빠르다. 규칙과 플러그인이 적다.

### 빌드 (T3)

- **웹은 Vite, Obsidian은 esbuild**(골라짐): Vite는 React 웹 앱의 표준이고 Vitest가 같은 설정을 쓴다. Obsidian 공식 견본 플러그인이 esbuild로 `main.js` 하나를 만든다.
- **모두 Vite**: 도구가 하나지만, Obsidian 플러그인을 Vite로 묶는 것은 견본과 달라 자료가 적다.

## 결정

| 할 일 | 도구 | 자리 |
| --- | --- | --- |
| 패키지 관리 · 워크스페이스 | pnpm | 저장소 맨 위 (→ ADR-0036) |
| 언어 · 타입 검사 | TypeScript (`tsc --noEmit`) | 패키지마다 `tsconfig.json`. `core`는 `lib`에 DOM을 넣지 않는다(QA-14) |
| 웹 빌드 · 개발 서버 | Vite | `src/apps/web` |
| Obsidian 빌드 | esbuild (공식 견본의 설정) | `src/apps/obsidian` |
| 단위 시험 · 벤치마크 | Vitest | 소스 옆 `*.test.ts`, `*.bench.ts` |
| 속성 기반 시험 · 퍼징 | fast-check (Vitest 안에서) | 소스 옆 |
| 골든 파일 | Vitest + 저장소의 기대 파일 | 패키지마다 `golden/` |
| 브라우저 E2E · 시각 회귀 | Playwright | `src/apps/web/e2e/` |
| 의존 방향 검사 | dependency-cruiser | 저장소 맨 위 설정 하나 |
| 코드 검사 · 모양 맞추기 | ESLint(typescript-eslint) + Prettier | 저장소 맨 위 설정 하나씩 |
| CI | GitHub Actions | `.github/workflows/` |

쓰는 법(시험의 층, 골든 파일의 규칙, 인수 시험, CI의 순서)은 [[07-testing]]에 있다.

## 결과

- 좋아지는 점: 모두 TypeScript 생태계의 표준 도구라 자료가 많고 컨트리뷰터가 이미 안다. `core`의 시험은 Node에서 빠르게 돈다. 코딩 스타일은 사람이 아니라 도구가 지킨다.
- 감수하는 점: 빌드 도구가 둘(Vite, esbuild)이고 코드 검사 도구도 둘(ESLint, Prettier)이다. 시험 파일이 소스 폴더에 섞인다.
- 후속 작업: 개발을 시작할 때 이 도구들로 저장소의 뼈대(설정 파일, CI)를 만든다. `CONTRIBUTING.md`에 코딩 스타일(= ESLint + Prettier의 설정)과 시험을 돌리는 법을 더한다 → [[backlog#MVP 전에 정할 것]]
