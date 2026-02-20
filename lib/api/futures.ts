/**
 * Futures Data Fetching - Front Month Only
 *
 * CME Live Cattle (LE=F) and Feeder Cattle (GF=F) front-month quotes.
 * Uses Yahoo Finance delayed data (free, 15-20min delay).
 */

import { FuturesContract, FuturesData } from "../types";

export interface FuturesFetchResult {
  data: FuturesData;
  source: "live" | "demo";
}

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

// Fetch front-month only futures data
export async function fetchFuturesData(): Promise<FuturesFetchResult> {
  const [liveCattle, feederCattle] = await Promise.all([
    fetchLiveCattleFutures(),
    fetchFeederCattleFutures(),
  ]);

  const isLive = liveCattle.source === "live" || feederCattle.source === "live";

  return {
    data: {
      liveCattle: liveCattle.contracts,
      feederCattle: feederCattle.contracts,
      lastUpdated: new Date().toISOString(),
    },
    source: isLive ? "live" : "demo",
  };
}

async function fetchLiveCattleFutures(): Promise<{
  contracts: FuturesContract[];
  source: "live" | "demo";
}> {
  try {
    const quote = await fetchYahooQuote("LE=F");

    if (quote && quote.lastPrice !== undefined && quote.lastPrice > 0) {
      const symbol = getFrontMonthSymbol("LE");
      return {
        contracts: [
          {
            symbol,
            name: "Live Cattle",
            contractMonth: getContractMonth(symbol),
            lastPrice: quote.lastPrice,
            change: quote.change ?? 0,
            changePercent: quote.changePercent ?? 0,
            open: quote.open ?? quote.lastPrice,
            high: quote.high ?? quote.lastPrice,
            low: quote.low ?? quote.lastPrice,
            volume: quote.volume ?? 0,
            lastUpdated: quote.lastUpdated || new Date().toISOString(),
          },
        ],
        source: "live",
      };
    }

    return { contracts: getMockLiveCattleData(), source: "demo" };
  } catch (error) {
    console.error("[v0] Error fetching live cattle futures:", error);
    return { contracts: getMockLiveCattleData(), source: "demo" };
  }
}

async function fetchFeederCattleFutures(): Promise<{
  contracts: FuturesContract[];
  source: "live" | "demo";
}> {
  try {
    const quote = await fetchYahooQuote("GF=F");

    if (quote && quote.lastPrice !== undefined && quote.lastPrice > 0) {
      const symbol = getFrontMonthSymbol("GF");
      return {
        contracts: [
          {
            symbol,
            name: "Feeder Cattle",
            contractMonth: getContractMonth(symbol),
            lastPrice: quote.lastPrice,
            change: quote.change ?? 0,
            changePercent: quote.changePercent ?? 0,
            open: quote.open ?? quote.lastPrice,
            high: quote.high ?? quote.lastPrice,
            low: quote.low ?? quote.lastPrice,
            volume: quote.volume ?? 0,
            lastUpdated: quote.lastUpdated || new Date().toISOString(),
          },
        ],
        source: "live",
      };
    }

    return { contracts: getMockFeederCattleData(), source: "demo" };
  } catch (error) {
    console.error("[v0] Error fetching feeder cattle futures:", error);
    return { contracts: getMockFeederCattleData(), source: "demo" };
  }
}

// Yahoo Finance quote fetcher
async function fetchYahooQuote(
  symbol: string
): Promise<Partial<FuturesContract> | null> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=5d`;

    const response = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      next: { revalidate: 900 }, // 15-minute cache
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
    const currentPrice =
      meta.regularMarketPrice || quote?.close?.[lastIndex] || 0;

    return {
      lastPrice: currentPrice,
      change: currentPrice - prevClose,
      changePercent:
        prevClose > 0 ? ((currentPrice - prevClose) / prevClose) * 100 : 0,
      open:
        quote?.open?.[lastIndex] || meta.regularMarketOpen || currentPrice,
      high:
        quote?.high?.[lastIndex] || meta.regularMarketDayHigh || currentPrice,
      low:
        quote?.low?.[lastIndex] || meta.regularMarketDayLow || currentPrice,
      volume: quote?.volume?.[lastIndex] || meta.regularMarketVolume || 0,
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error(`[v0] Error fetching Yahoo quote for ${symbol}:`, error);
    return null;
  }
}

function getFrontMonthSymbol(base: string): string {
  const now = new Date();
  const currentMonth = now.getMonth();
  const year = now.getFullYear() % 100;

  const lcMonths = ["G", "J", "M", "Q", "V", "Z"];
  const fcMonths = ["F", "H", "J", "K", "Q", "U", "V", "X"];
  const months = base === "LE" ? lcMonths : fcMonths;
  const monthIndices = Object.keys(MONTH_CODES);

  for (const code of months) {
    const idx = monthIndices.indexOf(code);
    if (idx >= currentMonth) {
      return `${base}${code}${year}`;
    }
  }
  // Wrap to next year
  return `${base}${months[0]}${year + 1}`;
}

function getContractMonth(symbol: string): string {
  if (!symbol || symbol.length < 3) return "Unknown";
  const monthCode = symbol.charAt(symbol.length - 3);
  const yr = symbol.slice(-2);
  return `${MONTH_CODES[monthCode] || "Unknown"} 20${yr}`;
}

// Front-month-only demo data
function getMockLiveCattleData(): FuturesContract[] {
  return [
    {
      symbol: getFrontMonthSymbol("LE"),
      name: "Live Cattle",
      contractMonth: getContractMonth(getFrontMonthSymbol("LE")),
      lastPrice: 185.575,
      change: 0.825,
      changePercent: 0.45,
      open: 185.0,
      high: 186.25,
      low: 184.75,
      volume: 24532,
      lastUpdated: new Date().toISOString(),
    },
  ];
}

function getMockFeederCattleData(): FuturesContract[] {
  return [
    {
      symbol: getFrontMonthSymbol("GF"),
      name: "Feeder Cattle",
      contractMonth: getContractMonth(getFrontMonthSymbol("GF")),
      lastPrice: 252.75,
      change: 1.125,
      changePercent: 0.45,
      open: 251.75,
      high: 253.5,
      low: 251.25,
      volume: 8432,
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
      headers: { "User-Agent": "Mozilla/5.0" },
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    const result = data?.chart?.result?.[0];
    const timestamps = result?.timestamp || [];
    const closes = result?.indicators?.quote?.[0]?.close || [];

    return timestamps
      .map((ts: number, i: number) => ({
        date: new Date(ts * 1000).toISOString().split("T")[0],
        price: closes[i] || 0,
      }))
      .filter((p: { price: number }) => p.price > 0);
  } catch (error) {
    console.error("[v0] Error fetching price history:", error);
    return [];
  }
}
