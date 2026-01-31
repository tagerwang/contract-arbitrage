import DatabaseService from '../database/service';
import { FundingRate, ArbitrageOpportunity } from '../types';
import type { FundingRateRecord } from '../types';
import { fetchAllExchangesFundingRates } from './fundingRatesFetcher';

/**
 * 套利引擎
 * 从三个交易所获取所有合约交易对资金费率（5 分钟缓存），取交集后分析套利机会
 */
export class ArbitrageEngine {
  private db: DatabaseService;
  private running: boolean = false;
  private intervalId?: NodeJS.Timeout;

  // 配置参数
  private config = {
    checkInterval: parseInt(process.env.CHECK_INTERVAL_MS || '5000'),
    minProfitThreshold: parseFloat(process.env.MIN_PROFIT_THRESHOLD || '0.3'),
    maxPriceSpread: parseFloat(process.env.MAX_PRICE_SPREAD || '0.5')
  };

  // 统计数据
  private stats = {
    totalChecks: 0,
    opportunitiesFound: 0,
    lastCheckTime: 0,
    errors: 0
  };

  constructor(db?: DatabaseService) {
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
    console.log('⚙ Symbols: intersection of Binance, OKX, Bybit (no fixed list)');

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
   * 1. 分别调用三个交易所的 getAllFundingRates（一次请求，节省权重）
   * 2. 过滤出在三个交易所都存在的交易对
   * 3. 对交集交易对分析套利机会
   */
  private async checkArbitrageOpportunities(): Promise<void> {
    const startTime = Date.now();
    this.stats.totalChecks++;

    try {
      console.log(`\n[${new Date().toLocaleTimeString()}] 🔍 Checking arbitrage opportunities...`);

      const [binanceRates, okxRates, bybitRates] = await fetchAllExchangesFundingRates({
        skipCache: false,
        silent: false
      });

      const bnSymbols = new Set(binanceRates.map((r) => r.symbol));
      const okxSymbols = new Set(okxRates.map((r) => r.symbol));
      const bybitSymbols = new Set(bybitRates.map((r) => r.symbol));

      const commonSymbols = [...bnSymbols].filter((s) => okxSymbols.has(s) && bybitSymbols.has(s));
      console.log(`  📋 Common symbols (3 exchanges): ${commonSymbols.length}`);

      const rateMap = new Map<string, FundingRate[]>();
      for (const r of [...binanceRates, ...okxRates, ...bybitRates]) {
        if (!commonSymbols.includes(r.symbol)) continue;
        if (!rateMap.has(r.symbol)) rateMap.set(r.symbol, []);
        rateMap.get(r.symbol)!.push(r);
      }

      const opportunities: ArbitrageOpportunity[] = [];
      for (const rates of rateMap.values()) {
        if (rates.length >= 2) {
          opportunities.push(...this.analyzeFundingRates(rates));
        }
      }

      opportunities.sort((a, b) => b.spreadRate - a.spreadRate);

      // 保存套利机会及其对应的资金费率到数据库
      if (opportunities.length > 0) {
        await this.saveOpportunities(opportunities);
        this.stats.opportunitiesFound += opportunities.length;

        const oppSymbols = new Set(opportunities.map((o) => o.symbol));
        const ratesToSave: FundingRateRecord[] = [];
        for (const symbol of oppSymbols) {
          const rates = rateMap.get(symbol) ?? [];
          for (const r of rates) {
            ratesToSave.push({
              exchange: r.exchange as string,
              symbol: r.symbol,
              funding_rate: r.fundingRate,
              funding_time: r.fundingTime,
              mark_price: r.markPrice,
              index_price: r.indexPrice,
              recorded_at: new Date()
            });
          }
        }
        if (ratesToSave.length > 0) {
          await this.db.saveFundingRatesBatch(ratesToSave);
          console.log(`  💾 Saved ${ratesToSave.length} funding rates for ${oppSymbols.size} symbols`);
        }

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
   * 保存套利机会到数据库（资金费率不再入库）
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
