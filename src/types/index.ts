export interface StockProfile {
  country: string;
  currency: string;
  exchange: string;
  industry: string;
  logo: string;
  marketCap: number;
  name: string;
  ticker: string;
  website: string;
}

export interface SearchResult {
  description: string;
  displaySymbol: string;
  symbol: string;
  type: string;
}

export interface NewsArticle {
  datetime: number;
  headline: string;
  id: string;
  image: string;
  source: string;
  summary: string;
  url: string;
}

export interface MarketStatus {
  exchange: string;
  isOpen: boolean;
  session: string;
}

export interface TickerSnapshot {
  ticker: string;
  name?: string;
  price: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  open: number;
  prevClose: number;
  updated: number;
  currency?: string;
}

export interface PortfolioHolding {
  id: string;
  ticker: string;
  shares: number;
  buyPrice: number;
  addedAt: number;
}

export interface EarningsEvent {
  ticker: string;
  name: string;
  date: string;
  epsEstimate: number | null;
  revenueEstimate: number | null;
}

export interface AnalystRating {
  period: string;
  strongBuy: number;
  buy: number;
  hold: number;
  sell: number;
  strongSell: number;
}

export interface SharedPortfolioEntry {
  ticker: string;
  shares: number;
  buyPrice: number;
}

