#!/bin/bash

# 合约套利监控系统 - 项目设置脚本

echo "=================================="
echo "  Contract Arbitrage Setup"
echo "=================================="
echo ""

# 检查Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js未安装，请先安装Node.js 16+"
    exit 1
fi

echo "✓ Node.js版本: $(node --version)"

# 检查PostgreSQL
if ! command -v psql &> /dev/null; then
    echo "⚠ PostgreSQL未安装，请先安装PostgreSQL 12+"
    echo "  macOS: brew install postgresql"
    echo "  Ubuntu: sudo apt install postgresql"
    exit 1
fi

echo "✓ PostgreSQL已安装"
echo ""

# 1. 设置后端
echo "📦 设置后端..."
cd backend

if [ ! -f ".env" ]; then
    echo "创建 .env 文件..."
    cp .env.example .env
    echo "⚠ 请编辑 backend/.env 文件，配置数据库连接"
fi

echo "安装后端依赖..."
npm install

echo "✓ 后端设置完成"
echo ""

# 2. 设置前端 - API Manager
echo "📦 设置前端 (API Manager)..."
cd ../frontend-api-manager

if [ ! -d "node_modules" ]; then
    echo "安装依赖..."
    npm install
fi

echo "✓ API Manager设置完成"
echo ""

# 3. 设置前端 - Dashboard
echo "📦 设置前端 (Dashboard)..."
cd ../frontend-dashboard

if [ ! -d "node_modules" ]; then
    echo "安装依赖..."
    npm install
fi

echo "✓ Dashboard设置完成"
echo ""

cd ..

echo "=================================="
echo "  ✓ 设置完成!"
echo "=================================="
echo ""
echo "下一步："
echo "1. 创建数据库: createdb arbitrage_db"
echo "2. 导入schema: psql -d arbitrage_db -f backend/database/schema.sql"
echo "3. 配置环境: 编辑 backend/.env"
echo "4. 启动后端: cd backend && npm run dev"
echo "5. 启动前端: cd frontend-dashboard && npm run dev"
echo ""
