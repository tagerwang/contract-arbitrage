@echo off
REM 合约套利监控系统 - Windows设置脚本

echo ==================================
echo   Contract Arbitrage Setup
echo ==================================
echo.

REM 检查Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo X Node.js未安装，请先安装Node.js 16+
    pause
    exit /b 1
)

echo √ Node.js已安装
echo.

REM 1. 设置后端
echo 安装后端...
cd backend

if not exist ".env" (
    echo 创建 .env 文件...
    copy .env.example .env
    echo ! 请编辑 backend\.env 文件，配置数据库连接
)

echo 安装后端依赖...
call npm install

echo √ 后端设置完成
echo.

REM 2. 设置前端 - API Manager
echo 安装前端 (API Manager)...
cd ..\frontend-api-manager

if not exist "node_modules" (
    echo 安装依赖...
    call npm install
)

echo √ API Manager设置完成
echo.

REM 3. 设置前端 - Dashboard
echo 安装前端 (Dashboard)...
cd ..\frontend-dashboard

if not exist "node_modules" (
    echo 安装依赖...
    call npm install
)

echo √ Dashboard设置完成
echo.

cd ..

echo ==================================
echo   √ 设置完成!
echo ==================================
echo.
echo 下一步:
echo 1. 安装PostgreSQL (如未安装)
echo 2. 创建数据库: createdb arbitrage_db
echo 3. 导入schema: psql -d arbitrage_db -f backend\database\schema.sql
echo 4. 配置环境: 编辑 backend\.env
echo 5. 启动后端: cd backend ^&^& npm run dev
echo 6. 启动前端: cd frontend-dashboard ^&^& npm run dev
echo.
pause
