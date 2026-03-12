"use client";

import { useState, useRef, useEffect } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import type { SearchResult } from "@/types";

interface TickerSearchInputProps {
  onSelect: (symbol: string, description?: string) => void;
  placeholder?: string;
  className?: string;
}

export function TickerSearchInput({
  onSelect,
  placeholder = "Search tickers...",
  className = "",
}: TickerSearchInputProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debouncedQuery = useDebounce(query, 500);
  const containerRef = useRef<HTMLDivElement>(null);

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
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleSelect(symbol: string, description?: string) {
    onSelect(symbol, description);
    setQuery("");
    setResults([]);
    setIsOpen(false);
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded bg-gray-700 px-3 py-2 text-sm text-white placeholder-gray-400 outline-none ring-1 ring-gray-600 focus:ring-blue-500"
      />
      {loading && (
        <div className="absolute right-3 top-2.5 text-xs text-gray-400">
          ...
        </div>
      )}
      {isOpen && results.length > 0 && (
        <div className="absolute top-full z-50 mt-1 w-full min-w-[280px] rounded-lg border border-gray-600 bg-gray-800 shadow-xl">
          {results.map((r) => (
            <button
              key={r.symbol}
              onClick={() => handleSelect(r.symbol, r.description)}
              className="flex w-full items-center gap-2 border-b border-gray-700 px-4 py-2 text-left last:border-0 hover:bg-gray-700"
            >
              <span className="font-medium text-white">{r.displaySymbol}</span>
              <span className="truncate text-sm text-gray-400">
                {r.description}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
