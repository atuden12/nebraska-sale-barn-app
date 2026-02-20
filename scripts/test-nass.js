var key = (process.env.USDA_NASS_API_KEY || "").trim();
console.log("Key present:", !!key, "len:", key.length);

async function run() {
  if (!key) { console.log("No key"); return; }

  var base = "https://quickstats.nass.usda.gov/api";

  // 1) Find slaughter-related statisticcat_desc for CATTLE
  var r1 = await fetch(base + "/get_param_values?key=" + key + "&param=statisticcat_desc&commodity_desc=CATTLE");
  var j1 = await r1.json();
  var all = j1.statisticcat_desc || [];
  var slaughter = all.filter(function(v) { return v.toLowerCase().indexOf("slaughter") >= 0; });
  console.log("Slaughter stats:", JSON.stringify(slaughter));

  // 2) Find commodities with SLAUGHTER
  var r2 = await fetch(base + "/get_param_values?key=" + key + "&param=commodity_desc&statisticcat_desc=SLAUGHTER");
  var j2 = await r2.json();
  console.log("Commodities with SLAUGHTER:", JSON.stringify((j2.commodity_desc || []).slice(0, 20)));

  // 3) Try CATTLE / INVENTORY (known good query)
  var r3 = await fetch(base + "/api_GET?key=" + key + "&format=JSON&commodity_desc=CATTLE&statisticcat_desc=INVENTORY&freq_desc=ANNUAL&year=2024&agg_level_desc=NATIONAL");
  console.log("CATTLE INVENTORY status:", r3.status);
  if (r3.ok) {
    var j3 = await r3.json();
    console.log("  records:", (j3.data || []).length);
    if (j3.data && j3.data[0]) console.log("  sample:", JSON.stringify(j3.data[0]).substring(0, 300));
  }

  // 4) Try CATTLE / SALES FOR SLAUGHTER / ANNUAL / 2024
  var r4 = await fetch(base + "/api_GET?key=" + key + "&format=JSON&commodity_desc=CATTLE&statisticcat_desc=SALES%20FOR%20SLAUGHTER&freq_desc=ANNUAL&year=2024&agg_level_desc=NATIONAL");
  console.log("CATTLE SALES FOR SLAUGHTER status:", r4.status);
  var t4 = await r4.text();
  console.log("  body:", t4.substring(0, 300));

  // 5) Try CATTLE / SLAUGHTERED / ANNUAL / 2024
  var r5 = await fetch(base + "/api_GET?key=" + key + "&format=JSON&commodity_desc=CATTLE&statisticcat_desc=SLAUGHTERED&freq_desc=ANNUAL&year=2024");
  console.log("CATTLE SLAUGHTERED status:", r5.status);
  var t5 = await r5.text();
  console.log("  body:", t5.substring(0, 300));

  // 6) If commodities found with SLAUGHTER, try first cattle one
  var cattleComms = (j2.commodity_desc || []).filter(function(c) { return c.indexOf("CATTLE") >= 0; });
  for (var i = 0; i < cattleComms.length; i++) {
    var comm = cattleComms[i];
    var r6f = await fetch(base + "/get_param_values?key=" + key + "&param=freq_desc&commodity_desc=" + encodeURIComponent(comm) + "&statisticcat_desc=SLAUGHTER");
    var j6f = await r6f.json();
    console.log(comm + " SLAUGHTER freqs:", JSON.stringify(j6f.freq_desc));
    
    var freqs = j6f.freq_desc || [];
    for (var f = 0; f < Math.min(freqs.length, 2); f++) {
      var r6 = await fetch(base + "/api_GET?key=" + key + "&format=JSON&commodity_desc=" + encodeURIComponent(comm) + "&statisticcat_desc=SLAUGHTER&freq_desc=" + encodeURIComponent(freqs[f]) + "&year=2025");
      console.log("  " + comm + "/" + freqs[f] + " status:", r6.status);
      var t6 = await r6.text();
      console.log("  body:", t6.substring(0, 300));
    }
  }
}

run().catch(function(e) { console.error("ERROR:", e.message); });
