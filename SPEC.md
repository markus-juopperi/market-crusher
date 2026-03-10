# Market Crusher — Real-Time Stock Dashboard

## Product Specification v1.0

---

## 1. Overview

Market Crusher is a stock dashboard that lets users search, select, and monitor stocks with delayed price data, historical charts, key fundamentals, and market movers. It is powered by the [Massive REST & WebSocket APIs](https://massive.com/docs/rest/quickstart) and designed to operate within the **free tier** constraints.

### Free Tier Constraints (from [Massive Pricing](https://massive.com/pricing))

| Constraint | Limit |
|-----------|-------|
| REST API rate limit | **5 requests per minute** |
| Data freshness | **Delayed** (not real-time) |
| WebSocket streaming | **Not available** (requires Advanced plan @ $199/mo) |
| Options data | **Not available** (requires Advanced plan) |
| Recommended max throughput | Stay under 100 req/s (paid tiers) — N/A for free |

These constraints fundamentally shape the architecture. The app **cannot** use WebSocket streaming or real-time data on the free tier. All "live" updates are achieved via REST polling within the 5 req/min budget.

---

## 2. Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Language | TypeScript (strict mode) | Type safety, user preference |
| Runtime | Node.js 20+ | LTS, native fetch, WebSocket support |
| Framework | Next.js 14 (App Router) | SSR, API routes, file-based routing |
| UI | React 18 + Tailwind CSS | Component model + utility-first styling |
| Charts | Lightweight Charts (TradingView) | Purpose-built financial charting, small bundle |
| State | Zustand | Minimal boilerplate, good TypeScript support |
| Data Fetching | TanStack Query (React Query) | Caching, refetching, stale-while-revalidate |
| Testing | Vitest + React Testing Library | Fast, ESM-native |
| Package Manager | pnpm | Fast, disk-efficient |

---

## 3. Massive API Endpoints Used

All requests use base URL `https://api.massive.com`. Authentication is via API key passed as a query parameter `apiKey` or `Authorization: Bearer <key>` header.

### 3.1 REST Endpoints

| Feature | Endpoint | Method |
|---------|----------|--------|
| **Ticker Search** | `GET /v3/reference/tickers?search={query}&active=true&limit=10` | Search tickers by name/symbol |
| **Ticker Details** | `GET /v3/reference/tickers/{ticker}` | Company name, description, market cap, branding, sector |
| **Single Snapshot** | `GET /v2/snapshot/locale/us/markets/stocks/tickers/{ticker}` | Current price, day bar, prev day, change % |
| **Multi Snapshot** | `GET /v2/snapshot/locale/us/markets/stocks/tickers?tickers={csv}` | Batch snapshot for watchlist |
| **Historical Bars** | `GET /v2/aggs/ticker/{ticker}/range/{multiplier}/{timespan}/{from}/{to}` | OHLCV candles (1m, 5m, 15m, 1h, 1d, 1w, 1M) |
| **Previous Day** | `GET /v2/aggs/ticker/{ticker}/prev` | Previous trading day OHLCV |
| **Top Movers** | `GET /v2/snapshot/locale/us/markets/stocks/{direction}` | Top 20 gainers or losers |
| **Market Status** | `GET /v1/marketstatus/now` | Open/closed/early-hours status |
| **Market Holidays** | `GET /v1/marketstatus/upcoming` | Upcoming market holidays |
| **SMA** | `GET /v1/indicators/sma/{ticker}` | Simple Moving Average |
| **EMA** | `GET /v1/indicators/ema/{ticker}` | Exponential Moving Average |
| **RSI** | `GET /v1/indicators/rsi/{ticker}` | Relative Strength Index |
| **MACD** | `GET /v1/indicators/macd/{ticker}` | MACD indicator |
| **News** | `GET /v2/reference/news?ticker={ticker}&limit=10` | Ticker-related news articles |

### 3.2 WebSocket — NOT AVAILABLE on Free Tier

WebSocket streaming requires the Advanced plan ($199/mo). This app uses REST polling only.

---

## 4. Architecture

```
┌─────────────────────────────────────────────────┐
│                   Next.js App                    │
│                                                  │
│  ┌──────────┐  ┌──────────┐                     │
│  │ Pages /  │  │ API      │                     │
│  │ Routes   │  │ Routes   │                     │
│  │          │  │ /api/*   │                     │
│  └────┬─────┘  └────┬─────┘                     │
│       │              │                          │
│  ┌────┴──────────────┴────────────────────────┐  │
│  │              Zustand Store                  │  │
│  │  - watchlist[]    - selectedTicker          │  │
│  │  - snapshots{}    - chartTimeframe          │  │
│  │  - marketStatus   - theme                   │  │
│  └────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
                       │
            ┌──────────┴──────────┐
            │  Massive APIs       │
            │  REST + WebSocket   │
            └─────────────────────┘
```

### 4.1 API Route Proxy

All Massive API calls go through Next.js API routes (`/api/stocks/*`) to:
- Keep the API key server-side (never exposed to browser)
- **Enforce server-side rate limiting** (max 5 req/min to Massive)
- Cache responses aggressively to minimize API calls
- Normalize error responses

### 4.2 Rate Limit Budget (5 req/min)

The free tier allows only **5 API calls per minute** to Massive. The app must budget these carefully:

| Purpose | Calls/min | Strategy |
|---------|-----------|----------|
| Watchlist snapshot polling | 1 | Single batch call every 60s (all tickers in one request) |
| Market status | 0.2 | Poll every 5 minutes, cache server-side |
| Top movers | 0.3 | Poll every 3 minutes (gainers only; losers on tab switch) |
| Search / detail / charts / news | ~2–3 | On-demand only, with aggressive caching |
| **Total steady-state** | **~1.5** | Leaves headroom for user-initiated actions |

**Key design rules to stay within budget:**
1. **No automatic polling faster than 60s** — all interval-based fetches use ≥60s intervals
2. **Server-side request queue** — a rate limiter in `massive-client.ts` enforces max 5 req/min with a token bucket, queuing excess requests
3. **Aggressive caching** — ticker details (1h), bars (5min), news (5min), market status (5min), movers (3min)
4. **Batch where possible** — use multi-ticker snapshot endpoint instead of per-ticker calls
5. **Debounce user actions** — search debounced to 500ms; switching chart timeframes debounced to 300ms
6. **Stale-while-revalidate** — always show cached data immediately, refresh in background

### 4.3 Data Flow

1. **Search** — User types ticker → debounced (500ms) call to `/api/stocks/search` → Massive ticker search
2. **Add to Watchlist** — Selected ticker stored in Zustand + localStorage persistence
3. **Snapshot Polling** — TanStack Query polls `/api/stocks/snapshot` every **60s** for all watchlist tickers (single batch call)
4. **Charts** — User selects timeframe → fetch historical bars (cached 5min) → render with Lightweight Charts
5. **Detail Page** — Ticker details, news, indicators fetched on mount, served from cache on revisit

---

## 5. Pages & Routes

| Route | Page | Description |
|-------|------|-------------|
| `/` | Dashboard | Watchlist table, market status, top movers |
| `/stock/[ticker]` | Stock Detail | Full chart, quote, fundamentals, news, technicals |

---

## 6. Feature Specification

### 6.1 Dashboard Page (`/`)

#### 6.1.1 Market Status Bar
- Display current market status (open / closed / pre-market / after-hours)
- Show next market open/close time
- Source: `GET /v1/marketstatus/now`

#### 6.1.2 Ticker Search
- Search input with debounced autocomplete (300ms)
- Show ticker symbol, company name, type, exchange
- Click result → add to watchlist or navigate to detail
- Source: `GET /v3/reference/tickers?search=...`

#### 6.1.3 Watchlist Table
- Columns: Symbol, Name, Price, Change ($), Change (%), Day High, Day Low, Volume
- Rows color-coded: green for positive change, red for negative
- Click row → navigate to `/stock/[ticker]`
- Remove button per row
- Persisted in localStorage
- Source: `GET /v2/snapshot/locale/us/markets/stocks/tickers?tickers={csv}`
- Refresh: TanStack Query with **60-second** refetch interval (free tier: 5 req/min budget)
- Max watchlist size: **10 tickers** (keeps batch snapshot response fast)

#### 6.1.4 Top Movers
- Two tabs: "Gainers" and "Losers"
- Show top 20 tickers with price, change %, volume
- Click → navigate to detail page
- Source: `GET /v2/snapshot/locale/us/markets/stocks/gainers` and `/losers`

### 6.2 Stock Detail Page (`/stock/[ticker]`)

#### 6.2.1 Header
- Ticker symbol, company name, logo (from branding.logo_url)
- Current price (delayed, from snapshot polling)
- "Delayed data" badge to set user expectations
- Today's change ($ and %)
- Market cap, sector, employee count
- Source: Ticker details (cached 1h) + snapshot (polled every 60s)

#### 6.2.2 Price Chart
- TradingView Lightweight Charts candlestick chart
- Timeframe selector: 1D, 1W, 1M, 3M, 6M, 1Y, 5Y
- Timeframe-to-bar mapping:
  - 1D → 5min bars
  - 1W → 30min bars
  - 1M → 1h bars
  - 3M → 1d bars
  - 6M → 1d bars
  - 1Y → 1d bars
  - 5Y → 1w bars
- Volume bars below the price chart
- Source: `GET /v2/aggs/ticker/{ticker}/range/{multiplier}/{timespan}/{from}/{to}`

#### 6.2.3 Technical Indicators (Optional Overlays)
- Toggle overlays on the chart: SMA(20), SMA(50), EMA(12), EMA(26)
- Separate sub-chart for RSI(14) and MACD(12,26,9)
- Source: `/v1/indicators/sma|ema|rsi|macd/{ticker}`

#### 6.2.4 Key Stats Panel
- Grid layout showing:
  - Open, High, Low, Close (from day bar)
  - Previous Close (from prevDay)
  - Volume / Avg Volume
  - Market Cap
  - 52-Week High / Low (from 1Y bars max/min)
- Source: Snapshot + ticker details

#### 6.2.5 News Feed
- List of recent news articles related to the ticker
- Show: title, publisher, published date, thumbnail
- Click → open article URL in new tab
- Source: `GET /v2/reference/news?ticker={ticker}&limit=10`

---

## 7. Component Tree

```
App
├── Layout
│   ├── Header (logo, search bar, theme toggle)
│   └── MarketStatusBar
│
├── DashboardPage
│   ├── WatchlistTable
│   │   └── WatchlistRow (per ticker)
│   └── TopMovers
│       ├── GainersTab
│       └── LosersTab
│
└── StockDetailPage
    ├── StockHeader (name, price, change, logo)
    ├── PriceChart (Lightweight Charts + indicator toggles)
    ├── KeyStatsGrid
    └── NewsFeed
        └── NewsCard (per article)
```

---

## 8. State Management (Zustand Store)

```typescript
interface DashboardStore {
  // Watchlist
  watchlist: string[]                    // ticker symbols
  addTicker: (ticker: string) => void
  removeTicker: (ticker: string) => void

  // Snapshots (keyed by ticker)
  snapshots: Record<string, TickerSnapshot>
  setSnapshots: (data: Record<string, TickerSnapshot>) => void

  // Selected ticker (for detail page)
  selectedTicker: string | null

  // Market status
  marketStatus: MarketStatus | null

  // UI
  theme: 'light' | 'dark'
  toggleTheme: () => void
}
```

Persistence: `watchlist` and `theme` persisted to localStorage via Zustand `persist` middleware.

---

## 9. API Route Definitions (Next.js `/api`)

| Route | Proxied Massive Endpoint | Notes |
|-------|-------------------------|-------|
| `GET /api/stocks/search?q=` | `/v3/reference/tickers?search=` | Debounced 500ms from client, cached 10min |
| `GET /api/stocks/details/[ticker]` | `/v3/reference/tickers/{ticker}` | Cached 1 hour |
| `GET /api/stocks/snapshot?tickers=` | `/v2/snapshot/.../tickers?tickers=` | Cached 30 seconds, polled every 60s |
| `GET /api/stocks/snapshot/[ticker]` | `/v2/snapshot/.../tickers/{ticker}` | Cached 30 seconds |
| `GET /api/stocks/bars/[ticker]` | `/v2/aggs/ticker/{ticker}/range/...` | Cached 5 minutes |
| `GET /api/stocks/movers/[direction]` | `/v2/snapshot/.../stocks/{direction}` | Cached 3 minutes |
| `GET /api/stocks/indicators/[type]/[ticker]` | `/v1/indicators/{type}/{ticker}` | Cached 5 minutes |
| `GET /api/stocks/news/[ticker]` | `/v2/reference/news?ticker=` | Cached 5 minutes |
| `GET /api/market/status` | `/v1/marketstatus/now` | Cached 5 minutes |

---

## 10. Server-Side Rate Limiter

```typescript
// lib/massive-client.ts — Token bucket rate limiter

// - Capacity: 5 tokens (= 5 requests)
// - Refill: 5 tokens per 60 seconds
// - When empty: queue the request, resolve when a token becomes available
// - All API routes call massiveClient.get(url) which enforces this limit
// - Prevents 429 errors regardless of how many browser tabs / users hit the app

class MassiveClient {
  private tokens: number = 5
  private lastRefill: number = Date.now()
  private queue: Array<() => void> = []

  async get<T>(path: string, cacheSeconds?: number): Promise<T> {
    await this.acquireToken()
    // fetch from Massive API with cache headers
  }
}
```

**Note:** Since there is no WebSocket on the free tier, all price updates come from REST polling. The "Last updated X seconds ago" timestamp is shown on the UI so users understand the data delay.

---

## 11. Key TypeScript Types

```typescript
interface TickerSnapshot {
  ticker: string
  todaysChange: number
  todaysChangePerc: number
  updated: number
  day: OHLCBar
  min: OHLCBar
  prevDay: OHLCBar
  lastTrade?: { p: number; s: number; t: number }
  lastQuote?: { P: number; S: number; p: number; s: number; t: number }
}

interface OHLCBar {
  o: number   // open
  h: number   // high
  l: number   // low
  c: number   // close
  v: number   // volume
  vw: number  // volume-weighted avg price
}

interface AggregateBar extends OHLCBar {
  t: number   // timestamp (ms)
  n: number   // number of transactions
}

interface TickerDetails {
  ticker: string
  name: string
  description: string
  market_cap: number
  homepage_url: string
  total_employees: number
  sic_description: string
  branding: { logo_url: string; icon_url: string }
  list_date: string
  active: boolean
}

interface MarketStatus {
  market: string          // "open" | "closed" | "extended-hours"
  earlyHours: boolean
  afterHours: boolean
  serverTime: string
}

interface NewsArticle {
  id: string
  title: string
  author: string
  article_url: string
  image_url: string
  published_utc: string
  tickers: string[]
  description: string
}

interface IndicatorValue {
  timestamp: number
  value: number
}
```

---

## 12. Project Structure

```
market-crusher/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout, providers, header
│   │   ├── page.tsx                # Dashboard page
│   │   ├── stock/
│   │   │   └── [ticker]/
│   │   │       └── page.tsx        # Stock detail page
│   │   └── api/
│   │       ├── stocks/
│   │       │   ├── search/route.ts
│   │       │   ├── details/[ticker]/route.ts
│   │       │   ├── snapshot/route.ts
│   │       │   ├── snapshot/[ticker]/route.ts
│   │       │   ├── bars/[ticker]/route.ts
│   │       │   ├── movers/[direction]/route.ts
│   │       │   ├── indicators/[type]/[ticker]/route.ts
│   │       │   └── news/[ticker]/route.ts
│   │       └── market/
│   │           └── status/route.ts
│   ├── components/
│   │   ├── Header.tsx
│   │   ├── MarketStatusBar.tsx
│   │   ├── TickerSearch.tsx
│   │   ├── WatchlistTable.tsx
│   │   ├── WatchlistRow.tsx
│   │   ├── TopMovers.tsx
│   │   ├── StockHeader.tsx
│   │   ├── PriceChart.tsx
│   │   ├── KeyStatsGrid.tsx
│   │   ├── NewsFeed.tsx
│   │   └── NewsCard.tsx
│   ├── hooks/
│   │   └── useDebounce.ts
│   ├── lib/
│   │   ├── massive-client.ts       # Server-side Massive API client + rate limiter
│   │   ├── rate-limiter.ts         # Token bucket (5 req/min)
│   │   └── utils.ts                # Formatters (currency, %, large numbers)
│   ├── store/
│   │   └── dashboard-store.ts      # Zustand store
│   └── types/
│       └── index.ts                # All TypeScript interfaces
├── public/
├── .env.local                      # MASSIVE_API_KEY=xxx
├── tailwind.config.ts
├── tsconfig.json
├── next.config.js
├── package.json
└── vitest.config.ts
```

---

## 13. Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `MASSIVE_API_KEY` | Massive API key (server-side only) | Yes |

The API key must **never** be exposed to the client. All Massive API calls go through server-side API routes.

---

## 14. Error Handling

| Scenario | Behavior |
|----------|----------|
| API rate limit (429) | Server-side queue absorbs the request; client never sees 429. If queue is full (>10 pending), return 503 with "Service busy, try again shortly" |
| API error (4xx/5xx) | Show inline error message, keep stale cached data visible |
| Invalid ticker | Show "Ticker not found" on detail page |
| Network offline | Show persistent "No connection" banner, pause polling |
| Rate budget exhausted | Show "Data refreshes paused" subtle banner, resume when tokens refill |

---

## 15. Performance Considerations

- **Batch snapshots**: Single API call for all watchlist tickers (max 10) rather than per-ticker calls
- **Stale-while-revalidate**: TanStack Query shows cached data immediately while refetching in background
- **Debounced search**: 500ms debounce on ticker search to limit API calls
- **Aggressive server-side caching**: In-memory cache with TTLs (see Section 9) — repeated requests for the same data don't consume rate limit tokens
- **Token bucket rate limiter**: Guarantees max 5 req/min to Massive API regardless of client traffic
- **Dynamic imports**: Lazy-load chart component (Lightweight Charts is ~45KB)
- **"Last updated" timestamps**: Every data section shows when it was last refreshed, so delayed data is transparent

---

## 16. Future Enhancements (Out of Scope for v1)

- Portfolio tracking with P&L
- Price alerts / notifications
- Options chain viewer
- Multi-asset support (crypto, forex)
- Comparison charts (overlay multiple tickers)
- Fundamentals deep-dive (income statement, balance sheet)

---

## 17. Success Criteria

1. User can search and add tickers to a watchlist (max 10)
2. Watchlist shows updating prices (60s polling, delayed data)
3. Stock detail page shows candlestick chart with selectable timeframes
4. Top gainers/losers visible on dashboard
5. Market open/closed status displayed
6. News feed on stock detail page
7. Dark/light theme toggle
8. Watchlist persists across browser sessions
9. API key never exposed to client-side code
10. **App never exceeds 5 API requests/minute to Massive** (enforced by server-side rate limiter)
11. "Delayed data" and "Last updated" indicators visible to users