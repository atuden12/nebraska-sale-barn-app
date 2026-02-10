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
// This often has more current slaughter data
export async function fetchLMPRSlaughter(): Promise<SlaughterData[]> {
  // LMPR endpoint for weekly slaughter summary
  const url = "https://marsapi.ams.usda.gov/services/v1.2/reports/lm_ct100";

  try {
    const apiKey = process.env.USDA_MARKET_NEWS_API_KEY;
    const headers: HeadersInit = {
      Accept: "application/json",
    };

    if (apiKey) {
      headers["Authorization"] = apiKey;
    }

    const response = await fetch(url, {
      headers,
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      return [];
    }

    return data.slice(0, 8).map((item: any, index: number) => {
      const currentValue =
        parseInt(item.current_week_slaughter || item.head_count) || 0;
      const prevWeek =
        parseInt(item.previous_week_slaughter || item.prev_week) || currentValue;
      const prevYear =
        parseInt(item.year_ago_slaughter || item.prev_year) || currentValue;

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
