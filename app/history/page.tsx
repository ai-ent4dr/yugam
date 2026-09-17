import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function HistoryPage() {
  const user = await getCurrentUser().catch(() => null);
  if (!user) {
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
        analysis_people (name, person_role),
        compatibility_results (overall_score)
      `
      )
      .eq("owner_user_id", user.id)
      .order("created_at", { ascending: false });

    analyses = data ?? [];
  } catch {
    // Database empty or setup in progress
  }

  return (
    <main>
      <nav>
        <a className="logo" href="/">
          YUGMA <b>AI</b>
        </a>
        <div className="nav-links">
          <a href="/">New Reading</a>
          <a href="/profile">Profile</a>
          <a href="/account">Account</a>
          <a href="/data-controls">Data Controls</a>
        </div>
      </nav>

      <div className="hero" style={{ padding: "40px 0 20px" }}>
        <p className="eyebrow">YOUR SAVED READINGS</p>
        <h1 style={{ fontSize: "36px" }}>Reading History</h1>
        <p className="lead" style={{ fontSize: "16px" }}>
          Signed in as <b>{user.email}</b>. All your past analyses and reports are stored securely and privately.
        </p>
      </div>

      <div className="panel">
        <div className="panel-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2>Past Compatibility Analyses</h2>
          <a href="/" className="btn-primary" style={{ padding: "8px 16px", fontSize: "13px" }}>
            + Start New Reading
          </a>
        </div>

        {analyses.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 20px" }}>
            <p style={{ color: "var(--text-muted)", marginBottom: "16px" }}>
              No analyses saved yet. Complete a couple compatibility reading to view it here.
            </p>
            <a href="/" className="btn-secondary">
              Run Free Analysis Now
            </a>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Couple</th>
                <th>Compatibility Score</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {analyses.map((item) => {
                const personA = (item.analysis_people || []).find((p: any) => p.person_role === "A");
                const personB = (item.analysis_people || []).find((p: any) => p.person_role === "B");
                const coupleName =
                  personA && personB
                    ? `${personA.name} & ${personB.name}`
                    : "Couple Analysis";
                const score = Array.isArray(item.compatibility_results)
                  ? item.compatibility_results[0]?.overall_score
                  : item.compatibility_results?.overall_score;

                return (
                  <tr key={item.id}>
                    <td>{new Date(item.created_at).toLocaleDateString()}</td>
                    <td style={{ fontWeight: 600 }}>{coupleName}</td>
                    <td>
                      <span style={{ color: "var(--gold-primary)", fontWeight: 700 }}>
                        {score !== undefined ? `${score}%` : "—"}
                      </span>
                    </td>
                    <td>
                      <span
                        style={{
                          textTransform: "capitalize",
                          fontSize: "11px",
                          padding: "2px 8px",
                          borderRadius: "4px",
                          background: item.status === "completed" ? "rgba(46, 204, 113, 0.15)" : "rgba(255, 255, 255, 0.1)",
                          color: item.status === "completed" ? "#2ecc71" : "var(--text-muted)",
                        }}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td>
                      <a
                        href={`/analysis/${item.id}`}
                        className="btn-secondary"
                        style={{ padding: "6px 12px", fontSize: "12px", marginRight: "8px" }}
                      >
                        Open Report →
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
        <div>© {new Date().getFullYear()} YUGMA AI · Where two journeys meet.</div>
        <div className="footer-links">
          <a href="/data-controls">Data Controls</a>
          <a href="/privacy">Privacy</a>
          <a href="/terms">Terms</a>
        </div>
      </footer>
    </main>
  );
}
