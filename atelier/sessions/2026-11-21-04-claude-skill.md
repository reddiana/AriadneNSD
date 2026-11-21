---
title: 2026-11-21 Claude skill의 첫 판
tags:
  - session
date: 2026-11-21
---

# 2026-11-21 Claude skill의 첫 판

메인테이너가 "claude skill이 생각보다 쉽게 구현이 되는 것 같다"며 기능 제안을 청했다. 범위를 A · B · C로 정하고, 요구사항을 셋으로 늘려 `P2`로 올리고, 스킬을 만들어 Release zip과 Claude Code 플러그인 마켓플레이스로 배포할 준비를 마쳤다(push는 이 매듭에서). 그 사이에 붙여넣은 이미지와 줄 끝 문자를 정리하는 규칙이 생겼다.

## 논의 흐름

1. **기능 제안.** 쉬운 까닭: `core`가 Node에서 모델을 검사하고 `.ns.svg`를 만들 수 있고, 형식은 `llms.txt`에 다 있으며, 다른 AI가 자주 틀리는 링크 인코딩을 스킬은 코드로 한다. 제안: A 알고리즘 그리기, B 코드 → 차트, C 차트 읽기 · 고치기, D 차트 → 코드, E 코드와 문서의 차트 대조, F 교육. 메인테이너가 추천안 A · B · C를 골랐다.
2. **요구사항.** R-SKILL-02(코드 → 다이어그램) · R-SKILL-03(다이어그램 읽기 · 고치기)을 더하고, 메인테이너의 말로 셋을 `P2`로 올렸다. 절 제목 "(나중에)"는 범례에서 `P2`가 "나중에"라 그대로 두었다. 승인 DR-0002에 "이후 변경" 한 줄 → [[01-requirements#^r-skill|R-SKILL-01 ~ 03]], [[dr-0002-development-order|DR-0002]]
3. **구현(에이전트).** `src/skills/ariadne-nsd`: core · fonts · 웹의 공유 링크 코드를 묶은 `nsd.mjs` 하나(check · link · save · read, 네트워크 없이 node만), SKILL.md와 참고 문서 셋, 테스트 T-1457 ~ T-1475.
4. **사용법은 어디에?** 메인테이너의 물음에 아직 없다고 답하고 세 자리(사용자 · 설계 · 개발자)를 제안했다. 배포 방식은 메인테이너가 "둘 다"(Release zip + 플러그인 마켓플레이스)를 골랐다. 에이전트가 마켓플레이스 · `release.yml` · 설계 문서 [[07-claude-skill]] · [[0050-claude-skill-bundle-and-distribution|ADR-0050]] · 사용법 `#claude-skill` 꼭지 · 개발 안내를 만들고, 첫 에이전트가 미룬 정리(코딩 가이드 · 아키텍처)도 마쳤다.
5. **테스트 목록은 맨 끝.** 메인테이너가 test-list를 04-design의 맨 끝으로 하자고 해서 `99-test-list.md`로(메인테이너가 99를 고름). 새 설계 문서는 비어 있던 07번. CLAUDE.md에 규칙 한 줄.
6. **붙여넣은 이미지.** 메인테이너: "Pasted image 어쩌구 하는 paste해서 들어간 이미지 파일들은 항상 적당한 위치로 옮기든지 필요가 없어지면 삭제해주세요." inbox의 두꺼운 외곽선 신고에 쓰인 다섯 장을 `atelier/sessions/assets/2026-11-21-thick-outline-*.png`로 옮겼다. 규칙은 메모리에.
7. **줄 끝 문자.** 메인테이너: "바뀌지 않은 파일도 커밋대상으로 나오는 것 보니 개행문자 문제가 있는 것 같습니다." 작업 폴더의 35개 파일이 CRLF였다(Claude가 Windows에서 스크립트로 쓴 것). LF로 바꾸고 `git add`로 색인을 새로 적어 깨끗해졌다 → [[git-line-endings]]
8. **라이선스.** 스킬에 OFL 글꼴이 들어 있어 `OFL.txt` · `LICENSE` · `NOTICE`를 스킬 폴더와 zip에 넣고(T-1475), 루트 NOTICE에 D2Coding 고지 한 문단.
9. **도움말에 알리기.** 메인테이너: "최소한 이런 것이 있다 정도는 도움말 어딘가에 넣어야할 것 같아요." 도움말 › AI에게 그려 달라고 하기가 여는 사용법 `#ai` 꼭지에 팁 한 줄(한 · 영), README의 웹 베타 상자에 한 줄. 메뉴 항목은 따로 두지 않음(추천).
10. **`llms.txt`.** 고칠 필요는 없다(스킬은 `llms.txt`를 읽지 않고, 어긋남은 T-1469 · T-1470이 막음). 메인테이너의 동의로 "If you can run code" 절 끝에 Claude 사용자에게 스킬을 알리는 한 줄.

## 결정

- 스킬의 첫 범위 A · B · C, 요구사항 R-SKILL-01 ~ 03 `P2`
- 배포는 Release의 `ariadne-nsd.zip`(claude.ai) + 저장소를 플러그인 마켓플레이스로(Claude Code) → [[0050-claude-skill-bundle-and-distribution|ADR-0050]]
- 상세 설계의 테스트 목록은 늘 `99-test-list.md`
- 붙여넣은 이미지는 늘 옮기거나 지움, 스크립트는 LF로 씀(Claude의 메모리)

## 발견한 위험

- 실제 claude.ai 업로드와 GitHub에서의 `/plugin marketplace add`는 아직 해 보지 못했다(로컬 경로 마켓플레이스로 설치까지는 됨). claude.ai 샌드박스의 Node 버전도 모른다(20 이상 필요).
- `release.yml`은 실제 Release로 돌려 본 적이 없다. v0.3.0에는 스킬이 없어 zip은 다음 판부터.
- 붙여넣은 이미지를 옮긴 커밋 `4ddf15d`에 에이전트가 스테이지해 둔 스킬 폴더 이동이 함께 들어갔다(결과는 맞고 메시지만 어긋남). 그 뒤로 Claude는 커밋할 파일을 지정한다.
- 01-requirements의 2장 표가 칸 정렬로 바뀌었다가 되돌려졌다. 누가 했는지 모른다.

## 다음 할 일

- 메인테이너: push 뒤 Claude Code에서 `/plugin marketplace add reddiana/AriadneNSD`, `/plugin install ariadne-nsd@ariadne-nsd`로 설치해 써 보기
- 새 판(v0.3.1 등)을 낼지: 내면 `release.yml`이 zip을 붙이는지 함께 확인
- inbox의 두꺼운 외곽선 결함(예제 다섯)을 함께 검토
- 다음 세션 처음: 시간 테스트 T-0171 · T-1126 안정시키기(그대로)
