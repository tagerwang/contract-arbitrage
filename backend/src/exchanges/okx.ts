import axios, { AxiosInstance } from 'axios';
import crypto from 'crypto';
import { Exchange, FundingRate, OrderBook, Kline } from '../types';

/** 下单参数 */
export interface PlaceOrderParams {
  instId: string;      // 如 BTC-USDT-SWAP
  tdMode: string;      // cross | isolated
  side: 'buy' | 'sell';
  ordType: 'market' | 'limit';
  sz: string;
  px?: string;         // 限价单价格
  /** 持仓方向：long/short（双向持仓）或 net（单向持仓）。不传则按 side 推断 */
  posSide?: 'long' | 'short' | 'net';
}

/**
 * OKX交易所API封装
 */
export class OKXAPI {
  private client: AxiosInstance;
  private wsUrl: string;
  private apiKey?: string;
  private apiSecret?: string;
  private passphrase?: string;

  constructor() {
    this.apiKey = process.env.OKX_API_KEY;
    this.apiSecret = process.env.OKX_API_SECRET;
    this.passphrase = process.env.OKX_PASSPHRASE;
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
   * 获取 USDT 永续合约的 instId 列表
   * OKX funding-rate 接口必须传 instId，不支持仅传 instType
   */
  private async getUSDTSwapInstIds(): Promise<string[]> {
    const response = await this.client.get('/api/v5/public/instruments', {
      params: { instType: 'SWAP' }
    });
    if (response.data.code !== '0') {
      throw new Error(response.data.msg);
    }
    const data = response.data.data as Array<{ instId: string; settleCcy?: string }>;
    return data
      .filter((d) => d.instId.endsWith('-USDT-SWAP') && !d.instId.includes('_UM'))
      .map((d) => d.instId);
  }

  /**
   * 批量获取所有交易对的资金费率
   * OKX 需先获取 instruments 列表，再逐个请求 funding-rate（接口强制要求 instId）
   * 使用并发分批请求以控制速率
   */
  async getAllFundingRates(): Promise<FundingRate[]> {
    try {
      const instIds = await this.getUSDTSwapInstIds();
      const concurrency = 10;
      const delayMs = 120; // ~8 req/s，留余量避免限流
      const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

      const fetchOne = async (instId: string): Promise<FundingRate | null> => {
        try {
          const response = await this.client.get('/api/v5/public/funding-rate', {
            params: { instId }
          });
          if (response.data.code !== '0') return null;
          const data = response.data.data?.[0];
          if (!data) return null;
          return {
            exchange: Exchange.OKX,
            symbol: this.denormalizeSymbol(data.instId),
            fundingRate: parseFloat(data.fundingRate),
            fundingTime: parseInt(data.nextFundingTime),
            timestamp: parseInt(data.fundingTime)
          };
        } catch {
          return null;
        }
      };

      const results: FundingRate[] = [];
      for (let i = 0; i < instIds.length; i += concurrency) {
        const batch = instIds.slice(i, i + concurrency);
        const batchResults = await Promise.all(batch.map(fetchOne));
        results.push(...(batchResults.filter((r): r is FundingRate => r !== null)));
        if (i + concurrency < instIds.length) await sleep(delayMs);
      }
      return results;
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
        .map((inst: any) => inst.instId);
    } catch (error) {
      throw new Error(`OKX getSymbols error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 下单（需要配置 OKX_API_KEY、OKX_API_SECRET、OKX_PASSPHRASE）
   */
  async placeOrder(params: PlaceOrderParams): Promise<any> {
    if (!this.apiKey || !this.apiSecret || !this.passphrase) {
      throw new Error('未配置 OKX_API_KEY、OKX_API_SECRET 或 OKX_PASSPHRASE');
    }

    const instId = params.instId.includes('-') ? params.instId : this.normalizeSymbol(params.instId);
    const posSide = params.posSide ?? (params.side === 'buy' ? 'long' : 'short');
    const body: Record<string, string> = {
      instId,
      tdMode: params.tdMode,
      side: params.side,
      ordType: params.ordType,
      sz: params.sz,
      posSide
    };
    if (params.ordType === 'limit' && params.px) {
      body.px = params.px;
    }

    const method = 'POST';
    const requestPath = '/api/v5/trade/order';
    const bodyStr = JSON.stringify(body);
    const timestamp = new Date().toISOString();
    const prehash = timestamp + method + requestPath + bodyStr;
    const sign = crypto
      .createHmac('sha256', this.apiSecret)
      .update(prehash)
      .digest('base64');

    try {
      const response = await this.client.post(requestPath, body, {
        headers: {
          'OK-ACCESS-KEY': this.apiKey,
          'OK-ACCESS-SIGN': sign,
          'OK-ACCESS-TIMESTAMP': timestamp,
          'OK-ACCESS-PASSPHRASE': this.passphrase
        }
      });

      if (response.data.code !== '0') {
        const firstErr = response.data.data?.[0];
        const detail = firstErr?.sMsg || firstErr?.sCode
          ? `[${firstErr.sCode || ''}] ${firstErr.sMsg || ''}`.trim()
          : response.data.msg;
        throw new Error(detail || 'All operations failed');
      }
      return response.data.data?.[0] ?? response.data;
    } catch (error: any) {
      const data = error.response?.data;
      const firstErr = data?.data?.[0];
      const detail = firstErr?.sMsg || firstErr?.sCode
        ? `[${firstErr.sCode || ''}] ${firstErr.sMsg || ''}`.trim()
        : data?.msg;
      const msg = detail || error.message || 'All operations failed';
      throw new Error(`OKX placeOrder error: ${msg}`);
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
