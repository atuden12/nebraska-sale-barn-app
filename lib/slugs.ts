/**
 * Slug utilities for region and market name URL encoding/decoding
 */

// Convert a display name to a URL-safe slug
export function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[&]/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Convert a slug back to a display-friendly name
export function fromSlug(slug: string): string {
  return slug
    .replace(/-/g, " ")
    .replace(/\band\b/g, "&")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// Known region mappings for reliable lookups
export const REGION_MAP: Record<string, string> = {
  nebraska: "Nebraska",
  colorado: "Colorado",
  "iowa-minnesota": "Iowa-Minnesota",
  "5-area": "5-Area",
  kansas: "Kansas",
  "texas-oklahoma": "Texas-Oklahoma",
};

// Known MPR Datamart slug IDs by region (negotiated cash reports)
export const REGION_REPORT_MPR_SLUG: Record<string, number> = {
  nebraska: 2485, // LM_CT158
  kansas: 2484, // LM_CT157
  "texas-oklahoma": 2483, // LM_CT156
  "iowa-minnesota": 2487, // LM_CT167
  colorado: 2486, // LM_CT166
  "5-area": 2477, // LM_CT150
};

// Known auction market mappings
export const MARKET_MAP: Record<string, string> = {
  "ogallala-livestock-auction": "Ogallala Livestock Auction",
  "valentine-livestock-auction": "Valentine Livestock Auction",
  "alliance-livestock-auction": "Alliance Livestock Auction",
  "gordon-livestock-auction": "Gordon Livestock Auction",
  "burwell-livestock-market": "Burwell Livestock Market",
  "north-platte-livestock-auction": "North Platte Livestock Auction",
};

// Get the display name for a region slug, with fallback
export function getRegionName(slug: string): string {
  return REGION_MAP[slug] || fromSlug(slug);
}

// Get the display name for a market slug, with fallback
export function getMarketName(slug: string): string {
  return MARKET_MAP[slug] || fromSlug(slug);
}

// Get the USDA report URL for a region (links to MPR Datamart)
export function getUSDAReportUrl(regionSlug: string): string {
  const mprSlugId = REGION_REPORT_MPR_SLUG[regionSlug];
  if (mprSlugId) {
    return `https://mpr.datamart.ams.usda.gov/services/v1.1/reports/${mprSlugId}`;
  }
  return "https://mpr.datamart.ams.usda.gov/";
}

// Get the USDA auction report URL
export function getUSDAauctionReportUrl(): string {
  return "https://mymarketnews.ams.usda.gov/";
}
