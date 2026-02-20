import { Suspense } from "react";
import {
  AuctionSales,
  SlaughterData,
  CashPrices,
  FuturesPrices,
  MarketSummary,
} from "@/components/sections";
import { CardSkeleton, StatCardSkeleton } from "@/components/ui";
import { Calendar } from "lucide-react";

// Loading fallback components
function SectionLoading() {
  return <CardSkeleton />;
}

export default function DashboardPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Hero / Welcome Section */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Nebraska Cattle Market
            </h1>
            <p className="text-gray-500 mt-1">
              Live auction reports, cash prices, and futures data for Nebraska cattle markets
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Calendar className="w-4 h-4" />
            <span>
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Market Overview Summary - live-derived */}
      <MarketSummary />

      {/* Main Content Grid */}
      <div className="space-y-8">
        {/* Futures Section - Most time-sensitive, show first */}
        <Suspense fallback={<SectionLoading />}>
          <FuturesPrices />
        </Suspense>

        {/* Cash Prices */}
        <Suspense fallback={<SectionLoading />}>
          <CashPrices />
        </Suspense>

        {/* Slaughter Data */}
        <Suspense fallback={<SectionLoading />}>
          <SlaughterData />
        </Suspense>

        {/* Auction Sales - Typically weekly, less urgent */}
        <Suspense fallback={<SectionLoading />}>
          <AuctionSales />
        </Suspense>
      </div>

      {/* Data Sources & Disclaimer */}
      <div className="mt-12 p-4 bg-gray-50 rounded-xl border border-gray-200">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Data Sources</h3>
        <ul className="text-xs text-gray-500 space-y-1">
          <li>
            {"• "}<strong>Auction Sales:</strong> USDA AMS MyMarketNews (LM_CT758, LM_CT712)
          </li>
          <li>
            {"• "}<strong>Slaughter Numbers:</strong> USDA NASS Quick Stats (weekly national)
          </li>
          <li>
            {"• "}<strong>Cash Prices:</strong> USDA AMS MARS (Wyoming-Nebraska Direct Cattle)
          </li>
          <li>
            {"• "}<strong>Futures:</strong> CME Group (delayed quotes via public feeds)
          </li>
        </ul>
        <p className="text-xs text-gray-400 mt-3">
          This information is for educational purposes only and should not be considered
          financial or trading advice. Data may be delayed or unavailable. Always verify
          with official USDA and CME sources before making decisions.
        </p>
      </div>
    </div>
  );
}
