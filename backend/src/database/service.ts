import dotenv from 'dotenv';

dotenv.config();

import mysql from 'mysql2/promise';
import type { Pool } from 'mysql2/promise';
import {
  FundingRateRecord,
  ArbitrageRecord,
  Statistics,
  QueryFilter,
  ArbitrageOpportunity
} from '../types';

/**
 * 数据库服务类（MySQL 8）
 */
export class DatabaseService {
  private pool: Pool;

  constructor(config?: mysql.PoolOptions) {
    this.pool = mysql.createPool(
      config || {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '3306', 10),
        database: process.env.DB_NAME || 'arbitrage_db',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        waitForConnections: true,
        connectionLimit: 20,
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 0,
      }
    );
  }

  /**
   * 测试数据库连接
   */
  async testConnection(): Promise<boolean> {
    try {
      const [rows] = await this.pool.query<mysql.RowDataPacket[]>('SELECT NOW() AS now');
      const row = Array.isArray(rows) ? rows[0] : rows;
      console.log('✓ Database connected successfully:', row?.now);
      return true;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error('✗ Database connection failed:', msg || '(无详情)');
      console.error('  请检查 .env 中 DB_HOST、DB_PORT、DB_NAME、DB_USER、DB_PASSWORD（MySQL 8）');
      console.error('  若未初始化数据库，请先执行: npm run db:init');
      return false;
    }
  }

  /**
   * 关闭连接池
   */
  async close(): Promise<void> {
    await this.pool.end();
  }

  // ==================== 资金费率相关 ====================

  /**
   * 保存资金费率记录
   */
  async saveFundingRate(rate: FundingRateRecord): Promise<number> {
    const [result] = await this.pool.query<mysql.ResultSetHeader>(
      `INSERT INTO funding_rates 
       (exchange, symbol, funding_rate, funding_time, mark_price, index_price, recorded_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        rate.exchange,
        rate.symbol,
        rate.funding_rate,
        new Date(rate.funding_time),
        rate.mark_price ?? null,
        rate.index_price ?? null,
        rate.recorded_at || new Date(),
      ]
    );
    return result.insertId;
  }

  /**
   * 批量保存资金费率
   */
  async saveFundingRatesBatch(rates: FundingRateRecord[]): Promise<number> {
    if (rates.length === 0) return 0;

    const conn = await this.pool.getConnection();
    try {
      await conn.beginTransaction();

      const sql = `INSERT INTO funding_rates 
        (exchange, symbol, funding_rate, funding_time, mark_price, index_price, recorded_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)`;

      let count = 0;
      for (const rate of rates) {
        await conn.query(sql, [
          rate.exchange,
          rate.symbol,
          rate.funding_rate,
          new Date(rate.funding_time),
          rate.mark_price ?? null,
          rate.index_price ?? null,
          rate.recorded_at || new Date(),
        ]);
        count++;
      }

      await conn.commit();
      return count;
    } catch (error) {
      await conn.rollback();
      throw error instanceof Error ? error : new Error(String(error));
    } finally {
      conn.release();
    }
  }

  /**
   * 获取最新资金费率
   */
  async getLatestFundingRates(limit: number = 100): Promise<FundingRateRecord[]> {
    const [rows] = await this.pool.query<mysql.RowDataPacket[]>(
      'SELECT * FROM funding_rates ORDER BY recorded_at DESC LIMIT ?',
      [limit]
    );
    return (Array.isArray(rows) ? rows : []) as FundingRateRecord[];
  }

  /**
   * 根据交易对和交易所获取历史费率
   */
  async getFundingRateHistory(
    symbol: string,
    exchange: string,
    hours: number = 24
  ): Promise<FundingRateRecord[]> {
    const [rows] = await this.pool.query<mysql.RowDataPacket[]>(
      `SELECT * FROM funding_rates 
       WHERE symbol = ? AND exchange = ? AND recorded_at >= DATE_SUB(NOW(), INTERVAL ? HOUR)
       ORDER BY recorded_at DESC`,
      [symbol, exchange, hours]
    );
    return (Array.isArray(rows) ? rows : []) as FundingRateRecord[];
  }

  // ==================== 套利机会相关 ====================

  /**
   * 保存套利机会
   */
  async saveArbitrageOpportunity(opp: ArbitrageOpportunity): Promise<number> {
    const [result] = await this.pool.query<mysql.ResultSetHeader>(
      `INSERT INTO arbitrage_opportunities
       (symbol, long_exchange, short_exchange, long_rate, short_rate,
        spread_rate, annualized_return, long_price, short_price,
        price_diff, price_spread_percent, confidence, detected_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        opp.symbol,
        opp.longExchange,
        opp.shortExchange,
        opp.longRate,
        opp.shortRate,
        opp.spreadRate,
        opp.annualizedReturn,
        opp.longPrice,
        opp.shortPrice,
        opp.priceDiff,
        opp.priceSpreadPercent,
        opp.confidence,
        opp.createdAt || new Date(),
      ]
    );
    return result.insertId;
  }

  /**
   * 批量保存套利机会
   */
  async saveArbitrageOpportunitiesBatch(opportunities: ArbitrageOpportunity[]): Promise<number> {
    if (opportunities.length === 0) return 0;

    const conn = await this.pool.getConnection();
    try {
      await conn.beginTransaction();

      const sql = `INSERT INTO arbitrage_opportunities
        (symbol, long_exchange, short_exchange, long_rate, short_rate,
         spread_rate, annualized_return, long_price, short_price,
         price_diff, price_spread_percent, confidence, detected_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

      let count = 0;
      for (const opp of opportunities) {
        await conn.query(sql, [
          opp.symbol,
          opp.longExchange,
          opp.shortExchange,
          opp.longRate,
          opp.shortRate,
          opp.spreadRate,
          opp.annualizedReturn,
          opp.longPrice,
          opp.shortPrice,
          opp.priceDiff,
          opp.priceSpreadPercent,
          opp.confidence,
          opp.createdAt || new Date(),
        ]);
        count++;
      }

      await conn.commit();
      return count;
    } catch (error) {
      await conn.rollback();
      throw error instanceof Error ? error : new Error(String(error));
    } finally {
      conn.release();
    }
  }

  /**
   * 获取最新套利机会
   */
  async getLatestOpportunities(limit: number = 50): Promise<ArbitrageRecord[]> {
    const [rows] = await this.pool.query<mysql.RowDataPacket[]>(
      'SELECT * FROM arbitrage_opportunities ORDER BY detected_at DESC LIMIT ?',
      [limit]
    );
    return (Array.isArray(rows) ? rows : []) as ArbitrageRecord[];
  }

  /**
   * 根据条件查询套利机会
   */
  async queryOpportunities(filter: QueryFilter): Promise<ArbitrageRecord[]> {
    let sql = 'SELECT * FROM arbitrage_opportunities WHERE 1=1';
    const params: (string | number | Date | undefined)[] = [];

    if (filter.symbol) {
      sql += ' AND symbol = ?';
      params.push(filter.symbol);
    }
    if (filter.minSpread !== undefined) {
      sql += ' AND spread_rate >= ?';
      params.push(filter.minSpread);
    }
    if (filter.startTime) {
      sql += ' AND detected_at >= ?';
      params.push(filter.startTime);
    }
    if (filter.endTime) {
      sql += ' AND detected_at <= ?';
      params.push(filter.endTime);
    }

    sql += ' ORDER BY detected_at DESC';

    if (filter.limit !== undefined) {
      sql += ' LIMIT ?';
      params.push(filter.limit);
    }
    if (filter.offset !== undefined) {
      sql += ' OFFSET ?';
      params.push(filter.offset);
    }

    const [rows] = await this.pool.query<mysql.RowDataPacket[]>(sql, params);
    return (Array.isArray(rows) ? rows : []) as ArbitrageRecord[];
  }

  // ==================== 统计分析 ====================

  /**
   * 获取统计数据
   */
  async getStatistics(hours: number = 24): Promise<Statistics> {
    const conn = await this.pool.getConnection();
    try {
      const [totalRows] = await conn.query<mysql.RowDataPacket[]>(
        `SELECT COUNT(*) AS total FROM arbitrage_opportunities 
         WHERE detected_at >= DATE_SUB(NOW(), INTERVAL ? HOUR)`,
        [hours]
      );
      const totalOpportunities = parseInt((Array.isArray(totalRows) ? totalRows[0] : totalRows)?.total ?? '0', 10);

      const [avgRows] = await conn.query<mysql.RowDataPacket[]>(
        `SELECT AVG(spread_rate) AS avg_spread, AVG(annualized_return) AS avg_return
         FROM arbitrage_opportunities 
         WHERE detected_at >= DATE_SUB(NOW(), INTERVAL ? HOUR)`,
        [hours]
      );
      const ar = Array.isArray(avgRows) ? avgRows[0] : avgRows;
      const avgSpread = parseFloat(ar?.avg_spread) || 0;
      const avgAnnualizedReturn = parseFloat(ar?.avg_return) || 0;

      const [topSymbolsRows] = await conn.query<mysql.RowDataPacket[]>(
        `SELECT symbol, COUNT(*) AS count, AVG(spread_rate) AS avg_spread
         FROM arbitrage_opportunities 
         WHERE detected_at >= DATE_SUB(NOW(), INTERVAL ? HOUR)
         GROUP BY symbol ORDER BY count DESC LIMIT 10`,
        [hours]
      );
      const topSymbols = (Array.isArray(topSymbolsRows) ? topSymbolsRows : []).map((row) => ({
        symbol: row.symbol,
        count: parseInt(row.count, 10),
        avgSpread: parseFloat(row.avg_spread),
      }));

      const [exchangePairsRows] = await conn.query<mysql.RowDataPacket[]>(
        `SELECT long_exchange AS longExchange, short_exchange AS shortExchange,
                COUNT(*) AS count, AVG(spread_rate) AS avg_spread
         FROM arbitrage_opportunities 
         WHERE detected_at >= DATE_SUB(NOW(), INTERVAL ? HOUR)
         GROUP BY long_exchange, short_exchange ORDER BY count DESC LIMIT 10`,
        [hours]
      );
      const exchangePairs = (Array.isArray(exchangePairsRows) ? exchangePairsRows : []).map((row) => ({
        longExchange: row.longExchange,
        shortExchange: row.shortExchange,
        count: parseInt(row.count, 10),
        avgSpread: parseFloat(row.avg_spread),
      }));

      return {
        totalOpportunities,
        avgSpread,
        avgAnnualizedReturn,
        topSymbols,
        exchangePairs,
      };
    } finally {
      conn.release();
    }
  }

  /**
   * 清理旧数据
   */
  async cleanOldData(days: number = 30): Promise<number> {
    const [result] = await this.pool.query<mysql.ResultSetHeader>(
      'DELETE FROM arbitrage_opportunities WHERE detected_at < DATE_SUB(NOW(), INTERVAL ? DAY)',
      [days]
    );
    return result.affectedRows || 0;
  }
}

export default DatabaseService;
