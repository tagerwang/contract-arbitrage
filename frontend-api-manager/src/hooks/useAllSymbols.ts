import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { getCachedSymbols, setCachedSymbols } from '../utils/symbolsCache';

const API_BASE = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? '/api' : 'http://localhost:3001/api');

/** OKX instId 转为 BTCUSDT 格式 */
function okxInstIdToSymbol(instId: string): string {
  return instId.replace(/-/g, '').replace('SWAP', '');
}

export interface UseAllSymbolsResult {
  symbols: string[];
  options: { label: string; value: string }[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * 获取三所交易所的合并交易对（BTCUSDT 格式），用于套利监控 API
 */
export function useAllSymbols(): UseAllSymbolsResult {
  const [symbols, setSymbols] = useState<string[]>(() => getCachedSymbols() ?? []);
  const [loading, setLoading] = useState<boolean>(() => !(getCachedSymbols()?.length));
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async (skipCache = false) => {
    const cached = skipCache ? null : getCachedSymbols();
    if (cached?.length && !skipCache) {
      setSymbols(cached);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const seen = new Set<string>();
    const merged: string[] = [];
    const exchanges = [
      { name: 'binance', normalize: (s: string) => s },
      { name: 'bybit', normalize: (s: string) => s },
      { name: 'okx', normalize: okxInstIdToSymbol }
    ];
    try {
      for (const ex of exchanges) {
        try {
          const res = await axios.get(`${API_BASE}/exchanges/${ex.name}/symbols`, { timeout: 10000 });
          const list = res.data?.data?.symbols ?? [];
          for (const s of list) {
            const sym = ex.normalize(s);
            if (sym && !seen.has(sym)) {
              seen.add(sym);
              merged.push(sym);
            }
          }
        } catch {
          // 单个交易所失败不影响其他
        }
      }
      merged.sort((a, b) => a.localeCompare(b));
      setSymbols(merged);
      if (merged.length > 0) setCachedSymbols(merged);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setSymbols([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const cached = getCachedSymbols();
    if (cached?.length) {
      setSymbols(cached);
      setLoading(false);
    } else {
      fetchAll(true);
    }
  }, []);

  const refresh = useCallback(() => fetchAll(true), [fetchAll]);

  const options = symbols.map((s) => ({ label: s, value: s }));

  return { symbols, options, loading, error, refresh };
}
