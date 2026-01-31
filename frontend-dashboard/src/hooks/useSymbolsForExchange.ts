import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../api/client';
import {
  getCachedSymbols,
  setCachedSymbols,
  type ExchangeKey
} from '../utils/symbolsCache';

/** 资金费率项（与后端 /funding-rates 返回结构一致） */
export interface FundingRateItem {
  symbol: string;
  fundingRate: number;
  markPrice?: number;
  indexPrice?: number;
  fundingTime?: number;
}

export interface SymbolOptionWithInfo {
  value: string;
  label: string;
  /** 可选，用于搜索/筛选时匹配 */
  symbol?: string;
}

export interface UseSymbolsResult {
  /** 当前交易所的交易对列表（仅 symbol/instId 字符串） */
  symbols: string[];
  /** 带现价、费率的选项，用于 Select 展示 */
  symbolOptionsWithInfo: SymbolOptionWithInfo[];
  /** 是否正在请求（含读缓存未命中后的拉取） */
  loading: boolean;
  /** 拉取失败时的错误信息 */
  error: string | null;
  /** 手动刷新（忽略缓存重新请求） */
  refresh: () => Promise<void>;
}

/** OKX instId 转为后端 funding-rates 里的 symbol（如 BTC-USDT-SWAP -> BTCUSDT） */
function okxInstIdToSymbol(instId: string): string {
  return instId.replace(/-/g, '').replace('SWAP', '');
}

/** 格式化现价显示 */
function formatPrice(v: number | undefined): string {
  if (v == null || Number.isNaN(v)) return '—';
  if (v >= 1000) return v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return v.toFixed(4);
}

/** 格式化资金费率（小数转百分比） */
function formatFundingRate(v: number | undefined): string {
  if (v == null || Number.isNaN(v)) return '—';
  return `${(v * 100).toFixed(4)}%`;
}

/**
 * 获取指定交易所的交易对列表（优先 1 天缓存），并拉取资金费率以生成带现价、费率的选项
 */
export function useSymbolsForExchange(exchange: string): UseSymbolsResult {
  const key = exchange as ExchangeKey;
  const [symbols, setSymbols] = useState<string[]>(() => {
    const cached = getCachedSymbols(key);
    return cached ?? [];
  });
  const [symbolOptionsWithInfo, setSymbolOptionsWithInfo] = useState<SymbolOptionWithInfo[]>([]);
  const [loading, setLoading] = useState<boolean>(() => {
    const cached = getCachedSymbols(key);
    return !cached;
  });
  const [error, setError] = useState<string | null>(null);

  const fetchSymbols = useCallback(async (skipCache = false) => {
    if (!['binance', 'bybit', 'okx'].includes(exchange)) {
      setSymbols([]);
      setSymbolOptionsWithInfo([]);
      setLoading(false);
      return;
    }
    if (!skipCache) {
      const cached = getCachedSymbols(key);
      if (cached && cached.length > 0) {
        setSymbols(cached);
        setError(null);
        setLoading(false);
        // 仍需要拉取资金费率以生成带信息的选项
        try {
          const rates = (await apiClient.getExchangeFundingRates(exchange)) as FundingRateItem[];
          const rateMap = new Map<string, FundingRateItem>();
          for (const r of rates || []) {
            if (r?.symbol) rateMap.set(r.symbol, r);
          }
          const options = buildSymbolOptionsWithInfo(exchange, cached, rateMap);
          setSymbolOptionsWithInfo(options);
        } catch {
          setSymbolOptionsWithInfo(cached.map((s) => ({ value: s, label: s, symbol: s })));
        }
        return;
      }
    }
    setLoading(true);
    setError(null);
    try {
      const list = await apiClient.getExchangeSymbols(exchange);
      const arr = Array.isArray(list) ? list : [];
      setSymbols(arr);
      setCachedSymbols(key, arr);

      const rates = (await apiClient.getExchangeFundingRates(exchange)) as FundingRateItem[];
      const rateMap = new Map<string, FundingRateItem>();
      for (const r of rates || []) {
        if (r?.symbol) rateMap.set(r.symbol, r);
      }
      const options = buildSymbolOptionsWithInfo(exchange, arr, rateMap);
      setSymbolOptionsWithInfo(options);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      setSymbols([]);
      setSymbolOptionsWithInfo([]);
    } finally {
      setLoading(false);
    }
  }, [exchange, key]);

  useEffect(() => {
    fetchSymbols(false);
  }, [fetchSymbols]);

  const refresh = useCallback(async () => {
    await fetchSymbols(true);
  }, [fetchSymbols]);

  return { symbols, symbolOptionsWithInfo, loading, error, refresh };
}

/**
 * 根据交易对列表与资金费率 map 生成带现价、费率的 Select 选项
 */
function buildSymbolOptionsWithInfo(
  exchange: string,
  symbolList: string[],
  rateMap: Map<string, FundingRateItem>
): SymbolOptionWithInfo[] {
  return symbolList.map((value) => {
    const lookupKey = exchange === 'okx' ? okxInstIdToSymbol(value) : value;
    const info = rateMap.get(lookupKey);
    const markPrice = info?.markPrice ?? info?.indexPrice;
    const fundingRate = info?.fundingRate;
    const label = `${value} · 现价 ${formatPrice(markPrice)} · 费率 ${formatFundingRate(fundingRate)}`;
    return { value, label, symbol: value };
  });
}
