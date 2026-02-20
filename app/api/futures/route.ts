import { NextResponse } from "next/server";
import { fetchFuturesData } from "@/lib/api/futures";
import { FuturesData } from "@/lib/types";

export const revalidate = 900; // 15 minutes

export async function GET() {
  try {
    const futuresResult = await fetchFuturesData();

    return NextResponse.json({
      data: futuresResult.data,
      error: null,
      lastUpdated: new Date().toISOString(),
      source: futuresResult.source,
    });
  } catch (error) {
    console.error("Futures API error:", error);

    // Return demo/cached data on error
    const demoData = getDemoFuturesData();
    return NextResponse.json(
      {
        data: demoData,
        error: "Using cached data - live feed unavailable",
        lastUpdated: new Date().toISOString(),
        source: "demo",
      },
      { status: 200 }
    );
  }
}

function getDemoFuturesData(): FuturesData {
  const now = new Date();
  const year = now.getFullYear() % 100;

  return {
    liveCattle: [
      {
        symbol: `LEG${year}`,
        name: "Live Cattle",
        contractMonth: `February 20${year}`,
        lastPrice: 185.575,
        change: 0.825,
        changePercent: 0.45,
        open: 185.0,
        high: 186.25,
        low: 184.75,
        volume: 24532,
        lastUpdated: new Date().toISOString(),
      },
    ],
    feederCattle: [
      {
        symbol: `GFF${year}`,
        name: "Feeder Cattle",
        contractMonth: `January 20${year}`,
        lastPrice: 252.75,
        change: 1.125,
        changePercent: 0.45,
        open: 251.75,
        high: 253.5,
        low: 251.25,
        volume: 8432,
        lastUpdated: new Date().toISOString(),
      },
    ],
    lastUpdated: new Date().toISOString(),
  };
}
