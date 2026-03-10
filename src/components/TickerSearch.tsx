"use client";

import { useState, useRef, useEffect } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { useDashboardStore } from "@/store/dashboard-store";
import type { FinnhubSearchResult } from "@/types";
import { useRouter } from "next/navigation";

export function TickerSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FinnhubSearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debouncedQuery = useDebounce(query, 500);
  const addTicker = useDashboardStore((s) => s.addTicker);
  const watchlist = useDashboardStore((s) => s.watchlist);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 1) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    setLoading(true);
    fetch(`/api/stocks/search?q=${encodeURIComponent(debouncedQuery)}`)
      .then((res) => res.json())
      .then((data) => {
        setResults(data.result || []);
        setIsOpen(true);
      })
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  }, [debouncedQuery]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleSelect(symbol: string) {
    addTicker(symbol);
    setQuery("");
    setResults([]);
    setIsOpen(false);
  }

  function handleNavigate(symbol: string) {
    setQuery("");
    setIsOpen(false);
    router.push(`/stock/${symbol}`);
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search tickers..."
        className="w-64 rounded-lg bg-gray-800 px-4 py-2 text-sm text-white placeholder-gray-400 outline-none ring-1 ring-gray-600 focus:ring-blue-500"
      />
      {loading && (
        <div className="absolute right-3 top-2.5 text-xs text-gray-400">...</div>
      )}
      {isOpen && results.length > 0 && (
        <div className="absolute top-full z-50 mt-1 w-80 rounded-lg border border-gray-600 bg-gray-800 shadow-xl">
          {results.map((r) => (
            <div
              key={r.symbol}
              className="flex items-center justify-between border-b border-gray-700 px-4 py-2 last:border-0 hover:bg-gray-700"
            >
              <button
                onClick={() => handleNavigate(r.symbol)}
                className="flex-1 text-left"
              >
                <span className="font-medium text-white">{r.displaySymbol}</span>
                <span className="ml-2 text-sm text-gray-400">{r.description}</span>
              </button>
              {!watchlist.includes(r.symbol) && watchlist.length < 10 && (
                <button
                  onClick={() => handleSelect(r.symbol)}
                  className="ml-2 rounded bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-500"
                >
                  + Watch
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
