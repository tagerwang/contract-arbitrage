/**
 * 三所交易所全量资金费率获取（统一入口）
 * - 抽取公共逻辑，engine 与 realtime 共用
 * - 5 分钟内存缓存，减少 API 调用
 */

import BinanceAPI from '../exchanges/binance';
import OKXAPI from '../exchanges/okx';
import BybitAPI from '../exchanges/bybit';
import { FundingRate } from '../types';

const binance = new BinanceAPI();
const okx = new OKXAPI();
const bybit = new BybitAPI();

const CACHE_TTL_MS = parseInt(process.env.FUNDING_RATES_CACHE_TTL_MS || '300000', 10);
const EXCHANGE_REQUEST_DELAY_MS = parseInt(process.env.EXCHANGE_REQUEST_DELAY_MS || '200', 10);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

let cache: {
  data: [FundingRate[], FundingRate[], FundingRate[]];
  expiresAt: number;
} | null = null;

export type FundingRatesTuple = [FundingRate[], FundingRate[], FundingRate[]];

export interface FetchOptions {
  /** 跳过缓存，强制从交易所拉取 */
  skipCache?: boolean;
  /** 是否静默（不打印错误到 console） */
  silent?: boolean;
}

/**
 * 获取三个交易所的全量资金费率
 * 带 5 分钟缓存，请求间有延迟以控制 API 频率
 */
export async function fetchAllExchangesFundingRates(
  options: FetchOptions = {}
): Promise<FundingRatesTuple> {
  const { skipCache = false, silent = false } = options;

  if (!skipCache && cache && Date.now() < cache.expiresAt) {
    return cache.data;
  }

  const binanceRates = await binance.getAllFundingRates().catch((e) => {
    if (!silent) {
      console.error('  ✗ Binance getAllFundingRates:', e instanceof Error ? e.message : e);
    }
    return [] as FundingRate[];
  });
  await sleep(EXCHANGE_REQUEST_DELAY_MS);

  const okxRates = await okx.getAllFundingRates().catch((e) => {
    if (!silent) {
      console.error('  ✗ OKX getAllFundingRates:', e instanceof Error ? e.message : e);
    }
    return [] as FundingRate[];
  });
  await sleep(EXCHANGE_REQUEST_DELAY_MS);

  const bybitRates = await bybit.getAllFundingRates().catch((e) => {
    if (!silent) {
      console.error('  ✗ Bybit getAllFundingRates:', e instanceof Error ? e.message : e);
    }
    return [] as FundingRate[];
  });

  const data: FundingRatesTuple = [binanceRates, okxRates, bybitRates];
  cache = { data, expiresAt: Date.now() + CACHE_TTL_MS };
  return data;
}

/**
 * 清除缓存（用于测试或强制刷新）
 */
export function clearFundingRatesCache(): void {
  cache = null;
}
