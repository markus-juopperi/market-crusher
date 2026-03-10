import { NextRequest, NextResponse } from "next/server";
import { finnhubGet } from "@/lib/finnhub-client";
import type { FinnhubNews } from "@/types";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const { ticker: rawTicker } = await params;
  const ticker = rawTicker.toUpperCase();
  const to = new Date().toISOString().split("T")[0];
  const from = new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];

  try {
    const data = await finnhubGet<FinnhubNews[]>(
      `/company-news?symbol=${ticker}&from=${from}&to=${to}`,
      300
    );
    return NextResponse.json({ articles: (data || []).slice(0, 10) });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch news";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
