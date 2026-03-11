"use client";

import Link from "next/link";
import type { TickerSnapshot } from "@/types";
import { formatCurrency, formatPercent, cn } from "@/lib/utils";
import { useDashboardStore } from "@/store/dashboard-store";

interface WatchlistRowProps {
  snapshot: TickerSnapshot;
}

export function WatchlistRow({ snapshot }: WatchlistRowProps) {
  const removeTicker = useDashboardStore((s) => s.removeTicker);
  const isPositive = snapshot.change >= 0;

  return (
    <tr className={cn("border-b border-gray-700 hover:bg-gray-800/50", isPositive ? "text-green-400" : "text-red-400")}>
      <td className="px-4 py-3">
        <Link href={`/stock/${snapshot.ticker}`} className="font-medium text-white hover:text-blue-400">
          {snapshot.ticker}
        </Link>
      </td>
      <td className="px-4 py-3 text-right text-white">{formatCurrency(snapshot.price, snapshot.currency)}</td>
      <td className="px-4 py-3 text-right">{formatCurrency(snapshot.change, snapshot.currency)}</td>
      <td className="px-4 py-3 text-right">{formatPercent(snapshot.changePercent)}</td>
      <td className="hidden px-4 py-3 text-right text-gray-300 md:table-cell">
        {formatCurrency(snapshot.high, snapshot.currency)}
      </td>
      <td className="hidden px-4 py-3 text-right text-gray-300 md:table-cell">
        {formatCurrency(snapshot.low, snapshot.currency)}
      </td>
      <td className="hidden px-4 py-3 text-right text-gray-300 lg:table-cell">
        {formatCurrency(snapshot.prevClose, snapshot.currency)}
      </td>
      <td className="px-4 py-3 text-right">
        <button
          onClick={() => removeTicker(snapshot.ticker)}
          className="text-gray-500 hover:text-red-400"
          aria-label={`Remove ${snapshot.ticker}`}
        >
          ✕
        </button>
      </td>
    </tr>
  );
}
