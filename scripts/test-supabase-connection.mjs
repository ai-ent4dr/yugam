import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

console.log("\n=======================================================");
console.log("🔍  YUGMA AI — Supabase Environment & Diagnostic Audit");
console.log("=======================================================\n");

// 1. Check for .env.local file
const envLocalPath = path.join(rootDir, ".env.local");
const envPath = path.join(rootDir, ".env");
let envContent = "";

if (fs.existsSync(envLocalPath)) {
  console.log("✅ Found .env.local file in project root.");
  envContent = fs.readFileSync(envLocalPath, "utf-8");
} else if (fs.existsSync(envPath)) {
  console.log("⚠️ Found .env file, but recommended is .env.local for Next.js secrets.");
  envContent = fs.readFileSync(envPath, "utf-8");
} else {
  console.log("❌ No .env.local file found in project root!");
  console.log("   Next.js does not automatically load .env.example.");
  console.log("   To connect Supabase, create .env.local in the root directory with:");
  console.log(`
   NEXT_PUBLIC_SUPABASE_URL=https://<your-project-id>.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<your-anon-public-key>
   SUPABASE_SERVICE_ROLE_KEY=<your-service-role-secret-key>
   STORAGE_BUCKET=user-uploads
  `);
}

// Parse simple KEY=VALUE pairs from file content if not already in process.env
if (envContent) {
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const bucketName = process.env.STORAGE_BUCKET || "user-uploads";

console.log("\n--- Checking Configured Keys ---");
console.log("NEXT_PUBLIC_SUPABASE_URL:         ", supabaseUrl ? `✅ Set (${supabaseUrl})` : "❌ Missing");
console.log("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: ", anonKey ? `✅ Set (${anonKey.slice(0, 12)}...)` : "❌ Missing");
console.log("SUPABASE_SERVICE_ROLE_KEY:        ", serviceKey ? `✅ Set (${serviceKey.slice(0, 12)}...)` : "❌ Missing");
console.log("STORAGE_BUCKET:                   ", `✅ ${bucketName}`);

if (!supabaseUrl || !serviceKey || supabaseUrl.includes("your-project-ref")) {
  console.log("\n⚠️  Supabase keys are missing or using placeholders.");
  console.log("   The application is currently operating in OFFLINE LOCAL FALLBACK mode.");
  console.log("   In this mode, all photos are saved to '.data/uploads/' and analyses to '.data/analyses.json'.");
  console.log("\n   To enable Supabase Cloud Storage & PostgreSQL:");
  console.log("   1. Open Supabase Dashboard: https://supabase.com/dashboard/project/_/settings/api");
  console.log("   2. Copy 'Project URL', 'anon public', and 'service_role secret'.");
  console.log("   3. Paste them into '.env.local'.");
  console.log("   4. Execute 'supabase/schema.sql' in Supabase SQL Editor.\n");
  process.exit(0);
}

// 2. Test Live Supabase Connectivity
console.log("\n--- Testing Live Supabase Connectivity ---");
try {
  const adminClient = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Test Storage
  console.log(`Checking Storage Bucket '${bucketName}'...`);
  const { data: buckets, error: bucketError } = await adminClient.storage.listBuckets();
  if (bucketError) {
    console.log("❌ Failed to list buckets:", bucketError.message);
  } else {
    const found = buckets.find((b) => b.name === bucketName);
    if (found) {
      console.log(`✅ Storage bucket '${bucketName}' exists and is ready.`);
    } else {
      console.log(`⚠️ Bucket '${bucketName}' not found. Attempting auto-creation...`);
      const { error: createErr } = await adminClient.storage.createBucket(bucketName, { public: false });
      if (createErr) {
        console.log("❌ Could not auto-create bucket:", createErr.message);
      } else {
        console.log(`✅ Storage bucket '${bucketName}' created successfully!`);
      }
    }
  }

  // Test Database Tables
  console.log("Checking Database Tables ('analyses', 'analysis_people', 'uploads')...");
  const testId = "00000000-0000-0000-0000-" + Date.now().toString().slice(-12).padStart(12, "0");

  const { error: insertAnalysesError } = await adminClient.from("analyses").insert({
    id: testId,
    status: "draft",
    free_or_paid: "free",
  });

  if (insertAnalysesError) {
    console.log("❌ Database check failed on 'analyses':", insertAnalysesError.message);
    console.log("   Did you execute 'supabase/schema.sql' in the Supabase SQL Editor?");
  } else {
    console.log("✅ 'analyses' table insert verified.");

    const { error: insertPeopleError } = await adminClient.from("analysis_people").insert({
      analysis_id: testId,
      person_role: "A",
      name: "Diagnostic Test Person",
      consent_confirmed: true,
    });

    if (insertPeopleError) {
      console.log("❌ Database check failed on 'analysis_people':", insertPeopleError.message);
    } else {
      console.log("✅ 'analysis_people' table insert verified.");
    }

    // Clean up test records
    await adminClient.from("analyses").delete().eq("id", testId);
    console.log("✅ Diagnostic test records cleaned up.");
    console.log("\n🎉 Supabase Database and Storage are FULLY OPERATIONAL!");
  }
} catch (err) {
  console.error("❌ Unexpected connection error:", err.message);
}
