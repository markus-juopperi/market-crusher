import { NextRequest, NextResponse } from "next/server";
import { finnhubGet } from "@/lib/finnhub-client";
import type { FinnhubQuote, TickerSnapshot } from "@/types";

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
          const q = await finnhubGet<FinnhubQuote>(
            `/quote?symbol=${ticker}`,
            30
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

    return NextResponse.json({
      tickers: results.filter(Boolean),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch quotes";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
