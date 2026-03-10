import { NextRequest, NextResponse } from "next/server";
import { finnhubGet } from "@/lib/finnhub-client";
import type { FinnhubQuote } from "@/types";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const { ticker: rawTicker } = await params;
  const ticker = rawTicker.toUpperCase();

  try {
    const q = await finnhubGet<FinnhubQuote>(
      `/quote?symbol=${ticker}`,
      30
    );

    if (!q || q.c === 0) {
      return NextResponse.json({ error: "No data found" }, { status: 404 });
    }

    return NextResponse.json({
      ticker: {
        ticker,
        price: q.c,
        change: q.d ?? 0,
        changePercent: q.dp ?? 0,
        high: q.h,
        low: q.l,
        open: q.o,
        prevClose: q.pc,
        updated: q.t * 1000,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch quote";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
