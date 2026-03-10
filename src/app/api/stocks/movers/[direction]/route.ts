import { NextRequest, NextResponse } from "next/server";
import { finnhubGet } from "@/lib/finnhub-client";
import type { FinnhubQuote, TickerSnapshot } from "@/types";

const POPULAR_TICKERS = [
  "AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "META", "TSLA", "JPM",
  "NFLX", "AMD", "V", "WMT", "MA", "DIS", "BA",
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
        const q = await finnhubGet<FinnhubQuote>(
          `/quote?symbol=${ticker}`,
          300
        );
        if (!q || q.c === 0) return null;
        return {
          ticker,
          price: q.c,
          change: q.d ?? 0,
          changePercent: q.dp ?? 0,
          high: q.h,
          low: q.l,
          open: q.o,
          prevClose: q.pc,
          updated: q.t * 1000,
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
