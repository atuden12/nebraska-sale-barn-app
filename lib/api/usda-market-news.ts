/**
 * USDA Market News API Client (MARS API v1.2)
 *
 * Documentation: https://mymarketnews.ams.usda.gov/mars-api/getting-started
 * Auth: Basic auth with API key as username, no password
 * Reports use numeric slug_id, e.g. /reports/1860
 *
 * Nebraska Reports:
 * - 1860 (AMS_1860): Nebraska Weekly Livestock Auction Summary
 * - 3237 (AMS_3237): Wyoming-Nebraska Direct Cattle Report
 * - 2935 (AMS_2935): Nebraska Direct Hay Report
 * - 3225 (AMS_3225): Nebraska Daily Elevator Grain Bids
 */

import { AuctionReport, AuctionSale, CashPrice, CashPriceReport } from "../types";

const USDA_API_BASE = "https://marsapi.ams.usda.gov/services/v1.2";

// Helper to get API key
function getApiKey(): string {
  const key = process.env.USDA_MARKET_NEWS_API_KEY?.trim();
  if (!key) {
    console.warn("USDA_MARKET_NEWS_API_KEY not set, using public endpoints");
  }
  return key || "";
}

// Generic fetch with error handling and caching
async function fetchUSDA<T>(
  endpoint: string,
  revalidate: number = 3600
): Promise<T | null> {
  const apiKey = getApiKey();
  const headers: HeadersInit = {
    Accept: "application/json",
  };

  if (apiKey) {
    // USDA MARS API uses Basic auth with the API key as the username (no password)
    const encoded = Buffer.from(`${apiKey}:`).toString("base64");
    headers["Authorization"] = `Basic ${encoded}`;
  }

  try {
    const url = `${USDA_API_BASE}${endpoint}`;
    console.log("[v0] MARS fetch:", url, "| auth:", !!apiKey);
    const response = await fetch(url, {
      headers,
      cache: "no-store",
    });

    if (!response.ok) {
      const body = await response.text();
      console.error(`[v0] USDA API error: ${response.status} ${response.statusText}`, body);
      return null;
    }

    console.log("[v0] USDA API success for:", endpoint);

    return await response.json();
  } catch (error) {
    console.error("USDA API fetch error:", error);
    return null;
  }
}

// Wyoming-Nebraska Direct Cattle Report (AMS_3237, slug_id 3237)
export async function fetchNebraskaDirectSlaughter(): Promise<CashPriceReport | null> {
  const endpoint = "/reports/3237";
  const data = await fetchUSDA<any[]>(endpoint, 3600);

  if (!data || !Array.isArray(data)) {
    return null;
  }

  // Transform USDA MARS data to our format
  // Fields: report_date, market_location_name, head_count, avg_weight,
  //         avg_price, avg_price_min, avg_price_max, class, category, commodity
  const prices: CashPrice[] = data
    .filter((item) => parseFloat(item.avg_price) > 0)
    .slice(0, 20)
    .map((item) => ({
      reportDate: item.report_date || item.published_date || new Date().toISOString(),
      priceType: mapPriceType(item.category || item.class || ""),
      region: item.market_location_name || item.market_location_state || "Nebraska",
      headCount: parseInt(item.head_count) || 0,
      weightedAvgPrice: parseFloat(item.avg_price) || 0,
      priceRange: {
        low: parseFloat(item.avg_price_min) || 0,
        high: parseFloat(item.avg_price_max) || 0,
      },
      avgWeight: parseFloat(item.avg_weight) || 0,
      dressedBasis: item.dressing ? parseFloat(item.dressing) : undefined,
    }));

  return {
    reportDate: data[0]?.report_date || new Date().toISOString(),
    prices,
  };
}

// 5-Area / National prices - reuse Wyoming-Nebraska Direct Cattle data
// since a separate 5-area report isn't available in MARS API
export async function fetch5AreaWeeklyPrices(): Promise<CashPriceReport | null> {
  // Fall back to the same Nebraska direct cattle report
  return fetchNebraskaDirectSlaughter();
}

// Nebraska Weekly Livestock Auction Summary (AMS_1860, slug_id 1860)
export async function fetchNebraskaAuctions(): Promise<AuctionReport[]> {
  const endpoint = "/reports/1860";
  const data = await fetchUSDA<any[]>(endpoint, 7200); // 2-hour cache

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
        totalHeadCount: parseInt(items[0]?.receipts) || sales.reduce((sum, s) => sum + s.headCount, 0),
        sales: sales,
        commentary: items[0]?.report_narrative || items[0]?.comments_commodity,
      });
    }
  }

  return reports;
}

// Alternative: Fetch from public feed endpoint
export async function fetchMarketNewsPublicFeed(): Promise<any> {
  // This uses the public XML/RSS feed that doesn't require auth
  const publicUrl =
    "https://www.ams.usda.gov/mnreports/lm_ct155.txt";

  try {
    const response = await fetch(publicUrl, {
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      return null;
    }

    const text = await response.text();
    return parseUSDATextReport(text);
  } catch (error) {
    console.error("Error fetching public USDA feed:", error);
    return null;
  }
}

// Parse USDA plain text reports
function parseUSDATextReport(text: string): any {
  // USDA text reports have a specific format
  // This is a simplified parser
  const lines = text.split("\n");
  const data: any[] = [];

  let inDataSection = false;

  for (const line of lines) {
    if (line.includes("---") || line.includes("===")) {
      inDataSection = true;
      continue;
    }

    if (inDataSection && line.trim()) {
      // Parse data rows - format varies by report
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

// Helper functions
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
