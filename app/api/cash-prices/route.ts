import { NextResponse } from "next/server";
import {
  fetchNebraskaDirectSlaughter,
  fetch5AreaWeeklyPrices,
} from "@/lib/api/usda-market-news";
import { ApiResponse, CashPriceReport, CashPrice } from "@/lib/types";

export const revalidate = 3600; // 1 hour

export async function GET() {
  try {
    // Fetch Nebraska-specific data first
    let priceReport = await fetchNebraskaDirectSlaughter();

    // If no Nebraska data, try 5-area
    if (!priceReport || priceReport.prices.length === 0) {
      priceReport = await fetch5AreaWeeklyPrices();
    }

    // If still no data, return demo data
    if (!priceReport || priceReport.prices.length === 0) {
      console.log("[v0] Cash prices: Falling back to DEMO data");
      const demoData = getDemoCashPriceData();
      return NextResponse.json({
        data: demoData,
        error: "Using demo data - live feed unavailable",
        lastUpdated: new Date().toISOString(),
      } as ApiResponse<CashPriceReport>);
    }

    console.log("[v0] Cash prices: Returning LIVE data with", priceReport.prices.length, "prices");
    return NextResponse.json({
      data: priceReport,
      error: null,
      lastUpdated: new Date().toISOString(),
    } as ApiResponse<CashPriceReport>);
  } catch (error) {
    console.error("Cash prices API error:", error);
    return NextResponse.json(
      {
        data: getDemoCashPriceData(),
        error: "Using cached data - live feed unavailable",
        lastUpdated: new Date().toISOString(),
      } as ApiResponse<CashPriceReport>,
      { status: 200 }
    );
  }
}

// Demo data when API is unavailable
function getDemoCashPriceData(): CashPriceReport {
  const today = new Date();
  const lastFriday = new Date(today);
  lastFriday.setDate(today.getDate() - ((today.getDay() + 2) % 7));

  const prices: CashPrice[] = [
    // Negotiated prices
    {
      reportDate: lastFriday.toISOString(),
      priceType: "negotiated",
      region: "Nebraska",
      headCount: 42500,
      weightedAvgPrice: 186.25,
      priceRange: { low: 184.0, high: 188.5 },
      avgWeight: 1425,
      dressedBasis: 294.5,
    },
    {
      reportDate: lastFriday.toISOString(),
      priceType: "negotiated",
      region: "Colorado",
      headCount: 18200,
      weightedAvgPrice: 185.75,
      priceRange: { low: 183.5, high: 188.0 },
      avgWeight: 1415,
      dressedBasis: 293.75,
    },
    {
      reportDate: lastFriday.toISOString(),
      priceType: "negotiated",
      region: "Iowa-Minnesota",
      headCount: 15800,
      weightedAvgPrice: 186.5,
      priceRange: { low: 184.5, high: 188.5 },
      avgWeight: 1430,
      dressedBasis: 295.0,
    },

    // Formula prices
    {
      reportDate: lastFriday.toISOString(),
      priceType: "formula",
      region: "Nebraska",
      headCount: 156000,
      weightedAvgPrice: 293.85,
      priceRange: { low: 288.0, high: 298.0 },
      avgWeight: 1435,
    },
    {
      reportDate: lastFriday.toISOString(),
      priceType: "formula",
      region: "Colorado",
      headCount: 78500,
      weightedAvgPrice: 292.5,
      priceRange: { low: 287.0, high: 297.0 },
      avgWeight: 1428,
    },

    // Forward contracts
    {
      reportDate: lastFriday.toISOString(),
      priceType: "forward",
      region: "5-Area",
      headCount: 32000,
      weightedAvgPrice: 188.5,
      priceRange: { low: 185.0, high: 192.0 },
      avgWeight: 1400,
    },

    // Negotiated grid
    {
      reportDate: lastFriday.toISOString(),
      priceType: "negotiated_grid",
      region: "Nebraska",
      headCount: 28500,
      weightedAvgPrice: 295.25,
      priceRange: { low: 290.0, high: 300.5 },
      avgWeight: 1440,
    },
  ];

  return {
    reportDate: lastFriday.toISOString(),
    prices,
  };
}
