---
title: 홍보용 동영상의 형식
tags:
  - til
updated: 2026-11-22
---

# 홍보용 동영상의 형식

> "MP4 vs. WebM 어떤 것이 더 유리한가요?", "이 동영상을 github readme에 넣어도 동작을 잘 할까요?" (메인테이너, 2026-11-22)

## 한 줄 요약

나눠 줄 동영상은 **MP4(H.264)** 로 만듭니다. SNS · 메신저 · 발표 자료 어디서나 열립니다. GitHub README에서 저절로 움직이게 하려면 **GIF**가 필요합니다.

## MP4와 WebM

| | MP4 (H.264) | WebM (VP8 · VP9) |
| --- | --- | --- |
| 어디서 열리나 | 거의 모든 곳(iPhone, PowerPoint, 카카오톡, LinkedIn, X) | 브라우저는 잘 열지만 iPhone 사진 앱 · 일부 PowerPoint는 못 엶 |
| 크기 | 조금 큼 | 조금 작음 |
| 만드는 도구 | ffmpeg의 `libx264` | 브라우저 녹화(Playwright `recordVideo`)가 기본으로 내는 형식 |

- 파일 이름의 `.mp4` · `.webm`은 **그릇**(컨테이너)이고, 안의 영상을 줄이는 방식이 **코덱**(H.264, VP8)입니다.
- LinkedIn · YouTube는 올린 파일을 어차피 다시 인코딩합니다. 그래서 차이는 화질보다 "잘 올라가느냐"입니다.
- 글자가 많은 화면 녹화는 **무손실 프레임(PNG)을 받아 한 번만 인코딩**합니다. WebM을 MP4로 다시 바꾸면 두 번 줄여서 글자가 흐려집니다.
- 웹에 올릴 MP4에는 `-movflags +faststart`를 붙입니다. 다 받기 전에 재생이 시작됩니다. 색은 `-pix_fmt yuv420p`이어야 어디서나 열립니다.

## GitHub README의 동영상

- GitHub 웹의 편집 창에 MP4를 **끌어다 놓아** 생긴 `https://github.com/user-attachments/assets/…` 주소만 재생기로 보입니다. 저장소 안 파일을 상대 경로나 `<video>`로 걸면 재생기가 나오지 않습니다.
- 재생기는 저절로 재생되지 않습니다. 첫 화면에서 움직이게 하려면 GIF(폭을 줄이고 짧게)를 씁니다.
- 무료 계정은 파일당 10MB까지입니다.

## LinkedIn에 붙여 넣은 글의 빈 줄

LinkedIn은 붙여 넣은 글의 빈 줄을 지웁니다. 빈 줄마다 보이지 않는 글자 `U+2800`(점이 없는 점자, `⠀`)을 하나 넣으면 남습니다.

## 이 저장소에서

- LinkedIn 동영상: `journal/assets/2026-11-22-linkedin-heap-sort.mp4`, 녹화 스크립트 `src/apps/web/promo/record.mjs` → [[promotion]]
