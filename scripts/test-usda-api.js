// Test USDA MARS API authentication
const apiKey = process.env.USDA_MARKET_NEWS_API_KEY;
const nassKey = process.env.USDA_NASS_API_KEY;

console.log("[v0] MARS API key present:", !!apiKey, apiKey ? `(${apiKey.length} chars)` : "");
console.log("[v0] NASS API key present:", !!nassKey, nassKey ? `(${nassKey.length} chars)` : "");

if (!apiKey) {
  console.error("[v0] No USDA_MARKET_NEWS_API_KEY set, cannot test MARS API");
  process.exit(1);
}

const baseUrl = "https://marsapi.ams.usda.gov/services/v1.2";

// Test 1: Basic auth with API key as username
async function testBasicAuth() {
  const encoded = Buffer.from(`${apiKey}:`).toString("base64");
  console.log("\n[v0] === Test 1: Basic auth header ===");
  console.log("[v0] Authorization: Basic", encoded.substring(0, 10) + "...");

  const res = await fetch(`${baseUrl}/reports/LM_CT158`, {
    headers: {
      "Accept": "application/json",
      "Authorization": `Basic ${encoded}`,
    },
  });

  console.log("[v0] Status:", res.status, res.statusText);
  if (!res.ok) {
    const body = await res.text();
    console.log("[v0] Error body:", body.substring(0, 500));
  } else {
    const data = await res.json();
    console.log("[v0] SUCCESS! Records:", Array.isArray(data) ? data.length : "not array");
    if (Array.isArray(data) && data.length > 0) {
      console.log("[v0] First record keys:", Object.keys(data[0]).join(", "));
    }
  }
}

// Test 2: Raw API key in Authorization header (original approach)
async function testRawKey() {
  console.log("\n[v0] === Test 2: Raw API key in Authorization header ===");

  const res = await fetch(`${baseUrl}/reports/LM_CT158`, {
    headers: {
      "Accept": "application/json",
      "Authorization": apiKey,
    },
  });

  console.log("[v0] Status:", res.status, res.statusText);
  if (!res.ok) {
    const body = await res.text();
    console.log("[v0] Error body:", body.substring(0, 500));
  } else {
    console.log("[v0] SUCCESS!");
  }
}

// Test 3: API key as query parameter
async function testQueryParam() {
  console.log("\n[v0] === Test 3: API key as query parameter ===");

  const res = await fetch(`${baseUrl}/reports/LM_CT158?api_key=${apiKey}`, {
    headers: { "Accept": "application/json" },
  });

  console.log("[v0] Status:", res.status, res.statusText);
  if (!res.ok) {
    const body = await res.text();
    console.log("[v0] Error body:", body.substring(0, 500));
  } else {
    console.log("[v0] SUCCESS!");
  }
}

// Test 4: No auth at all (public access?)
async function testNoAuth() {
  console.log("\n[v0] === Test 4: No authentication ===");

  const res = await fetch(`${baseUrl}/reports/LM_CT158`, {
    headers: { "Accept": "application/json" },
  });

  console.log("[v0] Status:", res.status, res.statusText);
  if (!res.ok) {
    const body = await res.text();
    console.log("[v0] Error body:", body.substring(0, 500));
  } else {
    console.log("[v0] SUCCESS!");
  }
}

// Test 5: NASS API
async function testNASS() {
  if (!nassKey) {
    console.log("\n[v0] === Test 5: NASS API - SKIPPED (no key) ===");
    return;
  }

  console.log("\n[v0] === Test 5: NASS Quick Stats API ===");
  const params = new URLSearchParams({
    key: nassKey,
    format: "JSON",
    source_desc: "SURVEY",
    sector_desc: "ANIMALS & PRODUCTS",
    group_desc: "LIVESTOCK",
    commodity_desc: "CATTLE",
    statisticcat_desc: "SLAUGHTER",
    unit_desc: "HEAD",
    domain_desc: "TOTAL",
    agg_level_desc: "STATE",
    state_name: "NEBRASKA",
    freq_desc: "WEEKLY",
    year: "2025",
  });

  const res = await fetch(`https://quickstats.nass.usda.gov/api/api_GET?${params.toString()}`);

  console.log("[v0] Status:", res.status, res.statusText);
  if (!res.ok) {
    const body = await res.text();
    console.log("[v0] Error body:", body.substring(0, 500));
  } else {
    const data = await res.json();
    const records = data.data || data;
    console.log("[v0] Records:", Array.isArray(records) ? records.length : "not array");
    if (Array.isArray(records) && records.length > 0) {
      console.log("[v0] First record:", JSON.stringify(records[0]).substring(0, 300));
    } else {
      console.log("[v0] Full response:", JSON.stringify(data).substring(0, 500));
    }
  }
}

async function main() {
  await testBasicAuth();
  await testRawKey();
  await testQueryParam();
  await testNoAuth();
  await testNASS();
  console.log("\n[v0] All tests complete.");
}

main().catch(err => {
  console.error("[v0] Fatal error:", err.message);
  process.exit(1);
});
