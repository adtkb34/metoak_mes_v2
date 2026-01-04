#!/bin/bash
# =============================================================
# 🚀 MES 后端环境启动脚本
# 用法: ./start.sh [dev|test|prod|prod:my|prod:sz|prod:ja]
# =============================================================

ENV=${1:-dev}

# =============================================================
# 停止已有服务
# =============================================================
stop_existing_services() {
  echo "🛑 检查并停止已有服务..."
  
  # 方法1: 停止所有 nest/node 相关进程
  if pgrep -f "nest start" > /dev/null; then
    echo "   发现 NestJS 进程，正在停止..."
    pkill -f "nest start"
    sleep 1
  fi
  
  if pgrep -f "node dist/main" > /dev/null; then
    echo "   发现 Node 生产进程，正在停止..."
    pkill -f "node dist/main"
    sleep 1
  fi
  
  # 方法2: 释放 3000 端口 (从 .env 文件读取端口号)
  PORT=${PORT:-3000}
  if [ -f .env ]; then
    source .env
  fi
  PORT=${PORT:-3000}
  
  PID=$(lsof -ti:$PORT 2>/dev/null)
  if [ ! -z "$PID" ]; then
    echo "   发现端口 $PORT 被占用 (PID: $PID)，正在释放..."
    kill -9 $PID 2>/dev/null
    sleep 1
    echo "   ✅ 端口 $PORT 已释放"
  else
    echo "   ✅ 端口 $PORT 未被占用"
  fi
  
  echo "✅ 服务清理完成"
  echo ""
}

# 执行清理
stop_existing_services

echo "🌍 启动环境: $ENV"

case $ENV in
  dev|development)
    echo "📝 使用开发环境配置 (.env.development)"
    if [ -f .env.development ]; then
      cp .env.development .env
    fi
    echo "🚀 启动开发服务器..."
    npm run start:dev
    ;;
    
  test)
    echo "📝 使用测试环境配置 (.env.test)"
    if [ -f .env.test ]; then
      cp .env.test .env
    fi
    echo "🧪 启动测试服务器..."
    npm run start:dev
    ;;
    
  prod|production)
    echo "📝 使用生产环境配置 (.env.production)"
    if [ -f .env.production ]; then
      cp .env.production .env
    fi
    echo "🏭 启动生产服务器..."
    npm run start:prod
    ;;
    
  prod:my|production:my)
    echo "📝 使用生产环境配置 - 绵阳 (.env.production.MY)"
    if [ -f .env.production.MY ]; then
      cp .env.production.MY .env
    fi
    echo "🏭 启动生产服务器 (绵阳)..."
    npm run start:prod:my
    ;;
    
  prod:sz|production:sz)
    echo "📝 使用生产环境配置 - 苏州 (.env.production.SZ)"
    if [ -f .env.production.SZ ]; then
      cp .env.production.SZ .env
    fi
    echo "🏭 启动生产服务器 (苏州)..."
    npm run start:prod:sz
    ;;
    
  prod:ja|production:ja)
    echo "📝 使用生产环境配置 - 吉安 (.env.production.JA)"
    if [ -f .env.production.JA ]; then
      cp .env.production.JA .env
    fi
    echo "🏭 启动生产服务器 (吉安)..."
    npm run start:prod:ja
    ;;
    
  *)
    echo "❌ 未知环境: $ENV"
    echo ""
    echo "可用环境:"
    echo "  dev          - 开发环境"
    echo "  test         - 测试环境"
    echo "  prod         - 生产环境(默认)"
    echo "  prod:my      - 生产环境(绵阳)"
    echo "  prod:sz      - 生产环境(苏州)"
    echo "  prod:ja      - 生产环境(吉安)"
    exit 1
    ;;
esac
