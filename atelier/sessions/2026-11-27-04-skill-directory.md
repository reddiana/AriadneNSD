---
title: "2026-11-27 스킬을 Anthropic Directory에 낼 준비, claude.ai에서 써 보기, 링크는 한 번만"
tags:
  - session
---

# 2026-11-27 스킬을 Anthropic Directory에 낼 준비, claude.ai에서 써 보기, 링크는 한 번만

## 흐름

1. **공식 배포.** 메인테이너: "우리 스킬을 공식적으로 배포할만 한가요?" → 에이전트가 공식 문서를 조사. 받는 곳은 Anthropic Directory 하나(claude.ai/directory/manage › 새로 제출 › Plugin bundle, 유료 플랜, 사람이 심사, 새 판마다 안전 검사). `claude-plugins-official`은 제출을 받지 않고, community 저장소는 폼으로 받는 읽기 전용 사본. 기준: `claude plugin validate --strict`(`--profile directory`), 이름 · 설명 · author · version · license · homepage, README가 실행 · 전송하는 것을 모두 설명, 읽을 수 있는 소스, 데이터를 모으면 개인정보 정책, 확인된 지원 연락처, SKILL.md 500줄 · 설명 1,024자 이하. 우리 상태를 표로 대 보고, 구멍은 아이콘 · README · claude.ai에서 써 보지 않음
2. **아이콘(M78).** 로고 SVG를 그대로 불러 네 안(I1 큰 판, I2 작은 판, I3 작은 판 + NS 배지, I4 NS 기호만)을 256 ~ 24px · 밝은/어두운 바탕 · 목록 줄로. Claude는 작은 크기 때문에 I2를 추천, 메인테이너는 I1을 고름 → 1024px PNG(`cc7f442`). 아이콘은 처음 제출 때 한 번만 정해짐
3. **플러그인 README.** 번들을 훑어 네트워크 · 프로세스 · 환경 변수를 쓰지 않음을 확인하고 영어로 씀(`48e799a`)
4. **claude.ai에서 써 보기.** "zip을 올려 써본다는게 무슨 뜻인지" → 까닭(샌드박스의 Node)과 방법을 설명. Chrome 확장이 연결되지 않아 앱 안 브라우저로. 설정 › 기능의 Skills는 "플러그인으로 이동"했고, 플러그인 › 추가 › 마켓플레이스 추가 › 저장소에서 추가(`reddiana/AriadneNSD`)로 메인테이너가 설치. 새 채팅에 "이진 탐색을 NS 차트로 그려줘" → `.ns.svg`와 링크, 링크는 `check` OK. 이름이 "Ariadne nsd"로 보여 `displayName`을 더함(`3089339`)
5. **링크는 한 번만(SK2).** "코드박스로 링크를 다시 보여줄 필요가 있나요?" → 되풀이는 `llms.txt`(GD1)에서 옮긴 것. "혹시 cli를 위한 것이었나요?" → 기록은 없음. Claude가 "Claude Code에서는 링크를 묻고 열기"를 제안했으나 메인테이너가 "기본으로 제공하지 않게 되나요? 별로 마음에 들지 않습니다." → 링크는 늘 주는 것으로 거둠. CLI에서 직접 시험: 마크다운 링크는 열리고 코드 블록의 맨 주소는 접힌 줄에서 잘려 "not base64url". 코드 블록만 뺌(`f0d85e6`), `--plugin-dir`로 새 판을 다시 시험해 "마음에 듭니다"
6. **매듭.** claude.ai 설치 안내를 README · 사용법 · 설계 문서에서 마켓플레이스로, DR-0006 · ADR-0050에 "이후 변경", UX 결정 SK2
7. **마무리(대화는 비우지 않음).** "우리 스킬 공식 배포하고 있었잖아요? 얼마큼 된거죠?"에 된 것 · 남은 것을 답함. 지원 연락처는 "GitHub Issues만으로 충분해요". "마무리 하지만 clear는 하지 마세요" → 0.5.0(버전 아홉 곳 · "이 버전에서 바뀐 것" 문구, `db8a6c9`). `pnpm check`는 `make-icon.mjs`의 포맷 하나로 실패해 고친 뒤 통과, 편집기 동작은 바뀌지 않아 E2E는 하지 않음, 사이트 빌드 통과. push · 태그 v0.5.0 · Release(영어 글). CI · Pages · Release(zip 업로드) 모두 성공. claude.ai는 push 직후 아직 "Ariadne nsd"

## 결정

- 플러그인 아이콘은 로고 큰 판(M78 I1) → [[dr-0006-logo|DR-0006]]의 이후 변경
- 표시 이름 `AriadneNSD`, 영어 README, claude.ai도 마켓플레이스로 설치 → [[07-claude-skill#7. 배포]], [[0050-claude-skill-bundle-and-distribution|ADR-0050]]의 이후 변경
- 공유 링크는 마크다운 링크 한 번만 → [[ux-decisions]] SK2
- (매듭 뒤) Directory의 지원 연락처는 GitHub Issues만. 메인테이너: "GitHub Issues만으로 충분해요"

## 발견한 위험

- 커밋 훅이 Bash 명령을 막으면 같은 명령 안의 다른 일(문서 고침)도 실행되지 않는다. 아이콘 커밋 때 sketchbook · status 고침이 빠졌다가 매듭에서 찾음. 훅에 걸릴 수 있는 커밋은 문서 고침과 다른 명령으로
- 문서 검사 훅을 인자로 파일을 주어 부르면 표준 입력을 기다리며 멈춘다(또 한 번). `--all`과 `< /dev/null`로 부름
- claude.ai의 화면(설정의 Skills → 플러그인)이 바뀌어 문서의 설치 안내가 낡아 있었다. 영어 메뉴 이름은 한국어 화면에서 옮긴 것 → [[outbox]]
- 시험용 폴더를 저장소 안에 만들면 터미널 탭이 잡고 있어 지울 수 없다. 탭을 닫은 뒤 지움

## 다음 할 것

- claude.ai에 "AriadneNSD"로 보이는지 → Directory 제출(메인테이너 계정).
- "플러그인 업로드"가 zip을 받는지 → [[backlog#Claude skill]]

## inbox

비어 있었음.
