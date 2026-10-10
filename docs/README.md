---
title: NSDrawing 문서
aliases:
  - NSDrawing
tags:
  - nsdrawing
updated: 2026-10-10
---

# NSDrawing 문서

NS 차트(Nassi-Shneiderman Diagram)를 그리는 프로그램입니다. Obsidian 플러그인, 데스크톱 앱, 웹(정적 페이지)으로 배포합니다.

## 문서 지도

| 문서 | 답하는 질문 | 변경 방식 |
| --- | --- | --- |
| [[01-requirements\|요구사항]] | 무엇을 만드나? | 계속 갱신 |
| [[02-architecture\|아키텍처 개요]] | 전체 구조는? | 계속 갱신 |
| [[#아키텍처 결정 기록 (ADR)\|ADR]] | 왜 그렇게 정했나? | 확정 후 고치지 않음. 바뀌면 새 ADR로 대체 |
| [[#상세 설계\|설계 문서]] | 세부적으로 어떻게? | 구현과 함께 갱신 |
| [[01-file-format\|파일 형식 명세]] | 파일은 정확히 어떻게 생겼나? | 형식 버전이 바뀔 때만 |
| [[06-glossary\|용어집]] | 이 단어가 뭘 뜻하나? | 필요할 때 추가 |

> [!tip] 문서를 쓸 때의 원칙
> - 요구사항에는 **무엇을**만 쓰고, 근거는 ADR로, 방법은 설계 문서로 링크합니다.
> - 요구사항 항목은 블록 ID(`^edit-wrap` 등)로 가리킵니다. 예: [[01-requirements#^edit-wrap]]
> - 새 결정은 [[0000-template|ADR 템플릿]]을 복사해서 다음 번호로 만듭니다.

## 아키텍처 결정 기록 (ADR)

| 번호                                           | 제목                                   | 상태  |
| -------------------------------------------- | ------------------------------------ | --- |
| [[0001-record-architecture-decisions\|0001]] | ADR로 아키텍처 결정을 기록한다                   | 승인  |
| [[0002-three-targets-shared-core\|0002]]     | 세 대상 배포 + 공유 코어 모노레포                 | 승인  |
| [[0003-typescript\|0003]]                    | 구현 언어 TypeScript                     | 승인  |
| [[0004-structure-editor\|0004]]              | 구조 편집기: 트리 모델 + 자동 레이아웃              | 승인  |
| [[0005-model-embedded-svg\|0005]]            | 모델 내장 SVG를 저장 형식으로 사용                | 승인  |
| [[0006-file-extensions\|0006]]               | 확장자 `.ns` / `.ns.svg`                | 승인  |
| [[0007-json-serialization\|0007]]            | 모델 직렬화 형식 JSON                       | 승인  |
| [[0008-contiguous-selection\|0008]]          | 선택은 같은 부모 아래 연속 범위                   | 승인  |
| [[0009-desktop-framework\|0009]]             | 데스크톱 프레임워크 (Electron / Tauri)        | 제안됨 |
| [[0010-ui-framework\|0010]]                  | UI 프레임워크                             | 제안됨 |
| [[0011-development-order\|0011]]             | 개발 순서: 웹 → Obsidian → 데스크톱          | 승인  |
| [[0012-google-drive-integration\|0012]]      | Google Drive 연동은 웹 버전 위에 얹는다         | 승인  |
| [[0013-default-visual-style\|0013]]          | 기본 시각 스타일은 차분한 바탕 + 옅은 색조, 색은 테마로 분리 | 승인  |
| [[0014-drive-file-extension\|0014]]          | Google Drive에서 만드는 파일은 `.ns.svg`로 저장한다 | 승인  |
| [[0015-highlight-region-border\|0015]]       | 강조 영역은 굵은 테두리로 그린다 | 폐기  |
| [[0016-fold-state-outside-file\|0016]]       | 접힘 상태는 파일에 저장하지 않는다 | 승인  |
| [[0017-fold-name-in-model\|0017]]            | 접는 범위의 이름은 모델에 저장한다 | 승인  |
| [[0018-save-as-shown\|0018]]                 | 저장되는 그림은 지금 화면 그대로이고, 접힘 상태도 파일에 저장한다 (0016을 대체) | 제안됨 |

ADR 상태: **제안됨**(검토 중) → **승인** → (필요하면) **대체됨** / **폐기**

## 상세 설계

| 문서 | 대상 | 상태 |
| --- | --- | --- |
| [[01-model]] | 트리 모델, 노드 타입, 불변 조건, 편집 명령 | 작성 전 |
| [[02-layout]] | 레이아웃 알고리즘, 텍스트 폭 측정 | 작성 전 |
| [[03-editor]] | 편집 UI, 선택, 감싸기, 단축키 | 작성 전 |
| [[04-obsidian-plugin]] | Obsidian 플러그인 셸 | 작성 전 |
| [[05-desktop]] | 데스크톱 셸 | 작성 전 |
| [[06-web]] | 웹 셸 | 작성 전 |
