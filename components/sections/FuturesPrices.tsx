"use client";

import { useEffect, useState, useCallback } from "react";
import { format } from "date-fns";
import { LineChart, TrendingUp, TrendingDown, Clock } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  TableSkeleton,
  TrendBadge,
  Badge,
  RefreshButton,
  ErrorMessage,
  NoDataMessage,
} from "../ui";
import { FuturesData, FuturesContract } from "@/lib/types";

interface FuturesPricesProps {
  initialData?: FuturesData;
}

export function FuturesPrices({ initialData }: FuturesPricesProps) {
  const [data, setData] = useState<FuturesData | null>(initialData || null);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"live" | "feeder">("live");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/futures");
      if (!response.ok) throw new Error("Failed to fetch futures data");
      const result = await response.json();
      setData(result.data);
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

  const contracts = activeTab === "live" ? data?.liveCattle : data?.feederCattle;
  const frontMonth = contracts?.[0];

  return (
    <Card id="futures">
      <CardHeader
        action={<RefreshButton onRefresh={fetchData} />}
      >
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-100 rounded-lg">
            <LineChart className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <CardTitle>CME Cattle Futures</CardTitle>
            <CardDescription>Live cattle and feeder cattle contracts</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <TableSkeleton rows={4} cols={5} />
        ) : error ? (
          <ErrorMessage message={error} onRetry={fetchData} />
        ) : !data ? (
          <NoDataMessage message="No futures data available" />
        ) : (
          <>
            {/* Tab Selector */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setActiveTab("live")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === "live"
                    ? "bg-cornhusker-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                Live Cattle (LE)
              </button>
              <button
                onClick={() => setActiveTab("feeder")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === "feeder"
                    ? "bg-cornhusker-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                Feeder Cattle (GF)
              </button>
            </div>

            {/* Front Month Highlight */}
            {frontMonth && (
              <div
                className={`rounded-lg p-4 mb-6 ${
                  frontMonth.change >= 0
                    ? "bg-pasture-50 border border-pasture-200"
                    : "bg-cornhusker-50 border border-cornhusker-200"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">
                      Front Month ({frontMonth.contractMonth})
                    </p>
                    <div className="flex items-baseline gap-3">
                      <span className="text-3xl font-bold text-gray-900">
                        ${frontMonth.lastPrice.toFixed(3)}
                      </span>
                      <div className="flex items-center gap-1">
                        {frontMonth.change >= 0 ? (
                          <TrendingUp className="w-5 h-5 text-pasture-600" />
                        ) : (
                          <TrendingDown className="w-5 h-5 text-cornhusker-600" />
                        )}
                        <span
                          className={`font-semibold ${
                            frontMonth.change >= 0
                              ? "text-pasture-600"
                              : "text-cornhusker-600"
                          }`}
                        >
                          {frontMonth.change >= 0 ? "+" : ""}
                          {frontMonth.change.toFixed(3)} (
                          {frontMonth.changePercent.toFixed(2)}%)
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-6 text-sm">
                    <div>
                      <p className="text-gray-500">Open</p>
                      <p className="font-medium">${frontMonth.open.toFixed(3)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">High</p>
                      <p className="font-medium">${frontMonth.high.toFixed(3)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Low</p>
                      <p className="font-medium">${frontMonth.low.toFixed(3)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Volume</p>
                      <p className="font-medium">{frontMonth.volume.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Contract Table */}
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    <th className="px-4 py-3">Contract</th>
                    <th className="px-4 py-3 text-right">Last</th>
                    <th className="px-4 py-3 text-right">Change</th>
                    <th className="px-4 py-3 text-right">Open</th>
                    <th className="px-4 py-3 text-right">High</th>
                    <th className="px-4 py-3 text-right">Low</th>
                    <th className="px-4 py-3 text-right">Volume</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {contracts?.map((contract, index) => (
                    <tr
                      key={contract.symbol}
                      className={`hover:bg-gray-50 transition-colors ${
                        index === 0 ? "bg-prairie-50" : ""
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-medium text-gray-900">
                            {contract.symbol}
                          </span>
                          <span className="text-sm text-gray-500">
                            {contract.contractMonth}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900">
                        ${contract.lastPrice.toFixed(3)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span
                            className={
                              contract.change >= 0
                                ? "text-pasture-600"
                                : "text-cornhusker-600"
                            }
                          >
                            {contract.change >= 0 ? "+" : ""}
                            {contract.change.toFixed(3)}
                          </span>
                          <TrendBadge value={contract.changePercent} />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600">
                        ${contract.open.toFixed(3)}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600">
                        ${contract.high.toFixed(3)}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600">
                        ${contract.low.toFixed(3)}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600">
                        {contract.volume.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Data Freshness Note */}
            <div className="mt-4 flex items-center gap-2 text-xs text-gray-500">
              <Clock className="w-3 h-3" />
              <span>
                Data may be delayed 15-20 minutes. Last updated:{" "}
                {data.lastUpdated
                  ? format(new Date(data.lastUpdated), "MMM d, h:mm a")
                  : "Recently"}
              </span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
