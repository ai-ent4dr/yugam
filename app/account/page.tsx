import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function AccountPage() {
  const user = await getCurrentUser().catch(() => null);
  if (!user) redirect("/login");

  let profile: any = null;
  let analysisCount = 0;

  try {
    const adminDb = createAdminClient();
    const { data: p } = await adminDb
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    profile = p;

    const { count } = await adminDb
      .from("analyses")
      .select("id", { count: "exact", head: true })
      .eq("owner_user_id", user.id);
    analysisCount = count ?? 0;
  } catch {
    // Local dev mode fallback
  }

  return (
    <main>
      <nav>
        <a className="logo" href="/">
          YUGMA <b>AI</b>
        </a>
        <div className="nav-links">
          <a href="/">New Reading</a>
          <a href="/history">History</a>
          <a href="/profile">Edit Profile</a>
          <a href="/data-controls">Data Controls</a>
        </div>
      </nav>

      <div className="hero" style={{ padding: "40px 0 20px" }}>
        <p className="eyebrow">YOUR ACCOUNT OVERVIEW</p>
        <h1 style={{ fontSize: "36px" }}>Account Dashboard</h1>
        <p className="lead" style={{ fontSize: "16px" }}>
          Manage your saved readings, security settings, and privacy preferences.
        </p>
      </div>

      <div className="form-grid">
        <div className="panel">
          <span className="step-label">IDENTITY</span>
          <h2>Account Details</h2>
          <div style={{ marginTop: "14px", display: "flex", flexDirection: "column", gap: "10px" }}>
            <div>
              <span style={{ fontSize: "12px", color: "var(--text-dim)" }}>Email Address</span>
              <p style={{ fontWeight: 600 }}>{user.email}</p>
            </div>
            <div>
              <span style={{ fontSize: "12px", color: "var(--text-dim)" }}>Display Name</span>
              <p style={{ fontWeight: 600 }}>{profile?.name || "Not set"}</p>
            </div>
            <div>
              <span style={{ fontSize: "12px", color: "var(--text-dim)" }}>Member Since</span>
              <p>{new Date(user.created_at).toLocaleDateString()}</p>
            </div>
            <div style={{ marginTop: "12px" }}>
              <a href="/profile" className="btn-secondary" style={{ fontSize: "13px" }}>
                Edit Profile Details →
              </a>
            </div>
          </div>
        </div>

        <div className="panel">
          <span className="step-label">ACTIVITY</span>
          <h2>Saved Analyses</h2>
          <div style={{ marginTop: "14px" }}>
            <p style={{ fontSize: "36px", fontWeight: 800, color: "var(--gold-primary)" }}>
              {analysisCount}
            </p>
            <p style={{ color: "var(--text-muted)", fontSize: "14px", marginTop: "4px" }}>
              Total couple compatibility analyses saved in your account.
            </p>
            <div style={{ marginTop: "18px" }}>
              <a href="/history" className="btn-primary" style={{ fontSize: "13px", padding: "10px 18px" }}>
                View Full Reading History →
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="panel" style={{ marginTop: "20px" }}>
        <span className="step-label">PRIVACY & PREFERENCES</span>
        <h2>Data Controls & Security</h2>
        <p style={{ color: "var(--text-muted)", fontSize: "14px", margin: "10px 0 16px" }}>
          Export your complete profile and readings as JSON, or permanently purge your uploaded photos, documents, and account.
        </p>
        <div style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}>
          <a href="/data-controls" className="btn-secondary">
            Manage Data Controls & Deletion →
          </a>
          <a href="/settings" className="btn-secondary">
            Account Settings →
          </a>
        </div>
      </div>

      <footer>
        <div>© {new Date().getFullYear()} YUGMA AI · Where two journeys meet.</div>
        <div className="footer-links">
          <a href="/privacy">Privacy</a>
          <a href="/terms">Terms</a>
          <a href="/consent">Consent Policy</a>
        </div>
      </footer>
    </main>
  );
}
