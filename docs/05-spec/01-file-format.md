---
title: 파일 형식 명세
aliases:
  - file-format
tags:
  - ariadne-nsd
  - spec
status: 초안
format-version: 1
updated: 2026-10-17
---

# 파일 형식 명세 (모델 내장 SVG)

배포 대상들이 주고받는 저장 파일의 형식입니다. 앱들 사이의 약속이므로, 첫 출시 뒤에는 **형식 버전이 바뀔 때만** 고칩니다.

- 관련 요구사항: [[01-requirements#3.4 파일 형식]]
- 관련 결정: [[0005-model-embedded-svg|ADR-0005]](모델 내장 SVG), [[0006-file-extensions|ADR-0006]](확장자), [[0007-json-serialization|ADR-0007]](JSON), [[0014-drive-file-extension|ADR-0014]](Drive), [[0017-fold-name-in-model|ADR-0017]](접기 영역의 이름), [[0018-save-as-shown|ADR-0018]](화면 그대로 저장, 보기 상태), [[0021-event-and-method|ADR-0021]](Event와 Method), [[0022-call-name-follows-head|ADR-0022]](호출 블록), [[0026-bundled-font-metrics|ADR-0026]](글꼴 조각)
- 모델의 짜임은 [[03-architecture#3.1 문서 모델]]과 [[03-architecture#3.2 내용과 보기 상태]]를 따릅니다. 필드 이름과 스키마는 [[01-model]] 설계에서 굳힙니다.

> [!warning] 지금 상태
> 아키텍처 초안(2026-10-13)에 맞춰 2026-10-17에 다시 썼습니다. 2장(문서 구조)과 3장의 짜임은 아키텍처를 따르고, **필드 이름은 안**입니다. 프로토타입이 쓰는 파일(`version: 0`)은 이 형식과 다릅니다(7장).

## 1. 확장자와 판별

| 확장자 | 쓰는 곳 |
| --- | --- |
| `이름.ns.svg` | Obsidian 플러그인(만드는 파일), Google Drive에서 만드는 파일([[0014-drive-file-extension\|ADR-0014]]). 데스크톱 · 웹도 연다 |
| `이름.ns` | 데스크톱 · 웹에서 만드는 파일. 내용은 `.ns.svg`와 같다 |

1. 확장자는 1차 판별에만 쓴다.
2. 실제로 열 때는 `<metadata>` 안의 모델 요소가 있는지로 확인한다.
3. 모델 요소가 없거나 JSON이 손상되었으면 편집 불가로 처리한다. 원본 파일은 덮어쓰지 않는다. 그림을 거꾸로 읽어 모델을 만들지 않는다([[01-requirements#^fmt-invalid]]).
4. `.nsd`(Structorizer)는 이 형식이 아니다. 가져오기 대상으로만 취급한다.

## 2. 문서 구조

```xml
<svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="…" height="…" viewBox="…">
  <metadata>
    <ans:document xmlns:ans="(네임스페이스 URI, 6장)" version="1"><![CDATA[
{ "format": "ariadne-nsd", "version": 1, … }
    ]]></ans:document>
  </metadata>
  <style>
    @font-face { font-family: "…"; src: url(data:font/woff2;base64,…); }  /* 글꼴 조각 */
  </style>
  <rect width="100%" height="100%" fill="#ffffff"/>  <!-- 종이 -->
  <g class="ans-render"> … </g>                       <!-- 모델에서 생성한 그림 -->
</svg>
```

- 루트는 SVG 1.1 `<svg>` 요소다([[01-requirements#^fmt-svg]]).
- 모델 요소는 `<metadata>` 안에 **정확히 하나** 있다. 모델 요소의 `version` 속성과 JSON의 `version` 필드는 같은 값이다.
- **글꼴 조각:** 번들한 글꼴에서 그 그림에 쓰인 글자만 추려 `<style>`의 `@font-face`에 넣는다. 그림의 `font-family`는 이 글꼴 다음에 대체 글꼴 목록을 적는다 → [[0026-bundled-font-metrics|ADR-0026]], [[01-requirements#^fmt-text]]. 글꼴 조각도 같은 모델이면 같은 바이트여야 한다(3.1).
- **종이:** 테마의 종이 색 사각형을 둔다(밝은 기본 테마는 흰색). 투명하게 두지 않는다. 그림의 색은 늘 테마의 색이다 → [[01-requirements#^fmt-color]], [[04-visual-design#2. 층과 출력]]
- 그림 부분은 모델에서 생성한 결과일 뿐이며, 읽을 때 무시한다([[01-requirements#^fmt-model-source]]). 저장되는 그림은 지금 화면 그대로이고 편집 층의 표시(고른 표시 등)는 넣지 않는다 → [[0018-save-as-shown|ADR-0018]]

## 3. 모델 JSON

맨 위의 짜임은 아래와 같습니다. 필드 이름은 안입니다.

```json
{
  "format": "ariadne-nsd",
  "version": 1,
  "settings": { "textKind": "c", "palette": "default" },
  "diagrams": [
    {
      "id": "d1",
      "head": { "kind": "method", "text": "partition(a, lo, hi)" },
      "body": [ … 블록 … ]
    }
  ],
  "view": {
    "folded": [ … 접힌 접기 영역 · 갈래의 id … ],
    "opened": [ … 펴 보인 호출 블록의 경로 … ],
    "bands": true,
    "resultSymbol": "←"
  }
}
```

| 묶음 | 무엇 | 실행 취소 |
| --- | --- | --- |
| `settings` | 문서 설정: 블록 글자의 종류([[01-requirements#^lay-text-kind]]), 테마 | 대상 |
| `diagrams` | 다이어그램의 목록(순서가 있음). 머리(없음 / Event / Method, [[0021-event-and-method\|ADR-0021]])와 본문 | 대상 |
| 블록 | 처리 · If · Case · While · Do-While · For · 호출 등. 제어 블록은 갈래나 본문으로 블록의 줄을 품는다. 줄은 비지 않는다 | 대상 |
| 호출 블록 | 부르는 Method의 **id**, 인자, 결과. 이름을 적는 호출 블록은 id 대신 적은 이름을, 다른 문서의 Method를 부르면 그 파일을 가리키는 값과 그 안의 Method id를 가진다(필드는 정하지 않음 → [[01-requirements#^blk-call-named]], [[01-requirements#^blk-call-external]]). 이름은 갖지 않는다. 이어진 곳이 없으면 마지막에 보이던 이름을 품는다 → [[0022-call-name-follows-head\|ADR-0022]] | 대상 |
| 접기 영역 | 한 줄 안의 이어진 블록 범위와 이름(없을 수 있음) → [[0017-fold-name-in-model\|ADR-0017]]. 펴 보인 곳의 접기 영역은 그 호출 블록에 딸린다([[01-requirements#^edit-fold-site]]) | 대상 |
| `view` | 보기 상태: 접힘, 펴 보기, 이름 띠 보기, 결과 기호 → [[0018-save-as-shown\|ADR-0018]], [[02-interaction-rules#6. 실행 취소]] | 대상 아님 |

- 블록, 다이어그램, 접기 영역은 모두 **바뀌지 않는 id**를 갖는다. 보기 상태와 호출 블록은 id로 가리킨다.
- 화면의 확대와 위치, 고른 것은 저장하지 않는다.
- 노드 타입별 필드, 필수 · 선택, 기본값은 [[01-model]] 설계가 굳으면 JSON Schema로 이 장에 적는다.

### 3.1 출력 규칙

같은 모델이면 항상 같은 파일 내용이 나와야 한다([[01-requirements#^fmt-deterministic]]).

- UTF-8, 줄바꿈은 LF, 2칸 들여쓰기.
- 객체 키의 순서는 스키마에 정한 순서로 고정한다.
- 기본값과 같은 속성을 생략할지는 스키마에서 속성마다 정하고, 늘 그대로 따른다.
- `view`의 목록(`folded`, `opened`)은 id를 문서 순서(다이어그램 순서, 그 안의 깊이 우선 순서)로 늘어놓는다. 접고 편 차례에 따라 달라지지 않는다.
- 글꼴 조각은 글자를 코드 포인트 순으로 추리고, 같은 도구 판으로 만든다.
- 그림 안의 글자 가운데 편집기가 적는 것("참" · "거짓", "⋯ 블록 n개")은 저장할 때의 화면 언어를 따른다([[01-requirements#^nfr-i18n]]). 그래서 같은 모델이라도 화면 언어가 다르면 그림 부분이 달라진다. 이것은 이 규칙의 예외이고, 모델 부분은 언제나 같다.

### 3.2 CDATA 이스케이프

JSON 텍스트에 `]]>`가 나오면 CDATA를 나눠서 쓴다([[01-requirements#^fmt-escape]]).

```
]]>   →   ]]]]><![CDATA[>
```

읽을 때는 XML 파서가 여러 CDATA 조각을 하나의 텍스트로 합쳐 주므로 따로 처리할 필요가 없다.

## 4. 그림 부분

요소의 모습(색, 선, 글자, 치수)은 [[04-visual-design]]을 따른다. 요소 구성(`<rect>`, `<path>`, `<text>`), 클래스 이름, 텍스트 외곽선 옵션([[01-requirements#^fmt-outline]])은 [[02-layout]] 설계에서 정한다.

## 5. 버전 관리

- 형식 버전은 정수이며 1부터 시작한다.
- 읽기: 이전 버전 파일은 단계별 변환 함수(v1→v2→…)로 현재 버전 모델로 바꾼다.
- 쓰기: 항상 현재 버전으로 쓴다.
- 현재보다 **새 버전** 파일을 만나면 편집 불가로 처리하고, 앱 업데이트를 안내한다.

## 6. 미결정 사항

- [ ] 모델 네임스페이스 URI. 저장소 주소가 정해졌으므로(2026-10-15 → [[dr-0011-repo-name|DR-0011]]) 그 주소에 기댄 URI로 정할 수 있다. 한 번 정하면 바꾸기 어렵다
- [ ] 모델 요소 이름(`ans:document`는 안)과 필드 이름 (→ [[01-model]])
- [ ] 프로토타입이 쓴 `version: 0` 파일을 열지 (7장)

## 7. 프로토타입과 다른 곳

프로토타입(`journal/assets/2026-10-10-ns-prototype.html`)은 버리는 코드이고, 그 파일은 이 형식의 v1이 아닙니다.

- 모델을 `<metadata id="ariadne-nsd-model">` 안에 바로 넣는다(네임스페이스 요소 없음). `version: 0`이다.
- 머리 글자를 Method도 `event` 필드에 둔다. 갈래는 `yes` · `no` · `c0`…, 접기 영역은 블록처럼 `type: "range"`와 `children`으로 둔다(아키텍처는 "줄에 붙은 표시").
- 펴 보인 곳의 접기 영역을 문서 맨 위의 `siteFolds`에 둔다(이 명세는 호출 블록에 딸림).
- 글꼴 조각을 넣지 않고, 블록 글자의 종류와 결과 기호를 저장하지 않는다.
