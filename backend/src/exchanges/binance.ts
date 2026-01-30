import axios, { AxiosInstance } from 'axios';
import { Exchange, FundingRate, OrderBook, Kline } from '../types';

/**
 * 币安交易所API封装
 */
export class BinanceAPI {
  private client: AxiosInstance;
  private wsUrl: string;

  constructor() {
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
