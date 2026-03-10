"use client";

import { useEffect, useCallback } from "react";
import { useDashboardStore } from "@/store/dashboard-store";
import { WatchlistRow } from "./WatchlistRow";
import type { TickerSnapshot } from "@/types";
import { timeAgo } from "@/lib/utils";

export function WatchlistTable() {
  const { watchlist, snapshots, setSnapshots } = useDashboardStore();

  const fetchSnapshots = useCallback(() => {
    if (watchlist.length === 0) return;
    const tickers = watchlist.join(",");
    fetch(`/api/stocks/snapshot?tickers=${tickers}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.tickers) {
          const map: Record<string, TickerSnapshot> = {};
          data.tickers.forEach((t: TickerSnapshot) => {
            map[t.ticker] = t;
          });
          setSnapshots(map);
        }
      })
      .catch(() => {});
  }, [watchlist, setSnapshots]);

  useEffect(() => {
    fetchSnapshots();
    const interval = setInterval(fetchSnapshots, 30_000);
    return () => clearInterval(interval);
  }, [fetchSnapshots]);

  if (watchlist.length === 0) {
    return (
      <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-8 text-center text-gray-400">
        <p className="text-lg">No tickers in your watchlist</p>
        <p className="mt-2 text-sm">Use the search bar to add stocks (max 10)</p>
      </div>
    );
  }

  const lastUpdate = Object.values(snapshots)[0]?.updated;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Watchlist</h2>
        {lastUpdate && (
          <span className="text-xs text-gray-500">
            Last updated: {timeAgo(lastUpdate)}
          </span>
        )}
      </div>
      <div className="overflow-x-auto rounded-lg border border-gray-700">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-700 bg-gray-800 text-gray-400">
              <th className="px-4 py-3 text-left">Symbol</th>
              <th className="px-4 py-3 text-right">Price</th>
              <th className="px-4 py-3 text-right">Change</th>
              <th className="px-4 py-3 text-right">Change %</th>
              <th className="hidden px-4 py-3 text-right md:table-cell">High</th>
              <th className="hidden px-4 py-3 text-right md:table-cell">Low</th>
              <th className="hidden px-4 py-3 text-right lg:table-cell">Prev Close</th>
              <th className="px-4 py-3 text-right"></th>
            </tr>
          </thead>
          <tbody>
            {watchlist.map((ticker) => {
              const snapshot = snapshots[ticker];
              if (!snapshot) {
                return (
                  <tr key={ticker} className="border-b border-gray-700">
                    <td className="px-4 py-3 text-white">{ticker}</td>
                    <td colSpan={7} className="px-4 py-3 text-gray-500">Loading...</td>
                  </tr>
                );
              }
              return <WatchlistRow key={ticker} snapshot={snapshot} />;
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
