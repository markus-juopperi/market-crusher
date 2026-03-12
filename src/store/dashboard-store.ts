"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { TickerSnapshot, MarketStatus, PortfolioHolding } from "@/types";

interface DashboardStore {
  watchlist: string[];
  addTicker: (ticker: string) => void;
  removeTicker: (ticker: string) => void;

  snapshots: Record<string, TickerSnapshot>;
  setSnapshots: (data: Record<string, TickerSnapshot>) => void;

  marketStatus: MarketStatus | null;
  setMarketStatus: (status: MarketStatus) => void;

  portfolio: PortfolioHolding[];
  addHolding: (holding: Omit<PortfolioHolding, "id" | "addedAt">) => void;
  removeHolding: (id: string) => void;
  updateHolding: (id: string, shares: number, buyPrice: number) => void;
}

let holdingCounter = 0;

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

      portfolio: [],
      addHolding: (holding) => {
        const { portfolio } = get();
        const id = `${holding.ticker.toUpperCase()}-${Date.now()}-${++holdingCounter}`;
        set({
          portfolio: [
            ...portfolio,
            { ...holding, id, ticker: holding.ticker.toUpperCase(), addedAt: Date.now() },
          ],
        });
      },
      removeHolding: (id) =>
        set((s) => ({
          portfolio: s.portfolio.filter((h) => h.id !== id),
        })),
      updateHolding: (id, shares, buyPrice) =>
        set((s) => ({
          portfolio: s.portfolio.map((h) =>
            h.id === id ? { ...h, shares, buyPrice } : h
          ),
        })),
    }),
    {
      name: "market-crusher-store",
      partialize: (state) => ({
        watchlist: state.watchlist,
        portfolio: state.portfolio,
      }),
    }
  )
);
