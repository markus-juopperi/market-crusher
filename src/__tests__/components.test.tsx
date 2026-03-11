import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  useParams: () => ({ ticker: "AAPL" }),
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

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("WatchlistRow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders ticker symbol and price", async () => {
    const { WatchlistRow } = await import("@/components/WatchlistRow");

    const snapshot = {
      ticker: "AAPL",
      price: 150.25,
      change: 2.5,
      changePercent: 1.69,
      high: 152,
      low: 148,
      open: 149,
      prevClose: 147.75,
      updated: Date.now(),
      currency: "USD",
    };

    const { container } = render(
      <table>
        <tbody>
          <WatchlistRow snapshot={snapshot} />
        </tbody>
      </table>
    );

    expect(screen.getByText("AAPL")).toBeInTheDocument();
    expect(container.textContent).toContain("150.25");
  });

  it("shows green color for positive change", async () => {
    const { WatchlistRow } = await import("@/components/WatchlistRow");

    const snapshot = {
      ticker: "AAPL",
      price: 150,
      change: 2,
      changePercent: 1.5,
      high: 152,
      low: 148,
      open: 149,
      prevClose: 148,
      updated: Date.now(),
      currency: "USD",
    };

    const { container } = render(
      <table>
        <tbody>
          <WatchlistRow snapshot={snapshot} />
        </tbody>
      </table>
    );

    const row = container.querySelector("tr");
    expect(row?.className).toContain("text-green-400");
  });

  it("shows red color for negative change", async () => {
    const { WatchlistRow } = await import("@/components/WatchlistRow");

    const snapshot = {
      ticker: "AAPL",
      price: 148,
      change: -2,
      changePercent: -1.3,
      high: 150,
      low: 147,
      open: 150,
      prevClose: 150,
      updated: Date.now(),
      currency: "USD",
    };

    const { container } = render(
      <table>
        <tbody>
          <WatchlistRow snapshot={snapshot} />
        </tbody>
      </table>
    );

    const row = container.querySelector("tr");
    expect(row?.className).toContain("text-red-400");
  });

  it("renders EUR currency for Finnish stocks", async () => {
    const { WatchlistRow } = await import("@/components/WatchlistRow");

    const snapshot = {
      ticker: "NOKIA.HE",
      price: 4.25,
      change: 0.05,
      changePercent: 1.19,
      high: 4.3,
      low: 4.2,
      open: 4.22,
      prevClose: 4.2,
      updated: Date.now(),
      currency: "EUR",
    };

    const { container } = render(
      <table>
        <tbody>
          <WatchlistRow snapshot={snapshot} />
        </tbody>
      </table>
    );

    expect(screen.getByText("NOKIA.HE")).toBeInTheDocument();
    expect(container.textContent).toContain("€");
  });

  it("has a remove button", async () => {
    const { WatchlistRow } = await import("@/components/WatchlistRow");

    const snapshot = {
      ticker: "AAPL",
      price: 150,
      change: 0,
      changePercent: 0,
      high: 150,
      low: 150,
      open: 150,
      prevClose: 150,
      updated: Date.now(),
    };

    render(
      <table>
        <tbody>
          <WatchlistRow snapshot={snapshot} />
        </tbody>
      </table>
    );

    const removeBtn = screen.getByRole("button", { name: /remove aapl/i });
    expect(removeBtn).toBeInTheDocument();
  });
});

describe("NewsCard", () => {
  it("renders article headline and source", async () => {
    const { NewsCard } = await import("@/components/NewsCard");

    const article = {
      datetime: Math.floor(Date.now() / 1000),
      headline: "Apple beats earnings",
      id: "123",
      image: "",
      source: "Reuters",
      summary: "Apple reported strong Q4 results.",
      url: "https://example.com/article",
    };

    render(<NewsCard article={article} />);

    expect(screen.getByText("Apple beats earnings")).toBeInTheDocument();
    expect(screen.getByText("Reuters")).toBeInTheDocument();
    expect(
      screen.getByText("Apple reported strong Q4 results.")
    ).toBeInTheDocument();
  });

  it("renders as a link to the article", async () => {
    const { NewsCard } = await import("@/components/NewsCard");

    const article = {
      datetime: Math.floor(Date.now() / 1000),
      headline: "Test Article",
      id: "456",
      image: "",
      source: "Test",
      summary: "",
      url: "https://example.com/test",
    };

    render(<NewsCard article={article} />);

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "https://example.com/test");
    expect(link).toHaveAttribute("target", "_blank");
  });

  it("shows image when provided", async () => {
    const { NewsCard } = await import("@/components/NewsCard");

    const article = {
      datetime: Math.floor(Date.now() / 1000),
      headline: "Test",
      id: "789",
      image: "https://example.com/photo.jpg",
      source: "Test",
      summary: "",
      url: "https://example.com",
    };

    render(<NewsCard article={article} />);

    const img = document.querySelector("img");
    expect(img).toHaveAttribute("src", "https://example.com/photo.jpg");
  });
});

