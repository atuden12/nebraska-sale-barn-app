"use client";

import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, DollarSign, Users } from "lucide-react";

interface SummaryCard {
  title: string;
  value: string;
  subtitle: string;
  trend?: "up" | "down";
  trendValue?: string;
  icon: React.ElementType;
  iconBg: string;
}

export function MarketSummary() {
  const [cards, setCards] = useState<SummaryCard[]>(getPlaceholderCards());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAll() {
      try {
        const [futuresRes, cashRes, slaughterRes] = await Promise.all([
          fetch("/api/futures").then((r) => r.json()).catch(() => null),
          fetch("/api/cash-prices").then((r) => r.json()).catch(() => null),
          fetch("/api/slaughter").then((r) => r.json()).catch(() => null),
        ]);

        const result: SummaryCard[] = [];

        // 1. Live Cattle (Front)
        const lc = futuresRes?.data?.liveCattle?.[0];
        if (lc) {
          result.push({
            title: "Live Cattle (Front)",
            value: `$${lc.lastPrice.toFixed(2)}`,
            subtitle: `CME ${lc.symbol || "LE=F"} ${lc.contractMonth || ""}`,
            trend: lc.change >= 0 ? "up" : "down",
            trendValue: `${lc.change >= 0 ? "+" : ""}${lc.changePercent.toFixed(2)}%`,
            icon: TrendingUp,
            iconBg: "bg-pasture-500",
          });
        } else {
          result.push(placeholder("Live Cattle (Front)", TrendingUp, "bg-pasture-500"));
        }

        // 2. Feeder Cattle (Front)
        const fc = futuresRes?.data?.feederCattle?.[0];
        if (fc) {
          result.push({
            title: "Feeder Cattle (Front)",
            value: `$${fc.lastPrice.toFixed(2)}`,
            subtitle: `CME ${fc.symbol || "GF=F"} ${fc.contractMonth || ""}`,
            trend: fc.change >= 0 ? "up" : "down",
            trendValue: `${fc.change >= 0 ? "+" : ""}${fc.changePercent.toFixed(2)}%`,
            icon: TrendingUp,
            iconBg: "bg-blue-500",
          });
        } else {
          result.push(placeholder("Feeder Cattle (Front)", TrendingUp, "bg-blue-500"));
        }

        // 3. NE Cash Negotiated
        const cashPrices = cashRes?.data?.prices || [];
        const neNeg =
          cashPrices.find(
            (p: any) =>
              p.priceType === "negotiated" &&
              (p.region || "").toLowerCase().includes("nebraska")
          ) || cashPrices.find((p: any) => p.priceType === "negotiated");

        if (neNeg) {
          result.push({
            title: "NE Cash Negotiated",
            value: `$${neNeg.weightedAvgPrice.toFixed(2)}`,
            subtitle: "Weekly weighted avg",
            trend: undefined,
            trendValue: undefined,
            icon: DollarSign,
            iconBg: "bg-prairie-500",
          });
        } else {
          result.push(placeholder("NE Cash Negotiated", DollarSign, "bg-prairie-500"));
        }

        // 4. Weekly Slaughter
        const slaughterWeek = slaughterRes?.data?.[0];
        if (slaughterWeek) {
          const val = slaughterWeek.cattleSlaughter;
          const display =
            val >= 1000000
              ? `${(val / 1000000).toFixed(2)}M`
              : val >= 1000
                ? `${(val / 1000).toFixed(0)}K`
                : val.toLocaleString();
          result.push({
            title: "Weekly Slaughter",
            value: display,
            subtitle: "Federally inspected (national)",
            trend: slaughterWeek.percentChangeWeek >= 0 ? "up" : "down",
            trendValue: `${slaughterWeek.percentChangeWeek >= 0 ? "+" : ""}${slaughterWeek.percentChangeWeek.toFixed(1)}%`,
            icon: Users,
            iconBg: "bg-cornhusker-500",
          });
        } else {
          result.push(placeholder("Weekly Slaughter", Users, "bg-cornhusker-500"));
        }

        setCards(result);
      } catch (err) {
        console.error("[v0] MarketSummary fetch error:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchAll();
  }, []);

  return (
    <section className="mb-8">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Market Overview</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <StatCard key={card.title} {...card} loading={loading} />
        ))}
      </div>
    </section>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  trend,
  trendValue,
  icon: Icon,
  iconBg,
  loading,
}: SummaryCard & { loading?: boolean }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">
            {loading ? (
              <span className="inline-block w-24 h-8 bg-gray-200 rounded animate-pulse" />
            ) : (
              value
            )}
          </p>
          <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
        </div>
        <div className={`p-2 rounded-lg ${iconBg}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
      {trend && trendValue && !loading && (
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

function placeholder(
  title: string,
  icon: React.ElementType,
  iconBg: string
): SummaryCard {
  return {
    title,
    value: "--",
    subtitle: "Data unavailable",
    icon,
    iconBg,
  };
}

function getPlaceholderCards(): SummaryCard[] {
  return [
    placeholder("Live Cattle (Front)", TrendingUp, "bg-pasture-500"),
    placeholder("Feeder Cattle (Front)", TrendingUp, "bg-blue-500"),
    placeholder("NE Cash Negotiated", DollarSign, "bg-prairie-500"),
    placeholder("Weekly Slaughter", Users, "bg-cornhusker-500"),
  ];
}
