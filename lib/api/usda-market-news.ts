/**
 * USDA Market News API Client
 *
 * Uses the free public MPR Datamart API:
 * https://mpr.datamart.ams.usda.gov/services/v1.1/reports/{slug_id}
 *
 * Key Report Slug IDs for cattle:
 * - 2485: Nebraska Weekly Direct Slaughter Cattle - Negotiated Purchases (LM_CT158)
 * - 2484: Kansas Weekly Direct Slaughter Cattle - Negotiated (LM_CT157)
 * - 2483: TX-OK Weekly Direct Slaughter Cattle - Negotiated (LM_CT156)
 * - 2487: Iowa/Minnesota Weekly - Negotiated (LM_CT167)
 * - 2477: 5 Area Weekly Weighted Average Direct Slaughter Cattle (LM_CT150)
 * - 2471: Nebraska Weekly Direct - Formula, Grid and Contract (LM_CT141)
 * - 2474: 5 Area Weekly Direct - Formulated, Forward, and Negotiated Grid (LM_CT145)
 */

import {
  AuctionReport,
  AuctionSale,
  CashPrice,
  CashPriceReport,
} from "../types";

const MPR_API_BASE = "https://mpr.datamart.ams.usda.gov/services/v1.1";

// Slug IDs for the MPR Datamart API
export const REPORT_SLUG_IDS = {
  // Negotiated cash reports by region
  NEBRASKA_NEGOTIATED: 2485, // LM_CT158
  KANSAS_NEGOTIATED: 2484, // LM_CT157
  TX_OK_NEGOTIATED: 2483, // LM_CT156
  IOWA_MN_NEGOTIATED: 2487, // LM_CT167
  FIVE_AREA_WEIGHTED: 2477, // LM_CT150

  // Formula/Grid/Contract reports
  NEBRASKA_FORMULA: 2471, // LM_CT141
  FIVE_AREA_FORMULA: 2474, // LM_CT145
  KANSAS_FORMULA: 2470, // LM_CT140
  COLORADO_FORMULA: 2475, // LM_CT146
  IOWA_MN_FORMULA: 2476, // LM_CT147
};

// Map region slugs to their negotiated report slug IDs
export const REGION_TO_SLUG_ID: Record<string, number> = {
  nebraska: REPORT_SLUG_IDS.NEBRASKA_NEGOTIATED,
  kansas: REPORT_SLUG_IDS.KANSAS_NEGOTIATED,
  "texas-oklahoma": REPORT_SLUG_IDS.TX_OK_NEGOTIATED,
  "iowa-minnesota": REPORT_SLUG_IDS.IOWA_MN_NEGOTIATED,
  "5-area": REPORT_SLUG_IDS.FIVE_AREA_WEIGHTED,
};

// Map region slugs to their formula report slug IDs
export const REGION_TO_FORMULA_SLUG_ID: Record<string, number> = {
  nebraska: REPORT_SLUG_IDS.NEBRASKA_FORMULA,
  kansas: REPORT_SLUG_IDS.KANSAS_FORMULA,
  colorado: REPORT_SLUG_IDS.COLORADO_FORMULA,
  "iowa-minnesota": REPORT_SLUG_IDS.IOWA_MN_FORMULA,
  "5-area": REPORT_SLUG_IDS.FIVE_AREA_FORMULA,
};

interface MPRReportResponse {
  reportSection: string;
  reportSections: string[];
  stats: { "totalRows:": number; "returnedRows:": number };
  results: Record<string, string | null>[];
}

// Generic fetch from MPR Datamart - free public API, no key needed
async function fetchMPR(
  slugId: number,
  params?: string
): Promise<MPRReportResponse[] | MPRReportResponse | null> {
  const url = params
    ? `${MPR_API_BASE}/reports/${slugId}?${params}`
    : `${MPR_API_BASE}/reports/${slugId}`;

  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      console.error(
        `MPR Datamart error: ${response.status} ${response.statusText}`
      );
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error("MPR Datamart fetch error:", error);
    return null;
  }
}

