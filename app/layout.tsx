import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Nebraska Cattle Market | Live Auction & Market Data",
  description:
    "Real-time Nebraska cattle auction reports, slaughter numbers, cash prices, and live cattle futures. Your one-stop dashboard for cattle market intelligence.",
  keywords: [
    "Nebraska cattle",
    "livestock auction",
    "cattle prices",
    "sale barn",
    "USDA market reports",
    "fed cattle",
    "live cattle futures",
  ],
  openGraph: {
    title: "Nebraska Cattle Market",
    description: "Live cattle market data for Nebraska ranchers and buyers",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen flex flex-col">
          <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                <Link href="/" className="flex items-center gap-3 group">
                  <div className="flex items-center justify-center w-10 h-10 bg-cornhusker-600 rounded-lg">
                    <svg
                      className="w-6 h-6 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                      />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-gray-900 group-hover:text-cornhusker-600 transition-colors">
                      Nebraska Cattle Market
                    </h1>
                    <p className="text-xs text-gray-500 hidden sm:block">
                      Auction Reports • Cash Prices • Futures
                    </p>
                  </div>
                </Link>
                <nav className="hidden md:flex items-center gap-6">
                  <a
                    href="#auctions"
                    className="text-sm font-medium text-gray-600 hover:text-cornhusker-600 transition-colors"
                  >
                    Auctions
                  </a>
                  <a
                    href="#slaughter"
                    className="text-sm font-medium text-gray-600 hover:text-cornhusker-600 transition-colors"
                  >
                    Slaughter
                  </a>
                  <a
                    href="#cash-prices"
                    className="text-sm font-medium text-gray-600 hover:text-cornhusker-600 transition-colors"
                  >
                    Cash Prices
                  </a>
                  <a
                    href="#futures"
                    className="text-sm font-medium text-gray-600 hover:text-cornhusker-600 transition-colors"
                  >
                    Futures
                  </a>
                </nav>
                <div className="flex items-center gap-2">
                  <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-pasture-100 text-pasture-800">
                    <span className="w-2 h-2 bg-pasture-500 rounded-full mr-1.5 animate-pulse"></span>
                    Live Data
                  </span>
                </div>
              </div>
            </div>
          </header>
          <main className="flex-1">{children}</main>
          <footer className="bg-white border-t border-gray-200 py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <p className="text-sm text-gray-500">
                  Data sourced from USDA AMS, USDA NASS, and public market feeds.
                  Not financial advice.
                </p>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>Updated periodically</span>
                  <span>•</span>
                  <a
                    href="https://mymarketnews.ams.usda.gov/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-cornhusker-600 transition-colors"
                  >
                    USDA Market News
                  </a>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
