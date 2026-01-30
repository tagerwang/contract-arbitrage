import axios, { AxiosInstance } from 'axios';
import { Exchange, FundingRate, OrderBook, Kline } from '../types';

/**
 * OKX交易所API封装
 */
export class OKXAPI {
  private client: AxiosInstance;
  private wsUrl: string;

  constructor() {
    this.client = axios.create({
      baseURL: 'https://www.okx.com',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    this.wsUrl = 'wss://ws.okx.com:8443/ws/v5/public';
  }

  /**
   * 标准化交易对格式 (BTCUSDT -> BTC-USDT-SWAP)
   */
  private normalizeSymbol(symbol: string): string {
    if (symbol.includes('-')) return symbol;
    
    const match = symbol.match(/^(.+?)(USDT|USD)$/);
    if (match) {
      return `${match[1]}-${match[2]}-SWAP`;
    }
    return symbol;
  }

  /**
   * 反标准化交易对格式 (BTC-USDT-SWAP -> BTCUSDT)
   */
  private denormalizeSymbol(instId: string): string {
    return instId.replace(/-/g, '').replace('SWAP', '');
  }

  /**
   * 获取资金费率
   */
  async getFundingRate(symbol: string): Promise<FundingRate> {
    try {
      const instId = this.normalizeSymbol(symbol);
      const response = await this.client.get('/api/v5/public/funding-rate', {
        params: { instId }
      });

      if (response.data.code !== '0') {
        throw new Error(response.data.msg);
      }

      const data = response.data.data[0];
      
      return {
        exchange: Exchange.OKX,
        symbol: this.denormalizeSymbol(data.instId),
        fundingRate: parseFloat(data.fundingRate),
        fundingTime: parseInt(data.nextFundingTime),
        timestamp: parseInt(data.fundingTime)
      };
    } catch (error) {
      throw new Error(`OKX getFundingRate error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 批量获取所有交易对的资金费率
   */
  async getAllFundingRates(): Promise<FundingRate[]> {
    try {
      const response = await this.client.get('/api/v5/public/funding-rate', {
        params: { instType: 'SWAP' }
      });

      if (response.data.code !== '0') {
        throw new Error(response.data.msg);
      }

      return response.data.data.map((data: any) => ({
        exchange: Exchange.OKX,
        symbol: this.denormalizeSymbol(data.instId),
        fundingRate: parseFloat(data.fundingRate),
        fundingTime: parseInt(data.nextFundingTime),
        timestamp: parseInt(data.fundingTime)
      }));
    } catch (error) {
      throw new Error(`OKX getAllFundingRates error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 获取订单簿
   */
  async getOrderBook(symbol: string, limit: number = 20): Promise<OrderBook> {
    try {
      const instId = this.normalizeSymbol(symbol);
      const response = await this.client.get('/api/v5/market/books', {
        params: { instId, sz: limit }
      });

      if (response.data.code !== '0') {
        throw new Error(response.data.msg);
      }

      const data = response.data.data[0];

      return {
        exchange: Exchange.OKX,
        symbol: this.denormalizeSymbol(instId),
        bids: data.bids.map((item: string[]) => [
          parseFloat(item[0]),
          parseFloat(item[1])
        ]),
        asks: data.asks.map((item: string[]) => [
          parseFloat(item[0]),
          parseFloat(item[1])
        ]),
        timestamp: parseInt(data.ts)
      };
    } catch (error) {
      throw new Error(`OKX getOrderBook error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 获取K线数据
   */
  async getKlines(
    symbol: string,
    interval: string = '1H',
    limit: number = 100
  ): Promise<Kline[]> {
    try {
      const instId = this.normalizeSymbol(symbol);
      const response = await this.client.get('/api/v5/market/candles', {
        params: { instId, bar: interval, limit }
      });

      if (response.data.code !== '0') {
        throw new Error(response.data.msg);
      }

      return response.data.data.map((item: string[]) => ({
        exchange: Exchange.OKX,
        symbol: this.denormalizeSymbol(instId),
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
      throw new Error(`OKX getKlines error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 获取最新价格
   */
  async getPrice(symbol: string): Promise<number> {
    try {
      const instId = this.normalizeSymbol(symbol);
      const response = await this.client.get('/api/v5/market/ticker', {
        params: { instId }
      });

      if (response.data.code !== '0') {
        throw new Error(response.data.msg);
      }

      return parseFloat(response.data.data[0].last);
    } catch (error) {
      throw new Error(`OKX getPrice error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 获取所有支持的交易对
   */
  async getSymbols(): Promise<string[]> {
    try {
      const response = await this.client.get('/api/v5/public/instruments', {
        params: { instType: 'SWAP' }
      });

      if (response.data.code !== '0') {
        throw new Error(response.data.msg);
      }

      return response.data.data
        .filter((inst: any) => inst.state === 'live' && inst.instId.endsWith('-SWAP'))
        .map((inst: any) => this.denormalizeSymbol(inst.instId));
    } catch (error) {
      throw new Error(`OKX getSymbols error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * WebSocket连接
   */
  subscribeToStream(symbol: string, channel: string, callback: (data: any) => void) {
    const WebSocket = require('ws');
    const instId = this.normalizeSymbol(symbol);
    
    const ws = new WebSocket(this.wsUrl);

    ws.on('open', () => {
      const subscribeMsg = {
        op: 'subscribe',
        args: [{
          channel,
          instId
        }]
      };
      ws.send(JSON.stringify(subscribeMsg));
    });

    ws.on('message', (data: string) => {
      try {
        const parsed = JSON.parse(data);
        if (parsed.data) {
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

export default OKXAPI;
