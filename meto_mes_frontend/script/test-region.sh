#!/bin/bash

# 测试不同地区配置的脚本

echo "测试不同地区配置的MES标题"

# 测试中国地区
echo "=== 测试中国地区 ==="
VITE_REGION=china pnpm build --mode development
echo "中国地区标题: $(grep -o '<title>[^<]*' dist/index.html | cut -d'>' -f2)"

# 测试日本地区
echo "=== 测试日本地区 ==="
VITE_REGION=japan pnpm build --mode development
echo "日本地区标题: $(grep -o '<title>[^<]*' dist/index.html | cut -d'>' -f2)"

# 测试美国地区
echo "=== 测试美国地区 ==="
VITE_REGION=usa pnpm build --mode development
echo "美国地区标题: $(grep -o '<title>[^<]*' dist/index.html | cut -d'>' -f2)"

# 测试德国地区
echo "=== 测试德国地区 ==="
VITE_REGION=germany pnpm build --mode development
echo "德国地区标题: $(grep -o '<title>[^<]*' dist/index.html | cut -d'>' -f2)"

# 测试其他地区
echo "=== 测试其他地区 ==="
VITE_REGION=other pnpm build --mode development
echo "其他地区标题: $(grep -o '<title>[^<]*' dist/index.html | cut -d'>' -f2)"

echo "测试完成"