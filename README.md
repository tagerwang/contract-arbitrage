# 合约套利监控系统

一个功能完整的加密货币合约套利机会监控系统，支持实时监控币安、OKX、Bybit三大交易所的资金费率差异。

## 📋 项目结构

```
contract-arbitrage/
├── backend/                    # 后端服务
│   ├── src/
│   │   ├── exchanges/         # 交易所API封装
│   │   ├── database/          # 数据库服务
│   │   ├── arbitrage/         # 套利引擎
│   │   ├── routes/            # API路由
│   │   └── types/             # TypeScript类型定义
│   ├── database/
│   │   └── schema.sql         # 数据库结构
│   └── package.json
├── frontend-api-manager/       # API管理界面
├── frontend-dashboard/         # 数据仪表盘
└── docs/                      # 项目文档
```

## ✨ 核心功能

### 后端服务
- 🔄 实时监控三大交易所资金费率
- 💹 自动识别套利机会
- 💾 PostgreSQL数据持久化
- 📊 RESTful API接口
- ⚙️ 可配置监控参数

### 前端界面
- 📈 实时数据仪表盘
- 🎨 可视化图表展示
- 🔍 历史数据查询
- 📱 响应式设计

## 🚀 快速开始

### 前置要求

- Node.js 16+
- PostgreSQL 12+
- npm 或 yarn

### 1. 数据库设置

```bash
# 创建数据库
createdb arbitrage_db

# 导入schema
psql -d arbitrage_db -f backend/database/schema.sql
```

### 2. 后端安装

```bash
cd backend
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件，填入数据库配置

# 启动监控引擎
npm run dev

# 或启动API服务器
npm run server
```

### 3. 前端安装

**API管理界面：**
```bash
cd frontend-api-manager
npm install
npm run dev
```

**数据仪表盘：**
```bash
cd frontend-dashboard
npm install
npm run dev
```

## 📖 详细文档

- [快速开始指南](docs/QUICKSTART.md)
- [数据库配置](docs/DATABASE_SETUP.md)
- [API使用示例](docs/API_EXAMPLES.md)
- [仪表盘使用指南](docs/DASHBOARD_GUIDE.md)
- [部署指南](docs/DEPLOYMENT.md)

## 🔌 API端点

### 套利机会
- `GET /api/opportunities` - 查询套利机会
- `GET /api/opportunities/latest` - 获取最新机会

### 资金费率
- `GET /api/funding-rates/latest` - 获取最新费率
- `GET /api/funding-rates/history` - 获取历史费率

### 统计数据
- `GET /api/statistics` - 获取统计信息
- `GET /api/health` - 健康检查

## 🛠️ 配置说明

### 环境变量

```env
# 数据库
DB_HOST=localhost
DB_PORT=5432
DB_NAME=arbitrage_db
DB_USER=postgres
DB_PASSWORD=your_password

# 服务器
PORT=3001
NODE_ENV=development

# 监控参数
CHECK_INTERVAL_MS=5000
MIN_PROFIT_THRESHOLD=0.3
```

### 监控参数

- `CHECK_INTERVAL_MS`: 检查间隔（毫秒）
- `MIN_PROFIT_THRESHOLD`: 最小利润阈值（%）
- `MAX_PRICE_SPREAD`: 最大价格差百分比

## 📊 数据流

```
交易所API → 套利引擎 → 数据库 → API服务器 → 前端界面
   ↓           ↓          ↓         ↓          ↓
[实时数据] [分析处理] [持久化] [REST API] [可视化]
```

## 🔒 安全建议

1. **不要提交 .env 文件到版本控制**
2. **使用强密码保护数据库**
3. **在生产环境启用API认证**
4. **定期备份数据库**
5. **监控系统资源使用**

## 📝 使用示例

### 启动完整系统

```bash
# 终端1：启动后端监控
cd backend && npm run dev

# 终端2：启动API服务
cd backend && npm run server

# 终端3：启动前端
cd frontend-dashboard && npm run dev
```

### 查看套利机会

访问 `http://localhost:5173` 查看实时仪表盘

### API调用示例

```bash
# 获取最新套利机会
curl http://localhost:3001/api/opportunities/latest

# 获取统计数据
curl http://localhost:3001/api/statistics?hours=24
```

## 🤝 贡献指南

欢迎提交Issue和Pull Request！

## 📄 许可证

MIT License

## ⚠️ 免责声明

本项目仅供学习研究使用，不构成任何投资建议。加密货币交易存在风险，请谨慎决策。

## 📮 联系方式

如有问题，请提交 Issue。

---

**Made with ❤️ for the crypto community**
