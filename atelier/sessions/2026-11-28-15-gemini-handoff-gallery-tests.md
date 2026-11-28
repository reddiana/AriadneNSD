---
title: "2026-11-28 Gemini handoff, 갤러리 테스트 보강"
tags:
  - session
---

# 2026-11-28 Gemini handoff, 갤러리 테스트 보강

프로젝트 폴더 없이 시작한 세션(Gemini CLI 로그인 문제)이 AriadneNSD의 갤러리 코드 교차검토로 이어져, 그 지적 가운데 테스트 둘을 반영함. 브랜치 `test/gallery-page-tests` → `main` merge(`04e99e4`).

## 흐름

1. **Gemini CLI가 막힘.** "딸아이 계정으로 gemini pro 가족계정을 구매해서 썼던걸로 기억합니다. 근데 … 권한이 없다고" → 가족 요금제는 그대로(AI Pro 공유 중). Google이 2026-06-18부터 개인 요금제의 Gemini CLI를 끊고 Antigravity CLI(`agy`)로 옮김. Gemini CLI 삭제, `agy` 설치(winget)
2. **Claude + agy 연동.** 역할 나누기(큰 읽기는 Gemini) · 교차검토를 위해 Claude Code 스킬이 `agy -p`를 읽기 전용으로 부르게 만들고, 사례 조사로 안전장치를 다시 짬(도구 허용 목록 에이전트, sandbox, 비밀 파일 차단, 인용 자동 대조, 자체 점검 9개). AriadneNSD 구조 요약을 시험(83초, 약 10만 토큰)
3. **약관.** Antigravity FAQ가 개인 요금제에서 agy를 다른 코딩 에이전트로 감싸 쓰는 것을 지원하지 않는다고 함(계정 정지 사유일 수 있음) → "연동 중단". 스킬 · 에이전트는 휴지통으로
4. **사람이 돌리는 handoff.** "제가 중간에 복사 붙여넣기를 해야겠네요. 이거라도 편하게" → Claude는 `~/ai-handoff/request.md`만 쓰고 `/handoff`를 클립보드에, 메인테이너가 agy에서 `/handoff`, agy는 `response.md`에 답, "답 왔어"로 Claude가 읽음. Claude는 agy를 실행하지 않음. 일에 맞는 모델(`/model`)도 요청서에 권함(교차검토는 Gemini만)
5. **커밋 `4da0ea0` 교차검토(handoff).** Gemini의 지적 7개, 인용 12개는 모두 실제 코드와 맞음. Claude가 코드로 판정: 셋은 과장 · 이미 고침 · 해 없음, 반영할 것은 7(c) 가짜 `querySelectorAll`이 셀렉터를 무시함, 7(d) `gallery.js`의 동작이 테스트되지 않음
6. **테스트 보강.** T-1633(happy-dom의 실제 SVG DOM으로 셀렉터), `gallery-page.test.ts` T-1634 ~ T-1637(빌드한 페이지의 스크립트를 happy-dom에서, fetch · 배율을 손으로: 인라인 · 캐시, 늦은 답, `<img>` 대체와 재요청, 배율 변화). 코드를 일부러 고장 내 다섯 경우를 모두 잡음을 확인. 갤러리에 devDependency happy-dom(`51c0ce0`)

7. **마무리 검사에서 경쟁 조건.** `pnpm check`에서 T-1489가 실패(`files/kmp.en.ns.svg` 없음): `build.test.ts`와 새 `gallery-page.test.ts`가 나란히 `build.mjs`를 돌려 한쪽이 `dist/`를 다시 만드는 사이 다른 쪽이 읽음. 갤러리 vitest를 `fileParallelism: false`로(5번 연속 통과). T-1126은 로컬 부하로 실패 → `SKIP_TIMING=1`, 판정은 CI. 새 테스트 이름의 한국어 번역 6개 채움

## 결정

- AriadneNSD 쪽 결정은 없음(테스트만 더함)
- 메인테이너의 도구: Claude Code가 agy를 직접 부르지 않고, 사람이 `/handoff`를 치는 파일 주고받기로(→ [[learning-claude-code]])

## 발견한 위험

- `gallery.js`의 SVG 파싱 오류(`<parsererror>`) 미검출: 손상된 파일이 오면 오류 상자가 페이지에 들어감. 갤러리 파일은 빌드가 만들어 가능성은 낮음 → [[backlog]]
- 교차검토 모델의 지적은 심각도가 부풀려짐(이번에 "높음" 둘 중 하나는 과장, 하나는 이미 고친 것). 인용 대조 뒤에도 코드로 판정해야 함

## 다음 할 일

- 정리 남음(이전 세션 13에서): `docs/04-design/06-web.md` 갤러리에 "선을 화면 배율에 맞춤" 한 줄
