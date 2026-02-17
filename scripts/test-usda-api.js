// Find correct Nebraska cattle report slugs from MARS API
const apiKey = process.env.USDA_MARKET_NEWS_API_KEY;
const baseUrl = "https://marsapi.ams.usda.gov/services/v1.2";
const encoded = Buffer.from(`${apiKey}:`).toString("base64");
const headers = {
  "Accept": "application/json",
  "Authorization": `Basic ${encoded}`,
};

async function main() {
  // 1. List all reports and find Nebraska-specific ones
  console.log("[v0] Fetching all reports...");
  const res = await fetch(`${baseUrl}/reports`, { headers });
  const reports = await res.json();

  const neReports = reports.filter(r => {
    const str = JSON.stringify(r).toLowerCase();
    return str.includes("nebraska");
  });

  console.log(`[v0] Found ${neReports.length} Nebraska reports:\n`);
  neReports.forEach(r => {
    console.log(`[v0] ${r.slug_name} (${r.slug_id}) - ${r.report_title}`);
    console.log(`[v0]   Date: ${r.report_date} | Status: ${r.report_status}`);
    if (r.markets) console.log(`[v0]   Markets: ${JSON.stringify(r.markets).substring(0, 150)}`);
    console.log("");
  });

  // 2. Also find "direct slaughter" or "negotiated" or "5-area" national reports
  const nationalReports = reports.filter(r => {
    const title = (r.report_title || "").toLowerCase();
    return (
      title.includes("5-area") ||
      title.includes("5 area") ||
      title.includes("direct slaughter cattle") ||
      title.includes("negotiated") ||
      (title.includes("cattle") && title.includes("national") && title.includes("direct"))
    );
  });

  console.log(`[v0] Found ${nationalReports.length} national direct/negotiated cattle reports:\n`);
  nationalReports.forEach(r => {
    console.log(`[v0] ${r.slug_name} (${r.slug_id}) - ${r.report_title}`);
    console.log(`[v0]   Date: ${r.report_date} | Status: ${r.report_status}`);
    console.log("");
  });

  // 3. Try fetching data from the first active Nebraska report
  if (neReports.length > 0) {
    const recent = neReports.filter(r => r.report_status === "Final").slice(0, 3);
    for (const r of recent) {
      console.log(`[v0] Fetching data for ${r.slug_name}...`);
      const dataRes = await fetch(`${baseUrl}/reports/${r.slug_id}`, { headers });
      if (dataRes.ok) {
        const data = await dataRes.json();
        const items = Array.isArray(data) ? data : (data.results || []);
        console.log(`[v0]   SUCCESS! ${items.length} records`);
        if (items.length > 0) {
          console.log(`[v0]   Keys: ${Object.keys(items[0]).join(", ")}`);
          console.log(`[v0]   Sample: ${JSON.stringify(items[0]).substring(0, 300)}`);
        }
      } else {
        console.log(`[v0]   Failed: ${dataRes.status}`);
      }
      console.log("");
    }
  }

  // 4. NASS key issue - show the raw key bytes to diagnose whitespace
  const nassKey = process.env.USDA_NASS_API_KEY;
  console.log(`[v0] NASS key raw charCodes (first 10): ${nassKey ? [...nassKey].slice(0, 10).map(c => c.charCodeAt(0)).join(",") : "N/A"}`);
  console.log(`[v0] NASS key trimmed length: ${nassKey ? nassKey.trim().length : 0} vs raw length: ${nassKey ? nassKey.length : 0}`);
}

main().catch(err => console.error("[v0] Fatal:", err.message));
