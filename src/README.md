# 코드

AriadneNSD의 코드입니다. pnpm 워크스페이스이고, 이 폴더(`src/`)가 그 루트입니다. 폴더의 자리는 [ADR-0036](../atelier/adr/0036-code-layout.md), 규칙은 [코딩 가이드](../docs/07-coding-guide/07-coding-guide.md)에 있습니다.

| 폴더 | 패키지 | 하는 일 |
| --- | --- | --- |
| `packages/core` | `@ariadne-nsd/core` | 문서 모델, 편집 명령, 레이아웃, SVG 렌더링, 파일 형식. DOM 없이 Node에서도 실행된다 |
| `packages/fonts` | `@ariadne-nsd/fonts` | 번들 글꼴(D2Coding에서 만든 것), advance 폭 테이블, 저장 파일용 서브셋 글꼴(WOFF) |
| `packages/editor` | `@ariadne-nsd/editor` | 편집기 화면 |
| `apps/web` | `@ariadne-nsd/web` | 웹 버전(Vite + React) |

## 준비

- Node.js 24 이상
- pnpm 12: `npm install -g pnpm`. Node 25부터는 corepack이 Node에 들어 있지 않습니다. 버전은 `package.json`의 `packageManager`에 고정되어 있습니다

```sh
cd src
pnpm install
pnpm --filter @ariadne-nsd/web exec playwright install chromium   # E2E를 실행할 때 한 번
```

## 자주 쓰는 명령

모두 `src/`에서 실행합니다.

| 명령 | 하는 일 |
| --- | --- |
| `pnpm dev` | 웹 앱의 개발 서버(http://localhost:5173) |
| `pnpm build` | 웹 앱을 `apps/web/dist/`에 빌드 |
| `pnpm check` | 타입 검사 → 린트 → 포맷 확인 → 의존 방향 → 단위 테스트. CI도 이것을 실행한다 |
| `pnpm test` | 단위 테스트만 (`pnpm --filter @ariadne-nsd/core test`처럼 패키지 하나만도) |
| `pnpm e2e` | 웹 앱을 빌드해 Chromium으로 E2E |
| `pnpm format` | Prettier로 코드 포맷을 맞춤 |
| `pnpm lint` · `pnpm typecheck` · `pnpm deps` | 검사를 하나씩 |
| `pnpm --filter @ariadne-nsd/core golden:update` | 골든 파일을 다시 만듦(의도한 변경일 때만) |

## 글꼴을 다시 만들 때

`packages/fonts/assets/`의 글꼴과 `packages/fonts/src/generated/advance-widths.ts`는 스크립트가 만든 것이고 저장소에 넣어 둡니다. 원본 글꼴의 버전을 바꿀 때만 다시 만듭니다. Python 3와 fontTools · brotli가 필요합니다(`pip install fonttools brotli`).

```sh
cd src/packages/fonts
py -3.14 -I scripts/build-fonts.py   # D2Coding 릴리스를 받아(sha256 확인) 만든다
```
