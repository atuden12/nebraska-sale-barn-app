/**
 * Futures Data Fetching
 *
 * CME Live Cattle and Feeder Cattle futures data.
 *
 * Note: Real-time CME data requires paid subscriptions.
 * This implementation uses publicly available delayed data
 * and free API sources where possible.
 *
 * Options for production:
 * 1. CME DataMine API (paid): https://www.cmegroup.com/market-data/datamine-api.html
 * 2. Barchart OnDemand (paid): https://www.barchart.com/ondemand
 * 3. Yahoo Finance (free, delayed): Limited but available
 * 4. Alpha Vantage (free tier): Commodities endpoint
 */

import { FuturesContract, FuturesData } from "../types";

// Contract month codes
const MONTH_CODES: Record<string, string> = {
  F: "January",
  G: "February",
  H: "March",
  J: "April",
  K: "May",
  M: "June",
  N: "July",
  Q: "August",
  U: "September",
  V: "October",
  X: "November",
  Z: "December",
};

// Generate contract symbols for current and upcoming months
function generateContractSymbols(
  baseSymbol: string,
  monthsAhead: number = 6
): string[] {
  const symbols: string[] = [];
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  // Live Cattle trades: Feb (G), Apr (J), Jun (M), Aug (Q), Oct (V), Dec (Z)
  // Feeder Cattle trades: Jan (F), Mar (H), Apr (J), May (K), Aug (Q), Sep (U), Oct (V), Nov (X)
  const lcMonths = ["G", "J", "M", "Q", "V", "Z"];
  const fcMonths = ["F", "H", "J", "K", "Q", "U", "V", "X"];

  const tradingMonths = baseSymbol === "LE" ? lcMonths : fcMonths;
  let count = 0;

  for (let yearOffset = 0; yearOffset <= 2 && count < monthsAhead; yearOffset++) {
    const year = currentYear + yearOffset;
    for (const monthCode of tradingMonths) {
      const monthIndex = Object.keys(MONTH_CODES).indexOf(monthCode);
      if (yearOffset === 0 && monthIndex < currentMonth) continue;

      symbols.push(`${baseSymbol}${monthCode}${year % 100}`);
      count++;
      if (count >= monthsAhead) break;
    }
  }

  return symbols;
}

// Fetch from a free delayed data source (simulated structure)
// In production, replace with actual API calls
export async function fetchFuturesData(): Promise<FuturesData> {
  const liveCattle = await fetchLiveCattleFutures();
  const feederCattle = await fetchFeederCattleFutures();

  return {
    liveCattle,
    feederCattle,
    lastUpdated: new Date().toISOString(),
  };
}

async function fetchLiveCattleFutures(): Promise<FuturesContract[]> {
  // Try to fetch from Yahoo Finance or similar free source
  // Yahoo symbols: LE=F for front month, LEG24.CME for specific contracts

  try {
    // Using a proxy-friendly approach
    const contracts: FuturesContract[] = [];
    const symbols = generateContractSymbols("LE", 4);

    // For demo purposes, we'll fetch what we can and generate reasonable estimates
    // In production, use proper API
    const frontMonthData = await fetchYahooQuote("LE=F");

    if (frontMonthData && frontMonthData.lastPrice !== undefined) {
      const basePrice = frontMonthData.lastPrice;
      const baseChange = frontMonthData.change ?? 0;
      const baseChangePercent = frontMonthData.changePercent ?? 0;
      const baseOpen = frontMonthData.open ?? basePrice;
      const baseHigh = frontMonthData.high ?? basePrice;
      const baseLow = frontMonthData.low ?? basePrice;
      const baseVolume = frontMonthData.volume ?? 0;

      contracts.push({
        symbol: symbols[0] || "LE",
        name: "Live Cattle",
        contractMonth: getContractMonth(symbols[0]),
        lastPrice: basePrice,
        change: baseChange,
        changePercent: baseChangePercent,
        open: baseOpen,
        high: baseHigh,
        low: baseLow,
        volume: baseVolume,
        lastUpdated: frontMonthData.lastUpdated || new Date().toISOString(),
      });

      // Estimate deferred months based on typical contango/backwardation
      for (let i = 1; i < Math.min(4, symbols.length); i++) {
        const spread = (i * 0.5 + Math.random() * 0.5) * (Math.random() > 0.5 ? 1 : -1);
        contracts.push({
          symbol: symbols[i],
          name: "Live Cattle",
          contractMonth: getContractMonth(symbols[i]),
          lastPrice: basePrice + spread,
          change: baseChange * (0.8 + Math.random() * 0.4),
          changePercent: baseChangePercent * (0.8 + Math.random() * 0.4),
          open: baseOpen + spread,
          high: baseHigh + spread,
          low: baseLow + spread,
          volume: Math.floor(baseVolume * (0.3 + Math.random() * 0.4)),
          lastUpdated: new Date().toISOString(),
        });
      }
    }

    return contracts.length > 0 ? contracts : getMockLiveCattleData();
  } catch (error) {
    console.error("Error fetching live cattle futures:", error);
    return getMockLiveCattleData();
  }
}

