#!/usr/bin/env bash
set -euo pipefail

# =============================
# 参数检查
# =============================
APP_NAME="${1:-}"
MODE="${2:-}"

if [ -z "$APP_NAME" ] || [ -z "$MODE" ]; then
    echo "❌ 用法: $0 <app_name> <mode>"
    echo "   示例:"
    echo "     $0 LTS_MESv1 development"
    echo "     $0 MES_ADMIN prod"
    exit 1
fi

# =============================
# 基础路径
# =============================
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
NGINX_DIR="/usr/share/nginx/html"

cd "$PROJECT_DIR"

# =============================
# 版本号 = 当前分支名
# =============================
BRANCH_NAME="$(git rev-parse --abbrev-ref HEAD)"
export VITE_APP_VERSION="$BRANCH_NAME"

echo "📦 应用名称: $APP_NAME"
echo "🏗️ 构建模式: $MODE"
echo "🌿 当前分支: $BRANCH_NAME"

# =============================
# 安装依赖
# =============================
echo "📦 安装依赖..."
pnpm install

# =============================
# 构建
# =============================
echo "🏗️ 构建项目 (mode=$MODE)..."
pnpm build --mode "$MODE"

# =============================
# 构建产物检查
# =============================
if [ ! -d "dist" ]; then
    echo "❌ 构建失败: dist 目录不存在"
    exit 1
fi

# =============================
# 重命名产物
# =============================
rm -rf "$APP_NAME"
mv dist "$APP_NAME"

# =============================
# 部署到 Nginx
# =============================
echo "🚀 部署到 Nginx..."

sudo rm -rf "$NGINX_DIR/$APP_NAME"
sudo mv "$APP_NAME" "$NGINX_DIR/"

echo "✅ 部署完成: $NGINX_DIR/$APP_NAME"
echo "🔖 版本标识: $BRANCH_NAME"
