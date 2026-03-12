import { NextRequest, NextResponse } from "next/server";
import { getQuote, cachedCall } from "@/lib/yahoo-client";
import type { TickerSnapshot } from "@/types";

const POPULAR_TICKERS = [
  // US
  "AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "META", "TSLA", "JPM",
  "NFLX", "AMD", "V", "WMT", "MA", "DIS", "BA",
  // Helsinki (HEX)
  "NOKIA.HE", "FORTUM.HE", "ELISA.HE", "KONE.HE", "NESTE.HE",
  "SAMPO.HE", "UPM.HE", "STORA-ENSO-R.HE", "KESKO.HE", "KEMIRA.HE",
];

interface MoversCache {
  data: TickerSnapshot[];
  expiresAt: number;
}

let moversCache: MoversCache | null = null;

async function fetchAllMovers(): Promise<TickerSnapshot[]> {
  if (moversCache && Date.now() < moversCache.expiresAt) {
    return moversCache.data;
  }

  const results = await Promise.all(
    POPULAR_TICKERS.map(async (ticker): Promise<TickerSnapshot | null> => {
      try {
        const q = await cachedCall(
          `quote:${ticker}`,
          () => getQuote(ticker),
          300
        );
        if (!q || !q.regularMarketPrice) return null;
        return {
          ticker,
          name: (q.shortName as string) || (q.longName as string) || undefined,
          price: q.regularMarketPrice,
          change: q.regularMarketChange ?? 0,
          changePercent: q.regularMarketChangePercent ?? 0,
          high: q.regularMarketDayHigh ?? 0,
          low: q.regularMarketDayLow ?? 0,
          open: q.regularMarketOpen ?? 0,
          prevClose: q.regularMarketPreviousClose ?? 0,
          updated: q.regularMarketTime
            ? new Date(q.regularMarketTime).getTime()
            : Date.now(),
          currency: q.currency ?? "USD",
        };
      } catch {
        return null;
      }
    })
  );

  const valid = results.filter((r): r is TickerSnapshot => r !== null);

  moversCache = {
    data: valid,
    expiresAt: Date.now() + 300_000,
  };

  return valid;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ direction: string }> }
) {
  const { direction } = await params;
  if (direction !== "gainers" && direction !== "losers") {
    return NextResponse.json(
      { error: "Direction must be gainers or losers" },
      { status: 400 }
    );
  }

  try {
    const all = await fetchAllMovers();
    const sorted = [...all];

    if (direction === "gainers") {
      sorted.sort((a, b) => b.changePercent - a.changePercent);
    } else {
      sorted.sort((a, b) => a.changePercent - b.changePercent);
    }

    return NextResponse.json({ tickers: sorted });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch movers";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
