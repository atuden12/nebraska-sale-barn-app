"use client";

import { useEffect, useState, useCallback } from "react";
import { format } from "date-fns";
import {
  Gavel,
  MapPin,
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart3,
  List,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  TableSkeleton,
  Badge,
  RefreshButton,
  ErrorMessage,
  NoDataMessage,
} from "../ui";
import { BarnSelector } from "./BarnSelector";
import { AuctionComparison } from "./AuctionComparison";
import { AuctionReport, SaleBarn } from "@/lib/types";

type ViewMode = "barns" | "compare";

export function AuctionSales() {
  const [reports, setReports] = useState<AuctionReport[]>([]);
  const [barns, setBarns] = useState<SaleBarn[]>([]);
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>(["1860"]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<ViewMode>("barns");

  // Load barn list on mount
  useEffect(() => {
    fetch("/api/barns")
      .then((r) => r.json())
      .then((d) => setBarns(d.barns || []))
      .catch(() => {});
  }, []);

  const fetchData = useCallback(async (slugs: string[]) => {
    setLoading(true);
    setError(null);
    try {
      const params = slugs.length > 0 ? `?barns=${slugs.join(",")}` : "";
      const response = await fetch(`/api/auctions${params}`);
      if (!response.ok) throw new Error("Failed to fetch auction data");
      const data = await response.json();
      if (data.error && data.error.includes("demo")) {
        setError(data.error);
      }
      setReports(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch when selected barns change
  useEffect(() => {
    fetchData(selectedSlugs);
  }, [selectedSlugs, fetchData]);

  const handleRefresh = () => fetchData(selectedSlugs);

  const handleBarnChange = (slugs: string[]) => {
    setSelectedSlugs(slugs);
    // Auto-switch to compare view when 2+ barns are selected
    if (slugs.length >= 2 && view === "barns") {
      setView("compare");
    }
  };

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

  return (
    <Card id="auctions">
      <CardHeader action={<RefreshButton onRefresh={handleRefresh} />}>
        <div className="flex items-center gap-2">
          <div className="p-2 bg-prairie-100 rounded-lg">
            <Gavel className="w-5 h-5 text-prairie-600" />
          </div>
          <div>
            <CardTitle>Nebraska Auction Sales</CardTitle>
            <CardDescription>
              Select sale barns to view and compare livestock auction results
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      {/* Barn selector and view toggle */}
      <div className="px-4 py-3 sm:px-6 border-b border-gray-100 bg-gray-50/50">
        <div className="flex flex-col sm:flex-row sm:items-start gap-3">
          <div className="flex-1">
            <BarnSelector
              barns={barns}
              selected={selectedSlugs}
              onChange={handleBarnChange}
            />
          </div>

          {/* View toggle */}
          <div className="flex items-center bg-white border border-gray-200 rounded-lg overflow-hidden shrink-0">
            <button
              type="button"
              onClick={() => setView("barns")}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors ${
                view === "barns"
                  ? "bg-cornhusker-600 text-white"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <List className="w-3.5 h-3.5" />
              By Barn
            </button>
            <button
              type="button"
              onClick={() => setView("compare")}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors ${
                view === "compare"
                  ? "bg-cornhusker-600 text-white"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              Compare
            </button>
          </div>
        </div>
      </div>

      <CardContent className="p-0">
        {loading ? (
          <div className="p-6">
            <TableSkeleton rows={6} cols={5} />
          </div>
        ) : error && reports.length === 0 ? (
          <ErrorMessage message={error} onRetry={handleRefresh} />
        ) : selectedSlugs.length === 0 ? (
          <NoDataMessage message="Select one or more sale barns above to view auction data." />
        ) : reports.length === 0 ? (
          <NoDataMessage message="No auction reports available for the selected barns. Check back after sale day." />
        ) : view === "compare" ? (
          <div className="p-4 sm:p-6">
            <AuctionComparison reports={reports} />
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            {error && (
              <div className="px-4 py-2 bg-prairie-50 text-prairie-700 text-xs border-b border-prairie-100">
                {error}
              </div>
            )}
            {reports.map((report, reportIndex) => (
              <div
                key={reportIndex}
                className="border-b border-gray-100 last:border-0"
              >
                <div className="px-4 py-3 bg-gray-50 flex flex-wrap items-center gap-2 sm:gap-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-gray-900">
                      {report.marketName}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {report.reportDate
                      ? format(new Date(report.reportDate), "MMM d, yyyy")
                      : "Recent"}
                  </span>
                  <Badge variant="info">
                    {report.totalHeadCount.toLocaleString()} head
                  </Badge>
                </div>
                <table className="w-full min-w-[600px]">
                  <thead>
                    <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3 text-right">Head</th>
                      <th className="px-4 py-3 text-right">Weight (lbs)</th>
                      <th className="px-4 py-3 text-right">Price Range</th>
                      <th className="px-4 py-3 text-right">Avg Price</th>
                      <th className="px-4 py-3">Trend</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {report.sales.slice(0, 15).map((sale, saleIndex) => (
                      <tr
                        key={saleIndex}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">
                              {sale.category}
                            </span>
                            {sale.grade && (
                              <Badge variant="default">{sale.grade}</Badge>
                            )}
                          </div>
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
                {report.commentary && (
                  <div className="px-4 py-3 bg-gray-50 text-sm text-gray-600 italic">
                    {report.commentary}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
