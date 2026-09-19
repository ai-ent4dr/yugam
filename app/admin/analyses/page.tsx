import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import { getAllStoredAnalyses } from "@/lib/analysis-store";

import AnalysesTable from "./analyses-table";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminAnalysesPage() {
  try {
    await requireAdmin();
  } catch {
    redirect("/login");
  }

  const analysesMap = new Map<string, any>();

  // 1. Fetch from Supabase if configured
  if (isSupabaseAdminConfigured()) {
    try {
      const adminDb = createAdminClient();
      const { data } = await adminDb
        .from("analyses")
        .select(
          `
          id,
          status,
          created_at,
          free_or_paid,
          owner_user_id,
          session_id,
          compatibility_results (overall_score),
          analysis_people (name, person_role, city, dob),
          uploads (id, storage_path, type)
        `
        )
        .order("created_at", { ascending: false })
        .limit(200);

      if (data) {
        for (const rawItem of data) {
          const item: any = rawItem;
          item.upload_count = Array.isArray(item.uploads) ? item.uploads.length : 0;
          const pA: any = (item.analysis_people || []).find((p: any) => p.person_role === "A");
          const pB: any = (item.analysis_people || []).find((p: any) => p.person_role === "B");

          if (Array.isArray(item.uploads)) {
            for (const u of item.uploads) {
              const path = u.storage_path || "";
              if (pA) {
                if (path.includes("person-a-profile") || (u.type === "profile_photo" && !pA.profilePhotoPath)) pA.profilePhotoPath = path;
                if (path.includes("person-a-hand") || (u.type === "hand_photo" && !pA.handPhotoPath)) pA.handPhotoPath = path;
                if (path.includes("person-a-jataka") || (u.type === "jataka_document" && !pA.jatakaPath)) pA.jatakaPath = path;
              }
              if (pB) {
                if (path.includes("person-b-profile")) pB.profilePhotoPath = path;
                if (path.includes("person-b-hand")) pB.handPhotoPath = path;
                if (path.includes("person-b-jataka")) pB.jatakaPath = path;
              }
            }
          }
          item.personA = pA;
          item.personB = pB;
          analysesMap.set(item.id, item);
        }
      }
    } catch {
      // Supabase fetch skipped in offline/local dev
    }
  }

  // 2. Fetch from local persistent store (including anonymous submissions)
  const localList = getAllStoredAnalyses();
  for (const rec of localList) {
    if (!analysesMap.has(rec.id)) {
      const uploadCount = [
        rec.personA?.profilePhotoPath,
        rec.personA?.handPhotoPath,
        rec.personA?.jatakaPath,
        rec.personB?.profilePhotoPath,
        rec.personB?.handPhotoPath,
        rec.personB?.jatakaPath,
      ].filter(Boolean).length;

      analysesMap.set(rec.id, {
        id: rec.id,
        status: rec.status ?? "completed",
        created_at: rec.createdAt ?? new Date().toISOString(),
        free_or_paid: "free",
        owner_user_id: rec.ownerUserId ?? null,
        session_id: rec.sessionId ?? "anonymous-session",
        compatibility_results: { overall_score: rec.match?.score ?? 70 },
        analysis_people: [
          { name: rec.personA?.name ?? "Person A", person_role: "A", city: rec.personA?.city, dob: rec.personA?.dob },
          { name: rec.personB?.name ?? "Person B", person_role: "B", city: rec.personB?.city, dob: rec.personB?.dob },
        ],
        upload_count: uploadCount,
      });
    }
  }

  const analyses = Array.from(analysesMap.values()).sort(
    (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
  );

  return (
    <main>
      <nav>
        <a className="logo" href="/">
          YUGMA <b>AI</b>
          <span className="tag">ADMIN</span>
        </a>
        <div className="nav-links">
          <a href="/admin">Dashboard</a>
          <a href="/admin/users">Users & Profiles</a>
          <a href="/">Home</a>
        </div>
      </nav>

      <div className="hero" style={{ padding: "30px 0 20px" }}>
        <p className="eyebrow">ANALYSES AUDIT DIRECTORY</p>
        <h1 style={{ fontSize: "32px" }}>All Submitted Couple Analyses ({analyses.length})</h1>
        <p className="lead" style={{ fontSize: "15px" }}>
          Instant search and administrative inspection for all submitted names, guest readings, uploaded media assets, and AI reports.
        </p>
      </div>

      <div className="panel">
        <AnalysesTable initialAnalyses={analyses} />
      </div>

      <footer>
        <div>© {new Date().getFullYear()} YUGMA AI · Authorized Administration</div>
      </footer>
    </main>
  );
}