// Parse comma-formatted numbers from USDA ("20,760" -> 20760)
function parseUSDANumber(val: string | null | undefined): number {
  if (!val) return 0;
  return parseFloat(val.replace(/,/g, "")) || 0;
}

// Fetch a negotiated cash report (Summary section gives trend + head counts)
export async function fetchNebraskaDirectSlaughter(): Promise<CashPriceReport | null> {
  // Fetch Nebraska negotiated report - Summary section
  const data = (await fetchMPR(
    REPORT_SLUG_IDS.NEBRASKA_NEGOTIATED
  )) as MPRReportResponse | null;

  if (!data || !data.results || data.results.length === 0) {
    return null;
  }

  const mostRecent = data.results[0];

  // The summary section has trend narrative and head counts but not individual prices.
  // We use this for the dashboard overview. The detail page will fetch allSections.
  const prices: CashPrice[] = [
    {
      reportDate: mostRecent.report_date || new Date().toISOString(),
      priceType: "negotiated",
      region: "Nebraska",
      headCount: parseUSDANumber(mostRecent.total_head_count),
      weightedAvgPrice: 0, // Summary doesn't have wtd avg; extracted from trend text
      priceRange: { low: 0, high: 0 },
      avgWeight: 0,
    },
  ];

  // Try to extract prices from the trend narrative text
  const trend = mostRecent.trend || "";
  const liveMatch = trend.match(
    /live purchases were.*?(?:from\s+)?(\d+\.?\d*)\s*(?:-\s*(\d+\.?\d*))?/i
  );
  const dressedMatch = trend.match(
    /dressed purchases were.*?(?:from\s+)?(\d+\.?\d*)\s*(?:-\s*(\d+\.?\d*))?/i
  );

  if (liveMatch) {
    const low = parseFloat(liveMatch[1]);
    const high = liveMatch[2] ? parseFloat(liveMatch[2]) : low;
    prices[0].weightedAvgPrice = (low + high) / 2;
    prices[0].priceRange = { low, high };
  }

  if (dressedMatch) {
    const dLow = parseFloat(dressedMatch[1]);
    const dHigh = dressedMatch[2] ? parseFloat(dressedMatch[2]) : dLow;
    prices[0].dressedBasis = (dLow + dHigh) / 2;
  }

  return {
    reportDate: mostRecent.report_date || new Date().toISOString(),
    prices: prices.filter((p) => p.headCount > 0),
  };
}

// Fetch 5-Area weighted average (for dashboard overview)
export async function fetch5AreaWeeklyPrices(): Promise<CashPriceReport | null> {
  const data = (await fetchMPR(
    REPORT_SLUG_IDS.FIVE_AREA_WEIGHTED
  )) as MPRReportResponse | null;

  if (!data || !data.results || data.results.length === 0) {
    return null;
  }

  const mostRecent = data.results[0];

  const prices: CashPrice[] = [
    {
      reportDate: mostRecent.report_date || new Date().toISOString(),
      priceType: "negotiated",
      region: "5-Area",
      headCount: parseUSDANumber(mostRecent.previous_week_head_count),
      weightedAvgPrice: 0,
      priceRange: { low: 0, high: 0 },
      avgWeight: 0,
    },
  ];

  return {
    reportDate: mostRecent.report_date || new Date().toISOString(),
    prices,
  };
}

// Fetch FULL detail report for a specific region slug ID (used by detail pages)
export async function fetchRegionDetailReport(
  slugId: number
): Promise<{
  summary: Record<string, string | null> | null;
  details: Record<string, string | null>[];
} | null> {
  const data = (await fetchMPR(slugId, "allSections=true")) as
    | MPRReportResponse[]
    | null;

  if (!data || !Array.isArray(data)) {
    return null;
  }

  const summarySection = data.find((s) => s.reportSection === "Summary");
  const detailSection = data.find((s) => s.reportSection === "Detail");

  return {
    summary:
      summarySection && summarySection.results.length > 0
        ? summarySection.results[0]
        : null,
    details: detailSection?.results || [],
  };
}

