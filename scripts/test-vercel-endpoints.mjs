const baseUrl = "https://yugam-g8o6.vercel.app";

async function testEndpoint(name, url, options = {}) {
  try {
    const res = await fetch(baseUrl + url, {
      headers: {
        "Origin": baseUrl,
        ...(options.headers || {}),
      },
      ...options,
    });
    const text = await res.text();
    console.log(`[${name}] Status: ${res.status} ${res.statusText}`);
    try {
      const json = JSON.parse(text);
      console.log(`   Response:`, JSON.stringify(json).slice(0, 200));
    } catch {
      console.log(`   Text:`, text.slice(0, 150));
    }
  } catch (err) {
    console.error(`[${name}] Failed:`, err.message);
  }
}

console.log("=== Testing Vercel Endpoints ===");
await testEndpoint("Analysis Create", "/api/analysis/create", { method: "POST" });
await testEndpoint("Admin Analyses API", "/api/admin/analyses");
