import { Router, Request, Response } from 'express';
import DatabaseService from '../database/service';
import { QueryFilter } from '../types';
import { computeRealtimeOpportunities } from '../arbitrage/realtime';

const router = Router();
const db = new DatabaseService();

/**
 * GET /api/opportunities
 * 获取套利机会列表
 * - 默认优先查数据库；若为空则实时从交易所计算
 * - ?realtime=1 强制实时计算
 */
router.get('/opportunities', async (req: Request, res: Response) => {
  try {
    const filter: QueryFilter = {
      symbol: req.query.symbol as string,
      minSpread: req.query.minSpread ? parseFloat(req.query.minSpread as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
      offset: req.query.offset ? parseInt(req.query.offset as string) : 0
    };
    const forceRealtime = req.query.realtime === '1' || req.query.realtime === 'true';

    let opportunities = await db.queryOpportunities(filter);
    if (forceRealtime || opportunities.length === 0) {
      opportunities = await computeRealtimeOpportunities({
        symbol: filter.symbol,
        minSpread: filter.minSpread ?? 0.01,
        limit: filter.limit ?? 50,
        offset: filter.offset ?? 0
      });
    }

    res.json({
      success: true,
      data: opportunities,
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
 * GET /api/opportunities/latest
 * 获取最新套利机会
 * - 默认优先查数据库；若为空则实时从交易所计算
 * - ?realtime=1 强制实时计算
 */
router.get('/opportunities/latest', async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
    const forceRealtime = req.query.realtime === '1' || req.query.realtime === 'true';

    let opportunities = await db.getLatestOpportunities(limit);
    if (forceRealtime || opportunities.length === 0) {
      opportunities = await computeRealtimeOpportunities({ limit });
    }

    res.json({
      success: true,
      data: opportunities,
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
 * GET /api/funding-rates/latest
 * 获取最新资金费率
 */
router.get('/funding-rates/latest', async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
    const rates = await db.getLatestFundingRates(limit);

    res.json({
      success: true,
      data: rates,
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
 * GET /api/funding-rates/history
 * 获取历史资金费率
 */
router.get('/funding-rates/history', async (req: Request, res: Response) => {
  try {
    const symbol = req.query.symbol as string;
    const exchange = req.query.exchange as string;
    const hours = req.query.hours ? parseInt(req.query.hours as string) : 24;

    if (!symbol || !exchange) {
      return res.status(400).json({
        success: false,
        error: 'symbol and exchange are required',
        timestamp: Date.now()
      });
    }

    const history = await db.getFundingRateHistory(symbol, exchange, hours);

    res.json({
      success: true,
      data: history,
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
 * GET /api/statistics
 * 获取统计数据
 */
router.get('/statistics', async (req: Request, res: Response) => {
  try {
    const hours = req.query.hours ? parseInt(req.query.hours as string) : 24;
    const stats = await db.getStatistics(hours);

    res.json({
      success: true,
      data: stats,
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
 * DELETE /api/cleanup
 * 清理旧数据
 */
router.delete('/cleanup', async (req: Request, res: Response) => {
  try {
    const days = req.query.days ? parseInt(req.query.days as string) : 30;
    const deletedCount = await db.cleanOldData(days);

    res.json({
      success: true,
      data: { deletedCount },
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
 * GET /api/health
 * 健康检查
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const isHealthy = await db.testConnection();
    
    res.json({
      success: true,
      data: {
        status: isHealthy ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString()
      },
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
