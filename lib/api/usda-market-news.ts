/**
 * USDA Market News API Client
 *
 * Documentation: https://mymarketnews.ams.usda.gov/mymarketnews-api
 *
 * Key Report Slugs for Nebraska Cattle:
 * - LM_CT158: Nebraska Weekly Direct Slaughter Cattle - Negotiated Purchases
 * - LM_CT165: Nebraska Weekly Weighted Average Direct Slaughter Cattle - Negotiated
 * - LM_CT150: 5 Area Weekly Weighted Average Direct Slaughter Cattle
 *
 * Auction Report Slugs:
 * - AMS_1860 (1860): Nebraska Weekly Livestock Auction Summary (Multiple Markets)
 * - AMS_1850 (1850): Ogallala Livestock Auction
 */

import { AuctionReport, AuctionSale, CashPrice, CashPriceReport } from "../types";

const USDA_API_BASE = "https://marsapi.ams.usda.gov/services/v1.2";

// Helper to get API key (optional - USDA MARS API works without auth)
function getApiKey(): string {
  return process.env.USDA_MARKET_NEWS_API_KEY || "";
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
    // USDA MARS API uses HTTP Basic Auth with the API key as username and no password
    const encoded = Buffer.from(`${apiKey}:`).toString("base64");
    headers["Authorization"] = `Basic ${encoded}`;
  }

  try {
    const response = await fetch(`${USDA_API_BASE}${endpoint}`, {
      headers,
      next: { revalidate },
    });

    if (!response.ok) {
      console.error(`USDA API error: ${response.status} ${response.statusText}`);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error("USDA API fetch error:", error);
    return null;
  }
}

// Nebraska Weekly Direct Slaughter Cattle - Negotiated Purchases (LM_CT158)
export async function fetchNebraskaDirectSlaughter(): Promise<CashPriceReport | null> {
  const endpoint = "/reports/lm_ct158";
  const data = await fetchUSDA<any>(endpoint, 3600);

  // MARS API wraps results in a "results" array
  const results = Array.isArray(data) ? data : data?.results;

  if (!results || !Array.isArray(results) || results.length === 0) {
    return null;
  }

  // Transform USDA data to our format
  const prices: CashPrice[] = results.slice(0, 50).map((item: any) => ({
    reportDate: item.report_date || item.published_date || new Date().toISOString(),
    priceType: mapPriceType(item.purchase_type || item.price_type || ""),
    region: "Nebraska",
    headCount: parseInt(item.head_count || item.total_head || "0") || 0,
    weightedAvgPrice: parseFloat(item.wtd_avg || item.wtd_avg_price || item.weighted_average || "0") || 0,
    priceRange: {
      low: parseFloat(item.price_low || item.low_price || "0") || 0,
      high: parseFloat(item.price_high || item.high_price || "0") || 0,
    },
    avgWeight: parseFloat(item.avg_weight || item.average_weight || "0") || 0,
    dressedBasis: parseFloat(item.dressed_basis || "0") || undefined,
  }));

  const validPrices = prices.filter((p) => p.weightedAvgPrice > 0);

  return {
    reportDate: results[0]?.report_date || new Date().toISOString(),
    prices: validPrices,
  };
}

// 5 Area Weekly Weighted Average Direct Slaughter Cattle (LM_CT150)
export async function fetch5AreaWeeklyPrices(): Promise<CashPriceReport | null> {
  const endpoint = "/reports/lm_ct150";
  const data = await fetchUSDA<any>(endpoint, 3600);

  const results = Array.isArray(data) ? data : data?.results;

  if (!results || !Array.isArray(results) || results.length === 0) {
    return null;
  }

  const prices: CashPrice[] = results.slice(0, 50).map((item: any) => ({
    reportDate: item.report_date || new Date().toISOString(),
    priceType: mapPriceType(item.purchase_type || item.price_type || ""),
    region: item.region || "5-Area",
    headCount: parseInt(item.head_count || "0") || 0,
    weightedAvgPrice: parseFloat(item.wtd_avg || item.wtd_avg_price || item.weighted_average || "0") || 0,
    priceRange: {
      low: parseFloat(item.price_low || "0") || 0,
      high: parseFloat(item.price_high || "0") || 0,
    },
    avgWeight: parseFloat(item.avg_weight || "0") || 0,
  }));

  const validPrices = prices.filter((p) => p.weightedAvgPrice > 0);

  return {
    reportDate: results[0]?.report_date || new Date().toISOString(),
    prices: validPrices,
  };
}

// Fetch auction reports for specific sale barns by slug.
// If no slugs provided, defaults to the Nebraska Weekly Summary (1860).
export async function fetchNebraskaAuctions(slugs?: string[]): Promise<AuctionReport[]> {
  const { NEBRASKA_SALE_BARNS, getBarnsBySlugs } = await import("../sale-barns");

  const barns =
    slugs && slugs.length > 0
      ? getBarnsBySlugs(slugs)
      : [NEBRASKA_SALE_BARNS[0]]; // default to statewide summary

  const reports: AuctionReport[] = [];

  // Fetch all barns in parallel
  const fetches = barns.map(async (barn) => {
    const endpoint = `/reports/${barn.slug}`;
    const data = await fetchUSDA<any>(endpoint, 7200);
    return { barn, data };
  });

  const results = await Promise.all(fetches);

  for (const { barn, data } of results) {
    const records = Array.isArray(data) ? data : data?.results;

    if (!records || !Array.isArray(records) || records.length === 0) {
      continue;
    }

    const sales: AuctionSale[] = records.slice(0, 100).map((item: any) => ({
      reportDate: item.report_date || new Date().toISOString(),
      marketLocation: item.market_location || item.market || item.city || barn.city,
      headCount: parseInt(item.head_count || item.total_head || "0") || 0,
      avgPrice: parseFloat(item.wtd_avg || item.avg_price || item.weighted_average || "0") || 0,
      priceRange: {
        low: parseFloat(item.price_low || item.low_price || "0") || 0,
        high: parseFloat(item.price_high || item.high_price || "0") || 0,
      },
      weightRange: {
        low: parseFloat(item.weight_low || item.low_weight || item.avg_weight || "0") || 0,
        high: parseFloat(item.weight_high || item.high_weight || item.avg_weight || "0") || 0,
      },
      category: item.class || item.commodity || item.category || "Mixed",
      grade: item.grade || item.quality_grade || item.frame_size,
      trend: mapTrend(item.price_trend || item.trend || ""),
    }));

    const validSales = sales.filter((s) => s.avgPrice > 0);

    if (validSales.length > 0) {
      reports.push({
        reportDate: records[0]?.report_date || new Date().toISOString(),
        reportTitle: records[0]?.report_title || barn.name,
        marketName: barn.name,
        totalHeadCount: validSales.reduce((sum, s) => sum + s.headCount, 0),
        sales: validSales,
        commentary: records[0]?.market_comments || records[0]?.narrative,
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
