# 合约套利监控系统 - 后端服务

## 📁 项目结构

```
backend/
├── src/
│   ├── exchanges/          # 交易所API封装
│   │   ├── binance.ts     # 币安API
│   │   ├── okx.ts         # OKX API
│   │   └── bybit.ts       # Bybit API
│   ├── database/          # 数据库服务
│   │   └── service.ts     # 数据库操作封装
│   ├── arbitrage/         # 套利引擎
│   │   └── engine.ts      # 核心套利逻辑
│   ├── routes/            # API路由
│   │   └── stats.ts       # 统计API路由
│   ├── types/             # TypeScript类型定义
│   │   └── index.ts       # 所有类型定义
│   ├── examples/          # 使用示例
│   │   └── database-usage.ts
│   ├── server.ts          # Express服务器
│   └── cli.ts             # 命令行启动脚本
├── database/
│   └── schema.sql         # PostgreSQL数据库结构
├── package.json
├── tsconfig.json
├── .env.example
└── .gitignore
```

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env 文件
```

必需配置：
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=arbitrage_db
DB_USER=postgres
DB_PASSWORD=your_password
```

### 3. 创建数据库

```bash
# 创建数据库
createdb arbitrage_db

# 导入schema
psql -d arbitrage_db -f database/schema.sql
```

### 4. 启动服务

**启动套利监控引擎：**
```bash
npm run dev
```

**启动API服务器：**
```bash
npm run server
```

**运行数据库示例：**
```bash
npm run example
```

## 📊 核心功能

### 1. 交易所API封装

支持三大交易所：
- 币安 (Binance)
- OKX
- Bybit

每个交易所支持：
- 获取资金费率
- 获取订单簿
- 获取K线数据
- 获取价格信息
- WebSocket实时数据流

### 2. 套利引擎

**核心功能：**
- 实时监控多个交易对的资金费率
- 自动识别套利机会
- 计算年化收益率
- 评估置信度
- 数据持久化

**配置参数：**
```typescript
{
  checkInterval: 5000,        // 检查间隔(毫秒)
  minProfitThreshold: 0.3,    // 最小利润阈值(%)
  maxPriceSpread: 0.5,        // 最大价格差(%)
  enabledSymbols: [           // 监控的交易对
    'BTCUSDT', 
    'ETHUSDT', 
    'BNBUSDT'
  ]
}
```

### 3. 数据库服务

**支持操作：**
- 保存/查询资金费率
- 保存/查询套利机会
- 统计分析
- 数据清理

**主要方法：**
```typescript
// 保存资金费率
await db.saveFundingRate(rate);

// 批量保存
await db.saveFundingRatesBatch(rates);

// 查询套利机会
await db.queryOpportunities({ 
  symbol: 'BTCUSDT', 
  minSpread: 0.35 
});

// 获取统计数据
await db.getStatistics(24); // 最近24小时
```

## 🔌 API端点

### 套利机会

```
GET /api/opportunities
GET /api/opportunities/latest
```

**参数：**
- `symbol` - 交易对 (可选)
- `minSpread` - 最小费差 (可选)
- `limit` - 返回数量
- `offset` - 偏移量

**示例：**
```bash
curl "http://localhost:3001/api/opportunities?symbol=BTCUSDT&minSpread=0.5"
```

### 资金费率

```
GET /api/funding-rates/latest
GET /api/funding-rates/history
```

**参数：**
- `symbol` - 交易对 (必需)
- `exchange` - 交易所 (必需)
- `hours` - 小时数 (默认24)

**示例：**
```bash
curl "http://localhost:3001/api/funding-rates/history?symbol=BTCUSDT&exchange=binance&hours=48"
```

### 统计数据

```
GET /api/statistics
```

**参数：**
- `hours` - 统计时间范围 (默认24)

**返回：**
```json
{
  "success": true,
  "data": {
    "totalOpportunities": 150,
    "avgSpread": 0.45,
    "avgAnnualizedReturn": 492.0,
    "topSymbols": [...],
    "exchangePairs": [...]
  }
}
```

### 健康检查

```
GET /api/health
```

## 💾 数据库结构

### 主要表

