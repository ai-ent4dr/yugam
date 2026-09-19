import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import { getAllStoredAnalyses } from "@/lib/analysis-store";
import AnalysesTable from "./analyses/analyses-table";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminDashboardPage() {
  try {
    await requireAdmin();
  } catch {
    redirect("/login");
  }

  let totalUsers = 0;
  const analysesMap = new Map<string, any>();

  // 1. Fetch from Supabase if configured
  if (isSupabaseAdminConfigured()) {
    try {
      const adminDb = createAdminClient();

      // Auth Users count
      const { data: authUsers } = await adminDb.auth.admin.listUsers({ page: 1, perPage: 100 });
      totalUsers = authUsers?.users?.length ?? 0;

      // Recent analyses
      const { data: dbAnalyses } = await adminDb
        .from("analyses")
        .select(
          `
          id,
          created_at,
          status,
          owner_user_id,
          compatibility_results (overall_score),
          analysis_people (name, person_role, city, dob)
        `
        )
        .order("created_at", { ascending: false })
        .limit(50);

      if (dbAnalyses) {
        for (const item of dbAnalyses) {
          analysesMap.set(item.id, item);
        }
      }
    } catch {
      // Local dev mode fallback
    }
  }

  // 2. Merge local stored analyses (anonymous entries)
  const localList = getAllStoredAnalyses();
  for (const rec of localList) {
    if (!analysesMap.has(rec.id)) {
      analysesMap.set(rec.id, {
        id: rec.id,
        status: rec.status ?? "completed",
        created_at: rec.createdAt ?? new Date().toISOString(),
        owner_user_id: rec.ownerUserId ?? null,
        compatibility_results: { overall_score: rec.match?.score ?? 70 },
        analysis_people: [
          { name: rec.personA?.name ?? "Person A", person_role: "A", city: rec.personA?.city, dob: rec.personA?.dob },
          { name: rec.personB?.name ?? "Person B", person_role: "B", city: rec.personB?.city, dob: rec.personB?.dob },
        ],
      });
    }
  }

  const allAnalyses = Array.from(analysesMap.values()).sort(
    (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
  );

  const totalAnalyses = allAnalyses.length;

  // Calculate unique individuals from searches
  const uniqueNames = new Set<string>();
  for (const a of allAnalyses) {
    const people = a.analysis_people || [];
    people.forEach((p: any) => {
      if (p.name && p.name !== "Person A" && p.name !== "Person B") {
        uniqueNames.add(p.name.trim().toLowerCase());
      }
    });
  }

  const totalProfilesCount = Math.max(totalUsers, uniqueNames.size);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayAnalyses = allAnalyses.filter(
    (a) => new Date(a.created_at || 0).getTime() >= todayStart.getTime()
  ).length;

  return (
    <main>
      <nav>
        <a className="logo" href="/">
          YUGMA <b>AI</b>
          <span className="tag">ADMIN</span>
        </a>
        <div className="nav-links">
          <a href="/admin/analyses">Analyses</a>
          <a href="/admin/users">Users & Profiles</a>
          <a href="/">Home</a>
        </div>
      </nav>

      <div className="hero" style={{ padding: "30px 0 20px" }}>
        <p className="eyebrow">AUTHORIZED PLATFORM ADMINISTRATION</p>
        <h1 style={{ fontSize: "36px" }}>Platform Operations</h1>
        <p className="lead" style={{ fontSize: "15px" }}>
          Administrative access to inspect all submitted couple analyses, searched profiles, anonymous guest entries, and uploaded documents.
        </p>
      </div>

      {/* Metrics Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "18px", marginBottom: "28px" }}>
        <div className="panel">
          <span className="step-label">COMMUNITY</span>
          <p style={{ fontSize: "36px", fontWeight: 800, color: "var(--gold-primary)", margin: "4px 0" }}>
            {totalProfilesCount}
          </p>
          <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
            {totalUsers > 0 ? `${totalUsers} Accounts · ` : ""}{uniqueNames.size} Profiles & Names
          </p>
          <a href="/admin/users" style={{ fontSize: "12px", color: "var(--gold-hover)", display: "inline-block", marginTop: "8px" }}>
            View all profiles & users →
          </a>
        </div>

        <div className="panel">
          <span className="step-label">VOLUME</span>
          <p style={{ fontSize: "36px", fontWeight: 800, color: "var(--gold-primary)", margin: "4px 0" }}>
            {totalAnalyses}
          </p>
          <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>Total Couple Analyses</p>
          <a href="/admin/analyses" style={{ fontSize: "12px", color: "var(--gold-hover)", display: "inline-block", marginTop: "8px" }}>
            View all analyses →
          </a>
        </div>

        <div className="panel">
          <span className="step-label">TODAY</span>
          <p style={{ fontSize: "36px", fontWeight: 800, color: "var(--gold-primary)", margin: "4px 0" }}>
            {todayAnalyses}
          </p>
          <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>Analyses Run Today</p>
          <span style={{ fontSize: "12px", color: "var(--text-dim)", display: "inline-block", marginTop: "8px" }}>
            Real-time pipeline
          </span>
        </div>
      </div>

      {/* Couple Analyses Table with Live Search */}
      <div className="panel">
        <div className="panel-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h2>All Searched Couple Analyses</h2>
          <a href="/admin/analyses" className="btn-secondary" style={{ fontSize: "12px", padding: "6px 14px" }}>
            Audit View ({totalAnalyses}) →
          </a>
        </div>

        <AnalysesTable initialAnalyses={allAnalyses} />
      </div>

      <footer>
        <div>© {new Date().getFullYear()} YUGMA AI · Authorized Administration</div>
      </footer>
    </main>
  );
}
