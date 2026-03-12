"use client";

import { WatchlistTable } from "@/components/WatchlistTable";
import { TopMovers } from "@/components/TopMovers";
import { PortfolioPanel } from "@/components/PortfolioPanel";

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <WatchlistTable />
      <PortfolioPanel />
      <TopMovers />
    </div>
  );
}
