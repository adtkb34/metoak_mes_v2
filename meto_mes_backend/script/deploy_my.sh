#!/bin/bash

# 服务器信息
SERVER_USER="h3c"
SERVER_HOST="192.168.188.11"
TARGET_DIR="/home/h3c/mosrc/mes/backend/LTS_MESv1"

# 构建产物目录（例如 dist）
BUILD_DIR="dist"

# 压缩包名称
ARCHIVE_NAME="build_package.tar.gz"

# 1. 本地执行 pnpm install 和构建

if [ $? -ne 0 ]; then
    echo "构建失败，退出"
    exit 1
fi

# 2. 压缩构建产物
tar -czf $ARCHIVE_NAME $BUILD_DIR
if [ $? -ne 0 ]; then
    echo "压缩失败，退出"
    exit 1
fi

# 3. 远程删除目标目录（先删除旧目录再创建新目录）
ssh ${SERVER_USER}@${SERVER_HOST} "sudo rm -rf ${TARGET_DIR} && sudo mkdir -p ${TARGET_DIR}"
if [ $? -ne 0 ]; then
    echo "远程删除或创建目录失败，退出"
    exit 1
fi

# 4. 上传压缩包到目标目录的上级目录（因为后面要解压到目标目录）
scp $ARCHIVE_NAME ${SERVER_USER}@${SERVER_HOST}:/tmp/
if [ $? -ne 0 ]; then
    echo "上传文件失败，退出"
    exit 1
fi

# 5. 远程解压到目标目录
ssh ${SERVER_USER}@${SERVER_HOST} "sudo tar  --strip-components=1 -xzf /tmp/${ARCHIVE_NAME} -C ${TARGET_DIR} && sudo rm /tmp/${ARCHIVE_NAME}"
if [ $? -ne 0 ]; then
    echo "远程解压失败，退出"
    exit 1
fi

echo "部署完成！"
