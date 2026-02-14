import { Suspense } from "react";
import {
  AuctionSales,
  SlaughterData,
  CashPrices,
  FuturesPrices,
} from "@/components/sections";
import { CardSkeleton, StatCardSkeleton } from "@/components/ui";
import { TrendingUp, TrendingDown, DollarSign, Users, Calendar } from "lucide-react";

// Quick stat card component for the overview section
function StatCard({
  title,
  value,
  subtitle,
  trend,
  trendValue,
  icon: Icon,
  iconBg,
}: {
  title: string;
  value: string;
  subtitle: string;
  trend?: "up" | "down";
  trendValue?: string;
  icon: any;
  iconBg: string;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">{value}</p>
          <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
        </div>
        <div className={`p-2 rounded-lg ${iconBg}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
      {trend && trendValue && (
        <div className="mt-3 flex items-center gap-1">
          {trend === "up" ? (
            <TrendingUp className="w-4 h-4 text-pasture-600" />
          ) : (
            <TrendingDown className="w-4 h-4 text-cornhusker-600" />
          )}
          <span
            className={`text-sm font-medium ${
              trend === "up" ? "text-pasture-600" : "text-cornhusker-600"
            }`}
          >
            {trendValue}
          </span>
          <span className="text-xs text-gray-500">vs last week</span>
        </div>
      )}
    </div>
  );
}

// Summary section with key market metrics
function MarketSummary() {
  return (
    <section className="mb-8">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Market Overview</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Live Cattle (Front)"
          value="$185.58"
          subtitle="CME LE Feb '25"
          trend="up"
          trendValue="+0.45%"
          icon={TrendingUp}
          iconBg="bg-pasture-500"
        />
        <StatCard
          title="Feeder Cattle (Front)"
          value="$252.75"
          subtitle="CME GF Jan '25"
          trend="up"
          trendValue="+0.45%"
          icon={TrendingUp}
          iconBg="bg-blue-500"
        />
        <StatCard
          title="NE Cash Negotiated"
          value="$186.25"
          subtitle="Weekly weighted avg"
          trend="up"
          trendValue="+$0.75"
          icon={DollarSign}
          iconBg="bg-prairie-500"
        />
        <StatCard
          title="Weekly Slaughter"
          value="625K"
          subtitle="Federally inspected"
          trend="down"
          trendValue="-1.2%"
          icon={Users}
          iconBg="bg-cornhusker-500"
        />
      </div>
    </section>
  );
}

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

      {/* Market Overview Summary */}
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
            • <strong>Auction Sales:</strong> USDA AMS MyMarketNews - Nebraska Livestock Auctions
          </li>
          <li>
            • <strong>Slaughter Numbers:</strong> USDA NASS & LMPR (LM_CT100)
          </li>
          <li>
            • <strong>Cash Prices:</strong> USDA AMS Nebraska Direct Slaughter (LM_CT158, LM_CT150)
          </li>
          <li>
            • <strong>Futures:</strong> CME Group (delayed quotes via public feeds)
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
