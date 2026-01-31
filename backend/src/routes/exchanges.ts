import { Router, Request, Response } from 'express';
import { BinanceAPI } from '../exchanges/binance';
import { BybitAPI } from '../exchanges/bybit';
import { OKXAPI } from '../exchanges/okx';

const router = Router();

// 初始化交易所 API 实例
const binanceAPI = new BinanceAPI();
const bybitAPI = new BybitAPI();
const okxAPI = new OKXAPI();

/**
 * GET /api/exchanges/:exchange/funding-rate
 * 获取指定交易对的资金费率
 */
router.get('/exchanges/:exchange/funding-rate', async (req: Request, res: Response) => {
  try {
    const { exchange } = req.params;
    const { symbol } = req.query;

    if (!symbol || typeof symbol !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'symbol parameter is required',
        timestamp: Date.now()
      });
    }

    let data;
    switch (exchange) {
      case 'binance':
        data = await binanceAPI.getFundingRate(symbol);
        break;
      case 'bybit':
        data = await bybitAPI.getFundingRate(symbol);
        break;
      case 'okx':
        data = await okxAPI.getFundingRate(symbol);
        break;
      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid exchange. Supported: binance, bybit, okx',
          timestamp: Date.now()
        });
    }

    res.json({
      success: true,
      data,
      timestamp: Date.now()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      timestamp: Date.now()
    });
  }
});

/**
 * GET /api/exchanges/:exchange/funding-rates
 * 获取所有交易对的资金费率
 */
router.get('/exchanges/:exchange/funding-rates', async (req: Request, res: Response) => {
  try {
    const { exchange } = req.params;

    let data;
    switch (exchange) {
      case 'binance':
        data = await binanceAPI.getAllFundingRates();
        break;
      case 'bybit':
        data = await bybitAPI.getAllFundingRates();
        break;
      case 'okx':
        data = await okxAPI.getAllFundingRates();
        break;
      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid exchange. Supported: binance, bybit, okx',
          timestamp: Date.now()
        });
    }

    res.json({
      success: true,
      data,
      timestamp: Date.now()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      timestamp: Date.now()
    });
  }
});

/**
 * GET /api/exchanges/:exchange/order-book
 * 获取订单簿
 */
router.get('/exchanges/:exchange/order-book', async (req: Request, res: Response) => {
  try {
    const { exchange } = req.params;
    const { symbol, limit } = req.query;

    if (!symbol || typeof symbol !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'symbol parameter is required',
        timestamp: Date.now()
      });
    }

    const limitNum = limit ? parseInt(limit as string) : 20;

    let data;
    switch (exchange) {
      case 'binance':
        data = await binanceAPI.getOrderBook(symbol, limitNum);
        break;
      case 'bybit':
        data = await bybitAPI.getOrderBook(symbol, limitNum);
        break;
      case 'okx':
        data = await okxAPI.getOrderBook(symbol, limitNum);
        break;
      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid exchange. Supported: binance, bybit, okx',
          timestamp: Date.now()
        });
    }

    res.json({
      success: true,
      data,
      timestamp: Date.now()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      timestamp: Date.now()
    });
  }
});

/**
 * GET /api/exchanges/:exchange/klines
 * 获取K线数据
 */
router.get('/exchanges/:exchange/klines', async (req: Request, res: Response) => {
  try {
    const { exchange } = req.params;
    const { symbol, interval, limit } = req.query;

    if (!symbol || typeof symbol !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'symbol parameter is required',
        timestamp: Date.now()
      });
    }

    const intervalStr = (interval as string) || '1h';
    const limitNum = limit ? parseInt(limit as string) : 100;

    let data;
    switch (exchange) {
      case 'binance':
        data = await binanceAPI.getKlines(symbol, intervalStr, limitNum);
        break;
      case 'bybit':
        data = await bybitAPI.getKlines(symbol, intervalStr, limitNum);
        break;
      case 'okx':
        data = await okxAPI.getKlines(symbol, intervalStr, limitNum);
        break;
      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid exchange. Supported: binance, bybit, okx',
          timestamp: Date.now()
        });
    }

    res.json({
      success: true,
      data,
      timestamp: Date.now()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      timestamp: Date.now()
    });
  }
});

/**
 * GET /api/exchanges/:exchange/price
 * 获取最新价格
 */
router.get('/exchanges/:exchange/price', async (req: Request, res: Response) => {
  try {
    const { exchange } = req.params;
    const { symbol } = req.query;

    if (!symbol || typeof symbol !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'symbol parameter is required',
        timestamp: Date.now()
      });
    }

    let price;
    switch (exchange) {
      case 'binance':
        price = await binanceAPI.getPrice(symbol);
        break;
      case 'bybit':
        price = await bybitAPI.getPrice(symbol);
        break;
      case 'okx':
        price = await okxAPI.getPrice(symbol);
        break;
      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid exchange. Supported: binance, bybit, okx',
          timestamp: Date.now()
        });
    }

    res.json({
      success: true,
      data: { price },
      timestamp: Date.now()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      timestamp: Date.now()
    });
  }
});

