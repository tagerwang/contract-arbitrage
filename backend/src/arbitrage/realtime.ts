/**
 * 实时套利机会计算
 * 使用 fundingRatesFetcher（5 分钟缓存），无需依赖数据库
 */

import { FundingRate } from '../types';
import type { ArbitrageRecord } from '../types';
import { fetchAllExchangesFundingRates } from './fundingRatesFetcher';

const MIN_PROFIT_THRESHOLD = parseFloat(process.env.MIN_PROFIT_THRESHOLD || '0.01');
const MAX_PRICE_SPREAD = 0.5;

export interface RealtimeOpportunityFilter {
  symbol?: string;
  minSpread?: number;
  limit?: number;
  offset?: number;
}
/**
 * 置信度（confidence）
 * 置信度用来反映机会的可信程度，影响因子：
 * 费差越大 → 置信度越高
 * 价格差越大 → 置信度越低
 * 具体区间大致为：
 * spreadRate < 0.5 % → 乘以 0.6 // 费率
 * spreadRate < 1.0 % → 乘以 0.8
 * priceSpread > 0.3 % → 乘以 0.7 // 价格差
 * priceSpread > 0.1 % → 乘以 0.9
*/
function calculateConfidence(spreadRate: number, priceSpread: number): number {
  let confidence = 1.0;
  if (spreadRate < 0.5) confidence *= 0.6;
  else if (spreadRate < 1.0) confidence *= 0.8;
  if (priceSpread > 0.3) confidence *= 0.7;
  else if (priceSpread > 0.1) confidence *= 0.9;
  return Math.max(0, Math.min(1, confidence));
}

function analyzeRates(rates: FundingRate[], minSpread: number): ArbitrageRecord[] {
  if (rates.length < 2) return [];
  const results: ArbitrageRecord[] = [];
  const now = new Date();

  for (let i = 0; i < rates.length; i++) {
    for (let j = i + 1; j < rates.length; j++) {
      const r1 = rates[i];
      const r2 = rates[j];
      const spreadRate = Math.abs(r1.fundingRate - r2.fundingRate) * 100;
      if (spreadRate < minSpread) continue;

      const [longRate, shortRate] =
        r1.fundingRate < r2.fundingRate ? [r1, r2] : [r2, r1];
      const longPrice = longRate.markPrice ?? longRate.indexPrice ?? 0;
      const shortPrice = shortRate.markPrice ?? shortRate.indexPrice ?? 0;
      const priceDiff = Math.abs(longPrice - shortPrice);
      const priceSpreadPercent = longPrice > 0 ? (priceDiff / longPrice) * 100 : 0;
      if (priceSpreadPercent > MAX_PRICE_SPREAD) continue;

      const annualizedReturn = spreadRate * 3 * 365;
      const confidence = calculateConfidence(spreadRate, priceSpreadPercent);

      results.push({
        symbol: longRate.symbol,
        long_exchange: longRate.exchange as string,
        short_exchange: shortRate.exchange as string,
        long_rate: longRate.fundingRate * 100,
        short_rate: shortRate.fundingRate * 100,
        spread_rate: spreadRate,
        annualized_return: annualizedReturn,
        long_price: longPrice,
        short_price: shortPrice,
        price_diff: priceDiff,
        price_spread_percent: priceSpreadPercent,
        confidence,
        detected_at: now
      });
    }
  }
  return results.sort((a, b) => b.spread_rate - a.spread_rate);
}

/**
 * 从交易所实时计算套利机会
 * 1. 分别调用三个交易所 getAllFundingRates
 * 2. 过滤出三个交易所都存在的交易对
 * 3. 对交集交易对分析套利机会
 */
export async function computeRealtimeOpportunities(
  filter: RealtimeOpportunityFilter = {}
): Promise<ArbitrageRecord[]> {
  const { symbol, minSpread = MIN_PROFIT_THRESHOLD, limit = 50, offset = 0 } = filter;

  const [binanceRates, okxRates, bybitRates] = await fetchAllExchangesFundingRates({
    skipCache: false,
    silent: true
  });

  const bnSymbols = new Set(binanceRates.map((r) => r.symbol));
  const okxSymbols = new Set(okxRates.map((r) => r.symbol));
  const bybitSymbols = new Set(bybitRates.map((r) => r.symbol));

  const commonSymbols = symbol
    ? ([symbol].filter((s) => bnSymbols.has(s) && okxSymbols.has(s) && bybitSymbols.has(s)) as string[])
    : [...bnSymbols].filter((s) => okxSymbols.has(s) && bybitSymbols.has(s));

  const rateMap = new Map<string, FundingRate[]>();
  for (const r of [...binanceRates, ...okxRates, ...bybitRates]) {
    if (!commonSymbols.includes(r.symbol)) continue;
    if (!rateMap.has(r.symbol)) rateMap.set(r.symbol, []);
    rateMap.get(r.symbol)!.push(r);
  }

  let opportunities: ArbitrageRecord[] = [];
  for (const rates of rateMap.values()) {
    if (rates.length >= 2) {
      opportunities.push(...analyzeRates(rates, minSpread));
    }
  }
  opportunities = opportunities.sort((a, b) => b.spread_rate - a.spread_rate);

  return opportunities.slice(offset, offset + limit);
}
