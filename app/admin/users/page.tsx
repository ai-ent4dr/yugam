import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function AdminUsersPage() {
  try {
    await requireAdmin();
  } catch {
    redirect("/login");
  }

  let users: any[] = [];

  try {
    const adminDb = createAdminClient();
    const { data: authData } = await adminDb.auth.admin.listUsers({ page: 1, perPage: 100 });
    const { data: profiles } = await adminDb.from("profiles").select("user_id, name, city, created_at");
    const { data: analyses } = await adminDb.from("analyses").select("owner_user_id");

    const profileMap = new Map((profiles ?? []).map((p) => [p.user_id, p]));
    const counts: Record<string, number> = {};
    for (const a of analyses ?? []) {
      if (a.owner_user_id) counts[a.owner_user_id] = (counts[a.owner_user_id] || 0) + 1;
    }

    users = (authData?.users ?? []).map((u) => {
      const p = profileMap.get(u.id);
      return {
        id: u.id,
        email: u.email,
        name: p?.name || "Not set",
        city: p?.city || "—",
        createdAt: u.created_at,
        analysisCount: counts[u.id] || 0,
        status: u.confirmed_at ? "active" : "unconfirmed",
      };
    });
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
          <a href="/admin/analyses">Analyses</a>
          <a href="/account">Account</a>
        </div>
      </nav>

      <div className="hero" style={{ padding: "30px 0 20px" }}>
        <p className="eyebrow">USER DIRECTORY</p>
        <h1 style={{ fontSize: "32px" }}>Registered Platform Users</h1>
        <p className="lead" style={{ fontSize: "15px" }}>
          Authorized administrative view of user profiles, authentication state, and analysis activity.
        </p>
      </div>

      <div className="panel">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>City</th>
              <th>Registered</th>
              <th>Analyses Run</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", color: "var(--text-muted)", padding: "30px" }}>
                  No registered users found in directory.
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id}>
                  <td style={{ fontWeight: 600 }}>{u.name}</td>
                  <td>{u.email}</td>
                  <td>{u.city}</td>
                  <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td style={{ textAlign: "center", fontWeight: 700, color: "var(--gold-primary)" }}>
                    {u.analysisCount}
                  </td>
                  <td>
                    <span
                      style={{
                        fontSize: "11px",
                        padding: "2px 8px",
                        borderRadius: "4px",
                        background: u.status === "active" ? "rgba(46, 204, 113, 0.15)" : "rgba(255, 255, 255, 0.1)",
                        color: u.status === "active" ? "#2ecc71" : "var(--text-muted)",
                      }}
                    >
                      {u.status}
                    </span>
                  </td>
                  <td>
                    <a
                      href={`/admin/users/${u.id}`}
                      className="btn-secondary"
                      style={{ padding: "4px 10px", fontSize: "11px" }}
                    >
                      Inspect →
                    </a>
                  </td>
                </tr>
              ))
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
