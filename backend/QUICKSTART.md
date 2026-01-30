# 🚀 后端服务 - 5分钟快速开始

## 📦 文件清单

本项目包含以下文件：

```
backend/
├── src/
│   ├── exchanges/          # 3个交易所API封装
│   │   ├── binance.ts     # 币安 (320行)
│   │   ├── okx.ts         # OKX (280行)
│   │   └── bybit.ts       # Bybit (260行)
│   ├── database/
│   │   └── service.ts     # 数据库服务 (420行)
│   ├── arbitrage/
│   │   └── engine.ts      # 套利引擎 (480行)
│   ├── routes/
│   │   └── stats.ts       # API路由 (360行)
│   ├── types/
│   │   └── index.ts       # 类型定义 (180行)
│   ├── examples/
│   │   └── database-usage.ts # 使用示例 (280行)
│   ├── server.ts          # Express服务器 (240行)
│   └── cli.ts             # CLI启动脚本 (80行)
├── database/
│   └── schema.sql         # 数据库结构 (400行)
├── package.json
├── tsconfig.json
├── .env.example
├── .gitignore
├── README.md              # 详细文档
└── DEPLOYMENT.md          # 部署指南
```

**总代码行数：~2,700行**

---

## ⚡ 3步快速启动

### 步骤1：安装依赖

```bash
cd backend
npm install
```

### 步骤2：配置环境

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑配置（最少只需配置数据库密码）
nano .env
```

**最小配置：**
```env
DB_PASSWORD=your_password  # 改成你的密码
```

其他配置有默认值，可选修改：
```env
DB_HOST=localhost          # 默认值
DB_PORT=5432              # 默认值  
DB_NAME=arbitrage_db      # 默认值
DB_USER=postgres          # 默认值
PORT=3001                 # API端口
CHECK_INTERVAL_MS=5000    # 检查间隔
MIN_PROFIT_THRESHOLD=0.3  # 最小利润阈值
```

### 步骤3：初始化数据库

```bash
# 创建数据库
createdb arbitrage_db

# 导入表结构
psql -d arbitrage_db -f database/schema.sql
```

---

## 🎯 运行方式

### 方式1：开发模式（推荐首次使用）

直接运行TypeScript，无需编译：

```bash
# 启动监控引擎
npm run dev

# 或启动API服务器
npm run server

# 或运行数据库示例
npm run example
```

### 方式2：生产模式

先编译再运行：

```bash
# 编译TypeScript
npm run build

# 运行编译后的代码
npm start
```

---

## 🧪 验证安装

### 测试1：数据库连接

```bash
npm run example
```

**期望输出：**
```
✓ Database connected successfully
✓ Saved with ID: 1
Found 5 records
```

### 测试2：API服务器

```bash
# 终端1：启动服务器
npm run server

# 终端2：测试API
curl http://localhost:3001/api/health
```

**期望响应：**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2024-01-30T..."
  }
}
```

### 测试3：监控引擎

```bash
npm run dev
```

**期望输出：**
```
🚀 Starting Arbitrage Engine...
⚙ Check interval: 5000ms
⚙ Min profit threshold: 0.3%
🔍 Checking arbitrage opportunities...
```

---

## 📊 主要功能

### 1. 实时监控套利机会

```bash
npm run dev
```

自动：
- 每5秒检查一次所有交易对
- 对比三大交易所的资金费率
- 识别套利机会并保存到数据库
- 计算年化收益率

### 2. 提供RESTful API

```bash
npm run server
```

提供以下端点：
- `GET /api/opportunities` - 查询套利机会
- `GET /api/opportunities/latest` - 最新机会
- `GET /api/funding-rates/latest` - 最新费率
- `GET /api/statistics` - 统计数据
- `GET /api/health` - 健康检查

### 3. 数据库管理

自动创建表、索引、视图：
- `funding_rates` - 资金费率历史
- `arbitrage_opportunities` - 套利机会
- `price_history` - 价格历史

---

## 🔍 API使用示例

### 获取最新套利机会

```bash
curl "http://localhost:3001/api/opportunities/latest?limit=10"
```

### 查询特定交易对

```bash
curl "http://localhost:3001/api/opportunities?symbol=BTCUSDT&minSpread=0.5"
```

### 获取统计数据

```bash
curl "http://localhost:3001/api/statistics?hours=24"
```

### JavaScript调用

```javascript
// 获取最新机会
const response = await fetch('http://localhost:3001/api/opportunities/latest');
const data = await response.json();
console.log(data);
```

---

## 📁 核心模块说明

### 交易所API (`src/exchanges/`)

封装了三大交易所的API：
- **binance.ts** - 币安永续合约API
- **okx.ts** - OKX永续合约API  
- **bybit.ts** - Bybit永续合约API

每个都支持：
- 获取资金费率
- 获取订单簿
- 获取K线
- WebSocket实时数据

### 套利引擎 (`src/arbitrage/engine.ts`)

核心算法：
1. 并发获取所有交易所的费率
2. 两两对比找出费差
3. 计算年化收益率
4. 评估置信度
5. 保存到数据库

### 数据库服务 (`src/database/service.ts`)

提供完整的数据操作：
- 保存/查询资金费率
- 保存/查询套利机会
- 统计分析
- 批量操作
- 事务支持

### API服务器 (`src/server.ts`)

Express服务器：
- CORS支持
- 错误处理
- 请求日志
- 健康检查

---

## ⚙️ 自定义配置

### 修改监控参数

编辑 `src/arbitrage/engine.ts`:

```typescript
private config = {
  checkInterval: 5000,           // 改为3000 = 3秒检查一次
  minProfitThreshold: 0.3,       // 改为0.5 = 最小0.5%利润
  maxPriceSpread: 0.5,           // 最大价格差
  enabledSymbols: [              // 添加更多交易对
    'BTCUSDT', 
    'ETHUSDT', 
    'BNBUSDT',
    'SOLUSDT',
    'DOGEUSDT'
  ]
}
```

### 修改API端口

编辑 `.env`:
```env
PORT=8080  # 改为8080端口
```

---

## 🐛 常见问题

### Q1: 数据库连接失败

**A:** 检查PostgreSQL是否运行
```bash
# Mac
brew services start postgresql

# Linux  
sudo systemctl start postgresql

# Windows
net start postgresql-x64-14
```

### Q2: 端口被占用

**A:** 修改 `.env` 中的 `PORT` 配置

### Q3: npm install 失败

**A:** 清除缓存重试
```bash
rm -rf node_modules package-lock.json
npm install
```

### Q4: TypeScript 编译错误

**A:** 确保Node.js版本 >= 16
```bash
node --version  # 应该 >= v16.0.0
```

---

## 📚 进一步学习

- **完整文档**: 查看 `README.md`
- **部署指南**: 查看 `DEPLOYMENT.md`  
- **代码示例**: 运行 `npm run example`
- **类型定义**: 查看 `src/types/index.ts`

---

## 🎓 项目特点

✅ **完全TypeScript** - 类型安全，开发体验好  
✅ **模块化设计** - 易于扩展和维护  
✅ **生产就绪** - 包含错误处理、日志、监控  
✅ **数据库优化** - 索引、视图、存储过程  
✅ **文档完善** - 详细注释和使用说明  
✅ **开箱即用** - 3步即可运行  

---

## 🆘 需要帮助？

1. 查看 `README.md` 获取详细文档
2. 检查代码注释理解实现
3. 运行 `npm run example` 学习用法
4. 查看日志文件定位问题

---

**开始探索吧！祝使用愉快！** 🚀
