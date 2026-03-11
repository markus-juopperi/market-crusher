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

export interface CandleData {
  t: number;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
}
