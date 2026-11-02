---
title: 번들 사이즈 체크와 글꼴의 예약 이름
tags:
  - til
updated: 2026-11-01
---

# 번들 사이즈 체크와 글꼴의 예약 이름

MVP 코딩 중에 메인테이너가 물은 둘입니다. "\"빌드 크기 예산 검사\"가 무엇인가요? 용어가 생소합니다." 그리고 "\"D2Coding\"이 아니라 \"AriadneNSD Block\"이 된 이유가 무엇인가요?"

## 번들 사이즈 체크 (bundle size budget)

### 한 줄 요약

웹 앱을 빌드한 결과물이 정해 둔 크기를 넘지 않는지 CI가 자동으로 재는 검사입니다. 넓게는 성능 예산(performance budget)이라고 부릅니다.

### 백엔드로 비유하면

API 응답 시간에 SLO를 두고, 넘으면 알람을 울리는 것과 같습니다. 웹 앱은 사용자가 처음 열 때 JS · CSS · 글꼴을 내려받으므로, 그 크기가 곧 첫 화면이 뜨는 시간입니다. 라이브러리 하나를 무심코 더하면 크기가 조용히 커지니, 사람이 재지 않아도 넘는 순간 CI가 막게 합니다.

### AriadneNSD에서

- 재는 것: 페이지를 열 때 내려받는 HTML · JS · CSS · 화면 글꼴(woff2)을 gzip으로 압축한 크기. 저장할 때만 받는 wasm과 TTF는 뺍니다
- 한도: 첫 빌드 450 KB의 +20%인 540 KB. 일부러 키울 때는 그 커밋에서 한도를 올립니다
- 자리: `src/apps/web/scripts/check-size.mjs`, CI의 "번들 사이즈 체크" 단계 → [[06-web#5. 배포]]
- 같은 일을 하는 흔한 도구: `size-limit`, `bundlesize`, Lighthouse의 performance budget

## 글꼴의 예약 이름 (Reserved Font Name)

### 한 줄 요약

SIL Open Font License(OFL)는 글꼴을 고쳐서 배포해도 되지만, 저작권자가 예약해 둔 이름은 고친 판에 쓰지 못하게 합니다. 서브셋(글자 일부만 남김)과 형식 변환(TTF → WOFF)도 고친 판입니다.

### 원문

- 라이선스 맨 앞: "Copyright (c) 2015, NAVER Corporation, with Reserved Font Name D2Coding."
- 3항: "No Modified Version of the Font Software may use the Reserved Font Name(s) unless explicit written permission is granted by the corresponding Copyright Holder."
- 고친 판의 정의: 더하거나 **지우거나** 바꾼 것, **형식을 바꾼 것**

### 백엔드로 비유하면

오픈소스 라이브러리를 포크해서 고쳤으면, 원래 패키지 이름으로 npm에 올리지 않는 것과 같습니다. 고친 판이 원래 판으로 오해받지 않게 하려는 규칙입니다. 상표처럼 이름만 지키고, 쓰는 것과 고치는 것은 자유입니다.

### AriadneNSD에서

- 한자를 빼고, 저장 파일에는 쓰인 문자만 남기고, WOFF · woff2로 바꾸므로 고친 판입니다. 그래서 글꼴 안의 이름을 "AriadneNSD Mono"로 바꿨습니다(처음에는 "AriadneNSD Block", 2026-11-02에 고정폭 글꼴의 관례대로 바꿈)
- NAVER의 저작권 표기와 라이선스 문구는 글꼴 안에 그대로 남깁니다(저장 파일의 서브셋에도). "D2Coding을 바탕으로 했다"고 밝히는 것은 괜찮습니다
- 라이선스 전체 → [[open-source-licenses]]
