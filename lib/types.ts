// USDA Market News Report Types
export interface AuctionSale {
  reportDate: string;
  marketLocation: string;
  headCount: number;
  avgPrice: number;
  priceRange: {
    low: number;
    high: number;
  };
  weightRange: {
    low: number;
    high: number;
  };
  category: string; // e.g., "Steers", "Heifers", "Cows"
  grade?: string; // e.g., "Choice", "Select"
  trend?: "higher" | "lower" | "steady";
}

export interface AuctionReport {
  reportDate: string;
  reportTitle: string;
  marketName: string;
  totalHeadCount: number;
  sales: AuctionSale[];
  commentary?: string;
}

// Slaughter Data Types
export interface SlaughterData {
  weekEnding: string;
  cattleSlaughter: number;
  previousWeek: number;
  previousYear: number;
  percentChangeWeek: number;
  percentChangeYear: number;
  region: string;
}

// Cash Price Types
export interface CashPrice {
  reportDate: string;
  priceType: "negotiated" | "formula" | "forward" | "negotiated_grid";
  region: string;
  headCount: number;
  weightedAvgPrice: number;
  priceRange: {
    low: number;
    high: number;
  };
  avgWeight: number;
  dressedBasis?: number;
}

export interface CashPriceReport {
  reportDate: string;
  prices: CashPrice[];
}

// Futures Types
export interface FuturesContract {
  symbol: string;
  name: string;
  contractMonth: string;
  lastPrice: number;
  change: number;
  changePercent: number;
  open: number;
  high: number;
  low: number;
  volume: number;
  openInterest?: number;
  lastUpdated: string;
}

export interface FuturesData {
  liveCattle: FuturesContract[];
  feederCattle: FuturesContract[];
  lastUpdated: string;
}

// API Response wrapper
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  lastUpdated: string;
}

// Chart data types
export interface PriceHistoryPoint {
  date: string;
  price: number;
  volume?: number;
}

export interface MarketTrend {
  direction: "up" | "down" | "stable";
  changeAmount: number;
  changePercent: number;
  period: string;
}
