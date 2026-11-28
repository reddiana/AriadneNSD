---
name: vault
description: 분신(서브 세션)의 worktree를 Obsidian 보관함으로 등록해 열거나, 등록을 뺀다. 메인테이너가 "/vault <분신 이름 일부>", "○○ 분신 옵시디언으로 열어 줘", "보관함으로 열어", "/vault 닫기"라고 할 때, 그리고 분신의 브랜치를 merge하거나 분신을 보관한 뒤에 쓴다. 본체(메인테이너와 대화하는 세션)용.
---

# vault

Obsidian은 점(.)으로 시작하는 폴더를 보여 주지 않아, 분신이 `.claude/worktrees/<폴더>/`에서 고친 md를 보관함에서 볼 수 없다. 스크립트 `.claude/scripts/open-worktree-vault.ps1`이 worktree를 보관함으로 등록한다. 이 스킬은 본체가 그 스크립트를 대신 부르는 절차다.

## 열기

"/vault <분신 이름 일부>", "○○ 분신 옵시디언으로 열어 줘", "보관함으로 열어" 등의 요청에 쓴다.

1. `mcp__ccd_session_mgmt__list_sessions`에 `{"linked": true}`를 주어 분신의 이름 · 제목 · 폴더를 얻는다(지연 로드면 ToolSearch로 먼저 불러온다).
2. 이름이 맞는 분신의 worktree 폴더 이름을 찾는다. 이름이 없거나 여럿이 맞으면 목록을 보여 주고 고르게 한다. 분신이 하나뿐이면 그것을 쓴다.
3. 저장소 루트에서 실행한다: `pwsh -NoProfile -File .claude/scripts/open-worktree-vault.ps1 <폴더 이름>`
4. 결과를 한두 줄로 알린다. 예: "경로를 클립보드에 넣었습니다. Obsidian의 보관함 전환기 → Open folder as vault에 붙여넣으세요." 이미 등록되어 열린 적이 있으면 보관함 전환기에서 그 이름을 고르라고 안내한다.

Obsidian이 켜져 있으면 URI로 바로 열 수 없다(없는 보관함이라는 오류 창이 뜸). 스크립트가 이를 알아서 처리해 경로만 클립보드에 넣는다.

## 닫기

본체가 분신의 브랜치를 merge하거나 분신이 보관되면, 묻지 않고 `pwsh -NoProfile -File .claude/scripts/open-worktree-vault.ps1 -Remove <폴더 이름>`을 실행한다. 폴더가 이미 지워졌으면 인자 없는 `-Remove`로 사라진 등록을 모두 정리한다. 메인테이너가 "/vault 닫기"라고 해도 같다.
