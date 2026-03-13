import { NextRequest, NextResponse } from "next/server";
import { getRecommendationTrend, cachedCall } from "@/lib/yahoo-client";
import type { AnalystRating } from "@/types";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const { ticker: rawTicker } = await params;
  const ticker = rawTicker.toUpperCase();

  try {
    const data = await cachedCall(
      `ratings:${ticker}`,
      () => getRecommendationTrend(ticker),
      3600
    );

    const trend = data?.recommendationTrend?.trend as
      | Record<string, unknown>[]
      | undefined;

    if (!trend || trend.length === 0) {
      return NextResponse.json({ ratings: [] });
    }

    const ratings: AnalystRating[] = trend.map((t) => ({
      period: String(t.period ?? ""),
      strongBuy: Number(t.strongBuy ?? 0),
      buy: Number(t.buy ?? 0),
      hold: Number(t.hold ?? 0),
      sell: Number(t.sell ?? 0),
      strongSell: Number(t.strongSell ?? 0),
    }));

    return NextResponse.json({ ratings });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch ratings";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
