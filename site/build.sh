#!/usr/bin/env bash
# 설계 문서 사이트를 로컬에서 빌드한다. GitHub Actions(.github/workflows/pages.yml)와 같은 순서다.
#
# 쓰는 법 (저장소 맨 위에서, Git Bash):
#   bash site/build.sh            # 빌드만. 결과는 <작업 폴더>/public
#   bash site/build.sh --serve    # 빌드하고 http://localhost:8080 에서 보기
#
# 작업 폴더는 QUARTZ_DIR로 바꿀 수 있다. 기본은 site/.quartz (git이 무시함).
# 처음 한 번은 Quartz를 받고 npm 패키지를 설치하느라 1~2분 걸린다. Node 22 이상이 필요하다.
set -euo pipefail

QUARTZ_TAG="v4.5.2"   # pages.yml의 QUARTZ_TAG와 같게 둔다
REPO="$(cd "$(dirname "$0")/.." && pwd)"
QUARTZ_DIR="${QUARTZ_DIR:-$REPO/site/.quartz}"

if [ ! -d "$QUARTZ_DIR/.git" ]; then
  git clone --quiet --depth 1 --branch "$QUARTZ_TAG" https://github.com/jackyzha0/quartz.git "$QUARTZ_DIR"
fi
if [ ! -d "$QUARTZ_DIR/node_modules" ]; then
  (cd "$QUARTZ_DIR" && npm ci --no-audit --no-fund)
fi

cp "$REPO/site/quartz.config.ts" "$REPO/site/quartz.layout.ts" "$QUARTZ_DIR/"
cp "$REPO/site/custom.scss" "$QUARTZ_DIR/quartz/styles/custom.scss"
node "$REPO/site/prepare-content.mjs" "$REPO" "$QUARTZ_DIR/content"

cd "$QUARTZ_DIR"
if [ "${1:-}" = "--serve" ]; then
  npx quartz build --serve
else
  npx quartz build
  echo "결과: $QUARTZ_DIR/public"
fi
