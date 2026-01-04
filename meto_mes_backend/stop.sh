#!/bin/bash
# =============================================================
# 🛑 MES 后端服务停止脚本
# 用法: ./stop.sh
# =============================================================

echo "🛑 正在停止 MES 后端服务..."

# 停止所有 nest/node 相关进程
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

# 释放 3000 端口 (从 .env 文件读取端口号)
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

echo "✅ 所有服务已停止"
