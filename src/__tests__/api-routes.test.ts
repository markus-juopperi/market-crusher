import { describe, it, expect, vi, beforeEach } from "vitest";
import type { NextRequest } from "next/server";

// Mock the yahoo-client module
const mockGetQuote = vi.fn();
const mockSearchSymbols = vi.fn();
const mockGetProfile = vi.fn();
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const mockCachedCall = vi.fn((_key: string, fn: () => Promise<unknown>, _ttl?: number) => fn());

vi.mock("@/lib/yahoo-client", () => ({
  getQuote: (...args: unknown[]) => mockGetQuote(...args),
  searchSymbols: (...args: unknown[]) => mockSearchSymbols(...args),
  getProfile: (...args: unknown[]) => mockGetProfile(...args),
  cachedCall: (...args: unknown[]) => mockCachedCall(args[0] as string, args[1] as () => Promise<unknown>, args[2] as number),
}));

// Helper to create NextRequest-like objects with .nextUrl
function makeRequest(url: string) {
  const req = new Request(url);
  const parsed = new URL(url);
  Object.defineProperty(req, "nextUrl", { value: parsed });
  return req as unknown as NextRequest;
}

describe("API Routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCachedCall.mockImplementation(
      (_key: string, fn: () => Promise<unknown>) => fn()
    );
  });

  describe("GET /api/stocks/snapshot (batch)", () => {
    it("returns empty array when no tickers param", async () => {
      const { GET } = await import("@/app/api/stocks/snapshot/route");
      const req = makeRequest("http://localhost/api/stocks/snapshot");
      const res = await GET(req);
      const json = await res.json();
      expect(json.tickers).toEqual([]);
    });

    it("returns snapshots for valid tickers", async () => {
      mockGetQuote.mockResolvedValue({
        regularMarketPrice: 150,
        regularMarketChange: 2.5,
        regularMarketChangePercent: 1.7,
        regularMarketDayHigh: 152,
        regularMarketDayLow: 148,
        regularMarketOpen: 149,
        regularMarketPreviousClose: 147.5,
        regularMarketTime: new Date("2024-01-01"),
        currency: "USD",
      });

      const { GET } = await import("@/app/api/stocks/snapshot/route");
      const req = makeRequest(
        "http://localhost/api/stocks/snapshot?tickers=AAPL"
      );
      const res = await GET(req);
      const json = await res.json();

      expect(json.tickers).toHaveLength(1);
      expect(json.tickers[0].ticker).toBe("AAPL");
      expect(json.tickers[0].price).toBe(150);
      expect(json.tickers[0].currency).toBe("USD");
    });

    it("filters out tickers with no data", async () => {
      mockGetQuote.mockResolvedValue({ regularMarketPrice: 0 });

      const { GET } = await import("@/app/api/stocks/snapshot/route");
      const req = makeRequest(
        "http://localhost/api/stocks/snapshot?tickers=FAKE"
      );
      const res = await GET(req);
      const json = await res.json();

      expect(json.tickers).toEqual([]);
    });
  });

  describe("GET /api/stocks/snapshot/[ticker]", () => {
    it("returns snapshot for a valid ticker", async () => {
      mockGetQuote.mockResolvedValue({
        regularMarketPrice: 260,
        regularMarketChange: -1.5,
        regularMarketChangePercent: -0.57,
        regularMarketDayHigh: 262,
        regularMarketDayLow: 258,
        regularMarketOpen: 261,
        regularMarketPreviousClose: 261.5,
        regularMarketTime: new Date("2024-01-01"),
        currency: "USD",
      });

      const { GET } = await import(
        "@/app/api/stocks/snapshot/[ticker]/route"
      );
      const req = makeRequest("http://localhost/api/stocks/snapshot/aapl");
      const res = await GET(req, {
        params: Promise.resolve({ ticker: "aapl" }),
      });
      const json = await res.json();

      expect(json.ticker.ticker).toBe("AAPL");
      expect(json.ticker.price).toBe(260);
    });

    it("returns 404 when no data", async () => {
      mockGetQuote.mockResolvedValue(null);

      const { GET } = await import(
        "@/app/api/stocks/snapshot/[ticker]/route"
      );
      const req = makeRequest("http://localhost/api/stocks/snapshot/FAKE");
      const res = await GET(req, {
        params: Promise.resolve({ ticker: "FAKE" }),
      });

      expect(res.status).toBe(404);
    });
  });

  describe("GET /api/stocks/search", () => {
    it("returns empty when no query", async () => {
      const { GET } = await import("@/app/api/stocks/search/route");
      const req = makeRequest("http://localhost/api/stocks/search");
      const res = await GET(req);
      const json = await res.json();
      expect(json.result).toEqual([]);
    });

    it("returns search results filtered to equities", async () => {
      mockSearchSymbols.mockResolvedValue({
        quotes: [
          {
            symbol: "AAPL",
            shortname: "Apple Inc.",
            quoteType: "EQUITY",
          },
          {
            symbol: "AAPL240119C00150000",
            shortname: "AAPL Option",
            quoteType: "OPTION",
          },
        ],
        news: [],
      });

      const { GET } = await import("@/app/api/stocks/search/route");
      const req = makeRequest(
        "http://localhost/api/stocks/search?q=apple"
      );
      const res = await GET(req);
      const json = await res.json();

      expect(json.result).toHaveLength(1);
      expect(json.result[0].symbol).toBe("AAPL");
      expect(json.result[0].description).toBe("Apple Inc.");
    });
  });

  describe("GET /api/stocks/details/[ticker]", () => {
    it("returns stock profile", async () => {
      mockGetProfile.mockResolvedValue({
        assetProfile: {
          country: "United States",
          industry: "Consumer Electronics",
          website: "https://www.apple.com",
        },
        price: {
          currency: "USD",
          exchangeName: "NASDAQ",
          marketCap: 3000000000000,
          shortName: "Apple Inc.",
        },
      });

      const { GET } = await import(
        "@/app/api/stocks/details/[ticker]/route"
      );
      const req = makeRequest("http://localhost/api/stocks/details/AAPL");
      const res = await GET(req, {
        params: Promise.resolve({ ticker: "AAPL" }),
      });
      const json = await res.json();

      expect(json.name).toBe("Apple Inc.");
      expect(json.exchange).toBe("NASDAQ");
      expect(json.currency).toBe("USD");
      expect(json.industry).toBe("Consumer Electronics");
      expect(json.logo).toContain("clearbit.com");
    });

    it("handles missing profile data gracefully", async () => {
      mockGetProfile.mockResolvedValue({
        assetProfile: undefined,
        price: undefined,
      });

      const { GET } = await import(
        "@/app/api/stocks/details/[ticker]/route"
      );
      const req = makeRequest("http://localhost/api/stocks/details/FAKE");
      const res = await GET(req, {
        params: Promise.resolve({ ticker: "FAKE" }),
      });
      const json = await res.json();

      expect(json.name).toBe("");
      expect(json.currency).toBe("USD");
    });
  });

  describe("GET /api/stocks/news/[ticker]", () => {
    it("returns news articles", async () => {
      mockSearchSymbols.mockResolvedValue({
        quotes: [],
        news: [
          {
            title: "Apple reports earnings",
            publisher: "Reuters",
            link: "https://example.com/news",
            providerPublishTime: "2024-01-15T10:00:00Z",
            uuid: "abc123",
            thumbnail: { resolutions: [{ url: "https://example.com/img.jpg" }] },
          },
        ],
      });

      const { GET } = await import("@/app/api/stocks/news/[ticker]/route");
      const req = makeRequest("http://localhost/api/stocks/news/AAPL");
      const res = await GET(req, {
        params: Promise.resolve({ ticker: "AAPL" }),
      });
      const json = await res.json();

      expect(json.articles).toHaveLength(1);
      expect(json.articles[0].headline).toBe("Apple reports earnings");
      expect(json.articles[0].source).toBe("Reuters");
    });

    it("returns empty array when no news", async () => {
      mockSearchSymbols.mockResolvedValue({ quotes: [], news: [] });

      const { GET } = await import("@/app/api/stocks/news/[ticker]/route");
      const req = makeRequest("http://localhost/api/stocks/news/FAKE");
      const res = await GET(req, {
        params: Promise.resolve({ ticker: "FAKE" }),
      });
      const json = await res.json();

      expect(json.articles).toEqual([]);
    });
  });

  describe("GET /api/market/status", () => {
    it("returns open status when market is regular", async () => {
      mockGetQuote.mockResolvedValue({ marketState: "REGULAR" });

      const { GET } = await import("@/app/api/market/status/route");
      const res = await GET();
      const json = await res.json();

      expect(json.isOpen).toBe(true);
      expect(json.session).toBe("regular");
      expect(json.exchange).toBe("US");
    });

    it("returns closed status", async () => {
      mockGetQuote.mockResolvedValue({ marketState: "CLOSED" });

      const { GET } = await import("@/app/api/market/status/route");
      const res = await GET();
      const json = await res.json();

      expect(json.isOpen).toBe(false);
      expect(json.session).toBe("closed");
    });

    it("returns pre-market status", async () => {
      mockGetQuote.mockResolvedValue({ marketState: "PRE" });

      const { GET } = await import("@/app/api/market/status/route");
      const res = await GET();
      const json = await res.json();

      expect(json.isOpen).toBe(false);
      expect(json.session).toBe("pre-market");
    });

    it("returns post-market status", async () => {
      mockGetQuote.mockResolvedValue({ marketState: "POST" });

      const { GET } = await import("@/app/api/market/status/route");
      const res = await GET();
      const json = await res.json();

      expect(json.isOpen).toBe(false);
      expect(json.session).toBe("post-market");
    });
  });

  describe("GET /api/stocks/movers/[direction]", () => {
    it("returns 400 for invalid direction", async () => {
      const { GET } = await import(
        "@/app/api/stocks/movers/[direction]/route"
      );
      const req = makeRequest("http://localhost/api/stocks/movers/invalid");
      const res = await GET(req, {
        params: Promise.resolve({ direction: "invalid" }),
      });

      expect(res.status).toBe(400);
    });

    it("returns gainers sorted by changePercent desc", async () => {
      mockGetQuote
        .mockResolvedValueOnce({
          regularMarketPrice: 100,
          regularMarketChange: 5,
          regularMarketChangePercent: 5,
          regularMarketDayHigh: 105,
          regularMarketDayLow: 95,
          regularMarketOpen: 96,
          regularMarketPreviousClose: 95,
          regularMarketTime: new Date(),
          currency: "USD",
        })
        .mockResolvedValue({
          regularMarketPrice: 200,
          regularMarketChange: 20,
          regularMarketChangePercent: 10,
          regularMarketDayHigh: 210,
          regularMarketDayLow: 190,
          regularMarketOpen: 191,
          regularMarketPreviousClose: 180,
          regularMarketTime: new Date(),
          currency: "USD",
        });

      const { GET } = await import(
        "@/app/api/stocks/movers/[direction]/route"
      );
      const req = makeRequest("http://localhost/api/stocks/movers/gainers");
      const res = await GET(req, {
        params: Promise.resolve({ direction: "gainers" }),
      });
      const json = await res.json();

      expect(json.tickers.length).toBeGreaterThan(0);
      // Verify sorted descending by changePercent
      for (let i = 1; i < json.tickers.length; i++) {
        expect(json.tickers[i - 1].changePercent).toBeGreaterThanOrEqual(
          json.tickers[i].changePercent
        );
      }
    });
  });
});
