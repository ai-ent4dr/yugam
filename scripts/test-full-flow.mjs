// Full automated test runner for Yugma AI MVP functionality
import assert from "assert";

const BASE_URL = "http://localhost:3000";

async function testUrl(path, expectedStatus = 200, label = "") {
  process.stdout.write(`Testing [${label || path}] ... `);
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      headers: { "User-Agent": "Yugma-Test-Agent" }
    });
    if (res.status !== expectedStatus) {
      console.log(`❌ FAILED (Status ${res.status}, expected ${expectedStatus})`);
      return false;
    }
    const text = await res.text();
    console.log(`✅ OK (Status ${res.status}, length: ${text.length} chars)`);
    return text;
  } catch (err) {
    console.log(`❌ ERROR: ${err.message}`);
    return false;
  }
}

async function runTests() {
  console.log("=".repeat(70));
  console.log("   YUGMA AI — COMPREHENSIVE END-TO-END SYSTEM TEST");
  console.log("=".repeat(70));

  let totalTests = 0;
  let passedTests = 0;

  async function check(name, fn) {
    totalTests++;
    process.stdout.write(`[TEST ${totalTests}] ${name} ... `);
    try {
      await fn();
      passedTests++;
      console.log("✅ PASSED");
    } catch (e) {
      console.log(`❌ FAILED: ${e.message}`);
    }
  }

  // 1. Pages Availability
  await check("Landing Page (GET /)", async () => {
    const html = await testUrl("/", 200, "Home");
    assert(html, "Failed to load home page");
    assert(html.includes("YUGMA") || html.includes("yugma"), "Home page missing brand");
  });

  await check("Jataka Reader Page (GET /jataka-reader)", async () => {
    const html = await testUrl("/jataka-reader", 200, "Jataka Reader");
    assert(html, "Failed to load Jataka Reader");
  });

  await check("Admin Dashboard (GET /admin/analyses)", async () => {
    const html = await testUrl("/admin/analyses", 200, "Admin Analyses");
    assert(html, "Failed to load Admin Analyses");
  });

  await check("Data Controls (GET /data-controls)", async () => {
    const html = await testUrl("/data-controls", 200, "Data Controls");
    assert(html, "Failed to load Data Controls");
  });

  await check("Login & Signup Pages", async () => {
    const login = await testUrl("/login", 200, "Login");
    const signup = await testUrl("/signup", 200, "Signup");
    assert(login && signup, "Failed login/signup");
  });

  await check("Legal & Privacy Pages", async () => {
    const priv = await testUrl("/privacy", 200, "Privacy");
    const terms = await testUrl("/terms", 200, "Terms");
    assert(priv && terms, "Failed privacy/terms");
  });

  // 2. Upload API Test
  let uploadedProfilePath = "";
  await check("File Upload API (POST /api/upload)", async () => {
    const testAnalysisId = "test-analysis-" + Date.now();
    const formData = new FormData();
    // 1x1 transparent png
    const dummyPng = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      "base64"
    );
    const blob = new Blob([dummyPng], { type: "image/png" });
    formData.append("file", blob, "test_avatar.png");
    formData.append("analysisId", testAnalysisId);
    formData.append("kind", "person-a-profile");
    formData.append("consent", "true");

    const res = await fetch(`${BASE_URL}/api/upload`, {
      method: "POST",
      body: formData,
      headers: {
        // match origin
        "Origin": BASE_URL
      }
    });

    assert.strictEqual(res.status, 200, `Upload failed with status ${res.status}`);
    const json = await res.json();
    assert(json.success, "Upload returned success: false");
    assert(json.storagePath, "Upload missing storagePath");
    uploadedProfilePath = json.storagePath;
  });

  // 3. Compatibility Analysis Run API Test
  let newAnalysisId = "";
  let calculatedScore = 0;
  await check("Full Compatibility Analysis Run (POST /api/analysis/run)", async () => {
    const payload = {
      personA: {
        name: "Aarav Kapoor",
        gender: "male",
        dob: "1994-05-12",
        tob: "14:30",
        birthPlace: "Delhi",
        city: "Bangalore",
        relationshipGoal: "Long-term Marriage",
        careerGoal: "Technology Leadership",
        lifestyle: ["Vegetarian", "Fitness Enthusiast"],
        values: ["Family Harmony", "Ambition", "Integrity"],
        profilePhotoPath: uploadedProfilePath || undefined
      },
      personB: {
        name: "Meera Nair",
        gender: "female",
        dob: "1996-09-24",
        tob: "08:15",
        birthPlace: "Kochi",
        city: "Bangalore",
        relationshipGoal: "Long-term Marriage",
        careerGoal: "Design Director",
        lifestyle: ["Vegetarian", "Yoga & Meditation"],
        values: ["Family Harmony", "Compassion", "Creativity"]
      },
      modules: [
        "compatibility",
        "numerology",
        "jataka",
        "palm",
        "career",
        "relationship"
      ],
      consent: true
    };

    const res = await fetch(`${BASE_URL}/api/analysis/run`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Origin": BASE_URL
      },
      body: JSON.stringify(payload)
    });

    assert.strictEqual(res.status, 200, `Analysis run failed with status ${res.status}`);
    const data = await res.json();

    assert(data.analysisId, "Missing analysisId in response");
    newAnalysisId = data.analysisId;

    assert(typeof data.match?.score === "number", "Missing match score");
    calculatedScore = data.match.score;

    assert(data.match.breakdown, "Missing breakdown");
    assert(data.numerology?.personA?.lifePath, "Missing numerology person A");
    assert(data.numerology?.personB?.lifePath, "Missing numerology person B");
    assert(data.numerology?.compatibility?.dynamics, "Missing numerology compat dynamics");
    assert(data.aiReport, "Missing AI Report");
    assert(data.aiReport.summary, "Missing AI Report summary");

    console.log(`\n      Calculated Overall Score: ${calculatedScore}%`);
    console.log(`      Numerology Life Path: A=${data.numerology.personA.lifePath}, B=${data.numerology.personB.lifePath}`);
    console.log(`      AI Summary: "${data.aiReport.summary.slice(0, 70)}..."`);
  });

  // 4. Analysis Result Page & Detail API Test
  await check("Analysis Result Page (GET /analysis/[id])", async () => {
    assert(newAnalysisId, "No analysisId to test");
    const html = await testUrl(`/analysis/${newAnalysisId}`, 200, "Analysis Result Page");
    assert(html, "Failed to load result page");
    assert(html.includes("Aarav Kapoor") && html.includes("Meera Nair"), "Missing couple names on result page");
  });

  await check("Analysis JSON API (GET /api/analysis/[id])", async () => {
    assert(newAnalysisId, "No analysisId to test");
    const res = await fetch(`${BASE_URL}/api/analysis/${newAnalysisId}`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    const analysis = data.analysis || data;
    assert(analysis, "Missing analysis object in response");
    assert.strictEqual(analysis.id, newAnalysisId);
    assert.strictEqual(analysis.personA.name, "Aarav Kapoor");
    assert.strictEqual(analysis.personB.name, "Meera Nair");
  });

  // 5. Admin API / List Submissions Check
  await check("Admin Analyses API / Persistence Check", async () => {
    const res = await fetch(`${BASE_URL}/api/admin/analyses`, {
      headers: { "Origin": BASE_URL }
    });
    assert.strictEqual(res.status, 200, `Admin analyses API returned ${res.status}`);
    const data = await res.json();
    const list = Array.isArray(data) ? data : (data.analyses || []);
    assert(Array.isArray(list), "Expected analyses array");
    const found = list.find((a) => a.id === newAnalysisId);
    assert(found, `Newly created analysis ${newAnalysisId} was not found in admin submissions`);
    console.log(`\n      Total Submissions in Admin Store: ${list.length}`);
  });

  // 6. Standalone Jataka Reader API Test
  await check("Standalone Jataka Reading API (POST /api/jataka/read)", async () => {
    // Upload a dummy jataka doc first
    const formData = new FormData();
    const dummyPng = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      "base64"
    );
    formData.append("file", new Blob([dummyPng], { type: "image/png" }), "jataka_chart.png");
    formData.append("analysisId", "jataka-standalone-test");
    formData.append("kind", "jataka-standalone");
    formData.append("consent", "true");

    const upRes = await fetch(`${BASE_URL}/api/upload`, {
      method: "POST",
      body: formData,
      headers: { "Origin": BASE_URL }
    });
    assert.strictEqual(upRes.status, 200);
    const upJson = await upRes.json();

    // Call Jataka read
    const jatakaRes = await fetch(`${BASE_URL}/api/jataka/read`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Origin": BASE_URL
      },
      body: JSON.stringify({
        documentPath: upJson.storagePath,
        name: "Devendra Sharma",
        dob: "1992-06-18",
        tob: "11:20",
        birthPlace: "Jaipur",
        consent: true
      })
    });

    assert.strictEqual(jatakaRes.status, 200, `Jataka read failed with status ${jatakaRes.status}`);
    const jatakaData = await jatakaRes.json();
    assert(jatakaData.success, "Jataka read returned success: false");
    assert(jatakaData.reading, "Missing jataka reading data");
    assert(jatakaData.reading.chartSummary, "Missing chart summary");
    console.log(`\n      Jataka Chart Summary: "${jatakaData.reading.chartSummary.slice(0, 70)}..."`);
  });

  console.log("=".repeat(70));
  console.log(`SUMMARY: ${passedTests}/${totalTests} TESTS PASSED!`);
  console.log("=".repeat(70));
}

runTests().catch((e) => {
  console.error("Test execution failed:", e);
  process.exit(1);
});
