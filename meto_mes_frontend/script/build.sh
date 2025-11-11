#!/bin/bash
# --------------------------------------------
# 前端打包脚本
# 用法: ./build_frontend.sh <项目路径> [打包名] [压缩名]
# 示例:
#   ./build_frontend.sh ./frontend
#   ./build_frontend.sh ./frontend mes_frontend
#   ./build_frontend.sh ./frontend mes_frontend mes_frontend_release
# --------------------------------------------

if [[ "$1" == "-h" || "$1" == "--help" ]]; then
  echo "🧩 用法: $0 <项目路径> [打包名] [压缩名]"
  echo "示例:"
  echo "  $0 ./frontend"
  echo "  $0 ./frontend mes_frontend"
  echo "  $0 ./frontend mes_frontend mes_frontend_release"
  echo "说明:"
  echo "  - 若未指定打包名，默认: frontend_YYYYMMDD_HHMM"
  echo "  - 若未指定压缩名，则与打包名一致"
  echo "  - 可通过环境变量 BUILD_CMD 自定义构建命令，如："
  echo "      BUILD_CMD='npm run build:prod' $0 ./frontend"
  exit 0
fi

PROJECT_PATH=$1
PACKAGE_NAME=${2:-frontend_$(date +%Y%m%d_%H%M)}
ARCHIVE_NAME=${3:-$PACKAGE_NAME}
OUTPUT_DIR=${4:-"."}

if [ -z "$PROJECT_PATH" ]; then
  echo "❌ 缺少项目路径。使用 -h 查看帮助。"
  exit 1
fi

cd "$PROJECT_PATH" || { echo "❌ 无法进入目录: $PROJECT_PATH"; exit 1; }

# 默认构建命令
BUILD_CMD=${BUILD_CMD:-"pnpm build"}

echo "🚀 [1/4] 安装依赖..."
pnpm install

# 如果没有指定 BUILD_ENV，默认使用 production
BUILD_ENV=${BUILD_ENV:-production}

echo "🏗 [2/4] 构建前端..."
echo "⚙ 使用构建环境: $BUILD_ENV"
echo "⚙ 实际命令: pnpm build --mode $BUILD_ENV"

pnpm build --mode "$BUILD_ENV" || { echo "❌ 构建失败"; exit 1; }

BUILD_DIR=""
for dir in dist build out; do
  if [ -d "$dir" ]; then
    BUILD_DIR=$dir
    break
  fi
done

if [ -z "$BUILD_DIR" ]; then
  echo "❌ 未找到构建输出目录"
  exit 1
fi

echo "📦 [3/4] 压缩输出..."

# 临时改名：例如 dist → mes_frontend
mv "$BUILD_DIR" "$PACKAGE_NAME"

# 压缩打包
tar -czf "${OUTPUT_DIR}/${ARCHIVE_NAME}.tar.gz" "$PACKAGE_NAME"

# 压缩完后删除临时目录
rm -rf "$PACKAGE_NAME"

echo "✅ [4/4] 前端打包完成: ${ARCHIVE_NAME}.tar.gz"
