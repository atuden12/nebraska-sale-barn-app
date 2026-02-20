/**
 * USDA NASS Quick Stats API - Slaughter + Inventory
 * https://quickstats.nass.usda.gov/api
 *
 * Key: statisticcat_desc must be "SLAUGHTERED" (not "SLAUGHTER")
 */

import { z } from "zod";
import { SlaughterData } from "../types";

const NASS_BASE = "https://quickstats.nass.usda.gov/api/api_GET";

// Zod schemas for NASS API response validation
const NassRowsSchema = z.array(z.record(z.any()));
const NassResponseSchema = z
  .object({ data: NassRowsSchema.optional(), error: z.any().optional() })
  .passthrough();

function getNassKey(): string {
  const key = process.env.USDA_NASS_API_KEY?.trim();
  if (!key) {
    console.warn("[v0] USDA_NASS_API_KEY not set or empty");
  }
  return key || "";
}

interface NASSQueryParams {
  source_desc?: string;
  commodity_desc?: string;
  statisticcat_desc?: string;
  unit_desc?: string;
  domain_desc?: string;
  agg_level_desc?: string;
  state_name?: string;
  freq_desc?: string;
  year?: string;
}

async function fetchNASS(params: NASSQueryParams): Promise<Record<string, any>[] | null> {
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
      `[v0] NASS fetch: ${params.statisticcat_desc} ${params.freq_desc || ""} ${params.state_name || "NATIONAL"} yr=${params.year} ts=${Date.now()}`
    );
    const response = await fetch(url, { cache: "no-store" });

    if (!response.ok) {
      const body = await response.text();
      console.error(`[v0] NASS error ${response.status}:`, body);
      return null;
    }

    const json = await response.json();
    const parsed = NassResponseSchema.safeParse(json);

    if (!parsed.success) {
      console.error("[v0] NASS schema mismatch:", parsed.error.message);
      return null;
    }

    const rows = parsed.data.data || [];
    console.log(`[v0] NASS success, records=${rows.length}`);
    return rows;
  } catch (error) {
    console.error("[v0] NASS fetch error:", error);
    return null;
  }
}

