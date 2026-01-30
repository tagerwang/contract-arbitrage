import { Pool, PoolClient } from 'pg';
import {
  FundingRateRecord,
  ArbitrageRecord,
  PriceRecord,
  Statistics,
  QueryFilter,
  ArbitrageOpportunity
} from '../types';

/**
 * 数据库服务类
 */
export class DatabaseService {
  private pool: Pool;

  constructor(config?: any) {
    this.pool = new Pool(config || {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'arbitrage_db',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    this.pool.on('error', (err) => {
      console.error('Unexpected database error:', err);
    });
  }

  /**
   * 测试数据库连接
   */
  async testConnection(): Promise<boolean> {
    let client: PoolClient | null = null;
    try {
      client = await this.pool.connect();
      const result = await client.query('SELECT NOW()');
      console.log('✓ Database connected successfully:', result.rows[0].now);
      return true;
    } catch (error) {
      console.error('✗ Database connection failed:', error instanceof Error ? error.message : String(error));
      return false;
    } finally {
      if (client) client.release();
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
    const client = await this.pool.connect();
    try {
      const query = `
        INSERT INTO funding_rates 
        (exchange, symbol, funding_rate, funding_time, mark_price, index_price, recorded_at)
        VALUES ($1, $2, $3, to_timestamp($4/1000.0), $5, $6, $7)
        RETURNING id
      `;
      
      const values = [
        rate.exchange,
        rate.symbol,
        rate.funding_rate,
        rate.funding_time,
        rate.mark_price,
        rate.index_price,
        rate.recorded_at || new Date()
      ];

      const result = await client.query(query, values);
      return result.rows[0].id;
    } finally {
      client.release();
    }
  }

  /**
   * 批量保存资金费率
   */
  async saveFundingRatesBatch(rates: FundingRateRecord[]): Promise<number> {
    if (rates.length === 0) return 0;

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const query = `
        INSERT INTO funding_rates 
        (exchange, symbol, funding_rate, funding_time, mark_price, index_price, recorded_at)
        VALUES ($1, $2, $3, to_timestamp($4/1000.0), $5, $6, $7)
      `;

      let count = 0;
      for (const rate of rates) {
        const values = [
          rate.exchange,
          rate.symbol,
          rate.funding_rate,
          rate.funding_time,
          rate.mark_price,
          rate.index_price,
          rate.recorded_at || new Date()
        ];
        await client.query(query, values);
        count++;
      }

      await client.query('COMMIT');
      return count;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error instanceof Error ? error : new Error(String(error));
    } finally {
      client.release();
    }
  }


  /**
   * 获取最新资金费率
   */
  async getLatestFundingRates(limit: number = 100): Promise<FundingRateRecord[]> {
    const query = `
      SELECT * FROM funding_rates
      ORDER BY recorded_at DESC
      LIMIT $1
    `;
    
    const result = await this.pool.query(query, [limit]);
    return result.rows;
  }

  /**
   * 根据交易对和交易所获取历史费率
   */
  async getFundingRateHistory(
    symbol: string,
    exchange: string,
    hours: number = 24
  ): Promise<FundingRateRecord[]> {
    const query = `
      SELECT * FROM funding_rates
      WHERE symbol = $1 AND exchange = $2
        AND recorded_at >= NOW() - INTERVAL '${hours} hours'
      ORDER BY recorded_at DESC
    `;
    
    const result = await this.pool.query(query, [symbol, exchange]);
    return result.rows;
  }

  // ==================== 套利机会相关 ====================

  /**
   * 保存套利机会
   */
  async saveArbitrageOpportunity(opp: ArbitrageOpportunity): Promise<number> {
    const client = await this.pool.connect();
    try {
      const query = `
        INSERT INTO arbitrage_opportunities
        (symbol, long_exchange, short_exchange, long_rate, short_rate,
         spread_rate, annualized_return, long_price, short_price,
         price_diff, price_spread_percent, confidence, detected_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING id
      `;

      const values = [
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
        opp.createdAt || new Date()
      ];

      const result = await client.query(query, values);
      return result.rows[0].id;
    } finally {
      client.release();
    }
  }

  /**
   * 批量保存套利机会
   */
  async saveArbitrageOpportunitiesBatch(opportunities: ArbitrageOpportunity[]): Promise<number> {
    if (opportunities.length === 0) return 0;

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const query = `
        INSERT INTO arbitrage_opportunities
        (symbol, long_exchange, short_exchange, long_rate, short_rate,
         spread_rate, annualized_return, long_price, short_price,
         price_diff, price_spread_percent, confidence, detected_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      `;

      let count = 0;
      for (const opp of opportunities) {
        const values = [
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
          opp.createdAt || new Date()
        ];
        await client.query(query, values);
        count++;
      }

      await client.query('COMMIT');
      return count;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error instanceof Error ? error : new Error(String(error));
    } finally {
      client.release();
    }
  }

  /**
   * 获取最新套利机会
   */
  async getLatestOpportunities(limit: number = 50): Promise<ArbitrageRecord[]> {
    const query = `
      SELECT * FROM arbitrage_opportunities
      ORDER BY detected_at DESC
      LIMIT $1
    `;
    
    const result = await this.pool.query(query, [limit]);
    return result.rows;
  }

  /**
   * 根据条件查询套利机会
   */
  async queryOpportunities(filter: QueryFilter): Promise<ArbitrageRecord[]> {
    let query = 'SELECT * FROM arbitrage_opportunities WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (filter.symbol) {
      query += ` AND symbol = $${paramIndex++}`;
      params.push(filter.symbol);
    }

    if (filter.minSpread !== undefined) {
      query += ` AND spread_rate >= $${paramIndex++}`;
      params.push(filter.minSpread);
    }

    if (filter.startTime) {
      query += ` AND detected_at >= $${paramIndex++}`;
      params.push(filter.startTime);
    }

    if (filter.endTime) {
      query += ` AND detected_at <= $${paramIndex++}`;
      params.push(filter.endTime);
    }

    query += ' ORDER BY detected_at DESC';

    if (filter.limit) {
      query += ` LIMIT $${paramIndex++}`;
      params.push(filter.limit);
    }

    if (filter.offset) {
      query += ` OFFSET $${paramIndex++}`;
      params.push(filter.offset);
    }

    const result = await this.pool.query(query, params);
    return result.rows;
  }

