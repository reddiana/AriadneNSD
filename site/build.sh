#!/usr/bin/env bash
# 설계 문서 사이트를 로컬에서 빌드한다. GitHub Actions(.github/workflows/pages.yml)와 같은 순서다.
#
# 쓰는 법 (저장소 맨 위에서, Git Bash):
#   bash site/build.sh            # 빌드만. 결과는 <작업 폴더>/public, 웹 앱은 그 안의 app/
#   bash site/build.sh --serve    # 문서만 빌드하고 http://localhost:8080 에서 보기 (웹 앱은 빠진다)
#
# 작업 폴더는 QUARTZ_DIR로 바꿀 수 있다. 기본은 site/.quartz (git이 무시함).
# 처음 한 번은 Quartz를 받고 npm 패키지를 설치하느라 1~2분 걸린다. Node 22 이상이 필요하다.
# 웹 앱(src/apps/web)을 빌드하려면 Node 24 이상과 pnpm이 필요하다. 문서만 빌드하려면 SKIP_APP=1.
# --serve는 Quartz가 public을 다시 쓰며 띄우므로 웹 앱을 넣지 않는다. 앱은 따로:
#   (cd src && pnpm dev)
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

node "$REPO/site/patch-quartz.mjs" "$QUARTZ_DIR"
cp "$REPO/site/quartz.config.ts" "$REPO/site/quartz.layout.ts" "$QUARTZ_DIR/"
cp "$REPO/site/custom.scss" "$QUARTZ_DIR/quartz/styles/custom.scss"
cp "$REPO/site/icon.png" "$QUARTZ_DIR/quartz/static/icon.png"   # 탭 아이콘 (site/make-icon.mjs로 만듦)
cp "$REPO/site/og-image.png" "$QUARTZ_DIR/quartz/static/og-image.png"   # 링크 공유의 대표 그림 (site/make-og-image.mjs로 만듦)
node "$REPO/site/prepare-content.mjs" "$REPO" "$QUARTZ_DIR/content"

cd "$QUARTZ_DIR"
if [ "${1:-}" = "--serve" ]; then
  npx quartz build --serve
else
  npx quartz build
  # 웹 앱을 사이트의 /app/에 넣는다 (pages.yml과 같게)
  if [ "${SKIP_APP:-}" != "1" ]; then
    (cd "$REPO/src" && pnpm install --frozen-lockfile && pnpm --filter @ariadne-nsd/web build)
    mkdir -p "$QUARTZ_DIR/public/app"
    cp -r "$REPO/src/apps/web/dist/." "$QUARTZ_DIR/public/app/"
  fi
  echo "결과: $QUARTZ_DIR/public"
fi
