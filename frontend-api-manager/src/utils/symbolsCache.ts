/**
 * 交易对本地缓存（API 管理面板专用）
 * 缓存有效期 1 天
 */

const CACHE_KEY = 'contract-arbitrage-api-manager:symbols';
const TTL_MS = 24 * 60 * 60 * 1000;

interface CachedData {
  symbols: string[];
  expiresAt: number;
}

export function getCachedSymbols(): string[] | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const data: CachedData = JSON.parse(raw);
    if (Date.now() > data.expiresAt) return null;
    return Array.isArray(data.symbols) ? data.symbols : null;
  } catch {
    return null;
  }
}

export function setCachedSymbols(symbols: string[]): void {
  try {
    const data: CachedData = { symbols, expiresAt: Date.now() + TTL_MS };
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}
