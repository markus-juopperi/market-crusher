"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { decodePortfolio } from "@/lib/portfolio-sharing";
import { formatCurrency, formatPercent, cn } from "@/lib/utils";
import type { SharedPortfolioEntry, TickerSnapshot } from "@/types";

interface HoldingRow extends SharedPortfolioEntry {
  currentPrice: number;
  marketValue: number;
  costBasis: number;
  pnl: number;
  pnlPercent: number;
  name: string;
  hasPrice: boolean;
}

export default function SharedPortfolioPage() {
  return (
    <Suspense fallback={<p className="text-gray-500">Loading portfolio...</p>}>
      <SharedPortfolioContent />
    </Suspense>
  );
}

function SharedPortfolioContent() {
  const searchParams = useSearchParams();
  const encoded = searchParams.get("p");
  const [holdings, setHoldings] = useState<HoldingRow[]>([]);
  const [loading, setLoading] = useState(true);

  const entries = encoded ? decodePortfolio(encoded) : [];

  useEffect(() => {
    if (entries.length === 0) {
      setLoading(false);
      return;
    }

    const tickers = entries.map((e) => e.ticker).join(",");
    fetch(`/api/stocks/snapshot?tickers=${tickers}`)
      .then((res) => res.json())
      .then((data) => {
        const snapshotMap: Record<string, TickerSnapshot> = {};
        for (const snap of data.tickers || []) {
          snapshotMap[snap.ticker] = snap;
        }

        const rows: HoldingRow[] = entries.map((e) => {
          const snap = snapshotMap[e.ticker];
          const currentPrice = snap?.price ?? 0;
          const marketValue = currentPrice * e.shares;
          const costBasis = e.buyPrice * e.shares;
          const pnl = marketValue - costBasis;
          const pnlPercent = costBasis > 0 ? (pnl / costBasis) * 100 : 0;
          return {
            ...e,
            currentPrice,
            marketValue,
            costBasis,
            pnl,
            pnlPercent,
            name: snap?.name || e.ticker,
            hasPrice: !!snap,
          };
        });

        setHoldings(rows);
        setLoading(false);
      })
      .catch(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [encoded]);

  const totalValue = holdings.reduce((sum, h) => sum + h.marketValue, 0);
  const totalCost = holdings.reduce((sum, h) => sum + h.costBasis, 0);
  const totalPnl = totalValue - totalCost;
  const totalPnlPercent = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0;

  if (!encoded || entries.length === 0) {
    return (
      <div className="space-y-4">
        <Link
          href="/"
          className="inline-block text-sm text-gray-400 hover:text-white"
        >
          &larr; Back to Dashboard
        </Link>
        <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-8 text-center text-gray-400">
          <p className="text-lg">No portfolio data found</p>
          <p className="mt-2 text-sm">
            This link may be invalid or expired.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-block text-sm text-gray-400 hover:text-white"
        >
          &larr; Back to Dashboard
        </Link>
        <span className="rounded bg-gray-700 px-2 py-1 text-xs text-gray-400">
          Shared Portfolio (read-only)
        </span>
      </div>

      <h1 className="text-2xl font-bold text-white">Shared Portfolio</h1>

      {loading ? (
        <p className="text-gray-500">Loading portfolio...</p>
      ) : (
        <>
          {/* Summary bar */}
          <div className="flex flex-wrap gap-6 rounded-lg border border-gray-700 bg-gray-800/50 px-4 py-3">
            <div>
              <span className="text-xs text-gray-400">Total Value</span>
              <p className="text-sm font-medium text-white">
                {formatCurrency(totalValue)}
              </p>
            </div>
            <div>
              <span className="text-xs text-gray-400">Total Cost</span>
              <p className="text-sm font-medium text-white">
                {formatCurrency(totalCost)}
              </p>
            </div>
            <div>
              <span className="text-xs text-gray-400">Total P&L</span>
              <p
                className={cn(
                  "text-sm font-medium",
                  totalPnl >= 0 ? "text-green-400" : "text-red-400"
                )}
              >
                {formatCurrency(totalPnl)} ({formatPercent(totalPnlPercent)})
              </p>
            </div>
          </div>

          {/* Holdings table */}
          <div className="overflow-x-auto rounded-lg border border-gray-700">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700 bg-gray-800 text-gray-400">
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-right">Shares</th>
                  <th className="px-4 py-3 text-right">Buy Price</th>
                  <th className="px-4 py-3 text-right">Current</th>
                  <th className="hidden px-4 py-3 text-right md:table-cell">
                    Market Value
                  </th>
                  <th className="px-4 py-3 text-right">P&L</th>
                </tr>
              </thead>
              <tbody>
                {holdings.map((h) => (
                  <tr
                    key={h.ticker}
                    className={cn(
                      "border-b border-gray-700 hover:bg-gray-800/50",
                      h.hasPrice
                        ? h.pnl >= 0
                          ? "text-green-400"
                          : "text-red-400"
                        : "text-gray-400"
                    )}
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/stock/${h.ticker}`}
                        className="font-medium text-white hover:text-blue-400"
                      >
                        {h.name}
                      </Link>
                      <span className="ml-2 text-gray-500">{h.ticker}</span>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-300">
                      {h.shares}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-300">
                      {formatCurrency(h.buyPrice)}
                    </td>
                    <td className="px-4 py-3 text-right text-white">
                      {h.hasPrice ? formatCurrency(h.currentPrice) : "\u2014"}
                    </td>
                    <td className="hidden px-4 py-3 text-right text-gray-300 md:table-cell">
                      {h.hasPrice ? formatCurrency(h.marketValue) : "\u2014"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {h.hasPrice ? (
                        <span>
                          {formatCurrency(h.pnl)} (
                          {formatPercent(h.pnlPercent)})
                        </span>
                      ) : (
                        "\u2014"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
