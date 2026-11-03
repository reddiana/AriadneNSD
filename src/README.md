# 코드

AriadneNSD의 코드입니다. 이 폴더(`src/`)가 pnpm 워크스페이스의 루트이고, 모든 명령은 여기서 실행합니다. 코드를 쓰기 전에 [코딩 가이드](../docs/07-coding-guide/07-coding-guide.md)를 읽습니다.

## 폴더 구성

패키지는 넷입니다. 의존은 `apps/web` → `editor` → `core` → `fonts` 방향으로만 가고, 거꾸로는 가져오지 않습니다(dependency-cruiser가 검사).

| 폴더 | 패키지 | 하는 일 |
| --- | --- | --- |
| `packages/core` | `@ariadne-nsd/core` | 문서 모델, 편집 명령, 레이아웃, SVG 렌더링, 파일 형식. DOM 없이 Node에서도 실행된다 |
| `packages/fonts` | `@ariadne-nsd/fonts` | 번들 글꼴(D2Coding에서 만든 것), advance 폭 테이블, 저장 파일용 서브셋 글꼴(WOFF) |
| `packages/editor` | `@ariadne-nsd/editor` | 편집기: 화면, 선택, 키 · 마우스 입력, 명령 목록, 메뉴 · 툴바(React) |
| `apps/web` | `@ariadne-nsd/web` | 웹 버전(Vite + React): 파일 열기 · 저장, 로컬 백업, 자동 저장, 최근 파일 |

패키지 안의 폴더입니다.

| 폴더                                                        | 무엇                                                         |
| --------------------------------------------------------- | ---------------------------------------------------------- |
| `packages/core/src/model/`                                | 모델 타입, id 생성기, 불변식 검사                                      |
| `packages/core/src/commands/`                             | 편집 명령(순수 함수)                                               |
| `packages/core/src/text/` · `layout/` · `render/`         | 텍스트 폭, 두 단계 레이아웃, 씬 빌드와 SVG 문자열                            |
| `packages/core/src/format/`                               | 모델 JSON, SVG 파일의 조립과 열기                                    |
| `packages/core/src/i18n/`                                 | 그림에 적는 고정 문구(참 · 거짓 …)                                     |
| `packages/core/golden/`                                   | 골든 파일(`.ns.svg` 하나가 입력이자 기대 출력), `golden/render/`는 그림만의 골든 |
| `packages/core/node/`                                     | Node에서만 실행되는 테스트(골든 파일은 Node의 서브세터를 씀)                     |
| `packages/fonts/assets/`                                  | 만들어 둔 글꼴 파일과 라이선스(`OFL.txt`)                               |
| `packages/fonts/src/` · `browser/` · `node/`              | 폭 테이블과 서브세팅, 브라우저용 · Node용 로더                              |
| `packages/fonts/scripts/`                                 | 글꼴을 다시 만드는 스크립트(아래)                                        |
| `packages/editor/src/session/` · `state/` · `navigation/` | 편집 세션, 선택, 이동 규칙                                           |
| `packages/editor/src/input/` · `dom/` · `clipboard/`      | 키 표와 키 해석, 히트 테스트 · 드롭, 화면 레이어, 클립보드                       |
| `packages/editor/src/commands/` · `save/` · `i18n/`       | 명령 목록, 저장 파일 만들기, 화면 문자열                                   |
| `packages/editor/src/ui/`                                 | 메뉴 바, 툴바, 상태 표시줄, 커맨드 팔레트, 모달, 컨텍스트 메뉴(React)              |
| `packages/editor/src/contracts.ts`                        | 셸과의 계약(`EditorHandle`, `DocumentStore` …)                  |
| `apps/web/src/shell/` · `files/` · `storage/` · `fonts/`  | 웹 셸, 파일 I/O · PNG 내보내기, IndexedDB · 설정, 글꼴 로딩              |
| `apps/web/e2e/`                                           | 브라우저 E2E와 인수 테스트(`acceptance.spec.ts`)                     |
| `apps/web/scripts/`                                       | 번들 사이즈 체크(bundle size budget)                                                |

