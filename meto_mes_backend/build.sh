#!/bin/bash
# =============================================================
# 🧱 MES 后端多环境打包脚本
# 用法:
#   ./build.sh [my|sz|ja|prod] [版本号] [输出目录]
#
# 示例:
#   ./build.sh my 1.2.0          # 打包绵阳环境
#   ./build.sh sz 1.2.0 ./dist   # 打包苏州环境到指定目录
#   ./build.sh ja 1.2.0          # 打包吉安环境
#   ./build.sh prod 1.2.0        # 打包默认生产环境
# =============================================================

# ---------- 帮助 ----------
if [[ "$1" == "-h" || "$1" == "--help" || -z "$1" ]]; then
  echo "🧱 MES 后端多环境打包脚本"
  echo ""
  echo "用法:"
  echo "  $0 <环境> [版本号] [输出目录]"
  echo ""
  echo "参数说明:"
  echo "  <环境>        部署环境: my(绵阳) | sz(苏州) | ja(吉安) | prod(默认)"
  echo "  [版本号]      写入 BACKEND_VERSION，默认: git describe (或 v1.0.0)"
  echo "  [输出目录]    默认: ./output"
  echo ""
  echo "示例:"
  echo "  $0 my 1.2.0          # 打包绵阳环境"
  echo "  $0 sz 1.2.0          # 打包苏州环境"
  echo "  $0 ja 1.2.0          # 打包吉安环境"
  echo "  $0 prod 1.2.0        # 打包默认生产环境"
  exit 0
fi

# ---------- 参数解析 ----------
ENV=$1

# 获取 Git 版本号
if command -v git &> /dev/null && [ -d ".git" ]; then
  GIT_VERSION=$(git describe --tags --always --dirty 2>/dev/null || echo "")
  if [ -z "$GIT_VERSION" ]; then
    # 如果没有 tag,使用短 commit hash
    GIT_VERSION=$(git rev-parse --short HEAD 2>/dev/null || echo "v1.0.0")
  fi
  DEFAULT_VERSION="$GIT_VERSION"
else
  DEFAULT_VERSION="v1.0.0"
fi

VERSION=${2:-"$DEFAULT_VERSION"}
OUTPUT_DIR=${3:-"./output"}
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# 根据环境选择配置文件
case $ENV in
  my|MY)
    ENV_FILE=".env.production.MY"
    ENV_NAME="MY"
    ENV_DESC="绵阳"
    ;;
  sz|SZ)
    ENV_FILE=".env.production.SZ"
    ENV_NAME="SZ"
    ENV_DESC="苏州"
    ;;
  ja|JA)
    ENV_FILE=".env.production.JA"
    ENV_NAME="JA"
    ENV_DESC="吉安"
    ;;
  prod|production)
    ENV_FILE=".env.production"
    ENV_NAME="PROD"
    ENV_DESC="默认生产"
    ;;
  *)
    echo "❌ 未知环境: $ENV"
    echo "可用环境: my(绵阳) | sz(苏州) | ja(吉安) | prod(默认)"
    exit 1
    ;;
esac

PACKAGE_NAME="mes_backend_${ENV_NAME}_${VERSION}_${TIMESTAMP}"
ARCHIVE_NAME="mes_backend_${ENV_NAME}_${VERSION}"

echo "====================================================="
echo "🌍 打包环境: $ENV_DESC ($ENV_NAME)"
echo "📝 配置文件: $ENV_FILE"
echo "📌 版本号: $VERSION"
echo "💾 输出目录: $OUTPUT_DIR"
echo "📦 打包名称: $ARCHIVE_NAME.tar.gz"
echo "====================================================="
echo ""

# ---------- 检查配置文件 ----------
if [ ! -f "$ENV_FILE" ]; then
  echo "❌ 配置文件不存在: $ENV_FILE"
  exit 1
fi
echo "✅ 配置文件检查通过: $ENV_FILE"
echo ""

# ---------- 写入版本号 ----------
echo "📝 写入 BACKEND_VERSION=$VERSION 到 $ENV_FILE"

# 创建临时环境文件副本
cp "$ENV_FILE" "${ENV_FILE}.tmp"

# macOS 与 Linux sed 自动适配
if [[ "$OSTYPE" == "darwin"* ]]; then
  sed -i '' '/^BACKEND_VERSION=/d' "${ENV_FILE}.tmp"
else
  sed -i '/^BACKEND_VERSION=/d' "${ENV_FILE}.tmp"
