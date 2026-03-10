"use client";

import { useEffect, useState } from "react";
import type { FinnhubProfile, TickerSnapshot } from "@/types";
import { formatCurrency, formatPercent, formatLargeNumber, cn } from "@/lib/utils";

interface StockHeaderProps {
  ticker: string;
}

export function StockHeader({ ticker }: StockHeaderProps) {
  const [profile, setProfile] = useState<FinnhubProfile | null>(null);
  const [quote, setQuote] = useState<TickerSnapshot | null>(null);

  useEffect(() => {
    fetch(`/api/stocks/details/${ticker}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.name) setProfile(data);
      })
      .catch(() => {});

    function fetchQuote() {
      fetch(`/api/stocks/snapshot/${ticker}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.ticker) setQuote(data.ticker);
        })
        .catch(() => {});
    }
    fetchQuote();
    const interval = setInterval(fetchQuote, 30_000);
    return () => clearInterval(interval);
  }, [ticker]);

  const isPositive = (quote?.change || 0) >= 0;

  return (
    <div className="mb-6">
      <div className="flex items-start gap-4">
        {profile?.logo && (
          <img
            src={profile.logo}
            alt=""
            className="h-12 w-12 rounded-lg"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        )}
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">{ticker}</h1>
            {profile?.name && (
              <span className="text-lg text-gray-400">{profile.name}</span>
            )}
          </div>
          {quote && (
            <div className="mt-1 flex items-baseline gap-3">
              <span className="text-3xl font-bold text-white">
                {formatCurrency(quote.price)}
              </span>
              <span
                className={cn(
                  "text-lg font-medium",
                  isPositive ? "text-green-400" : "text-red-400"
                )}
              >
                {formatCurrency(quote.change)}{" "}
                ({formatPercent(quote.changePercent)})
              </span>
            </div>
          )}
          {profile && (
            <div className="mt-2 flex gap-4 text-sm text-gray-400">
              {profile.marketCapitalization > 0 && (
                <span>Market Cap: {formatLargeNumber(profile.marketCapitalization * 1e6)}</span>
              )}
              {profile.finnhubIndustry && (
                <span>Industry: {profile.finnhubIndustry}</span>
              )}
              {profile.exchange && (
                <span>{profile.exchange}</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
