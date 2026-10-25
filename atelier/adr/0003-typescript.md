---
title: "ADR-0003: 구현 언어 TypeScript"
tags:
  - adr
status: 승인
date: 2026-10-07
supersedes:
superseded-by:
---

# ADR-0003: 구현 언어 TypeScript

> [!NOTE] 이후 변경
> - 2026-10-25: IDE 플러그인이 대상이 되어(2026-10-14) IntelliJ 셸의 호스트 쪽은 TypeScript 밖일 수 있다(웹뷰 안의 편집기는 그대로 TypeScript) → [[01-requirements#2.7 IDE 플러그인 (나중에)]], [[0036-code-layout|ADR-0036]]
> - 2026-10-22: 용어를 SW 엔지니어의 말로 고쳤다(뜻은 그대로). → [[03-architecture]]

## 배경

[[0002-three-targets-shared-core|ADR-0002]]에 따라 세 대상이 코어와 편집 UI를 공유한다. 세 대상 중 Obsidian 플러그인은 JavaScript로만 만들 수 있다.

## 결정 기준

- Obsidian 플러그인에서 실행 가능해야 한다.
- 웹(정적 사이트)과 데스크톱에서도 같은 코드가 돌아야 한다.
- 트리 모델의 불변식을 타입 시스템으로 최대한 표현할 수 있어야 한다.

## 검토한 대안

### JavaScript

- 장점: 빌드 단계가 단순
- 단점: 노드 타입이 많은 트리 모델에서 타입 오류를 잡기 어려움

### TypeScript

- 장점: Obsidian 플러그인 공식 개발 언어, 노드 타입을 판별 유니온(discriminated union)으로 표현 가능
- 단점: 빌드 설정 필요

### 다른 언어 + WebAssembly (Rust 등)

- 장점: 성능
- 단점: 편집 UI는 결국 웹 기술이 필요해 두 언어를 관리해야 함, 이 규모에서는 성능 이점이 작음

## 결정

모든 패키지와 앱을 **TypeScript**로 작성한다.

## 결과

- 좋아지는 점: 한 언어로 전체를 관리, 모델 타입을 컴파일 타임에 검사
- 감수하는 점: 데스크톱도 웹 기술 기반 프레임워크로 제한됨 → [[0009-desktop-framework|ADR-0009]]
