"use client";

import { useEffect, useState, useCallback } from "react";
import { format } from "date-fns";
import { Gavel, MapPin, TrendingUp, TrendingDown, Minus } from "lucide-react";
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
import { AuctionReport, AuctionSale } from "@/lib/types";

interface AuctionSalesProps {
  initialData?: AuctionReport[];
}

export function AuctionSales({ initialData }: AuctionSalesProps) {
  const [reports, setReports] = useState<AuctionReport[]>(initialData || []);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/auctions");
      if (!response.ok) throw new Error("Failed to fetch auction data");
      const data = await response.json();
      setReports(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!initialData) {
      fetchData();
    }
  }, [initialData, fetchData]);

  const handleRefresh = async () => {
    await fetchData();
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
      <CardHeader
        action={<RefreshButton onRefresh={handleRefresh} />}
      >
        <div className="flex items-center gap-2">
          <div className="p-2 bg-prairie-100 rounded-lg">
            <Gavel className="w-5 h-5 text-prairie-600" />
          </div>
          <div>
            <CardTitle>Nebraska Auction Sales</CardTitle>
            <CardDescription>
              Weekly livestock auction summaries from Nebraska sale barns
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="p-6">
            <TableSkeleton rows={6} cols={5} />
          </div>
        ) : error ? (
          <ErrorMessage message={error} onRetry={fetchData} />
        ) : reports.length === 0 ? (
          <NoDataMessage message="No auction reports available. Check back after auction day." />
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            {reports.map((report, reportIndex) => (
              <div key={reportIndex} className="border-b border-gray-100 last:border-0">
                <div className="px-4 py-3 bg-gray-50 flex flex-wrap items-center gap-2 sm:gap-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-gray-900">{report.marketName}</span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {report.reportDate
                      ? format(new Date(report.reportDate), "MMM d, yyyy")
                      : "Recent"}
                  </span>
                  <Badge variant="info">{report.totalHeadCount.toLocaleString()} head</Badge>
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
                    {report.sales.slice(0, 10).map((sale, saleIndex) => (
                      <tr key={saleIndex} className="hover:bg-gray-50 transition-colors">
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
