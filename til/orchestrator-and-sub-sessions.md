---
title: 허브와 곁 세션 (orchestrator-workers)
tags:
  - til
updated: 2026-11-28
---

# 허브와 곁 세션 (orchestrator-workers)

## 한 줄 요약

AI 에이전트 여럿을 부릴 때 가장 흔한 구조는 **조율하는 하나(orchestrator)가 일하는 여럿(worker)에게 일을 나눠 주고 결과를 받는 것**이다. 부르는 이름은 여럿이다.

| 이름 | 어디서 쓰나 |
| --- | --- |
| Orchestrator-workers | Anthropic의 글 "Building effective agents". Anthropic의 multi-agent 리서치 시스템도 lead agent 하나가 subagent들에게 나눠 주는 구조 |
| Supervisor | LangGraph 같은 에이전트 프레임워크 |
| Hub-and-spoke | 네트워크 · 시스템 통합에서 온 말로, 모양(토폴로지)을 가리킴 |
| Coordinator · Manager-worker | 일반적인 분산 처리 용어. Claude 프로젝트(베타)의 "코디네이터와 스레드"도 같은 생각 |

worker가 다시 worker를 부리면 **hierarchical(계층형) multi-agent**(LangGraph의 "hierarchical teams")가 된다. 아주 큰 일에는 쓰지만, 보고가 중간에서 막히고 누가 무엇을 하는지 보기 어려워 보통은 한 단을 먼저 쓴다.

## 백엔드로 비유하면

작업 큐의 디스패처와 워커다. 디스패처(허브)는 작업을 나누고 순서를 정하며, 워커(곁 세션)는 받은 일만 하고 결과를 돌려준다. 워커가 마음대로 다른 워커를 띄우면 누가 무엇을 하는지 추적하기 어려워지는 것도 같다. 배포 · 통합 테스트처럼 공유 자원을 쓰는 일은 디스패처가 잠금(lock)을 주듯 허락한다.

## AriadneNSD에서 어디에 쓰나

2026-11-28부터 Claude Code 세션을 이 구조로 쓴다 → [[dr-0023-hub-and-side-sessions|DR-0023]], [[how-we-work#허브와 곁 세션]].

- 메인테이너와 대화하는 세션이 허브(orchestrator), 주제마다 연 세션이 곁 세션(worker).
- 흔한 구조와 다른 점: 보통은 사람이 orchestrator하고만 이야기하지만, 여기서는 메인테이너가 곁 세션에 들어가 시안을 직접 고르기도 한다. "사람이 들어갈 수 있는 worker"를 둔 hub-and-spoke.
- 한 세션 안의 백그라운드 에이전트(subagent)도 같은 구조의 작은 판이다. 결과를 바로 이 대화에서 쓸 짧은 일은 에이전트, 따로 열어 보고 지시할 주제는 곁 세션.

## 더 읽을거리

- Anthropic, "Building effective agents" — Orchestrator-workers 절
- Anthropic, "How we built our multi-agent research system"
- LangGraph 문서의 multi-agent(supervisor, hierarchical teams)
- [[git-worktree]] — 곁 세션이 서로의 파일을 건드리지 않게 하는 법
