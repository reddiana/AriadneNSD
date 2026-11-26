---
title: 2026-11-27 매듭에서 push를 빼다
tags:
  - session
---

# 2026-11-27 매듭에서 push를 빼다

## 논의 흐름

1. 메인테이너: "앞으로 매듭할 때는 push하지 마세요." → CLAUDE.md의 세션 끝 절과 [[how-we-work]]를 고침(`03196b3`)
2. 커밋이 오래 걸리자 메인테이너: "간단한 요청 아닌가요? 왜 오래 걸지나요?" — 커밋 명령 앞에 `doc-check.py`를 파일 인자로 직접 부른 것이 입력을 기다리며 멈춘 것으로 보임(짐작). 훅으로 저절로 돌므로 앞으로 따로 부르지 않고, 전체 검사는 `--all`로
3. 메인테이너: "지금 훅은 어떤 것들이 있나요?" — 프로젝트 훅은 둘: 명령 전의 `co-change-commit.mjs`, 고친 뒤의 `doc-check.py`(`toast.ps1`은 설정에서 쓰지 않음, git 훅 없음)
4. 매듭: 앞 세션([[2026-11-27-01-zoom-buttons]])이 미룬 확대 · 축소의 정리를 함

## 결정

- 매듭은 커밋까지. push와 전체 검사(`pnpm test-list:strict`, `pnpm check`, `pnpm e2e`)는 마무리 때만. 검사를 마무리로 옮긴 것은 Claude의 판단("push 전에 한 번"이므로) — 매듭 때도 검사를 원하면 다시 정함
- 확대 · 축소 정리: [[ux-decisions#ZM1. 툴바의 확대 · 축소 버튼|ZM1]], [[05-screen-layout]] · [[03-editor]]의 툴바 설명, `dropdown.tsx` 주석

## 남은 일 (마무리 때)

- `pnpm test-list:strict`(T-1510 ~ T-1515 번역), `pnpm check` 전체, `pnpm e2e`(T-0020의 선택자를 바꿈, 아직 돌리지 않음)
- push, 그 뒤 `status`의 확대 · 축소 줄을 "사이트에 있음"으로