**funding_rates** - 资金费率记录
```sql
- id (SERIAL)
- exchange (VARCHAR)
- symbol (VARCHAR)
- funding_rate (DECIMAL)
- funding_time (TIMESTAMP)
- mark_price (DECIMAL)
- index_price (DECIMAL)
- recorded_at (TIMESTAMP)
```

**arbitrage_opportunities** - 套利机会记录
```sql
- id (SERIAL)
- symbol (VARCHAR)
- long_exchange (VARCHAR)
- short_exchange (VARCHAR)
- long_rate, short_rate (DECIMAL)
- spread_rate (DECIMAL)
- annualized_return (DECIMAL)
- long_price, short_price (DECIMAL)
- confidence (DECIMAL)
- detected_at (TIMESTAMP)
```

### 视图

- `v_latest_funding_rates` - 最新费率
- `v_latest_opportunities` - 最新机会
- `v_statistics_24h` - 24小时统计

## 🛠️ 开发指南

### TypeScript编译

```bash
npm run build
```

生成的文件在 `dist/` 目录

### 运行已编译代码

```bash
npm start
```

### 代码结构

**类型定义** (`types/index.ts`)
- Exchange枚举
- FundingRate接口
- ArbitrageOpportunity接口
- 数据库模型接口

**交易所API** (`exchanges/*.ts`)
- 统一的API接口
- 错误处理
- 数据格式化

**套利引擎** (`arbitrage/engine.ts`)
- 实时监控循环
- 套利机会识别
- 置信度计算

**数据库服务** (`database/service.ts`)
- 连接池管理
- CRUD操作
- 统计查询

## 📝 使用示例

### 基础使用

```typescript
import DatabaseService from './database/service';
import ArbitrageEngine from './arbitrage/engine';

// 初始化
const db = new DatabaseService();
const engine = new ArbitrageEngine(db);

// 启动监控
await engine.start();

// 停止监控
engine.stop();
```

### 自定义配置

```typescript
const engine = new ArbitrageEngine(db);

engine.updateConfig({
  checkInterval: 3000,
  minProfitThreshold: 0.5,
  enabledSymbols: ['BTCUSDT', 'ETHUSDT']
});

await engine.start();
```

### API服务器

```typescript
import ApiServer from './server';

const server = new ApiServer(3001);
await server.start();
```

## ⚙️ 环境变量

```env
# 数据库配置
DB_HOST=localhost
DB_PORT=5432
DB_NAME=arbitrage_db
DB_USER=postgres
DB_PASSWORD=your_password

# 服务器配置
PORT=3001
NODE_ENV=development

# 监控配置
CHECK_INTERVAL_MS=5000
MIN_PROFIT_THRESHOLD=0.3

# 交易所API (可选)
BINANCE_API_KEY=
BINANCE_API_SECRET=
OKX_API_KEY=
OKX_API_SECRET=
OKX_PASSPHRASE=
BYBIT_API_KEY=
BYBIT_API_SECRET=
```

## 🔒 安全建议

1. **不要提交 .env 到版本控制**
2. **使用强密码保护数据库**
3. **限制数据库访问权限**
4. **定期备份数据**
5. **在生产环境使用环境变量**

## 📊 性能优化

### 数据库索引

已创建索引：
- `idx_funding_rates_symbol`
- `idx_funding_rates_exchange`
- `idx_funding_rates_recorded_at`
- `idx_arb_opp_spread_rate`

### 连接池配置

```typescript
{
  max: 20,                      // 最大连接数
  idleTimeoutMillis: 30000,    // 空闲超时
  connectionTimeoutMillis: 2000 // 连接超时
}
```

### 定期清理

```bash
# 清理30天前的数据
psql arbitrage_db -c "SELECT cleanup_old_data(30);"
```

## 🐛 故障排除

### 数据库连接失败

```bash
# 检查PostgreSQL状态
# Mac
brew services list

# Linux
sudo systemctl status postgresql

# 测试连接
psql -h localhost -U postgres -d arbitrage_db
```

### 端口被占用

```bash
# 查找占用端口的进程
lsof -i :3001

# 杀死进程
kill -9 <PID>
```

### TypeScript编译错误

```bash
# 清理并重新安装
rm -rf node_modules dist
npm install
npm run build
```

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交Issue和Pull Request！
