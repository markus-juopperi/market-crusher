import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  useParams: () => ({}),
}));

// Mock next/link
vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("ComparisonChart", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows empty state when no tickers", async () => {
    const { ComparisonChart } = await import("@/components/ComparisonChart");
    render(<ComparisonChart tickers={[]} />);

    expect(screen.getByText(/add tickers above to compare/i)).toBeInTheDocument();
  });

  it("shows timeframe buttons when tickers provided", async () => {
    mockFetch.mockResolvedValue({
      json: () => Promise.resolve({ candles: [] }),
    });

    const { ComparisonChart } = await import("@/components/ComparisonChart");
    render(<ComparisonChart tickers={["AAPL"]} />);

    expect(screen.getByText("1M")).toBeInTheDocument();
    expect(screen.getByText("3M")).toBeInTheDocument();
    expect(screen.getByText("6M")).toBeInTheDocument();
    expect(screen.getByText("1Y")).toBeInTheDocument();
    expect(screen.getByText("5Y")).toBeInTheDocument();
  });

  it("shows legend with ticker names", async () => {
    mockFetch.mockResolvedValue({
      json: () => Promise.resolve({ candles: [] }),
    });

    const { ComparisonChart } = await import("@/components/ComparisonChart");
    render(<ComparisonChart tickers={["AAPL", "MSFT"]} />);

    expect(screen.getByText("AAPL")).toBeInTheDocument();
    expect(screen.getByText("MSFT")).toBeInTheDocument();
  });

  it("shows % change description text", async () => {
    mockFetch.mockResolvedValue({
      json: () => Promise.resolve({ candles: [] }),
    });

    const { ComparisonChart } = await import("@/components/ComparisonChart");
    render(<ComparisonChart tickers={["AAPL"]} />);

    expect(screen.getByText(/% change from period start/i)).toBeInTheDocument();
  });

  it("fetches data for each ticker", async () => {
    mockFetch.mockResolvedValue({
      json: () => Promise.resolve({ candles: [] }),
    });

    const { ComparisonChart } = await import("@/components/ComparisonChart");
    render(<ComparisonChart tickers={["AAPL", "MSFT", "GOOGL"]} />);

    // Should fetch bars for each ticker
    await vi.waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("/api/stocks/bars/AAPL"));
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("/api/stocks/bars/MSFT"));
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("/api/stocks/bars/GOOGL"));
  });
});

describe("ComparePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
    mockFetch.mockImplementation((url: string) => {
      if (url.includes("/api/stocks/search")) {
        return Promise.resolve({
          json: () =>
            Promise.resolve({
              result: [
                { symbol: "AAPL", displaySymbol: "AAPL", description: "Apple Inc", type: "Common Stock" },
                { symbol: "MSFT", displaySymbol: "MSFT", description: "Microsoft Corp", type: "Common Stock" },
              ],
            }),
        });
      }
      return Promise.resolve({
        json: () => Promise.resolve({ candles: [] }),
      });
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders page heading", async () => {
    const ComparePage = (await import("@/app/compare/page")).default;
    render(<ComparePage />);

    expect(screen.getByText("Compare Stocks")).toBeInTheDocument();
  });

  it("has back to dashboard link", async () => {
    const ComparePage = (await import("@/app/compare/page")).default;
    render(<ComparePage />);

    const link = screen.getByText(/back to dashboard/i);
    expect(link).toHaveAttribute("href", "/");
  });

  it("has ticker search input", async () => {
    const ComparePage = (await import("@/app/compare/page")).default;
    render(<ComparePage />);

    expect(screen.getByPlaceholderText(/search tickers to compare/i)).toBeInTheDocument();
  });

  it("shows 0/5 tickers counter", async () => {
    const ComparePage = (await import("@/app/compare/page")).default;
    render(<ComparePage />);

    expect(screen.getByText("0/5 tickers")).toBeInTheDocument();
  });

  it("adds a ticker via search selection", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const ComparePage = (await import("@/app/compare/page")).default;
    render(<ComparePage />);

    const input = screen.getByPlaceholderText(/search tickers to compare/i);
    await user.type(input, "AAPL");
    await vi.advanceTimersByTimeAsync(600);

    // Click the search result
    const result = await screen.findByText("Apple Inc");
    await user.click(result);

    // Ticker appears as chip
    expect(screen.getByText("1/5 tickers")).toBeInTheDocument();
  });

  it("removes a ticker when clicking remove button", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const ComparePage = (await import("@/app/compare/page")).default;
    render(<ComparePage />);

    // Add a ticker via search
    const input = screen.getByPlaceholderText(/search tickers to compare/i);
    await user.type(input, "AAPL");
    await vi.advanceTimersByTimeAsync(600);
    const result = await screen.findByText("Apple Inc");
    await user.click(result);

    expect(screen.getByText("1/5 tickers")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /remove aapl/i }));
    expect(screen.getByText("0/5 tickers")).toBeInTheDocument();
  });

  it("shows clear all button when tickers exist", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const ComparePage = (await import("@/app/compare/page")).default;
    render(<ComparePage />);

    const input = screen.getByPlaceholderText(/search tickers to compare/i);
    await user.type(input, "AAPL");
    await vi.advanceTimersByTimeAsync(600);
    const result = await screen.findByText("Apple Inc");
    await user.click(result);

    expect(screen.getByText("Clear all")).toBeInTheDocument();
  });
});
