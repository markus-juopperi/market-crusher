import { describe, it, expect } from "vitest";
import {
  formatCurrency,
  formatPercent,
  formatLargeNumber,
  timeAgo,
  cn,
} from "@/lib/utils";

describe("formatCurrency", () => {
  it("formats USD by default", () => {
    expect(formatCurrency(123.45)).toBe("$123.45");
  });

  it("formats zero", () => {
    expect(formatCurrency(0)).toBe("$0.00");
  });

  it("formats negative values", () => {
    expect(formatCurrency(-5.5)).toBe("-$5.50");
  });

  it("formats EUR when currency is specified", () => {
    const result = formatCurrency(99.99, "EUR");
    expect(result).toContain("99.99");
    expect(result).toContain("€");
  });

  it("rounds to 2 decimal places", () => {
    expect(formatCurrency(10.999)).toBe("$11.00");
  });

  it("formats large numbers with commas", () => {
    expect(formatCurrency(1234567.89)).toBe("$1,234,567.89");
  });
});

describe("formatPercent", () => {
  it("formats positive with + sign", () => {
    expect(formatPercent(5.25)).toBe("+5.25%");
  });

  it("formats negative with - sign", () => {
    expect(formatPercent(-3.1)).toBe("-3.10%");
  });

  it("formats zero as +0.00%", () => {
    expect(formatPercent(0)).toBe("+0.00%");
  });

  it("rounds to 2 decimal places", () => {
    expect(formatPercent(1.999)).toBe("+2.00%");
  });
});

describe("formatLargeNumber", () => {
  it("formats trillions", () => {
    expect(formatLargeNumber(2.5e12)).toBe("2.50T");
  });

  it("formats billions", () => {
    expect(formatLargeNumber(3.7e9)).toBe("3.70B");
  });

  it("formats millions", () => {
    expect(formatLargeNumber(1.2e6)).toBe("1.20M");
  });

  it("formats thousands", () => {
    expect(formatLargeNumber(5000)).toBe("5.00K");
  });

  it("formats small numbers as-is", () => {
    expect(formatLargeNumber(999)).toBe("999.00");
  });
});

describe("timeAgo", () => {
  it("shows seconds ago", () => {
    expect(timeAgo(Date.now() - 30_000)).toBe("30s ago");
  });

  it("shows minutes ago", () => {
    expect(timeAgo(Date.now() - 5 * 60_000)).toBe("5m ago");
  });

  it("shows hours ago", () => {
    expect(timeAgo(Date.now() - 3 * 3_600_000)).toBe("3h ago");
  });

  it("shows days ago", () => {
    expect(timeAgo(Date.now() - 2 * 86_400_000)).toBe("2d ago");
  });
});

describe("cn", () => {
  it("joins class names", () => {
    expect(cn("a", "b", "c")).toBe("a b c");
  });

  it("filters falsy values", () => {
    expect(cn("a", false, null, undefined, "b")).toBe("a b");
  });

  it("returns empty string for no truthy values", () => {
    expect(cn(false, null, undefined)).toBe("");
  });
});