/**
 * GET /api/exchanges/:exchange/symbols
 * 获取所有支持的交易对
 */
router.get('/exchanges/:exchange/symbols', async (req: Request, res: Response) => {
  try {
    const { exchange } = req.params;

    let symbols;
    switch (exchange) {
      case 'binance':
        symbols = await binanceAPI.getSymbols();
        break;
      case 'bybit':
        symbols = await bybitAPI.getSymbols();
        break;
      case 'okx':
        symbols = await okxAPI.getSymbols();
        break;
      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid exchange. Supported: binance, bybit, okx',
          timestamp: Date.now()
        });
    }

    res.json({
      success: true,
      data: { symbols },
      timestamp: Date.now()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      timestamp: Date.now()
    });
  }
});

/**
 * GET /api/exchanges/:exchange/exchange-info
 * 获取交易所信息（仅币安支持）
 */
router.get('/exchanges/:exchange/exchange-info', async (req: Request, res: Response) => {
  try {
    const { exchange } = req.params;

    let data;
    switch (exchange) {
      case 'binance':
        data = await binanceAPI.getExchangeInfo();
        break;
      default:
        return res.status(400).json({
          success: false,
          error: 'Exchange info endpoint is only supported for Binance',
          timestamp: Date.now()
        });
    }

    res.json({
      success: true,
      data,
      timestamp: Date.now()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      timestamp: Date.now()
    });
  }
});

/**
 * GET /api/exchanges/:exchange/ticker-24hr
 * 获取24小时价格变动（仅币安支持）
 */
router.get('/exchanges/:exchange/ticker-24hr', async (req: Request, res: Response) => {
  try {
    const { exchange } = req.params;
    const { symbol } = req.query;

    if (!symbol || typeof symbol !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'symbol parameter is required',
        timestamp: Date.now()
      });
    }

    let data;
    switch (exchange) {
      case 'binance':
        data = await binanceAPI.get24hrTicker(symbol);
        break;
      default:
        return res.status(400).json({
          success: false,
          error: '24hr ticker endpoint is only supported for Binance',
          timestamp: Date.now()
        });
    }

    res.json({
      success: true,
      data,
      timestamp: Date.now()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      timestamp: Date.now()
    });
  }
});

/**
 * POST /api/exchanges/:exchange/order
 * 下单（需要 .env 配置对应交易所 API Key）
 */
router.post('/exchanges/:exchange/order', async (req: Request, res: Response) => {
  try {
    const { exchange } = req.params;
    const body = req.body;

    let data;
    switch (exchange) {
      case 'binance':
        data = await binanceAPI.placeOrder({
          symbol: String(body.symbol || '').trim(),
          side: (String(body.side || 'BUY').trim().toUpperCase() as 'BUY' | 'SELL'),
          type: (String(body.type || 'MARKET').trim().toUpperCase() as 'MARKET' | 'LIMIT'),
          quantity: String(body.quantity || '').trim(),
          price: body.price ? String(body.price).trim() : undefined,
          positionSide: body.positionSide ? (String(body.positionSide).trim().toUpperCase() as 'BOTH' | 'LONG' | 'SHORT') : undefined
        });
        break;
      case 'okx': {
        const instId = String(body.instId || '').trim();
        const sz = String(body.sz || '1').trim();
        if (!instId) {
          return res.status(400).json({
            success: false,
            error: 'instId is required',
            timestamp: Date.now()
          });
        }
        const posSideRaw = body.posSide ? String(body.posSide).trim().toLowerCase() : undefined;
        const posSide = posSideRaw && ['long', 'short', 'net'].includes(posSideRaw)
          ? (posSideRaw as 'long' | 'short' | 'net') : undefined;
        data = await okxAPI.placeOrder({
          instId,
          tdMode: (String(body.tdMode || 'cross').trim().toLowerCase()) as 'cross' | 'isolated',
          side: (String(body.side || 'buy').trim().toLowerCase()) as 'buy' | 'sell',
          ordType: (String(body.ordType || 'market').trim().toLowerCase()) as 'market' | 'limit',
          sz: sz || '1',
          px: body.px ? String(body.px).trim() : undefined,
          posSide
        });
        break;
      }
      case 'bybit':
        data = await bybitAPI.placeOrder({
          symbol: body.symbol,
          side: body.side,
          orderType: body.orderType || 'Market',
          qty: body.qty,
          price: body.price
        });
        break;
      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid exchange. Supported: binance, bybit, okx',
          timestamp: Date.now()
        });
    }

    res.json({
      success: true,
      data,
      timestamp: Date.now()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      timestamp: Date.now()
    });
  }
});

export default router;
