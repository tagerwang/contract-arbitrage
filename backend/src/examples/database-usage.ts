import DatabaseService from '../database/service';
import BinanceAPI from '../exchanges/binance';
import { Exchange } from '../types';

/**
 * 数据库使用示例
 */
async function main() {
  console.log('='.repeat(60));
  console.log('Database Service Usage Examples');
  console.log('='.repeat(60) + '\n');

  // 创建数据库服务实例
  const db = new DatabaseService();
  const binance = new BinanceAPI();

  try {
    // 1. 测试连接
    console.log('1. Testing database connection...');
    const isConnected = await db.testConnection();
    if (!isConnected) {
      console.error('Failed to connect to database');
      return;
    }
    console.log('✓ Connected\n');

    // 2. 获取并保存资金费率
    console.log('2. Fetching and saving funding rates...');
    const fundingRate = await binance.getFundingRate('BTCUSDT');
    console.log('Fetched rate:', fundingRate);

    const rateRecord = {
      exchange: fundingRate.exchange,
      symbol: fundingRate.symbol,
      funding_rate: fundingRate.fundingRate,
      funding_time: fundingRate.fundingTime,
      mark_price: fundingRate.markPrice,
      index_price: fundingRate.indexPrice,
      recorded_at: new Date()
    };

    const rateId = await db.saveFundingRate(rateRecord);
    console.log(`✓ Saved with ID: ${rateId}\n`);

    // 3. 获取最新资金费率
    console.log('3. Getting latest funding rates...');
    const latestRates = await db.getLatestFundingRates(5);
    console.log(`Found ${latestRates.length} records:`);
    latestRates.forEach(rate => {
      console.log(`  ${rate.exchange} ${rate.symbol}: ${(rate.funding_rate * 100).toFixed(4)}%`);
    });
    console.log();

    // 4. 获取历史费率
    console.log('4. Getting funding rate history...');
    const history = await db.getFundingRateHistory('BTCUSDT', Exchange.BINANCE, 24);
    console.log(`Found ${history.length} historical records for BTC/USDT on Binance (last 24h)\n`);

    // 5. 保存套利机会
    console.log('5. Saving arbitrage opportunity...');
    const opportunity = {
      symbol: 'BTCUSDT',
      longExchange: Exchange.BINANCE,
      shortExchange: Exchange.OKX,
      longRate: 0.01,
      shortRate: 0.05,
      spreadRate: 0.04,
      annualizedReturn: 43.8,
      longPrice: 50000,
      shortPrice: 50010,
      priceDiff: 10,
      priceSpreadPercent: 0.02,
      confidence: 0.95,
      createdAt: new Date()
    };

    const oppId = await db.saveArbitrageOpportunity(opportunity);
    console.log(`✓ Saved opportunity with ID: ${oppId}\n`);

    // 6. 获取最新套利机会
    console.log('6. Getting latest arbitrage opportunities...');
    const opportunities = await db.getLatestOpportunities(5);
    console.log(`Found ${opportunities.length} opportunities:`);
    opportunities.forEach(opp => {
      console.log(`  ${opp.symbol}: ${opp.long_exchange} ↔ ${opp.short_exchange}`);
      console.log(`    Spread: ${opp.spread_rate.toFixed(4)}% | Annual: ${opp.annualized_return.toFixed(2)}%`);
    });
    console.log();

    // 7. 查询特定条件的机会
    console.log('7. Querying opportunities with filters...');
    const filtered = await db.queryOpportunities({
      symbol: 'BTCUSDT',
      minSpread: 0.03,
      limit: 10
    });
    console.log(`Found ${filtered.length} opportunities for BTCUSDT with spread >= 0.03%\n`);

    // 8. 获取统计数据
    console.log('8. Getting statistics (last 24 hours)...');
    const stats = await db.getStatistics(24);
    console.log('Statistics:');
    console.log(`  Total opportunities: ${stats.totalOpportunities}`);
    console.log(`  Average spread: ${stats.avgSpread.toFixed(4)}%`);
    console.log(`  Average annualized return: ${stats.avgAnnualizedReturn.toFixed(2)}%`);
    console.log('\nTop symbols:');
    stats.topSymbols.slice(0, 5).forEach((item, index) => {
      console.log(`  ${index + 1}. ${item.symbol}: ${item.count} times (avg spread: ${item.avgSpread.toFixed(4)}%)`);
    });
    console.log('\nTop exchange pairs:');
    stats.exchangePairs.slice(0, 5).forEach((item, index) => {
      console.log(`  ${index + 1}. ${item.longExchange} ↔ ${item.shortExchange}: ${item.count} times`);
    });
    console.log();

    // 9. 清理测试数据（注释掉以保留数据）
    // console.log('9. Cleaning up old data...');
    // const deleted = await db.cleanOldData(1); // 删除1天前的数据
    // console.log(`✓ Deleted ${deleted} old records\n`);

    console.log('='.repeat(60));
    console.log('All examples completed successfully!');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    // 关闭数据库连接
    await db.close();
    console.log('\n✓ Database connection closed');
  }
}

// 运行示例
main().catch(console.error);
