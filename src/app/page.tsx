"use client";

import { WatchlistTable } from "@/components/WatchlistTable";
import { TopMovers } from "@/components/TopMovers";
import { PortfolioPanel } from "@/components/PortfolioPanel";
import { EarningsCalendar } from "@/components/EarningsCalendar";

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <WatchlistTable />
      <PortfolioPanel />
      <EarningsCalendar />
      <TopMovers />
    </div>
  );
}
