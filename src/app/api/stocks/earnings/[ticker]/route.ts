import { NextRequest, NextResponse } from "next/server";
import { getCalendarEvents, getQuote, cachedCall } from "@/lib/yahoo-client";
import type { EarningsEvent } from "@/types";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const { ticker: rawTicker } = await params;
  const ticker = rawTicker.toUpperCase();

  try {
    const [calData, quoteData] = await Promise.all([
      cachedCall(
        `earnings:${ticker}`,
        () => getCalendarEvents(ticker),
        3600
      ),
      cachedCall(
        `quote:${ticker}`,
        () => getQuote(ticker),
        30
      ),
    ]);

    const cal = calData?.calendarEvents ?? {};
    const earnings = cal.earnings as Record<string, unknown> | undefined;
    const earningsDate = earnings?.earningsDate as Date[] | undefined;
    const dateStr = earningsDate?.[0]
      ? new Date(earningsDate[0]).toISOString().split("T")[0]
      : null;

    if (!dateStr) {
      return NextResponse.json({ earnings: null });
    }

    const epsEstimate = (earnings?.earningsAverage as number) ?? null;
    const revenueEstimate = (earnings?.revenueAverage as number) ?? null;
    const name = (quoteData?.shortName as string) || (quoteData?.longName as string) || ticker;

    const event: EarningsEvent = {
      ticker,
      name,
      date: dateStr,
      epsEstimate,
      revenueEstimate,
    };

    return NextResponse.json({ earnings: event });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch earnings";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