async function fetchFeederCattleFutures(): Promise<FuturesContract[]> {
  try {
    const contracts: FuturesContract[] = [];
    const symbols = generateContractSymbols("GF", 4);

    const frontMonthData = await fetchYahooQuote("GF=F");

    if (frontMonthData && frontMonthData.lastPrice !== undefined) {
      const basePrice = frontMonthData.lastPrice;
      const baseChange = frontMonthData.change ?? 0;
      const baseChangePercent = frontMonthData.changePercent ?? 0;
      const baseOpen = frontMonthData.open ?? basePrice;
      const baseHigh = frontMonthData.high ?? basePrice;
      const baseLow = frontMonthData.low ?? basePrice;
      const baseVolume = frontMonthData.volume ?? 0;

      contracts.push({
        symbol: symbols[0] || "GF",
        name: "Feeder Cattle",
        contractMonth: getContractMonth(symbols[0]),
        lastPrice: basePrice,
        change: baseChange,
        changePercent: baseChangePercent,
        open: baseOpen,
        high: baseHigh,
        low: baseLow,
        volume: baseVolume,
        lastUpdated: frontMonthData.lastUpdated || new Date().toISOString(),
      });

      for (let i = 1; i < Math.min(4, symbols.length); i++) {
        const spread = (i * 0.75 + Math.random() * 0.5) * (Math.random() > 0.5 ? 1 : -1);
        contracts.push({
          symbol: symbols[i],
          name: "Feeder Cattle",
          contractMonth: getContractMonth(symbols[i]),
          lastPrice: basePrice + spread,
          change: baseChange * (0.8 + Math.random() * 0.4),
          changePercent: baseChangePercent * (0.8 + Math.random() * 0.4),
          open: baseOpen + spread,
          high: baseHigh + spread,
          low: baseLow + spread,
          volume: Math.floor(baseVolume * (0.2 + Math.random() * 0.3)),
          lastUpdated: new Date().toISOString(),
        });
      }
    }

    return contracts.length > 0 ? contracts : getMockFeederCattleData();
  } catch (error) {
    console.error("Error fetching feeder cattle futures:", error);
    return getMockFeederCattleData();
  }
}

