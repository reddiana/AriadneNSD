---
title: 파일 형식 명세
aliases:
  - file-format
tags:
  - ariadne-nsd
  - spec
status: 초안
format-version: 1
updated: 2026-10-07
---

# 파일 형식 명세 (모델 내장 SVG)

세 배포 대상이 주고받는 저장 파일의 형식입니다. 앱들 사이의 약속이므로, **형식 버전이 바뀔 때만** 수정합니다.

- 관련 요구사항: [[01-requirements#3.4 파일 형식]]
- 관련 결정: [[0005-model-embedded-svg|ADR-0005]], [[0006-file-extensions|ADR-0006]], [[0007-json-serialization|ADR-0007]]

## 1. 확장자와 판별

| 배포 대상 | 확장자 |
| --- | --- |
| Obsidian 플러그인 | `이름.ns.svg` |
| 데스크톱 · 웹 | `이름.ns` |

1. 확장자는 1차 판별에만 쓴다.
2. 실제로 열 때는 [[#2. 문서 구조|`<metadata>` 안의 모델 요소]] 유무로 확인한다.
3. 모델 요소가 없거나 JSON이 손상되었으면 편집 불가로 처리한다. 원본 파일은 덮어쓰지 않는다.
4. `.nsd`(Structorizer)는 이 형식이 아니다. 가져오기 대상으로만 취급한다.

## 2. 문서 구조

```xml
<svg xmlns="http://www.w3.org/2000/svg" width="..." height="..." viewBox="...">
  <metadata>
    <nsd:diagram xmlns:nsd="(네임스페이스 URI — 미정)" version="1"><![CDATA[
{
  "version": 1,
  "root": { "type": "sequence", "children": [ ... ] }
}
    ]]></nsd:diagram>
  </metadata>
  <!-- 모델에서 생성한 그림 -->
  <g class="nsd-render"> ... </g>
</svg>
```

- 루트는 SVG 1.1 `<svg>` 요소다.
- 모델 요소는 `<metadata>` 안에 **정확히 하나** 있다.
- 모델 요소의 `version` 속성과 JSON의 `version` 필드는 같은 값이다.
- 그림 부분은 모델에서 생성한 결과일 뿐이며, 읽을 때 무시한다.

## 3. 모델 JSON

> [!todo] 스키마는 [[01-model]] 설계가 확정되면 작성합니다.
> 노드 타입별 필드, 필수/선택 여부, 기본값을 JSON Schema로 정의합니다.

### 3.1 출력 규칙

같은 모델이면 항상 같은 텍스트가 나와야 한다. ([[01-requirements#^fmt-deterministic]])

- UTF-8, 줄바꿈은 LF.
- 2칸 들여쓰기.
- 객체 키 순서는 스키마에 정의한 순서로 고정한다.
- 기본값과 같은 속성의 생략 여부는 스키마에서 속성마다 정하고, 항상 그대로 따른다.

### 3.2 CDATA 이스케이프

JSON 텍스트에 `]]>`가 나오면 CDATA를 나눠서 쓴다. ([[01-requirements#^fmt-escape]])

```
]]>   →   ]]]]><![CDATA[>
```

읽을 때는 XML 파서가 여러 CDATA 조각을 하나의 텍스트로 합쳐 주므로 따로 처리할 필요가 없다.

## 4. 그림 부분

> [!todo] [[02-layout]] 설계에서 정합니다.
> 요소 구성(`<rect>`, `<path>`, `<text>`), 클래스 이름, 글꼴 지정 방식, 텍스트 외곽선 옵션([[01-requirements#^fmt-outline]]).

## 5. 버전 관리

- 형식 버전은 정수이며 1부터 시작한다.
- 읽기: 이전 버전 파일은 단계별 변환 함수(v1→v2→…)로 현재 버전 모델로 바꾼다.
- 쓰기: 항상 현재 버전으로 쓴다.
- 현재보다 **새 버전** 파일을 만나면 편집 불가로 처리하고, 앱 업데이트를 안내한다.

## 6. 미결정 사항

- [ ] 모델 네임스페이스 URI (예: 프로젝트 저장소 주소 기반)
- [ ] 모델 요소 이름 (`nsd:diagram`은 임시)
