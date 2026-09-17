import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import { getAllStoredAnalyses } from "@/lib/analysis-store";

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
          analysis_people (name, person_role),
          uploads (id)
        `
        )
        .order("created_at", { ascending: false })
        .limit(200);

      if (data) {
        for (const item of data) {
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
          { name: rec.personA?.name ?? "Person A", person_role: "A" },
          { name: rec.personB?.name ?? "Person B", person_role: "B" },
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
          <a href="/admin/users">Users</a>
          <a href="/">Home</a>
        </div>
      </nav>

      <div className="hero" style={{ padding: "30px 0 20px" }}>
        <p className="eyebrow">ANALYSES AUDIT DIRECTORY</p>
        <h1 style={{ fontSize: "32px" }}>All Submitted Couple Analyses ({analyses.length})</h1>
        <p className="lead" style={{ fontSize: "15px" }}>
          Administrative access to submitted profiles, anonymous readings, uploaded media assets, and AI reports.
        </p>
      </div>

      <div className="panel">
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Person A & Person B</th>
              <th>Score</th>
              <th>Classification</th>
              <th>Media Uploads</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {analyses.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", color: "var(--text-muted)", padding: "30px" }}>
                  No analyses recorded yet. Submit a reading on the home page to inspect it here.
                </td>
              </tr>
            ) : (
              analyses.map((a) => {
                const personA = (a.analysis_people || []).find((p: any) => p.person_role === "A");
                const personB = (a.analysis_people || []).find((p: any) => p.person_role === "B");
                const couple = personA && personB ? `${personA.name} & ${personB.name}` : "Couple Analysis";
                const score = Array.isArray(a.compatibility_results)
                  ? a.compatibility_results[0]?.overall_score
                  : a.compatibility_results?.overall_score;

                const uploadCount =
                  a.upload_count ?? (Array.isArray(a.uploads) ? a.uploads.length : 0);

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
                          padding: "2px 8px",
                          borderRadius: "4px",
                          background: a.owner_user_id ? "rgba(228,189,117,0.15)" : "rgba(255,255,255,0.06)",
                          color: a.owner_user_id ? "var(--gold-primary)" : "var(--text-dim)",
                        }}
                      >
                        {a.owner_user_id ? "Account" : "Anonymous"}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: "12px", color: uploadCount > 0 ? "var(--gold-hover)" : "var(--text-dim)" }}>
                        {uploadCount > 0 ? `📷 ${uploadCount} file${uploadCount > 1 ? "s" : ""}` : "—"}
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
                      <a
                        href={`/admin/analyses/${a.id}`}
                        className="btn-secondary"
                        style={{ padding: "4px 12px", fontSize: "11px" }}
                      >
                        Inspect Details →
                      </a>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <footer>
        <div>© {new Date().getFullYear()} YUGMA AI · Authorized Administration</div>
      </footer>
    </main>
  );
}
