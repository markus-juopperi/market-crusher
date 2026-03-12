"use client";

import { useState } from "react";
import Link from "next/link";
import { ComparisonChart } from "@/components/ComparisonChart";
import { TickerSearchInput } from "@/components/TickerSearchInput";

const MAX_TICKERS = 5;

export default function ComparePage() {
  const [tickers, setTickers] = useState<string[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const addTicker = (symbol: string, description?: string) => {
    const t = symbol.trim().toUpperCase();
    if (!t || tickers.includes(t) || tickers.length >= MAX_TICKERS) return;
    setTickers([...tickers, t]);
    if (description) setNames((prev) => ({ ...prev, [t]: description }));
  };

  const removeTicker = (ticker: string) => {
    setTickers(tickers.filter((t) => t !== ticker));
  };

  return (
    <div className="space-y-6">
      <Link
        href="/"
        className="inline-block text-sm text-gray-400 hover:text-white"
      >
        &larr; Back to Dashboard
      </Link>

      <h1 className="text-2xl font-bold text-white">Compare Stocks</h1>

      {/* Ticker input */}
      <div className="flex flex-wrap items-center gap-2">
        {tickers.length < MAX_TICKERS ? (
          <TickerSearchInput
            onSelect={addTicker}
            placeholder="Search tickers to compare..."
            className="w-64"
          />
        ) : (
          <span className="text-sm text-gray-500">Max tickers reached</span>
        )}
        <span className="text-xs text-gray-500">
          {tickers.length}/{MAX_TICKERS} tickers
        </span>
      </div>

      {/* Selected tickers */}
      {tickers.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tickers.map((t) => (
            <span
              key={t}
              className="flex items-center gap-1 rounded-full bg-gray-700 px-3 py-1 text-sm text-white"
            >
              {names[t] || t}
              <button
                onClick={() => removeTicker(t)}
                className="ml-1 text-gray-400 hover:text-red-400"
                aria-label={`Remove ${names[t] || t}`}
              >
                ✕
              </button>
            </span>
          ))}
          <button
            onClick={() => setTickers([])}
            className="text-xs text-gray-500 hover:text-gray-300"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Chart */}
      <ComparisonChart tickers={tickers} names={names} />
    </div>
  );
}
