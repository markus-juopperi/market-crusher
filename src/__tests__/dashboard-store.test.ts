import { describe, it, expect, beforeEach } from "vitest";
import { useDashboardStore } from "@/store/dashboard-store";

describe("dashboard store", () => {
  beforeEach(() => {
    // Reset the store between tests
    useDashboardStore.setState({
      watchlist: [],
      snapshots: {},
      marketStatus: null,
    });
  });

  describe("watchlist", () => {
    it("starts with empty watchlist", () => {
      expect(useDashboardStore.getState().watchlist).toEqual([]);
    });

    it("adds a ticker", () => {
      useDashboardStore.getState().addTicker("AAPL");
      expect(useDashboardStore.getState().watchlist).toEqual(["AAPL"]);
    });

    it("uppercases tickers", () => {
      useDashboardStore.getState().addTicker("aapl");
      expect(useDashboardStore.getState().watchlist).toEqual(["AAPL"]);
    });

    it("does not add duplicates", () => {
      useDashboardStore.getState().addTicker("AAPL");
      useDashboardStore.getState().addTicker("AAPL");
      expect(useDashboardStore.getState().watchlist).toEqual(["AAPL"]);
    });

    it("limits to 10 tickers", () => {
      const tickers = Array.from({ length: 11 }, (_, i) => `T${i}`);
      tickers.forEach((t) => useDashboardStore.getState().addTicker(t));
      expect(useDashboardStore.getState().watchlist).toHaveLength(10);
    });

    it("removes a ticker", () => {
      useDashboardStore.getState().addTicker("AAPL");
      useDashboardStore.getState().addTicker("MSFT");
      useDashboardStore.getState().removeTicker("AAPL");
      expect(useDashboardStore.getState().watchlist).toEqual(["MSFT"]);
    });

    it("handles removing non-existent ticker gracefully", () => {
      useDashboardStore.getState().addTicker("AAPL");
      useDashboardStore.getState().removeTicker("GOOGL");
      expect(useDashboardStore.getState().watchlist).toEqual(["AAPL"]);
    });
  });

  describe("snapshots", () => {
    it("sets snapshots", () => {
      const snapshots = {
        AAPL: {
          ticker: "AAPL",
          price: 150,
          change: 2.5,
          changePercent: 1.7,
          high: 152,
          low: 148,
          open: 149,
          prevClose: 147.5,
          updated: Date.now(),
        },
      };
      useDashboardStore.getState().setSnapshots(snapshots);
      expect(useDashboardStore.getState().snapshots).toEqual(snapshots);
    });
  });

  describe("marketStatus", () => {
    it("starts as null", () => {
      expect(useDashboardStore.getState().marketStatus).toBeNull();
    });

    it("sets market status", () => {
      const status = { exchange: "US", isOpen: true, session: "regular" };
      useDashboardStore.getState().setMarketStatus(status);
      expect(useDashboardStore.getState().marketStatus).toEqual(status);
    });
  });
});
