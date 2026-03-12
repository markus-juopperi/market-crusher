"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface BarData {
  t: number;
  c: number;
}

const TIMEFRAMES = [
  { label: "1M", range: "1mo", interval: "1d" },
  { label: "3M", range: "3mo", interval: "1d" },
  { label: "6M", range: "6mo", interval: "1d" },
  { label: "1Y", range: "1y", interval: "1d" },
  { label: "5Y", range: "5y", interval: "1wk" },
] as const;

const LINE_COLORS = [
  "#3B82F6", // blue
  "#F59E0B", // amber
  "#8B5CF6", // violet
  "#EC4899", // pink
  "#10B981", // emerald
];

interface ComparisonChartProps {
  tickers: string[];
  names?: Record<string, string>;
}

export function ComparisonChart({ tickers, names }: ComparisonChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<ReturnType<typeof import("lightweight-charts").createChart> | null>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState(1); // default 3M
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (tickers.length === 0) return;

    let cancelled = false;
    let resizeObserver: ResizeObserver | null = null;
    const tf = TIMEFRAMES[selectedTimeframe];

    setLoading(true);
    setError(null);

    (async () => {
      try {
        // Fetch bars for all tickers in parallel
        const results = await Promise.all(
          tickers.map(async (ticker) => {
            const res = await fetch(
              `/api/stocks/bars/${ticker}?range=${tf.range}&interval=${tf.interval}`
            );
            const data = await res.json();
            return { ticker, bars: (data.candles || []) as BarData[] };
          })
        );

        if (cancelled || !chartContainerRef.current) return;

        const validResults = results.filter((r) => r.bars.length > 0);
        if (validResults.length === 0) {
          setError("No data available for selected tickers");
          setLoading(false);
          return;
        }

        const { createChart, LineSeries } = await import("lightweight-charts");
        if (cancelled) return;

        if (chartRef.current) {
          chartRef.current.remove();
          chartRef.current = null;
        }

        const chart = createChart(chartContainerRef.current, {
          width: chartContainerRef.current.clientWidth,
          height: 400,
          layout: {
            background: { color: "#111827" },
            textColor: "#9CA3AF",
          },
          grid: {
            vertLines: { color: "#1F2937" },
            horzLines: { color: "#1F2937" },
          },
          crosshair: { mode: 0 },
          timeScale: { borderColor: "#374151" },
          rightPriceScale: {
            borderColor: "#374151",
          },
        });

        if (cancelled) {
          chart.remove();
          return;
        }

        chartRef.current = chart;

        // Normalize each ticker's bars to % change from first bar
        validResults.forEach((result, index) => {
          const firstClose = result.bars[0].c;
          if (firstClose === 0) return;

          const lineData = result.bars.map((b) => ({
            time: (b.t / 1000) as import("lightweight-charts").UTCTimestamp,
            value: ((b.c - firstClose) / firstClose) * 100,
          }));

          const series = chart.addSeries(LineSeries, {
            color: LINE_COLORS[index % LINE_COLORS.length],
            lineWidth: 2,
            title: names?.[result.ticker] || result.ticker,
          });
          series.setData(lineData);
        });

        chart.timeScale().fitContent();

        resizeObserver = new ResizeObserver((entries) => {
          if (!cancelled) {
            for (const entry of entries) {
              chart.applyOptions({ width: entry.contentRect.width });
            }
          }
        });
        resizeObserver.observe(chartContainerRef.current);

        setLoading(false);
      } catch {
        if (!cancelled) {
          setError("Failed to load chart data");
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      resizeObserver?.disconnect();
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [tickers, selectedTimeframe]);

  if (tickers.length === 0) {
    return (
      <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-8 text-center text-gray-400">
        <p>Add tickers above to compare performance</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-700 bg-gray-900 p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          {TIMEFRAMES.map((tf, i) => (
            <button
              key={tf.label}
              onClick={() => setSelectedTimeframe(i)}
              className={cn(
                "rounded px-3 py-1 text-sm",
                selectedTimeframe === i
                  ? "bg-blue-600 text-white"
                  : "text-gray-400 hover:bg-gray-800 hover:text-white"
              )}
            >
              {tf.label}
            </button>
          ))}
        </div>
        {/* Legend */}
        <div className="flex flex-wrap gap-3">
          {tickers.map((t, i) => (
            <span key={t} className="flex items-center gap-1 text-xs">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: LINE_COLORS[i % LINE_COLORS.length] }}
              />
              <span className="text-gray-300">{names?.[t] || t}</span>
            </span>
          ))}
        </div>
      </div>
      <div ref={chartContainerRef} className="relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80">
            <span className="text-gray-400">Loading chart...</span>
          </div>
        )}
        {error && (
          <div className="flex h-48 items-center justify-center">
            <span className="text-red-400">{error}</span>
          </div>
        )}
      </div>
      <p className="mt-2 text-xs text-gray-500">
        Values shown as % change from period start
      </p>
    </div>
  );
}
