import { NextRequest, NextResponse } from "next/server";
import { getQuote, cachedCall } from "@/lib/yahoo-client";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const { ticker: rawTicker } = await params;
  const ticker = rawTicker.toUpperCase();

  try {
    const q = await cachedCall(
      `quote:${ticker}`,
      () => getQuote(ticker),
      30
    );

    if (!q || !q.regularMarketPrice) {
      return NextResponse.json({ error: "No data found" }, { status: 404 });
    }

    return NextResponse.json({
      ticker: {
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
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch quote";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
