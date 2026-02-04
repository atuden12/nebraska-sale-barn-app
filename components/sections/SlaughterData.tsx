"use client";

import { useEffect, useState, useCallback } from "react";
import { format } from "date-fns";
import { Factory, TrendingUp, TrendingDown, Calendar } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  TableSkeleton,
  TrendBadge,
  RefreshButton,
  ErrorMessage,
  NoDataMessage,
} from "../ui";
import { SlaughterData as SlaughterDataType } from "@/lib/types";

interface SlaughterDataProps {
  initialData?: SlaughterDataType[];
}

export function SlaughterData({ initialData }: SlaughterDataProps) {
  const [data, setData] = useState<SlaughterDataType[]>(initialData || []);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/slaughter");
      if (!response.ok) throw new Error("Failed to fetch slaughter data");
      const result = await response.json();
      setData(result.data || []);
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

  // Calculate summary stats
  const latestWeek = data[0];
  const totalSlaughter = latestWeek?.cattleSlaughter || 0;
  const weekChange = latestWeek?.percentChangeWeek || 0;
  const yearChange = latestWeek?.percentChangeYear || 0;

  return (
    <Card id="slaughter">
      <CardHeader
        action={<RefreshButton onRefresh={fetchData} />}
      >
        <div className="flex items-center gap-2">
          <div className="p-2 bg-cornhusker-100 rounded-lg">
            <Factory className="w-5 h-5 text-cornhusker-600" />
          </div>
          <div>
            <CardTitle>Cattle Slaughter</CardTitle>
            <CardDescription>
              Weekly federally inspected cattle slaughter numbers
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <TableSkeleton rows={5} cols={4} />
        ) : error ? (
          <ErrorMessage message={error} onRetry={fetchData} />
        ) : data.length === 0 ? (
          <NoDataMessage message="No slaughter data available" />
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-500 mb-1">Latest Week</p>
                <p className="text-2xl font-bold text-gray-900">
                  {totalSlaughter.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">head slaughtered</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-500 mb-1">vs Previous Week</p>
                <div className="flex items-center gap-2">
                  {weekChange >= 0 ? (
                    <TrendingUp className="w-5 h-5 text-pasture-600" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-cornhusker-600" />
                  )}
                  <span
                    className={`text-xl font-bold ${
                      weekChange >= 0 ? "text-pasture-600" : "text-cornhusker-600"
                    }`}
                  >
                    {weekChange >= 0 ? "+" : ""}
                    {weekChange.toFixed(1)}%
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  {latestWeek?.previousWeek.toLocaleString()} prior
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-500 mb-1">vs Year Ago</p>
                <div className="flex items-center gap-2">
                  {yearChange >= 0 ? (
                    <TrendingUp className="w-5 h-5 text-pasture-600" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-cornhusker-600" />
                  )}
                  <span
                    className={`text-xl font-bold ${
                      yearChange >= 0 ? "text-pasture-600" : "text-cornhusker-600"
                    }`}
                  >
                    {yearChange >= 0 ? "+" : ""}
                    {yearChange.toFixed(1)}%
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  {latestWeek?.previousYear.toLocaleString()} year ago
                </p>
              </div>
            </div>

            {/* Data Table */}
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full min-w-[500px]">
                <thead>
                  <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    <th className="px-4 py-3">Week Ending</th>
                    <th className="px-4 py-3">Region</th>
                    <th className="px-4 py-3 text-right">Slaughter</th>
                    <th className="px-4 py-3 text-right">vs Prev Week</th>
                    <th className="px-4 py-3 text-right">vs Year Ago</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.map((week, index) => (
                    <tr
                      key={index}
                      className={`hover:bg-gray-50 transition-colors ${
                        index === 0 ? "bg-prairie-50" : ""
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-900">
                            {week.weekEnding
                              ? format(new Date(week.weekEnding), "MMM d, yyyy")
                              : "-"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{week.region}</td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900">
                        {week.cattleSlaughter.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <TrendBadge value={week.percentChangeWeek} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <TrendBadge value={week.percentChangeYear} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
