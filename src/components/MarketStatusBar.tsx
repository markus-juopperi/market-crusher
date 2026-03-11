"use client";

import { useEffect } from "react";
import { useDashboardStore } from "@/store/dashboard-store";
import { cn } from "@/lib/utils";

export function MarketStatusBar() {
  const { marketStatus, setMarketStatus } = useDashboardStore();

  useEffect(() => {
    function fetchStatus() {
      fetch("/api/market/status")
        .then((res) => res.json())
        .then((data) => {
          if (data.exchange) setMarketStatus(data);
        })
        .catch(() => {});
    }

    fetchStatus();
    const interval = setInterval(fetchStatus, 300_000);
    return () => clearInterval(interval);
  }, [setMarketStatus]);

  if (!marketStatus) return null;

  const isOpen = marketStatus.isOpen;
  const isPrePost = marketStatus.session === "pre-market" || marketStatus.session === "post-market";

  return (
    <div
      className={cn(
        "px-4 py-2 text-center text-sm font-medium",
        isOpen && "bg-green-900/50 text-green-300",
        !isOpen && !isPrePost && "bg-red-900/50 text-red-300",
        isPrePost && "bg-yellow-900/50 text-yellow-300"
      )}
    >
      Market:{" "}
      {isOpen
        ? "Open"
        : isPrePost
        ? marketStatus.session === "pre-market"
          ? "Pre-Market"
          : "After Hours"
        : "Closed"}
      <span className="ml-4 text-xs opacity-70">
        Real-time data · Powered by Yahoo Finance
      </span>
    </div>
  );
}
