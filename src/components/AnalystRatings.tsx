"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { AnalystRating } from "@/types";

interface AnalystRatingsProps {
  ticker: string;
}

function RatingBar({ rating }: { rating: AnalystRating }) {
  const total =
    rating.strongBuy + rating.buy + rating.hold + rating.sell + rating.strongSell;
  if (total === 0) return null;

  const segments = [
    { count: rating.strongBuy, label: "Strong Buy", color: "bg-green-500" },
    { count: rating.buy, label: "Buy", color: "bg-green-400" },
    { count: rating.hold, label: "Hold", color: "bg-yellow-400" },
    { count: rating.sell, label: "Sell", color: "bg-red-400" },
    { count: rating.strongSell, label: "Strong Sell", color: "bg-red-500" },
  ];

  return (
    <div>
      {/* Bar */}
      <div className="flex h-6 w-full overflow-hidden rounded">
        {segments.map(
          (seg) =>
            seg.count > 0 && (
              <div
                key={seg.label}
                className={cn(
                  seg.color,
                  "flex items-center justify-center text-xs font-medium text-gray-900"
                )}
                style={{ width: `${(seg.count / total) * 100}%` }}
                title={`${seg.label}: ${seg.count}`}
              >
                {seg.count}
              </div>
            )
        )}
      </div>
      {/* Legend */}
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400">
        {segments.map(
          (seg) =>
            seg.count > 0 && (
              <span key={seg.label} className="flex items-center gap-1">
                <span
                  className={cn("inline-block h-2 w-2 rounded-full", seg.color)}
                />
                {seg.label} ({seg.count})
              </span>
            )
        )}
        <span className="ml-auto text-gray-500">
          {total} analyst{total !== 1 ? "s" : ""}
        </span>
      </div>
    </div>
  );
}

export function AnalystRatings({ ticker }: AnalystRatingsProps) {
  const [ratings, setRatings] = useState<AnalystRating[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/stocks/ratings/${ticker}`)
      .then((res) => res.json())
      .then((data) => setRatings(data.ratings || []))
      .catch(() => setRatings([]))
      .finally(() => setLoading(false));
  }, [ticker]);

  // Show current month's ratings (period "0m" = this month)
  const current = ratings.find((r) => r.period === "0m");

  return (
    <div>
      <h3 className="mb-4 text-lg font-semibold text-white">Analyst Ratings</h3>
      {loading ? (
        <p className="text-gray-500">Loading ratings...</p>
      ) : !current ||
        current.strongBuy + current.buy + current.hold + current.sell + current.strongSell === 0 ? (
        <p className="text-gray-500">No analyst ratings available.</p>
      ) : (
        <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-4">
          <RatingBar rating={current} />
        </div>
      )}
    </div>
  );
}
