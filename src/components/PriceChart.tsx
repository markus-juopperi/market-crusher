"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface BarData {
  t: number;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
}

const TIMEFRAMES = [
  { label: "1D", range: "1d", interval: "5m" },
  { label: "1W", range: "5d", interval: "15m" },
  { label: "1M", range: "1mo", interval: "1h" },
  { label: "3M", range: "3mo", interval: "1d" },
  { label: "6M", range: "6mo", interval: "1d" },
  { label: "1Y", range: "1y", interval: "1d" },
  { label: "5Y", range: "5y", interval: "1wk" },
] as const;

interface PriceChartProps {
  ticker: string;
}

export function PriceChart({ ticker }: PriceChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<ReturnType<typeof import("lightweight-charts").createChart> | null>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState(3);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let resizeObserver: ResizeObserver | null = null;
    const tf = TIMEFRAMES[selectedTimeframe];

    setLoading(true);

    (async () => {
      try {
        const res = await fetch(`/api/stocks/bars/${ticker}?range=${tf.range}&interval=${tf.interval}`);
        const data = await res.json();
        const bars: BarData[] = data.candles || [];

        if (cancelled || !chartContainerRef.current || bars.length === 0) {
          if (!cancelled) setLoading(false);
          return;
        }

        const { createChart, CandlestickSeries, HistogramSeries } = await import("lightweight-charts");

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
          timeScale: {
            borderColor: "#374151",
            timeVisible: selectedTimeframe <= 2,
          },
          rightPriceScale: { borderColor: "#374151" },
        });

        if (cancelled) {
          chart.remove();
          return;
        }

        chartRef.current = chart;

        const candlestickData = bars.map((b) => ({
          time: (b.t / 1000) as import("lightweight-charts").UTCTimestamp,
          open: b.o,
          high: b.h,
          low: b.l,
          close: b.c,
        }));

        const volumeData = bars.map((b) => ({
          time: (b.t / 1000) as import("lightweight-charts").UTCTimestamp,
          value: b.v,
          color: b.c >= b.o ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)",
        }));

        const candleSeries = chart.addSeries(CandlestickSeries, {
          upColor: "#22C55E",
          downColor: "#EF4444",
          borderDownColor: "#EF4444",
          borderUpColor: "#22C55E",
          wickDownColor: "#EF4444",
          wickUpColor: "#22C55E",
        });
        candleSeries.setData(candlestickData);

        const volumeSeries = chart.addSeries(HistogramSeries, {
          priceFormat: { type: "volume" },
          priceScaleId: "volume",
        });
        volumeSeries.setData(volumeData);

        chart.priceScale("volume").applyOptions({
          scaleMargins: { top: 0.8, bottom: 0 },
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
        if (!cancelled) setLoading(false);
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
  }, [ticker, selectedTimeframe]);

  return (
    <div className="rounded-lg border border-gray-700 bg-gray-900 p-4">
      <div className="mb-4 flex items-center gap-1">
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
      <div ref={chartContainerRef} className="relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80">
            <span className="text-gray-400">Loading chart...</span>
          </div>
        )}
      </div>
    </div>
  );
}
