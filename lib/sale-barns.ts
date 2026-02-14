import { SaleBarn } from "./types";

/**
 * Nebraska Sale Barns with USDA MARS API report slugs.
 * Slug IDs correspond to mymarketnews.ams.usda.gov report numbers.
 *
 * These are individual auction reports filed by USDA Market News reporters.
 * The "1860" slug is the aggregate Nebraska Weekly Summary covering all markets.
 */

export const NEBRASKA_SALE_BARNS: SaleBarn[] = [
  {
    slug: "1860",
    name: "Nebraska Weekly Summary",
    city: "Statewide",
    state: "NE",
    saleDay: "Various",
    reportDay: "Friday",
  },
  {
    slug: "1836",
    name: "Bassett Livestock Auction",
    city: "Bassett",
    state: "NE",
    saleDay: "Wednesday",
    reportDay: "Wednesday",
  },
  {
    slug: "1851",
    name: "Burwell Livestock Market",
    city: "Burwell",
    state: "NE",
    saleDay: "Friday",
    reportDay: "Friday",
  },
  {
    slug: "1838",
    name: "Crawford Livestock Market",
    city: "Crawford",
    state: "NE",
    saleDay: "Friday",
    reportDay: "Friday",
  },
  {
    slug: "1852",
    name: "Ericson Livestock Market",
    city: "Ericson",
    state: "NE",
    saleDay: "Saturday",
    reportDay: "Saturday",
  },
  {
    slug: "1839",
    name: "Huss Livestock Market",
    city: "Kearney",
    state: "NE",
    saleDay: "Wednesday",
    reportDay: "Wednesday",
  },
  {
    slug: "1853",
    name: "Imperial Auction Market",
    city: "Imperial",
    state: "NE",
    saleDay: "Tuesday",
    reportDay: "Tuesday",
  },
  {
    slug: "1854",
    name: "Lexington Livestock Market",
    city: "Lexington",
    state: "NE",
    saleDay: "Friday",
    reportDay: "Friday",
  },
  {
    slug: "1850",
    name: "Ogallala Livestock Auction",
    city: "Ogallala",
    state: "NE",
    saleDay: "Thursday",
    reportDay: "Thursday",
  },
  {
    slug: "1855",
    name: "Sheridan Livestock Auction",
    city: "Rushville",
    state: "NE",
    saleDay: "Wednesday",
    reportDay: "Wednesday",
  },
  {
    slug: "1856",
    name: "Tri-State Livestock Auction",
    city: "McCook",
    state: "NE",
    saleDay: "Monday",
    reportDay: "Monday",
  },
  {
    slug: "1857",
    name: "Valentine Livestock Auction",
    city: "Valentine",
    state: "NE",
    saleDay: "Thursday",
    reportDay: "Thursday",
  },
];

/** Get a barn by its slug */
export function getBarnBySlug(slug: string): SaleBarn | undefined {
  return NEBRASKA_SALE_BARNS.find((b) => b.slug === slug);
}

/** Get barns by an array of slugs; returns all if slugs is empty */
export function getBarnsBySlugs(slugs: string[]): SaleBarn[] {
  if (!slugs || slugs.length === 0) return NEBRASKA_SALE_BARNS;
  return NEBRASKA_SALE_BARNS.filter((b) => slugs.includes(b.slug));
}