fi

echo "BACKEND_VERSION=$VERSION" >> "${ENV_FILE}.tmp"
echo "✅ 版本号已写入"
echo ""

# ---------- 加载环境 ----------
echo "🌍 加载环境配置..."
[ -f "${ENV_FILE}.tmp" ] && { echo "📄 加载 ${ENV_FILE}.tmp"; set -a; source "${ENV_FILE}.tmp"; set +a; }
echo ""

# ---------- 步骤 1: 安装依赖 ----------
echo "🚀 [1/5] 安装依赖..."
if [ -f "pnpm-lock.yaml" ]; then
  pnpm install || { echo "❌ pnpm install 失败"; exit 1; }
elif [ -f "yarn.lock" ]; then
  yarn install || { echo "❌ yarn install 失败"; exit 1; }
else
  npm install || { echo "❌ npm install 失败"; exit 1; }
fi
echo "✅ 依赖安装完成"
echo ""

# ---------- 步骤 2: 生成 Prisma Client ----------
echo "🔧 [2/5] 生成 Prisma Client..."
npx prisma generate || { echo "❌ Prisma 生成失败"; exit 1; }
echo "✅ Prisma Client 生成完成"
echo ""

# ---------- 步骤 3: 构建项目 ----------
echo "🏗️ [3/5] 构建项目..."
npm run build || { echo "❌ 项目构建失败"; exit 1; }
echo "✅ 项目构建完成"
echo ""

# ---------- 步骤 4: 打包输出 ----------
echo "📦 [4/5] 打包输出..."
mkdir -p "$OUTPUT_DIR"

TEMP_DIR="${OUTPUT_DIR}/${PACKAGE_NAME}_tmp"
mkdir -p "$TEMP_DIR"

# 复制编译后的代码
if [ -d "dist" ]; then
  echo "   复制编译结果..."
  cp -r dist "$TEMP_DIR/"
else
  echo "❌ 未找到 dist 目录，构建可能失败"
  exit 1
fi

# 复制 node_modules (生产依赖)
echo "   复制生产依赖..."
cp -r node_modules "$TEMP_DIR/"

# 复制 Prisma 相关文件
if [ -d "prisma" ]; then
  echo "   复制 Prisma schema..."
  cp -r prisma "$TEMP_DIR/"
fi

# 复制必要的配置和脚本
echo "   复制配置文件和脚本..."
[ -d "script" ] && cp -r script "$TEMP_DIR/"
[ -f "package.json" ] && cp package.json "$TEMP_DIR/"
[ -f "start.sh" ] && cp start.sh "$TEMP_DIR/"
[ -f "stop.sh" ] && cp stop.sh "$TEMP_DIR/"

# 复制对应环境的配置文件
cp "${ENV_FILE}.tmp" "$TEMP_DIR/.env"
echo "   配置文件已复制为 .env"

# 清理临时环境文件
rm -f "${ENV_FILE}.tmp"

# 压缩打包
echo "   压缩打包..."
tar -czf "${OUTPUT_DIR}/${ARCHIVE_NAME}.tar.gz" -C "$OUTPUT_DIR" "$(basename "$TEMP_DIR")" || {
  echo "❌ 压缩失败"; rm -rf "$TEMP_DIR"; exit 1;
}
rm -rf "$TEMP_DIR"

echo "✅ 打包完成"
echo ""

# ---------- 步骤 5: 完成 ----------
FINAL_PATH="$(cd "$OUTPUT_DIR" && pwd)/${ARCHIVE_NAME}.tar.gz"
FILE_SIZE=$(du -h "$FINAL_PATH" | cut -f1)

echo "====================================================="
echo "✅ [5/5] 打包完成!"
echo "====================================================="
echo "📦 文件名称: ${ARCHIVE_NAME}.tar.gz"
echo "💾 文件大小: $FILE_SIZE"
echo "📂 保存路径: $FINAL_PATH"
echo "🌍 部署环境: $ENV_DESC ($ENV_NAME)"
echo "📌 版本号: $VERSION"
echo "====================================================="
echo ""
echo "📌 部署说明:"
echo "  1. 上传文件到目标服务器"
echo "  2. 解压: tar -xzf ${ARCHIVE_NAME}.tar.gz"
echo "  3. 进入目录: cd mes_backend_${ENV_NAME}_${VERSION}_*"
echo "  4. 启动服务: npm run start:prod"
echo "  或使用: ./start.sh prod"
echo "====================================================="

