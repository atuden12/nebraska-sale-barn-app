"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import {
  ArrowLeft,
  Gavel,
  MapPin,
  Users,
  TrendingUp,
  TrendingDown,
  Minus,
  ExternalLink,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  TableSkeleton,
  Badge,
  RefreshButton,
  ErrorMessage,
  NoDataMessage,
} from "@/components/ui";
import { AuctionReport } from "@/lib/types";
import { getMarketName, getUSDAauctionReportUrl } from "@/lib/slugs";

export default function AuctionDetailPage() {
  const params = useParams();
  const marketSlug = params.market as string;
  const marketName = getMarketName(marketSlug);

  const [report, setReport] = useState<AuctionReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/auctions/${marketSlug}`);
      if (!response.ok) throw new Error("Failed to fetch auction data");
      const result = await response.json();
      setReport(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [marketSlug]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case "higher":
        return <TrendingUp className="w-4 h-4 text-pasture-600" />;
      case "lower":
        return <TrendingDown className="w-4 h-4 text-cornhusker-600" />;
      default:
        return <Minus className="w-4 h-4 text-gray-400" />;
    }
  };

  const getTrendBadge = (trend?: string) => {
    switch (trend) {
      case "higher":
        return <Badge variant="success">Higher</Badge>;
      case "lower":
        return <Badge variant="danger">Lower</Badge>;
      case "steady":
        return <Badge variant="default">Steady</Badge>;
      default:
        return null;
    }
  };

  // Category breakdown
  const categoryBreakdown = report?.sales.reduce(
    (acc, sale) => {
      const cat = sale.category;
      if (!acc[cat]) acc[cat] = { headCount: 0, count: 0 };
      acc[cat].headCount += sale.headCount;
      acc[cat].count += 1;
      return acc;
    },
    {} as Record<string, { headCount: number; count: number }>
  ) || {};

  // Trend summary
  const trendCounts = report?.sales.reduce(
    (acc, sale) => {
      if (sale.trend === "higher") acc.higher++;
      else if (sale.trend === "lower") acc.lower++;
      else acc.steady++;
      return acc;
    },
    { higher: 0, lower: 0, steady: 0 }
  ) || { higher: 0, lower: 0, steady: 0 };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Back navigation */}
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-cornhusker-600 transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </Link>

      {/* Page header */}
      <div className="mb-8">
        <div className="flex flex-wrap items-center gap-3 mb-2">
          <div className="p-2 bg-prairie-100 rounded-lg">
            <Gavel className="w-6 h-6 text-prairie-600" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 text-balance">
            {marketName}
          </h1>
          <RefreshButton onRefresh={fetchData} />
        </div>
        <div className="flex flex-wrap items-center gap-3 mt-2">
          {report && (
            <>
              <span className="inline-flex items-center gap-1.5 text-sm text-gray-500">
                <MapPin className="w-4 h-4" />
                {report.sales[0]?.marketLocation || "Nebraska"}
              </span>
              {report.reportDate && (
                <span className="text-sm text-gray-500">
                  {format(new Date(report.reportDate), "MMMM d, yyyy")}
                </span>
              )}
              <Badge variant="info">
                {report.totalHeadCount.toLocaleString()} head
              </Badge>
            </>
          )}
        </div>
      </div>

      {loading ? (
        <Card>
          <CardContent>
            <TableSkeleton rows={8} cols={6} />
          </CardContent>
        </Card>
      ) : error ? (
        <ErrorMessage message={error} onRetry={fetchData} />
      ) : !report || report.sales.length === 0 ? (
        <NoDataMessage
          message={`No auction data available for ${marketName}`}
        />
      ) : (
        <>
          {/* Summary stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-prairie-50 rounded-xl p-5 border border-prairie-200">
              <p className="text-sm font-medium text-prairie-700 mb-1">
                Total Head
              </p>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-prairie-500" />
                <span className="text-3xl font-bold text-prairie-800">
                  {report.totalHeadCount.toLocaleString()}
                </span>
              </div>
              <p className="text-xs text-prairie-600 mt-1">reported this sale</p>
            </div>
            <div className="bg-white rounded-xl p-5 border border-gray-200">
              <p className="text-sm font-medium text-gray-500 mb-1">
                Categories
              </p>
              <p className="text-3xl font-bold text-gray-900">
                {Object.keys(categoryBreakdown).length}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {report.sales.length} line items
              </p>
            </div>
            <div className="bg-white rounded-xl p-5 border border-gray-200">
              <p className="text-sm font-medium text-gray-500 mb-1">
                Market Trend
              </p>
              <div className="flex items-center gap-2 mt-1">
                {trendCounts.higher > 0 && (
                  <span className="inline-flex items-center gap-1 text-sm text-pasture-700">
                    <TrendingUp className="w-4 h-4" />
                    {trendCounts.higher}
                  </span>
                )}
                {trendCounts.steady > 0 && (
                  <span className="inline-flex items-center gap-1 text-sm text-gray-500">
                    <Minus className="w-4 h-4" />
                    {trendCounts.steady}
                  </span>
                )}
                {trendCounts.lower > 0 && (
                  <span className="inline-flex items-center gap-1 text-sm text-cornhusker-700">
                    <TrendingDown className="w-4 h-4" />
                    {trendCounts.lower}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                higher / steady / lower
              </p>
            </div>
            <div className="bg-white rounded-xl p-5 border border-gray-200">
              <p className="text-sm font-medium text-gray-500 mb-1">
                Report Date
              </p>
              <p className="text-lg font-bold text-gray-900">
                {report.reportDate
                  ? format(new Date(report.reportDate), "MMM d, yyyy")
                  : "Recent"}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {report.reportTitle || "Weekly Auction"}
              </p>
            </div>
          </div>

          {/* Category breakdown */}
          {Object.keys(categoryBreakdown).length > 1 && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">
                Category Breakdown
              </h2>
              <div className="flex flex-wrap gap-2">
                {Object.entries(categoryBreakdown).map(
                  ([category, { headCount, count }]) => (
                    <div
                      key={category}
                      className="bg-white rounded-lg px-4 py-2 border border-gray-200 flex items-center gap-3"
                    >
                      <span className="font-medium text-gray-900 text-sm">
                        {category}
                      </span>
                      <Badge variant="default">
                        {headCount.toLocaleString()} hd
                      </Badge>
                      <span className="text-xs text-gray-400">
                        {count} lot{count !== 1 ? "s" : ""}
                      </span>
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          {/* Full sales table */}
          <Card>
            <CardHeader>
              <CardTitle>All Sales</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full min-w-[700px]">
                  <thead>
                    <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3">Grade</th>
                      <th className="px-4 py-3 text-right">Head</th>
                      <th className="px-4 py-3 text-right">Weight (lbs)</th>
                      <th className="px-4 py-3 text-right">Price Range</th>
                      <th className="px-4 py-3 text-right">Avg Price</th>
                      <th className="px-4 py-3">Trend</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {report.sales.map((sale, index) => (
                      <tr
                        key={index}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-4 py-3 font-medium text-gray-900">
                          {sale.category}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {sale.grade ? (
                            <Badge variant="default">{sale.grade}</Badge>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-600">
                          {sale.headCount.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-600">
                          {sale.weightRange.low > 0
                            ? `${sale.weightRange.low.toLocaleString()}-${sale.weightRange.high.toLocaleString()}`
                            : "-"}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-600">
                          {sale.priceRange.low > 0
                            ? `$${sale.priceRange.low.toFixed(2)}-$${sale.priceRange.high.toFixed(2)}`
                            : "-"}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="font-semibold text-gray-900">
                            ${sale.avgPrice.toFixed(2)}
                          </span>
                          <span className="text-gray-500 text-sm">/cwt</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {getTrendIcon(sale.trend)}
                            {getTrendBadge(sale.trend)}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Commentary */}
          {report.commentary && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Market Commentary</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 italic leading-relaxed">
                  {report.commentary}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Source link */}
          <div className="mt-8 p-4 bg-gray-50 rounded-xl border border-gray-200 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-gray-700">
                Official USDA Source
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                Data sourced from USDA Agricultural Marketing Service
              </p>
            </div>
            <a
              href={getUSDAauctionReportUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-cornhusker-700 bg-cornhusker-50 rounded-lg hover:bg-cornhusker-100 transition-colors border border-cornhusker-200"
            >
              View USDA Report
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </>
      )}
    </div>
  );
}
