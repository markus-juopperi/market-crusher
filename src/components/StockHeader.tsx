"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { StockProfile, TickerSnapshot } from "@/types";
import { formatCurrency, formatPercent, formatLargeNumber, cn } from "@/lib/utils";

interface StockHeaderProps {
  ticker: string;
}

export function StockHeader({ ticker }: StockHeaderProps) {
  const [profile, setProfile] = useState<StockProfile | null>(null);
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
          <Image
            src={profile.logo}
            alt=""
            width={48}
            height={48}
            className="h-12 w-12 rounded-lg"
            unoptimized
          />
        )}
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">{profile?.name || ticker}</h1>
            {profile?.name && (
              <span className="text-lg text-gray-400">{ticker}</span>
            )}
          </div>
          {quote && (
            <div className="mt-1 flex items-baseline gap-3">
              <span className="text-3xl font-bold text-white">
                {formatCurrency(quote.price, quote.currency)}
              </span>
              <span
                className={cn(
                  "text-lg font-medium",
                  isPositive ? "text-green-400" : "text-red-400"
                )}
              >
                {formatCurrency(quote.change, quote.currency)}{" "}
                ({formatPercent(quote.changePercent)})
              </span>
            </div>
          )}
          {profile && (
            <div className="mt-2 flex gap-4 text-sm text-gray-400">
              {profile.marketCap > 0 && (
                <span>Market Cap: {formatLargeNumber(profile.marketCap)}</span>
              )}
              {profile.industry && (
                <span>Industry: {profile.industry}</span>
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
