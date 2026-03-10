import { NextRequest, NextResponse } from "next/server";
import { finnhubGet } from "@/lib/finnhub-client";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q");
  if (!q) {
    return NextResponse.json({ result: [] });
  }

  try {
    const data = await finnhubGet<{ count: number; result: unknown[] }>(
      `/search?q=${encodeURIComponent(q)}`,
      600
    );
    return NextResponse.json(data);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to search tickers";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