describe("MarketStatusBar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders open state with green styling", async () => {
    mockFetch.mockResolvedValue({
      json: () =>
        Promise.resolve({
          exchange: "US",
          isOpen: true,
          session: "regular",
        }),
    });

    // Pre-set the store so component renders immediately
    const { useDashboardStore } = await import("@/store/dashboard-store");
    useDashboardStore.setState({
      marketStatus: { exchange: "US", isOpen: true, session: "regular" },
    });

    const { MarketStatusBar } = await import(
      "@/components/MarketStatusBar"
    );
    render(<MarketStatusBar />);

    expect(screen.getByText(/open/i)).toBeInTheDocument();
  });

  it("renders closed state", async () => {
    const { useDashboardStore } = await import("@/store/dashboard-store");
    useDashboardStore.setState({
      marketStatus: { exchange: "US", isOpen: false, session: "closed" },
    });

    const { MarketStatusBar } = await import(
      "@/components/MarketStatusBar"
    );
    render(<MarketStatusBar />);

    expect(screen.getByText(/closed/i)).toBeInTheDocument();
  });

  it("renders pre-market state", async () => {
    const { useDashboardStore } = await import("@/store/dashboard-store");
    useDashboardStore.setState({
      marketStatus: {
        exchange: "US",
        isOpen: false,
        session: "pre-market",
      },
    });

    const { MarketStatusBar } = await import(
      "@/components/MarketStatusBar"
    );
    render(<MarketStatusBar />);

    expect(screen.getByText(/pre-market/i)).toBeInTheDocument();
  });

  it("shows Yahoo Finance attribution", async () => {
    const { useDashboardStore } = await import("@/store/dashboard-store");
    useDashboardStore.setState({
      marketStatus: { exchange: "US", isOpen: true, session: "regular" },
    });

    const { MarketStatusBar } = await import(
      "@/components/MarketStatusBar"
    );
    render(<MarketStatusBar />);

    expect(screen.getByText(/yahoo finance/i)).toBeInTheDocument();
  });
});

describe("WatchlistTable", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows empty state when watchlist is empty", async () => {
    const { useDashboardStore } = await import("@/store/dashboard-store");
    useDashboardStore.setState({ watchlist: [], snapshots: {} });

    const { WatchlistTable } = await import("@/components/WatchlistTable");
    render(<WatchlistTable />);

    expect(screen.getByText(/no tickers in your watchlist/i)).toBeInTheDocument();
  });

  it("shows loading state for tickers without snapshots", async () => {
    mockFetch.mockResolvedValue({
      json: () => Promise.resolve({ tickers: [] }),
    });

    const { useDashboardStore } = await import("@/store/dashboard-store");
    useDashboardStore.setState({ watchlist: ["AAPL"], snapshots: {} });

    const { WatchlistTable } = await import("@/components/WatchlistTable");
    render(<WatchlistTable />);

    expect(screen.getByText("AAPL")).toBeInTheDocument();
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });
});

describe("Header", () => {
  it("renders app title", async () => {
    const { Header } = await import("@/components/Header");
    render(<Header />);

    expect(screen.getByText("Market Crusher")).toBeInTheDocument();
  });

  it("contains search input", async () => {
    const { Header } = await import("@/components/Header");
    render(<Header />);

    expect(
      screen.getByPlaceholderText(/search tickers/i)
    ).toBeInTheDocument();
  });
});

describe("TickerSearch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders search input", async () => {
    const { TickerSearch } = await import("@/components/TickerSearch");
    render(<TickerSearch />);

    expect(
      screen.getByPlaceholderText(/search tickers/i)
    ).toBeInTheDocument();
  });

  it("accepts user input", async () => {
    const user = userEvent.setup();

    const { TickerSearch } = await import("@/components/TickerSearch");
    render(<TickerSearch />);

    const input = screen.getByPlaceholderText(/search tickers/i);
    await user.type(input, "apple");

    expect(input).toHaveValue("apple");
  });
});

describe("KeyStatsGrid", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows loading state initially", async () => {
    mockFetch.mockResolvedValue({
      json: () => Promise.resolve({ ticker: null }),
    });

    const { KeyStatsGrid } = await import("@/components/KeyStatsGrid");
    render(<KeyStatsGrid ticker="AAPL" />);

    expect(screen.getByText("Key Stats")).toBeInTheDocument();
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });
});
