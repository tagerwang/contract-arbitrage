# 快速开始指南

## 环境要求

- Node.js 16+
- PostgreSQL 12+
- npm 或 yarn

## 安装步骤

### 1. 克隆项目

```bash
git clone <repository-url>
cd contract-arbitrage
```

### 2. 自动化安装（推荐）

**Linux/Mac:**
```bash
./setup.sh
```

**Windows:**
```bash
setup.bat
```

### 3. 手动安装

**安装后端:**
```bash
cd backend
npm install
cp .env.example .env
# 编辑.env文件
```

**安装前端:**
```bash
cd frontend-dashboard
npm install
```

## 数据库配置

### 创建数据库

```bash
createdb arbitrage_db
```

### 导入Schema

```bash
psql -d arbitrage_db -f backend/database/schema.sql
```

### 配置连接

编辑 `backend/.env`:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=arbitrage_db
DB_USER=postgres
DB_PASSWORD=your_password
```

## 启动服务

### 启动后端监控

```bash
cd backend
npm run dev
```

### 启动API服务器（可选）

```bash
cd backend
npm run server
```

### 启动前端

```bash
cd frontend-dashboard
npm run dev
```

访问 http://localhost:5173

## 验证安装

### 测试数据库

```bash
cd backend
npm run example
```

### 测试API

```bash
curl http://localhost:3001/api/health
```

## 常见问题

### 数据库连接失败

检查PostgreSQL是否运行:
```bash
# Mac
brew services start postgresql

# Linux
sudo service postgresql start
```

### 端口被占用

修改 `.env` 中的 `PORT` 配置

### 依赖安装失败

清除缓存重试:
```bash
rm -rf node_modules package-lock.json
npm install
```

## 下一步

- [数据库配置详解](DATABASE_SETUP.md)
- [API使用文档](API_EXAMPLES.md)
- [仪表盘指南](DASHBOARD_GUIDE.md)
