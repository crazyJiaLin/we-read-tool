#!/bin/bash

echo "🚀 启动微信读书统计工具..."

# 检查Node.js版本
node_version=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$node_version" -lt 16 ]; then
    echo "❌ 错误: 需要Node.js 16.0.0或更高版本"
    echo "当前版本: $(node -v)"
    exit 1
fi

echo "✅ Node.js版本检查通过: $(node -v)"

# 检查MongoDB是否运行
if ! pgrep -x "mongod" > /dev/null; then
    echo "⚠️  警告: MongoDB可能未运行"
    echo "请确保MongoDB服务已启动"
    echo "macOS: brew services start mongodb-community"
    echo "Ubuntu: sudo systemctl start mongod"
    echo "Windows: 启动MongoDB服务"
fi

# 安装依赖
echo "📦 安装依赖..."
npm run install:all

# 启动开发服务器
echo "🌟 启动开发服务器..."
npm run dev

echo "✅ 启动完成!"
echo "前端地址: http://localhost:3000"
echo "后端地址: http://localhost:7001" 