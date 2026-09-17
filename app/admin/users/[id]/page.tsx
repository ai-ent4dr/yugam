import { notFound, redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  try {
    await requireAdmin();
  } catch {
    redirect("/login");
  }

  const { id } = await params;
  let user: any = null;
  let profile: any = null;
  let analyses: any[] = [];

  try {
    const adminDb = createAdminClient();
    const { data: authData } = await adminDb.auth.admin.getUserById(id);
    user = authData?.user;

    const { data: p } = await adminDb.from("profiles").select("*").eq("user_id", id).maybeSingle();
    profile = p;

    const { data: a } = await adminDb
      .from("analyses")
      .select(
        `
        id,
        status,
        created_at,
        compatibility_results (overall_score),
        analysis_people (name, person_role)
      `
      )
      .eq("owner_user_id", id)
      .order("created_at", { ascending: false });
    analyses = a ?? [];
  } catch {
    // Local dev fallback
  }

  if (!user && !profile) {
    // Dev placeholder if ID not in remote DB
    user = { id, email: "developer@example.com", created_at: new Date().toISOString() };
  }

  return (
    <main>
      <nav>
        <a className="logo" href="/">
          YUGMA <b>AI</b>
          <span className="tag">ADMIN</span>
        </a>
        <div className="nav-links">
          <a href="/admin/users">← All Users</a>
          <a href="/admin/analyses">Analyses</a>
          <a href="/admin">Dashboard</a>
        </div>
      </nav>

      <div className="hero" style={{ padding: "30px 0 20px" }}>
        <p className="eyebrow">USER INSPECTION</p>
        <h1 style={{ fontSize: "32px" }}>{profile?.name || user?.email || "User Detail"}</h1>
        <p className="lead" style={{ fontSize: "14px" }}>
          User ID: <code>{id}</code>
        </p>
      </div>

      <div className="form-grid">
        <div className="panel">
          <span className="step-label">PROFILE ATTRIBUTES</span>
          <h2>Personal Profile</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "14px", fontSize: "13px" }}>
            <div>
              <span style={{ color: "var(--text-dim)" }}>Email:</span> <b>{user?.email || "—"}</b>
            </div>
            <div>
              <span style={{ color: "var(--text-dim)" }}>Gender:</span> <b>{profile?.gender || "—"}</b>
            </div>
            <div>
              <span style={{ color: "var(--text-dim)" }}>Date of Birth:</span> <b>{profile?.dob || "—"}</b>
            </div>
            <div>
              <span style={{ color: "var(--text-dim)" }}>Current City:</span> <b>{profile?.city || "—"}</b>
            </div>
            <div>
              <span style={{ color: "var(--text-dim)" }}>Education:</span> <b>{profile?.education || "—"}</b>
            </div>
            <div>
              <span style={{ color: "var(--text-dim)" }}>Profession:</span> <b>{profile?.career || "—"}</b>
            </div>
            <div>
              <span style={{ color: "var(--text-dim)" }}>Relationship Goal:</span> <b>{profile?.relationship_goal || "—"}</b>
            </div>
            <div>
              <span style={{ color: "var(--text-dim)" }}>Future Vision:</span> <b>{profile?.future_goal || "—"}</b>
            </div>
          </div>
        </div>

        <div className="panel">
          <span className="step-label">ACTIVITY</span>
          <h2>Submitted Analyses ({analyses.length})</h2>
          {analyses.length === 0 ? (
            <p style={{ color: "var(--text-muted)", marginTop: "14px", fontSize: "13px" }}>
              No analyses submitted by this user.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "14px" }}>
              {analyses.map((item) => {
                const personA = (item.analysis_people || []).find((p: any) => p.person_role === "A");
                const personB = (item.analysis_people || []).find((p: any) => p.person_role === "B");
                const couple = personA && personB ? `${personA.name} & ${personB.name}` : "Couple";
                const score = Array.isArray(item.compatibility_results)
                  ? item.compatibility_results[0]?.overall_score
                  : item.compatibility_results?.overall_score;

                return (
                  <div
                    key={item.id}
                    style={{
                      background: "#080e1b",
                      border: "1px solid var(--border-subtle)",
                      borderRadius: "8px",
                      padding: "10px 14px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <p style={{ fontWeight: 600, fontSize: "13px" }}>{couple}</p>
                      <p style={{ fontSize: "11px", color: "var(--text-dim)" }}>
                        {new Date(item.created_at).toLocaleDateString()} · Score: {score ?? "—"}%
                      </p>
                    </div>
                    <a
                      href={`/admin/analyses/${item.id}`}
                      className="btn-secondary"
                      style={{ padding: "4px 8px", fontSize: "11px" }}
                    >
                      Inspect Analysis →
                    </a>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <footer>
        <div>© {new Date().getFullYear()} YUGMA AI · Authorized Administration</div>
      </footer>
    </main>
  );
}
