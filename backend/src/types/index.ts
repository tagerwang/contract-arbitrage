// ==================== 交易所接口定义 ====================

/**
 * 交易所名称枚举
 */
export enum Exchange {
  BINANCE = 'binance',
  OKX = 'okx',
  BYBIT = 'bybit'
}

/**
 * 合约类型
 */
export enum ContractType {
  PERPETUAL = 'perpetual',  // 永续合约
  DELIVERY = 'delivery'      // 交割合约
}

/**
 * 资金费率信息
 */
export interface FundingRate {
  exchange: Exchange;           // 交易所
  symbol: string;               // 交易对 (如 BTCUSDT)
  fundingRate: number;          // 资金费率 (小数形式，如 0.0001)
  fundingTime: number;          // 下次结算时间戳
  markPrice?: number;           // 标记价格
  indexPrice?: number;          // 指数价格
  timestamp: number;            // 数据时间戳
}

/**
 * 订单簿数据
 */
export interface OrderBook {
  exchange: Exchange;
  symbol: string;
  bids: [number, number][];     // 买单 [价格, 数量]
  asks: [number, number][];     // 卖单 [价格, 数量]
  timestamp: number;
}

/**
 * K线数据
 */
export interface Kline {
  exchange: Exchange;
  symbol: string;
  interval: string;             // 时间间隔 (如 '1h', '4h', '1d')
  openTime: number;
  closeTime: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timestamp: number;
}


/**
 * 套利机会
 */
export interface ArbitrageOpportunity {
  id?: number;
  symbol: string;
  longExchange: Exchange;
  shortExchange: Exchange;
  longRate: number;
  shortRate: number;
  spreadRate: number;
  annualizedReturn: number;
  longPrice: number;
  shortPrice: number;
  priceDiff: number;
  priceSpreadPercent: number;
  confidence: number;
  createdAt?: Date;
}

export interface SymbolConfig {
  symbol: string;
  enabled: boolean;
  minSpread: number;
  maxPriceSpread: number;
  checkInterval: number;
}

export interface FundingRateRecord {
  id?: number;
  exchange: string;
  symbol: string;
  funding_rate: number;
  funding_time: number;
  mark_price?: number;
  index_price?: number;
  recorded_at: Date;
}

export interface ArbitrageRecord {
  id?: number;
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
  detected_at: Date;
}

export interface PriceRecord {
  id?: number;
  exchange: string;
  symbol: string;
  price: number;
  bid_price?: number;
  ask_price?: number;
  volume_24h?: number;
  recorded_at: Date;
}

export interface Statistics {
  totalOpportunities: number;
  avgSpread: number;
  avgAnnualizedReturn: number;
  topSymbols: Array<{
    symbol: string;
    count: number;
    avgSpread: number;
  }>;
  exchangePairs: Array<{
    longExchange: string;
    shortExchange: string;
    count: number;
    avgSpread: number;
  }>;
}

export interface QueryFilter {
  symbol?: string;
  minSpread?: number;
  exchanges?: Exchange[];
  startTime?: Date;
  endTime?: Date;
  limit?: number;
  offset?: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}
