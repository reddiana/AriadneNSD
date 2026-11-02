---
title: "2026-11-02 글꼴 이름, 사용법, ariadnensd.com과 첫 화면은 앱, 키 힌트를 선택 아래로"
tags:
  - session
date: 2026-11-02
---

# 2026-11-02 글꼴 이름, 사용법, ariadnensd.com과 첫 화면은 앱, 키 힌트를 선택 아래로

메인테이너: "안녕하세요? 진도 나갑시다"

## 글꼴 이름: AriadneNSD Mono

outbox의 "저장 파일에 남는 글꼴 이름"을 정함. 메인테이너가 `AriadneNSD Mono`를 고름(추천) → [[dr-0019-bundled-font-name|DR-0019]].

- `build-fonts.py`로 글꼴을 다시 만듦. 폭 테이블은 그대로, 이름만 바뀜(패밀리 `AriadneNSD Mono`, PostScript `AriadneNSDMono-Regular`, 파일 `ariadne-nsd-mono-regular`)
- 골든 파일과 서브셋의 SHA-256, README의 그림 두 장을 다시 저장. v0.1.0으로 저장한 파일은 글꼴을 싣고 있어 그대로 열림
- outbox 항목(옮겨 지움): "저장 파일에 남는 글꼴 이름 "AriadneNSD Block" (2026-11-01, MVP 개발). D2Coding의 라이선스(OFL 1.1)가 고친 글꼴에 "D2Coding"이라는 이름을 쓰지 못하게 해서 이름을 바꿈 … 공개 전에 정해 주세요"

## 일하는 방식: 먼저 보여 주고, 미리 한꺼번에 묻기

- 메인테이너: "내가 기다리는 시간을 최소화하는 방향으로 진행해주세요. 방금 글꼴 이름을 정한 다음 바로 목차 시안을 보여줬으면 내가 시안을 보는 동안 달님이 일할 수 있었어요. … 이런 방식으로 일하는 것을 뭐라고 부르나요?"
- 이어서: "꼭 사람 기계 작업이 아니더라도, 두명의 작업자가 서로의 공정에 대한 입력물을 주고 받아면서 일의 순서를 조절해서 전체 시간을 줄이는 그런 방법이 있을 것 같네요."
- 이어서: "내 시간을 절약하려면 한꺼번에 미리미리 먼저 물어봐주세요. 그러면 당신은 일하고 나는 다른 일을 할 수 있습니다."
- Claude가 설명한 말: 사람-기계 작업 분석, 존슨의 규칙(두 공정 흐름 작업), 잭슨의 규칙(두 기계 잡숍, 일이 양쪽으로 흐름), 동시 공학, 토요타의 바통 터치, 파이프라이닝 → [[two-worker-scheduling]]
- Claude의 메모리에 적음. 이후 세션 안에서 그렇게 함(M50과 사용법 구현을 나란히, 물음 넷을 한 번에)

## 사용법: M48 → M49 → M51

- 시안 M48(목차): U1 둘러보기 + 찾아보기, U2 전 · 후 그림 + 키(메인테이너: "1번을 메인으로 + 이해가 어려운 부분에는 움직이는 그림"), U3 Vim 키와 표준 키를 나란히, U4 영어와 한국어 두 페이지 → [[dr-0020-user-guide|DR-0020]]
- 시안 M49(5분 둘러보기): 그림은 MVP를 조작하며 찍음. 메인테이너: "마음에 듭니다. 다음 일을 합시다."
- `src/apps/manual`을 만듦: `pages/{en,ko}.html`(둘러보기) + `pages/ref-{en,ko}.html`(찾아보기) + `build.mjs`. 그림과 단축키 표는 `pnpm --filter @ariadne-nsd/web manual-shots`가 실제 앱에서 찍고 뽑음(`apps/web/manual-shots`, 테스트 목록에서는 뺌). 앱의 도움말 › 사용법은 화면 언어 쪽을 엶
- 찾아보기 열두 꼭지를 쓰고 전체를 M51로 보임(메인테이너가 "다 쓴 뒤 한 번에"를 고름)
- 메인테이너: "5분 따라하기 3 While로 감싸기 에서 두 블록을 함께 선택하라고 하면 처음 시작하는 사람은 방법을 모를 것입니다." → 3단계를 1 · 2 · 3 순서로, 두 블록이 선택된 그림을 더함

