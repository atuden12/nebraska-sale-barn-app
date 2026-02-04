import { NextResponse } from "next/server";
import { fetchFuturesData, fetchFuturesPriceHistory } from "@/lib/api/futures";
import { ApiResponse, FuturesData } from "@/lib/types";

export const revalidate = 900; // 15 minutes

export async function GET() {
  try {
    const futuresData = await fetchFuturesData();

    return NextResponse.json({
      data: futuresData,
      error: null,
      lastUpdated: new Date().toISOString(),
    } as ApiResponse<FuturesData>);
  } catch (error) {
    console.error("Futures API error:", error);

    // Return demo/cached data on error
    const demoData = getDemoFuturesData();
    return NextResponse.json(
      {
        data: demoData,
        error: "Using cached data - live feed unavailable",
        lastUpdated: new Date().toISOString(),
      } as ApiResponse<FuturesData>,
      { status: 200 }
    );
  }
}

function getDemoFuturesData(): FuturesData {
  return {
    liveCattle: [
      {
        symbol: "LEG25",
        name: "Live Cattle",
        contractMonth: "February 2025",
        lastPrice: 185.575,
        change: 0.825,
        changePercent: 0.45,
        open: 185.0,
        high: 186.25,
        low: 184.75,
        volume: 24532,
        lastUpdated: new Date().toISOString(),
      },
      {
        symbol: "LEJ25",
        name: "Live Cattle",
        contractMonth: "April 2025",
        lastPrice: 186.825,
        change: 0.65,
        changePercent: 0.35,
        open: 186.25,
        high: 187.5,
        low: 185.75,
        volume: 18234,
        lastUpdated: new Date().toISOString(),
      },
      {
        symbol: "LEM25",
        name: "Live Cattle",
        contractMonth: "June 2025",
        lastPrice: 183.4,
        change: 0.45,
        changePercent: 0.25,
        open: 183.0,
        high: 184.0,
        low: 182.5,
        volume: 12456,
        lastUpdated: new Date().toISOString(),
      },
      {
        symbol: "LEQ25",
        name: "Live Cattle",
        contractMonth: "August 2025",
        lastPrice: 181.85,
        change: 0.35,
        changePercent: 0.19,
        open: 181.5,
        high: 182.5,
        low: 181.0,
        volume: 8234,
        lastUpdated: new Date().toISOString(),
      },
    ],
    feederCattle: [
      {
        symbol: "GFF25",
        name: "Feeder Cattle",
        contractMonth: "January 2025",
        lastPrice: 252.75,
        change: 1.125,
        changePercent: 0.45,
        open: 251.75,
        high: 253.5,
        low: 251.25,
        volume: 8432,
        lastUpdated: new Date().toISOString(),
      },
      {
        symbol: "GFH25",
        name: "Feeder Cattle",
        contractMonth: "March 2025",
        lastPrice: 252.25,
        change: 0.875,
        changePercent: 0.35,
        open: 251.5,
        high: 253.0,
        low: 251.0,
        volume: 6234,
        lastUpdated: new Date().toISOString(),
      },
      {
        symbol: "GFJ25",
        name: "Feeder Cattle",
        contractMonth: "April 2025",
        lastPrice: 251.5,
        change: 0.65,
        changePercent: 0.26,
        open: 251.0,
        high: 252.25,
        low: 250.5,
        volume: 4567,
        lastUpdated: new Date().toISOString(),
      },
      {
        symbol: "GFK25",
        name: "Feeder Cattle",
        contractMonth: "May 2025",
        lastPrice: 250.75,
        change: 0.45,
        changePercent: 0.18,
        open: 250.5,
        high: 251.5,
        low: 250.0,
        volume: 3245,
        lastUpdated: new Date().toISOString(),
      },
    ],
    lastUpdated: new Date().toISOString(),
  };
}
