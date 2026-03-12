import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  useParams: () => ({}),
}));

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("TickerSearchInput", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders with custom placeholder", async () => {
    const { TickerSearchInput } = await import(
      "@/components/TickerSearchInput"
    );
    render(<TickerSearchInput onSelect={vi.fn()} placeholder="Find stocks" />);

    expect(screen.getByPlaceholderText("Find stocks")).toBeInTheDocument();
  });

  it("renders with default placeholder", async () => {
    const { TickerSearchInput } = await import(
      "@/components/TickerSearchInput"
    );
    render(<TickerSearchInput onSelect={vi.fn()} />);

    expect(
      screen.getByPlaceholderText("Search tickers...")
    ).toBeInTheDocument();
  });

  it("accepts user input", async () => {
    vi.useRealTimers();
    const user = userEvent.setup();
    const { TickerSearchInput } = await import(
      "@/components/TickerSearchInput"
    );
    render(<TickerSearchInput onSelect={vi.fn()} />);

    const input = screen.getByPlaceholderText("Search tickers...");
    await user.type(input, "AAPL");

    expect(input).toHaveValue("AAPL");
  });

  it("fetches search results after debounce", async () => {
    mockFetch.mockResolvedValue({
      json: () =>
        Promise.resolve({
          result: [
            { symbol: "AAPL", displaySymbol: "AAPL", description: "Apple Inc", type: "Common Stock" },
          ],
        }),
    });

    const { TickerSearchInput } = await import(
      "@/components/TickerSearchInput"
    );
    render(<TickerSearchInput onSelect={vi.fn()} />);

    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const input = screen.getByPlaceholderText("Search tickers...");
    await user.type(input, "AAPL");

    // Advance past debounce
    await vi.advanceTimersByTimeAsync(600);

    await vi.waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/stocks/search?q=AAPL")
      );
    });
  });

  it("shows results dropdown and calls onSelect when clicked", async () => {
    mockFetch.mockResolvedValue({
      json: () =>
        Promise.resolve({
          result: [
            { symbol: "AAPL", displaySymbol: "AAPL", description: "Apple Inc", type: "Common Stock" },
            { symbol: "AAPL.MX", displaySymbol: "AAPL.MX", description: "Apple Inc (Mexico)", type: "Common Stock" },
          ],
        }),
    });

    const onSelect = vi.fn();
    const { TickerSearchInput } = await import(
      "@/components/TickerSearchInput"
    );
    render(<TickerSearchInput onSelect={onSelect} />);

    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const input = screen.getByPlaceholderText("Search tickers...");
    await user.type(input, "AAPL");

    await vi.advanceTimersByTimeAsync(600);

    // Results should appear
    expect(await screen.findByText("Apple Inc")).toBeInTheDocument();

    // Click on the first result
    await user.click(screen.getByText("Apple Inc"));

    expect(onSelect).toHaveBeenCalledWith("AAPL");
    // Input should be cleared
    expect(input).toHaveValue("");
  });

  it("does not fetch when query is empty", async () => {
    const { TickerSearchInput } = await import(
      "@/components/TickerSearchInput"
    );
    render(<TickerSearchInput onSelect={vi.fn()} />);

    await vi.advanceTimersByTimeAsync(600);

    expect(mockFetch).not.toHaveBeenCalled();
  });
});
