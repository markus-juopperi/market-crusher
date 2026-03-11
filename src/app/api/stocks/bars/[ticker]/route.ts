import { NextRequest, NextResponse } from "next/server";

/** Historical candles via Yahoo Finance. */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const { ticker } = await params;
  const range = request.nextUrl.searchParams.get("range") || "3mo";
  const interval = request.nextUrl.searchParams.get("interval") || "1d";

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker.toUpperCase()}?range=${range}&interval=${interval}`;
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      next: { revalidate: 300 },
    });

    if (!res.ok) {
      throw new Error(`Yahoo Finance error: ${res.status}`);
    }

    const json = await res.json();
    const result = json.chart?.result?.[0];

    if (!result) {
      return NextResponse.json({ candles: [] });
    }

    const timestamps = result.timestamp || [];
    const quote = result.indicators?.quote?.[0] || {};

    const candles = timestamps.map((t: number, i: number) => ({
      t: t * 1000,
      o: quote.open?.[i] ?? 0,
      h: quote.high?.[i] ?? 0,
      l: quote.low?.[i] ?? 0,
      c: quote.close?.[i] ?? 0,
      v: quote.volume?.[i] ?? 0,
    })).filter((c: { c: number }) => c.c > 0);

    return NextResponse.json({ candles });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch bars";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
