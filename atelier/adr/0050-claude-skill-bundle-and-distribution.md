---
title: "ADR-0050: Claude skill은 앱의 코드를 Node 스크립트 하나로 번들해 커밋하고, Release의 zip과 플러그인 마켓플레이스로 배포한다"
tags:
  - adr
status: 승인
date: 2026-11-21
supersedes:
superseded-by:
---

# ADR-0050: Claude skill은 앱의 코드를 Node 스크립트 하나로 번들해 커밋하고, Release의 zip과 플러그인 마켓플레이스로 배포한다

> [!NOTE] 이후 변경
> - 2026-11-27: claude.ai의 스킬 설치 자리가 설정의 Skills에서 플러그인 화면으로 옮겨져, claude.ai도 zip 대신 이 플러그인 마켓플레이스로 설치한다(메인테이너가 설치해 써 봄, 샌드박스에서 Node로 `nsd.mjs`가 돎). zip은 Release에 그대로 남는다. 플러그인에 표시 이름 · 아이콘 · README를 더했다(Anthropic Directory 제출 준비) → [[07-claude-skill#7. 배포]]

## 배경

Claude skill([[01-requirements#^r-skill|R-SKILL-01]] ~ [[01-requirements#^r-skill|R-SKILL-03]], `P2`)은 Claude가 쓴 모델 JSON을 `.ns.svg` 파일과 공유 URL로 만들고, 사용자가 준 링크나 파일을 읽는다. [[0036-code-layout|ADR-0036]]은 자리(`src/skills/ariadne-nsd`, 셸이 아님)만 정했고 내보내는 곳은 "저장소"로 적었다. 구현하면서 정할 것이 셋 생겼다.

1. 스킬이 실행하는 코드의 형태. claude.ai의 스킬 샌드박스는 네트워크가 없고 `npm install`을 할 수 없다. 스킬 폴더는 설치되는 그대로 실행되어야 한다.
2. 모델 JSON의 검증을 무엇으로 하나. 앱의 파서와 JSON Schema(`/model.schema.json`)가 있다.
3. 사용자가 스킬을 받는 곳. claude.ai(zip 업로드)와 Claude Code(스킬 폴더, 플러그인)의 설치 방법이 다르다.

## 결정 기준

- 스킬이 만든 파일과 링크가 앱이 만든 것과 같아야 한다(앱에서 그대로 열림).
- 네트워크와 설치 없이 실행된다(claude.ai의 샌드박스).
- 앱의 코드가 바뀌면 스킬이 따라오는지 테스트가 검출한다.
- 사용자가 설치하는 단계가 적다. 메인테이너가 판을 낼 때 할 일이 늘지 않는다.

## 검토한 대안

### 1. 스크립트의 형태

- **A. 앱의 코드를 Node 스크립트 하나로 번들하고, 글꼴과 wasm도 포함해 저장소에 커밋한다**: 설치 단계가 없다. 앱의 코드를 그대로 호출하므로 결과가 같다. 빌드 결과를 저장소에 넣으므로 소스와 어긋날 수 있다(테스트로 검출).
- B. 스크립트 없이 Claude가 `/llms.txt`처럼 손으로 `u` 링크를 쓴다: 저장 파일(`.ns.svg`, 렌더링과 서브셋 글꼴)을 만들 수 없다. 긴 모델은 실수가 많다.
- C. npm 패키지로 내고 스킬이 `npx`로 실행한다: claude.ai의 샌드박스에는 네트워크가 없다.

### 2. 검증

- **A. 앱의 파서(`parseModel`)만**: 앱이 여는지와 같은 기준이고 불변식까지 검증한다. 오류의 `detail`이 경로를 포함한다.
- B. 파서와 함께 실행 중에 JSON Schema(Ajv)로도: 번들이 커지고, 두 검증이 다르게 말할 때 Claude가 무엇을 따를지 정해야 한다. 스키마와 예제가 같은지는 테스트에서 이미 검증한다.

### 3. 배포

- A. 저장소의 폴더만(사용자가 복사): 설치가 번거롭고 업데이트를 알 수 없다.
- B. GitHub Release의 zip만: claude.ai에는 맞지만 Claude Code의 사용자는 압축을 풀어 복사해야 한다.
- C. 플러그인 마켓플레이스만: claude.ai에서는 쓸 수 없다.
- **D. Release의 zip과 플러그인 마켓플레이스 둘 다**: 같은 스킬 폴더 하나를 두 방법으로 배포한다.

## 결정

- **스크립트:** 1-A. `src/skills/ariadne-nsd`의 `nsd.mjs`는 `core` · `fonts` · 웹 셸의 공유 링크 모듈을 Vite로 번들한 ES 모듈 하나이고, 번들 글꼴과 hb-subset wasm을 brotli + base64로 포함한다(Node 20 이상, 네트워크 없음). 빌드 결과지만 저장소에 커밋한다. ADR-0036의 "빌드 결과는 저장소에 넣지 않는다"의 예외다. 커밋한 파일이 지금 소스의 빌드인지는 테스트(T-1472)가 검증한다. 스킬은 `apps/*` · `editor` 가운데 공유 링크 모듈만 가져온다(dependency-cruiser `skill-is-not-a-shell`).
- **검증:** 2-A. 실행 중에는 앱의 파서만 쓰고 JSON Schema로 검증하지 않는다. 스킬 문서의 예제가 파서와 스키마를 모두 통과하는지는 테스트(doctest)가 검증한다.
- **배포:** 3-D. 메인테이너가 정했다(2026-11-21). 스킬 폴더는 Claude Code 플러그인의 자리 `src/skills/ariadne-nsd/plugin/skills/ariadne-nsd/`에 두고,
	- claude.ai: GitHub Release를 펴내면 워크플로(`.github/workflows/release.yml`)가 그 폴더를 `ariadne-nsd.zip`(맨 위 폴더 `ariadne-nsd/`)으로 만들어 Release에 업로드한다.
	- Claude Code: 저장소 맨 위의 `.claude-plugin/marketplace.json`이 마켓플레이스 `ariadne-nsd`이고, 플러그인 `ariadne-nsd`의 `source`가 `./src/skills/ariadne-nsd/plugin`이다. 플러그인의 버전은 제품의 버전과 같다.

스크립트의 형태 · 검증 · 폴더 구조 · 마켓플레이스의 이름은 구현한 에이전트가 정했고, 배포를 둘 다로 하는 것은 메인테이너가 정했다. 설계의 결과는 [[07-claude-skill]]에 있다.

## 결과

- 좋아지는 점: 스킬이 만든 파일과 링크가 앱과 같다(같은 코드). 설치 단계가 없고 네트워크 없이 실행된다. claude.ai와 Claude Code가 같은 폴더를 받는다. 앱의 코드가 바뀌어 번들이 최신 상태가 아니면 `pnpm check`가 실패한다.
- 감수하는 점: 저장소에 1 MB 가까운 빌드 결과가 있다(`.gitattributes`로 diff에서 뺌). `core`나 공유 링크 모듈을 바꾸는 커밋은 스킬도 다시 빌드해야 한다. 판을 낼 때 버전을 올릴 곳이 둘(`skills/ariadne-nsd/package.json`, `plugin.json`) 늘었다. Claude Code의 사용자는 `plugin.json`의 버전이 바뀔 때만 업데이트를 받는다.
- 후속 작업: 저장소를 push한 뒤 `/plugin marketplace add reddiana/AriadneNSD`로 GitHub에서 설치되는지, 다음 Release에 zip이 업로드되는지 확인한다.
