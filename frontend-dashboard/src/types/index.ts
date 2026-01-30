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
  long_exchange: string;
  short_exchange: string;
  long_rate: number;
  short_rate: number;
  spread_rate: number;
  annualized_return: number;
  long_price: number;
  short_price: number;
  price_diff: number;
  price_spread_percent: number;
  confidence: number;
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
