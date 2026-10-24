---
title: "2026-10-18 설계 문서 펴내기 · 시각 디자인 현행화"
tags:
  - plan
  - session
date: 2026-10-18
---

# 2026-10-18 설계 문서 펴내기 · 시각 디자인 현행화

2026-10-18의 두 번째 세션이다 (← [[2026-10-18-01-ui-framework-model]]). 메인테이너의 첫 말은 "잠깐 다시 들어왔어요. inbox 체크해주세요."였다.

## inbox 원문

메인테이너가 inbox에 더한 두 항목이다. 처리 방향에 동의를 받아 지웠다.

> [!quote] 5. 질문/요청
> - 마무리할 때 `docs/`를 publishing해주세요. github page가 적절할까요?
> 	- github page를 이용해서 웹버전 어플리케이션과 사용자 매뉴얼도 배포하려고 했어요. 참고해주세요.
> - [[04-visual-design]]을 현행화해주세요.

처리 방향(합의):

- 펴내기: GitHub Pages 한 사이트(`reddiana.github.io/AriadneNSD/`)를 주소로 나눠 앱 · 매뉴얼 · 설계 문서를 함께 둔다. 이번에는 설계 문서만. 도구는 Quartz(Obsidian 노트를 웹으로), GitHub Actions로 빌드. 펴낼 범위는 고르는 창에서 **`docs/` + `atelier/`(추천)**
- 현행화: 프로토타입 60번째 판과 그동안의 결정을 문서와 맞대 보고 고침. 고르는 창에서 **"그 방향으로 지금 진행(추천)"**. Claude가 새로 정한 값은 "확인해 주세요"에 올린다

## 논의 흐름

### 1. 시각 디자인 명세 현행화

[[04-visual-design]]을 프로토타입 60번째 판과 그동안의 결정(M19의 주황 · 파랑 3px, 2026-10-18의 머리 모양 "제목처럼" H1, 두 키 조합 안내 상자 K1, 구문 강조 ADR-0032, DR-0012의 결정 링크)에 맞대 보고 고쳤다.

- 그림 여덟 장(`docs/02-ux-design/assets/`)을 60번째 판으로 다시 찍었다. 고른 표시는 주황, 펴진 접기 영역은 파랑 3px인 그림이다. 7.2의 그림 설명도 고쳤다
- 머리 모양 "제목처럼"의 글자 · 치수 · 아랫줄, 빈 갈래 `∅`의 글자 역할, 두 키 조합 안내 상자의 모습과 나타나는 법, 구문 강조의 네 갈래와 색 셋을 적었다
- 본문의 날짜 꼬리표를 결정 링크로 바꿨다
- Claude가 새로 정한 값은 [[outbox#확인해 주세요]]의 "시각 디자인 명세를 현행화하며 Claude가 정한 것"에 있다

### 2. 설계 문서 펴내기 → [[dr-0013-publish-docs-github-pages|DR-0013]]

- GitHub Pages는 저장소 하나에 사이트 하나라서, 설계 문서 · 웹 앱 · 매뉴얼이 주소로 나눠 쓴다: `/docs/…`, `/atelier/…`, 나중에 `/app/` · `/manual/`
- 도구는 Quartz v4.5.2. Obsidian의 위키링크 · 콜아웃 · Mermaid를 그대로 그린다. GitHub Actions(`.github/workflows/pages.yml`)가 `main`에 push할 때마다 빌드해 올린다. 우리 설정은 `site/`에 둔다
- 원본은 고치지 않는다. 빌드 직전에 `site/prepare-content.mjs`가 복사본에서 펴내지 않는 곳(`journal/` · `tech-notes/`)으로 가는 링크를 GitHub 주소로 바꾼다
- 메인테이너가 Settings → Pages의 Source를 GitHub Actions로 바꾼 뒤 "push해주세요. 퍼블리싱된 페이지를 얼른 보고 싶네요."라고 해서, 마무리 전에 push했다(push는 마무리 때만 한다는 규칙을 메인테이너가 이번에 풀어 줌). 사이트: https://reddiana.github.io/AriadneNSD/

### 3. 첫 화면

- 메인테이너: "첫 화면에는 흔히 로고를 넣지 않나요?" → README와 같은 그림 로고와 문자 로고를 넣고, 문자 로고가 제목을 대신하므로 글자 제목은 감췄다(`site/custom.scss`)
- 메인테이너: "첫 화면을 최상단 README를 기반으로 만들지 않은 이유가 있을 것 같네요." → 따로 쓴 `site/index.md`는 소개 글이 두 곳에 생겨 어긋나기 쉽다. 고르는 창에서 **"README를 원본으로(추천)"**. 빌드 때 README로 첫 화면을 만들고, GitHub에서만 맞는 안내는 `<!-- site:skip -->` … `<!-- /site:skip -->`로 감싸 뺀다. CLAUDE.md 저장소 구성과 DR-0013 "이후 변경"에 적었다
- 로고의 간격을 세 번 고쳤다(메인테이너가 사이트를 보며 짚음):
	- "그림로고와 문자로고사이에 … index에는 너무 공간이 많습니다" → README만큼으로 줄이고, 문자 로고 위는 GitHub의 제목 위 여백과 같은 24px
	- "그림로고와 문자로고가 가운데 정렬이 안 맞아요" → Quartz가 제목 옆에 붙이는 링크 아이콘이 보이지 않게 폭을 차지하고 있었다. 감추고 가운데로 맞췄다
	- "문자로고 밑에 공백이 더 있으면" → 16px에서 40px로
- 메인테이너가 깨진 링크를 짚음: `https://github.com/reddiana/AriadneNSD)%22%EB%A1%9C`. 라이선스 표의 출처 문구 `"AriadneNSD (https://…)"로`에서 GitHub과 사이트가 주소 뒤의 `)"로`까지 주소로 읽었다. 문구를 코드 모양(`` `AriadneNSD (https://github.com/reddiana/AriadneNSD)` ``)으로 감쌌다. 같은 문구가 있는 DR-0010("이후 변경")과 DR-0011(승인된 본문, 글자는 그대로 모양만)도 고쳤다

## 결정

- 설계 문서는 `docs/` + `atelier/`를 Quartz로 GitHub Pages 한 사이트에 펴낸다 → [[dr-0013-publish-docs-github-pages|DR-0013]]
- 사이트의 첫 화면은 저장소의 `README.md`로 빌드한다 → DR-0013 "이후 변경", CLAUDE.md

## 발견한 위험

- 승인된 DR-0011의 본문을 모양만이지만 고쳤다. 규칙(승인된 본문은 고치지 않음)에 걸리는지 메인테이너에게 알렸다 → [[outbox#확인해 주세요]]
- Quartz의 판을 올리면 첫 화면의 꾸밈(`site/custom.scss`가 기대는 Quartz의 요소 이름)이 깨질 수 있다. 판을 올릴 때 첫 화면을 다시 본다
- 사이트에서 `journal/` · `tech-notes/`로 가는 링크는 GitHub에서 열려 위키링크가 동작하지 않는다(DR-0013에 적은 감수)

## 다음 할 일

- 다음 세션의 첫 일은 메인테이너가 고른다 → [[status#이번과 다음 세션에 할 것]]
- 펴낸 사이트를 둘러보고 어색한 곳을 알려 주기(메인테이너)
