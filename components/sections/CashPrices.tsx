"use client";

import { useEffect, useState, useCallback } from "react";
import { format } from "date-fns";
import { DollarSign, Scale, Users } from "lucide-react";
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
import { CashPriceReport, CashPrice } from "@/lib/types";

interface CashPricesProps {
  initialData?: CashPriceReport;
}

const priceTypeLabels: Record<string, { label: string; color: string }> = {
  negotiated: { label: "Negotiated", color: "bg-blue-100 text-blue-700" },
  formula: { label: "Formula", color: "bg-purple-100 text-purple-700" },
  forward: { label: "Forward", color: "bg-orange-100 text-orange-700" },
  negotiated_grid: { label: "Neg. Grid", color: "bg-teal-100 text-teal-700" },
};

export function CashPrices({ initialData }: CashPricesProps) {
  const [report, setReport] = useState<CashPriceReport | null>(initialData || null);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/cash-prices");
      if (!response.ok) throw new Error("Failed to fetch cash price data");
      const result = await response.json();
      setReport(result.data);
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

  // Group prices by type
  const pricesByType = report?.prices.reduce((acc, price) => {
    const type = price.priceType;
    if (!acc[type]) acc[type] = [];
    acc[type].push(price);
    return acc;
  }, {} as Record<string, CashPrice[]>) || {};

  // Calculate summary stats
  const negotiatedPrices = pricesByType.negotiated || [];
  const avgNegotiated =
    negotiatedPrices.length > 0
      ? negotiatedPrices.reduce((sum, p) => sum + p.weightedAvgPrice, 0) /
        negotiatedPrices.length
      : 0;

  const totalHead = report?.prices.reduce((sum, p) => sum + p.headCount, 0) || 0;

  return (
    <Card id="cash-prices">
      <CardHeader
        action={<RefreshButton onRefresh={fetchData} />}
      >
        <div className="flex items-center gap-2">
          <div className="p-2 bg-pasture-100 rounded-lg">
            <DollarSign className="w-5 h-5 text-pasture-600" />
          </div>
          <div>
            <CardTitle>Cash Prices</CardTitle>
            <CardDescription>
              Nebraska negotiated & formula fed cattle prices
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <TableSkeleton rows={6} cols={5} />
        ) : error ? (
          <ErrorMessage message={error} onRetry={fetchData} />
        ) : !report || report.prices.length === 0 ? (
          <NoDataMessage message="No cash price data available" />
        ) : (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-pasture-50 rounded-lg p-4 border border-pasture-200">
                <p className="text-sm text-pasture-700 mb-1">Negotiated Avg</p>
                <p className="text-2xl font-bold text-pasture-800">
                  ${avgNegotiated.toFixed(2)}
                </p>
                <p className="text-xs text-pasture-600">/cwt live basis</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-500 mb-1">Total Reported</p>
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-gray-400" />
                  <span className="text-xl font-bold text-gray-900">
                    {totalHead.toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-gray-500">head this week</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-500 mb-1">Report Date</p>
                <p className="text-lg font-medium text-gray-900">
                  {report.reportDate
                    ? format(new Date(report.reportDate), "MMM d, yyyy")
                    : "Recent"}
                </p>
                <p className="text-xs text-gray-500">Nebraska Direct</p>
              </div>
            </div>

            {/* Price Tables by Type */}
            <div className="space-y-6">
              {Object.entries(pricesByType).map(([type, prices]) => (
                <div key={type}>
                  <div className="flex items-center gap-2 mb-3">
                    <span
                      className={`px-2 py-1 rounded-md text-xs font-medium ${
                        priceTypeLabels[type]?.color || "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {priceTypeLabels[type]?.label || type}
                    </span>
                    <span className="text-sm text-gray-500">
                      {prices.length} report{prices.length !== 1 ? "s" : ""}
                    </span>
                  </div>

                  <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full min-w-[500px]">
                      <thead>
                        <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                          <th className="px-3 py-2">Region</th>
                          <th className="px-3 py-2 text-right">Head Count</th>
                          <th className="px-3 py-2 text-right">Avg Weight</th>
                          <th className="px-3 py-2 text-right">Price Range</th>
                          <th className="px-3 py-2 text-right">Wtd Avg</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {prices.slice(0, 5).map((price, index) => (
                          <tr key={index} className="hover:bg-gray-50 transition-colors">
                            <td className="px-3 py-2 text-gray-900">{price.region}</td>
                            <td className="px-3 py-2 text-right text-gray-600">
                              {price.headCount.toLocaleString()}
                            </td>
                            <td className="px-3 py-2 text-right text-gray-600">
                              {price.avgWeight > 0 ? (
                                <span className="flex items-center justify-end gap-1">
                                  <Scale className="w-3 h-3" />
                                  {price.avgWeight.toLocaleString()} lbs
                                </span>
                              ) : (
                                "-"
                              )}
                            </td>
                            <td className="px-3 py-2 text-right text-gray-600">
                              {price.priceRange.low > 0
                                ? `$${price.priceRange.low.toFixed(2)} - $${price.priceRange.high.toFixed(2)}`
                                : "-"}
                            </td>
                            <td className="px-3 py-2 text-right">
                              <span className="font-semibold text-gray-900">
                                ${price.weightedAvgPrice.toFixed(2)}
                              </span>
                              {price.dressedBasis && (
                                <span className="block text-xs text-gray-500">
                                  ${price.dressedBasis.toFixed(2)} dressed
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