  // ==================== 统计分析 ====================

  /**
   * 获取统计数据
   */
  async getStatistics(hours: number = 24): Promise<Statistics> {
    const client = await this.pool.connect();
    try {
      // 总机会数
      const totalQuery = `
        SELECT COUNT(*) as total
        FROM arbitrage_opportunities
        WHERE detected_at >= NOW() - INTERVAL '${hours} hours'
      `;
      const totalResult = await client.query(totalQuery);
      const totalOpportunities = parseInt(totalResult.rows[0].total);

      // 平均费差和年化收益
      const avgQuery = `
        SELECT 
          AVG(spread_rate) as avg_spread,
          AVG(annualized_return) as avg_return
        FROM arbitrage_opportunities
        WHERE detected_at >= NOW() - INTERVAL '${hours} hours'
      `;
      const avgResult = await client.query(avgQuery);
      const avgSpread = parseFloat(avgResult.rows[0].avg_spread) || 0;
      const avgAnnualizedReturn = parseFloat(avgResult.rows[0].avg_return) || 0;

      // 热门交易对
      const topSymbolsQuery = `
        SELECT 
          symbol,
          COUNT(*) as count,
          AVG(spread_rate) as avg_spread
        FROM arbitrage_opportunities
        WHERE detected_at >= NOW() - INTERVAL '${hours} hours'
        GROUP BY symbol
        ORDER BY count DESC
        LIMIT 10
      `;
      const topSymbolsResult = await client.query(topSymbolsQuery);
      const topSymbols = topSymbolsResult.rows.map(row => ({
        symbol: row.symbol,
        count: parseInt(row.count),
        avgSpread: parseFloat(row.avg_spread)
      }));

      // 交易所配对统计
      const exchangePairsQuery = `
        SELECT 
          long_exchange,
          short_exchange,
          COUNT(*) as count,
          AVG(spread_rate) as avg_spread
        FROM arbitrage_opportunities
        WHERE detected_at >= NOW() - INTERVAL '${hours} hours'
        GROUP BY long_exchange, short_exchange
        ORDER BY count DESC
        LIMIT 10
      `;
      const exchangePairsResult = await client.query(exchangePairsQuery);
      const exchangePairs = exchangePairsResult.rows.map(row => ({
        longExchange: row.long_exchange,
        shortExchange: row.short_exchange,
        count: parseInt(row.count),
        avgSpread: parseFloat(row.avg_spread)
      }));

      return {
        totalOpportunities,
        avgSpread,
        avgAnnualizedReturn,
        topSymbols,
        exchangePairs
      };
    } finally {
      client.release();
    }
  }

  /**
   * 清理旧数据
   */
  async cleanOldData(days: number = 30): Promise<number> {
    const client = await this.pool.connect();
    try {
      const query = `
        DELETE FROM arbitrage_opportunities
        WHERE detected_at < NOW() - INTERVAL '${days} days'
      `;
      const result = await client.query(query);
      return result.rowCount || 0;
    } finally {
      client.release();
    }
  }
}

export default DatabaseService;
