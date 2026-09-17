import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });
dotenv.config({ path: resolve(process.cwd(), ".env") });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function main() {
  console.log("=".repeat(70));
  console.log("   YUGMA AI — SUBMISSIONS DIRECTORY (PEOPLE & ENTRIES)");
  console.log("=".repeat(70));

  if (!url || !serviceKey) {
    console.log("Notice: Supabase credentials not found in environment.");
    console.log("To view submissions live in your browser without login:");
    console.log("  👉 Open http://localhost:3000/admin/analyses\n");
    return;
  }

  const supabase = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: people, error } = await supabase
    .from("analysis_people")
    .select(`
      id,
      analysis_id,
      person_role,
      name,
      gender,
      dob,
      tob,
      birthplace,
      city,
      created_at
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Database query error:", error.message);
    return;
  }

  if (!people || people.length === 0) {
    console.log("No submissions found in Supabase yet.");
    console.log("Submit an analysis on http://localhost:3000 to see entries.");
    return;
  }

  console.log(`Found ${people.length} person records:\n`);

  people.forEach((p, index) => {
    console.log(`[#${index + 1}] Person ${p.person_role}: ${p.name}`);
    console.log(`   - Gender:        ${p.gender || "—"}`);
    console.log(`   - Date of Birth: ${p.dob || "—"}`);
    console.log(`   - Time of Birth: ${p.tob || "—"}`);
    console.log(`   - Birthplace:    ${p.birthplace || "—"}`);
    console.log(`   - Current City:  ${p.city || "—"}`);
    console.log(`   - Analysis ID:   ${p.analysis_id}`);
    console.log(`   - Submitted:     ${new Date(p.created_at).toLocaleString()}`);
    console.log("-".repeat(70));
  });
}

main().catch(console.error);
