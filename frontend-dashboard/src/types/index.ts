// ==================== 枚举类型 ====================

export enum Exchange {
  BINANCE = 'binance',
  OKX = 'okx',
  BYBIT = 'bybit'
}

// ==================== 数据模型 ====================

/**
 * 套利机会
 */
export interface ArbitrageOpportunity {
  id: number;
  symbol: string;
  /** 做多交易所 */
  long_exchange: string;
  /** 做空交易所 */
  short_exchange: string;
  /** 做多费率 */
  long_rate: number;
  /** 做空费率 */
  short_rate: number;
  /** 费率差 */
  spread_rate: number;
  /** 年化收益率 */
  annualized_return: number;
  /** 下次资金费率结算时间戳（毫秒） */
  next_funding_time: number;
  /** 资金费率结算周期（小时），1/4/8 等；无值时年化计算默认用 8 */
  funding_period_hours?: number | null;
  /** 做多价格 */
  long_price: number;
  /** 做空价格 */
  short_price: number;
  /** 价格差 */
  price_diff: number;
  /** 价格差百分比 */
  price_spread_percent: number;
  /** 置信度 */
  confidence: number;
  /** 检测时间 */
  detected_at: string;
}

/**
 * 资金费率记录
 */
export interface FundingRate {
  id: number;
  exchange: string;
  symbol: string;
  funding_rate: number;
  funding_time: string;
  mark_price?: number;
  index_price?: number;
  recorded_at: string;
}

/**
 * 统计数据
 */
export interface Statistics {
  totalOpportunities: number;
  avgSpread: number;
  avgAnnualizedReturn: number;
  topSymbols: TopSymbol[];
  exchangePairs: ExchangePair[];
}

/**
 * 热门交易对
 */
export interface TopSymbol {
  symbol: string;
  count: number;
  avgSpread: number;
}

/**
 * 交易所配对
 */
export interface ExchangePair {
  longExchange: string;
  shortExchange: string;
  count: number;
  avgSpread: number;
}

// ==================== API 响应类型 ====================

/**
 * 标准 API 响应
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}

/**
 * 分页响应
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// ==================== 查询参数 ====================

/**
 * 套利机会查询参数
 */
export interface OpportunityQueryParams {
  symbol?: string;
  minSpread?: number;
  limit?: number;
  offset?: number;
}

/**
 * 资金费率历史查询参数
 */
export interface FundingRateHistoryParams {
  symbol: string;
  exchange: string;
  hours?: number;
}

/**
 * 统计查询参数
 */
export interface StatisticsParams {
  hours?: number;
}

// ==================== UI 组件属性 ====================

/**
 * 统计卡片属性
 */
export interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  color: string;
  subtitle?: string;
}

/**
 * 机会表格属性
 */
export interface OpportunityTableProps {
  opportunities: ArbitrageOpportunity[];
  loading?: boolean;
}

/**
 * 图表数据点
 */
export interface ChartDataPoint {
  time: string;
  value: number;
  label?: string;
}

// ==================== 应用状态 ====================

/**
 * 加载状态
 */
export interface LoadingState {
  opportunities: boolean;
  statistics: boolean;
  fundingRates: boolean;
}

/**
 * 错误状态
 */
export interface ErrorState {
  opportunities: string | null;
  statistics: string | null;
  fundingRates: string | null;
}

/**
 * 过滤器状态
 */
export interface FilterState {
  symbol: string;
  minSpread: number;
  exchange: Exchange | 'all';
  timeRange: '1h' | '6h' | '24h' | '7d';
}