## 비공개 문제 알리기, 주소, 첫 화면, 후원

- 시안 M50: 메인테이너 "M50 P1은 1번으로."(전용 이메일). 주소: "노출은 1번 + 실제 받은 주소는 2번" → 보이는 주소 `report@ariadnensd.com`, 받는 곳은 새 Gmail(주소는 문서에 적지 않음)
- 메인테이너: "그냥 ariadnensd.com하면 앱이 열리나요? 문서가 열리나요?" → 그때는 문서(README 소개). 다시 물어 정함: 사이트를 `ariadnensd.com`으로 옮김, 첫 화면은 앱(메인테이너: "앱이 바로 열리면 좋겠어요."), 소개는 `/about`, 옛 `/app/`은 첫 화면으로 넘김. 후원 버튼은 베타 뒤로 → [[dr-0021-domain-and-front-page|DR-0021]]
- 사이트 빌드(`pages.yml`, `site/build.sh`, `prepare-content.mjs`의 README → `about.md`, Quartz `baseUrl`)를 바꾸고 로컬에서 전체를 빌드해 확인함
- 메인테이너: "내가 할 일을 하나씩 알려주세요. 단계별로 따라할 수 있는 설명을 해주세요." → 한 단계씩 안내: ① Gmail ② Cloudflare Email Routing(새 화면은 "Onboard Domain"에서 시작, Activate 뒤에 주소를 만듦) ③ GitHub 계정의 Pages에서 도메인 확인(TXT) ④ DNS 아홉 줄(처음에 Proxied로 들어가 DNS only로 바꿈) ⑤ 저장소 Pages의 Custom domain과 Enforce HTTPS. 모두 끝남 → [[github-pages-site#사용자 도메인]]
- 메인테이너의 물음: "ariadnensd+report@gmail.com 으로 메일을 받았을 때 report를 식별할 수 있나요?" → 된다. 다만 Cloudflare가 전달한 메일의 받는 사람 칸에 `report@ariadnensd.com`이 남아 그것으로 필터하면 됨

## 키 힌트를 선택 바로 아래로 (UX K3)

- 메인테이너: "너무 늦게 요건을 변경하는 것 같네요. `a` 누르면 나오는 안내 메뉴를 현재 포커스 바로 아래 보이게 하는 것은 어떨까요? 시선을 위아래로 크게 움직이는 부분이 불편하기 때문입니다." 이어서: "`a`처럼 복합키는 모두 이런 식으로 해주세요."
- 시안 M52에서 1번(선택 바로 아래, 세로 목록) → [[ux-decisions#K3. 두 키 조합의 안내 자리 (다시)|K3]]. `EditorHandle.popupAnchor()`, `keyHintPlace`(단위 테스트)

## 결함

- BUG-05: 마우스로 연 메뉴가 `Esc`로 닫히지 않음. 사용법 그림을 찍다 발견, 회귀 테스트를 먼저 쓰고 고침 → [[defects]]

## 발견한 위험

- 주소를 옮기면 브라우저에 남은 임시 보관 · 설정 · 최근 파일이 옛 주소에 남는다(origin이 다름). MVP라 지금 옮김 → [[dr-0021-domain-and-front-page|DR-0021]]
- Claude가 보낸 명령 둘이 권한 검사에 막힘: 커밋하지 않은 변경을 되돌리는 `git checkout -- .`(잘못 넣음), 모든 `python.exe`를 끄는 명령. 둘 다 실행되지 않았고 범위를 좁혀 다시 함

## 일하는 방식: /clear와 더 나은 사용법의 추천

메인테이너: "앞으로 달님이 판단해서 `/clear`를 추천할만하면 추천해주세요. 달님을 활용하는 더 좋은 방법이 추천될만한 상황이라면 역시 추천해주세요." → Claude의 메모리에 적음

## 다음 할 일

- 메인테이너가 M51(사용법 전체)을 이어서 봄
- push 뒤 `https://ariadnensd.com`에서 첫 화면이 앱인지, `/manual/ko/`, `/about`, 옛 `reddiana.github.io/AriadneNSD/app/`의 넘겨 주기를 봄
- 나머지는 [[status#이번과 다음 세션에 할 것]]
