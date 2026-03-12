# Market Crusher

Real-time stock dashboard with delayed market data, historical charts, watchlists, and market movers.

## Tech Stack

- **Next.js 15** (App Router) with TypeScript
- **React 19** + **Tailwind CSS 3**
- **TradingView Lightweight Charts 5** for candlestick charting
- **Zustand 5** for state management (watchlist persisted to localStorage)
- **Finnhub API** for quotes, search, company profiles, news, and market status
- **Yahoo Finance** (unofficial) for historical OHLCV candles

## Features

- **Ticker Search** — search stocks by symbol or name with debounced autocomplete
- **Watchlist** — add up to 10 tickers, auto-refreshing prices every 60s, persisted across sessions
- **Portfolio Tracker** — track holdings with buy price and shares, see unrealized P&L per position and total, persisted to localStorage; ticker search with autocomplete for adding positions
- **Compare Stocks** — overlay up to 5 tickers on a normalized % change chart with selectable timeframes (1M to 5Y); ticker search with autocomplete for adding tickers
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

3. Create a `.env.local` file with your Finnhub API key:

   ```
   FINNHUB_API_KEY=your_api_key_here
   ```

   Get a free API key at [finnhub.io](https://finnhub.io/).

4. Start the dev server:

   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |

## Project Structure

```
src/
├── app/
│   ├── layout.tsx                         # Root layout with header and market status bar
│   ├── page.tsx                           # Dashboard (watchlist + portfolio + top movers)
│   ├── compare/page.tsx                   # Compare stocks page
│   ├── stock/[ticker]/page.tsx            # Stock detail page
│   └── api/
│       ├── stocks/
│       │   ├── search/route.ts            # Ticker search
│       │   ├── details/[ticker]/route.ts  # Company profile
│       │   ├── snapshot/[ticker]/route.ts # Current quote
│       │   ├── bars/[ticker]/route.ts     # Historical candles (Yahoo Finance)
│       │   ├── movers/[direction]/route.ts# Top gainers/losers
│       │   └── news/[ticker]/route.ts     # Company news
│       └── market/
│           └── status/route.ts            # Market open/closed status
├── __tests__/                             # Vitest unit tests
├── components/                            # React components (includes reusable TickerSearchInput)
├── hooks/                                 # Custom hooks (useDebounce)
├── lib/
│   ├── finnhub-client.ts                  # Server-side API client with in-memory caching
│   └── utils.ts                           # Currency/percent formatters
├── store/
│   └── dashboard-store.ts                 # Zustand store
└── types/
    └── index.ts                           # TypeScript interfaces
```

## API Architecture

All external API calls are proxied through Next.js API routes to keep the API key server-side. The Finnhub client includes in-memory caching with configurable TTLs per endpoint (30s for quotes, 5min for bars/news/movers, 1h for company profiles).

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `FINNHUB_API_KEY` | Finnhub API key (server-side only) | Yes |
