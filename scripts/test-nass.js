// Test NASS Quick Stats API with different parameter combinations
const NASS_BASE = "https://quickstats.nass.usda.gov/api/api_GET";
const key = process.env.USDA_NASS_API_KEY?.trim();
const year = new Date().getFullYear();

async function testQuery(label, params) {
  const qs = new URLSearchParams({ key, format: "JSON", ...params });
  const url = `${NASS_BASE}?${qs}`;
  console.log(`\n--- ${label} ---`);
  try {
    const res = await fetch(url);
    const text = await res.text();
    if (!res.ok) {
      console.log(`  STATUS: ${res.status}`);
      console.log(`  ERROR: ${text.substring(0, 200)}`);
      return;
    }
    const json = JSON.parse(text);
    const data = json.data || [];
    console.log(`  STATUS: ${res.status}, records: ${data.length}`);
    if (data.length > 0) {
      console.log(`  FIRST RECORD KEYS:`, Object.keys(data[0]).join(", "));
      console.log(`  SAMPLE:`, JSON.stringify(data[0]).substring(0, 300));
    }
  } catch (e) {
    console.log(`  EXCEPTION: ${e.message}`);
  }
}

async function main() {
  console.log("NASS API key:", key ? `${key.substring(0, 4)}... (len=${key.length})` : "MISSING");

  // First check what param values are valid for cattle slaughter
  // Test 1: Minimal query - just cattle slaughter
  await testQuery("Test 1: Minimal cattle slaughter", {
    commodity_desc: "CATTLE",
    statisticcat_desc: "SLAUGHTER",
    year: `${year}`,
  });

  // Test 2: Same but with fewer constraints
  await testQuery("Test 2: Cattle slaughter with source_desc", {
    source_desc: "SURVEY",
    commodity_desc: "CATTLE",
    statisticcat_desc: "SLAUGHTER",
    year: `${year}`,
  });

  // Test 3: Try without domain_desc
  await testQuery("Test 3: With group and sector, no domain", {
    source_desc: "SURVEY",
    sector_desc: "ANIMALS & PRODUCTS",
    commodity_desc: "CATTLE",
    statisticcat_desc: "SLAUGHTER",
    year: `${year}`,
  });

  // Test 4: Try ANNUAL frequency
  await testQuery("Test 4: Annual frequency", {
    source_desc: "SURVEY",
    commodity_desc: "CATTLE",
    statisticcat_desc: "SLAUGHTER",
    freq_desc: "ANNUAL",
    year: `${year}`,
  });

  // Test 5: Try MONTHLY frequency  
  await testQuery("Test 5: Monthly frequency", {
    source_desc: "SURVEY",
    commodity_desc: "CATTLE",
    statisticcat_desc: "SLAUGHTER",
    freq_desc: "MONTHLY",
    year: `${year}`,
  });

  // Test 6: Try WEEKLY frequency
  await testQuery("Test 6: Weekly frequency", {
    source_desc: "SURVEY",
    commodity_desc: "CATTLE",
    statisticcat_desc: "SLAUGHTER",
    freq_desc: "WEEKLY",
    year: `${year}`,
  });

  // Test 7: Try slaughter + FI (federally inspected)
  await testQuery("Test 7: Slaughter FI", {
    source_desc: "SURVEY",
    commodity_desc: "CATTLE",
    statisticcat_desc: "SLAUGHTER",
    domain_desc: "TOTAL",
    year: `${year}`,
  });

  // Test 8: Previous year in case current year has no data yet
  await testQuery("Test 8: Previous year", {
    source_desc: "SURVEY",
    commodity_desc: "CATTLE",
    statisticcat_desc: "SLAUGHTER",
    year: `${year - 1}`,
  });

  // Test 9: Slaughter COMMERCIAL (different statisticcat)
  await testQuery("Test 9: SLAUGHTER, COMMERCIAL, FI", {
    source_desc: "SURVEY",
    commodity_desc: "CATTLE",
    statisticcat_desc: "SLAUGHTER, COMMERCIAL, FI",
    year: `${year - 1}`,
  });

  // Test 10: Use get_param_values to check valid statisticcat_desc
  const pvUrl = `https://quickstats.nass.usda.gov/api/get_param_values?key=${key}&param=statisticcat_desc&commodity_desc=CATTLE&source_desc=SURVEY`;
  console.log("\n--- Test 10: Valid statisticcat_desc values for CATTLE ---");
  try {
    const res = await fetch(pvUrl);
    const json = await res.json();
    const vals = json.statisticcat_desc || [];
    const slaughterVals = vals.filter(v => v.toLowerCase().includes("slaughter"));
    console.log(`  Total values: ${vals.length}`);
    console.log(`  Slaughter-related:`, slaughterVals);
  } catch (e) {
    console.log(`  ERROR: ${e.message}`);
  }

  // Test 11: Check valid freq_desc values for cattle slaughter
  const fUrl = `https://quickstats.nass.usda.gov/api/get_param_values?key=${key}&param=freq_desc&commodity_desc=CATTLE&statisticcat_desc=SLAUGHTER&source_desc=SURVEY`;
  console.log("\n--- Test 11: Valid freq_desc for CATTLE SLAUGHTER ---");
  try {
    const res = await fetch(fUrl);
    const json = await res.json();
    console.log(`  Values:`, json.freq_desc);
  } catch (e) {
    console.log(`  ERROR: ${e.message}`);
  }

  // Test 12: Check valid domain_desc for cattle slaughter
  const dUrl = `https://quickstats.nass.usda.gov/api/get_param_values?key=${key}&param=domain_desc&commodity_desc=CATTLE&statisticcat_desc=SLAUGHTER&source_desc=SURVEY`;
  console.log("\n--- Test 12: Valid domain_desc for CATTLE SLAUGHTER ---");
  try {
    const res = await fetch(dUrl);
    const json = await res.json();
    console.log(`  Values:`, json.domain_desc);
  } catch (e) {
    console.log(`  ERROR: ${e.message}`);
  }
}

main();
