import type { ApiEndpoint } from '../types';

/**
 * API端点配置列表
 */
export const API_ENDPOINTS: ApiEndpoint[] = [
  // ==================== 套利机会 ====================
  {
    id: 'opportunities-query',
    name: '查询套利机会',
    method: 'GET',
    path: '/opportunities',
    category: '套利机会',
    description: '根据条件查询套利机会列表，支持按交易对、最小费差等条件筛选',
    params: [
      {
        name: 'symbol',
        type: 'string',
        optional: true,
        description: '交易对（如 BTCUSDT）'
      },
      {
        name: 'minSpread',
        type: 'number',
        optional: true,
        description: '最小费率差百分比'
      },
      {
        name: 'limit',
        type: 'number',
        default: 50,
        description: '返回结果数量'
      },
      {
        name: 'offset',
        type: 'number',
        default: 0,
        description: '偏移量（用于分页）'
      }
    ],
    example: '/api/opportunities?symbol=BTCUSDT&minSpread=0.5&limit=10'
  },
  {
    id: 'opportunities-latest',
    name: '最新套利机会',
    method: 'GET',
    path: '/opportunities/latest',
    category: '套利机会',
    description: '获取最新发现的套利机会，按时间倒序排列',
    params: [
      {
        name: 'limit',
        type: 'number',
        default: 20,
        description: '返回结果数量'
      }
    ],
    example: '/api/opportunities/latest?limit=20'
  },

  // ==================== 资金费率 ====================
  {
    id: 'funding-rates-latest',
    name: '最新资金费率',
    method: 'GET',
    path: '/funding-rates/latest',
    category: '资金费率',
    description: '获取所有交易所的最新资金费率数据',
    params: [
      {
        name: 'limit',
        type: 'number',
        default: 100,
        description: '返回结果数量'
      }
    ],
    example: '/api/funding-rates/latest?limit=100'
  },
  {
    id: 'funding-rates-history',
    name: '历史资金费率',
    method: 'GET',
    path: '/funding-rates/history',
    category: '资金费率',
    description: '获取特定交易对在特定交易所的历史资金费率',
    params: [
      {
        name: 'symbol',
        type: 'string',
        required: true,
        description: '交易对（如 BTCUSDT）'
      },
      {
        name: 'exchange',
        type: 'string',
        required: true,
        description: '交易所（binance/okx/bybit）'
      },
      {
        name: 'hours',
        type: 'number',
        default: 24,
        description: '查询时间范围（小时）'
      }
    ],
    example: '/api/funding-rates/history?symbol=BTCUSDT&exchange=binance&hours=48'
  },

  // ==================== 统计数据 ====================
  {
    id: 'statistics',
    name: '统计数据',
    method: 'GET',
    path: '/statistics',
    category: '统计分析',
    description: '获取系统统计信息，包括总机会数、平均费差、热门交易对等',
    params: [
      {
        name: 'hours',
        type: 'number',
        default: 24,
        description: '统计时间范围（小时）'
      }
    ],
    example: '/api/statistics?hours=24'
  },

  // ==================== 系统 ====================
  {
    id: 'health',
    name: '健康检查',
    method: 'GET',
    path: '/health',
    category: '系统',
    description: '检查API服务器和数据库连接状态',
    params: [],
    example: '/api/health'
  }
];

/**
 * 按类别分组端点
 */
export const ENDPOINTS_BY_CATEGORY = API_ENDPOINTS.reduce((acc, endpoint) => {
  if (!acc[endpoint.category]) {
    acc[endpoint.category] = [];
  }
  acc[endpoint.category].push(endpoint);
  return acc;
}, {} as Record<string, ApiEndpoint[]>);

/**
 * 获取所有类别
 */
export const CATEGORIES = Object.keys(ENDPOINTS_BY_CATEGORY);

/**
 * 根据ID查找端点
 */
export const findEndpointById = (id: string): ApiEndpoint | undefined => {
  return API_ENDPOINTS.find(endpoint => endpoint.id === id);
};

/**
 * HTTP方法颜色映射
 */
export const METHOD_COLORS: Record<string, string> = {
  GET: '#61affe',
  POST: '#49cc90',
  PUT: '#fca130',
  DELETE: '#f93e3e',
  PATCH: '#50e3c2'
};
