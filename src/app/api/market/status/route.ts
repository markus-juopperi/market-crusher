import { NextResponse } from "next/server";
import { getQuote, cachedCall } from "@/lib/yahoo-client";
import type { MarketStatus } from "@/types";

export async function GET() {
  try {
    const q = await cachedCall(
      "market-status",
      () => getQuote("AAPL"),
      300
    );

    const marketState = (q?.marketState as string) || "CLOSED";
    const isOpen = marketState === "REGULAR";
    const session =
      marketState === "PRE" ? "pre-market"
      : marketState === "POST" || marketState === "POSTPOST" ? "post-market"
      : marketState === "REGULAR" ? "regular"
      : "closed";

    const data: MarketStatus = {
      exchange: "US",
      isOpen,
      session,
    };

    return NextResponse.json(data);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch market status";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
