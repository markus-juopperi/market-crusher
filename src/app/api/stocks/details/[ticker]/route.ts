import { NextRequest, NextResponse } from "next/server";
import { getProfile, cachedCall } from "@/lib/yahoo-client";
import type { StockProfile } from "@/types";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const { ticker: rawTicker } = await params;
  const ticker = rawTicker.toUpperCase();

  try {
    const data = await cachedCall(
      `profile:${ticker}`,
      () => getProfile(ticker),
      3600
    );

    const p = data?.assetProfile ?? {};
    const pr = data?.price ?? {};

    const website = String(p.website ?? "");
    const logoUrl = website
      ? `https://logo.clearbit.com/${new URL(website).hostname}`
      : "";

    const result: StockProfile = {
      country: String(p.country ?? ""),
      currency: String(pr.currency ?? "USD"),
      exchange: String(pr.exchangeName ?? ""),
      industry: String(p.industry ?? ""),
      logo: logoUrl,
      marketCap: Number(pr.marketCap ?? 0),
      name: String(pr.shortName ?? pr.longName ?? ""),
      ticker,
      website,
    };

    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch ticker details";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
