"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useDashboardStore } from "@/store/dashboard-store";
import { formatLargeNumber } from "@/lib/utils";
import type { EarningsEvent } from "@/types";

export function EarningsCalendar() {
  const { watchlist, portfolio } = useDashboardStore();
  const [events, setEvents] = useState<EarningsEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // Unique tickers from watchlist + portfolio
  const tickers = Array.from(
    new Set([...watchlist, ...portfolio.map((h) => h.ticker)])
  );

  useEffect(() => {
    if (tickers.length === 0) {
      setEvents([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    Promise.all(
      tickers.map((t) =>
        fetch(`/api/stocks/earnings/${t}`)
          .then((res) => res.json())
          .then((data) => data.earnings as EarningsEvent | null)
          .catch(() => null)
      )
    ).then((results) => {
      const valid = results
        .filter((e): e is EarningsEvent => e !== null)
        .sort((a, b) => a.date.localeCompare(b.date));
      setEvents(valid);
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tickers.join(",")]);

  if (tickers.length === 0) return null;

  return (
    <div>
      <h2 className="mb-2 text-lg font-semibold text-white">
        Earnings Calendar
      </h2>
      {loading ? (
        <p className="text-gray-500">Loading earnings dates...</p>
      ) : events.length === 0 ? (
        <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-6 text-center text-gray-400">
          No upcoming earnings dates found for your tickers.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-700">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700 bg-gray-800 text-gray-400">
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Company</th>
                <th className="hidden px-4 py-3 text-right md:table-cell">
                  EPS Est.
                </th>
                <th className="hidden px-4 py-3 text-right md:table-cell">
                  Revenue Est.
                </th>
              </tr>
            </thead>
            <tbody>
              {events.map((e) => (
                <tr
                  key={e.ticker}
                  className="border-b border-gray-700 hover:bg-gray-800/50"
                >
                  <td className="px-4 py-3 text-gray-300">{e.date}</td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/stock/${e.ticker}`}
                      className="font-medium text-white hover:text-blue-400"
                    >
                      {e.name}
                    </Link>
                    <span className="ml-2 text-gray-500">{e.ticker}</span>
                  </td>
                  <td className="hidden px-4 py-3 text-right text-gray-300 md:table-cell">
                    {e.epsEstimate !== null ? `$${e.epsEstimate.toFixed(2)}` : "—"}
                  </td>
                  <td className="hidden px-4 py-3 text-right text-gray-300 md:table-cell">
                    {e.revenueEstimate !== null
                      ? `$${formatLargeNumber(e.revenueEstimate)}`
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
