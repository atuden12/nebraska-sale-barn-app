# Nebraska Cattle Market

A real-time dashboard for Nebraska cattle market data, including auction reports, slaughter numbers, cash prices, and live cattle futures.

![Nebraska Cattle Market Dashboard](./docs/screenshot.png)

## Features

- **Auction Sales** - Weekly livestock auction summaries from Nebraska sale barns
- **Slaughter Numbers** - Federally inspected cattle slaughter data (Nebraska & national)
- **Cash Prices** - Negotiated, formula, and forward contract prices for fed cattle
- **Futures Prices** - CME Live Cattle and Feeder Cattle contract data
- **Responsive Design** - Works great on desktop, tablet, and mobile devices
- **Auto-Refresh** - Data updates automatically with sensible caching intervals
- **Manual Refresh** - Each section can be refreshed independently

## Tech Stack

- [Next.js 14](https://nextjs.org/) - React framework with App Router
- [TypeScript](https://www.typescriptlang.org/) - Type-safe JavaScript
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS
- [Recharts](https://recharts.org/) - Composable charting library
- [Lucide React](https://lucide.dev/) - Beautiful icons
- [date-fns](https://date-fns.org/) - Date formatting utilities

## Getting Started

### Prerequisites

- Node.js 18.17 or later
- npm, yarn, or pnpm

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/nebraska-cattle-market.git
   cd nebraska-cattle-market
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```

4. Edit `.env.local` and add your API keys (see API Keys section below).

5. Run the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## API Keys

The application uses several USDA and market data APIs. While demo data is shown when APIs are unavailable, you'll want to get API keys for production use.

### USDA MyMarketNews API

Used for auction sales and cash price data.

1. Visit [https://mymarketnews.ams.usda.gov/mymarketnews-api](https://mymarketnews.ams.usda.gov/mymarketnews-api)
2. Click "Get API Key" and follow the registration process
3. Add to `.env.local`:
   ```
   USDA_MARKET_NEWS_API_KEY=your_api_key_here
   ```

**Key Reports Used:**
- `LM_CT155` - Nebraska Weekly Direct Slaughter Cattle
- `LM_CT169` - 5-Area Weekly Weighted Average
- `LM_CT758` - Nebraska Auction Summary
- `LM_CT100` - Weekly Slaughter Summary

### USDA NASS Quick Stats API

Used for slaughter and inventory data.

1. Visit [https://quickstats.nass.usda.gov/api](https://quickstats.nass.usda.gov/api)
2. Click "Request API Key" and provide your email
3. You'll receive a key via email within minutes
4. Add to `.env.local`:
   ```
   USDA_NASS_API_KEY=your_api_key_here
   ```

### Futures Data

The application fetches delayed futures data from publicly available sources (Yahoo Finance). For real-time CME data, consider:

- **CME DataMine**: [https://www.cmegroup.com/market-data/datamine-api.html](https://www.cmegroup.com/market-data/datamine-api.html)
- **Barchart OnDemand**: [https://www.barchart.com/ondemand](https://www.barchart.com/ondemand)

These services require paid subscriptions for real-time data.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `USDA_MARKET_NEWS_API_KEY` | No* | USDA AMS MyMarketNews API key |
| `USDA_NASS_API_KEY` | No* | USDA NASS Quick Stats API key |

*The app will work without API keys using demo/cached data, but live data requires valid keys.

## Deploying to Vercel

The easiest way to deploy this app is through Vercel.

### Option 1: Deploy with Vercel CLI

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Deploy:
   ```bash
   vercel
   ```

3. Add environment variables in the Vercel dashboard.

### Option 2: Deploy from GitHub

1. Push your code to GitHub
2. Import the project at [vercel.com/new](https://vercel.com/new)
3. Add environment variables during setup
4. Deploy!

### Environment Variables on Vercel

Add these in your Vercel project settings (Settings → Environment Variables):

- `USDA_MARKET_NEWS_API_KEY`
- `USDA_NASS_API_KEY`

## Data Refresh Intervals

The app uses Next.js ISR (Incremental Static Regeneration) for efficient caching:

| Data Type | Revalidation Interval |
|-----------|----------------------|
| Futures | 15 minutes |
| Cash Prices | 1 hour |
| Slaughter | 1 hour |
| Auctions | 2 hours |

## Project Structure

```
nebraska-cattle-market/
├── app/
│   ├── api/                  # API routes
│   │   ├── auctions/
│   │   ├── cash-prices/
│   │   ├── futures/
│   │   └── slaughter/
│   ├── globals.css           # Global styles
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Dashboard page
├── components/
│   ├── sections/             # Data section components
│   │   ├── AuctionSales.tsx
│   │   ├── CashPrices.tsx
│   │   ├── FuturesPrices.tsx
│   │   ├── PriceChart.tsx
│   │   └── SlaughterData.tsx
│   └── ui/                   # Reusable UI components
│       ├── Badge.tsx
│       ├── Card.tsx
│       ├── ErrorMessage.tsx
│       ├── LoadingSkeleton.tsx
│       └── RefreshButton.tsx
├── lib/
│   ├── api/                  # API client functions
│   │   ├── futures.ts
│   │   ├── usda-market-news.ts
│   │   └── usda-nass.ts
│   └── types.ts              # TypeScript types
├── .env.example              # Example environment variables
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

## USDA Report Codes Reference

For those wanting to explore more USDA data:

### Livestock Mandatory Reporting (LM)
- `LM_CT150` - National Weekly Direct Slaughter Cattle
- `LM_CT155` - Nebraska Weekly Direct Slaughter Cattle
- `LM_CT169` - 5-Area Weekly Weighted Average
- `LM_CT100` - Weekly Cattle Slaughter Summary

### Auction Market Reports
- `LM_CT758` - Nebraska Auction Summary
- `LM_CT712` - North Central Nebraska Auctions

### Other Useful Reports
- `LM_CT160` - Texas-Oklahoma-New Mexico Weekly
- `LM_CT163` - Kansas Weekly Direct
- `LM_CT175` - Weekly Boxed Beef

Full list available at [USDA Market News](https://mymarketnews.ams.usda.gov/).

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the [MIT License](LICENSE).

## Disclaimer

This application is for informational and educational purposes only. The data displayed may be delayed or incomplete. Always verify market information with official USDA and CME Group sources before making any financial or trading decisions.

---

Built with 🐄 for Nebraska cattle producers
