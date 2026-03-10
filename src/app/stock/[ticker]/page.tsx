"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { StockHeader } from "@/components/StockHeader";
import { PriceChart } from "@/components/PriceChart";
import { KeyStatsGrid } from "@/components/KeyStatsGrid";
import { NewsFeed } from "@/components/NewsFeed";

export default function StockDetailPage() {
  const params = useParams();
  const ticker = (params.ticker as string).toUpperCase();

  return (
    <div className="space-y-6">
      <Link
        href="/"
        className="inline-block text-sm text-gray-400 hover:text-white"
      >
        &larr; Back to Dashboard
      </Link>
      <StockHeader ticker={ticker} />
      <PriceChart ticker={ticker} />
      <KeyStatsGrid ticker={ticker} />
      <NewsFeed ticker={ticker} />
    </div>
  );
}
