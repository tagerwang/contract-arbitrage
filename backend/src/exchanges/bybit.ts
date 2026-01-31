import axios, { AxiosInstance } from 'axios';
import crypto from 'crypto';
import { Exchange, FundingRate, OrderBook, Kline } from '../types';

/** 下单参数 */
export interface PlaceOrderParams {
  symbol: string;
  side: 'Buy' | 'Sell';
  orderType: 'Market' | 'Limit';
  qty: string;
  price?: string;
}

/**
 * Bybit交易所API封装
 */
export class BybitAPI {
  private client: AxiosInstance;
  private wsUrl: string;
  private apiKey?: string;
  private apiSecret?: string;

  constructor() {
    this.apiKey = process.env.BYBIT_API_KEY;
    this.apiSecret = process.env.BYBIT_API_SECRET;
    this.client = axios.create({
      baseURL: 'https://api.bybit.com',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    this.wsUrl = 'wss://stream.bybit.com/v5/public/linear';
  }

  /**
   * 获取资金费率
   */
  async getFundingRate(symbol: string): Promise<FundingRate> {
    try {
      const response = await this.client.get('/v5/market/tickers', {
        params: { 
          category: 'linear',
          symbol 
        }
      });

      if (response.data.retCode !== 0) {
        throw new Error(response.data.retMsg);
      }

      const data = response.data.result.list[0];
      
      return {
        exchange: Exchange.BYBIT,
        symbol: data.symbol,
        fundingRate: parseFloat(data.fundingRate),
        fundingTime: parseInt(data.nextFundingTime),
        markPrice: parseFloat(data.markPrice),
        indexPrice: parseFloat(data.indexPrice),
        timestamp: Date.now()
      };
    } catch (error) {
      throw new Error(`Bybit getFundingRate error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 批量获取所有交易对的资金费率
   */
  async getAllFundingRates(): Promise<FundingRate[]> {
    try {
      const response = await this.client.get('/v5/market/tickers', {
        params: { category: 'linear' }
      });

      if (response.data.retCode !== 0) {
        throw new Error(response.data.retMsg);
      }

      return response.data.result.list
        .filter((data: any) => data.symbol.endsWith('USDT'))
        .map((data: any) => ({
          exchange: Exchange.BYBIT,
          symbol: data.symbol,
          fundingRate: parseFloat(data.fundingRate),
          fundingTime: parseInt(data.nextFundingTime),
          fundingIntervalHours: parseInt(data.fundingIntervalHour, 10) || 8,
          markPrice: parseFloat(data.markPrice),
          indexPrice: parseFloat(data.indexPrice),
          timestamp: Date.now()
        }));
    } catch (error) {
      throw new Error(`Bybit getAllFundingRates error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 获取订单簿
   */
  async getOrderBook(symbol: string, limit: number = 25): Promise<OrderBook> {
    try {
      const response = await this.client.get('/v5/market/orderbook', {
        params: { 
          category: 'linear',
          symbol,
          limit 
        }
      });

      if (response.data.retCode !== 0) {
        throw new Error(response.data.retMsg);
      }

      const data = response.data.result;

      return {
        exchange: Exchange.BYBIT,
        symbol,
        bids: data.b.map((item: string[]) => [
          parseFloat(item[0]),
          parseFloat(item[1])
        ]),
        asks: data.a.map((item: string[]) => [
          parseFloat(item[0]),
          parseFloat(item[1])
        ]),
        timestamp: parseInt(data.ts)
      };
    } catch (error) {
      throw new Error(`Bybit getOrderBook error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 获取K线数据
   */
  async getKlines(
    symbol: string,
    interval: string = '60',
    limit: number = 200
  ): Promise<Kline[]> {
    try {
      const response = await this.client.get('/v5/market/kline', {
        params: { 
          category: 'linear',
          symbol,
          interval,
          limit 
        }
      });

      if (response.data.retCode !== 0) {
        throw new Error(response.data.retMsg);
      }

      return response.data.result.list.map((item: string[]) => ({
        exchange: Exchange.BYBIT,
        symbol,
        interval,
        openTime: parseInt(item[0]),
        closeTime: parseInt(item[0]),
        open: parseFloat(item[1]),
        high: parseFloat(item[2]),
        low: parseFloat(item[3]),
        close: parseFloat(item[4]),
        volume: parseFloat(item[5]),
        timestamp: parseInt(item[0])
      }));
    } catch (error) {
      throw new Error(`Bybit getKlines error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 获取最新价格
   */
  async getPrice(symbol: string): Promise<number> {
    try {
      const response = await this.client.get('/v5/market/tickers', {
        params: { 
          category: 'linear',
          symbol 
        }
      });

      if (response.data.retCode !== 0) {
        throw new Error(response.data.retMsg);
      }

      return parseFloat(response.data.result.list[0].lastPrice);
    } catch (error) {
      throw new Error(`Bybit getPrice error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 获取所有支持的交易对
   */
  async getSymbols(): Promise<string[]> {
    try {
      const response = await this.client.get('/v5/market/instruments-info', {
        params: { category: 'linear' }
      });

      if (response.data.retCode !== 0) {
        throw new Error(response.data.retMsg);
      }

      return response.data.result.list
        .filter((inst: any) => inst.status === 'Trading' && inst.symbol.endsWith('USDT'))
        .map((inst: any) => inst.symbol);
    } catch (error) {
      throw new Error(`Bybit getSymbols error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 下单（需要配置 BYBIT_API_KEY、BYBIT_API_SECRET）
   */
  async placeOrder(params: PlaceOrderParams): Promise<any> {
    if (!this.apiKey || !this.apiSecret) {
      throw new Error('未配置 BYBIT_API_KEY 或 BYBIT_API_SECRET');
    }

    const recvWindow = 5000;
    const timestamp = Date.now().toString();
    const body: Record<string, string> = {
      category: 'linear',
      symbol: params.symbol,
      side: params.side,
      orderType: params.orderType,
      qty: params.qty
    };
    if (params.orderType === 'Limit' && params.price) {
      body.price = params.price;
    }

    const bodyStr = JSON.stringify(body);
    const signPayload = timestamp + this.apiKey + recvWindow + bodyStr;
    const signature = crypto
      .createHmac('sha256', this.apiSecret)
      .update(signPayload)
      .digest('hex');

    try {
      const response = await this.client.post('/v5/order/create', body, {
        headers: {
          'X-BAPI-API-KEY': this.apiKey,
          'X-BAPI-TIMESTAMP': timestamp,
          'X-BAPI-SIGN': signature,
          'X-BAPI-RECV-WINDOW': String(recvWindow)
        }
      });

      if (response.data.retCode !== 0) {
        throw new Error(response.data.retMsg || 'Unknown error');
      }
      return response.data.result;
    } catch (error: any) {
      const msg = error.response?.data?.retMsg ?? error.message;
      throw new Error(`Bybit placeOrder error: ${msg}`);
    }
  }

  /**
   * WebSocket连接
   */
  subscribeToStream(symbol: string, topic: string, callback: (data: any) => void) {
    const WebSocket = require('ws');
    
    const ws = new WebSocket(this.wsUrl);

    ws.on('open', () => {
      const subscribeMsg = {
        op: 'subscribe',
        args: [`${topic}.${symbol}`]
      };
      ws.send(JSON.stringify(subscribeMsg));
    });

    ws.on('message', (data: string) => {
      try {
        const parsed = JSON.parse(data);
        if (parsed.topic && parsed.data) {
          callback(parsed.data);
        }
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

export default BybitAPI;
