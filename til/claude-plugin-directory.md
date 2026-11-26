---
title: Claude 플러그인을 공식 목록에 내기
tags:
  - til
updated: 2026-11-27
---

# Claude 플러그인을 공식 목록에 내기

## 한 줄 요약

Claude 스킬은 **플러그인**으로 싸서 배포합니다. 저장소에 마켓플레이스 파일만 두면 누구나 설치할 수 있고, Anthropic이 고르는 공식 목록(Directory)에 실리려면 따로 제출해 사람의 심사를 받습니다.

## 백엔드로 비유하면

- **스킬 · 플러그인 · 마켓플레이스** = 라이브러리 · 패키지 · 저장소(Maven 저장소). 스킬은 Claude에게 주는 안내서와 스크립트, 플러그인은 그것을 이름 · 버전 · 아이콘과 함께 싼 꾸러미, 마켓플레이스는 꾸러미 목록(`.claude-plugin/marketplace.json`)입니다. 우리 저장소 자체가 마켓플레이스라서 `reddiana/AriadneNSD`만 알면 설치됩니다.
- **Anthropic Directory** = Maven Central에 올리는 일. 자기 저장소로도 배포할 수 있지만, 공식 목록에 실리면 claude.ai · Claude Code의 플러그인 검색에 나옵니다. 그 대신 심사가 있습니다.
- **심사** = 보안 리뷰가 붙은 코드 리뷰. 기계 검사(`claude plugin validate --strict --profile directory`)를 먼저 통과하고, 안전 검사와 사람의 정책 검토를 받습니다. README가 "무엇을 실행하고 무엇을 보내는지"를 모두 설명해야 하고, 소스를 읽을 수 있어야 합니다. 우리 스크립트는 1MB에 base64 덩어리(글꼴 · wasm)가 있어 그 까닭을 README에 적었습니다.
- **아이콘은 한 번만** = 공개 API의 이름. 처음 제출할 때 정해지면 나중에 파일을 바꿔도 목록의 아이콘은 그대로입니다.

## 터미널에서 링크가 열리는 원리

긴 공유 링크를 Claude Code CLI에서 시험하다 알게 된 것입니다.

- 터미널은 글자를 화면 폭에서 접습니다. 터미널이 스스로 접은 줄은 한 줄로 기억해서, 링크를 눌러도 끝까지 열립니다.
- Claude Code는 답을 그릴 때 줄을 직접 끊고 앞에 빈칸을 넣습니다. 그러면 터미널은 그 줄들을 따로따로 봅니다. 맨 주소를 누르면 잘린 주소로 열립니다.
- 마크다운 링크는 줄이 끊겨도 주소 전체로 열렸습니다. Claude Code가 터미널의 하이퍼링크 기능(OSC 8: 글자에 주소를 따로 붙이는 신호)으로 그리는 것으로 보입니다(코드에서 확인하지는 않음).
- 그래서 우리 스킬은 링크를 마크다운 링크로 한 번만 줍니다 → [[ux-decisions]] SK2

## 마켓플레이스와 Directory, Verified

- **우리 마켓플레이스:** 주소(`reddiana/AriadneNSD`)를 아는 사람이 두 단계로 설치. 심사 없음, 파일 제한 없음. 찾게 하는 것은 우리 몫(README · 홍보)
- **Directory:** claude.ai 플러그인 화면의 검색 · 둘러보기에 나옴, 한 번에 설치, 판마다 검사. 기능의 차이는 없고 차이는 "발견"과 "믿음"
- **Verified 조직:** "Anthropic이 실제 회사임을 안다"는 표시. 제출 화면의 검증은 스크립트 같은 실행 파일을 Verified 조직의 플러그인에서만 받았다(2026-11-27, 공식 문서에는 없던 규칙). 요청 조건은 유료 플랜과 증명한 도메인이고, 사람이 법적 이름 · 웹사이트를 본다
- **도메인 증명** = 인증서 발급의 DNS 검증과 같은 방식. 받은 값을 도메인의 TXT 레코드로 넣으면 그 도메인을 관리하는 사람임이 증명된다. 레코드는 지우지 않고 둔다

## AriadneNSD에서 어디에 쓰나

- 플러그인 폴더 `src/skills/ariadne-nsd/plugin/`: manifest(`displayName` `AriadneNSD`), 아이콘(시안 M78), 영어 README → [[07-claude-skill#7. 배포]]
- claude.ai: 플러그인 › 추가 › 마켓플레이스 추가 › 저장소에서 추가. 설치하면 스크립트가 Anthropic의 샌드박스에서 Node로 돈다(2026-11-27에 써 봄)
- 푸시 전에 고친 판을 시험할 때: `claude --plugin-dir <플러그인 폴더>`

## 더 읽을거리

- [Directory에 내기](https://claude.com/docs/directory/publish), [제출 전 점검](https://claude.com/docs/plugins/pre-submission-checklist)
- [플러그인 배포(Claude Code)](https://code.claude.com/docs/en/plugins/publish.md)
- [Anthropic 소프트웨어 디렉터리 정책](https://support.claude.com/en/articles/13145358-anthropic-software-directory-policy)
