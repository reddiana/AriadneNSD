---
title: 품질 속성 시나리오
aliases:
  - QAS
  - 품질 속성 시나리오
tags:
  - requirements
  - architecture
status: 초안
updated: 2026-11-01
---

# 품질 속성 시나리오

[[01-requirements#4. 비기능 요구사항|비기능 요구사항]]을 **측정할 수 있는 시나리오**로 다듬은 문서입니다. 아키텍처([[03-architecture]])는 이 시나리오들을 만족하도록 구성되어 있어야 하고, 시나리오마다 그것을 확인할 테스트가 있어야 합니다.

> [!info] 읽는 법
> - 시나리오는 SEI(Bass · Clements · Kazman, *Software Architecture in Practice*)의 여섯 부분으로 씁니다: **자극원**(누가 · 무엇이), **자극**(무슨 일), **환경**(어떤 상황에서), **대상**(시스템의 어느 부분), **응답**(시스템이 하는 일), **응답 측정**(합격 기준).
> - **아키텍처**는 이 시나리오를 만족시키는 구조와 그 결정(ADR)입니다. **테스트**는 합격 기준을 확인하는 방법과 실행할 때입니다. 테스트는 같은 ID로 자동 테스트를 만듭니다(테스트 이름에 `T-0012 · QA-03: …`처럼 그 시나리오의 ID를 넣습니다). **테스트 ID**는 그 시나리오를 확인하는 테스트로, 테스트 목록 스크립트가 채웁니다(손으로 고치지 않습니다 → [[08-test-list]]). 층마다 어떻게 시험하는지는 [[07-testing]]에 있습니다.
> - 합격 기준의 수치 가운데 요구사항에 없던 것은 **제안값**이라고 적었습니다. 확인받기 전입니다.
> - 시나리오가 기대는 유즈케이스는 [[02-use-cases]]의 ID로 적습니다.

## 1. 목록

| ID | 품질 속성 | 시나리오 (한 줄) | 요구사항 | 우선 |
| --- | --- | --- | --- | --- |
| QA-01 | 정합성 | 어떤 편집 명령을 이어 해도 문서는 불변식을 지킨다 | [[01-requirements#^r-nfr\|R-NFR-01]] | 높음 |
| QA-02 | 정합성 · 신뢰성 | 깨진 파일을 열어도 원본은 그대로이고 편집기는 죽지 않는다 | [[01-requirements#^r-fmt\|R-FMT-06]] | 높음 |
| QA-03 | 호환성 · 결정성 | 같은 문서는 어느 배포 대상 · 브라우저 · OS에서 저장해도 같은 바이트다 | [[01-requirements#^r-nfr\|R-NFR-02]], [[01-requirements#^r-fmt\|R-FMT-03]] | 높음 |
| QA-04 | 호환성 | 열고 편집하지 않고 저장하면 원본과 같은 바이트다 | [[01-requirements#^r-fmt\|R-FMT-03]] | 높음 |
| QA-05 | 호환성 | 옛 형식 버전의 파일이 모두 열린다 | [[01-requirements#^r-fmt\|R-FMT-02]] | 중간 |
| QA-06 | 이식성 | 저장된 그림은 플러그인도 글꼴도 없는 뷰어에서 편집기와 같게 보인다 | [[01-requirements#^r-fmt\|R-FMT-01]], [[01-requirements#^r-fmt\|R-FMT-07]], [[01-requirements#^r-fmt\|R-FMT-08]] | 높음 |
| QA-07 | 성능 | 블록 500개 문서에서 편집 한 번이 100ms 안에 화면에 반영된다 | [[01-requirements#^r-nfr\|R-NFR-03]] | 높음 |
| QA-08 | 성능 | 블록 500개 문서가 정해진 시간 안에 열린다 | [[01-requirements#^r-nfr\|R-NFR-03]] (제안) | 중간 |
| QA-09 | 자원 | 저장 파일과 편집기 번들의 크기가 정해진 값을 넘지 않는다 | [[01-requirements#^r-fmt\|R-FMT-07]] (제안) | 중간 |
| QA-10 | 변경 용이성 | 새 배포 대상(셸)을 붙일 때 `core` · `editor`를 수정하지 않는다 | [[01-requirements#^r-nfr\|R-NFR-02]], [[0002-three-targets-shared-core\|ADR-0002]] | 높음 |
| QA-11 | 변경 용이성 | 화면 렌더링 백엔드를 바꿀 때 구현체 하나만 바뀌고 저장 파일은 그대로다 | [[0030-swappable-drawing\|ADR-0030]] | 중간 |
| QA-12 | 변경 용이성 | 블록 종류를 추가할 때 셸을 수정하지 않고 기존 파일은 그대로 열린다 | [[01-requirements#^r-blk\|R-BLK-12]], [[01-requirements#^r-blk\|R-BLK-13]], [[01-requirements#^r-blk\|R-BLK-14]] (`P2` 블록) | 중간 |
| QA-13 | 변경 용이성 | 화면 언어를 더할 때 코드를 수정하지 않는다 | [[01-requirements#^r-nfr\|R-NFR-04]] | 낮음 |
| QA-14 | 테스트 가능성 | `core`의 테스트는 DOM 없이 Node에서 실행된다 | [[01-requirements#^r-nfr\|R-NFR-06]] | 높음 |
| QA-15 | 사용성 · 접근성 | 키보드만으로 주요 유즈케이스를 끝낼 수 있다 | [[01-requirements#^r-nfr\|R-NFR-05]], [[01-requirements#^r-edit\|R-EDIT-03]] | 높음 |
| QA-16 | 접근성 | 고대비 화면 색과 흑백 팔레트는 정해진 대비를 지킨다 | [[01-requirements#^r-nfr\|R-NFR-05]] | 낮음 |
| QA-17 | 신뢰성 | 저장에 실패해도 편집한 내용을 잃지 않는다 | UC-06 최소 보장 | 높음 |
| QA-18 | 성능 | 느린 휴대폰과 모바일 망에서 웹의 편집 화면이 정해진 시간 안에 보인다 | [[01-requirements#^r-nfr\|R-NFR-09]] | 중간 |
| QA-19 | 신뢰성 | 시작하다 막히거나 실패해도 빈 화면으로 남지 않는다 | [[01-requirements#^r-nfr\|R-NFR-10]] | 높음 |
| QA-20 | 호환성 · 사용성 | 휴대폰(Android의 Chrome)에서 터치로 열고 편집한다 | [[01-requirements#^r-nfr\|R-NFR-08]] | 중간 |
| QA-21 | 보안 · 신뢰성 | 깨지거나 꾸민 공유 링크를 열어도 편집기는 죽지 않고, 작은 링크가 메모리를 다 쓰지 않는다 | [[01-requirements#^r-web\|R-WEB-05]] | 높음 |

"우선"은 아키텍처에 주는 무게입니다. **높음**은 구조를 정하는 시나리오이고(어기면 구조를 바꿔야 함), **중간 · 낮음**은 구현에서 맞출 수 있는 시나리오입니다.

## 2. 시나리오

### QA-01 편집 명령과 불변식

| 부분 | 내용 |
| --- | --- |
| 자극원 | 작성자 |
| 자극 | 편집 명령을 임의의 순서로 잇달아 실행한다(삽입, 삭제, 감싸기, 풀기, 이동, Method로 빼기, 실행 취소 · 다시 실행 …) |
| 환경 | 정상 편집 중. 어떤 문서 상태에서든 |
| 대상 | `core`의 모델과 편집 명령 |
| 응답 | 모든 명령의 결과 문서가 불변식을 지킨다. 지킬 수 없는 명령은 거절되고 문서는 그대로다 |
| 응답 측정 | 무작위 명령열 테스트에서 불변식 위반 **0건** (제안값: 명령열 10,000개 × 길이 200) |

- **아키텍처:** 명령은 문서를 받아 새 문서를 반환하는 순수 함수이고, 새 문서를 만들 때마다 불변식을 검사한다. 위반하는 문서는 만들어지지 않는다 → [[03-architecture#5. 공통 관심사]], [[0029-immutable-document-undo|ADR-0029]], [[01-model#3. 불변식]]
- **테스트:** 속성 기반 테스트(property-based test, 예: fast-check). 무작위 문서와 무작위 명령열을 만들어 매 단계 불변식을 검사한다. 실패하면 가장 짧은 반례로 줄여 회귀 테스트에 추가한다. **실행할 때:** 모든 커밋(CI)
- **테스트 ID:** `packages/core/src/commands/properties.test.ts`의 테스트 2개([[08-test-list#^t-packages-core-src-commands-properties-test-ts|T-0171]] ~ T-0172). `packages/editor/src/session/random-keys.test.ts`의 테스트 1개([[08-test-list#^t-packages-editor-src-session-random-keys-test-ts|T-0228]])

### QA-02 깨진 파일 열기

| 부분 | 내용 |
| --- | --- |
| 자극원 | 다른 도구, 망가진 동기화, 손으로 수정한 파일 |
| 자극 | 모델이 없거나, JSON이 깨졌거나, 불변식을 어긴 모델이 든 파일을 연다 |
| 환경 | 모든 배포 대상 |
| 대상 | `core`의 파일 형식(역직렬화) |
| 응답 | 편집할 수 없다고 알리고 끝난다. 원본 파일에 쓰지 않는다 |
| 응답 측정 | 퍼징 입력에서 처리되지 않은 예외 **0건**, 원본 파일의 바이트 변화 **0건** |

- **아키텍처:** 역직렬화할 때도 편집 명령과 같은 불변식 검사를 한다. 열기는 읽기만 한다 → [[01-file-format#5. 버전 관리]], [[03-architecture#4.2 저장과 열기]]
- **테스트:** 퍼징(올바른 파일을 무작위로 망가뜨린 입력 + 손으로 만든 깨진 파일 묶음). 열기 뒤 원본 파일의 해시가 같은지 본다. **실행할 때:** 모든 커밋(짧게), 매일 밤(길게)
- **테스트 ID:** [[08-test-list#^t-packages-core-src-format-parse-model-test-ts|T-0419]], [[08-test-list#^t-packages-core-src-format-round-trip-test-ts|T-0424]], [[08-test-list#^t-packages-core-src-format-svg-file-test-ts|T-0436]]. 인수 테스트 [[01-requirements#^at|AT-06]]([[08-test-list#^t-apps-web-e2e-acceptance-spec-ts|T-0008]])

### QA-03 어디서 저장해도 같은 파일

| 부분 | 내용 |
| --- | --- |
| 자극원 | 작성자 |
| 자극 | 같은 문서(같은 내용, 같은 뷰 상태)를 저장한다. 저장하는 사람의 화면 언어는 달라도 된다 |
| 환경 | 서로 다른 배포 대상(웹, Obsidian, 데스크톱), 브라우저(Chrome, Edge, Firefox, Safari), OS(Windows, macOS, Linux, Android) |
| 대상 | `core`의 레이아웃 · 렌더러 · 파일 형식, `fonts` |
| 응답 | 같은 바이트의 파일을 쓴다 |
| 응답 측정 | 골든 문서 묶음의 저장 결과 SHA-256이 모든 환경에서 **100% 일치** |

- **아키텍처:** 레이아웃과 렌더러는 순수 함수다. 텍스트 폭은 브라우저에 묻지 않고 번들 글꼴의 advance 폭 테이블로 계산하고 정수 px로 올린다. JSON의 키 순서와 줄바꿈을 고정하고, 시각 · 기기 정보 · 난수를 쓰지 않는다. 서브세팅은 결정적이다 → [[03-architecture#5. 공통 관심사]], [[0026-bundled-font-metrics|ADR-0026]]
- **테스트:** 골든 파일 테스트. 대표 문서 묶음(한글 · 영문 · 기호, 블록 종류 모두, 접힘 · 펴 보기 포함)을 저장해 저장소의 기대 파일과 바이트로 비교한다. 같은 테스트를 Node와 각 브라우저(Playwright)에서 실행한다. **실행할 때:** 모든 커밋(Node, Chromium), 출시 전(모든 브라우저와 Obsidian)
- **테스트 ID:** [[08-test-list#^t-packages-editor-src-create-editor-test-ts|T-0816]]. 인수 테스트 [[01-requirements#^at|AT-10]]([[08-test-list#^t-apps-web-e2e-acceptance-spec-ts|T-0012]])
- **위험:** Firefox와 Safari는 스파이크에서 확인하지 못했다 → [[03-architecture#7. 위험과 검증이 필요한 사항]]

### QA-04 열고 바로 저장하면 그대로

| 부분 | 내용 |
| --- | --- |
| 자극원 | 작성자 |
| 자극 | 파일을 열고 아무것도 편집하지 않고 저장한다 |
| 환경 | 파일을 만든 앱과 같은 형식 버전 |
| 대상 | 파일 형식(역직렬화 → 직렬화) |
| 응답 | 원본과 같은 파일을 쓴다 |
| 응답 측정 | 골든 문서 묶음의 왕복(round-trip)에서 바이트 차이 **0건** |

- **아키텍처:** QA-03과 같다. 뷰 상태도 파일에 들어 있어 열 때 그대로 복원된다 → [[0018-save-as-shown|ADR-0018]]
- **테스트:** 골든 파일 왕복 테스트. **실행할 때:** 모든 커밋
- **테스트 ID:** [[08-test-list#^t-packages-editor-src-examples-examples-test-ts|T-0329]], [[08-test-list#^t-packages-core-node-golden-test-ts|T-0354]], [[08-test-list#^t-packages-core-src-format-round-trip-test-ts|T-0423]], [[08-test-list#^t-packages-core-src-format-svg-file-test-ts|T-0429]]. 인수 테스트 [[01-requirements#^at|AT-02]]([[08-test-list#^t-apps-web-e2e-acceptance-spec-ts|T-0002]], [[08-test-list#^t-apps-web-e2e-acceptance-spec-ts|T-0022]])
- **알아 둘 것:** 화면 언어가 달라도 같다. 그림에 적는 텍스트("참", "거짓", "블록 n개")는 문서 설정의 언어를 따르기 때문이다([[0041-drawing-locale-in-document|ADR-0041]]). 그림의 언어가 적히지 않은 옛 파일만, 처음 저장할 때 연 사람의 화면 언어가 더해진다

### QA-05 옛 파일 열기

| 부분 | 내용 |
| --- | --- |
| 자극원 | 작성자 |
| 자극 | 옛 형식 버전으로 저장된 파일을 연다 |
| 환경 | 형식 버전이 올라간 뒤의 앱 |
| 대상 | 파일 형식의 마이그레이션 |
| 응답 | 버전별 마이그레이션을 차례로 적용해 지금 형식의 모델로 연다 |
| 응답 측정 | 형식 버전 1부터의 모든 골든 파일이 **100% 열리고** 불변식을 지킨다(프로토타입의 v0 파일은 열지 않는다 → [[0035-model-namespace-and-v0\|ADR-0035]]) |

- **아키텍처:** 형식 버전은 정수, 버전마다 마이그레이션 함수 하나 → [[01-file-format#5. 버전 관리]]
- **테스트:** 형식 버전을 올릴 때마다 그 버전의 골든 파일을 저장소에 고정해 두고(삭제하지 않음), 모두 여는 테스트. **실행할 때:** 모든 커밋
- **테스트 ID:** 없음

### QA-06 어디서나 같은 그림

| 부분 | 내용 |
| --- | --- |
| 자극원 | 독자 |
| 자극 | 저장된 `.ns.svg`를 연다 |
| 환경 | AriadneNSD도 번들 글꼴도 없는 뷰어: Chrome, Firefox, Safari, GitHub의 파일 보기, Obsidian(플러그인 없음), Google Drive 미리보기 |
| 대상 | 저장된 SVG 파일 |
| 응답 | 편집기 화면의 문서 레이어와 같은 그림이 보인다. 텍스트는 텍스트로 남는다(선택 · 검색 가능) |
| 응답 측정 | SVG 1.1 검증 오류 **0건**. 빠진 문자(대체 글꼴로 그려진 문자) **0개**. 기준 그림과의 픽셀 차이 **1% 이하**(제안값, 안티앨리어싱 차이를 허용) |

- **아키텍처:** 쓰인 문자만 남긴 서브셋 글꼴과 문서 테마의 색을 파일 안에 포함한다. 편집 중에만 보이는 표시는 오버레이 레이어라 저장되지 않는다 → [[0026-bundled-font-metrics|ADR-0026]], [[0018-save-as-shown|ADR-0018]], [[03-architecture#4.2 저장과 열기]]
- **테스트:** 시각 회귀 테스트. 골든 문서를 각 브라우저에서 이미지로 열어(Playwright 스크린샷) 기준 그림과 픽셀로 비교한다. SVG 1.1 검증기로 문법을 본다. GitHub · Drive · Obsidian은 수동 점검표. **실행할 때:** 모든 커밋(Chromium), 출시 전(나머지)
- **테스트 ID:** 인수 테스트 [[01-requirements#^at|AT-08]]([[08-test-list#^t-apps-web-e2e-acceptance-spec-ts|T-0010]])

### QA-07 편집 반응 시간

| 부분 | 내용 |
| --- | --- |
| 자극원 | 작성자 |
| 자극 | 블록 하나의 텍스트를 편집하거나 블록을 삽입한다 |
| 환경 | 블록 500개 문서. 기준 기기(제안값: 4년 된 보급형 노트북, 예: 4코어 CPU · 8 GB, Chrome) |
| 대상 | 편집 명령 → 레이아웃 → 렌더링 → 화면 갱신 |
| 응답 | 바뀐 그림이 화면에 보인다 |
| 응답 측정 | 입력부터 화면 갱신까지 **p95 100ms 이하** |

- **아키텍처:** 불변 문서와 구조적 공유로 바뀌지 않은 하위 트리를 구분해 낼 수 있다. 증분 레이아웃(메모이제이션)을 할지는 측정해서 정한다 → [[0029-immutable-document-undo|ADR-0029]], [[02-layout#4. 성능]]
- **테스트:** 성능 벤치마크. 블록 500개 문서에서 대표 명령 20가지를 각 100번 실행해 p95를 측정한다. Node에서 `core`만(레이아웃 + 렌더링, 목표의 절반인 50ms 이하를 제안)과 브라우저에서 화면 갱신까지(Playwright, 성능 타임라인)로 나눈다. **실행할 때:** 모든 커밋(Node, 결과를 기록해 느려지면 알림), 출시 전(기준 기기)
- **테스트 ID:** [[08-test-list#^t-packages-core-src-render-render-doc-test-ts|T-0487]], [[08-test-list#^t-apps-web-src-perf-perf-report-test-ts|T-1132]], [[08-test-list#^t-apps-web-src-perf-perf-report-test-ts|T-1133]], [[08-test-list#^t-apps-web-src-perf-perf-report-test-ts|T-1139]], [[08-test-list#^t-apps-web-src-perf-perf-report-test-ts|T-1140]], [[08-test-list#^t-packages-core-src-render-render-bench-ts|T-0517]]. `packages/core/src/layout/fold-layout.test.ts`의 테스트 14개([[08-test-list#^t-packages-core-src-layout-fold-layout-test-ts|T-1113]] ~ T-1126). 인수 테스트 [[01-requirements#^at|AT-05]]([[08-test-list#^t-apps-web-e2e-acceptance-spec-ts|T-0007]], [[08-test-list#^t-apps-web-e2e-perf-spec-ts|T-1127]], [[08-test-list#^t-apps-web-e2e-perf-spec-ts|T-1128]], [[08-test-list#^t-apps-web-src-perf-perf-report-test-ts|T-1135]], [[08-test-list#^t-apps-web-src-perf-perf-report-test-ts|T-1136]])
- **열린 질문:** "500개"를 문서의 블록 수로 셀지, 펴 보인 호출 블록까지 그려지는 블록 수로 셀지 → [[03-architecture#7. 위험과 검증이 필요한 사항]]

### QA-08 여는 시간 (제안)

| 부분 | 내용 |
| --- | --- |
| 자극원 | 작성자 |
| 자극 | 파일을 연다 |
| 환경 | 블록 500개 문서, QA-07의 기준 기기 |
| 대상 | 역직렬화 → 마이그레이션 → 레이아웃 → 렌더링 |
| 응답 | 편집할 수 있는 화면이 보인다 |
| 응답 측정 | **1초 이하** (제안값) |

- **아키텍처:** 열 때는 모델 JSON만 읽고 그림 부분과 서브셋 글꼴은 읽지 않는다 → [[03-architecture#4.2 저장과 열기]]
- **테스트:** QA-07과 같은 벤치마크에 열기를 더했다. Node에서 `core`만: 저장한 파일(블록 500개, 실제 서브셋 글꼴만 한 글꼴 자리를 넣음)을 열어 검사하고 레이아웃 · 그리기까지 p99 100ms 이하. 화면에 붙여 편집할 수 있게 되기까지는 브라우저에서 잰다(아직 없음). **실행할 때:** 모든 커밋
- **테스트 ID:** [[08-test-list#^t-packages-core-src-render-render-bench-ts|T-0540]]

### QA-09 파일과 번들의 크기 (제안)

| 부분 | 내용 |
| --- | --- |
| 자극원 | 작성자 |
| 자극 | 문서를 저장한다 / 편집기를 내려받는다 |
| 환경 | 서로 다른 한글 300자를 쓴 블록 100개 문서 / 첫 방문 |
| 대상 | 저장 파일 / 웹 번들, Obsidian `main.js` |
| 응답 | 파일과 번들이 작다 |
| 응답 측정 | 저장 파일 **300 KB 이하**, Obsidian `main.js` **3 MB 이하** (둘 다 제안값) |

- **아키텍처:** 편집기에는 기본 블록 글꼴 D2Coding 보통 굵기 하나를 번들한다. 한자를 뺀 문자(라틴 · 유럽 확장, 한글, 그리스, 키릴, 가나)를 싣고, woff2로 약 328 KB다 → [[0034-default-block-font|ADR-0034]]. 웹은 이것을 문자 범위의 조각 38개로 나눠 화면에 나온 글자의 조각만 받는다 → [[0040-screen-font-slices|ADR-0040]]. 저장 파일에는 쓰인 문자만 추린 서브셋 글꼴을 포함한다. 서브셋이 300 KB 안에 드는지는 정하지 않음 → [[03-architecture#7. 위험과 검증이 필요한 사항]], [[02-layout]]
- **테스트:** 번들 사이즈 체크(bundle size budget, 빌드 산출물과 골든 문서의 저장 결과 크기를 측정하고, 넘으면 실패). **실행할 때:** 모든 커밋
- **테스트 ID:** [[08-test-list#^t-packages-core-node-golden-test-ts|T-0355]]. 테스트가 아닌 검사: 번들 사이즈 체크 `apps/web/scripts/check-size.mjs` (CI의 웹 빌드 뒤)

### QA-10 새 셸 붙이기

| 부분 | 내용 |
| --- | --- |
| 자극원 | 개발자 |
| 자극 | 새 배포 대상의 셸을 만든다(예: Confluence, VSCode) |
| 환경 | 설계 · 개발 중 |
| 대상 | 패키지 구조, `editor`와 셸의 인터페이스 |
| 응답 | 새 셸 패키지 안에서 필요 인터페이스 둘을 구현하고, 제공 인터페이스를 호스트에 등록하는 것으로 끝난다 |
| 응답 측정 | `core` · `editor` · `fonts`의 변경 **0줄** |

- **아키텍처:** 필요 인터페이스 `DocumentStore` · `SettingsStore`, 제공 인터페이스 `CommandRegistry` · `SettingsSchema`. 의존은 셸 → `editor` → `core` 한 방향 → [[03-architecture#3.2 editor와 셸의 인터페이스]], [[0031-shell-interfaces|ADR-0031]], [[0033-command-list-for-shells|ADR-0033]]
- **테스트:** 정적 분석(의존 규칙 검사, 예: dependency-cruiser). `core`가 `editor`나 `apps/*`를 import하면, `editor`가 `apps/*`를 import하면 실패. 테스트용 가짜 셸(메모리 안의 `DocumentStore`)로 `editor`의 테스트를 실행한다. 새 셸을 붙인 PR에서 `packages/`의 변경을 본다. **실행할 때:** 모든 커밋
- **테스트 ID:** `packages/editor/src/create-editor.test.ts`의 테스트 48개([[08-test-list#^t-packages-editor-src-create-editor-test-ts|T-0356]] ~ T-0820). 테스트가 아닌 검사: 의존 방향 검사 dependency-cruiser (`pnpm deps`)
- **알아 둘 것:** IDE 플러그인은 원본이 소스 코드라 예외일 수 있다 → [[03-architecture#6. 배포 구성]]

### QA-11 렌더링 백엔드 바꾸기

| 부분 | 내용 |
| --- | --- |
| 자극원 | 개발자 |
| 자극 | 화면 렌더링을 "SVG 문자열 삽입"에서 UI 프레임워크로 그리기로 바꾼다 |
| 환경 | 출시 뒤 |
| 대상 | `editor`의 렌더링 백엔드 |
| 응답 | 백엔드 구현체 하나만 바뀐다 |
| 응답 측정 | `core`의 변경 **0줄**. QA-03 · QA-06의 골든 파일 바이트 변화 **0건**. 히트 테스트와 선택 오버레이의 테스트가 그대로 통과 |

- **아키텍처:** 씬 빌드와 SVG 출력을 나눈 렌더러, 렌더링 백엔드 인터페이스 하나, DOM이 아니라 레이아웃 결과로 하는 히트 테스트 → [[0030-swappable-drawing|ADR-0030]], [[03-architecture#3.3 의존 규칙]]
- **테스트:** 히트 테스트와 오버레이 위치를 레이아웃 결과만으로 확인하는 단위 테스트(DOM 없음). 렌더링 백엔드 인터페이스에 대한 계약 테스트(같은 씬 → 같은 화면 요소). **실행할 때:** 모든 커밋
- **테스트 ID:** 없음

### QA-12 블록 종류 추가

| 부분 | 내용 |
| --- | --- |
| 자극원 | 개발자 |
| 자극 | 새 블록 종류를 추가한다(예: `P2`의 탈출, 병렬) |
| 환경 | 출시 뒤 |
| 대상 | `core`의 모델 · 명령 · 레이아웃 · 씬 빌드 |
| 응답 | 바뀌는 곳은 `core`의 그 블록에 대한 부분과 키 표뿐이다 |
| 응답 측정 | 셸의 변경 **0줄**. 옛 파일은 그대로 열린다(QA-05) |

- **아키텍처:** 블록은 판별 유니온(`kind`)이고, TypeScript의 완전성 검사(exhaustiveness check)가 손볼 곳을 모두 알려 준다. 명령은 `CommandRegistry`로 셸에 자동으로 나타난다 → [[01-model#1.4 블록]], [[0033-command-list-for-shells|ADR-0033]]
- **테스트:** 컴파일러의 완전성 검사(`never`), QA-05의 옛 파일 테스트, QA-01의 무작위 명령열에 새 블록을 추가함. **실행할 때:** 모든 커밋
- **테스트 ID:** 테스트가 아닌 검사: TypeScript의 완전성 검사 (`pnpm typecheck`)

### QA-13 화면 언어 추가

| 부분 | 내용 |
| --- | --- |
| 자극원 | 번역자 |
| 자극 | 화면 언어 하나를 추가한다 |
| 환경 | 출시 뒤 |
| 대상 | `editor`와 `core`의 메시지 카탈로그 |
| 응답 | 카탈로그 파일을 추가하는 것으로 끝난다 |
| 응답 측정 | 코드의 변경 **0줄**(언어 목록 한 줄 제외). 화면에 카탈로그 밖의 텍스트 **0개** |

- **아키텍처:** 화면의 텍스트는 `editor`, 그림에 적는 텍스트는 `core`가 한 곳씩에서 관리한다 → [[03-architecture#5. 공통 관심사]]
- **테스트:** 정적 분석: UI 코드(`.tsx`)의 JSX에 쓴 글자와 `title` · `aria-label` · `placeholder` · `alt` 속성의 글자를 ESLint가 막는다(번역하지 않는 제품 이름과 확장자는 이름 붙은 상수로). 카탈로그 넷(그림 · 엔진 · UI · 웹 셸)이 언어마다 모든 키를 가지는지는 타입 검사가 본다. 단위 테스트는 빈 글이 없는지, `{name}` 자리표시가 언어마다 같은지, 엔진과 UI 카탈로그에 같은 키가 없는지 본다. 언어 목록은 `core`의 `locales` 한 줄이다. **실행할 때:** 모든 커밋
- **테스트 ID:** [[08-test-list#^t-apps-web-src-shell-messages-test-ts|T-0530]], [[08-test-list#^t-apps-web-src-perf-perf-report-test-ts|T-1137]]. `packages/core/src/i18n/messages.test.ts`의 테스트 2개([[08-test-list#^t-packages-core-src-i18n-messages-test-ts|T-0531]] ~ T-0532). `packages/editor/src/i18n/messages.test.ts`의 테스트 3개([[08-test-list#^t-packages-editor-src-i18n-messages-test-ts|T-0533]] ~ T-0535). 테스트가 아닌 검사: JSX에 쓴 텍스트 금지 규칙 (`eslint.config.js`, `pnpm lint`), 카탈로그마다 모든 언어의 키 (`pnpm typecheck`)

### QA-14 DOM 없이 테스트

| 부분 | 내용 |
| --- | --- |
| 자극원 | 개발자, CI |
| 자극 | `core` · `fonts`의 테스트를 실행한다 |
| 환경 | 브라우저 없는 Node |
| 대상 | `core`, `fonts` |
| 응답 | 모든 테스트가 실행된다 |
| 응답 측정 | `core` · `fonts`에서 DOM · 브라우저 API를 쓰는 곳 **0곳**. 단위 테스트 전체 **1분 이하**(제안값) |

- **아키텍처:** `core`와 `fonts`는 DOM과 브라우저 API에 의존하지 않는다 → [[03-architecture#3.3 의존 규칙]]
- **테스트:** `core` · `fonts`의 TypeScript 설정에서 `lib`에 `dom`을 빼서, 쓰면 컴파일이 실패하게 한다. CI가 Node에서만 단위 테스트를 실행한다. **실행할 때:** 모든 커밋
- **테스트 ID:** 테스트가 아닌 검사: `core` · `fonts`의 `tsconfig`에 `dom`이 없음 (`pnpm typecheck`)

### QA-15 키보드만으로

| 부분 | 내용 |
| --- | --- |
| 자극원 | 마우스를 쓰지 않는 작성자 |
| 자극 | UC-01 새로 만들기, UC-02 열기, UC-03 편집, UC-05 훑어보기, UC-06 저장을 한다 |
| 환경 | 웹, 데스크톱, Obsidian |
| 대상 | `editor`의 키 입력과 포커스 |
| 응답 | 마우스 없이 끝낸다. 지금 어디에 있는지 늘 보인다 |
| 응답 측정 | 위 유즈케이스의 인수 시나리오가 **키 입력만으로 100% 통과**. 포커스가 보이지 않는 순간 **0번** |

- **아키텍처:** 모든 명령은 `CommandRegistry`에 있고 키 표 하나로 키에 잇는다. 메뉴와 툴바도 같은 레지스트리에서 나온다 → [[0033-command-list-for-shells|ADR-0033]], [[03-keymap]]
- **테스트:** E2E 테스트(Playwright, 키 입력만). 레지스트리의 명령마다 키나 키로 열 수 있는 메뉴가 있는지 보는 테스트. **실행할 때:** 모든 커밋(웹), 출시 전(Obsidian, 데스크톱)
- **테스트 ID:** 인수 테스트 [[01-requirements#^at|AT-04]]([[08-test-list#^t-apps-web-e2e-acceptance-spec-ts|T-0004]], [[08-test-list#^t-apps-web-e2e-acceptance-spec-ts|T-0005]], [[08-test-list#^t-apps-web-e2e-acceptance-spec-ts|T-0006]])

### QA-16 고대비

| 부분 | 내용 |
| --- | --- |
| 자극원 | 저시력 작성자 |
| 자극 | 고대비 화면 색, 흑백 팔레트를 선택한다 |
| 환경 | 모든 배포 대상 |
| 대상 | 화면 색과 테마의 디자인 토큰 |
| 응답 | 텍스트와 선이 배경과 뚜렷이 구분된다 |
| 응답 측정 | 텍스트와 배경의 대비 **7:1 이상**(WCAG AAA, 제안값), 선과 배경은 **3:1 이상** |

- **아키텍처:** 색은 토큰 맵으로 렌더러에 넘기고, 테마와 화면 색은 다른 맵이다 → [[03-architecture#5. 공통 관심사]], [[04-visual-design#8. 테마]]
- **테스트:** 토큰 표에서 짝(텍스트 · 배경, 선 · 배경)의 대비를 계산하는 단위 테스트. 지금은 밝은 기본 테마만 있어, 그 테마의 [[04-visual-design#3.3 밝은 기본 테마|3.3절]] 기준(텍스트 4.5:1, 선 3:1)을 종이와 블록 배경 여섯 위에서 본다. 고대비 화면 색과 흑백 인쇄 팔레트가 생기면 같은 테스트에 이 시나리오의 기준(7:1)으로 더한다. **실행할 때:** 모든 커밋
- **테스트 ID:** `packages/core/src/render/theme.test.ts`의 테스트 11개([[08-test-list#^t-packages-core-src-render-theme-test-ts|T-0536]] ~ T-0986)

### QA-17 저장 실패

| 부분 | 내용 |
| --- | --- |
| 자극원 | 호스트 플랫폼 |
| 자극 | 저장 중 쓰기가 실패한다(권한 없음, 디스크 가득, 네트워크 끊김) |
| 환경 | 모든 배포 대상 |
| 대상 | 저장 흐름(`editor` → `DocumentStore`) |
| 응답 | 실패를 알리고, 편집기의 내용과 "저장 안 됨" 표시를 그대로 둔다 |
| 응답 측정 | 편집한 내용의 손실 **0건**. 원본 파일이 온전히 남는지는 미결정 → [[02-use-cases#6. 미결정 사항]] |

- **아키텍처:** 문서는 불변이고 `editor`가 갖고 있으므로, 쓰기 실패는 문서를 바꾸지 않는다. `DocumentStore`의 쓰기는 실패를 던지지 않고 값(`WriteResult`: `cancelled` · `denied` · `failed`)으로 반환한다 → [[03-editor#6. 셸과의 연결]]
- **테스트:** 실패하는 가짜 `DocumentStore`로 저장하고, 문서 · "저장 안 됨" 표시 · 알림을 보는 테스트. **실행할 때:** 모든 커밋
- **테스트 ID:** 인수 테스트 [[01-requirements#^at|AT-07]]([[08-test-list#^t-apps-web-e2e-acceptance-spec-ts|T-0009]], [[08-test-list#^t-apps-web-e2e-acceptance-spec-ts|T-0023]])

### QA-18 휴대폰에서 시작하는 시간

| 부분 | 내용 |
| --- | --- |
| 자극원 | 휴대폰으로 처음 온 사람 |
| 자극 | 웹의 주소를 연다 |
| 환경 | 캐시가 빈 브라우저. 기준: CPU 4배 느림과 "slow 4G"(왕복 150 ms, 내려받기 1.6 Mbps, Lighthouse의 모바일 측정과 같음) |
| 대상 | 웹의 첫 내려받기(HTML · JS · 화면용 블록 글꼴)와 시작 |
| 응답 | 편집 화면이 보이고, 이어서 블록 글꼴로 바뀐다 |
| 응답 측정 | 편집 화면 **3초 이하**, 블록 글꼴까지 **5초 이하** (2026-11-01에 메인테이너가 확인. 그날 잰 값은 CPU 6배에서 약 1.8초와 4초) |

- **아키텍처:** 편집 화면은 블록 글꼴을 기다리지 않고 그린다(텍스트 폭은 글꼴 파일이 아니라 번들한 advance 폭 테이블로 계산하므로 레이아웃은 같다). 저장용 TTF와 wasm은 첫 편집 뒤에 받는다 → [[06-web#5. 배포]], [[0026-bundled-font-metrics|ADR-0026]]
- **테스트:** E2E(Playwright, Android 폰 흉내 + CPU · 네트워크 감속). 편집 화면과 블록 글꼴이 보인 때를 재어 합격 기준과 견준다. 원인을 나눠 보는 재기 스크립트 `src/apps/web/scripts/measure-startup.mjs`. **실행할 때:** 모든 커밋(흉내), 출시 전(실제 휴대폰)
- **테스트 ID:** `apps/web/e2e/mobile.spec.ts`의 테스트 6개([[08-test-list#^t-apps-web-e2e-mobile-spec-ts|T-0287]] ~ T-0523)

### QA-19 시작이 막혀도 빈 화면은 없음

| 부분 | 내용 |
| --- | --- |
| 자극원 | 브라우저 |
| 자극 | 시작하는 동안 브라우저 저장소(IndexedDB)가 응답하지 않거나, 스크립트가 오류를 낸다 |
| 환경 | 웹. 어떤 브라우저 · 기기에서든 |
| 대상 | 웹의 시작(`index.html`, `main.tsx`) |
| 응답 | 저장소가 응답하지 않으면 메모리로 대신하고 편집 화면을 띄운다. 오류면 멈춘 단계 · 오류 · 브라우저 정보를 화면에 적는다 |
| 응답 측정 | 저장소가 응답하지 않을 때 편집 화면까지 **3초 + 시작 시간 이하**. 빈 화면으로 남는 경우 **0번**(어떤 경우든 15초 안에 편집 화면이나 까닭이 보인다) |

- **아키텍처:** 저장소 열기의 시간 제한(3초)과 메모리 대체, 시작 화면과 시작 단계(`data-boot-step`) → [[06-web#2. 로컬 백업과 자동 저장]], [[06-web#7. 웹에서의 화면]]
- **테스트:** E2E(응답하지 않는 `indexedDB.open`, 시작 중 오류를 흉내). **실행할 때:** 모든 커밋
- **테스트 ID:** `apps/web/e2e/boot.spec.ts`의 테스트 2개([[08-test-list#^t-apps-web-e2e-boot-spec-ts|T-0278]] ~ T-0279)

### QA-20 휴대폰에서 쓰기

| 부분 | 내용 |
| --- | --- |
| 자극원 | 휴대폰을 쓰는 작성자 |
| 자극 | 예제를 열고, 블록을 넣고, 블록을 선택한다 |
| 환경 | Android의 Chrome, 세로 화면(폭 약 400px), 터치 |
| 대상 | 웹의 좁은 화면 배치와 터치 입력 |
| 응답 | 좁은 화면 배치(☰ 메뉴, 여러 줄의 툴바)로 보이고, 탭으로 끝낸다 |
| 응답 측정 | 위 흐름이 **탭만으로 100% 통과**(문자 입력은 화면 키보드) |

- **아키텍처:** 좁은 화면 배치 → [[05-screen-layout|화면 배치]], [[ux-decisions#MB1. 좁은 화면|MB1]]
- **테스트:** E2E(Playwright의 Android 폰 흉내: 화면 크기 · 터치 · user agent). 실제 휴대폰은 출시 점검표. **실행할 때:** 모든 커밋(흉내), 출시 전(실제 휴대폰)
- **테스트 ID:** `apps/web/e2e/mobile.spec.ts`의 테스트 6개([[08-test-list#^t-apps-web-e2e-mobile-spec-ts|T-0287]] ~ T-0523)

### QA-21 믿을 수 없는 공유 링크

| 부분 | 내용 |
| --- | --- |
| 자극원 | 링크를 만든 누구나(꾸민 사람도) |
| 자극 | 잘리거나 바뀐 공유 링크, 아주 긴 링크, 작게 꾸렸지만 풀면 아주 커지는 링크(zip bomb), 모델이 파일의 규칙을 어기는 링크를 연다 |
| 환경 | 웹. 페이지를 처음 열 때나, 열린 탭의 주소창에 붙여 넣을 때 |
| 대상 | 웹 셸의 공유 링크 읽기(`apps/web/src/files/share-link.ts`)와 모델 파서 |
| 응답 | 링크를 열지 않고 까닭(손상 · 너무 큼 · 더 새 버전 · 이 브라우저가 풀 수 없음)을 알린 뒤 평소처럼 시작한다. 지금 문서는 바뀌지 않는다 |
| 응답 측정 | 편집기가 죽는 경우 **0번**. 1 MB가 넘는 링크는 **풀지 않음**. 푼 크기가 16 MB를 넘는 순간 **멈춤** |

- **아키텍처:** 길이를 먼저 보고, 스트림으로 풀며 크기를 세고, 모델은 파일과 같은 검증 파서를 거친다 → [[0043-share-link-in-fragment|ADR-0043]], [[06-web#3. 공유 URL과 보기 모드]]
- **테스트:** 단위 테스트(잘린 · 바뀐 · 긴 링크, zip bomb, 봉투가 틀린 JSON, 모델 검증 실패)와 E2E(손상된 링크로 페이지를 엶). **실행할 때:** 모든 커밋
- **테스트 ID:** [[08-test-list#^t-apps-web-src-files-share-link-test-ts|T-1140]]

## 3. 테스트 전략

시나리오의 테스트를 종류별로 모으면 다음과 같습니다. 테스트 기반은 MVP 코드와 함께 만들었습니다(속성 기반 테스트 `src/packages/core/src/format/round-trip.test.ts`, 골든 파일 `src/packages/core/golden/`, 의존 규칙 `src/.dependency-cruiser.cjs`, 성능 벤치마크 `src/packages/core/src/render/render.bench.ts`). 표의 "매일 밤" 실행은 아직 없습니다. 도구는 [[0038-build-and-test-tools|ADR-0038]]에서 정했고, 계층마다의 쓰임과 인수 테스트는 [[07-testing]]에 있습니다.

| 테스트 종류 | 시나리오 | 도구 | 실행할 때 |
| --- | --- | --- | --- |
| 속성 기반 테스트 | QA-01, QA-12 | fast-check | 모든 커밋 |
| 퍼징 | QA-02 | fast-check, 깨진 파일 묶음 | 모든 커밋(짧게), 매일 밤 |
| 골든 파일(바이트 비교) | QA-03, QA-04, QA-05, QA-11 | 저장소의 기대 파일 + SHA-256 | 모든 커밋 |
| 시각 회귀 | QA-06 | Playwright 스크린샷 + 픽셀 비교 | 모든 커밋(Chromium), 출시 전 |
| 성능 벤치마크 | QA-07, QA-08 | Vitest bench, Playwright 성능 타임라인 | 모든 커밋(기록), 출시 전(기준 기기) |
| 번들 사이즈 체크 | QA-09 | 빌드 산출물 크기 검사 | 모든 커밋 |
| 정적 분석 | QA-10, QA-13, QA-14 | dependency-cruiser, ESLint, `tsconfig`의 `lib` | 모든 커밋 |
| 계약 테스트 | QA-10, QA-11, QA-17 | 가짜 `DocumentStore`, 렌더링 백엔드 계약 | 모든 커밋 |
| E2E | QA-15, QA-19, QA-20, QA-21 | Playwright(키 입력만, 폰 흉내와 터치) | 모든 커밋(웹), 출시 전 |
| 시작 시간 | QA-18 | Playwright(폰 흉내 + CPU · 네트워크 감속) | 모든 커밋(흉내), 출시 전(실제 휴대폰) |
| 단위 테스트 | QA-16, QA-21 | Vitest | 모든 커밋 |
| 수동 점검표 | QA-03, QA-06 (Obsidian, GitHub, Drive, Safari), QA-18 · QA-20 (실제 휴대폰) | 출시 점검표 | 출시 전 |

## 4. 미결정 사항

> [!question] 미결정
> - 제안값의 확인: QA-01의 명령열 크기, QA-06의 픽셀 차이 1%, QA-07의 기준 기기, QA-08의 1초, QA-09의 300 KB와 3 MB, QA-14의 1분, QA-16의 7:1
> - QA-07: "블록 500개"를 문서의 블록 수로 셀지, 그려지는 블록 수로 셀지
> - 보안과 개인 정보의 시나리오: AI 대화창의 API 키, 광고 스크립트와 한 페이지에 있는 것([[01-requirements#6. 미결정 사항]]). 그 기능들(`P3`)을 설계할 때 추가한다. 공유 링크는 QA-21
