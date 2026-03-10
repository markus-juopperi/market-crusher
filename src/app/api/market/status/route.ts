import { NextResponse } from "next/server";
import { finnhubGet } from "@/lib/finnhub-client";
import type { FinnhubMarketStatus } from "@/types";

export async function GET() {
  try {
    const data = await finnhubGet<FinnhubMarketStatus>(
      "/stock/market-status?exchange=US",
      300
    );
    return NextResponse.json(data);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch market status";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
