# API管理面板 (TypeScript)

一个功能完整的API测试和管理界面，专为合约套利监控系统设计。

## 📋 技术栈

- ⚛️ **React 18** - UI框架
- 🔷 **TypeScript** - 类型安全
- ⚡ **Vite** - 极速构建工具
- 🌐 **Axios** - HTTP客户端
- 🎨 **Lucide React** - 精美图标
- 📅 **date-fns** - 日期处理

## 📁 项目结构

```
frontend-api-manager/
├── src/
│   ├── components/            # React组件
│   │   ├── ParamEditor.tsx   # 参数编辑器
│   │   ├── ResponseViewer.tsx # 响应查看器
│   │   └── CodeGenerator.tsx  # 代码生成器
│   ├── types/                # TypeScript类型
│   │   └── index.ts
│   ├── constants/            # 常量配置
│   │   └── endpoints.ts      # API端点定义
│   ├── utils/                # 工具函数
│   │   └── helpers.ts
│   ├── App.tsx              # 主应用
│   ├── App.css
│   ├── main.tsx
│   └── index.css
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:5174

### 3. 构建生产版本

```bash
npm run build
```

## ✨ 核心功能

### 1. 📡 API测试

- **可视化参数编辑** - 直观的表单界面
- **实时请求发送** - 即时查看响应
- **参数验证** - 自动检查必需参数
- **错误处理** - 友好的错误提示

### 2. 📊 响应查看

- **格式化显示** - 美化的JSON输出
- **原始数据** - 查看未处理的响应
- **状态指示** - 成功/失败清晰标识
- **耗时统计** - 显示请求持续时间
- **一键复制** - 快速复制响应数据

### 3. 💻 代码生成

支持多种编程语言的代码片段：

- **cURL** - 命令行工具
- **JavaScript** - Fetch API
- **TypeScript** - 带类型定义
- **Python** - requests库
- **Go** - net/http包

每种语言都有：
- ✅ 完整的请求代码
- ✅ 错误处理示例
- ✅ 一键复制功能
- ✅ 使用提示

### 4. 📜 请求历史

- **自动记录** - 所有请求自动保存
- **快速重放** - 点击历史记录重新发送
- **详细信息** - 查看参数、响应、耗时
- **清空管理** - 一键清除历史记录

## 🎯 使用指南

### API端点配置

所有API端点在 `src/constants/endpoints.ts` 中定义：

```typescript
const endpoint: ApiEndpoint = {
  id: 'opportunities-latest',
  name: '最新套利机会',
  method: 'GET',
  path: '/opportunities/latest',
  category: '套利机会',
  description: '获取最新发现的套利机会',
  params: [
    {
      name: 'limit',
      type: 'number',
      default: 20,
      description: '返回结果数量'
    }
  ]
};
```

### 添加新端点

1. 编辑 `src/constants/endpoints.ts`
2. 在 `API_ENDPOINTS` 数组中添加新端点
3. 定义参数类型和默认值
4. 刷新页面即可使用

### 参数类型

支持三种参数类型：

```typescript
type ParamType = 'string' | 'number' | 'boolean';
```

### 代码生成

使用工具函数生成不同语言的代码：

```typescript
import { generateCode } from '@/utils/helpers';

