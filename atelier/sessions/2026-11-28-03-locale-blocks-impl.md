---
title: "2026-11-28 화면 언어를 하나로, 블록 셋 구현"
tags:
  - session
---

# 2026-11-28 화면 언어를 하나로, 블록 셋 구현

## 흐름

1. **이어 가기.** "계속 진행합시다" → 지난 세션의 다음 일(inbox 6 · 7장 언어 결함 · 구조). 재현 조건의 답을 기다리지 않고 코드에서 원인을 찾음: 화면 언어를 정하는 곳이 셋(웹 셸은 브라우저 언어, 편집기는 `en`, 설정 창은 명세의 기본값 `en`). 고른 적 없는 한국어 브라우저에서 설정 창이 English로 보이고, English를 고르면 값이 같아 바뀌지 않음. 에이전트가 core 하나로 모음(`c180f59`, T-1525)
2. **블록 셋의 범위.** "블록 셋 구현 범위부터 정합시다" → 고르는 창에서 메인테이너가 넷 모두(내보내기 · 공유 링크, Claude 스킬, 사용법 · 키 표, 갤러리 예제 하나) + "갤러리나 예제에 새로 추가된 블록으로 고칠 부분이 있으면 고쳐주세요."
3. **M84.** 병렬 처리의 분기 고르기(B1)와 툴바(B2)를 시안으로. "B1 1번, B2 1번, D는 그대로" → 분기 칸 전체를 고름, 툴바에 아이콘 셋(Claude의 추천은 드롭다운이었음)
4. **구현.** 에이전트가 코어 · 편집기(`c35a824` `c51c252`, T-1526 ~ T-1559). 범위에서 뺀 문서(키 표 · `llms.txt` · `SKILL.md`)가 새 블록을 몰라 문서 동기 테스트 셋이 실패하는 채로 둠
5. **worktree.** "앞 세션이 끝나면서 일을 마치지 못하고 멈춘 에이전트가 있나요?" → 없음. 11-03 밤의 worktree 7개는 변경 없고 main에 합쳐진 것. "매듭 때 worktree도 함께 지워 주세요" → 지움(긴 경로 때문에 폴더는 `\\?\`로)
6. **매듭.** "구현이 끝나면 매듭을 지어주세요."

## 결정

- 화면 언어: 고른 값 → 브라우저 언어 → `en`을 core의 `screenLocale` 하나로, 언어 목록은 core의 `locales`만. 설정 창은 실제로 쓰는 언어를 보임 → `c180f59`
- 블록 셋 구현 범위 → [[status#이번과 다음 세션에 할 것]]
- M84 B1 1번(분기 칸 전체를 고름), B2 1번(툴바에 아이콘 셋), D1 ~ D5 그대로 → https://claude.ai/artifact/U9S8t8Sz8DVPKAee5G52X8, `journal/assets/2026-11-28-block-impl-study.html`

## 발견한 위험

- 문서 동기 테스트 T-1167(키 표) · T-1146(`llms.txt`) · T-1470(`SKILL.md`)이 실패 중이라 `pnpm check` 전체가 실패한다. 블록 셋의 남은 일에서 맞춰야 push할 수 있다
- 툴바의 새 아이콘(22 × 16)이 무한 반복은 While과, 병렬 처리는 Case와 헷갈릴 수 있다(For를 툴바에서 뺀 까닭과 같음). 써 보고 판단
- 예제 플로차트 스크립트(`example-flowcharts.script.ts`)가 새 블록을 만나면 오류를 낸다. 예제를 새 블록으로 고칠 때 함께
- inbox에 지난 세션에 옮긴 항목 넷(독일어, 앞 · 뒤의 물음 셋)이 다시 나타나 있었다. 원문이 [[2026-11-28-02-blocks-wording-german]]에 있어 지움. Obsidian이 예전 내용을 되살린 것으로 보임

### 독일어를 더할 때 손댈 곳

에이전트(`c180f59`)의 보고. core `locales`에 `'de'`를 더하면 타입 검사가 짚는 곳:

- 번역 표: `core/src/i18n/messages.ts`, `editor/src/i18n/messages.ts`, `editor/src/ui/messages.ts`, `apps/web/src/shell/messages.ts`, `apps/web/src/perf/perf-messages.ts`, 설정 창의 `setting.uiLocale.de`
- 예제 · 갤러리: `editor/src/examples/*.ts` 넷, `editor/src/gallery/*.ts` 열일곱(`LocalizedSpec`)
- `apps/web/src/app.tsx`의 `pageFolders`

타입이 못 잡는 곳: 사용법(`apps/manual/pages/*`, `build.mjs`, `video/record.mjs`, `playwright.manual.config.ts`, `manual-shots/*.spec.ts`), 갤러리 빌드(`apps/gallery/build.mjs`), 그림 스크립트(`example-flowcharts.script.ts` · `readme-images.script.ts`는 `ko`를 직접 씀), `site/`와 README의 언어 줄, `llms.txt`, 화면 글꼴과 서브셋(ä ö ü ß), 테스트 안의 언어 분기

## 다음 할 것

- 블록 셋의 남은 일(스킬 · `llms.txt` · 키 표 · 사용법 · 갤러리 · 예제) → 그다음 독일어 → [[status#이번과 다음 세션에 할 것]]
- 정리(docs · UX 결정 · ADR): 화면 언어, 블록 셋(모델 · 파일 형식은 ADR), M84 → 메인테이너가 하자고 할 때나 마무리 때

## inbox에서 옮긴 원문

### 6. 결함

- 환경설정의 언어와 실제 앱에 적용된 언어가 맞지 않는 경우가 많습니다.

### 7. 기타

- 다국어 지원함에 따라 구조를 합리적으로 변경할 여지가 생겼나요?
