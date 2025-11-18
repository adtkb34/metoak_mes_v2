#!/bin/bash

PROJECT_PATH=$1
PACKAGE_NAME=${2:-frontend_$(date +%Y%m%d_%H%M)}
ARCHIVE_NAME=${3:-$PACKAGE_NAME}
VERSION=$4
USER_ENV_FILE=$5   # 用户手动指定的 env 文件名

if [ -z "$PROJECT_PATH" ]; then
  echo "❌ 缺少项目路径。使用 -h 查看帮助。"
  exit 1
fi

cd "$PROJECT_PATH" || { echo "❌ 无法进入目录: $PROJECT_PATH"; exit 1; }

echo "🔍 正在自动扫描项目根目录的环境配置文件..."

# 扫描 .env.xxx 文件
FOUND_ENV_FILES=($(ls -1 .env.* 2>/dev/null))

if [ ${#FOUND_ENV_FILES[@]} -eq 0 ]; then
  echo "❌ 未找到任何 .env.* 文件，请检查项目结构"
  exit 1
fi

# -------------------------
# 自动选择 env 文件
# -------------------------
if [ -n "$USER_ENV_FILE" ]; then
  # 用户有指定
  ENV_FILE="$USER_ENV_FILE"
  if [ ! -f "$ENV_FILE" ]; then
    echo "❌ 指定的 env 文件不存在: $ENV_FILE"
    exit 1
  fi
else
  # 自动选择
  PRIORITY_LIST=(
    ".env.production"
    ".env.staging"
    ".env.test"
    ".env.local"
  )

  ENV_FILE=""  
  for p in "${PRIORITY_LIST[@]}"; do
    if [ -f "$p" ]; then
      ENV_FILE="$p"
      break
    fi
  done

  # 如果优先级里没有，挑第一个文件
  if [ -z "$ENV_FILE" ]; then
    ENV_FILE="${FOUND_ENV_FILES[0]}"
  fi
fi

if [ -n "$VERSION" ]; then
  echo "📝 写入/更新版本号到 $ENV_FILE: VERSION=$VERSION"

  if [ ! -f "$ENV_FILE" ]; then
    echo "⚠️ 未找到 $ENV_FILE，自动创建"
    touch "$ENV_FILE"
  fi

  # 删除旧的 VERSION 行
  sed -i '' '/^VERSION=/d' "$ENV_FILE"

  # 添加新版本号
  echo "VERSION=$VERSION" >> "$ENV_FILE"
fi


echo "📌 选择的环境文件: $ENV_FILE"

# 提取 mode 名字
MODE=$(echo "$ENV_FILE" | sed 's/\.env\.//')

echo "🔧 使用构建模式 --mode $MODE"

# -------------------------
# 构建命令
# -------------------------
BUILD_CMD="pnpm build --mode $MODE"

echo "🏗️ 执行构建命令: $BUILD_CMD"
eval "$BUILD_CMD" || { echo "❌ 构建失败"; exit 1; }

# -------------------------
# 查找构建输出目录
# -------------------------
BUILD_DIR=""
for dir in dist build out; do
  if [ -d "$dir" ]; then
    BUILD_DIR="$dir"
    break
  fi
done

if [ -z "$BUILD_DIR" ]; then
  echo "❌ 构建输出目录未找到"
  exit 1
fi

echo "📦 压缩输出目录..."

mv "$BUILD_DIR" "$PACKAGE_NAME"
tar -czf "${ARCHIVE_NAME}.tar.gz" "$PACKAGE_NAME"
rm -rf "$PACKAGE_NAME"

echo "✅ 打包完成: ${ARCHIVE_NAME}.tar.gz"



