"use client";

import { useMemo, useState } from "react";
import { ArrowUpDown, Filter } from "lucide-react";
import { AuctionReport, AuctionSale } from "@/lib/types";
import { Badge } from "../ui";

interface ComparisonRow {
  barnName: string;
  category: string;
  grade: string;
  headCount: number;
  avgPrice: number;
  priceLow: number;
  priceHigh: number;
  weightLow: number;
  weightHigh: number;
  trend?: "higher" | "lower" | "steady";
  reportDate: string;
}

// Standardize weight ranges into common buckets for comparison
const WEIGHT_BUCKETS = [
  { label: "300-400", min: 300, max: 400 },
  { label: "400-500", min: 400, max: 500 },
  { label: "500-600", min: 500, max: 600 },
  { label: "600-700", min: 600, max: 700 },
  { label: "700-800", min: 700, max: 800 },
  { label: "800-900", min: 800, max: 900 },
  { label: "900+", min: 900, max: 9999 },
];

function getWeightBucket(low: number, high: number): string {
  const mid = (low + high) / 2;
  for (const bucket of WEIGHT_BUCKETS) {
    if (mid >= bucket.min && mid < bucket.max) return bucket.label;
  }
  return "Other";
}

// Standardize category names
function normalizeCategory(cat: string): string {
  const lower = cat.toLowerCase();
  if (lower.includes("steer")) return "Steers";
  if (lower.includes("heifer")) return "Heifers";
  if (lower.includes("cow") && lower.includes("calf")) return "Cow-Calf Pairs";
  if (lower.includes("bull") && lower.includes("slaught")) return "Slaughter Bulls";
  if (lower.includes("cow") && (lower.includes("break") || lower.includes("slaught"))) return "Slaughter Cows";
  if (lower.includes("bull")) return "Bulls";
  if (lower.includes("cow")) return "Cows";
  return cat;
}

type SortKey = "barnName" | "category" | "weight" | "avgPrice" | "headCount";
type SortDir = "asc" | "desc";

interface AuctionComparisonProps {
  reports: AuctionReport[];
}

