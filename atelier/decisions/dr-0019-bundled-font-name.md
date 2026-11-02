---
title: "DR-0019: 번들 글꼴의 이름은 AriadneNSD Mono로 한다"
tags:
  - dr
status: 승인
date: 2026-11-02
supersedes:
superseded-by:
---

# DR-0019: 번들 글꼴의 이름은 AriadneNSD Mono로 한다

## 배경

기본 블록 글꼴은 D2Coding이다([[0034-default-block-font|ADR-0034]]). 앱은 한자를 빼고 문자를 추린 판을 번들하고, 저장 파일에는 그 그림에 쓰인 문자만 남긴 서브셋을 넣는다([[0026-bundled-font-metrics|ADR-0026]], [[0039-woff-subset-font|ADR-0039]]). OFL 1.1의 3항은 고친 글꼴(서브셋 · 형식 변환 포함)에 예약 글꼴 이름(Reserved Font Name) "D2Coding"을 쓰지 못하게 한다. 그래서 MVP 개발(2026-11-01)에서 Claude가 이름을 `AriadneNSD Block`으로 지었다.

이 이름은 모든 `.ns.svg`의 `@font-face`와 `font-family`에 남는다. 웹 1.0 전에 정해야 하는 "파일에 남는 것" 가운데 하나다([[dr-0018-release-stages|DR-0018]]). 메인테이너가 2026-11-02에 골랐다.

## 결정 기준

- 파일을 Inkscape · Illustrator 같은 도구로 열었을 때 글꼴 목록에서 무엇인지 바로 읽혀야 한다.
- 사용자가 설치한 다른 글꼴과 이름이 겹치지 않아야 한다(그래서 제품 이름을 앞에 붙인다).
- 나중에 비례폭 글꼴을 번들할 때 이름의 짝이 맞아야 한다([[04-visual-design#4.3 글꼴]]의 "비례폭" 자리).

## 검토한 대안

### `AriadneNSD Block` (그때의 이름)

- 장점: "블록 글꼴"이라는 역할을 말한다. 고칠 것이 없다.
- 단점: 글꼴 목록에서는 모양이 읽히지 않는다. 비례폭 블록 글꼴이 들어오면 이름을 따로 지어야 한다.

### `AriadneNSD Mono`

- 장점: 고정폭 글꼴의 업계 관례(JetBrains Mono, Cascadia Mono)를 따른다. 비례폭은 `AriadneNSD Sans`로 짝이 맞는다.
- 단점: 글꼴을 다시 만들고 테스트의 골든 파일을 갱신해야 한다.

### `AriadneNSD Code`

- 장점: 코드를 쓰는 글꼴이라는 뜻이다.
- 단점: 블록에는 한국어 문장(예제의 자판기)도 들어가서 "코드"가 좁게 읽힌다.

## 결정

번들 글꼴의 패밀리 이름은 `AriadneNSD Mono`, PostScript 이름은 `AriadneNSDMono-Regular`, 파일 이름은 `ariadne-nsd-mono-regular`다. 나중에 비례폭 글꼴을 번들하면 `AriadneNSD Sans`로 한다. 저작권과 OFL 고지는 글꼴 안에 그대로 남긴다.

## 결과

- 좋아지는 점: 파일을 다른 도구로 열어도 고정폭 글꼴로 읽힌다. 비례폭이 들어올 때 이름을 새로 고민하지 않는다.
- 감수하는 점: v0.1.0으로 저장한 파일에는 `AriadneNSD Block`이 남아 있다. 글꼴을 파일 안에 싣고 있어서 그대로 열리고 그대로 보이며, 다시 저장하면 새 이름이 된다(그래서 바이트가 달라진다). 웹 1.0 전이라 이 차이는 약속하지 않는다([[dr-0018-release-stages|DR-0018]]).
- 후속 작업: 없음. 글꼴(`src/packages/fonts/scripts/build-fonts.py`), 골든 파일, README의 그림을 같은 날 바꿈.
