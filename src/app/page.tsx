"use client";

import { WatchlistTable } from "@/components/WatchlistTable";
import { TopMovers } from "@/components/TopMovers";

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <WatchlistTable />
      <TopMovers />
    </div>
  );
}
