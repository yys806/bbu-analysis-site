#!/usr/bin/env bash
set -euo pipefail

BRANCH="${1:-main}"
PUBLISH_DIR="${2:-.}"

command -v git >/dev/null 2>&1 || { echo "缺少命令: git"; exit 1; }
command -v netlify >/dev/null 2>&1 || { echo "缺少命令: netlify"; exit 1; }

git rev-parse --is-inside-work-tree >/dev/null 2>&1 || { echo "当前目录不是 Git 仓库"; exit 1; }

if [ -z "$(git remote)" ]; then
  echo "未配置 Git 远程仓库，请先关联 GitHub"
  exit 1
fi

echo "[1/3] 推送 GitHub..."
git push origin "$BRANCH"

echo "[2/3] 检查 Netlify 登录状态..."
netlify status >/dev/null

echo "[3/3] 部署到 Netlify 生产环境..."
netlify deploy --prod --dir "$PUBLISH_DIR"

SHA="$(git rev-parse --short HEAD)"
echo "发布完成。分支: $BRANCH, 提交: $SHA"
