"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { TickerSnapshot } from "@/types";
import { formatCurrency, formatPercent, cn } from "@/lib/utils";

type Direction = "gainers" | "losers";

export function TopMovers() {
  const [direction, setDirection] = useState<Direction>("gainers");
  const [movers, setMovers] = useState<TickerSnapshot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/stocks/movers/${direction}`)
      .then((res) => res.json())
      .then((data) => setMovers(data.tickers || []))
      .catch(() => setMovers([]))
      .finally(() => setLoading(false));

    const interval = setInterval(() => {
      fetch(`/api/stocks/movers/${direction}`)
        .then((res) => res.json())
        .then((data) => setMovers(data.tickers || []))
        .catch(() => {});
    }, 180_000);

    return () => clearInterval(interval);
  }, [direction]);

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <h2 className="text-lg font-semibold text-white">Popular Stocks</h2>
        <div className="ml-auto flex rounded-lg bg-gray-800 p-1">
          <button
            onClick={() => setDirection("gainers")}
            className={cn(
              "rounded-md px-3 py-1 text-sm",
              direction === "gainers"
                ? "bg-green-600 text-white"
                : "text-gray-400 hover:text-white"
            )}
          >
            Gainers
          </button>
          <button
            onClick={() => setDirection("losers")}
            className={cn(
              "rounded-md px-3 py-1 text-sm",
              direction === "losers"
                ? "bg-red-600 text-white"
                : "text-gray-400 hover:text-white"
            )}
          >
            Losers
          </button>
        </div>
      </div>
      {loading ? (
        <div className="py-8 text-center text-gray-500">Loading movers...</div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-700">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700 bg-gray-800 text-gray-400">
                <th className="px-4 py-2 text-left">Symbol</th>
                <th className="px-4 py-2 text-right">Price</th>
                <th className="px-4 py-2 text-right">Change</th>
                <th className="px-4 py-2 text-right">Change %</th>
              </tr>
            </thead>
            <tbody>
              {movers.map((m) => {
                const isPositive = m.changePercent >= 0;
                return (
                  <tr key={m.ticker} className="border-b border-gray-700 hover:bg-gray-800/50">
                    <td className="px-4 py-2">
                      <Link href={`/stock/${m.ticker}`} className="font-medium text-white hover:text-blue-400">
                        {m.ticker}
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-right text-white">{formatCurrency(m.price)}</td>
                    <td className={cn("px-4 py-2 text-right", isPositive ? "text-green-400" : "text-red-400")}>
                      {formatCurrency(m.change)}
                    </td>
                    <td className={cn("px-4 py-2 text-right", isPositive ? "text-green-400" : "text-red-400")}>
                      {formatPercent(m.changePercent)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
