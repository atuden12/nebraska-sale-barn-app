"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import {
  ArrowLeft,
  DollarSign,
  Scale,
  Users,
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
import { CashPriceReport, CashPrice } from "@/lib/types";
import { getRegionName, getUSDAReportUrl } from "@/lib/slugs";

const priceTypeLabels: Record<string, { label: string; color: string }> = {
  negotiated: { label: "Negotiated (Live Basis)", color: "bg-blue-100 text-blue-700" },
  formula: { label: "Formula (Dressed Basis)", color: "bg-purple-100 text-purple-700" },
  forward: { label: "Forward Contract", color: "bg-orange-100 text-orange-700" },
  negotiated_grid: { label: "Negotiated Grid", color: "bg-teal-100 text-teal-700" },
};

export default function CashPriceDetailPage() {
  const params = useParams();
  const regionSlug = params.region as string;
  const regionName = getRegionName(regionSlug);

  const [report, setReport] = useState<CashPriceReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/cash-prices/${regionSlug}`);
      if (!response.ok) throw new Error("Failed to fetch cash price data");
      const result = await response.json();
      setReport(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [regionSlug]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Group prices by type
  const pricesByType =
    report?.prices.reduce(
      (acc, price) => {
        const type = price.priceType;
        if (!acc[type]) acc[type] = [];
        acc[type].push(price);
        return acc;
      },
      {} as Record<string, CashPrice[]>
    ) || {};

  // Summary stats
  const totalHead =
    report?.prices.reduce((sum, p) => sum + p.headCount, 0) || 0;
  const negotiatedPrices = pricesByType.negotiated || [];
  const avgNegotiated =
    negotiatedPrices.length > 0
      ? negotiatedPrices.reduce((sum, p) => sum + p.weightedAvgPrice, 0) /
        negotiatedPrices.length
      : 0;
  const allPrices = report?.prices || [];
  const minPrice =
    allPrices.length > 0
      ? Math.min(...allPrices.map((p) => p.priceRange.low).filter((v) => v > 0))
      : 0;
  const maxPrice =
    allPrices.length > 0
      ? Math.max(...allPrices.map((p) => p.priceRange.high))
      : 0;

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
          <div className="p-2 bg-pasture-100 rounded-lg">
            <DollarSign className="w-6 h-6 text-pasture-600" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 text-balance">
            {regionName} Cash Prices
          </h1>
          <RefreshButton onRefresh={fetchData} />
        </div>
        <p className="text-gray-500 mt-1">
          Full USDA direct slaughter cattle report for {regionName}
          {report?.reportDate && (
            <span className="ml-1">
              — {format(new Date(report.reportDate), "MMMM d, yyyy")}
            </span>
          )}
        </p>
      </div>

      {loading ? (
        <Card>
          <CardContent>
            <TableSkeleton rows={8} cols={5} />
          </CardContent>
        </Card>
      ) : error ? (
        <ErrorMessage message={error} onRetry={fetchData} />
      ) : !report || report.prices.length === 0 ? (
        <NoDataMessage message={`No cash price data available for ${regionName}`} />
      ) : (
        <>
          {/* Summary stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-pasture-50 rounded-xl p-5 border border-pasture-200">
              <p className="text-sm font-medium text-pasture-700 mb-1">
                Negotiated Avg
              </p>
              <p className="text-3xl font-bold text-pasture-800">
                {avgNegotiated > 0 ? `$${avgNegotiated.toFixed(2)}` : "N/A"}
              </p>
              <p className="text-xs text-pasture-600 mt-1">/cwt live basis</p>
            </div>
            <div className="bg-white rounded-xl p-5 border border-gray-200">
              <p className="text-sm font-medium text-gray-500 mb-1">
                Total Head Reported
              </p>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-gray-400" />
                <span className="text-3xl font-bold text-gray-900">
                  {totalHead.toLocaleString()}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">head this week</p>
            </div>
            <div className="bg-white rounded-xl p-5 border border-gray-200">
              <p className="text-sm font-medium text-gray-500 mb-1">
                Price Range
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {minPrice > 0
                  ? `$${minPrice.toFixed(2)} - $${maxPrice.toFixed(2)}`
                  : "N/A"}
              </p>
              <p className="text-xs text-gray-500 mt-1">all purchase types</p>
            </div>
            <div className="bg-white rounded-xl p-5 border border-gray-200">
              <p className="text-sm font-medium text-gray-500 mb-1">
                Price Types
              </p>
              <p className="text-3xl font-bold text-gray-900">
                {Object.keys(pricesByType).length}
              </p>
              <p className="text-xs text-gray-500 mt-1">reported categories</p>
            </div>
          </div>

          {/* Price tables by type */}
          <div className="space-y-6">
            {Object.entries(pricesByType).map(([type, prices]) => (
              <Card key={type}>
                <CardHeader>
                  <div className="flex flex-wrap items-center gap-3">
                    <span
                      className={`px-3 py-1 rounded-md text-sm font-medium ${
                        priceTypeLabels[type]?.color ||
                        "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {priceTypeLabels[type]?.label || type}
                    </span>
                    <Badge variant="info">
                      {prices.length} record{prices.length !== 1 ? "s" : ""}
                    </Badge>
                    <Badge variant="default">
                      {prices
                        .reduce((sum, p) => sum + p.headCount, 0)
                        .toLocaleString()}{" "}
                      head
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full min-w-[600px]">
                      <thead>
                        <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                          <th className="px-4 py-3">Region</th>
                          <th className="px-4 py-3 text-right">Head Count</th>
                          <th className="px-4 py-3 text-right">Avg Weight</th>
                          <th className="px-4 py-3 text-right">Price Range</th>
                          <th className="px-4 py-3 text-right">Wtd Avg Price</th>
                          <th className="px-4 py-3 text-right">Dressed Basis</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {prices.map((price, index) => (
                          <tr
                            key={index}
                            className="hover:bg-gray-50 transition-colors"
                          >
                            <td className="px-4 py-3 font-medium text-gray-900">
                              {price.region}
                            </td>
                            <td className="px-4 py-3 text-right text-gray-600">
                              {price.headCount.toLocaleString()}
                            </td>
                            <td className="px-4 py-3 text-right text-gray-600">
                              {price.avgWeight > 0 ? (
                                <span className="flex items-center justify-end gap-1">
                                  <Scale className="w-3 h-3" />
                                  {price.avgWeight.toLocaleString()} lbs
                                </span>
                              ) : (
                                "-"
                              )}
                            </td>
                            <td className="px-4 py-3 text-right text-gray-600">
                              {price.priceRange.low > 0
                                ? `$${price.priceRange.low.toFixed(2)} - $${price.priceRange.high.toFixed(2)}`
                                : "-"}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span className="font-semibold text-gray-900">
                                ${price.weightedAvgPrice.toFixed(2)}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right text-gray-600">
                              {price.dressedBasis
                                ? `$${price.dressedBasis.toFixed(2)}`
                                : "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

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
              href={getUSDAReportUrl(regionSlug)}
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