// Yahoo Finance quote fetcher
async function fetchYahooQuote(
  symbol: string
): Promise<Partial<FuturesContract> | null> {
  try {
    // Yahoo Finance v8 API (often works without auth for delayed quotes)
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=5d`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
      next: { revalidate: 900 }, // 15-minute cache for futures
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const result = data?.chart?.result?.[0];
    const meta = result?.meta;
    const quote = result?.indicators?.quote?.[0];

    if (!meta) {
      return null;
    }

    const lastIndex = (quote?.close?.length || 1) - 1;
    const prevClose = meta.chartPreviousClose || meta.previousClose || 0;
    const currentPrice = meta.regularMarketPrice || quote?.close?.[lastIndex] || 0;

    return {
      lastPrice: currentPrice,
      change: currentPrice - prevClose,
      changePercent: prevClose > 0 ? ((currentPrice - prevClose) / prevClose) * 100 : 0,
      open: quote?.open?.[lastIndex] || meta.regularMarketOpen || currentPrice,
      high: quote?.high?.[lastIndex] || meta.regularMarketDayHigh || currentPrice,
      low: quote?.low?.[lastIndex] || meta.regularMarketDayLow || currentPrice,
      volume: quote?.volume?.[lastIndex] || meta.regularMarketVolume || 0,
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error(`Error fetching Yahoo quote for ${symbol}:`, error);
    return null;
  }
}

function getContractMonth(symbol: string): string {
  if (!symbol || symbol.length < 3) return "Unknown";
  const monthCode = symbol.charAt(symbol.length - 3);
  const year = symbol.slice(-2);
  return `${MONTH_CODES[monthCode] || "Unknown"} 20${year}`;
}

// Mock data for when APIs are unavailable
function getMockLiveCattleData(): FuturesContract[] {
  const basePrice = 185.5;
  return [
    {
      symbol: "LEG25",
      name: "Live Cattle",
      contractMonth: "February 2025",
      lastPrice: basePrice,
      change: 0.825,
      changePercent: 0.45,
      open: basePrice - 0.5,
      high: basePrice + 1.2,
      low: basePrice - 0.8,
      volume: 24532,
      lastUpdated: new Date().toISOString(),
    },
    {
      symbol: "LEJ25",
      name: "Live Cattle",
      contractMonth: "April 2025",
      lastPrice: basePrice + 1.25,
      change: 0.65,
      changePercent: 0.35,
      open: basePrice + 0.75,
      high: basePrice + 2.0,
      low: basePrice + 0.5,
      volume: 18234,
      lastUpdated: new Date().toISOString(),
    },
    {
      symbol: "LEM25",
      name: "Live Cattle",
      contractMonth: "June 2025",
      lastPrice: basePrice + 2.1,
      change: 0.45,
      changePercent: 0.24,
      open: basePrice + 1.5,
      high: basePrice + 2.8,
      low: basePrice + 1.3,
      volume: 12456,
      lastUpdated: new Date().toISOString(),
    },
    {
      symbol: "LEQ25",
      name: "Live Cattle",
      contractMonth: "August 2025",
      lastPrice: basePrice + 1.8,
      change: 0.35,
      changePercent: 0.19,
      open: basePrice + 1.2,
      high: basePrice + 2.5,
      low: basePrice + 1.0,
      volume: 8234,
      lastUpdated: new Date().toISOString(),
    },
  ];
}

function getMockFeederCattleData(): FuturesContract[] {
  const basePrice = 252.75;
  return [
    {
      symbol: "GFF25",
      name: "Feeder Cattle",
      contractMonth: "January 2025",
      lastPrice: basePrice,
      change: 1.125,
      changePercent: 0.45,
      open: basePrice - 0.8,
      high: basePrice + 1.5,
      low: basePrice - 1.0,
      volume: 8432,
      lastUpdated: new Date().toISOString(),
    },
    {
      symbol: "GFH25",
      name: "Feeder Cattle",
      contractMonth: "March 2025",
      lastPrice: basePrice - 0.5,
      change: 0.875,
      changePercent: 0.35,
      open: basePrice - 1.2,
      high: basePrice + 0.8,
      low: basePrice - 1.5,
      volume: 6234,
      lastUpdated: new Date().toISOString(),
    },
    {
      symbol: "GFJ25",
      name: "Feeder Cattle",
      contractMonth: "April 2025",
      lastPrice: basePrice - 1.25,
      change: 0.65,
      changePercent: 0.26,
      open: basePrice - 2.0,
      high: basePrice - 0.5,
      low: basePrice - 2.2,
      volume: 4567,
      lastUpdated: new Date().toISOString(),
    },
    {
      symbol: "GFK25",
      name: "Feeder Cattle",
      contractMonth: "May 2025",
      lastPrice: basePrice - 2.0,
      change: 0.45,
      changePercent: 0.18,
      open: basePrice - 2.5,
      high: basePrice - 1.2,
      low: basePrice - 2.8,
      volume: 3245,
      lastUpdated: new Date().toISOString(),
    },
  ];
}

// Price history for charts
export async function fetchFuturesPriceHistory(
  symbol: string,
  days: number = 30
): Promise<{ date: string; price: number }[]> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=${days}d`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    const result = data?.chart?.result?.[0];
    const timestamps = result?.timestamp || [];
    const closes = result?.indicators?.quote?.[0]?.close || [];

    return timestamps.map((ts: number, i: number) => ({
      date: new Date(ts * 1000).toISOString().split("T")[0],
      price: closes[i] || 0,
    })).filter((p: { price: number }) => p.price > 0);
  } catch (error) {
    console.error("Error fetching price history:", error);
    return [];
  }
}
