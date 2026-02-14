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
  texas: "Texas",
};

// Known USDA report slugs by region
export const REGION_REPORT_SLUGS: Record<string, string> = {
  nebraska: "lm_ct155",
  colorado: "lm_ct155",
  "iowa-minnesota": "lm_ct155",
  "5-area": "lm_ct169",
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

// Get the USDA report URL for a region
export function getUSDAReportUrl(regionSlug: string): string {
  const reportSlug = REGION_REPORT_SLUGS[regionSlug] || "lm_ct155";
  return `https://www.ams.usda.gov/mnreports/${reportSlug}.txt`;
}

// Get the USDA auction report URL
export function getUSDAauctionReportUrl(): string {
  return "https://www.ams.usda.gov/mnreports/lm_ct758.txt";
}