단위 테스트는 소스 옆의 `*.test.ts`, 벤치마크는 `*.bench.ts`입니다. 이렇게 나눈 이유와 정한 과정은 [ADR-0036](../atelier/adr/0036-code-layout.md)에 있습니다.

## 준비

- Node.js 24 이상
- pnpm 12: `npm install -g pnpm`. Node 25부터는 corepack이 Node에 들어 있지 않습니다. 버전은 `package.json`의 `packageManager`에 고정되어 있습니다

```sh
cd src
pnpm install
pnpm --filter @ariadne-nsd/web exec playwright install chromium   # E2E를 실행할 때 한 번
```

## 자주 쓰는 명령

| 명령                                              | 하는 일                                                        |
| ----------------------------------------------- | ----------------------------------------------------------- |
| `pnpm dev`                                      | 웹 앱의 개발 서버(http://localhost:5173)                           |
| `pnpm build`                                    | 웹 앱을 `apps/web/dist/`에 빌드                                   |
| `pnpm check`                                    | 타입 검사 → 린트 → 포맷 확인 → 의존 방향 → 단위 테스트. CI도 이것을 실행함            |
| `pnpm test`                                     | 단위 테스트만 (`pnpm --filter @ariadne-nsd/core test`처럼 패키지 하나만도) |
| `pnpm e2e`                                      | 웹 앱을 빌드해 Chromium으로 E2E                                     |
| `pnpm coverage`                                 | 단위 테스트와 E2E를 커버리지와 함께 돌려 패키지마다의 줄 커버리지(둘을 합침)를 보여 줌 |
| `pnpm coverage:check`                           | 위와 같고, 한 패키지라도 90%보다 낮거나 테스트가 실패하면 실패. CI의 `coverage` job이 실행함 |
| `pnpm format`                                   | Prettier로 코드 포맷을 맞춤                                         |
| `pnpm lint` · `pnpm typecheck` · `pnpm deps`    | 검사를 하나씩                                                     |
| `pnpm --filter @ariadne-nsd/core golden:update` | 골든 파일을 다시 만듦(의도한 변경일 때만)                                    |

## 판을 낼 때

`main`에 push할 때마다 웹 앱이 사이트에 올라가지만, 버전은 판을 낼 때만 올립니다. 버전은 SemVer이고 단계(MVP → 웹 베타 → 웹 1.0)는 [DR-0018](../atelier/decisions/dr-0018-release-stages.md)이 정합니다. 파일 형식의 버전(`v1`)과는 따로 갑니다.

- 1.0 전에는 기능을 더한 판이 `0.y.0`, 고치기만 한 판이 `0.y.z`입니다. 웹 1.0이 `1.0.0`입니다.
- 패키지 넷(`apps/web`, `packages/core` · `editor` · `fonts`)의 `package.json`과 `packages/editor/src/version.ts`는 늘 같은 버전입니다. 어긋나면 `version.test.ts`가 실패합니다. 이 버전이 도움말 › AriadneNSD에 대하여에 보입니다.

순서:

1. 위 다섯 곳의 버전을 올린다
2. 도움말 › 이 버전에서 바뀐 것의 문구(`packages/editor/src/ui/messages.ts`의 `whatsNew.body`, 영어 · 한국어)를 고친다
3. `pnpm check`, `pnpm e2e`가 통과하면 커밋하고 주석 태그를 단다: `git tag -a v0.2.0 -m "0.2.0"` (`--follow-tags`는 주석 태그만 올린다)
4. 커밋과 태그를 push한다(`git push --follow-tags`). GitHub의 Releases에 그 태그로 바뀐 것을 적는다

## 글꼴을 다시 만들 때

`packages/fonts/assets/`의 글꼴과 `packages/fonts/src/generated/advance-widths.ts`는 스크립트가 만든 것이고 저장소에 넣어 둡니다. 원본 글꼴의 버전을 바꿀 때만 다시 만듭니다. Python 3와 fontTools · brotli가 필요합니다(`pip install fonttools brotli`).

```sh
cd src/packages/fonts
py -3.14 -I scripts/build-fonts.py   # D2Coding 릴리스를 받아(sha256 확인) 만든다
```
