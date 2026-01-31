import axios, { AxiosInstance, AxiosError } from 'axios';
import type {
  ApiResponse,
  ArbitrageOpportunity,
  FundingRate,
  Statistics,
  OpportunityQueryParams,
  FundingRateHistoryParams,
  StatisticsParams
} from '../types';

/**
 * API 基础配置
 * 开发环境优先使用 /api 走 Vite 代理，避免跨域和 404
 */
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? '/api' : 'http://localhost:3001/api');

/**
 * API 客户端类
 */
class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // 请求拦截器
    this.client.interceptors.request.use(
      (config) => {
        // 可以在这里添加认证 token
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // 响应拦截器
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        console.error('API Error:', error.message);
        return Promise.reject(error);
      }
    );
  }

  /**
   * 获取套利机会列表
   */
  async getOpportunities(params?: OpportunityQueryParams): Promise<ArbitrageOpportunity[]> {
    const response = await this.client.get<ApiResponse<ArbitrageOpportunity[]>>(
      '/opportunities',
      { params }
    );
    return response.data.data || [];
  }

  /**
   * 获取最新套利机会
   */
  async getLatestOpportunities(limit: number = 20): Promise<ArbitrageOpportunity[]> {
    const response = await this.client.get<ApiResponse<ArbitrageOpportunity[]>>(
      '/opportunities/latest',
      { params: { limit } }
    );
    return response.data.data || [];
  }

  /**
   * 获取最新资金费率
   */
  async getLatestFundingRates(limit: number = 100): Promise<FundingRate[]> {
    const response = await this.client.get<ApiResponse<FundingRate[]>>(
      '/funding-rates/latest',
      { params: { limit } }
    );
    return response.data.data || [];
  }

  /**
   * 获取历史资金费率
   */
  async getFundingRateHistory(params: FundingRateHistoryParams): Promise<FundingRate[]> {
    const response = await this.client.get<ApiResponse<FundingRate[]>>(
      '/funding-rates/history',
      { params }
    );
    return response.data.data || [];
  }

  /**
   * 获取统计数据
   */
  async getStatistics(params?: StatisticsParams): Promise<Statistics> {
    const response = await this.client.get<ApiResponse<Statistics>>(
      '/statistics',
      { params }
    );
    return response.data.data || {
      totalOpportunities: 0,
      avgSpread: 0,
      avgAnnualizedReturn: 0,
      topSymbols: [],
      exchangePairs: []
    };
  }

  /**
   * 健康检查
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get<ApiResponse>('/health');
      return response.data.success;
    } catch {
      return false;
    }
  }

  // ==================== 交易所 API ====================

  /**
   * 获取指定交易对的资金费率
   */
  async getExchangeFundingRate(
    exchange: string,
    symbol: string
  ): Promise<any> {
    const response = await this.client.get<ApiResponse>(
      `/exchanges/${exchange}/funding-rate`,
      { params: { symbol } }
    );
    return response.data.data;
  }

  /**
   * 获取所有交易对的资金费率
   */
  async getExchangeFundingRates(exchange: string): Promise<any[]> {
    const response = await this.client.get<ApiResponse>(
      `/exchanges/${exchange}/funding-rates`
    );
    return response.data.data || [];
  }

  /**
   * 获取订单簿
   */
  async getExchangeOrderBook(
    exchange: string,
    symbol: string,
    limit?: number
  ): Promise<any> {
    const response = await this.client.get<ApiResponse>(
      `/exchanges/${exchange}/order-book`,
      { params: { symbol, limit } }
    );
    return response.data.data;
  }

  /**
   * 获取K线数据
   */
  async getExchangeKlines(
    exchange: string,
    symbol: string,
    interval?: string,
    limit?: number
  ): Promise<any[]> {
    const response = await this.client.get<ApiResponse>(
      `/exchanges/${exchange}/klines`,
      { params: { symbol, interval, limit } }
    );
    return response.data.data || [];
  }

  /**
   * 获取最新价格
   */
  async getExchangePrice(exchange: string, symbol: string): Promise<number> {
    const response = await this.client.get<ApiResponse>(
      `/exchanges/${exchange}/price`,
      { params: { symbol } }
    );
    return response.data.data?.price || 0;
  }

  /**
   * 获取所有支持的交易对
   */
  async getExchangeSymbols(exchange: string): Promise<string[]> {
    const response = await this.client.get<ApiResponse>(
      `/exchanges/${exchange}/symbols`
    );
    return response.data.data?.symbols || [];
  }

  /**
   * 获取交易所信息（仅币安）
   */
  async getExchangeInfo(exchange: string): Promise<any> {
    const response = await this.client.get<ApiResponse>(
      `/exchanges/${exchange}/exchange-info`
    );
    return response.data.data;
  }

  /**
   * 获取24小时价格变动（仅币安）
   */
  async getTicker24hr(exchange: string, symbol: string): Promise<any> {
    const response = await this.client.get<ApiResponse>(
      `/exchanges/${exchange}/ticker-24hr`,
      { params: { symbol } }
    );
    return response.data.data;
  }

  /**
   * 下单
   */
  async placeOrder(
    exchange: string,
    params: Record<string, string>
  ): Promise<any> {
    const response = await this.client.post<ApiResponse>(
      `/exchanges/${exchange}/order`,
      params
    );
    return response.data.data;
  }
}

// 导出单例
export const apiClient = new ApiClient();

// 导出便捷方法
export const {
  getOpportunities,
  getLatestOpportunities,
  getLatestFundingRates,
  getFundingRateHistory,
  getStatistics,
  healthCheck,
  // 交易所 API
  getExchangeFundingRate,
  getExchangeFundingRates,
  getExchangeOrderBook,
  getExchangeKlines,
  getExchangePrice,
  getExchangeSymbols,
  getExchangeInfo,
  getTicker24hr
} = apiClient;
