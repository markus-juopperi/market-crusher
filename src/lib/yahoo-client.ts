import YahooFinance from "yahoo-finance2";

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry<unknown>>();

function getCached<T>(key: string): T | null {
  const entry = cache.get(key) as CacheEntry<T> | undefined;
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache<T>(key: string, data: T, ttlSeconds: number) {
  cache.set(key, { data, expiresAt: Date.now() + ttlSeconds * 1000 });
}

export async function cachedCall<T>(
  key: string,
  fn: () => Promise<T>,
  ttlSeconds: number
): Promise<T> {
  if (ttlSeconds > 0) {
    const cached = getCached<T>(key);
    if (cached) return cached;
  }

  const data = await fn();

  if (ttlSeconds > 0) {
    setCache(key, data, ttlSeconds);
  }

  return data;
}

export interface YahooQuote {
  regularMarketPrice?: number;
  regularMarketChange?: number;
  regularMarketChangePercent?: number;
  regularMarketDayHigh?: number;
  regularMarketDayLow?: number;
  regularMarketOpen?: number;
  regularMarketPreviousClose?: number;
  regularMarketTime?: Date;
  marketState?: string;
  currency?: string;
  [key: string]: unknown;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const yf = new (YahooFinance as any)({ suppressNotices: ["yahooSurvey"] });

export async function getQuote(symbol: string): Promise<YahooQuote> {
  return yf.quote(symbol);
}

export async function searchSymbols(
  query: string,
  options?: { newsCount?: number; quotesCount?: number }
): Promise<{ quotes: Record<string, unknown>[]; news: Record<string, unknown>[] }> {
  return yf.search(query, options);
}

export async function getProfile(
  symbol: string
): Promise<{ assetProfile?: Record<string, unknown>; price?: Record<string, unknown> }> {
  return yf.quoteSummary(symbol, { modules: ["assetProfile", "price"] });
}

export async function getCalendarEvents(
  symbol: string
): Promise<{ calendarEvents?: Record<string, unknown> }> {
  return yf.quoteSummary(symbol, { modules: ["calendarEvents"] });
}

export async function getRecommendationTrend(
  symbol: string
): Promise<{ recommendationTrend?: Record<string, unknown> }> {
  return yf.quoteSummary(symbol, { modules: ["recommendationTrend"] });
}