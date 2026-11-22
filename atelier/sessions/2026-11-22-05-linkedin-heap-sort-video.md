---
title: 2026-11-22 LinkedIn에 올림, 힙 정렬 편집 동영상
tags:
  - session
date: 2026-11-22
---

# 2026-11-22 LinkedIn에 올림, 힙 정렬 편집 동영상

"Linkedin에 홍보하는 것은 어떨까요?"로 시작했다. inbox는 비어 있었다.

## 논의 흐름

1. **LinkedIn에 올릴까.** 보는 사람이 1촌(동료 · 지인)이라 GeekNews · HN · Reddit과 겹치지 않으니 순서와 상관없이 올려도 된다고 추천. 갈고리는 (선택 창) "만든 과정", 말은 "한국어 + 영어" → [[promotion#초안 4: LinkedIn]]
2. **초안이 사라짐.** 메인테이너: "어느 순간 LinkedIn 초안 자체가 사라졌어요. … 혹시 달님이 저랑 같은 문서를 편집 중인가요?" → Claude는 커밋 뒤 손대지 않았다. 커밋한 판과 비교하니 HN 초안 중간부터 LinkedIn 초안 중간까지 한 덩어리가 `The gallery ha업했습니다.` 한 줄로 바뀌어 있었다(넓게 잡힌 선택 위에 한글을 입력한 모양). 메인테이너가 더한 GeekNews "실제로 올린 본문"은 남아 있었다. 커밋 `a094adb`에서 지워진 부분을 되살림(`376f008`). 메인테이너가 LinkedIn 초안에서 고친 문장은 커밋 전이라 되살리지 못함. 같은 무렵 저장소에 `.idea/`가 생겨 JetBrains IDE와 Obsidian을 함께 열지 말자고 함.
3. **문장 다듬기.** 메인테이너가 고친 한국어의 어색한 곳을 고치고(목적어 둘, 주어 · 서술어, 오타 AriadenNSD, LinkedIn은 Markdown을 그리지 않으니 `**`와 백틱을 뺌) 영어를 맞춤. 메인테이너가 GDC(인도 Global Delivery Center) 협업과 AI 활용이 같은 원리라는 이야기를 더함.
4. **그림 대신 동영상.** 메인테이너: "붙일 그림을 2~3장이나 하나요? 보통 그렇게 하나요?" → 한 장이 보통. 메인테이너: "힙정렬을 처음부터 끝까지 편집하는 것을 동영상으로 만듭시다. 접기영역은 AriadneNSD 숙련자를 위한 기능이니 동영상에서는 뺍시다.", "참/거짓은 true/false로" → (선택 창) 1:1, 영어 주석, 45 ~ 60초, 누른 키를 구석에. 에이전트가 Playwright로 녹화(`src/apps/web/promo/record.mjs`, 그림 문구의 언어를 영어로).
	- "MP4 vs. WebM 어떤 것이 더 유리한가요?" → MP4(H.264). 메인테이너가 ffmpeg를 설치(`winget install Gyan.FFmpeg`). 무손실 프레임을 받아 바로 H.264로(`40eaa5c`).
	- "마지막 화면은 110%로, 상태 줄 문구는 지워 주세요" → 110%에서 그림 전체가 들어감, 선택은 빈 캔버스 클릭으로 풀어 "Selection cleared…"가 나오지 않음(`897c813`). 51.5초, 2.1MB.
5. **GitHub README에 동영상?** 웹 편집 창에 끌어다 놓은 `user-attachments` 주소만 재생기가 되고 자동 재생은 안 됨, 사이트 `/about`은 따로 `<video>`. 메인테이너: "github gif는 따로 만듭시다. 일단 linkedin 진행합시다." → [[backlog#출시 무렵과 그 뒤]]
6. **DR 문구와 해시태그.** "결정은 ADR(아키텍처) 40건 · DR(그 밖) 22건". 메인테이너: "진짜로 NSD에 관심이 있는 사람에게 도움이 되고 싶습니다." → `#NassiShneiderman #NSDiagram #Structogram #NS차트 #Algorithms`를 앞에, 뜻이 갈리는 `#NSD`와 너무 넓은 `#AI` · `#개발자`는 뺌.
7. **올림.** 붙여 넣으니 빈 줄이 모두 사라짐 → 빈 줄마다 `U+2800`(⠀)을 넣은 본문을 클립보드로. 첫 번째는 "안 되는 것 같아요", 다시 복사해 됨. https://lnkd.in/p/gb2ezD8B (13시 무렵) → [[promotion#올린 기록]]
8. **댓글 지켜보기.** Gmail로 오는 LinkedIn 알림 메일을 보는 길(추천) · Chrome으로 직접 보기(약관상 부탁할 때 한 번만) · 앱 알림. 메인테이너: "gmail 계정이 두개(ariadnensd와 reddiana)라서 … 결정을 미루겠습니다." → [[status#이번과 다음 세션에 할 것]]

## 결정

- LinkedIn은 순서와 상관없이, 만든 과정을 앞세워 한국어 + 영어로 → [[promotion#올릴 곳과 순서]]
- LinkedIn에는 그림 대신 힙 정렬 편집 동영상(1:1, MP4, 51초, 접기 영역 없음, true/false, 누른 키 표시, 끝은 110%)
- README용 GIF는 따로, LinkedIn 다음에

## 위험

- Obsidian에서 넓은 선택 위에 한글을 입력하면 큰 덩어리가 한 번에 지워진다. 커밋하지 않은 고침은 git으로 되살릴 수 없다(Obsidian "파일 복구" 스냅숏이 마지막 길).
- `src/apps/web/promo/`는 lint · prettier에서 뺐다(`src/eslint.config.js`, `src/.prettierignore`). 앱 화면이 바뀌면 스크립트가 깨질 수 있다.

## 다음 할 일

- LinkedIn · GeekNews 댓글 보기, Gmail 연결은 메인테이너가 정할 때 → [[status#이번과 다음 세션에 할 것]]
- README용 힙 정렬 GIF → [[backlog#출시 무렵과 그 뒤]]
