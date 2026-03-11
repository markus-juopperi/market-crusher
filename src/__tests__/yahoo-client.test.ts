import { describe, it, expect, vi, beforeEach } from "vitest";
import { cachedCall } from "@/lib/yahoo-client";

describe("cachedCall", () => {
  beforeEach(() => {
    // Clear module cache between tests to reset the Map
    vi.useFakeTimers();
  });

  it("calls the function and returns data", async () => {
    const fn = vi.fn().mockResolvedValue({ price: 100 });
    const result = await cachedCall("test-key-1", fn, 0);
    expect(result).toEqual({ price: 100 });
    expect(fn).toHaveBeenCalledOnce();
  });

  it("caches results within TTL", async () => {
    const fn = vi.fn().mockResolvedValue({ price: 100 });
    // Use unique keys to avoid cross-test interference
    const key = `cache-test-${Date.now()}`;

    const result1 = await cachedCall(key, fn, 60);
    const result2 = await cachedCall(key, fn, 60);

    expect(result1).toEqual({ price: 100 });
    expect(result2).toEqual({ price: 100 });
    expect(fn).toHaveBeenCalledOnce();
  });

  it("refreshes after TTL expires", async () => {
    const fn = vi
      .fn()
      .mockResolvedValueOnce({ price: 100 })
      .mockResolvedValueOnce({ price: 200 });

    const key = `expire-test-${Date.now()}`;

    const result1 = await cachedCall(key, fn, 1);
    expect(result1).toEqual({ price: 100 });

    // Advance time past TTL
    vi.advanceTimersByTime(2000);

    const result2 = await cachedCall(key, fn, 1);
    expect(result2).toEqual({ price: 200 });
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("does not cache when TTL is 0", async () => {
    const fn = vi.fn().mockResolvedValue({ price: 100 });
    const key = `no-cache-${Date.now()}`;

    await cachedCall(key, fn, 0);
    await cachedCall(key, fn, 0);

    expect(fn).toHaveBeenCalledTimes(2);
  });
});
