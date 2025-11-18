#!/bin/bash
# =============================================================
# 🧱 Node 后端打包脚本（支持版本写入与多环境）
# 用法:
#   ./build.sh <项目路径> [打包名] [压缩名] [输出目录] [版本] [env文件名]
#
# 示例:
#   ./build.sh ./backend "" "" "" 1.2.8 .env.production
# =============================================================

# ---------- 帮助 ----------
if [[ "$1" == "-h" || "$1" == "--help" ]]; then
  echo "🧱 Node 后端打包脚本（增强版）"
  echo ""
  echo "用法:"
  echo "  $0 <项目路径> [打包名] [压缩名] [输出目录] [版本] [env文件名]"
  echo ""
  echo "参数说明:"
  echo "  <项目路径>    Node 项目的根目录"
  echo "  [打包名]      默认: node_backend_YYYYMMDD_HHMM"
  echo "  [压缩名]      默认: 打包名"
  echo "  [输出目录]    默认: dist"
  echo "  [版本]        写入 env 文件，变量名: BACKEND_VERSION"
  echo "  [env文件名]   默认: .env.production"
  echo ""
  echo "示例:"
  echo "  $0 ./backend '' '' '' 1.2.9 .env.staging"
  exit 0
fi

# ---------- 参数 ----------
PROJECT_PATH=$1
PACKAGE_NAME=${2:-node_backend_$(date +%Y%m%d_%H%M)}
ARCHIVE_NAME=${3:-$PACKAGE_NAME}
OUTPUT_DIR=${4:-dist}
VERSION=$5
ENV_FILE=${6:-".env.production"}

# ---------- 校验 ----------
if [ -z "$PROJECT_PATH" ]; then
  echo "❌ 缺少项目路径。使用 -h 查看帮助。"
  exit 1
fi
if [ ! -d "$PROJECT_PATH" ]; then
  echo "❌ 无效的路径: $PROJECT_PATH"
  exit 1
fi
cd "$PROJECT_PATH" || { echo "❌ 无法进入目录: $PROJECT_PATH"; exit 1; }

# ---------- 写入版本号 ----------
if [ -n "$VERSION" ]; then
  echo "📝 写入 BACKEND_VERSION=$VERSION 到 $ENV_FILE"

  # 检查 env 文件，不存在则创建
  if [ ! -f "$ENV_FILE" ]; then
    echo "⚠️ 未找到 $ENV_FILE，自动创建"
    touch "$ENV_FILE"
  fi

  # macOS 与 Linux sed 自动适配
  if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' '/^BACKEND_VERSION=/d' "$ENV_FILE"
  else
    sed -i '/^BACKEND_VERSION=/d' "$ENV_FILE"
  fi

  echo "BACKEND_VERSION=$VERSION" >> "$ENV_FILE"
fi

# ---------- 加载环境 ----------
echo "🌍 构建环境: $BUILD_ENV"
[ -f ".env" ] && { echo "📄 加载 .env"; set -a; source .env; set +a; }
[ -f "$ENV_FILE" ] && { echo "📄 加载 $ENV_FILE"; set -a; source "$ENV_FILE"; set +a; }

# ---------- 步骤 1: 安装依赖 ----------
echo "🚀 [1/4] 安装依赖..."
if [ -f "pnpm-lock.yaml" ]; then
  pnpm install || { echo "❌ pnpm install 失败"; exit 1; }
elif [ -f "yarn.lock" ]; then
  yarn install || { echo "❌ yarn install 失败"; exit 1; }
else
  npm install || { echo "❌ npm install 失败"; exit 1; }
fi

pnpm prisma generate

# ---------- 步骤 2: 构建项目 ----------
echo "🏗️ [2/4] 构建项目..."
if [ -f "tsconfig.json" ]; then
  NODE_ENV="$BUILD_ENV" npx tsc || { echo "⚠️ TypeScript 编译失败，继续尝试打包"; }
else
  echo "ℹ️ 无 tsconfig.json，跳过 TypeScript 编译。"
fi

# ---------- 步骤 3: 打包输出 ----------
echo "📦 [3/4] 打包输出..."
mkdir -p "$OUTPUT_DIR"

TEMP_DIR="${OUTPUT_DIR}/${PACKAGE_NAME}_tmp"
mkdir -p "$TEMP_DIR"

# 默认复制 dist 或 build 目录
if [ -d "dist" ]; then
  cp -r dist/* "$TEMP_DIR/"
elif [ -d "build" ]; then
  cp -r build/* "$TEMP_DIR/"
else
  echo "⚠️ 未找到 dist 或 build 目录，复制源代码"
  cp -r . "$TEMP_DIR/"
fi

# 附带脚本/配置
[ -d "script" ] && cp -r script "$TEMP_DIR/"
[ -f "start.sh" ] && cp start.sh "$TEMP_DIR/"
[ -f "$ENV_FILE" ] && cp "$ENV_FILE" "$TEMP_DIR/"

tar -czf "${OUTPUT_DIR}/${ARCHIVE_NAME}.tar.gz" -C "$OUTPUT_DIR" "$(basename "$TEMP_DIR")" || {
  echo "❌ 压缩失败"; rm -rf "$TEMP_DIR"; exit 1;
}
rm -rf "$TEMP_DIR"

# ---------- 步骤 4: 完成 ----------
echo "✅ [4/4] Node 后端打包完成: $(realpath ${OUTPUT_DIR}/${ARCHIVE_NAME}.tar.gz)"

