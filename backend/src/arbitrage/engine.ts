import BinanceAPI from '../exchanges/binance';
import OKXAPI from '../exchanges/okx';
import BybitAPI from '../exchanges/bybit';
import DatabaseService from '../database/service';
import {
  Exchange,
  FundingRate,
  ArbitrageOpportunity,
  SymbolConfig
} from '../types';

/**
 * 套利引擎
 */
export class ArbitrageEngine {
  private binance: BinanceAPI;
  private okx: OKXAPI;
  private bybit: BybitAPI;
  private db: DatabaseService;
  private running: boolean = false;
  private intervalId?: NodeJS.Timeout;

  // 配置参数
  private config = {
    checkInterval: parseInt(process.env.CHECK_INTERVAL_MS || '5000'),
    minProfitThreshold: parseFloat(process.env.MIN_PROFIT_THRESHOLD || '0.3'),
    maxPriceSpread: 0.5, // 最大价格差百分比
    enabledSymbols: ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'DOGEUSDT']
  };

  // 统计数据
  private stats = {
    totalChecks: 0,
    opportunitiesFound: 0,
    lastCheckTime: 0,
    errors: 0
  };

  constructor(db?: DatabaseService) {
    this.binance = new BinanceAPI();
    this.okx = new OKXAPI();
    this.bybit = new BybitAPI();
    this.db = db || new DatabaseService();
  }

  /**
   * 启动监控
   */
  async start(): Promise<void> {
    if (this.running) {
      console.log('⚠ Engine is already running');
      return;
    }

    console.log('🚀 Starting Arbitrage Engine...');
    console.log(`⚙ Check interval: ${this.config.checkInterval}ms`);
    console.log(`⚙ Min profit threshold: ${this.config.minProfitThreshold}%`);
    console.log(`⚙ Monitoring symbols: ${this.config.enabledSymbols.join(', ')}`);

    this.running = true;

    // 立即执行一次检查
    await this.checkArbitrageOpportunities();

    // 定期检查
    this.intervalId = setInterval(async () => {
      await this.checkArbitrageOpportunities();
    }, this.config.checkInterval);
  }

  /**
   * 停止监控
   */
  stop(): void {
    if (!this.running) {
      console.log('⚠ Engine is not running');
      return;
    }

    console.log('🛑 Stopping Arbitrage Engine...');
    this.running = false;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }

    this.printStats();
  }

  /**
   * 检查套利机会
   */
  private async checkArbitrageOpportunities(): Promise<void> {
    const startTime = Date.now();
    this.stats.totalChecks++;

    try {
      console.log(`\n[${new Date().toLocaleTimeString()}] 🔍 Checking arbitrage opportunities...`);

      const opportunities: ArbitrageOpportunity[] = [];

      // 并发获取所有交易所的资金费率
      for (const symbol of this.config.enabledSymbols) {
        try {
          const rates = await this.fetchAllFundingRates(symbol);
          
          // 保存资金费率到数据库
          if (rates.length > 0) {
            await this.saveFundingRates(rates);
          }

          // 分析套利机会
          const opps = this.analyzeFundingRates(rates);
          opportunities.push(...opps);

        } catch (error) {
          console.error(`  ✗ Error processing ${symbol}:`, error instanceof Error ? error.message : String(error));
          this.stats.errors++;
        }
      }

      // 保存发现的套利机会
      if (opportunities.length > 0) {
        await this.saveOpportunities(opportunities);
        this.stats.opportunitiesFound += opportunities.length;

        console.log(`\n✓ Found ${opportunities.length} arbitrage opportunities:`);
        opportunities.forEach(opp => {
          console.log(`  📊 ${opp.symbol}: ${opp.longExchange} ↔ ${opp.shortExchange}`);
          console.log(`     Spread: ${opp.spreadRate.toFixed(4)}% | Annual: ${opp.annualizedReturn.toFixed(2)}%`);
        });
      } else {
        console.log('  ℹ No arbitrage opportunities found');
      }

      this.stats.lastCheckTime = Date.now() - startTime;
      console.log(`  ⏱ Check completed in ${this.stats.lastCheckTime}ms`);

    } catch (error) {
      console.error('✗ Error in checkArbitrageOpportunities:', error instanceof Error ? error.message : String(error));
      this.stats.errors++;
    }
  }


  /**
   * 获取所有交易所的资金费率
   */
  private async fetchAllFundingRates(symbol: string): Promise<FundingRate[]> {
    const promises = [
      this.binance.getFundingRate(symbol).catch(e => null),
      this.okx.getFundingRate(symbol).catch(e => null),
      this.bybit.getFundingRate(symbol).catch(e => null)
    ];

    const results = await Promise.all(promises);
    return results.filter(r => r !== null) as FundingRate[];
  }

  /**
   * 分析资金费率并找出套利机会
   */
  private analyzeFundingRates(rates: FundingRate[]): ArbitrageOpportunity[] {
    if (rates.length < 2) return [];

    const opportunities: ArbitrageOpportunity[] = [];

    // 两两比较所有交易所
    for (let i = 0; i < rates.length; i++) {
      for (let j = i + 1; j < rates.length; j++) {
        const rate1 = rates[i];
        const rate2 = rates[j];

        // 计算费率差
        const spreadRate = Math.abs(rate1.fundingRate - rate2.fundingRate) * 100;
        
        // 检查是否超过阈值
        if (spreadRate < this.config.minProfitThreshold) continue;

        // 确定做多和做空方
        let longRate: FundingRate, shortRate: FundingRate;
        if (rate1.fundingRate < rate2.fundingRate) {
          longRate = rate1;  // 费率低的做多
          shortRate = rate2; // 费率高的做空
        } else {
          longRate = rate2;
          shortRate = rate1;
        }

        // 计算价格差
        const longPrice = longRate.markPrice || 0;
        const shortPrice = shortRate.markPrice || 0;
        const priceDiff = Math.abs(longPrice - shortPrice);
        const priceSpreadPercent = longPrice > 0 ? (priceDiff / longPrice) * 100 : 0;

        // 检查价格差是否在合理范围内
        if (priceSpreadPercent > this.config.maxPriceSpread) continue;

        // 计算年化收益率 (假设每8小时结算一次)
        const annualizedReturn = spreadRate * 3 * 365; // 每天3次，一年365天

        // 计算置信度
        const confidence = this.calculateConfidence(spreadRate, priceSpreadPercent);

        opportunities.push({
          symbol: longRate.symbol,
          longExchange: longRate.exchange,
          shortExchange: shortRate.exchange,
          longRate: longRate.fundingRate * 100,
          shortRate: shortRate.fundingRate * 100,
          spreadRate,
          annualizedReturn,
          longPrice,
          shortPrice,
          priceDiff,
          priceSpreadPercent,
          confidence,
          createdAt: new Date()
        });
      }
    }

    return opportunities.sort((a, b) => b.spreadRate - a.spreadRate);
  }

  /**
   * 计算置信度
   */
  private calculateConfidence(spreadRate: number, priceSpread: number): number {
    let confidence = 1.0;

    // 费差越大，置信度越高
    if (spreadRate < 0.5) confidence *= 0.6;
    else if (spreadRate < 1.0) confidence *= 0.8;

    // 价格差越小，置信度越高
    if (priceSpread > 0.3) confidence *= 0.7;
    else if (priceSpread > 0.1) confidence *= 0.9;

    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * 保存资金费率到数据库
   */
  private async saveFundingRates(rates: FundingRate[]): Promise<void> {
    const records = rates.map(rate => ({
      exchange: rate.exchange,
      symbol: rate.symbol,
      funding_rate: rate.fundingRate,
      funding_time: rate.fundingTime,
      mark_price: rate.markPrice,
      index_price: rate.indexPrice,
      recorded_at: new Date()
    }));

    await this.db.saveFundingRatesBatch(records);
  }

  /**
   * 保存套利机会到数据库
   */
  private async saveOpportunities(opportunities: ArbitrageOpportunity[]): Promise<void> {
    await this.db.saveArbitrageOpportunitiesBatch(opportunities);
  }

  /**
   * 打印统计信息
   */
  private printStats(): void {
    console.log('\n📊 Engine Statistics:');
    console.log(`  Total checks: ${this.stats.totalChecks}`);
    console.log(`  Opportunities found: ${this.stats.opportunitiesFound}`);
    console.log(`  Errors: ${this.stats.errors}`);
    console.log(`  Last check time: ${this.stats.lastCheckTime}ms`);
  }

  /**
   * 获取统计信息
   */
  getStats() {
    return { ...this.stats, running: this.running };
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig: Partial<typeof this.config>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('⚙ Configuration updated:', this.config);
  }

  /**
   * 获取配置
   */
  getConfig() {
    return { ...this.config };
  }
}

export default ArbitrageEngine;
