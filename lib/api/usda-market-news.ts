/**
 * USDA Market News API Client
 *
 * Documentation: https://mymarketnews.ams.usda.gov/mymarketnews-api
 *
 * Key Report Slugs for Nebraska Cattle:
 * - LM_CT155: Nebraska Weekly Direct Slaughter Cattle
 * - LM_CT169: 5-Area Weekly Weighted Average Direct Slaughter Cattle
 * - LM_CT150: National Weekly Direct Slaughter Cattle
 * - LM_XB459: Nebraska Auction Prices
 *
 * Auction Report Slugs:
 * - Various Nebraska auction markets have individual slugs
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

// Nebraska Weekly Direct Slaughter Cattle Report (LM_CT155)
export async function fetchNebraskaDirectSlaughter(): Promise<CashPriceReport | null> {
  const endpoint = "/reports/lm_ct155";
  const data = await fetchUSDA<any[]>(endpoint, 3600);

  if (!data || !Array.isArray(data)) {
    return null;
  }

  // Transform USDA data to our format
  const prices: CashPrice[] = data.slice(0, 20).map((item) => ({
    reportDate: item.report_date || item.published_date || new Date().toISOString(),
    priceType: mapPriceType(item.price_type || item.purchase_type),
    region: "Nebraska",
    headCount: parseInt(item.head_count || item.total_head) || 0,
    weightedAvgPrice: parseFloat(item.wtd_avg_price || item.weighted_average) || 0,
    priceRange: {
      low: parseFloat(item.price_low || item.low_price) || 0,
      high: parseFloat(item.price_high || item.high_price) || 0,
    },
    avgWeight: parseFloat(item.avg_weight || item.average_weight) || 0,
    dressedBasis: parseFloat(item.dressed_basis) || undefined,
  }));

  return {
    reportDate: data[0]?.report_date || new Date().toISOString(),
    prices: prices.filter((p) => p.weightedAvgPrice > 0),
  };
}

// 5-Area Weekly Weighted Average (LM_CT169)
export async function fetch5AreaWeeklyPrices(): Promise<CashPriceReport | null> {
  const endpoint = "/reports/lm_ct169";
  const data = await fetchUSDA<any[]>(endpoint, 3600);

  if (!data || !Array.isArray(data)) {
    return null;
  }

  const prices: CashPrice[] = data.slice(0, 30).map((item) => ({
    reportDate: item.report_date || new Date().toISOString(),
    priceType: mapPriceType(item.purchase_type || item.price_type),
    region: item.region || "5-Area",
    headCount: parseInt(item.head_count) || 0,
    weightedAvgPrice: parseFloat(item.wtd_avg) || parseFloat(item.weighted_average) || 0,
    priceRange: {
      low: parseFloat(item.price_low) || 0,
      high: parseFloat(item.price_high) || 0,
    },
    avgWeight: parseFloat(item.avg_weight) || 0,
  }));

  return {
    reportDate: data[0]?.report_date || new Date().toISOString(),
    prices: prices.filter((p) => p.weightedAvgPrice > 0),
  };
}

// Nebraska Auction Market Reports
export async function fetchNebraskaAuctions(): Promise<AuctionReport[]> {
  // Nebraska auction markets - we'll try multiple report slugs
  const auctionSlugs = [
    "lm_ct758", // Nebraska Auction Summary
    "lm_ct712", // North Central Nebraska
  ];

  const reports: AuctionReport[] = [];

  for (const slug of auctionSlugs) {
    const endpoint = `/reports/${slug}`;
    const data = await fetchUSDA<any[]>(endpoint, 7200); // 2-hour cache for auctions

    if (data && Array.isArray(data) && data.length > 0) {
      const sales: AuctionSale[] = data.slice(0, 50).map((item) => ({
        reportDate: item.report_date || new Date().toISOString(),
        marketLocation: item.market_location || item.market || "Nebraska",
        headCount: parseInt(item.head_count || item.total_head) || 0,
        avgPrice: parseFloat(item.avg_price || item.weighted_average) || 0,
        priceRange: {
          low: parseFloat(item.price_low || item.low) || 0,
          high: parseFloat(item.price_high || item.high) || 0,
        },
        weightRange: {
          low: parseFloat(item.weight_low || item.low_weight) || 0,
          high: parseFloat(item.weight_high || item.high_weight) || 0,
        },
        category: item.class || item.category || "Mixed",
        grade: item.grade || item.quality_grade,
        trend: mapTrend(item.price_trend || item.trend),
      }));

      if (sales.length > 0) {
        reports.push({
          reportDate: data[0]?.report_date || new Date().toISOString(),
          reportTitle: data[0]?.report_title || `Nebraska Auction (${slug})`,
          marketName: data[0]?.market_location || "Nebraska",
          totalHeadCount: sales.reduce((sum, s) => sum + s.headCount, 0),
          sales: sales.filter((s) => s.avgPrice > 0),
          commentary: data[0]?.market_comments,
        });
      }
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
