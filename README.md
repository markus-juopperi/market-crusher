# Market Crusher

Real-time stock dashboard with delayed market data, historical charts, watchlists, and market movers.

## Tech Stack

- **Next.js 15** (App Router) with TypeScript
- **React 19** + **Tailwind CSS 3**
- **TradingView Lightweight Charts 5** for candlestick charting
- **Zustand 5** for state management (watchlist persisted to localStorage)
- **Yahoo Finance** (via `yahoo-finance2`) for quotes, search, company profiles, news, and market status

## Features

- **Ticker Search** — search stocks by symbol or name with debounced autocomplete
- **Watchlist** — add up to 10 tickers, auto-refreshing prices every 60s, persisted across sessions
- **Top Movers** — daily gainers and losers with price and percent change
- **Market Status** — live open/closed/pre-market indicator
- **Stock Detail Page** — candlestick chart with 7 timeframes (1D to 5Y), volume overlay, key stats, and news feed
- **Dark Theme** — always-on dark UI

## Getting Started

### Prerequisites

- Node.js 20+
- npm

### Setup

1. Clone the repository:

   ```bash
   git clone <repo-url>
   cd market-crusher
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the dev server:

   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm test` | Run unit tests (Vitest) |
| `npm run test:e2e` | Run E2E tests (Playwright) |
| `npm run test:all` | Run all tests |

## Testing

- **Unit tests** — [Vitest](https://vitest.dev/) with React Testing Library, located in `src/__tests__/`
- **E2E tests** — [Playwright](https://playwright.dev/) with Chromium, located in `e2e/`

## CI/CD

GitHub Actions runs on every push to `master` and on pull requests:

1. **Lint** — ESLint
2. **Type Check** — `tsc --noEmit`
3. **Unit Tests** — Vitest
4. **Build** — Next.js production build
5. **E2E Tests** — Playwright (runs after build, uploads report as artifact)

## Project Structure

```
src/
├── app/
│   ├── layout.tsx                         # Root layout with header and market status bar
│   ├── page.tsx                           # Dashboard (watchlist + top movers)
│   ├── stock/[ticker]/page.tsx            # Stock detail page
│   └── api/
│       ├── stocks/
│       │   ├── search/route.ts            # Ticker search
│       │   ├── details/[ticker]/route.ts  # Company profile
│       │   ├── snapshot/[ticker]/route.ts # Current quote
│       │   ├── snapshot/route.ts          # Batch quotes
│       │   ├── bars/[ticker]/route.ts     # Historical candles
│       │   ├── movers/[direction]/route.ts# Top gainers/losers
│       │   └── news/[ticker]/route.ts     # Company news
│       └── market/
│           └── status/route.ts            # Market open/closed status
├── __tests__/                             # Vitest unit tests
├── components/                            # React components
├── hooks/                                 # Custom hooks (useDebounce)
├── lib/
│   ├── yahoo-client.ts                    # Server-side Yahoo Finance client with caching
│   └── utils.ts                           # Currency/percent formatters
├── store/
│   └── dashboard-store.ts                 # Zustand store
└── types/
    └── index.ts                           # TypeScript interfaces
e2e/
└── dashboard.spec.ts                      # Playwright E2E tests
```

## API Architecture

All external API calls are proxied through Next.js API routes to keep data fetching server-side. The Yahoo Finance client includes in-memory caching with configurable TTLs per endpoint (30s for quotes, 5min for bars/news/movers, 1h for company profiles). No API key is required.
