const BASE_URL = "https://finnhub.io/api/v1";
const API_KEY = process.env.FINNHUB_API_KEY!;

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

export async function finnhubGet<T>(
  path: string,
  cacheTtlSeconds = 0
): Promise<T> {
  const cacheKey = path;

  if (cacheTtlSeconds > 0) {
    const cached = getCached<T>(cacheKey);
    if (cached) return cached;
  }

  const separator = path.includes("?") ? "&" : "?";
  const url = `${BASE_URL}${path}${separator}token=${API_KEY}`;

  const res = await fetch(url, { cache: "no-store" });

  if (!res.ok) {
    throw new Error(`Finnhub API error: ${res.status} ${res.statusText}`);
  }

  const json = await res.json();

  if (cacheTtlSeconds > 0) {
    setCache(cacheKey, json, cacheTtlSeconds);
  }

  return json as T;
}
