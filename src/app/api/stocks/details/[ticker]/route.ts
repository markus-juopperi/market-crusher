import { NextRequest, NextResponse } from "next/server";
import { finnhubGet } from "@/lib/finnhub-client";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const { ticker } = await params;
  try {
    const data = await finnhubGet(
      `/stock/profile2?symbol=${ticker.toUpperCase()}`,
      3600
    );
    return NextResponse.json(data);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch ticker details";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
