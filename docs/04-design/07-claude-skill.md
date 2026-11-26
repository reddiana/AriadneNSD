---
title: Claude skill
tags:
  - design
status: 초안
updated: 2026-11-27
---

# Claude skill

Claude(claude.ai, Claude Code)가 NS 차트를 그리고 읽고 고치게 하는 스킬 `ariadne-nsd`입니다. 셸이 아닙니다. `editor`를 감싸지 않고, Claude가 모델 JSON을 쓰면 스킬의 스크립트가 앱의 코드(`core` · `fonts`, 웹 셸의 공유 링크 모듈)로 검증하고 `.ns.svg` 파일과 공유 URL을 생성합니다. 그래서 스킬이 만든 파일과 링크는 앱이 만든 것과 같고, AriadneNSD에서 그대로 열어 편집합니다.

코드: `src/skills/ariadne-nsd` (→ [[0036-code-layout|ADR-0036]]), 구조와 배포를 정한 과정 → [[0050-claude-skill-bundle-and-distribution|ADR-0050]]

## 관련 요구사항

- [[01-requirements#2.6 Claude skill]]: [[01-requirements#^r-skill|R-SKILL-01]](알고리즘 → 다이어그램), [[01-requirements#^r-skill|R-SKILL-02]](코드 → 다이어그램), [[01-requirements#^r-skill|R-SKILL-03]](다이어그램 읽기 · 고치기)
- 배포 대상: [[01-requirements#^r-tgt|R-TGT-07]]
- 스킬이 생성하는 것: 공유 URL [[01-requirements#^r-web|R-WEB-05]], 저장 파일 [[01-file-format|파일 형식 명세]]

## 1. 범위

스킬 하나가 세 가지 일을 담당합니다. 사용자의 요청에 따라 Claude가 `SKILL.md`의 절 하나를 따릅니다.

| 절 | 요구사항 | 입력 | Claude가 하는 일 | 결과 |
| --- | --- | --- | --- | --- |
| A. 알고리즘을 다이어그램으로 | [[01-requirements#^r-skill\|R-SKILL-01]] | 말로 한 요청("퀵소트를 NS 차트로 설명해 주세요") | 모델 JSON을 쓰고 `check` → `save` · `link` | `.ns.svg` 파일과 공유 URL, 짧은 설명 |
| B. 코드를 다이어그램으로 | [[01-requirements#^r-skill\|R-SKILL-02]] | 사용자 저장소의 함수(Claude Code) | 코드를 읽어 함수는 Method, 문장 하나인 호출은 호출 블록으로 옮기고, 문장 하나는 처리 블록 하나로 옮김(짧은 문장도 줄바꿈으로 한 블록에 묶지 않고, `\n`은 긴 문장 하나나 조건 하나를 나눌 때만 → [[ux-decisions#SK1. 문장 하나에 처리 블록 하나\|SK1]]. 파서 없음, `references/code-to-blocks.md`) | 코드 옆이나 `docs/`의 `함수이름.ns.svg`와 공유 URL |
| C. 다이어그램 읽기 · 고치기 | [[01-requirements#^r-skill\|R-SKILL-03]] | 공유 URL(`#ns1.d.` · `j` · `u`)이나 `.ns.svg` 파일 | `read`로 모델 JSON을 추출해 설명 · 검토하고, 고칠 때는 남는 id를 유지하고 새 id는 `check`가 출력한 다음 번호부터(`references/editing.md`) | 설명 · 검토, 또는 고친 파일과 새 공유 URL |

모델 JSON의 형식은 `SKILL.md`의 요약과 `references/model.md`에 있습니다. 원본은 [[01-file-format|파일 형식 명세]]와 [[02-model-schema|모델 JSON 스키마]]이고, 스킬의 문서가 그것과 같은지는 테스트가 검증합니다(6장).

## 2. 구성

```text
src/skills/ariadne-nsd/
  package.json            @ariadne-nsd/skill (version = the product's)
  vite.config.ts          builds nsd.mjs
  scripts/build.mjs       vite build + dist/ariadne-nsd.zip
  src/                    engine.ts, cli.ts, node-io.ts, main.ts and their tests
  plugin/                 the Claude Code plugin (what users install)
    .claude-plugin/plugin.json
    skills/ariadne-nsd/   the skill folder (what the zip holds)
      SKILL.md
      references/         model.md, code-to-blocks.md, editing.md
      scripts/nsd.mjs     built, committed
.claude-plugin/marketplace.json   (repository top) the plugin marketplace
.github/workflows/release.yml     attaches the zip to each GitHub Release
```

| 모듈 | 하는 일 |
| --- | --- |
| `src/engine.ts` | 문서를 읽고(모델 JSON · 봉투 · 공유 링크 · 저장 파일), 앱의 파서로 검증하고, 앱과 같은 방법으로 공유 링크와 저장 파일을 생성한다. 파일 시스템에 의존하지 않는다 |
| `src/cli.ts` | 명령줄(3장). 입출력은 `Io` 인터페이스로만 하며, 테스트는 메모리의 가짜 `Io`를 전달한다 |
| `src/node-io.ts` | Node의 `Io` 구현(파일, stdin, stdout, stderr) |
| `src/main.ts` | 번들의 진입점. 내장한 글꼴과 wasm을 디코딩해 `Io`에 전달하고 `run`을 실행한다 |

스킬 폴더(`plugin/skills/ariadne-nsd/`)는 설치되는 그대로의 모습입니다. claude.ai의 zip, Claude Code의 플러그인, `~/.claude/skills/`에 복사하는 설치가 모두 이 폴더 하나를 사용합니다.

폴더에는 `OFL.txt`(내장한 D2Coding 글꼴의 라이선스. OFL은 글꼴과 함께 전문을 배포하라고 요구합니다), `LICENSE`, `NOTICE`가 저장소의 원본과 같은 바이트의 사본으로 들어 있어 zip과 플러그인 설치에 함께 실립니다. 마켓플레이스가 저장소에서 바로 설치하므로 커밋합니다. 원본을 고치면 사본도 고칩니다(T-1475가 비교합니다).

## 3. 스크립트 `nsd.mjs`

`node scripts/nsd.mjs <명령> [입력] [옵션]`. Node 20 이상에서 다른 파일 · 설치 · 네트워크 없이 실행됩니다. 메시지는 사람과 언어 모델이 함께 읽으므로, 실패마다 파서의 말로 무엇이 틀렸는지와 다음에 할 일을 출력합니다.

| 명령 | 하는 일 | 표준 출력 |
| --- | --- | --- |
| `check` | 앱의 파서로 검증한다 | `OK: 1 diagram(s), 6 block(s). Next free ids: d2 b7 r3 f1`. 다음 id는 Claude가 블록을 더할 때 쓴다 |
| `link` | 파일 › 공유 링크 복사와 같은 `d` 링크를 생성한다 | 링크 한 줄 |
| `save` | 파일 › 저장과 같은 `.ns.svg`를 쓴다 | `Saved max.ns.svg (… bytes)` |
| `read` | 문서의 모델 JSON을 앱이 쓰는 형태로 출력한다 | 모델 JSON(`--envelope`이면 `{"name", "model"}`) |

**입력**은 파일 경로, `-`(stdin, 기본값), 공유 링크(`https://…#ns1.…` 또는 `ns1.…`) 가운데 하나입니다. 파일은 모델 JSON, 봉투 `{"name": "max.ns.svg", "model": {…}}`, 저장 파일(`.ns.svg` · `.ns`) 가운데 하나입니다. 그래서 `read`와 `save`는 변환도 합니다(링크 → 파일, 파일 → 링크).

| 옵션 | 뜻 |
| --- | --- |
| `-o`, `--out <file>` | `save`가 쓸 경로. 없으면 문서 이름 |
| `--name <name>` | 링크와 파일에 넣는 문서 이름. 없으면 봉투의 이름, 그것도 없으면 첫 헤더(Method · Event)의 이름 + `.ns.svg`, 헤더가 없으면 `diagram.ns.svg` |
| `--base <url>` | 링크가 여는 페이지. 기본값 `https://ariadnensd.com/` |
| `--json` | 결과를 JSON 객체 한 줄로(오류도: `{"ok": false, "reason", "detail", "hint"}`) |
| `-h`, `--help` | 사용법 |

| 종료 코드 | 뜻 |
| --- | --- |
| 0 | 성공 |
| 1 | 입력이 올바른 문서가 아님(JSON 오류, 모델 규칙 위반, 손상된 링크, 모델이 없는 SVG, 더 새 버전의 형식, 읽을 수 없는 파일), 또는 링크가 앱이 여는 한도보다 김. 표준 오류(또는 `--json`의 표준 출력)에 `reason`과 파서의 `detail`(경로 포함, 예: `diagrams[0].body[2]: unknown key "text"`)과 다음에 할 일 |
| 2 | 명령줄 오류(지원하지 않는 명령 · 옵션, 값이 없는 옵션, 입력이 둘 이상). 사용법을 함께 출력 |

링크의 길이 규칙은 앱과 같습니다([[06-web#3. 공유 URL과 보기 모드]]). 8 KB를 넘으면 링크를 출력하고 표준 오류에 "파일도 함께 전달하라"는 안내를 더하며, 앱이 여는 한도를 넘으면 링크를 생성하지 않고 종료 코드 1로 `save`를 안내합니다.

검증은 앱의 파서(`core`의 `parseModel`)가 담당합니다. 실행 중에는 JSON Schema로 검증하지 않습니다. 파서가 스키마보다 엄격하고(불변식까지 검증), 앱이 여는지와 같은 기준이기 때문입니다. 스키마와 문서의 예제가 같은지는 테스트가 검증합니다(6장).

## 4. 앱과 공유하는 코드

스킬은 파일과 링크를 직접 조립하지 않고 앱의 코드를 그대로 호출합니다.

| 하는 일 | 앱의 코드 |
| --- | --- |
| 모델 JSON의 파싱 · 검증, 저장 파일 열기 | `core`의 `parseModel` · `openSvgFile` |
| 렌더링과 저장 파일 조립 | `core`의 `renderDoc` · `savedDrawing` · `assembleSvgFile`, 모델 JSON은 `serializeModelJson`(편집기의 저장과 같은 순서 → [[03-editor]]) |
| 글꼴 서브세팅, 텍스트 외곽선 | `fonts`의 `createSubsetter`(hb-subset wasm) · `readGlyphOutlines` ([[01-requirements#^r-fmt\|R-FMT-10]]) |
| 공유 링크 생성 · 읽기 | 웹 셸의 `apps/web/src/files/share-link.ts`(`@ariadne-nsd/web/share-link`로 노출) |

공유 링크의 코드는 웹 셸에 있지만 DOM에 의존하지 않는 모듈 하나라서, 스킬은 이 모듈만 가져옵니다. dependency-cruiser 규칙 `skill-is-not-a-shell`이 `skills/`에서 `apps/*` · `packages/editor`로 가는 import를 이 모듈 하나만 빼고 차단합니다([[07-coding-guide#1.5 dependency-cruiser]]). 그래서 링크의 형식이 바뀌면 스킬은 다시 빌드하는 것만으로 앱과 같은 링크를 생성합니다.

## 5. 번들링

`nsd.mjs`는 Vite(`vite.config.ts`, SSR 빌드, `target: node20`, ES 모듈 하나, 코드 스플리팅 없음, 압축하지 않음)가 만든 파일 하나입니다.

- `core` · `fonts` · 공유 링크 모듈을 모두 포함하고, Node 내장 모듈 밖의 import가 없다.
- 번들 글꼴(TTF)과 hb-subset wasm은 가상 모듈 `virtual:nsd-assets`로 포함한다. 빌드가 brotli(최고 품질)로 압축해 base64 문자열로 기록하고, 실행할 때 `node:zlib`으로 디코딩한다. 그래서 claude.ai의 샌드박스처럼 네트워크가 없는 곳에서도 실행된다.
- 같은 소스는 언제나 같은 코드를 생성한다. 크기는 빌드(`pnpm --filter @ariadne-nsd/skill build`)가 출력한다.

**빌드 결과를 저장소에 넣는 이유:** 스킬 폴더는 설치되는 그대로여야 합니다. claude.ai의 업로드, `~/.claude/skills/`로의 복사, 플러그인 마켓플레이스의 설치(Claude Code가 저장소에서 플러그인 폴더를 복사함) 가운데 어느 것도 빌드 단계를 실행하지 않습니다. 그래서 `nsd.mjs`는 빌드 결과(`dist/`)를 저장소에 넣지 않는 규칙([[0036-code-layout|ADR-0036]])의 예외입니다. 커밋한 파일이 지금 소스의 빌드인지는 테스트가 검증합니다(6장). Prettier · ESLint는 이 파일을 검사하지 않고(`skills/*/plugin/skills/*/scripts/`), `.gitattributes`는 diff로 표시하지 않습니다(`linguist-generated`).

## 6. 앱과의 호환성을 보장하는 테스트

테스트는 `src/skills/ariadne-nsd/src/*.test.ts`입니다(목록 → [[99-test-list#^t-skills-ariadne-nsd-src-engine-test-ts|T-1457]] 등).

| 무엇을 보장하나 | 테스트 |
| --- | --- |
| 저장 파일을 앱의 파서가 같은 문서로 열고, 그림이 앱의 렌더링과 같다. 텍스트 외곽선도 같다 | [[99-test-list#^t-skills-ariadne-nsd-src-engine-test-ts\|T-1457]], [[99-test-list#^t-skills-ariadne-nsd-src-engine-test-ts\|T-1458]] |
| 링크가 앱의 `d` 링크와 같고, 웹 셸이 같은 모델로 읽는다 | [[99-test-list#^t-skills-ariadne-nsd-src-engine-test-ts\|T-1459]], [[99-test-list#^t-skills-ariadne-nsd-src-engine-test-ts\|T-1460]] |
| 모든 입력(모델 JSON · 봉투 · `d` · `j` · `u` 링크 · 저장 파일)을 같은 모델로 읽고, 오류는 파서의 말로 알린다 | [[99-test-list#^t-skills-ariadne-nsd-src-engine-test-ts\|T-1461]] ~ [[99-test-list#^t-skills-ariadne-nsd-src-engine-test-ts\|T-1463]] |
| 명령줄의 출력과 종료 코드(3장) | [[99-test-list#^t-skills-ariadne-nsd-src-cli-test-ts\|T-1464]] ~ [[99-test-list#^t-skills-ariadne-nsd-src-cli-test-ts\|T-1468]] |
| `SKILL.md`와 `references/`의 JSON 예제가 앱의 파서로 열리고 JSON Schema를 통과하며, 값 목록이 `core`의 목록과 같다(doctest) | [[99-test-list#^t-skills-ariadne-nsd-src-skill-doc-test-ts\|T-1469]] ~ [[99-test-list#^t-skills-ariadne-nsd-src-skill-doc-test-ts\|T-1471]] |
| 커밋한 `nsd.mjs`가 지금 소스의 빌드이고(압축한 글꼴 · wasm은 디코딩해서 비교), 빈 폴더에서 `node`만으로 실행된다 | [[99-test-list#^t-skills-ariadne-nsd-src-bundle-test-ts\|T-1472]], [[99-test-list#^t-skills-ariadne-nsd-src-bundle-test-ts\|T-1473]] |
| 마켓플레이스가 플러그인을, 플러그인이 `SKILL.md`를 가리키고, 플러그인의 버전이 패키지의 버전과 같다 | [[99-test-list#^t-skills-ariadne-nsd-src-plugin-test-ts\|T-1474]] |
| 스킬 폴더의 `OFL.txt` · `LICENSE` · `NOTICE`가 원본과 같은 바이트이고 zip에 들어 있다 | [[99-test-list#^t-skills-ariadne-nsd-src-plugin-test-ts\|T-1475]] |

`core`나 공유 링크 모듈이 바뀌어 `nsd.mjs`가 최신 상태가 아니면 [[99-test-list#^t-skills-ariadne-nsd-src-bundle-test-ts|T-1472]]가 실패합니다. 그때는 `pnpm --filter @ariadne-nsd/skill build`로 다시 빌드해 함께 커밋합니다.

## 7. 배포

| 대상 | 배포 방법 | 사용자가 하는 일 |
| --- | --- | --- |
| claude.ai | GitHub Release의 파일 `ariadne-nsd.zip`(맨 위에 폴더 `ariadne-nsd/`, 그 안에 `SKILL.md`) | 최신 Release에서 zip을 받아 Settings › Capabilities › Skills에 업로드 |
| Claude Code | 이 저장소가 플러그인 마켓플레이스 `ariadne-nsd` | `/plugin marketplace add reddiana/AriadneNSD`, 그다음 `/plugin install ariadne-nsd@ariadne-nsd` |
| Claude Code (수동) | 스킬 폴더 그대로 | `plugin/skills/ariadne-nsd/`를 `~/.claude/skills/ariadne-nsd/`(또는 프로젝트의 `.claude/skills/`)에 복사 |

사용자에게는 사용법(`/manual/`, `/manual/ko/`)의 "Claude skill" 꼭지(`#claude-skill`)가 요청의 예(A · B · C마다 하나)와 두 설치 방법, 결과를 AriadneNSD에서 여는 법을 안내합니다(원본 `src/apps/manual/pages/ref-en.html` · `ref-ko.html`).

**Release의 zip**(`.github/workflows/release.yml`): GitHub Release를 펴내면(프리릴리스 포함) 그 태그의 코드로 스킬을 빌드해(`scripts/build.mjs`) `dist/ariadne-nsd.zip`을 그 Release의 파일로 업로드합니다. 같은 이름의 파일이 있으면 교체합니다. 태그(`v0.4.0`)와 `plugin.json`의 버전이 다르면 실패합니다. 이미 펴낸 Release에 다시 업로드할 때는 워크플로를 태그를 입력해 수동으로 실행합니다. zip은 항목의 순서와 시각을 고정해 같은 파일에서 같은 바이트가 됩니다.

**플러그인 마켓플레이스:** 저장소 맨 위의 `.claude-plugin/marketplace.json`이 마켓플레이스 `ariadne-nsd`를 정의하고, 플러그인 하나 `ariadne-nsd`의 `source`가 `./src/skills/ariadne-nsd/plugin`(저장소 맨 위 기준의 상대 경로)입니다. 플러그인의 manifest는 `plugin/.claude-plugin/plugin.json`이고, Claude Code는 플러그인의 `skills/<이름>/SKILL.md`에서 스킬을 찾습니다. 설치하면 Claude Code가 플러그인 폴더를 자기 캐시로 복사하므로, 스킬이 쓰는 파일은 모두 플러그인 폴더 안에 있어야 합니다.

**버전:** 스킬의 버전은 제품의 버전과 같습니다(`package.json`과 `plugin.json`, 판을 내는 순서 → `src/README.md`). 버전은 `plugin.json`에만 기록하고 마켓플레이스의 항목에는 기록하지 않습니다(Claude Code는 둘이 다르면 `plugin.json`을 따름). Claude Code의 사용자는 `plugin.json`의 버전이 바뀔 때 업데이트를 받으므로, 같은 버전 안에서 `main`에 들어간 변경은 다음 판까지 사용자에게 전달되지 않습니다.
