---
title: git worktree로 나란히 일하기
tags:
  - til
updated: 2026-11-04
---

# git worktree로 나란히 일하기

## 한 줄 요약

**worktree**는 저장소 하나에서 작업 폴더를 여러 개 꺼내 쓰는 것이다. 폴더마다 다른 브랜치를 꺼내 두므로, 에이전트 여럿이 서로의 고치던 파일을 건드리지 않고 나란히 일할 수 있다.

## 왜 필요했나

2026-11-03 밤, 웹의 `P1` 기능 다섯 묶음을 에이전트 다섯이 나란히 만들었다(→ [[2026-11-03-06-agents-bugs-locale-extract#매듭 뒤 (2026-11-03 밤 ~ 11-04)]]). 묶음 하나가 레인 하나다(레인(lane): 나란히 가는 작업 줄). 그 전 세션에서는 에이전트 여럿이 한 폴더에서 일하다 한 쪽의 커밋이 다른 쪽의 고치던 파일까지 담은 일이 있었다. 폴더를 나누면 이런 일이 생기지 않는다.

## 어떻게 생겼나

`.git`(기록)은 하나이고, 작업 폴더만 여럿이다. 커밋은 모두 같은 기록에 쌓이므로 다른 worktree의 브랜치를 바로 합칠 수 있다. 다시 clone할 필요가 없고 디스크도 덜 든다.

```text
C:/myProject/AriadneNSD                          main
C:/myProject/AriadneNSD/.claude/worktrees/agent-a…  worktree-agent-a…  (레인 1)
C:/myProject/AriadneNSD/.claude/worktrees/agent-b…  worktree-agent-b…  (레인 2)
```

## 자주 쓰는 명령

| 하는 일 | 명령 |
| --- | --- |
| 새 브랜치로 worktree 만들기 | `git worktree add -b lane-1 ../lane-1 main` |
| 목록 보기 | `git worktree list` |
| 다 쓴 worktree 지우기 | `git worktree remove ../lane-1` (그 뒤 `git branch -d lane-1`) |
| 폴더를 손으로 지운 뒤 기록 정리 | `git worktree prune` |

- 한 브랜치는 한 worktree에서만 꺼낼 수 있다. `main`을 두 폴더에서 동시에 꺼내지 못한다.
- `locked`로 보이는 worktree는 쓰는 쪽(여기서는 Claude Code)이 지우지 말라고 잠가 둔 것이다. 일이 끝났는지 확인하고 `git worktree unlock`한 뒤 지운다.
- 폴더는 나뉘어도 **컴퓨터는 하나**다. 포트(테스트 서버), 다음 ADR 번호, 테스트 ID처럼 폴더 밖에서 하나뿐인 것은 여전히 부딪친다. 처음 지시에서 나눠 준다.

## 합치는 쪽

레인마다 끝나면 합치는 에이전트(integrator) 하나가 차례로 `main`에 합치고, 겹친 번호를 다시 매기고, 전체 검사(`pnpm check`, `pnpm e2e`)를 돌린 뒤 push했다. 합치는 쪽이 하나라서 `main`은 늘 검사를 통과한 모습이다.
