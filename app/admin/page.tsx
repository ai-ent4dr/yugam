import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import { getAllStoredAnalyses } from "@/lib/analysis-store";

export default async function AdminDashboardPage() {
  try {
    await requireAdmin();
  } catch {
    redirect("/login");
  }

  let totalUsers = 0;
  let recentProfiles: any[] = [];
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
          analysis_people (name, person_role)
        `
        )
        .order("created_at", { ascending: false })
        .limit(20);

      if (dbAnalyses) {
        for (const item of dbAnalyses) {
          analysesMap.set(item.id, item);
        }
      }

      // Recent profiles
      const { data: profiles } = await adminDb
        .from("profiles")
        .select("user_id, name, created_at, city")
        .order("created_at", { ascending: false })
        .limit(6);
      recentProfiles = profiles ?? [];
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
          { name: rec.personA?.name ?? "Person A", person_role: "A" },
          { name: rec.personB?.name ?? "Person B", person_role: "B" },
        ],
      });
    }
  }

  const allAnalyses = Array.from(analysesMap.values()).sort(
    (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
  );

  const totalAnalyses = allAnalyses.length;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayAnalyses = allAnalyses.filter(
    (a) => new Date(a.created_at || 0).getTime() >= todayStart.getTime()
  ).length;

  const recentAnalyses = allAnalyses.slice(0, 8);

  return (
    <main>
      <nav>
        <a className="logo" href="/">
          YUGMA <b>AI</b>
          <span className="tag">ADMIN</span>
        </a>
        <div className="nav-links">
          <a href="/admin/analyses">Analyses</a>
          <a href="/admin/users">Users</a>
          <a href="/">Home</a>
        </div>
      </nav>

      <div className="hero" style={{ padding: "30px 0 20px" }}>
        <p className="eyebrow">AUTHORIZED PLATFORM ADMINISTRATION</p>
        <h1 style={{ fontSize: "36px" }}>Platform Operations</h1>
        <p className="lead" style={{ fontSize: "15px" }}>
          Administrative access to inspect all submitted couple analyses, anonymous guest entries, and uploaded documents.
        </p>
      </div>

      {/* Metrics Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "18px", marginBottom: "28px" }}>
        <div className="panel">
          <span className="step-label">COMMUNITY</span>
          <p style={{ fontSize: "36px", fontWeight: 800, color: "var(--gold-primary)", margin: "4px 0" }}>
            {totalUsers}
          </p>
          <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>Registered Accounts</p>
          <a href="/admin/users" style={{ fontSize: "12px", color: "var(--gold-hover)", display: "inline-block", marginTop: "8px" }}>
            View all users →
          </a>
        </div>

        <div className="panel">
          <span className="step-label">VOLUME</span>
          <p style={{ fontSize: "36px", fontWeight: 800, color: "var(--gold-primary)", margin: "4px 0" }}>
            {totalAnalyses}
          </p>
          <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>Total Analyses Conducted</p>
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

      {/* Recent Analyses Table */}
      <div className="panel">
        <div className="panel-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2>Recent Couple Analyses</h2>
          <a href="/admin/analyses" className="btn-secondary" style={{ fontSize: "12px", padding: "6px 14px" }}>
            View All ({totalAnalyses}) →
          </a>
        </div>

        {recentAnalyses.length === 0 ? (
          <p style={{ color: "var(--text-muted)", padding: "20px 0" }}>
            No analyses recorded yet. Start by filling out a reading on the home page!
          </p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Couple Name</th>
                <th>Compatibility Score</th>
                <th>Type</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {recentAnalyses.map((a) => {
                const personA = (a.analysis_people || []).find((p: any) => p.person_role === "A");
                const personB = (a.analysis_people || []).find((p: any) => p.person_role === "B");
                const couple = personA && personB ? `${personA.name} & ${personB.name}` : "Couple Analysis";
                const score = Array.isArray(a.compatibility_results)
                  ? a.compatibility_results[0]?.overall_score
                  : a.compatibility_results?.overall_score;

                return (
                  <tr key={a.id}>
                    <td style={{ fontSize: "12px" }}>{new Date(a.created_at).toLocaleString()}</td>
                    <td style={{ fontWeight: 600 }}>{couple}</td>
                    <td style={{ color: "var(--gold-primary)", fontWeight: 700 }}>
                      {score !== undefined ? `${score}%` : "—"}
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: "11px",
                          padding: "2px 6px",
                          borderRadius: "4px",
                          background: a.owner_user_id ? "rgba(228,189,117,0.15)" : "rgba(255,255,255,0.06)",
                          color: a.owner_user_id ? "var(--gold-primary)" : "var(--text-dim)",
                        }}
                      >
                        {a.owner_user_id ? "Account" : "Anonymous"}
                      </span>
                    </td>
                    <td>
                      <span
                        style={{
                          textTransform: "capitalize",
                          fontSize: "11px",
                          padding: "2px 8px",
                          borderRadius: "4px",
                          background: a.status === "completed" ? "rgba(46, 204, 113, 0.15)" : "rgba(255, 255, 255, 0.1)",
                          color: a.status === "completed" ? "#2ecc71" : "var(--text-muted)",
                        }}
                      >
                        {a.status}
                      </span>
                    </td>
                    <td>
                      <a href={`/admin/analyses/${a.id}`} className="btn-secondary" style={{ padding: "4px 12px", fontSize: "11px" }}>
                        Inspect →
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <footer>
        <div>© {new Date().getFullYear()} YUGMA AI · Authorized Administration</div>
      </footer>
    </main>
  );
}
