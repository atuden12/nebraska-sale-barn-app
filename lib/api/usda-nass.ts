/**
 * USDA NASS Quick Stats API Client
 *
 * Documentation: https://quickstats.nass.usda.gov/api
 *
 * This API provides historical and current data on:
 * - Cattle inventory
 * - Slaughter numbers
 * - Prices received
 * - Production statistics
 */

import { SlaughterData } from "../types";

const NASS_API_BASE = "https://quickstats.nass.usda.gov/api/api_GET";

function getApiKey(): string {
  return process.env.USDA_NASS_API_KEY || "";
}

interface NASSQueryParams {
  source_desc?: string;
  sector_desc?: string;
  group_desc?: string;
  commodity_desc?: string;
  statisticcat_desc?: string;
  unit_desc?: string;
  domain_desc?: string;
  agg_level_desc?: string;
  state_name?: string;
  freq_desc?: string;
  year?: string;
  format?: string;
}

async function fetchNASS<T>(params: NASSQueryParams): Promise<T | null> {
  const apiKey = getApiKey();

  if (!apiKey) {
    console.error("NASS API key required");
    return null;
  }

  const queryParams = new URLSearchParams({
    key: apiKey,
    format: "JSON",
    ...params,
  });

  try {
    const response = await fetch(`${NASS_API_BASE}?${queryParams.toString()}`, {
      next: { revalidate: 86400 }, // Daily cache for NASS data
    });

    if (!response.ok) {
      console.error(`NASS API error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    return data.data || data;
  } catch (error) {
    console.error("NASS API fetch error:", error);
    return null;
  }
}

// Fetch cattle slaughter data
export async function fetchCattleSlaughter(): Promise<SlaughterData[]> {
  const currentYear = new Date().getFullYear();

  // Try to fetch Nebraska-specific data first
  let data = await fetchNASS<any[]>({
    source_desc: "SURVEY",
    sector_desc: "ANIMALS & PRODUCTS",
    group_desc: "LIVESTOCK",
    commodity_desc: "CATTLE",
    statisticcat_desc: "SLAUGHTER",
    unit_desc: "HEAD",
    domain_desc: "TOTAL",
    agg_level_desc: "STATE",
    state_name: "NEBRASKA",
    freq_desc: "WEEKLY",
    year: `${currentYear}`,
  });

  // If no state data, try national
  if (!data || data.length === 0) {
    data = await fetchNASS<any[]>({
      source_desc: "SURVEY",
      sector_desc: "ANIMALS & PRODUCTS",
      group_desc: "LIVESTOCK",
      commodity_desc: "CATTLE",
      statisticcat_desc: "SLAUGHTER",
      unit_desc: "HEAD",
      domain_desc: "TOTAL",
      agg_level_desc: "NATIONAL",
      freq_desc: "WEEKLY",
      year: `${currentYear}`,
    });
  }

  if (!data || !Array.isArray(data)) {
    return [];
  }

  // Sort by date and take most recent
  const sorted = data
    .filter((item) => item.Value && item.Value !== "(D)")
    .sort((a, b) => {
      const dateA = new Date(a.week_ending || a.end_code || 0);
      const dateB = new Date(b.week_ending || b.end_code || 0);
      return dateB.getTime() - dateA.getTime();
    })
    .slice(0, 10);

  return sorted.map((item, index) => {
    const currentValue = parseInt(item.Value.replace(/,/g, "")) || 0;
    const prevItem = sorted[index + 1];
    const prevValue = prevItem
      ? parseInt(prevItem.Value.replace(/,/g, "")) || currentValue
      : currentValue;

    return {
      weekEnding: item.week_ending || item.end_code || "",
      cattleSlaughter: currentValue,
      previousWeek: prevValue,
      previousYear: currentValue, // Would need another query for year-ago
      percentChangeWeek:
        prevValue > 0 ? ((currentValue - prevValue) / prevValue) * 100 : 0,
      percentChangeYear: 0,
      region: item.state_name || item.agg_level_desc || "National",
    };
  });
}

// Fetch fed cattle inventory
export async function fetchCattleInventory(): Promise<any[]> {
  const currentYear = new Date().getFullYear();

  const data = await fetchNASS<any[]>({
    source_desc: "SURVEY",
    sector_desc: "ANIMALS & PRODUCTS",
    group_desc: "LIVESTOCK",
    commodity_desc: "CATTLE",
    statisticcat_desc: "INVENTORY",
    unit_desc: "HEAD",
    agg_level_desc: "STATE",
    state_name: "NEBRASKA",
    year: `${currentYear}`,
  });

  return data || [];
}

// Alternative: Fetch from USDA LMPR (Livestock Mandatory Price Reporting)
// LM_CT100 = 5 Area Daily Weighted Average Direct Slaughter Cattle - Negotiated
export async function fetchLMPRSlaughter(): Promise<SlaughterData[]> {
  const url = "https://marsapi.ams.usda.gov/services/v1.2/reports/lm_ct100";

  try {
    const apiKey = process.env.USDA_MARKET_NEWS_API_KEY;
    const headers: HeadersInit = {
      Accept: "application/json",
    };

    if (apiKey) {
      const encoded = Buffer.from(`${apiKey}:`).toString("base64");
      headers["Authorization"] = `Basic ${encoded}`;
    }

    const response = await fetch(url, {
      headers,
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      console.log("[v0] LMPR (LM_CT100): HTTP error", response.status, response.statusText);
      return [];
    }

    const rawData = await response.json();
    const data = Array.isArray(rawData) ? rawData : rawData?.results;

    if (!data || !Array.isArray(data) || data.length === 0) {
      console.log("[v0] LMPR (LM_CT100): No results. Raw type:", typeof rawData, "keys:", rawData ? Object.keys(rawData) : "null");
      return [];
    }

    console.log("[v0] LMPR (LM_CT100): Got", data.length, "records. First record keys:", Object.keys(data[0]));
    console.log("[v0] LMPR sample record:", JSON.stringify(data[0]).substring(0, 500));

    return data.slice(0, 8).map((item: any, index: number) => {
      const currentValue =
        parseInt(item.current_week_slaughter || item.head_count || item.total_head || "0") || 0;
      const prevWeek =
        parseInt(item.previous_week_slaughter || item.prev_week || "0") || currentValue;
      const prevYear =
        parseInt(item.year_ago_slaughter || item.prev_year || "0") || currentValue;

      return {
        weekEnding: item.week_ending || item.report_date || "",
        cattleSlaughter: currentValue,
        previousWeek: prevWeek,
        previousYear: prevYear,
        percentChangeWeek:
          prevWeek > 0 ? ((currentValue - prevWeek) / prevWeek) * 100 : 0,
        percentChangeYear:
          prevYear > 0 ? ((currentValue - prevYear) / prevYear) * 100 : 0,
        region: item.region || "National",
      };
    });
  } catch (error) {
    console.error("LMPR slaughter fetch error:", error);
    return [];
  }
}
