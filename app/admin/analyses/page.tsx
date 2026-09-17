import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function AdminAnalysesPage() {
  try {
    await requireAdmin();
  } catch {
    redirect("/login");
  }

  let analyses: any[] = [];

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
        analysis_people (name, person_role)
      `
      )
      .order("created_at", { ascending: false })
      .limit(100);

    analyses = data ?? [];
  } catch {
    // Local dev fallback
  }

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
          <a href="/account">Account</a>
        </div>
      </nav>

      <div className="hero" style={{ padding: "30px 0 20px" }}>
        <p className="eyebrow">ANALYSES AUDIT DIRECTORY</p>
        <h1 style={{ fontSize: "32px" }}>All Submitted Couple Analyses</h1>
        <p className="lead" style={{ fontSize: "15px" }}>
          Administrative access to compatibility records, upload manifests, and AI interpretations.
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
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {analyses.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", color: "var(--text-muted)", padding: "30px" }}>
                  No analyses recorded in database.
                </td>
              </tr>
            ) : (
              analyses.map((a) => {
                const personA = (a.analysis_people || []).find((p: any) => p.person_role === "A");
                const personB = (a.analysis_people || []).find((p: any) => p.person_role === "B");
                const couple = personA && personB ? `${personA.name} & ${personB.name}` : "Couple";
                const score = Array.isArray(a.compatibility_results)
                  ? a.compatibility_results[0]?.overall_score
                  : a.compatibility_results?.overall_score;

                return (
                  <tr key={a.id}>
                    <td>{new Date(a.created_at).toLocaleString()}</td>
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
                      <a
                        href={`/admin/analyses/${a.id}`}
                        className="btn-secondary"
                        style={{ padding: "4px 10px", fontSize: "11px" }}
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
