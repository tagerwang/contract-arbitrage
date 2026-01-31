import axios, { AxiosInstance } from 'axios';
import crypto from 'crypto';
import { Exchange, FundingRate, OrderBook, Kline } from '../types';

/** 下单参数 */
export interface PlaceOrderParams {
  symbol: string;
  side: 'BUY' | 'SELL';
  type: 'MARKET' | 'LIMIT';
  quantity: string;
  price?: string;
  /** 持仓方向: BOTH=单向, LONG=双向做多, SHORT=双向做空。不传时根据 BINANCE_DUAL_POSITION 自动推断 */
  positionSide?: 'BOTH' | 'LONG' | 'SHORT';
}

/**
 * 币安交易所API封装
 */
export class BinanceAPI {
  private client: AxiosInstance;
  private wsUrl: string;
  private apiKey?: string;
  private apiSecret?: string;

  constructor() {
    this.apiKey = process.env.BINANCE_API_KEY?.trim();
    this.apiSecret = process.env.BINANCE_API_SECRET?.trim();
    this.client = axios.create({
      baseURL: 'https://fapi.binance.com',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    this.wsUrl = 'wss://fstream.binance.com/ws';
  }

  /**
   * 获取资金费率
   */
  async getFundingRate(symbol: string): Promise<FundingRate> {
    try {
      const response = await this.client.get('/fapi/v1/premiumIndex', {
        params: { symbol }
      });

      const data = response.data;
      
      return {
        exchange: Exchange.BINANCE,
        symbol: data.symbol,
        fundingRate: parseFloat(data.lastFundingRate),
        fundingTime: data.nextFundingTime,
        markPrice: parseFloat(data.markPrice),
        indexPrice: parseFloat(data.indexPrice),
        timestamp: data.time || Date.now()
      };
    } catch (error) {
      throw new Error(`Binance getFundingRate error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 批量获取所有交易对的资金费率
   */
  async getAllFundingRates(): Promise<FundingRate[]> {
    try {
      const response = await this.client.get('/fapi/v1/premiumIndex');
      const dataList = response.data;

      return dataList.map((data: any) => ({
        exchange: Exchange.BINANCE,
        symbol: data.symbol,
        fundingRate: parseFloat(data.lastFundingRate),
        fundingTime: data.nextFundingTime,
        markPrice: parseFloat(data.markPrice),
        indexPrice: parseFloat(data.indexPrice),
        timestamp: data.time || Date.now()
      }));
    } catch (error) {
      throw new Error(`Binance getAllFundingRates error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 获取订单簿
   */
  async getOrderBook(symbol: string, limit: number = 20): Promise<OrderBook> {
    try {
      const response = await this.client.get('/fapi/v1/depth', {
        params: { symbol, limit }
      });

      const data = response.data;

      return {
        exchange: Exchange.BINANCE,
        symbol,
        bids: data.bids.map((item: string[]) => [
          parseFloat(item[0]),
          parseFloat(item[1])
        ]),
        asks: data.asks.map((item: string[]) => [
          parseFloat(item[0]),
          parseFloat(item[1])
        ]),
        timestamp: Date.now()
      };
    } catch (error) {
      throw new Error(`Binance getOrderBook error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }


  /**
   * 获取K线数据
   */
  async getKlines(
    symbol: string,
    interval: string = '1h',
    limit: number = 100
  ): Promise<Kline[]> {
    try {
      const response = await this.client.get('/fapi/v1/klines', {
        params: { symbol, interval, limit }
      });

      return response.data.map((item: any[]) => ({
        exchange: Exchange.BINANCE,
        symbol,
        interval,
        openTime: item[0],
        closeTime: item[6],
        open: parseFloat(item[1]),
        high: parseFloat(item[2]),
        low: parseFloat(item[3]),
        close: parseFloat(item[4]),
        volume: parseFloat(item[5]),
        timestamp: item[0]
      }));
    } catch (error) {
      throw new Error(`Binance getKlines error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 获取24小时价格变动
   */
  async get24hrTicker(symbol: string): Promise<any> {
    try {
      const response = await this.client.get('/fapi/v1/ticker/24hr', {
        params: { symbol }
      });

      return {
        exchange: Exchange.BINANCE,
        symbol: response.data.symbol,
        lastPrice: parseFloat(response.data.lastPrice),
        priceChange: parseFloat(response.data.priceChange),
        priceChangePercent: parseFloat(response.data.priceChangePercent),
        volume: parseFloat(response.data.volume),
        quoteVolume: parseFloat(response.data.quoteVolume),
        highPrice: parseFloat(response.data.highPrice),
        lowPrice: parseFloat(response.data.lowPrice),
        timestamp: response.data.closeTime
      };
    } catch (error) {
      throw new Error(`Binance get24hrTicker error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 获取交易所信息
   */
  async getExchangeInfo(): Promise<any> {
    try {
      const response = await this.client.get('/fapi/v1/exchangeInfo');
      return response.data;
    } catch (error) {
      throw new Error(`Binance getExchangeInfo error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 获取所有支持的交易对
   */
  async getSymbols(): Promise<string[]> {
    try {
      const info = await this.getExchangeInfo();
      return info.symbols
        .filter((s: any) => s.status === 'TRADING' && s.contractType === 'PERPETUAL')
        .map((s: any) => s.symbol);
    } catch (error) {
      throw new Error(`Binance getSymbols error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 获取最新价格
   */
  async getPrice(symbol: string): Promise<number> {
    try {
      const response = await this.client.get('/fapi/v1/ticker/price', {
        params: { symbol }
      });
      return parseFloat(response.data.price);
    } catch (error) {
      throw new Error(`Binance getPrice error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 下单（需要配置 BINANCE_API_KEY、BINANCE_API_SECRET）
   */
  async placeOrder(params: PlaceOrderParams): Promise<any> {
    if (!this.apiKey || !this.apiSecret) {
      throw new Error('未配置 BINANCE_API_KEY 或 BINANCE_API_SECRET');
    }

    const timestamp = Date.now();

    // positionSide: 显式传入 > 环境变量 BINANCE_DUAL_POSITION > 默认 BOTH
    let positionSide = params.positionSide;
    if (!positionSide) {
      positionSide = process.env.BINANCE_DUAL_POSITION === 'true'
        ? (params.side === 'BUY' ? 'LONG' : 'SHORT')
        : 'BOTH';
    }

    const isLimitOrder = params.type.toUpperCase() === 'LIMIT';

    const orderParams: Record<string, string> = {
      symbol: params.symbol,
      side: params.side,
      type: params.type,
      quantity: params.quantity,
      positionSide,
      recvWindow: '60000',
      timestamp: String(timestamp)
    };

    // 限价单必须带 timeInForce（如 GTC），否则币安报 -1102
    if (isLimitOrder) {
      orderParams.timeInForce = 'GTC';
      if (params.price) orderParams.price = params.price;
    }

    // 与 quick-trade.sh 一致的参数顺序构建 queryString
    const paramOrder = ['positionSide', 'quantity', 'recvWindow', 'side', 'symbol', 'timestamp', 'type', 'timeInForce', 'price'];
    const queryString = paramOrder
      .filter(k => orderParams[k] !== undefined)
      .map(k => `${k}=${orderParams[k]}`)
      .join('&');

    const signature = crypto
      .createHmac('sha256', this.apiSecret)
      .update(queryString)
      .digest('hex');

    // 使用 request body 而非 URL，避免 axios/HTTP 层对 URL 的编码干扰
    const body = `${queryString}&signature=${signature}`;

    try {
      const response = await this.client.post(
        '/fapi/v1/order',
        body,
        {
          headers: {
            'X-MBX-APIKEY': this.apiKey,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(
        `Binance placeOrder error: ${error.response?.data?.msg ?? error.message}`
      );
    }
  }

  /**
   * WebSocket连接（用于实时数据流）
   */
  subscribeToStream(symbol: string, streamType: string, callback: (data: any) => void) {
    const WebSocket = require('ws');
    const stream = streamType === 'fundingRate' 
      ? `${symbol.toLowerCase()}@markPrice`
      : `${symbol.toLowerCase()}@${streamType}`;
    
    const ws = new WebSocket(`${this.wsUrl}/${stream}`);

    ws.on('message', (data: string) => {
      try {
        const parsed = JSON.parse(data);
        callback(parsed);
      } catch (error) {
        console.error('WebSocket parse error:', error);
      }
    });

    ws.on('error', (error: Error) => {
      console.error('WebSocket error:', error);
    });

    return ws;
  }
}

export default BinanceAPI;