// Fetch cattle slaughter data from NASS
// IMPORTANT: statisticcat_desc = "SLAUGHTERED" (not "SLAUGHTER")
export async function fetchCattleSlaughter(): Promise<SlaughterData[]> {
  const currentYear = new Date().getFullYear();
  const prevYear = currentYear - 1;

  // Fetch both current year and prior year for YoY comparison
  const baseParams: NASSQueryParams = {
    source_desc: "SURVEY",
    commodity_desc: "CATTLE",
    statisticcat_desc: "SLAUGHTERED",
    unit_desc: "HEAD",
    agg_level_desc: "NATIONAL",
    domain_desc: "TOTAL",
    freq_desc: "WEEKLY",
  };

  const [currentData, priorData] = await Promise.all([
    fetchNASS({ ...baseParams, year: `${currentYear}` }),
    fetchNASS({ ...baseParams, year: `${prevYear}` }),
  ]);

  // If weekly doesn't work, try monthly
  let data = currentData;
  let priorYearData = priorData;

  if (!data || data.length === 0) {
    console.log("[v0] NASS weekly empty, trying monthly");
    const monthlyParams = { ...baseParams, freq_desc: "MONTHLY" };
    const [mCurrent, mPrior] = await Promise.all([
      fetchNASS({ ...monthlyParams, year: `${currentYear}` }),
      fetchNASS({ ...monthlyParams, year: `${prevYear}` }),
    ]);
    data = mCurrent;
    priorYearData = mPrior;
  }

  // Last resort: prior year monthly
  if (!data || data.length === 0) {
    console.log("[v0] NASS current year empty, trying previous year monthly");
    data = await fetchNASS({ ...baseParams, freq_desc: "MONTHLY", year: `${prevYear}` });
  }

  if (!data || !Array.isArray(data)) {
    return [];
  }

  // Filter valid rows (national, valid Value)
  const validRows = data.filter(
    (item) =>
      item.Value &&
      item.Value !== "(D)" &&
      item.Value !== "(NA)" &&
      (item.agg_level_desc === "NATIONAL" || !item.agg_level_desc)
  );

  // Aggregate class rows into weekly totals
  // Key: year-reference_period-week_ending
  const weeklyTotals = new Map<string, number>();
  const weekMetadata = new Map<string, any>();

  for (const row of validRows) {
    const weekKey = `${row.year}-${row.reference_period_desc || ""}-${row.week_ending || row.end_code || ""}`;
    const value = parseInt((row.Value || "0").replace(/,/g, "")) || 0;
    weeklyTotals.set(weekKey, (weeklyTotals.get(weekKey) || 0) + value);
    if (!weekMetadata.has(weekKey)) {
      weekMetadata.set(weekKey, row);
    }
  }

  // Build prior-year lookup
  const priorYearTotals = new Map<string, number>();
  if (priorYearData && Array.isArray(priorYearData)) {
    for (const row of priorYearData) {
      if (!row.Value || row.Value === "(D)" || row.Value === "(NA)") continue;
      const weekLabel = row.reference_period_desc || row.week_ending || "";
      const key = `${row.year}-${weekLabel}`;
      const value = parseInt((row.Value || "0").replace(/,/g, "")) || 0;
      priorYearTotals.set(key, (priorYearTotals.get(key) || 0) + value);
    }
  }

  // Sort entries by week ending descending
  const sortedEntries = Array.from(weeklyTotals.entries())
    .map(([key, total]) => ({
      key,
      total,
      meta: weekMetadata.get(key),
    }))
    .filter((e) => e.meta?.year === `${currentYear}` || e.meta?.year === currentYear)
    .sort((a, b) => {
      const dateA = new Date(a.meta?.week_ending || a.meta?.end_code || 0);
      const dateB = new Date(b.meta?.week_ending || b.meta?.end_code || 0);
      return dateB.getTime() - dateA.getTime();
    })
    .slice(0, 10);

  return sortedEntries.map((entry, index) => {
    const currentValue = entry.total;
    const prevEntry = sortedEntries[index + 1];
    const prevWeekValue = prevEntry ? prevEntry.total : currentValue;

    // Look up prior year by week label
    const weekLabel = entry.meta?.reference_period_desc || "";
    const priorYearKey = `${prevYear}-${weekLabel}`;
    const prevYearValue = priorYearTotals.get(priorYearKey) || currentValue;

    return {
      weekEnding: entry.meta?.week_ending || entry.meta?.end_code || "",
      cattleSlaughter: currentValue,
      previousWeek: prevWeekValue,
      previousYear: prevYearValue,
      percentChangeWeek:
        prevWeekValue > 0 ? ((currentValue - prevWeekValue) / prevWeekValue) * 100 : 0,
      percentChangeYear:
        prevYearValue > 0 ? ((currentValue - prevYearValue) / prevYearValue) * 100 : 0,
      region: "National",
    };
  });
}

// Fetch cattle inventory from NASS
export async function fetchCattleInventory(): Promise<Record<string, any>[]> {
  const currentYear = new Date().getFullYear();

  let data = await fetchNASS({
    source_desc: "SURVEY",
    commodity_desc: "CATTLE",
    statisticcat_desc: "INVENTORY",
    unit_desc: "HEAD",
    agg_level_desc: "STATE",
    state_name: "NEBRASKA",
    freq_desc: "ANNUAL",
    year: `${currentYear}`,
  });

  // Fallback to previous year
  if (!data || data.length === 0) {
    data = await fetchNASS({
      source_desc: "SURVEY",
      commodity_desc: "CATTLE",
      statisticcat_desc: "INVENTORY",
      unit_desc: "HEAD",
      agg_level_desc: "STATE",
      state_name: "NEBRASKA",
      freq_desc: "ANNUAL",
      year: `${currentYear - 1}`,
    });
  }

  return data || [];
}
