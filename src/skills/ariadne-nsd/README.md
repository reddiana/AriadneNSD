# Claude skill `ariadne-nsd`

Claude(claude.ai, Claude Code)가 NS 차트를 그리고 읽고 고치게 하는 스킬입니다. 무엇을 하고 어떻게 만들었는지는 설계 문서 [Claude skill](../../../docs/04-design/07-claude-skill.md)에, 그렇게 정한 이유는 [ADR-0050](../../../atelier/adr/0050-claude-skill-bundle-and-distribution.md)에 있습니다. 명령은 모두 `src/`에서 실행합니다.

## 폴더

| 자리 | 무엇 |
| --- | --- |
| `src/` | 엔진(`engine.ts`), 명령줄(`cli.ts`), Node 입출력(`node-io.ts`), 번들의 진입점(`main.ts`)과 테스트 |
| `plugin/` | Claude Code 플러그인. `.claude-plugin/plugin.json`이 manifest |
| `plugin/skills/ariadne-nsd/` | 설치되는 스킬 폴더: `SKILL.md`, `references/`, `scripts/nsd.mjs`(빌드 결과, 커밋함) |
| `plugin/skills/ariadne-nsd/{OFL.txt,LICENSE,NOTICE}` | 내장한 글꼴(OFL)의 라이선스 전문과 저장소의 `LICENSE` · `NOTICE`의 사본. 원본과 같은 바이트여야 하고(T-1475), 원본을 고치면 함께 고칩니다 |
| `scripts/build.mjs` | `nsd.mjs`를 빌드하고 `dist/ariadne-nsd.zip`을 만듦 |
| `vite.config.ts` | `nsd.mjs`의 번들 설정(글꼴 · wasm을 포함) |

저장소 맨 위의 `.claude-plugin/marketplace.json`이 이 플러그인을 가리키는 마켓플레이스이고, `.github/workflows/release.yml`이 Release에 zip을 업로드합니다.

## 빌드

```sh
pnpm --filter @ariadne-nsd/skill build
```

`plugin/skills/ariadne-nsd/scripts/nsd.mjs`를 다시 쓰고 `dist/ariadne-nsd.zip`(맨 위 폴더 `ariadne-nsd/`)을 만듭니다. `nsd.mjs`는 `core` · `fonts` · 웹 셸의 공유 링크 모듈을 포함하므로, 그 코드를 고친 커밋에서는 다시 빌드해 `nsd.mjs`를 함께 커밋합니다. 잊으면 T-1472가 실패합니다. `dist/`는 커밋하지 않습니다.

## 테스트와 검사

```sh
pnpm --filter @ariadne-nsd/skill test        # 단위 테스트(빌드 결과의 비교, 빈 폴더에서의 실행 포함)
pnpm --filter @ariadne-nsd/skill typecheck
pnpm exec eslint skills                       # 린트(nsd.mjs는 검사하지 않음)
pnpm deps                                     # skill-is-not-a-shell 등 의존 방향
```

`SKILL.md`나 `references/`의 JSON 예제를 고치면 doctest(T-1469 ~ T-1471)가 앱의 파서와 JSON Schema로 검증합니다. 플러그인의 manifest는 Claude Code로도 검증할 수 있습니다.

```sh
claude plugin validate ..                     # 저장소 맨 위: marketplace.json
claude plugin validate skills/ariadne-nsd/plugin
```

## 로컬에서 써 보기

스크립트만 실행해 보기:

```sh
node skills/ariadne-nsd/plugin/skills/ariadne-nsd/scripts/nsd.mjs --help
```

Claude Code에 스킬 폴더를 직접 설치하기(고친 것을 바로 써 볼 때):

```sh
# Windows(PowerShell): Copy-Item -Recurse skills/ariadne-nsd/plugin/skills/ariadne-nsd $HOME/.claude/skills/
cp -r skills/ariadne-nsd/plugin/skills/ariadne-nsd ~/.claude/skills/
```

Claude Code에 로컬 마켓플레이스로 설치하기(배포와 같은 방법을 push 전에 확인할 때). Claude Code 안에서 저장소 맨 위의 경로를 적습니다.

```text
/plugin marketplace add C:/myProject/AriadneNSD
/plugin install ariadne-nsd@ariadne-nsd
```

로컬 경로의 마켓플레이스는 플러그인을 그 폴더에서 바로 읽으므로, 고친 뒤 `/reload-plugins`나 새 세션에서 바로 반영됩니다. 다 쓰면 `/plugin marketplace remove ariadne-nsd`로 지우고, GitHub의 것(`reddiana/AriadneNSD`)으로 다시 추가합니다.

claude.ai에 올려 보기: 빌드한 `dist/ariadne-nsd.zip`을 Settings › Capabilities › Skills에서 업로드합니다. 같은 이름의 스킬이 있으면 먼저 지웁니다.

## 배포

- **Claude Code:** 사용자는 `/plugin marketplace add reddiana/AriadneNSD`, 그다음 `/plugin install ariadne-nsd@ariadne-nsd`로 설치합니다. 마켓플레이스는 GitHub의 기본 브랜치(`main`)이고, 사용자는 `plugin.json`의 버전이 바뀔 때 업데이트를 받습니다.
- **claude.ai:** 판을 내며 GitHub Release를 펴내면 `release.yml`이 그 태그의 코드로 스킬을 빌드해 `ariadne-nsd.zip`을 Release에 업로드합니다. 태그(`v0.4.0`)와 `plugin.json`의 버전이 다르면 실패합니다. 이미 펴낸 Release에 다시 올릴 때는 Actions › Release › Run workflow에 태그를 적습니다.
- 버전은 제품과 같습니다. 판을 낼 때 `package.json`과 `plugin/.claude-plugin/plugin.json`을 함께 올립니다(순서 → [src/README.md](../../README.md)의 "판을 낼 때").
