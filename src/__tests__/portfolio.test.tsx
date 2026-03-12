import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
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

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("PortfolioPanel", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const { useDashboardStore } = await import("@/store/dashboard-store");
    useDashboardStore.setState({
      portfolio: [],
      snapshots: {},
      watchlist: [],
      marketStatus: null,
    });
    mockFetch.mockImplementation((url: string) => {
      if (url.includes("/api/stocks/search")) {
        return Promise.resolve({
          json: () =>
            Promise.resolve({
              result: [
                { symbol: "AAPL", displaySymbol: "AAPL", description: "Apple Inc", type: "Common Stock" },
              ],
            }),
        });
      }
      return Promise.resolve({ json: () => Promise.resolve({}) });
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows empty state when no positions", async () => {
    const { PortfolioPanel } = await import("@/components/PortfolioPanel");
    render(<PortfolioPanel />);

    expect(screen.getByText("No portfolio positions")).toBeInTheDocument();
    expect(screen.getByText(/add positions to track/i)).toBeInTheDocument();
  });

  it("renders portfolio heading", async () => {
    const { PortfolioPanel } = await import("@/components/PortfolioPanel");
    render(<PortfolioPanel />);

    expect(screen.getByText("Portfolio")).toBeInTheDocument();
  });

  it("shows add position button", async () => {
    const { PortfolioPanel } = await import("@/components/PortfolioPanel");
    render(<PortfolioPanel />);

    expect(screen.getByText("+ Add Position")).toBeInTheDocument();
  });

  it("toggles add form on button click", async () => {
    vi.useRealTimers();
    const user = userEvent.setup();
    const { PortfolioPanel } = await import("@/components/PortfolioPanel");
    render(<PortfolioPanel />);

    await user.click(screen.getByText("+ Add Position"));
    expect(screen.getByPlaceholderText(/search ticker/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/shares/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/buy price/i)).toBeInTheDocument();

    // Button text changes to Cancel
    expect(screen.getByText("Cancel")).toBeInTheDocument();
  });

  it("adds a position via the form using search", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const { PortfolioPanel } = await import("@/components/PortfolioPanel");
    render(<PortfolioPanel />);

    await user.click(screen.getByText("+ Add Position"));

    // Search for ticker
    const searchInput = screen.getByPlaceholderText(/search ticker/i);
    await user.type(searchInput, "AAPL");
    await vi.advanceTimersByTimeAsync(600);

    // Select from search results
    const result = await screen.findByText("Apple Inc");
    await user.click(result);

    // Fill in shares and price
    await user.type(screen.getByPlaceholderText(/shares/i), "10");
    await user.type(screen.getByPlaceholderText(/buy price/i), "150");
    await user.click(screen.getByText("Add"));

    // Should now show the holding in the table
    expect(screen.getByText("AAPL")).toBeInTheDocument();
  });

  it("shows selected ticker badge after search selection", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const { PortfolioPanel } = await import("@/components/PortfolioPanel");
    render(<PortfolioPanel />);

    await user.click(screen.getByText("+ Add Position"));

    const searchInput = screen.getByPlaceholderText(/search ticker/i);
    await user.type(searchInput, "AAPL");
    await vi.advanceTimersByTimeAsync(600);

    const result = await screen.findByText("Apple Inc");
    await user.click(result);

    // Should show selected ticker badge
    expect(screen.getByText("AAPL")).toBeInTheDocument();
  });

  it("shows P&L when snapshots are available", async () => {
    const { useDashboardStore } = await import("@/store/dashboard-store");
    useDashboardStore.setState({
      portfolio: [
        { id: "AAPL-1", ticker: "AAPL", shares: 10, buyPrice: 100, addedAt: Date.now() },
      ],
      snapshots: {
        AAPL: {
          ticker: "AAPL",
          price: 150,
          change: 2,
          changePercent: 1.5,
          high: 152,
          low: 148,
          open: 149,
          prevClose: 148,
          updated: Date.now(),
        },
      },
    });

    const { PortfolioPanel } = await import("@/components/PortfolioPanel");
    render(<PortfolioPanel />);

    expect(screen.getByText("Total Value")).toBeInTheDocument();
    expect(screen.getByText("Total Cost")).toBeInTheDocument();
    expect(screen.getByText("Total P&L")).toBeInTheDocument();
  });

  it("shows summary with correct total values", async () => {
    const { useDashboardStore } = await import("@/store/dashboard-store");
    useDashboardStore.setState({
      portfolio: [
        { id: "AAPL-1", ticker: "AAPL", shares: 10, buyPrice: 100, addedAt: Date.now() },
      ],
      snapshots: {
        AAPL: {
          ticker: "AAPL",
          price: 150,
          change: 2,
          changePercent: 1.5,
          high: 152,
          low: 148,
          open: 149,
          prevClose: 148,
          updated: Date.now(),
        },
      },
    });

    const { PortfolioPanel } = await import("@/components/PortfolioPanel");
    const { container } = render(<PortfolioPanel />);

    expect(container.textContent).toContain("$1,500.00");
    expect(container.textContent).toContain("$1,000.00");
  });

  it("has edit and remove buttons per holding", async () => {
    const { useDashboardStore } = await import("@/store/dashboard-store");
    useDashboardStore.setState({
      portfolio: [
        { id: "AAPL-1", ticker: "AAPL", shares: 10, buyPrice: 100, addedAt: Date.now() },
      ],
      snapshots: {
        AAPL: {
          ticker: "AAPL",
          price: 150,
          change: 2,
          changePercent: 1.5,
          high: 152,
          low: 148,
          open: 149,
          prevClose: 148,
          updated: Date.now(),
        },
      },
    });

    const { PortfolioPanel } = await import("@/components/PortfolioPanel");
    render(<PortfolioPanel />);

    expect(screen.getByRole("button", { name: /edit aapl/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /remove aapl from portfolio/i })).toBeInTheDocument();
  });

  it("removes a holding when remove button clicked", async () => {
    vi.useRealTimers();
    const user = userEvent.setup();
    const { useDashboardStore } = await import("@/store/dashboard-store");
    useDashboardStore.setState({
      portfolio: [
        { id: "AAPL-1", ticker: "AAPL", shares: 10, buyPrice: 100, addedAt: Date.now() },
      ],
      snapshots: {
        AAPL: {
          ticker: "AAPL",
          price: 150,
          change: 2,
          changePercent: 1.5,
          high: 152,
          low: 148,
          open: 149,
          prevClose: 148,
          updated: Date.now(),
        },
      },
    });

    const { PortfolioPanel } = await import("@/components/PortfolioPanel");
    render(<PortfolioPanel />);

    await user.click(screen.getByRole("button", { name: /remove aapl from portfolio/i }));

    expect(screen.getByText("No portfolio positions")).toBeInTheDocument();
  });

  it("shows dash for price when no snapshot available", async () => {
    const { useDashboardStore } = await import("@/store/dashboard-store");
    useDashboardStore.setState({
      portfolio: [
        { id: "AAPL-1", ticker: "AAPL", shares: 10, buyPrice: 100, addedAt: Date.now() },
      ],
      snapshots: {},
    });

    const { PortfolioPanel } = await import("@/components/PortfolioPanel");
    const { container } = render(<PortfolioPanel />);

    expect(container.textContent).toContain("—");
  });

  it("links ticker to stock detail page", async () => {
    const { useDashboardStore } = await import("@/store/dashboard-store");
    useDashboardStore.setState({
      portfolio: [
        { id: "AAPL-1", ticker: "AAPL", shares: 10, buyPrice: 100, addedAt: Date.now() },
      ],
      snapshots: {
        AAPL: {
          ticker: "AAPL",
          price: 150,
          change: 2,
          changePercent: 1.5,
          high: 152,
          low: 148,
          open: 149,
          prevClose: 148,
          updated: Date.now(),
        },
      },
    });

    const { PortfolioPanel } = await import("@/components/PortfolioPanel");
    render(<PortfolioPanel />);

    const link = screen.getByText("AAPL").closest("a");
    expect(link).toHaveAttribute("href", "/stock/AAPL");
  });
});
