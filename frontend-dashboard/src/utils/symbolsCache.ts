/**
 * 交易所交易对本地缓存
 * 缓存有效期 1 天，key: contract-arbitrage:symbols:{exchange}
 */

const CACHE_PREFIX = 'contract-arbitrage:symbols';
const TTL_MS = 60 * 60 * 1000 // 1 小时 // 24 * 60 * 60 * 1000; // 1 天

export type ExchangeKey = 'binance' | 'bybit' | 'okx';

interface CachedSymbols {
  symbols: string[];
  expiresAt: number;
}

function cacheKey(exchange: ExchangeKey): string {
  return `${CACHE_PREFIX}:${exchange}`;
}

/**
 * 从本地存储读取缓存的交易对，若已过期或不存在则返回 null
 */
export function getCachedSymbols(exchange: ExchangeKey): string[] | null {
  try {
    const raw = localStorage.getItem(cacheKey(exchange));
    if (!raw) return null;
    const data: CachedSymbols = JSON.parse(raw);
    if (Date.now() > data.expiresAt) return null;
    return Array.isArray(data.symbols) ? data.symbols : null;
  } catch {
    return null;
  }
}

/**
 * 将交易对列表写入本地缓存
 */
export function setCachedSymbols(exchange: ExchangeKey, symbols: string[]): void {
  try {
    const data: CachedSymbols = {
      symbols,
      expiresAt: Date.now() + TTL_MS
    };
    localStorage.setItem(cacheKey(exchange), JSON.stringify(data));
  } catch {
    // ignore
  }
}

/**
 * 清除指定交易所的缓存（可选，用于强制刷新）
 */
export function clearSymbolsCache(exchange?: ExchangeKey): void {
  try {
    if (exchange) {
      localStorage.removeItem(cacheKey(exchange));
    } else {
      (['binance', 'bybit', 'okx'] as ExchangeKey[]).forEach((ex) => {
        localStorage.removeItem(cacheKey(ex));
      });
    }
  } catch {
    // ignore
  }
}
