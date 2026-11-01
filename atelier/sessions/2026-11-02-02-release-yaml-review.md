---
title: "2026-11-02 GitHub Releases에 v0.1.0, inbox: nschart 코드 블록과 yaml"
tags:
  - session
date: 2026-11-02
---

# 2026-11-02 GitHub Releases에 v0.1.0, inbox: nschart 코드 블록과 yaml

메인테이너: "1. GitHub Releases에 v0.1.0 해주세요 2. inbox 검토해주세요."

## GitHub Releases v0.1.0

- https://github.com/reddiana/AriadneNSD/releases/tag/v0.1.0 . 태그 `v0.1.0`(주석 태그)은 지난 세션에 올려 두었음
- 이름은 태그 메시지와 같은 "0.1.0: 웹 MVP". 본문은 앱 주소, 할 수 있는 것, 1.0 전 파일 알림(한국어, 끝에 영어 한 줄)
- 1.0 전이라 Pre-release로 표시함(Claude가 정함 → [[outbox#확인해 주세요]])
- 이 PC에는 `gh`가 없어, git에 저장된 GitHub 자격 증명으로 REST API(`POST /repos/…/releases`)를 직접 부름

## inbox: `.ns.svg` 안의 JSON과 yaml

원문(3. 기능 › MVP › 추가/변경 요건):

> - `.ns.svg`안의 모델 직렬화 형식을 json으로 결정했었습니다. 그런데 나중에 아래처럼 markdown의 code block에 삽입될 형식을 고려하면 yaml에 미련이 남습니다. 우리의 json 직렬화와 함께 yaml을 다시 검토해봅시다.
> ~~~
> ```nschart
> ```
> ~~~

검토:

- 물음을 둘로 나눔. `.ns.svg` 안의 모델은 편집기가 저장할 때마다 새로 쓰는 글이라, [[0007-json-serialization|ADR-0007]]이 YAML을 뺀 까닭(출력이 늘 같아야 함, SVG 정렬 도구가 공백을 바꾸면 깨짐, 의존성)이 그대로 맞음
- `nschart` 코드 블록은 사람과 Claude가 손으로 쓰는 글. 블록 id와 뷰 상태를 손으로 적게 할 수 없으므로, 어느 문법이든 `.ns.svg`의 모델과는 따로 읽는 형식이 됨. 그래서 코드 블록 때문에 `.ns.svg` 안을 바꿀 까닭은 없음
- 코드 블록의 문법 후보 셋: YAML(짧음, 다만 If의 키 `yes:` · `no:`를 YAML 1.1 파서가 참 · 거짓으로 읽음), 의사 코드(`if … else … end`, 가장 짧고 NS 차트와 1:1, 블록 글자에 `end`가 들어갈 때의 규칙이 필요), id를 뺀 JSON
- 코드 블록은 지금 요구사항에 없었음(Obsidian은 `.ns.svg`를 노트에 넣고, Claude skill도 `.ns.svg`를 내놓음)

고르는 창으로 받은 답: "둘을 나눔"(추천).

- `.ns.svg` 안은 JSON 그대로(ADR-0007 유지, "이후 변경"에 한 줄)
- 새 요구사항 [[01-requirements#^r-fmt|R-FMT-12]] `P3`: 언어 이름이 `nschart`인 코드 블록에 글로 적은 NS 차트를 그림으로 보임
- 문법은 [[01-requirements#6. 미결정 사항]]에, 그 일을 할 때 시안으로 견줄 일은 [[backlog#뒤의 배포 대상을 설계할 때]]에

## README 첫 화면의 그림

메인테이너: "대문 README의 예시 2개가 폰 처럼 좁은 화면에서는 중앙으로 정렬되지 않습니다. … 그리고 이제 MVP가 있는데 프로토타입으로 그렸다는 말도 눈에 띄입니다."

- 원인: 두 그림 사이의 `&nbsp;&nbsp;`. 좁은 화면에서 줄이 바뀌면 그 빈칸이 첫 그림 줄 끝에 남아 첫 그림을 왼쪽으로 밀었다. 빈칸을 없애고 그림 양쪽에 `hspace="8"`(GitHub는 `style`을 지우므로 넓은 화면의 사이를 이것이 띄움, 사이트는 CSS가 여백을 0으로 하고 flex의 `gap`이 띄움). 폭 375px로 두 경우를 찍어 확인
- 그림은 프로토타입 스크린숏(PNG)에서 MVP의 예제를 저장한 `.ns.svg`로(Claude가 정함 → [[outbox#확인해 주세요]]). 다익스트라 · 병합 정렬, 머리 모양 "제목처럼", 고정 문구는 한국어. 만드는 스크립트 `src/packages/editor/scripts/readme-images.script.ts`(`pnpm --filter @ariadne-nsd/editor readme-images`) → [[sketchbook]]의 M41
- 캡션은 메인테이너의 말대로 "MVP로 그린 NS 차트: …"

## 매듭

- 기술 설명은 [[yaml-and-json]]에, Pre-release는 [[build-output-and-releases]]에 더함. 연표 293 · 294

## 다음 할 일

- 사용법 `/manual/`의 목차를 시안으로 보이기 → [[backlog#웹 베타의 문턱]]
