import type { SharedPortfolioEntry } from "@/types";

/**
 * Encode portfolio holdings into a URL-safe base64 string.
 * Format: ticker:shares:buyPrice, joined by commas.
 */
export function encodePortfolio(holdings: SharedPortfolioEntry[]): string {
  const payload = holdings.map(
    (h) => `${h.ticker}:${h.shares}:${h.buyPrice}`
  ).join(",");
  return btoa(payload);
}

/**
 * Decode a base64-encoded portfolio string back into holdings.
 */
export function decodePortfolio(encoded: string): SharedPortfolioEntry[] {
  try {
    const payload = atob(encoded);
    return payload.split(",").map((entry) => {
      const [ticker, sharesStr, buyPriceStr] = entry.split(":");
      return {
        ticker: ticker.toUpperCase(),
        shares: parseFloat(sharesStr),
        buyPrice: parseFloat(buyPriceStr),
      };
    }).filter((h) => h.ticker && !isNaN(h.shares) && !isNaN(h.buyPrice));
  } catch {
    return [];
  }
}