// Fetch multiple regions' summaries for the dashboard
export async function fetchAllRegionSummaries(): Promise<CashPriceReport | null> {
  const regionSlugs = [
    { slugId: REPORT_SLUG_IDS.NEBRASKA_NEGOTIATED, region: "Nebraska" },
    { slugId: REPORT_SLUG_IDS.KANSAS_NEGOTIATED, region: "Kansas" },
    { slugId: REPORT_SLUG_IDS.TX_OK_NEGOTIATED, region: "Texas-Oklahoma" },
    { slugId: REPORT_SLUG_IDS.IOWA_MN_NEGOTIATED, region: "Iowa-Minnesota" },
  ];

  const prices: CashPrice[] = [];
  let latestDate = "";

  // Fetch all regions in parallel
  const results = await Promise.allSettled(
    regionSlugs.map(async ({ slugId, region }) => {
      const data = (await fetchMPR(slugId)) as MPRReportResponse | null;
      if (!data || !data.results || data.results.length === 0) return null;

      const mostRecent = data.results[0];
      const trend = mostRecent.trend || "";

      // Extract prices from trend narrative
      const liveMatch = trend.match(
        /live purchases were.*?(?:from\s+)?(\d+\.?\d*)\s*(?:-\s*(\d+\.?\d*))?/i
      );
      const dressedMatch = trend.match(
        /dressed purchases were.*?(?:from\s+)?(\d+\.?\d*)\s*(?:-\s*(\d+\.?\d*))?/i
      );

      let wtdAvg = 0;
      let priceLow = 0;
      let priceHigh = 0;
      let dressedBasis: number | undefined;

      if (liveMatch) {
        priceLow = parseFloat(liveMatch[1]);
        priceHigh = liveMatch[2] ? parseFloat(liveMatch[2]) : priceLow;
        wtdAvg = (priceLow + priceHigh) / 2;
      }

      if (dressedMatch) {
        const dLow = parseFloat(dressedMatch[1]);
        const dHigh = dressedMatch[2] ? parseFloat(dressedMatch[2]) : dLow;
        dressedBasis = (dLow + dHigh) / 2;
      }

      return {
        reportDate: mostRecent.report_date || "",
        priceType: "negotiated" as const,
        region,
        headCount: parseUSDANumber(mostRecent.total_head_count),
        weightedAvgPrice: wtdAvg,
        priceRange: { low: priceLow, high: priceHigh },
        avgWeight: 0,
        dressedBasis,
      };
    })
  );

  for (const result of results) {
    if (result.status === "fulfilled" && result.value) {
      prices.push(result.value);
      if (result.value.reportDate > latestDate) {
        latestDate = result.value.reportDate;
      }
    }
  }

  // Also try to add formula data for Nebraska
  try {
    const formulaData = (await fetchMPR(
      REPORT_SLUG_IDS.NEBRASKA_FORMULA
    )) as MPRReportResponse | null;
    if (formulaData?.results?.[0]) {
      const r = formulaData.results[0];
      // Formula reports have a slightly different structure - just add basic info
      prices.push({
        reportDate: r.report_date || latestDate,
        priceType: "formula",
        region: "Nebraska",
        headCount: 0,
        weightedAvgPrice: 0,
        priceRange: { low: 0, high: 0 },
        avgWeight: 0,
      });
    }
  } catch {
    // Formula data is optional
  }

  if (prices.length === 0) return null;

  return {
    reportDate: latestDate || new Date().toISOString(),
    prices: prices.filter((p) => p.headCount > 0),
  };
}

// Nebraska Auction Market Reports - these are voluntary reports, not in MPR Datamart
// The Datamart only has mandatory (LMR) reports. Auction data uses demo data.
export async function fetchNebraskaAuctions(): Promise<AuctionReport[]> {
  // Nebraska auction markets are voluntary reports and not available
  // through the MPR Datamart API (which only has mandatory LMR reports).
  // We return empty to fall back to demo data.
  return [];
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
