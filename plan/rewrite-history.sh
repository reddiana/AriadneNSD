#!/bin/sh
# git 기록 전체에서 inbox 사진 9장과 옛 로고 그림을 지운다. (2026-10-11에 메인테이너가 정함)
#
# 되돌릴 수 없는 일이라 메인테이너가 직접 실행한다. Claude Code의 안전장치는 Claude가
# 이 일을 하는 것을 막는다. Claude Code의 프롬프트에서:
#
#   ! sh plan/rewrite-history.sh
#
# 실행하면 2026-10-10의 "inbox: 메인테이너가 더한 원문과 그림 보존" 커밋부터 뒤의
# 모든 커밋 해시가 바뀐다. 끝난 뒤에는 이 파일을 지워도 된다.
set -e
cd "$(git rev-parse --show-toplevel)"
S="${TMPDIR:-/tmp}/ariadne-nsd-rewrite"
FILES="journal/assets/2026-10-10-logo-aegean-lady.svg journal/assets/2026-10-10-logo-aegean-lady-tiny.svg journal/assets/2026-10-10-logo-aegean-lady-rounded.svg journal/assets/2026-10-10-logo-concepts.html"

# 0. 커밋하지 않은 변경이 있으면 멈춘다
test -z "$(git status --porcelain)" || { echo "커밋하지 않은 변경이 있습니다. 멈춥니다."; exit 1; }

# 1. 백업 (저장소 밖 임시 폴더. 잘못되면 여기서 되살린다. 사진이 들어 있으니 확인 뒤 지운다)
mkdir -p "$S/keep"
git bundle create "$S/backup-before-rewrite.bundle" main
for f in $FILES; do cp "$f" "$S/keep/"; done
echo "백업: $S"

# 2. 모든 커밋에서 사진과 로고 그림 네 파일을 뺀다
FILTER_BRANCH_SQUELCH_WARNING=1 git filter-branch -f --index-filter \
  "git rm --cached --ignore-unmatch -q -- 'Pasted image *.png' $FILES" -- main

# 3. 지금의 로고 그림(CC0 사진에서 뽑은 것)과 시안 페이지를 다시 넣는다
for f in $FILES; do cp "$S/keep/$(basename "$f")" "$f"; done
git add $FILES
git commit -q -m "로고 그림과 시안 페이지를 다시 넣음 (기록에서 옛 판을 지운 뒤 지금 판만)"

# 4. 옛 기록의 흔적을 로컬에서 치운다
git for-each-ref --format='%(refname)' refs/original/ | while read r; do git update-ref -d "$r"; done
git reflog expire --expire=now --all
git gc -q --prune=now

# 5. 확인: 기록 어디에도 사진이 없어야 한다
if git log --all --name-only --format= | grep -q "Pasted image"; then
  echo "아직 기록에 사진이 남아 있습니다. push하지 않고 멈춥니다."; exit 1
fi
echo "기록에서 사진이 사라졌습니다. 커밋 수: $(git rev-list --count main)"

# 6. GitHub의 기록을 바꿔 쓴다
git push --force-with-lease origin main
git status -sb
echo "끝났습니다. 백업($S)은 확인한 뒤 지우세요."
