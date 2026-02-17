/**
 * USDA Market News API Client (MARS API v1.2)
 * Auth: Basic auth with API key as username, no password
 * Reports use numeric slug_id, e.g. /reports/1860
 *
 * Nebraska Reports discovered via API:
 * - 1860 (AMS_1860): Nebraska Weekly Livestock Auction Summary
 * - 3237 (AMS_3237): Wyoming-Nebraska Direct Cattle Report
 */

import {
  AuctionReport,
  AuctionSale,
  CashPrice,
  CashPriceReport,
} from "../types";

const MARS_BASE = "https://marsapi.ams.usda.gov/services/v1.2";

function getMarsApiKey(): string {
  const key = process.env.USDA_MARKET_NEWS_API_KEY?.trim();
  if (!key) {
    console.warn("[v0] USDA_MARKET_NEWS_API_KEY not set");
  }
  return key || "";
}

function buildAuthHeaders(apiKey: string): HeadersInit {
  const headers: HeadersInit = { Accept: "application/json" };
  if (apiKey) {
    const encoded = Buffer.from(`${apiKey}:`).toString("base64");
    headers["Authorization"] = `Basic ${encoded}`;
  }
  return headers;
}

async function marsApiFetch<T>(slugId: number): Promise<T | null> {
  const apiKey = getMarsApiKey();
  const headers = buildAuthHeaders(apiKey);
  const url = `${MARS_BASE}/reports/${slugId}`;

  try {
    console.log(`[v0] MARS fetch slug=${slugId} auth=${!!apiKey} ts=${Date.now()}`);
    const response = await fetch(url, { headers, cache: "no-store" });

    if (!response.ok) {
      const body = await response.text();
      console.error(`[v0] MARS ${slugId} error: ${response.status}`, body);
      return null;
    }

    const json = await response.json();
    console.log(`[v0] MARS ${slugId} success, records=${Array.isArray(json) ? json.length : "obj"}`);
    return json;
  } catch (error) {
    console.error(`[v0] MARS ${slugId} fetch error:`, error);
    return null;
  }
}

// --- Cash Prices: Wyoming-Nebraska Direct Cattle Report (slug_id 3237) ---

export async function fetchNebraskaDirectSlaughter(): Promise<CashPriceReport | null> {
  const data = await marsApiFetch<any[]>(3237);

  if (!data || !Array.isArray(data) || data.length === 0) {
    return null;
  }

  const prices: CashPrice[] = data
    .filter((item) => parseFloat(item.avg_price) > 0)
    .slice(0, 20)
    .map((item) => ({
      reportDate: item.report_date || new Date().toISOString(),
      priceType: mapPriceType(item.category || item.class || ""),
      region: item.market_location_name || item.market_location_state || "Nebraska",
      headCount: parseInt(item.head_count) || 0,
      weightedAvgPrice: parseFloat(item.avg_price) || 0,
      priceRange: {
        low: parseFloat(item.avg_price_min || item.price_low) || 0,
        high: parseFloat(item.avg_price_max || item.price_high) || 0,
      },
      avgWeight: parseFloat(item.avg_weight) || 0,
      dressedBasis: item.dressing ? parseFloat(item.dressing) : undefined,
    }));

  return {
    reportDate: data[0]?.report_date || new Date().toISOString(),
    prices,
  };
}

// 5-Area reuses the same Nebraska direct cattle data
export async function fetch5AreaWeeklyPrices(): Promise<CashPriceReport | null> {
  return fetchNebraskaDirectSlaughter();
}

// --- Auctions: Nebraska Weekly Livestock Auction Summary (slug_id 1860) ---

export async function fetchNebraskaAuctions(): Promise<AuctionReport[]> {
  const data = await marsApiFetch<any[]>(1860);

  if (!data || !Array.isArray(data) || data.length === 0) {
    return [];
  }

  // Group by market location
  const byMarket = new Map<string, any[]>();
  for (const item of data) {
    const market = item.market_location_name || "Unknown";
    if (!byMarket.has(market)) byMarket.set(market, []);
    byMarket.get(market)!.push(item);
  }

  const reports: AuctionReport[] = [];

  for (const [market, items] of byMarket) {
    const sales: AuctionSale[] = items
      .filter((item) => parseFloat(item.avg_price) > 0)
      .slice(0, 50)
      .map((item) => ({
        reportDate: item.report_date || new Date().toISOString(),
        marketLocation: item.market_location_name || "Nebraska",
        headCount: parseInt(item.head_count) || 0,
        avgPrice: parseFloat(item.avg_price) || 0,
        priceRange: {
          low: parseFloat(item.avg_price_min) || 0,
          high: parseFloat(item.avg_price_max) || 0,
        },
        weightRange: {
          low: parseFloat(item.weight_break_low || item.avg_weight_min) || 0,
          high: parseFloat(item.weight_break_high || item.avg_weight_max) || 0,
        },
        category: item.class || item.category || "Mixed",
        grade: item.quality_grade_name || item.frame,
        trend: mapTrend(item.comments_commodity || ""),
      }));

    if (sales.length > 0) {
      reports.push({
        reportDate: items[0]?.report_date || new Date().toISOString(),
        reportTitle: items[0]?.report_title || "Nebraska Weekly Livestock Auction Summary",
        marketName: market,
        totalHeadCount:
          parseInt(items[0]?.receipts) ||
          sales.reduce((sum, s) => sum + s.headCount, 0),
        sales,
        commentary: items[0]?.report_narrative || items[0]?.comments_commodity,
      });
    }
  }

  return reports;
}

// --- Public Feed Fallback ---

export async function fetchMarketNewsPublicFeed(): Promise<any> {
  const publicUrl = "https://www.ams.usda.gov/mnreports/lm_ct155.txt";

  try {
    const response = await fetch(publicUrl, { cache: "no-store" });
    if (!response.ok) return null;
    const text = await response.text();
    return parseUSDATextReport(text);
  } catch (error) {
    console.error("[v0] Public USDA feed error:", error);
    return null;
  }
}

function parseUSDATextReport(text: string): any {
  const lines = text.split("\n");
  const data: any[] = [];
  let inDataSection = false;

  for (const line of lines) {
    if (line.includes("---") || line.includes("===")) {
      inDataSection = true;
      continue;
    }
    if (inDataSection && line.trim()) {
      const parts = line.split(/\s{2,}/);
      if (parts.length >= 3) {
        data.push({
          category: parts[0]?.trim(),
          headCount: parseInt(parts[1]) || 0,
          price: parseFloat(parts[2]) || 0,
        });
      }
    }
  }
  return data;
}

// --- Helpers ---

function mapPriceType(
  type: string
): "negotiated" | "formula" | "forward" | "negotiated_grid" {
  const lower = (type || "").toLowerCase();
  if (lower.includes("formula")) return "formula";
  if (lower.includes("forward")) return "forward";
  if (lower.includes("grid")) return "negotiated_grid";
  return "negotiated";
}

function mapTrend(trend: string): "higher" | "lower" | "steady" | undefined {
  const lower = (trend || "").toLowerCase();
  if (lower.includes("higher") || lower.includes("up")) return "higher";
  if (lower.includes("lower") || lower.includes("down")) return "lower";
  if (lower.includes("steady") || lower.includes("unchanged")) return "steady";
  return undefined;
}
