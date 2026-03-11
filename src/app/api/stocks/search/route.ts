import { NextRequest, NextResponse } from "next/server";
import { searchSymbols, cachedCall } from "@/lib/yahoo-client";
import type { SearchResult } from "@/types";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q");
  if (!q) {
    return NextResponse.json({ result: [] });
  }

  try {
    const data = await cachedCall(
      `search:${q}`,
      () => searchSymbols(q),
      600
    );

    const result: SearchResult[] = (data.quotes || [])
      .filter((item: Record<string, unknown>) => item.symbol && item.quoteType === "EQUITY")
      .slice(0, 10)
      .map((item: Record<string, unknown>) => ({
        symbol: item.symbol as string,
        displaySymbol: item.symbol as string,
        description: (item.shortname || item.longname || "") as string,
        type: (item.quoteType || "Common Stock") as string,
      }));

    return NextResponse.json({ count: result.length, result });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to search tickers";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
