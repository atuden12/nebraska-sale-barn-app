import { NextRequest, NextResponse } from "next/server";
import { fetchNebraskaAuctions } from "@/lib/api/usda-market-news";
import { ApiResponse, AuctionReport } from "@/lib/types";

export const revalidate = 7200; // 2 hours

export async function GET(request: NextRequest) {
  try {
    // Accept ?barns=1860,1850,1857 query param
    const barnsParam = request.nextUrl.searchParams.get("barns");
    const slugs = barnsParam
      ? barnsParam.split(",").map((s) => s.trim()).filter(Boolean)
      : undefined;

    const reports = await fetchNebraskaAuctions(slugs);

    // If no real data, return demo data
    if (!reports || reports.length === 0) {
      const demoData = getDemoAuctionData();
      return NextResponse.json({
        data: demoData,
        error: "Using demo data - live feed unavailable",
        lastUpdated: new Date().toISOString(),
      } as ApiResponse<AuctionReport[]>);
    }

    return NextResponse.json({
      data: reports,
      error: null,
      lastUpdated: new Date().toISOString(),
    } as ApiResponse<AuctionReport[]>);
  } catch (error) {
    console.error("Auction API error:", error);
    return NextResponse.json(
      {
        data: getDemoAuctionData(),
        error: "Using cached data - live feed unavailable",
        lastUpdated: new Date().toISOString(),
      } as ApiResponse<AuctionReport[]>,
      { status: 200 }
    );
  }
}

// Demo data when API is unavailable
function getDemoAuctionData(): AuctionReport[] {
  const today = new Date();
  const lastFriday = new Date(today);
  lastFriday.setDate(today.getDate() - ((today.getDay() + 2) % 7));

  return [
    {
      reportDate: lastFriday.toISOString(),
      reportTitle: "Nebraska Livestock Auction Summary",
      marketName: "Ogallala Livestock Auction",
      totalHeadCount: 3245,
      sales: [
        {
          reportDate: lastFriday.toISOString(),
          marketLocation: "Ogallala, NE",
          headCount: 425,
          avgPrice: 285.5,
          priceRange: { low: 275.0, high: 295.0 },
          weightRange: { low: 400, high: 500 },
          category: "Steers",
          grade: "M&L 1-2",
          trend: "higher",
        },
        {
          reportDate: lastFriday.toISOString(),
          marketLocation: "Ogallala, NE",
          headCount: 380,
          avgPrice: 268.25,
          priceRange: { low: 260.0, high: 278.0 },
          weightRange: { low: 500, high: 600 },
          category: "Steers",
          grade: "M&L 1-2",
          trend: "steady",
        },
        {
          reportDate: lastFriday.toISOString(),
          marketLocation: "Ogallala, NE",
          headCount: 315,
          avgPrice: 245.75,
          priceRange: { low: 238.0, high: 255.0 },
          weightRange: { low: 600, high: 700 },
          category: "Steers",
          grade: "M&L 1-2",
          trend: "higher",
        },
        {
          reportDate: lastFriday.toISOString(),
          marketLocation: "Ogallala, NE",
          headCount: 290,
          avgPrice: 265.5,
          priceRange: { low: 255.0, high: 275.0 },
          weightRange: { low: 400, high: 500 },
          category: "Heifers",
          grade: "M&L 1-2",
          trend: "steady",
        },
        {
          reportDate: lastFriday.toISOString(),
          marketLocation: "Ogallala, NE",
          headCount: 245,
          avgPrice: 248.25,
          priceRange: { low: 240.0, high: 258.0 },
          weightRange: { low: 500, high: 600 },
          category: "Heifers",
          grade: "M&L 1-2",
          trend: "lower",
        },
        {
          reportDate: lastFriday.toISOString(),
          marketLocation: "Ogallala, NE",
          headCount: 185,
          avgPrice: 125.5,
          priceRange: { low: 115.0, high: 135.0 },
          weightRange: { low: 1200, high: 1600 },
          category: "Slaughter Cows",
          grade: "Breakers 75-80%",
          trend: "steady",
        },
      ],
      commentary: "Good demand for quality feeder cattle. Market steady to stronger on light calves.",
    },
    {
      reportDate: lastFriday.toISOString(),
      reportTitle: "Nebraska Livestock Auction Summary",
      marketName: "Valentine Livestock Auction",
      totalHeadCount: 2890,
      sales: [
        {
          reportDate: lastFriday.toISOString(),
          marketLocation: "Valentine, NE",
          headCount: 385,
          avgPrice: 288.75,
          priceRange: { low: 280.0, high: 298.0 },
          weightRange: { low: 400, high: 500 },
          category: "Steers",
          grade: "M&L 1-2",
          trend: "higher",
        },
        {
          reportDate: lastFriday.toISOString(),
          marketLocation: "Valentine, NE",
          headCount: 340,
          avgPrice: 270.5,
          priceRange: { low: 262.0, high: 280.0 },
          weightRange: { low: 500, high: 600 },
          category: "Steers",
          grade: "M&L 1-2",
          trend: "steady",
        },
        {
          reportDate: lastFriday.toISOString(),
          marketLocation: "Valentine, NE",
          headCount: 275,
          avgPrice: 248.25,
          priceRange: { low: 240.0, high: 258.0 },
          weightRange: { low: 600, high: 700 },
          category: "Steers",
          grade: "M&L 1-2",
          trend: "higher",
        },
        {
          reportDate: lastFriday.toISOString(),
          marketLocation: "Valentine, NE",
          headCount: 260,
          avgPrice: 268.0,
          priceRange: { low: 258.0, high: 278.0 },
          weightRange: { low: 400, high: 500 },
          category: "Heifers",
          grade: "M&L 1-2",
          trend: "higher",
        },
      ],
      commentary: "Active trade with good buyer attendance. Feeder cattle in high demand.",
    },
  ];
}
