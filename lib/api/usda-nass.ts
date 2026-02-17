/**
 * USDA NASS Quick Stats API + LMPR Slaughter via MARS
 * NASS: https://quickstats.nass.usda.gov/api
 * MARS: https://marsapi.ams.usda.gov/services/v1.2
 */

import { SlaughterData } from "../types";

const NASS_BASE = "https://quickstats.nass.usda.gov/api/api_GET";
const MARS_BASE = "https://marsapi.ams.usda.gov/services/v1.2";

function getNassKey(): string {
  const key = process.env.USDA_NASS_API_KEY?.trim();
  if (!key) {
    console.warn("[v0] USDA_NASS_API_KEY not set or empty");
  }
  return key || "";
}

function getMarsKey(): string {
  const key = process.env.USDA_MARKET_NEWS_API_KEY?.trim();
  return key || "";
}

// --- NASS Quick Stats ---

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
  const apiKey = getNassKey();

  if (!apiKey) {
    console.error("[v0] NASS API key required but missing");
    return null;
  }

  const queryParams = new URLSearchParams({
    key: apiKey,
    format: "JSON",
    ...params,
  });

  try {
    const url = `${NASS_BASE}?${queryParams.toString()}`;
    console.log(
      `[v0] NASS fetch: ${params.statisticcat_desc} ${params.state_name || "NATIONAL"} key=${apiKey.substring(0, 4)}... ts=${Date.now()}`
    );
    const response = await fetch(url, { cache: "no-store" });

    if (!response.ok) {
      const body = await response.text();
      console.error(`[v0] NASS error ${response.status}:`, body);
      return null;
    }

    const json = await response.json();
    console.log(
      `[v0] NASS success, records=${Array.isArray(json.data) ? json.data.length : "unknown"}`
    );
    return json.data || json;
  } catch (error) {
    console.error("[v0] NASS fetch error:", error);
    return null;
  }
}

// Fetch cattle slaughter data from NASS
export async function fetchCattleSlaughter(): Promise<SlaughterData[]> {
  const currentYear = new Date().getFullYear();

  // Try Nebraska-specific first
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

  // Fallback to national
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
      previousYear: currentValue,
      percentChangeWeek:
        prevValue > 0 ? ((currentValue - prevValue) / prevValue) * 100 : 0,
      percentChangeYear: 0,
      region: item.state_name || item.agg_level_desc || "National",
    };
  });
}

// Fetch cattle inventory from NASS
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

// --- LMPR via MARS API (slug_id 3237 = Wyoming-Nebraska Direct Cattle) ---

export async function fetchLMPRSlaughter(): Promise<SlaughterData[]> {
  const apiKey = getMarsKey();
  const url = `${MARS_BASE}/reports/3237`;

  const headers: HeadersInit = { Accept: "application/json" };
  if (apiKey) {
    const encoded = Buffer.from(`${apiKey}:`).toString("base64");
    headers["Authorization"] = `Basic ${encoded}`;
  }

  try {
    console.log(`[v0] LMPR fetch: ${url} auth=${!!apiKey} ts=${Date.now()}`);
    const response = await fetch(url, { headers, cache: "no-store" });

    if (!response.ok) {
      const body = await response.text();
      console.error(`[v0] LMPR error ${response.status}:`, body);
      return [];
    }

    const data = await response.json();
    console.log(`[v0] LMPR success, records=${Array.isArray(data) ? data.length : "obj"}`);

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
        region: item.region || item.market_location_name || "National",
      };
    });
  } catch (error) {
    console.error("[v0] LMPR fetch error:", error);
    return [];
  }
}
