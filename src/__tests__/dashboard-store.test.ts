import { describe, it, expect, beforeEach } from "vitest";
import { useDashboardStore } from "@/store/dashboard-store";

describe("dashboard store", () => {
  beforeEach(() => {
    // Reset the store between tests
    useDashboardStore.setState({
      watchlist: [],
      snapshots: {},
      marketStatus: null,
      portfolio: [],
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

  describe("portfolio", () => {
    it("starts with empty portfolio", () => {
      expect(useDashboardStore.getState().portfolio).toEqual([]);
    });

    it("adds a holding", () => {
      useDashboardStore.getState().addHolding({ ticker: "AAPL", shares: 10, buyPrice: 150 });
      const portfolio = useDashboardStore.getState().portfolio;
      expect(portfolio).toHaveLength(1);
      expect(portfolio[0].ticker).toBe("AAPL");
      expect(portfolio[0].shares).toBe(10);
      expect(portfolio[0].buyPrice).toBe(150);
      expect(portfolio[0].addedAt).toBeGreaterThan(0);
    });

    it("uppercases ticker when adding holding", () => {
      useDashboardStore.getState().addHolding({ ticker: "aapl", shares: 5, buyPrice: 100 });
      expect(useDashboardStore.getState().portfolio[0].ticker).toBe("AAPL");
    });

    it("allows multiple positions of the same ticker", () => {
      useDashboardStore.getState().addHolding({ ticker: "AAPL", shares: 10, buyPrice: 150 });
      useDashboardStore.getState().addHolding({ ticker: "AAPL", shares: 20, buyPrice: 200 });
      expect(useDashboardStore.getState().portfolio).toHaveLength(2);
      expect(useDashboardStore.getState().portfolio[0].shares).toBe(10);
      expect(useDashboardStore.getState().portfolio[1].shares).toBe(20);
    });

    it("generates unique id for each holding", () => {
      useDashboardStore.getState().addHolding({ ticker: "AAPL", shares: 10, buyPrice: 150 });
      useDashboardStore.getState().addHolding({ ticker: "AAPL", shares: 20, buyPrice: 200 });
      const portfolio = useDashboardStore.getState().portfolio;
      expect(portfolio[0].id).toBeDefined();
      expect(portfolio[1].id).toBeDefined();
      expect(portfolio[0].id).not.toBe(portfolio[1].id);
    });

    it("removes a holding by id", () => {
      useDashboardStore.getState().addHolding({ ticker: "AAPL", shares: 10, buyPrice: 150 });
      useDashboardStore.getState().addHolding({ ticker: "MSFT", shares: 5, buyPrice: 300 });
      const id = useDashboardStore.getState().portfolio[0].id;
      useDashboardStore.getState().removeHolding(id);
      expect(useDashboardStore.getState().portfolio).toHaveLength(1);
      expect(useDashboardStore.getState().portfolio[0].ticker).toBe("MSFT");
    });

    it("updates a holding by id", () => {
      useDashboardStore.getState().addHolding({ ticker: "AAPL", shares: 10, buyPrice: 150 });
      const id = useDashboardStore.getState().portfolio[0].id;
      useDashboardStore.getState().updateHolding(id, 20, 160);
      const holding = useDashboardStore.getState().portfolio[0];
      expect(holding.shares).toBe(20);
      expect(holding.buyPrice).toBe(160);
    });

    it("handles removing non-existent id gracefully", () => {
      useDashboardStore.getState().addHolding({ ticker: "AAPL", shares: 10, buyPrice: 150 });
      useDashboardStore.getState().removeHolding("nonexistent-id");
      expect(useDashboardStore.getState().portfolio).toHaveLength(1);
    });
  });
});
