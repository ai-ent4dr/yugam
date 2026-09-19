// Test real-time query generation and photo upload indication
import assert from "assert";

const BASE = "http://localhost:3000";

async function test() {
  console.log("1. Uploading a test profile photo for Person A...");
  const formData = new FormData();
  // 1x1 test image
  const dummyPng = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    "base64"
  );
  formData.append("file", new Blob([dummyPng], { type: "image/png" }), "kabir_avatar.png");
  formData.append("analysisId", "test-live-" + Date.now());
  formData.append("kind", "person-a-profile");
  formData.append("consent", "true");

  const upRes = await fetch(`${BASE}/api/upload`, {
    method: "POST",
    body: formData,
    headers: { "Origin": BASE }
  });
  assert.strictEqual(upRes.status, 200, `Upload failed: ${upRes.status}`);
  const upData = await upRes.json();
  assert(upData.path, "Missing path in upload response");
  console.log("   ✓ Uploaded photo path:", upData.path);

  console.log("2. Submitting query with photo for Kabir Malhotra & Tara Singhania...");
  const runRes = await fetch(`${BASE}/api/analysis/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Origin": BASE },
    body: JSON.stringify({
      personA: {
        name: "Kabir Malhotra",
        gender: "male",
        profilePhotoPath: upData.path
      },
      personB: {
        name: "Tara Singhania",
        gender: "female"
      },
      modules: ["compatibility", "numerology"],
      consent: true
    })
  });
  assert.strictEqual(runRes.status, 200, `Run failed: ${runRes.status}`);
  const runData = await runRes.json();
  console.log("   ✓ Generated Analysis ID:", runData.analysisId);
  console.log("   ✓ Overall Score:", runData.match?.score);

  console.log("3. Verifying image serves via /api/admin/uploads/raw...");
  const imgRes = await fetch(`${BASE}/api/admin/uploads/raw?path=${encodeURIComponent(upData.path)}`);
  assert.strictEqual(imgRes.status, 200, `Raw image served with status ${imgRes.status}`);
  assert.strictEqual(imgRes.headers.get("content-type"), "image/png");
  console.log("   ✓ Photo served successfully with 200 OK!");

  console.log("4. Verifying real-time query in /api/admin/analyses...");
  const adminRes = await fetch(`${BASE}/api/admin/analyses`);
  assert.strictEqual(adminRes.status, 200);
  const adminList = await adminRes.json();
  const found = adminList.find((x) => x.id === runData.analysisId);
  assert(found, "Did not find newly generated analysis in admin list");
  console.log("   ✓ Found in admin feed!");
  console.log("   ✓ Upload count:", found.upload_count);
  const pA = found.analysis_people?.find((p) => p.person_role === "A");
  assert.strictEqual(pA?.profilePhotoPath, upData.path, "Person A missing photo path in admin feed");
  console.log("   ✓ Person A photo path verified:", pA?.profilePhotoPath);

  console.log("\n✅ ALL REAL-TIME & PHOTO UPLOAD TESTS PASSED!");
}

test().catch((e) => {
  console.error("Test failed:", e);
  process.exit(1);
});
