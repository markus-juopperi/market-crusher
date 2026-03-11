"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { TickerSnapshot, MarketStatus } from "@/types";

interface DashboardStore {
  watchlist: string[];
  addTicker: (ticker: string) => void;
  removeTicker: (ticker: string) => void;

  snapshots: Record<string, TickerSnapshot>;
  setSnapshots: (data: Record<string, TickerSnapshot>) => void;

  marketStatus: MarketStatus | null;
  setMarketStatus: (status: MarketStatus) => void;

}

export const useDashboardStore = create<DashboardStore>()(
  persist(
    (set, get) => ({
      watchlist: [],
      addTicker: (ticker) => {
        const { watchlist } = get();
        if (watchlist.length >= 10) return;
        if (watchlist.includes(ticker.toUpperCase())) return;
        set({ watchlist: [...watchlist, ticker.toUpperCase()] });
      },
      removeTicker: (ticker) =>
        set((s) => ({
          watchlist: s.watchlist.filter((t) => t !== ticker),
        })),

      snapshots: {},
      setSnapshots: (data) => set({ snapshots: data }),

      marketStatus: null,
      setMarketStatus: (status) => set({ marketStatus: status }),

    }),
    {
      name: "market-crusher-store",
      partialize: (state) => ({
        watchlist: state.watchlist,
      }),
    }
  )
);
