import { NextRequest, NextResponse } from "next/server";
import { searchSymbols, cachedCall } from "@/lib/yahoo-client";
import type { NewsArticle } from "@/types";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const { ticker: rawTicker } = await params;
  const ticker = rawTicker.toUpperCase();

  try {
    const data = await cachedCall(
      `news:${ticker}`,
      () => searchSymbols(ticker, { newsCount: 10, quotesCount: 0 }),
      300
    );

    const articles: NewsArticle[] = (data.news || []).map(
      (item: Record<string, unknown>) => ({
        datetime: item.providerPublishTime
          ? Math.floor(
              new Date(item.providerPublishTime as string).getTime() / 1000
            )
          : 0,
        headline: (item.title || "") as string,
        id: (item.uuid || String(Math.random())) as string,
        image: ((item.thumbnail as Record<string, unknown>)?.resolutions as Array<Record<string, unknown>>)?.[0]?.url as string || "",
        source: (item.publisher || "") as string,
        summary: "",
        url: (item.link || "") as string,
      })
    );

    return NextResponse.json({ articles });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch news";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
