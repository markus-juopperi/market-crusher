"use client";

import { useState } from "react";
import { useDashboardStore } from "@/store/dashboard-store";
import { formatCurrency, formatPercent, cn } from "@/lib/utils";
import { TickerSearchInput } from "@/components/TickerSearchInput";
import Link from "next/link";

export function PortfolioPanel() {
  const { portfolio, snapshots, addHolding, removeHolding, updateHolding } =
    useDashboardStore();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [ticker, setTicker] = useState("");
  const [shares, setShares] = useState("");
  const [buyPrice, setBuyPrice] = useState("");

  const editHolding = editId ? portfolio.find((h) => h.id === editId) : null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const s = parseFloat(shares);
    const p = parseFloat(buyPrice);
    if (!ticker.trim() || isNaN(s) || s <= 0 || isNaN(p) || p <= 0) return;
    addHolding({ ticker: ticker.trim(), shares: s, buyPrice: p });
    setTicker("");
    setShares("");
    setBuyPrice("");
    setShowForm(false);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    const s = parseFloat(shares);
    const p = parseFloat(buyPrice);
    if (!editId || isNaN(s) || s <= 0 || isNaN(p) || p <= 0) return;
    updateHolding(editId, s, p);
    setEditId(null);
    setShares("");
    setBuyPrice("");
  };

  const startEdit = (id: string, s: number, p: number) => {
    setEditId(id);
    setShares(String(s));
    setBuyPrice(String(p));
    setShowForm(false);
  };

  // Calculate P&L for each holding
  const holdings = portfolio.map((h) => {
    const snap = snapshots[h.ticker];
    const currentPrice = snap?.price ?? 0;
    const marketValue = currentPrice * h.shares;
    const costBasis = h.buyPrice * h.shares;
    const pnl = marketValue - costBasis;
    const pnlPercent = costBasis > 0 ? (pnl / costBasis) * 100 : 0;
    return { ...h, currentPrice, marketValue, costBasis, pnl, pnlPercent, hasPrice: !!snap };
  });

  const totalValue = holdings.reduce((sum, h) => sum + h.marketValue, 0);
  const totalCost = holdings.reduce((sum, h) => sum + h.costBasis, 0);
  const totalPnl = totalValue - totalCost;
  const totalPnlPercent = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Portfolio</h2>
        <button
          onClick={() => { setShowForm(!showForm); setEditId(null); }}
          className="rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700"
        >
          {showForm ? "Cancel" : "+ Add Position"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="mb-4 flex flex-wrap gap-2 rounded-lg border border-gray-700 bg-gray-800/50 p-3">
          <TickerSearchInput
            onSelect={(symbol) => setTicker(symbol)}
            placeholder="Search ticker..."
            className="w-48"
          />
          {ticker && (
            <span className="flex items-center rounded bg-blue-600/20 px-2 py-1 text-sm text-blue-400">
              {ticker}
            </span>
          )}
          <input
            type="number"
            value={shares}
            onChange={(e) => setShares(e.target.value)}
            placeholder="Shares"
            step="1"
            min="0"
            className="w-24 rounded bg-gray-700 px-2 py-1 text-sm text-white placeholder-gray-400 outline-none ring-1 ring-gray-600 focus:ring-blue-500 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]"
            required
          />
          <input
            type="number"
            value={buyPrice}
            onChange={(e) => setBuyPrice(e.target.value)}
            placeholder="Buy Price"
            step="1"
            min="0"
            className="w-28 rounded bg-gray-700 px-2 py-1 text-sm text-white placeholder-gray-400 outline-none ring-1 ring-gray-600 focus:ring-blue-500 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]"
            required
          />
          <button type="submit" className="rounded bg-green-600 px-3 py-1 text-sm text-white hover:bg-green-700">
            Add
          </button>
        </form>
      )}

      {editHolding && (
        <form onSubmit={handleUpdate} className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-gray-700 bg-gray-800/50 p-3">
          <span className="text-sm font-medium text-white">Edit {editHolding.ticker}:</span>
          <input
            type="number"
            value={shares}
            onChange={(e) => setShares(e.target.value)}
            placeholder="Shares"
            step="1"
            min="0"
            className="w-24 rounded bg-gray-700 px-2 py-1 text-sm text-white placeholder-gray-400 outline-none ring-1 ring-gray-600 focus:ring-blue-500 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]"
            required
          />
          <input
            type="number"
            value={buyPrice}
            onChange={(e) => setBuyPrice(e.target.value)}
            placeholder="Buy Price"
            step="1"
            min="0"
            className="w-28 rounded bg-gray-700 px-2 py-1 text-sm text-white placeholder-gray-400 outline-none ring-1 ring-gray-600 focus:ring-blue-500 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]"
            required
          />
          <button type="submit" className="rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700">
            Save
          </button>
          <button type="button" onClick={() => setEditId(null)} className="rounded px-3 py-1 text-sm text-gray-400 hover:text-white">
            Cancel
          </button>
        </form>
      )}

      {portfolio.length === 0 ? (
        <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-8 text-center text-gray-400">
          <p className="text-lg">No portfolio positions</p>
          <p className="mt-2 text-sm">Add positions to track your P&L</p>
        </div>
      ) : (
        <>
          {/* Summary bar */}
          <div className="mb-3 flex flex-wrap gap-6 rounded-lg border border-gray-700 bg-gray-800/50 px-4 py-3">
            <div>
              <span className="text-xs text-gray-400">Total Value</span>
              <p className="text-sm font-medium text-white">{formatCurrency(totalValue)}</p>
            </div>
            <div>
              <span className="text-xs text-gray-400">Total Cost</span>
              <p className="text-sm font-medium text-white">{formatCurrency(totalCost)}</p>
            </div>
            <div>
              <span className="text-xs text-gray-400">Total P&L</span>
              <p className={cn("text-sm font-medium", totalPnl >= 0 ? "text-green-400" : "text-red-400")}>
                {formatCurrency(totalPnl)} ({formatPercent(totalPnlPercent)})
              </p>
            </div>
          </div>

          {/* Holdings table */}
          <div className="overflow-x-auto rounded-lg border border-gray-700">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700 bg-gray-800 text-gray-400">
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-right">Shares</th>
                  <th className="px-4 py-3 text-right">Buy Price</th>
                  <th className="px-4 py-3 text-right">Current</th>
                  <th className="hidden px-4 py-3 text-right md:table-cell">Market Value</th>
                  <th className="px-4 py-3 text-right">P&L</th>
                  <th className="px-4 py-3 text-right"></th>
                </tr>
              </thead>
              <tbody>
                {holdings.map((h) => (
                  <tr
                    key={h.id}
                    className={cn(
                      "border-b border-gray-700 hover:bg-gray-800/50",
                      h.hasPrice ? (h.pnl >= 0 ? "text-green-400" : "text-red-400") : "text-gray-400"
                    )}
                  >
                    <td className="px-4 py-3">
                      <Link href={`/stock/${h.ticker}`} className="font-medium text-white hover:text-blue-400">
                        {snapshots[h.ticker]?.name || h.ticker}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-300">{h.shares}</td>
                    <td className="px-4 py-3 text-right text-gray-300">{formatCurrency(h.buyPrice)}</td>
                    <td className="px-4 py-3 text-right text-white">
                      {h.hasPrice ? formatCurrency(h.currentPrice) : "—"}
                    </td>
                    <td className="hidden px-4 py-3 text-right text-gray-300 md:table-cell">
                      {h.hasPrice ? formatCurrency(h.marketValue) : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {h.hasPrice ? (
                        <span>
                          {formatCurrency(h.pnl)} ({formatPercent(h.pnlPercent)})
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => startEdit(h.id, h.shares, h.buyPrice)}
                        className="mr-2 text-gray-500 hover:text-blue-400"
                        aria-label={`Edit ${h.ticker}`}
                      >
                        ✎
                      </button>
                      <button
                        onClick={() => removeHolding(h.id)}
                        className="text-gray-500 hover:text-red-400"
                        aria-label={`Remove ${h.ticker} from portfolio`}
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