const code = generateCode(
  'typescript',  // 语言
  endpoint,      // 端点信息
  params,        // 参数值
  baseUrl        // API基础URL
);
```

## 🔧 组件说明

### ParamEditor

参数编辑器组件，提供表单输入和验证。

**Props:**
```typescript
interface ParamEditorProps {
  params: ApiParameter[];
  values: Record<string, string>;
  onChange: (name: string, value: string) => void;
}
```

**特性:**
- 自动参数验证
- 必需/可选标识
- 默认值提示
- 错误提示

### ResponseViewer

响应查看器组件，美化显示API响应。

**Props:**
```typescript
interface ResponseViewerProps {
  response: ApiResponse | null;
  loading: boolean;
  error: string | null;
  duration: number;
}
```

**特性:**
- 格式化JSON
- 原始数据查看
- 成功/失败状态
- 复制功能

### CodeGenerator

代码生成器组件，生成多语言代码片段。

**Props:**
```typescript
interface CodeGeneratorProps {
  endpoint: ApiEndpoint;
  params: Record<string, string>;
  baseUrl: string;
}
```

**特性:**
- 5种编程语言
- 语法高亮
- 一键复制
- 使用提示

## 🛠️ 工具函数

### buildUrl

构建完整的API URL：

```typescript
const url = buildUrl(
  'http://localhost:3001/api',
  '/opportunities',
  { symbol: 'BTCUSDT', limit: '10' }
);
// 结果: http://localhost:3001/api/opportunities?symbol=BTCUSDT&limit=10
```

### validateAllParams

验证所有参数：

```typescript
const errors = validateAllParams(params, values);
if (errors.length > 0) {
  console.error(errors);
}
```

### copyToClipboard

复制到剪贴板：

```typescript
const success = await copyToClipboard(text);
```

## 📡 API集成

### 默认配置

API基础URL: `http://localhost:3001/api`

可通过 `.env` 文件修改：

```env
VITE_API_BASE_URL=http://your-api-server.com/api
```

### Axios配置

使用Axios发送请求，支持：
- 请求超时（30秒）
- 错误拦截
- 响应格式化

```typescript
const response = await axios({
  method: endpoint.method,
  url: buildUrl(baseUrl, endpoint.path, params),
  timeout: 30000
});
```

## 🎨 UI特性

### 响应式设计

- 📱 移动端适配
- 💻 平板优化
- 🖥️ 桌面完美显示

### 暗色代码主题

代码块使用暗色主题（VS Code风格）：

```css
.code-dark {
  background: #282c34;
  color: #abb2bf;
}
```

### 平滑动画

- 悬停效果
- 淡入动画
- 加载旋转

## 📦 构建部署

### 开发环境

```bash
npm run dev
```

### 生产构建

```bash
npm run build
# 输出到 dist/ 目录
```

### 预览构建

```bash
npm run preview
```

### 部署到静态服务器

```bash
# 1. 构建
npm run build

# 2. 部署 dist/ 目录到任何静态服务器
# Nginx, Apache, Vercel, Netlify 等
```

### Nginx配置示例

```nginx
server {
    listen 80;
    server_name api-manager.yourdomain.com;
    root /var/www/api-manager/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # 代理API请求
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## ⚙️ 环境变量

```env
# API基础URL
VITE_API_BASE_URL=http://localhost:3001/api

# 调试模式
VITE_DEBUG=false
```

## 🎯 最佳实践

### 1. 参数验证

始终验证用户输入：

```typescript
const errors = validateAllParams(params, values);
if (errors.length > 0) {
  setError(errors.join(', '));
  return;
}
```

### 2. 错误处理

提供友好的错误信息：

```typescript
catch (err) {
  if (err.response) {
    setError(`HTTP ${err.response.status}: ${err.response.statusText}`);
  } else if (err.request) {
    setError('请求超时或服务器无响应');
  } else {
    setError(err.message);
  }
}
```

### 3. 历史记录

限制历史记录数量：

```typescript
setHistory(prev => [newRecord, ...prev].slice(0, 50));
```

## 🐛 故障排除

### 端口被占用

修改 `vite.config.ts`:

```typescript
server: {
  port: 5175  // 改为其他端口
}
```

### API连接失败

检查后端是否运行：

```bash
curl http://localhost:3001/api/health
```

### CORS错误

确保后端配置了CORS：

```typescript
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE']
}));
```

## 📝 开发指南

### 添加新组件

1. 在 `src/components/` 创建组件
2. 定义Props接口
3. 导出组件

```typescript
// MyComponent.tsx
import React from 'react';

interface MyComponentProps {
  title: string;
}

export const MyComponent: React.FC<MyComponentProps> = ({ title }) => {
  return <div>{title}</div>;
};
```

### 添加新工具函数

在 `src/utils/helpers.ts` 中添加：

```typescript
export function myFunction(param: string): string {
  // 实现逻辑
  return result;
}
```

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

**Made with ⚛️ React + 🔷 TypeScript + ⚡ Vite**
