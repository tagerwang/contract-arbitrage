# 合约套利监控系统 - 前端Dashboard (TypeScript)

## 📋 技术栈

- ⚛️ **React 18** - UI框架
- 🔷 **TypeScript** - 类型安全
- ⚡ **Vite** - 构建工具
- 📊 **Recharts** - 数据可视化
- 🎨 **Lucide React** - 图标库
- 📅 **date-fns** - 日期处理
- 🌐 **Axios** - HTTP客户端

## 📁 项目结构

```
frontend-dashboard/
├── src/
│   ├── components/          # React组件
│   │   ├── StatCard.tsx    # 统计卡片
│   │   └── OpportunityTable.tsx  # 机会表格
│   ├── types/              # TypeScript类型定义
│   │   └── index.ts
│   ├── api/                # API客户端
│   │   └── client.ts
│   ├── hooks/              # 自定义Hooks
│   │   └── useData.ts
│   ├── utils/              # 工具函数
│   │   └── format.ts
│   ├── App.tsx             # 主应用组件
│   ├── App.css             # 应用样式
│   ├── main.tsx            # 入口文件
│   └── index.css           # 全局样式
├── public/
├── index.html
├── package.json
├── tsconfig.json           # TS配置
├── tsconfig.node.json
├── vite.config.ts          # Vite配置
├── .env.example
└── .gitignore
```

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量（可选）

```bash
cp .env.example .env
```

编辑 `.env` 文件：
```env
VITE_API_BASE_URL=http://localhost:3001/api
```

### 3. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:5173

### 4. 构建生产版本

```bash
npm run build
```

构建产物在 `dist/` 目录

### 5. 预览生产构建

```bash
npm run preview
```

## ✨ 核心功能

### 1. 实时数据展示

- 📊 套利机会实时列表
- 📈 统计数据卡片
- 🔥 热门交易对排行

### 2. 自动刷新

- ✅ 默认每10秒自动刷新
- ⏸️ 可手动暂停/恢复
- 🔄 手动刷新按钮

### 3. 数据导出

- 📄 导出为JSON格式
- 📊 导出为CSV格式
- 💾 本地保存设置

### 4. 类型安全

- ✅ 完整的TypeScript类型定义
- ✅ API响应类型检查
- ✅ 组件Props类型
- ✅ 自定义Hooks类型

## 🎨 组件说明

### StatCard

统计卡片组件，用于展示关键指标。

```typescript
<StatCard
  icon={<TrendingUp />}
  title="总机会数"
  value={150}
  color="#667eea"
  subtitle="最近 24 小时"
/>
```

### OpportunityTable

机会表格组件，展示套利机会列表。

```typescript
<OpportunityTable
  opportunities={opportunities}
  loading={false}
/>
```

## 🔧 自定义Hooks

### useOpportunities

获取套利机会数据。

```typescript
const { opportunities, loading, error, refetch } = useOpportunities(
  true,  // autoRefresh
  10000  // interval
);
```

### useStatistics

获取统计数据。

```typescript
const { statistics, loading, error, refetch } = useStatistics(
  24,    // hours
  true   // autoRefresh
);
```

### useLocalStorage

持久化本地数据。

```typescript
const [value, setValue] = useLocalStorage('key', defaultValue);
```

## 🛠️ 工具函数

### 格式化函数

```typescript
import { formatPercent, formatCurrency, formatDateTime } from '@/utils/format';

formatPercent(0.0123, 4);  // "0.0123%"
formatCurrency(1234.56);   // "$1,234.56"
formatDateTime(new Date()); // "2024-01-30 12:34:56"
```

### 导出函数

```typescript
import { downloadJSON, downloadCSV } from '@/utils/format';

downloadJSON(data, 'filename');
downloadCSV(data, 'filename');
```

## 📡 API集成

### API客户端

```typescript
import { apiClient } from '@/api/client';

// 获取最新机会
const opportunities = await apiClient.getLatestOpportunities(20);

// 获取统计数据
const statistics = await apiClient.getStatistics({ hours: 24 });

// 健康检查
const isHealthy = await apiClient.healthCheck();
```

### 类型定义

所有API响应都有完整的TypeScript类型：

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}

interface ArbitrageOpportunity {
  id: number;
  symbol: string;
  long_exchange: string;
  short_exchange: string;
  spread_rate: number;
  annualized_return: number;
  // ...
}
```

## 🎯 开发指南

### 添加新组件

1. 在 `src/components/` 创建 `.tsx` 文件
2. 定义组件Props接口
3. 导出组件

```typescript
// MyComponent.tsx
import React from 'react';

interface MyComponentProps {
  title: string;
  value: number;
}

export const MyComponent: React.FC<MyComponentProps> = ({ title, value }) => {
  return <div>{title}: {value}</div>;
};

export default MyComponent;
```

### 添加新类型

在 `src/types/index.ts` 中定义：

```typescript
export interface NewType {
  field1: string;
  field2: number;
}
```

### 添加新API

在 `src/api/client.ts` 的 `ApiClient` 类中添加方法：

```typescript
async getNewData(): Promise<NewType[]> {
  const response = await this.client.get<ApiResponse<NewType[]>>('/new-endpoint');
  return response.data.data || [];
}
```

## 📦 构建优化

### 代码分割

Vite自动进行代码分割，生成最小的bundle。

### Tree Shaking

未使用的代码会被自动移除。

### 压缩

生产构建会自动压缩JS和CSS。

## 🔍 调试

### TypeScript类型检查

```bash
npx tsc --noEmit
```

### ESLint检查

```bash
npm run lint
```

### VSCode配置

推荐安装扩展：
- ESLint
- TypeScript Vue Plugin (Volar)
- Prettier

## 🌐 部署

### Vercel

```bash
vercel --prod
```

### Netlify

```bash
netlify deploy --prod
```

### 静态服务器

```bash
npm run build
# 将 dist/ 目录部署到任何静态服务器
```

### Nginx配置

```nginx
server {
    listen 80;
    server_name dashboard.yourdomain.com;
    root /var/www/dashboard/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:3001;
    }
}
```

## ⚙️ 环境变量

```env
# API基础URL
VITE_API_BASE_URL=http://localhost:3001/api

# 刷新间隔（毫秒）
VITE_REFRESH_INTERVAL=10000

# 调试模式
VITE_DEBUG=false
```

## 🐛 故障排除

### 端口被占用

修改 `vite.config.ts`:

```typescript
server: {
  port: 5174  // 改为其他端口
}
```

### API连接失败

检查 `.env` 中的 `VITE_API_BASE_URL` 配置。

### TypeScript错误

```bash
rm -rf node_modules dist
npm install
npm run build
```

## 📝 代码规范

### 命名约定

- 组件：PascalCase (`MyComponent.tsx`)
- Hooks：camelCase with `use` prefix (`useData.ts`)
- 工具函数：camelCase (`formatPercent`)
- 类型/接口：PascalCase (`ArbitrageOpportunity`)

### 文件组织

```
功能相关的文件放在一起
types/ - 所有类型定义
components/ - 可复用组件
hooks/ - 自定义Hooks
utils/ - 工具函数
api/ - API客户端
```

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

**Made with ⚛️ React + 🔷 TypeScript**
