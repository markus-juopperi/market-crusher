import { NextRequest, NextResponse } from "next/server";
import { getQuote, cachedCall } from "@/lib/yahoo-client";
import type { TickerSnapshot } from "@/types";

export async function GET(request: NextRequest) {
  const tickers = request.nextUrl.searchParams.get("tickers");
  if (!tickers) {
    return NextResponse.json({ tickers: [] });
  }

  const tickerList = tickers.split(",").filter(Boolean);

  try {
    const results = await Promise.all(
      tickerList.map(async (ticker): Promise<TickerSnapshot | null> => {
        try {
          const q = await cachedCall(
            `quote:${ticker}`,
            () => getQuote(ticker),
            30
          );
          if (!q || !q.regularMarketPrice) return null;
          return {
            ticker,
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

    return NextResponse.json({
      tickers: results.filter(Boolean),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch quotes";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
