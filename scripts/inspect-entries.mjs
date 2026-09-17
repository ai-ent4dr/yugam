import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { resolve } from "path";
import fs from "fs";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });
dotenv.config({ path: resolve(process.cwd(), ".env") });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const localDataFile = resolve(process.cwd(), ".data", "analyses.json");

async function main() {
  console.log("=".repeat(75));
  console.log("   YUGMA AI — SUBMISSIONS DIRECTORY (PEOPLE, DOB, ENTRIES & UPLOADS)");
  console.log("=".repeat(75));

  let totalEntries = 0;

  // 1. Check local persistent store
  if (fs.existsSync(localDataFile)) {
    try {
      const content = fs.readFileSync(localDataFile, "utf-8");
      const localAnalyses = JSON.parse(content);
      if (Array.isArray(localAnalyses) && localAnalyses.length > 0) {
        console.log(`\n📂 LOCAL PERSISTENT STORE (${localAnalyses.length} couple analyses found):\n`);
        localAnalyses.forEach((a, idx) => {
          totalEntries++;
          const pA = a.personA || {};
          const pB = a.personB || {};
          console.log(`[ENTRY #${totalEntries}] ${pA.name || "Person A"} & ${pB.name || "Person B"}`);
          console.log(`  - Analysis ID:     ${a.id}`);
          console.log(`  - Submitted At:    ${new Date(a.createdAt || Date.now()).toLocaleString()}`);
          console.log(`  - Status:          ${a.status || "completed"}`);
          console.log(`  - Overall Score:   ${a.match?.score ?? "—"}%`);
          console.log(`  - User Type:       ${a.ownerUserId ? "Authenticated User" : "Anonymous Guest"}`);
          console.log("");
          console.log(`  👤 PERSON A DETAILS:`);
          console.log(`     • Name:              ${pA.name || "—"}`);
          console.log(`     • Gender:            ${pA.gender || "—"}`);
          console.log(`     • Date of Birth:     ${pA.dob || "—"}`);
          console.log(`     • Time of Birth:     ${pA.tob || "Not provided"}`);
          console.log(`     • Birth Place:       ${pA.birthPlace || "—"}`);
          console.log(`     • Current City:      ${pA.city || "—"}`);
          console.log(`     • Relationship Goal: ${pA.relationshipGoal || "—"}`);
          console.log(`     • Career Goal:       ${pA.careerGoal || "—"}`);
          console.log(`     • Core Values:       ${Array.isArray(pA.values) ? pA.values.join(", ") : "—"}`);
          console.log(`     • Lifestyle:         ${Array.isArray(pA.lifestyle) ? pA.lifestyle.join(", ") : "—"}`);
          console.log(`     • Profile Photo:     ${pA.profilePhotoPath || "None"}`);
          console.log(`     • Palm Photo:        ${pA.handPhotoPath || "None"}`);
          console.log(`     • Jataka Document:   ${pA.jatakaPath || "None"}`);
          console.log("");
          console.log(`  👤 PERSON B DETAILS:`);
          console.log(`     • Name:              ${pB.name || "—"}`);
          console.log(`     • Gender:            ${pB.gender || "—"}`);
          console.log(`     • Date of Birth:     ${pB.dob || "—"}`);
          console.log(`     • Time of Birth:     ${pB.tob || "Not provided"}`);
          console.log(`     • Birth Place:       ${pB.birthPlace || "—"}`);
          console.log(`     • Current City:      ${pB.city || "—"}`);
          console.log(`     • Relationship Goal: ${pB.relationshipGoal || "—"}`);
          console.log(`     • Career Goal:       ${pB.careerGoal || "—"}`);
          console.log(`     • Core Values:       ${Array.isArray(pB.values) ? pB.values.join(", ") : "—"}`);
          console.log(`     • Lifestyle:         ${Array.isArray(pB.lifestyle) ? pB.lifestyle.join(", ") : "—"}`);
          console.log(`     • Profile Photo:     ${pB.profilePhotoPath || "None"}`);
          console.log(`     • Palm Photo:        ${pB.handPhotoPath || "None"}`);
          console.log(`     • Jataka Document:   ${pB.jatakaPath || "None"}`);
          console.log("-".repeat(75));
        });
      }
    } catch (e) {
      console.warn("Could not read local data file:", e.message);
    }
  }

  // 2. Check Supabase Database
  if (url && serviceKey) {
    try {
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
          birth_place,
          city,
          relationship_goal,
          career_goal,
          values,
          lifestyle,
          created_at
        `)
        .order("created_at", { ascending: false });

      if (!error && people && people.length > 0) {
        console.log(`\n☁️  SUPABASE POSTGRESQL (${people.length} person records found):\n`);
        people.forEach((p, idx) => {
          totalEntries++;
          console.log(`[DB RECORD #${idx + 1}] Person ${p.person_role}: ${p.name}`);
          console.log(`   - Gender:            ${p.gender || "—"}`);
          console.log(`   - Date of Birth:     ${p.dob || "—"}`);
          console.log(`   - Time of Birth:     ${p.tob || "—"}`);
          console.log(`   - Birth Place:       ${p.birth_place || "—"}`);
          console.log(`   - Current City:      ${p.city || "—"}`);
          console.log(`   - Relationship Goal: ${p.relationship_goal || "—"}`);
          console.log(`   - Analysis ID:       ${p.analysis_id}`);
          console.log(`   - Submitted:         ${new Date(p.created_at).toLocaleString()}`);
          console.log("-".repeat(75));
        });
      }
    } catch (e) {
      console.warn("Supabase check error:", e.message);
    }
  }

  if (totalEntries === 0) {
    console.log("\nNo submissions recorded yet.");
    console.log("Submit an analysis on http://localhost:3000 to record person names, DOB, and photos.\n");
  } else {
    console.log(`\n✅ Total entries inspected: ${totalEntries}`);
  }

  console.log("\n👉 To view and inspect all uploaded photos, Kundli documents, and scores in your browser:");
  console.log("   Open: http://localhost:3000/admin/analyses\n");
}

main().catch(console.error);
