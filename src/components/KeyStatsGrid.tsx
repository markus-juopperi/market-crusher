"use client";

import { useEffect, useState } from "react";
import type { TickerSnapshot } from "@/types";
import { formatCurrency } from "@/lib/utils";

interface KeyStatsGridProps {
  ticker: string;
}

export function KeyStatsGrid({ ticker }: KeyStatsGridProps) {
  const [quote, setQuote] = useState<TickerSnapshot | null>(null);

  useEffect(() => {
    fetch(`/api/stocks/snapshot/${ticker}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.ticker) setQuote(data.ticker);
      })
      .catch(() => {});
  }, [ticker]);

  if (!quote) {
    return (
      <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-6">
        <h3 className="mb-4 text-lg font-semibold text-white">Key Stats</h3>
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  const cur = quote.currency;
  const stats = [
    { label: "Open", value: formatCurrency(quote.open, cur) },
    { label: "High", value: formatCurrency(quote.high, cur) },
    { label: "Low", value: formatCurrency(quote.low, cur) },
    { label: "Price", value: formatCurrency(quote.price, cur) },
    { label: "Prev Close", value: formatCurrency(quote.prevClose, cur) },
  ];

  return (
    <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-6">
      <h3 className="mb-4 text-lg font-semibold text-white">Key Stats</h3>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        {stats.map((stat) => (
          <div key={stat.label}>
            <div className="text-xs text-gray-400">{stat.label}</div>
            <div className="text-sm font-medium text-white">{stat.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
