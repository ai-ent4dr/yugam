"use client";

import { useState } from "react";
import { createBrowserClient } from "@/lib/supabase/browser";

export default function SettingsPage() {
  const [newPassword, setNewPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const updatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setBusy(true);
    setMsg("");
    setError("");

    try {
      const client = createBrowserClient();
      const { error: err } = await client.auth.updateUser({ password: newPassword });
      if (err) throw err;
      setMsg("Password updated successfully.");
      setNewPassword("");
    } catch (e: any) {
      setError(e.message || "Failed to update password.");
    } finally {
      setBusy(false);
    }
  };

  const handleLogout = async () => {
    try {
      const client = createBrowserClient();
      await client.auth.signOut();
      location.assign("/");
    } catch {
      location.assign("/");
    }
  };

  return (
    <main>
      <nav>
        <a className="logo" href="/">
          YUGMA <b>AI</b>
        </a>
        <div className="nav-links">
          <a href="/account">Dashboard</a>
          <a href="/profile">Profile</a>
          <a href="/data-controls">Data Controls</a>
        </div>
      </nav>

      <div className="hero" style={{ padding: "40px 0 20px" }}>
        <p className="eyebrow">SETTINGS & PREFERENCES</p>
        <h1 style={{ fontSize: "36px" }}>Account Settings</h1>
        <p className="lead" style={{ fontSize: "16px" }}>
          Update your authentication security credentials and account status.
        </p>
      </div>

      <div className="panel" style={{ maxWidth: "600px" }}>
        <span className="step-label">SECURITY</span>
        <h2>Change Password</h2>
        <form onSubmit={updatePassword} style={{ marginTop: "16px" }}>
          <div className="form-group">
            <label>New Password</label>
            <input
              type="password"
              placeholder="Enter new strong password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>

          {msg && <p style={{ color: "#2ecc71", fontSize: "13px", marginTop: "10px" }}>{msg}</p>}
          {error && <p className="error-text">{error}</p>}

          <div style={{ marginTop: "18px" }}>
            <button type="submit" className="btn-primary" disabled={busy}>
              {busy ? "Updating…" : "Update Password"}
            </button>
          </div>
        </form>
      </div>

      <div className="panel" style={{ maxWidth: "600px", marginTop: "20px" }}>
        <span className="step-label">SESSION</span>
        <h2>Sign Out</h2>
        <p style={{ color: "var(--text-muted)", fontSize: "14px", margin: "10px 0 16px" }}>
          End your active session securely across this browser.
        </p>
        <button type="button" onClick={handleLogout} className="btn-secondary">
          Sign Out of Yugma AI
        </button>
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