export function AuctionComparison({ reports }: AuctionComparisonProps) {
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [weightFilter, setWeightFilter] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey>("avgPrice");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  // Flatten all reports into comparison rows
  const rows: ComparisonRow[] = useMemo(() => {
    const result: ComparisonRow[] = [];
    for (const report of reports) {
      for (const sale of report.sales) {
        result.push({
          barnName: report.marketName,
          category: normalizeCategory(sale.category),
          grade: sale.grade || "-",
          headCount: sale.headCount,
          avgPrice: sale.avgPrice,
          priceLow: sale.priceRange.low,
          priceHigh: sale.priceRange.high,
          weightLow: sale.weightRange.low,
          weightHigh: sale.weightRange.high,
          trend: sale.trend,
          reportDate: sale.reportDate,
        });
      }
    }
    return result;
  }, [reports]);

  // Unique categories and weight buckets for filters
  const categories = useMemo(
    () => [...new Set(rows.map((r) => r.category))].sort(),
    [rows]
  );

  const weightBuckets = useMemo(() => {
    const buckets = new Set(rows.map((r) => getWeightBucket(r.weightLow, r.weightHigh)));
    return WEIGHT_BUCKETS.filter((b) => buckets.has(b.label));
  }, [rows]);

  // Filter
  const filtered = useMemo(() => {
    let result = rows;
    if (categoryFilter !== "all") {
      result = result.filter((r) => r.category === categoryFilter);
    }
    if (weightFilter !== "all") {
      result = result.filter(
        (r) => getWeightBucket(r.weightLow, r.weightHigh) === weightFilter
      );
    }
    return result;
  }, [rows, categoryFilter, weightFilter]);

  // Sort
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "barnName":
          cmp = a.barnName.localeCompare(b.barnName);
          break;
        case "category":
          cmp = a.category.localeCompare(b.category);
          break;
        case "weight":
          cmp = (a.weightLow + a.weightHigh) / 2 - (b.weightLow + b.weightHigh) / 2;
          break;
        case "avgPrice":
          cmp = a.avgPrice - b.avgPrice;
          break;
        case "headCount":
          cmp = a.headCount - b.headCount;
          break;
      }
      return sortDir === "desc" ? -cmp : cmp;
    });
  }, [filtered, sortKey, sortDir]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const SortHeader = ({
    label,
    sortKeyName,
    className = "",
  }: {
    label: string;
    sortKeyName: SortKey;
    className?: string;
  }) => (
    <th className={`px-3 py-3 ${className}`}>
      <button
        type="button"
        onClick={() => handleSort(sortKeyName)}
        className={`inline-flex items-center gap-1 text-xs font-medium uppercase tracking-wider ${
          sortKey === sortKeyName ? "text-cornhusker-600" : "text-gray-500"
        } hover:text-cornhusker-600 transition-colors`}
      >
        {label}
        <ArrowUpDown className="w-3 h-3" />
      </button>
    </th>
  );

  // Compute min / max price per group for highlighting
  const priceStats = useMemo(() => {
    if (sorted.length === 0) return { min: 0, max: 0 };
    const prices = sorted.map((r) => r.avgPrice);
    return { min: Math.min(...prices), max: Math.max(...prices) };
  }, [sorted]);

  if (reports.length < 2) {
    return (
      <div className="text-center py-8 text-gray-500 text-sm">
        Select 2 or more sale barns to compare prices across markets.
      </div>
    );
  }

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex items-center gap-1.5 text-sm text-gray-500">
          <Filter className="w-4 h-4" />
          <span className="font-medium">Filter:</span>
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-1.5 bg-white border border-gray-200 rounded-md text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-cornhusker-500 focus:border-cornhusker-500"
          aria-label="Filter by category"
        >
          <option value="all">All Categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <select
          value={weightFilter}
          onChange={(e) => setWeightFilter(e.target.value)}
          className="px-3 py-1.5 bg-white border border-gray-200 rounded-md text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-cornhusker-500 focus:border-cornhusker-500"
          aria-label="Filter by weight range"
        >
          <option value="all">All Weights</option>
          {weightBuckets.map((b) => (
            <option key={b.label} value={b.label}>
              {b.label} lbs
            </option>
          ))}
        </select>

        <span className="text-xs text-gray-400 ml-auto">
          {sorted.length} results across {reports.length} barns
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto custom-scrollbar rounded-lg border border-gray-200">
        <table className="w-full min-w-[700px]">
          <thead>
            <tr className="bg-gray-50 text-left border-b border-gray-200">
              <SortHeader label="Sale Barn" sortKeyName="barnName" />
              <SortHeader label="Category" sortKeyName="category" />
              <th className="px-3 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Grade
              </th>
              <SortHeader label="Weight" sortKeyName="weight" className="text-right" />
              <SortHeader label="Head" sortKeyName="headCount" className="text-right" />
              <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Price Range
              </th>
              <SortHeader label="Avg $/cwt" sortKeyName="avgPrice" className="text-right" />
              <th className="px-3 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Trend
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-3 py-8 text-center text-sm text-gray-500">
                  No matching sales found for the selected filters.
                </td>
              </tr>
            ) : (
              sorted.map((row, i) => {
                // Highlight best/worst price
                const isBest = row.avgPrice === priceStats.max && priceStats.max !== priceStats.min;
                const isWorst = row.avgPrice === priceStats.min && priceStats.max !== priceStats.min;

                return (
                  <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-3 py-2.5 text-sm font-medium text-gray-900">
                      {row.barnName}
                    </td>
                    <td className="px-3 py-2.5 text-sm text-gray-700">{row.category}</td>
                    <td className="px-3 py-2.5">
                      {row.grade !== "-" ? (
                        <Badge variant="default">{row.grade}</Badge>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-right text-sm text-gray-600">
                      {row.weightLow > 0
                        ? `${row.weightLow.toLocaleString()}-${row.weightHigh.toLocaleString()}`
                        : "-"}
                    </td>
                    <td className="px-3 py-2.5 text-right text-sm text-gray-600">
                      {row.headCount.toLocaleString()}
                    </td>
                    <td className="px-3 py-2.5 text-right text-sm text-gray-600">
                      {row.priceLow > 0
                        ? `$${row.priceLow.toFixed(2)}-$${row.priceHigh.toFixed(2)}`
                        : "-"}
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <span
                        className={`font-semibold text-sm ${
                          isBest
                            ? "text-pasture-700"
                            : isWorst
                              ? "text-cornhusker-700"
                              : "text-gray-900"
                        }`}
                      >
                        ${row.avgPrice.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      {row.trend === "higher" && <Badge variant="success">Higher</Badge>}
                      {row.trend === "lower" && <Badge variant="danger">Lower</Badge>}
                      {row.trend === "steady" && <Badge variant="default">Steady</Badge>}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      {sorted.length > 0 && priceStats.max !== priceStats.min && (
        <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-pasture-500" />
            Highest price
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-cornhusker-500" />
            Lowest price
          </span>
        </div>
      )}
    </div>
  );
}
